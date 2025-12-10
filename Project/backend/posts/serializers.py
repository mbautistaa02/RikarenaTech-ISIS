from django.contrib.auth.models import User
from django.db import IntegrityError
from django.utils import timezone

from rest_framework import serializers

from users.models import Department, Municipality

from .models import Category, Post, PostImage


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories"""

    subcategories = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "slug",
            "is_active",
            "parent",
            "subcategories",
            "post_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "subcategories", "post_count"]

    def get_subcategories(self, obj):
        """Returns active subcategories"""
        if obj.subcategories.exists():
            return CategorySerializer(
                obj.subcategories.filter(is_active=True),
                many=True,
                context=self.context,
            ).data
        return []

    def get_post_count(self, obj):
        """Counts public and active posts in this category"""
        return obj.posts.filter(
            status=Post.StatusChoices.ACTIVE, visibility=Post.VisibilityChoices.PUBLIC
        ).count()


class PostImageSerializer(serializers.ModelSerializer):
    """Serializer for post images with automatic S3/R2 uploads"""

    class Meta:
        model = PostImage
        fields = [
            "id",
            "image",
            "alt_text",
            "caption",
            "order",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_order(self, value):
        """Validates that the order is unique per post"""
        if value < 0:
            raise serializers.ValidationError("Order must be a positive integer.")
        return value


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for departments"""

    class Meta:
        model = Department
        fields = ["id", "name"]
        read_only_fields = ["id", "name"]


class MunicipalitySerializer(serializers.ModelSerializer):
    """Serializer for municipalities with nested department"""

    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = Municipality
        fields = ["id", "name", "department"]
        read_only_fields = ["id", "name", "department"]


class UserSerializer(serializers.ModelSerializer):
    """Simple serializer for post owner"""

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        read_only_fields = ["id", "username", "first_name", "last_name"]
        ref_name = "PostsUserSerializer"


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for post list (marketplace feed)"""

    user = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    municipality = MunicipalitySerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    total_value = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "user",
            "category",
            "images",
            "price",
            "quantity",
            "unit_of_measure",
            "total_value",
            "municipality",
            "is_featured",
            "view_count",
            "created_at",
            "published_at",
            "expires_at",
            "status",
            "visibility",
            "is_available",
        ]
        read_only_fields = [
            "id",
            "slug",
            "user",
            "view_count",
            "created_at",
            "published_at",
            "total_value",
            "is_available",
        ]


class PostDetailSerializer(serializers.ModelSerializer):
    """Complete serializer for posts (detail view)"""

    user = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    municipality = MunicipalitySerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    reviewed_by = UserSerializer(read_only=True)
    total_value = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    is_sold = serializers.ReadOnlyField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "slug",
            "user",
            "category",
            "price",
            "quantity",
            "unit_of_measure",
            "total_value",
            "municipality",
            "status",
            "visibility",
            "is_featured",
            "view_count",
            "images",
            "created_at",
            "updated_at",
            "published_at",
            "expires_at",
            "reviewed_by",
            "reviewed_at",
            "review_notes",
            "is_available",
            "is_sold",
        ]
        read_only_fields = [
            "id",
            "slug",
            "user",
            "view_count",
            "created_at",
            "updated_at",
            "published_at",
            "reviewed_by",
            "reviewed_at",
            "total_value",
            "is_available",
            "is_sold",
        ]

    def validate_status(self, value):
        """Status validations based on user"""
        user = self.context["request"].user

        # Only moderators can change certain statuses
        moderator_only_statuses = [
            Post.StatusChoices.REJECTED,
        ]

        if (
            value in moderator_only_statuses
            and not user.groups.filter(name="moderators").exists()
            and not user.is_staff
        ):
            raise serializers.ValidationError("Only moderators can set this status.")

        return value


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts with automatic image handling"""

    MIN_EXPIRY_DAYS = 30

    class Meta:
        model = Post
        fields = [
            "title",
            "content",
            "category",
            "price",
            "quantity",
            "unit_of_measure",
            "municipality",
            "visibility",
            "expires_at",
        ]

    def create(self, validated_data):
        """Create post with automatic image uploads via django-storages"""
        from django.conf import settings

        request = self.context["request"]
        validated_data["user"] = request.user
        validated_data["expires_at"] = self._normalize_expiry(
            validated_data.get("expires_at")
        )

        # Get images from request FILES
        images = request.FILES.getlist("images") or request.FILES.getlist("images[]")

        # Validate image count
        if len(images) > settings.MAX_IMAGES_PER_POST:
            raise serializers.ValidationError(
                f"Too many images. Maximum {settings.MAX_IMAGES_PER_POST} allowed."
            )

        # Set initial status based on user permissions
        validated_data["status"] = Post.StatusChoices.ACTIVE

        # Create post
        post = Post.objects.create(**validated_data)

        # Create images - django-storages handles S3 upload automatically
        if images:
            for index, image_file in enumerate(images):
                PostImage.objects.create(post=post, image=image_file, order=index)

        return post

    def update(self, instance, validated_data):
        """Ensure minimum expiry on update as well"""
        if "expires_at" in validated_data:
            validated_data["expires_at"] = self._normalize_expiry(
                validated_data.get("expires_at")
            )
        try:
            return super().update(instance, validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                "No se pudo actualizar la publicación. Verifica las relaciones y vuelve a intentar."
            ) from exc

    def _normalize_expiry(self, expires_at):
        """Ensure expires_at is at least MIN_EXPIRY_DAYS days in the future."""
        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()
        min_expiry = now + timedelta(days=self.MIN_EXPIRY_DAYS)
        if expires_at is None or expires_at < min_expiry:
            return min_expiry
        return expires_at

    def to_representation(self, instance):
        """Include images, full category and municipality objects in the response"""
        data = super().to_representation(instance)

        # Add images to response
        data["images"] = PostImageSerializer(instance.images.all(), many=True).data

        # Add full category object instead of just ID
        if instance.category:
            data["category"] = CategorySerializer(instance.category).data

        # Add full municipality object with department instead of just ID
        if instance.municipality:
            data["municipality"] = MunicipalitySerializer(instance.municipality).data

        return data


class PostModerationSerializer(serializers.ModelSerializer):
    """Special serializer for post moderation"""

    class Meta:
        model = Post
        fields = ["id", "status", "visibility", "is_featured", "review_notes"]

    def update(self, instance, validated_data):
        """Update with moderation information"""
        user = self.context["request"].user

        # Check moderation permissions
        if not user.groups.filter(name="moderators").exists() and not user.is_staff:
            raise serializers.ValidationError(
                "You don't have permissions to moderate posts."
            )

        # If status changes, record who/when and ensure publish date when activating
        if "status" in validated_data and validated_data["status"] != instance.status:
            new_status = validated_data["status"]
            instance.reviewed_by = user
            instance.reviewed_at = timezone.now()
            if new_status == Post.StatusChoices.ACTIVE and not instance.published_at:
                instance.published_at = timezone.now()

        try:
            return super().update(instance, validated_data)
        except IntegrityError as exc:
            raise serializers.ValidationError(
                "No se pudo actualizar la publicación por una referencia inválida (usuario, municipio o categoría)."
            ) from exc
