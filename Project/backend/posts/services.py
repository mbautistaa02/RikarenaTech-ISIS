import logging
import os
import uuid
from typing import Any, Dict, List, Tuple

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile


from .models import Post, PostImage

# Runtime imports with fallbacks
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError

    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    # Define fallback classes when boto3 is not available
    ClientError = type("ClientError", (Exception,), {})  # type: ignore
    NoCredentialsError = type("NoCredentialsError", (Exception,), {})  # type: ignore

logger = logging.getLogger(__name__)


class S3ClientSingleton:
    """Singleton para cliente S3/R2 configurado al inicio de la app"""

    _instance = None
    _client = None
    _bucket_name = None
    _endpoint_url = None
    _custom_domain = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        """Inicializar cliente S3/R2 con configuración desde settings"""
        if not BOTO3_AVAILABLE:
            logger.warning("boto3 not available. S3 uploads will be mocked.")
            return

        self._bucket_name = getattr(settings, "AWS_STORAGE_BUCKET_NAME", None)
        self._endpoint_url = getattr(settings, "AWS_S3_ENDPOINT_URL", None)
        self._custom_domain = getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None)

        if not self._bucket_name:
            logger.warning(
                "AWS_STORAGE_BUCKET_NAME not configured. " "S3 uploads will be mocked."
            )
            return

        try:
            # Configurar cliente boto3
            session = boto3.Session(  # type: ignore
                aws_access_key_id=getattr(settings, "AWS_ACCESS_KEY_ID", None),
                aws_secret_access_key=getattr(settings, "AWS_SECRET_ACCESS_KEY", None),
                region_name=getattr(settings, "AWS_S3_REGION_NAME", "auto"),
            )

            # Crear cliente S3 (funciona tanto para S3 como para R2)
            client_config = {}
            if self._endpoint_url:
                client_config["endpoint_url"] = self._endpoint_url

            self._client = session.client("s3", **client_config)

            # Verificar conectividad
            self._client.head_bucket(Bucket=self._bucket_name)
            logger.info(
                f"S3 client initialized successfully. " f"Bucket: {self._bucket_name}"
            )

        except (ClientError, NoCredentialsError) as e:
            logger.error(f"Failed to initialize S3 client: {e}")
            self._client = None
        except Exception as e:
            logger.error(f"Unexpected error initializing S3 client: {e}")
            self._client = None

    @property
    def client(self):
        return self._client

    @property
    def bucket_name(self):
        return self._bucket_name

    @property
    def is_available(self):
        return self._client is not None

    def get_public_url(self, key: str) -> str:
        """Generar URL pública para un objeto S3/R2"""
        # 1. Prioridad: dominio personalizado configurado
        if self._custom_domain:
            return f"https://{self._custom_domain}/{key}"

        # 2. Usar configuración específica de public URL si existe
        public_url_base = getattr(settings, "AWS_S3_PUBLIC_URL_BASE", None)
        if public_url_base:
            return f"{public_url_base.rstrip('/')}/{key}"

        # 3. Auto-detectar según el endpoint
        if self._endpoint_url:
            if "r2.cloudflarestorage.com" in self._endpoint_url:
                # Cloudflare R2: extraer account ID del endpoint
                account_id = self._endpoint_url.split("//")[1].split(".")[0]
                return f"https://pub-{account_id}.r2.dev/{key}"
            else:
                # Otro S3-compatible, usar el endpoint tal como está
                return f"{self._endpoint_url.rstrip('/')}/{self._bucket_name}/{key}"

        # 4. Fallback: AWS S3 estándar
        region = getattr(settings, "AWS_S3_REGION_NAME", "us-east-1")
        return f"https://{self._bucket_name}.s3.{region}.amazonaws.com/{key}"


# Instancia global del cliente S3
s3_client = S3ClientSingleton()


