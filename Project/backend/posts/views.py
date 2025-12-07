from decimal import Decimal, InvalidOperation

from django.db.models import F, Q, QuerySet
from django.utils import timezone

from rest_framework import filters, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Category, Post
from .serializers import (
    CategorySerializer,
    PostCreateUpdateSerializer,
    PostDetailSerializer,
    PostListSerializer,
    PostModerationSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for post categories.
    
    Supports:
    - Search by name or description
    - Filter main categories or subcategories
    - Lookup by slug
    """

    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

    # Type hint for request property to help Pylance
    request: Request

    def get_queryset(self) -> QuerySet[Category]:  # type: ignore
        """Filter main categories or subcategories"""
        queryset = super().get_queryset()

        # Filter to get only main categories
        if self.request.query_params.get("main_only"):
            queryset = queryset.filter(parent__isnull=True)

        # Filter to get subcategories of a specific category
        parent_id = self.request.query_params.get("parent")
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)

        return queryset.order_by("name")


class PostFeedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for the agricultural marketplace feed.
    
    Features:
    - Public access to active posts
    - Search by title, content, location
    - Filter by category, price range, location, unit
    - Order by date, price, quantity
    - View counter increment on detail view
    """

    serializer_class = PostListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "title",
        "content",
        "municipality__name",
        "municipality__department__name",
    ]
    ordering_fields = ["created_at", "price", "quantity", "published_at"]
    ordering = ["-published_at", "-created_at"]

    # Type hint for request property to help Pylance
    request: Request

    def _get_decimal_param(self, name: str) -> Decimal | None:
        """Parse decimal query params and validate them."""
        value = self.request.query_params.get(name)
        if value is None:
            return None
        try:
            decimal_value = Decimal(value)
            if decimal_value < 0:
                raise serializers.ValidationError({name: "Must be a positive number."})
            return decimal_value
        except (InvalidOperation, ValueError):
            raise serializers.ValidationError({name: "Must be a valid number."})

    def get_queryset(self) -> QuerySet[Post]:  # type: ignore
        """Only public and active posts with agricultural filtering"""
        now = timezone.now()
        queryset = (
            Post.objects.filter(
                status=Post.StatusChoices.ACTIVE,
                visibility=Post.VisibilityChoices.PUBLIC,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .select_related(
                "user", "category", "municipality", "municipality__department"
            )
            .prefetch_related("images")
        )

        # Agricultural marketplace filtering
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)

        # Price range filtering
        min_price = self._get_decimal_param("min_price")
        if min_price is not None:
            queryset = queryset.filter(price__gte=min_price)

        max_price = self._get_decimal_param("max_price")
        if max_price is not None:
            queryset = queryset.filter(price__lte=max_price)

        # Location filtering
        municipality = self.request.query_params.get("municipality")
        if municipality:
            queryset = queryset.filter(municipality_id=municipality)

        department = self.request.query_params.get("department")
        if department:
            queryset = queryset.filter(municipality__department_id=department)

        # Unit of measure filtering
        unit = self.request.query_params.get("unit")
        if unit:
            queryset = queryset.filter(unit_of_measure__icontains=unit)

        is_featured = self.request.query_params.get("is_featured")
        if is_featured and is_featured.lower() == "true":
            queryset = queryset.filter(is_featured=True)

        return queryset

    def get_serializer_class(self):  # type: ignore
        """Use detailed serializer for retrieve"""
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer

    def retrieve(self, request, *args, **kwargs):
        """Increment view counter when viewing a post"""
        instance = self.get_object()
        Post.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class UserPostViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for authenticated user's posts.
    
    Features:
    - Users can only manage their own posts
    - Full CRUD operations (Create, Read, Update, Delete)
    - Filter by status, visibility, category
    - Automatic image upload via django-storages
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "updated_at", "published_at"]
    ordering = ["-created_at"]

    # Type hint for request property to help Pylance
    request: Request

    def get_queryset(self) -> QuerySet[Post]:  # type: ignore
        """Return posts belonging to the authenticated user."""
        if getattr(self, "swagger_fake_view", False):
            return Post.objects.none()
            
        # Ensure user is authenticated
        if not self.request.user.is_authenticated:
            return Post.objects.none()
        queryset = (
            Post.objects.filter(user=self.request.user)
            .select_related("category", "municipality", "municipality__department")
            .prefetch_related("images")
        )

        # Manual filtering by parameters
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        visibility_filter = self.request.query_params.get("visibility")
        if visibility_filter:
            queryset = queryset.filter(visibility=visibility_filter)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)

        return queryset

    def get_serializer_class(self):  # type: ignore
        """Different serializers based on action"""
        if self.action in ["create", "update", "partial_update"]:
            return PostCreateUpdateSerializer
        elif self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer



    def destroy(self, request, *args, **kwargs):
        """Soft delete by setting visibility to private instead of actual deletion."""
        instance = self.get_object()
        instance.visibility = Post.VisibilityChoices.PRIVATE
        instance.save(update_fields=["visibility"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"])
    def toggle_visibility(self, request, pk=None):
        """Toggle post visibility between public and private."""
        post = self.get_object()

        if post.visibility == Post.VisibilityChoices.PUBLIC:
            post.visibility = Post.VisibilityChoices.PRIVATE
        else:
            post.visibility = Post.VisibilityChoices.PUBLIC

        post.save(update_fields=["visibility"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def mark_as_sold(self, request, pk=None):
        """Mark an active product as sold."""
        post = self.get_object()

        if post.status != Post.StatusChoices.ACTIVE:
            return Response(
                {"error": "Only active products can be marked as sold"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        post.status = Post.StatusChoices.SOLD
        post.save(update_fields=["status"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def pause_listing(self, request, pk=None):
        """Pause/unpause an active product listing."""
        post = self.get_object()

        if post.status not in [Post.StatusChoices.ACTIVE, Post.StatusChoices.PAUSED]:
            return Response(
                {"error": "Can only pause/unpause active listings"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if post.status == Post.StatusChoices.ACTIVE:
            post.status = Post.StatusChoices.PAUSED
        else:
            post.status = Post.StatusChoices.ACTIVE

        post.save(update_fields=["status"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)


class PostModerationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for post moderation - restricted to moderators and staff.
    
    Features:
    - Read and update posts (no creation/deletion)
    - Approve/reject posts with review notes
    - Activate approved posts
    - Track reviewer information automatically
    - Access control for moderators only
    """

    queryset = (
        Post.objects.all()
        .select_related("user", "category", "reviewed_by")
        .prefetch_related("images")
    )
    serializer_class = PostDetailSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """
        Only moderators and staff can access
        """
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def check_permissions(self, request):
        """
        Verify that user is moderator or staff
        """
        super().check_permissions(request)

        if not (
            request.user.groups.filter(name="moderators").exists()
            or request.user.is_staff
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only moderators can access this function.")

    def get_serializer_class(self):
        """Use moderation serializer for updates"""
        if self.action in ["update", "partial_update"]:
            return PostModerationSerializer
        return PostDetailSerializer

    def update(self, request, *args, **kwargs):
        """Allow moderators to update posts"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Allow moderators to partially update posts"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)



    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        """Approve a pending post for publication."""
        post = self.get_object()
        post.status = Post.StatusChoices.APPROVED
        post.reviewed_by = request.user
        post.reviewed_at = timezone.now()
        post.save(update_fields=["status", "reviewed_by", "reviewed_at"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def reject(self, request, pk=None):
        """Reject a post with optional review notes."""
        post = self.get_object()
        review_notes = request.data.get("review_notes", "")

        post.status = Post.StatusChoices.REJECTED
        post.review_notes = review_notes
        post.reviewed_by = request.user
        post.reviewed_at = timezone.now()
        post.save(
            update_fields=["status", "review_notes", "reviewed_by", "reviewed_at"]
        )

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        """Activate an approved post for public viewing."""
        post = self.get_object()

        if post.status != Post.StatusChoices.APPROVED:
            return Response(
                {"error": "Only approved products can be activated"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        post.status = Post.StatusChoices.ACTIVE
        if not post.published_at:
            post.published_at = timezone.now()
        post.save(update_fields=["status", "published_at"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending_review(self, request):
        """Get all posts pending moderation review."""
        posts = self.get_queryset().filter(status=Post.StatusChoices.PENDING_REVIEW)

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
