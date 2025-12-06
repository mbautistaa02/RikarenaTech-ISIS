from django.apps import AppConfig


class PostsConfig(AppConfig):
    """
    Django app configuration for the posts application.
    This configuration class handles the initialization of the posts app,
    including setting up the S3/R2 client for file uploads when the
    application is ready.
    Attributes:
        default_auto_field (str): Specifies the default primary key field type
            for models in this app.
        name (str): The name of the Django application.
    Methods:
        ready(): Called when the Django app is ready. Initializes the S3/R2
            client and prints connection status.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "posts"

    def ready(self):
        """Ejecutar cuando la app esté lista"""
        # Initialize S3 client when starting the application
        from .services import s3_client

        # The singleton is automatically initialized when imported
        if s3_client.is_available:
            print(f"✅ S3/R2 client ready: {s3_client.bucket_name}")
        else:
            print("⚠️  S3/R2 client not configured - using mock uploads")
