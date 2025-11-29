from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Category, Post, PostImage
from .services import ImageUploadService


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
    """Serializer for post images stored in S3/Cloudflare R2"""

    class Meta:
        model = PostImage
        fields = [
            "id",
            "image_url",
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
        post = self.context.get("post")
        if (
            post
            and PostImage.objects.filter(post=post, order=value)
            .exclude(pk=self.instance.pk if self.instance else None)
            .exists()
        ):
            raise serializers.ValidationError(
                "An image with this order already exists for this post."
            )
        return value


class AuthorSerializer(serializers.ModelSerializer):
    """Simple serializer for post author"""

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        read_only_fields = ["id", "username", "first_name", "last_name"]


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for post list (marketplace feed)"""

    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    total_value = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "slug",
            "author",
            "category",
            "images",
            "price",
            "quantity",
            "unit_of_measure",
            "total_value",
            "location_city",
            "location_state",
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
            "author",
            "view_count",
            "created_at",
            "published_at",
            "total_value",
            "is_available",
        ]


class PostDetailSerializer(serializers.ModelSerializer):
    """Complete serializer for posts (detail view)"""

    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    reviewed_by = AuthorSerializer(read_only=True)
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
            "author",
            "category",
            "price",
            "quantity",
            "unit_of_measure",
            "total_value",
            "location_city",
            "location_state",
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
            "author",
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
            Post.StatusChoices.APPROVED,
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
    """Serializer for creating and updating posts"""

    def to_internal_value(self, data):
        """Override to handle multipart form data"""

        return super().to_internal_value(data)

    class Meta:
        model = Post
        fields = [
            "title",
            "content",
            "category",
            "price",
            "quantity",
            "unit_of_measure",
            "location_city",
            "location_state",
            "visibility",
            "expires_at",
        ]

    def create(self, validated_data):
        """Create post with automatic image uploads"""
        request = self.context["request"]
        validated_data["author"] = request.user

        # Get images from request FILES directly
        images = request.FILES.getlist("images") or request.FILES.getlist("images[]")

        # Set initial status
        user = request.user
        if user.groups.filter(name="moderators").exists() or user.is_staff:
            validated_data["status"] = Post.StatusChoices.ACTIVE
        else:
            validated_data["status"] = Post.StatusChoices.PENDING_REVIEW

        # Create post first
        post = Post.objects.create(**validated_data)

        # Handle image uploads
        if images:
            try:
                service = ImageUploadService()
                results = service.upload_images(post, images)

                if results["success_count"] == 0 and results["failed_count"] > 0:
                    post.delete()
                    raise serializers.ValidationError(
                        {
                            "images": f"All image uploads failed: {results['failed_uploads'][0]['error']}"
                        }
                    )

            except Exception as e:
                post.delete()
                raise serializers.ValidationError(
                    {"images": f"Upload failed: {str(e)}"}
                )

        return post

    def to_representation(self, instance):
        """Include images and full category object in the response"""
        data = super().to_representation(instance)

        # Add images to response
        data["images"] = PostImageSerializer(instance.images.all(), many=True).data

        # Add full category object instead of just ID
        if instance.category:
            data["category"] = CategorySerializer(instance.category).data

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

        # If status changes, record who and when
        if "status" in validated_data and validated_data["status"] != instance.status:
            from django.utils import timezone

            instance.reviewed_by = user
            instance.reviewed_at = timezone.now()

        return super().update(instance, validated_data)