class ImageUploadService:
    """Service to handle automatic image uploads to S3/Cloudflare R2"""

    def __init__(self):
        # Usar el cliente S3 singleton configurado globalmente
        self.s3_client = s3_client

    def upload_images(
        self, post: Post, image_files: List[UploadedFile]
    ) -> Dict[str, Any]:
        """Upload multiple images for a post, handling failures gracefully"""
        logger.info(f"Starting upload of {len(image_files)} images for post {post.id}")

        results = {
            "success_count": 0,
            "failed_count": 0,
            "uploaded_images": [],
            "failed_uploads": [],
            "total_attempted": len(image_files),
        }

        if len(image_files) > settings.MAX_IMAGES_PER_POST:
            raise ValueError(
                f"Too many images. Maximum {settings.MAX_IMAGES_PER_POST} allowed."
            )

        for index, image_file in enumerate(image_files):
            try:
                logger.info(
                    f"Processing image {index + 1}: {image_file.name}, size: {image_file.size}"
                )

                self._validate_image_file(image_file)
                image_url, _ = self._upload_to_s3(image_file, post.id)

                logger.info(f"Successfully uploaded to: {image_url}")

                # Use the loop index as order to avoid conflicts
                next_order = index

                post_image = PostImage.objects.create(
                    post=post,
                    image_url=image_url,
                    order=next_order,
                )

                logger.info(f"Created PostImage with ID: {post_image.id}")

                results["success_count"] += 1
                results["uploaded_images"].append(
                    {"id": post_image.id, "url": image_url, "order": next_order}
                )

            except Exception as e:
                error_msg = str(e)
                logger.error(
                    f"Failed to upload {getattr(image_file, 'name', 'unknown')}: {error_msg}"
                )

                results["failed_count"] += 1
                results["failed_uploads"].append(
                    {
                        "filename": getattr(image_file, "name", f"image_{index}"),
                        "error": error_msg,
                    }
                )

        logger.info(
            f"Upload completed: {results['success_count']} success, {results['failed_count']} failed"
        )
        return results

    def _validate_image_file(self, image_file: UploadedFile) -> None:
        """Validate image file format and size"""
        # Check file size
        if image_file.size > settings.MAX_IMAGE_SIZE:
            max_size_mb = settings.MAX_IMAGE_SIZE / (1024 * 1024)
            raise ValueError(f"File too large. Maximum size: {max_size_mb:.1f}MB")

        # Check content type
        if image_file.content_type not in settings.SUPPORTED_IMAGE_FORMATS:
            supported = ", ".join(settings.SUPPORTED_IMAGE_FORMATS)
            raise ValueError(f"Unsupported format. Supported: {supported}")

    def _upload_to_s3(self, image_file: UploadedFile, post_id: int) -> Tuple[str, str]:
        """Upload file to S3/Cloudflare R2 and return URL"""
        # Generate unique key
        file_extension = os.path.splitext(image_file.name)[1].lower()
        unique_filename = f"posts/{post_id}/{uuid.uuid4()}{file_extension}"

        logger.info(f"Uploading {image_file.name} as {unique_filename}")
        logger.info(f"S3 client available: {self.s3_client.is_available}")

        try:
            if not self.s3_client.is_available:
                raise Exception(
                    "S3 client not available. Check AWS credentials and configuration."
                )

            # Upload a S3/R2 usando boto3
            image_file.seek(0)  # Reset file pointer

            logger.info(f"Uploading to bucket: {self.s3_client.bucket_name}")

            # Configurar metadatos
            extra_args = {
                "ContentType": image_file.content_type or "image/jpeg",
                "ACL": "public-read",
                "CacheControl": "max-age=86400",  # 24 horas
            }

            logger.info(f"Upload args: {extra_args}")

            # Subir archivo
            self.s3_client.client.upload_fileobj(  # type: ignore
                image_file,
                self.s3_client.bucket_name,
                unique_filename,
                ExtraArgs=extra_args,
            )

            # Generar URL pública usando custom domain, R2 o AWS S3
            image_url = self.s3_client.get_public_url(unique_filename)
            logger.info(f"Upload successful, public URL: {image_url}")

            return image_url, unique_filename

        except Exception as e:
            logger.error(f"S3 upload error: {str(e)}")
            raise Exception(f"S3 upload failed: {str(e)}")

    def delete_image(self, post_image: PostImage) -> bool:
        """Delete image from database (S3 cleanup removed for simplicity)"""
        try:
            post_image.delete()
            return True
        except Exception as e:
            logger.error(f"Failed to delete image: {str(e)}")
            return False
