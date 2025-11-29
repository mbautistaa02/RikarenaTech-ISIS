from django.db.models import F, QuerySet
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
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
    ViewSet for categories - Read only
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
    ViewSet for agricultural marketplace feed - Read only
    Allows filtering by location, price, category, etc.
    """

    serializer_class = PostListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content", "location_city", "location_state"]
    ordering_fields = ["created_at", "price", "quantity", "published_at"]
    ordering = ["-published_at", "-created_at"]

    # Type hint for request property to help Pylance
    request: Request

    def get_queryset(self) -> QuerySet[Post]:  # type: ignore
        """Only public and active posts with agricultural filtering"""
        queryset = (
            Post.objects.filter(
                status=Post.StatusChoices.ACTIVE,
                visibility=Post.VisibilityChoices.PUBLIC,
            )
            .select_related("user", "category")
            .prefetch_related("images")
        )

        # Agricultural marketplace filtering
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category_id=category)

        # Price range filtering
        min_price = self.request.query_params.get("min_price")
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = self.request.query_params.get("max_price")
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Location filtering
        city = self.request.query_params.get("city")
        if city:
            queryset = queryset.filter(location_city__icontains=city)

        state = self.request.query_params.get("state")
        if state:
            queryset = queryset.filter(location_state__icontains=state)

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
    ViewSet for authenticated user posts
    Allows full CRUD on own posts
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "updated_at", "published_at"]
    ordering = ["-created_at"]

    # Type hint for request property to help Pylance
    request: Request

    def get_queryset(self) -> QuerySet[Post]:  # type: ignore
        """Only authenticated user posts with manual filtering"""
        queryset = (
            Post.objects.filter(user=self.request.user)
            .select_related("category")
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

    def perform_create(self, serializer):
        """Create post assigning the current user"""
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Don't allow complete deletion, only change visibility
        """
        instance = self.get_object()
        instance.visibility = Post.VisibilityChoices.PRIVATE
        instance.save(update_fields=["visibility"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"])
    def toggle_visibility(self, request, pk=None):
        """
        Toggle post visibility between public and private
        """
        post = self.get_object()

        current_visibility = post.visibility
        if current_visibility == Post.VisibilityChoices.PUBLIC:
            post.visibility = Post.VisibilityChoices.PRIVATE
        else:
            post.visibility = Post.VisibilityChoices.PUBLIC

        post.save(update_fields=["visibility"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def mark_as_sold(self, request, pk=None):
        """
        Mark product as sold
        """
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
        """
        Pause product listing
        """
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


class PostModerationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for post moderation
    Only accessible by moderators and staff
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
            self.permission_denied(
                request, message="Only moderators can access this function"
            )

    def get_serializer_class(self):
        """Use moderation serializer for updates"""
        if self.action in ["update", "partial_update"]:
            return PostModerationSerializer
        return PostDetailSerializer

    @action(detail=True, methods=["patch"])
    def approve(self, request, pk=None):
        """
        Approve a post
        """
        post = self.get_object()
        post.status = Post.StatusChoices.APPROVED
        post.reviewed_by = request.user
        post.reviewed_at = timezone.now()
        post.save(update_fields=["status", "reviewed_by", "reviewed_at"])

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def reject(self, request, pk=None):
        """
        Reject a post
        """
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
        """
        Activate an approved product listing
        """
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
        """
        Get posts pending review
        """
        posts = self.get_queryset().filter(status=Post.StatusChoices.PENDING_REVIEW)

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
