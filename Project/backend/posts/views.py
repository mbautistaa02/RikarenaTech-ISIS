from decimal import Decimal, InvalidOperation

from django.db.models import F, Q, QuerySet
from django.utils import timezone

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
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


@swagger_auto_schema(tags=["Posts - Categories"])
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for post categories.

    Supports:
    - Search by name or description
    - Filter main categories or subcategories
    - Lookup by slug
    """

    swagger_tags = ["Posts - Categories"]
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description"]

    # Type hint for request property to help Pylance
    request: Request

    @swagger_auto_schema(
        operation_summary="List active categories",
        operation_description=(
            "Returns active categories. Supports search by name/description, filtering only root "
            "categories via `main_only=true`, or children of a parent with `parent=<id>`."
        ),
        tags=["Posts - Categories"],
        manual_parameters=[
            openapi.Parameter(
                "main_only",
                openapi.IN_QUERY,
                description="When true, only root categories (no parent) are returned.",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "parent",
                openapi.IN_QUERY,
                description="Filter subcategories that belong to this parent category id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "search",
                openapi.IN_QUERY,
                description="Search by name or description.",
                type=openapi.TYPE_STRING,
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Get category detail",
        operation_description="Retrieves category detail using `slug` as lookup.",
        tags=["Posts - Categories"],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

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


@swagger_auto_schema(tags=["Posts - Marketplace"])
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

    swagger_tags = ["Posts - Marketplace"]
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

    @swagger_auto_schema(
        operation_summary="List public posts",
        operation_description=(
            "Public marketplace feed. Supports search by title/content/location and filters by "
            "category, price range, municipality, department, unit of measure and `is_featured`. "
            "Ordering is available by date, price or quantity."
        ),
        tags=["Posts - Marketplace"],
        manual_parameters=[
            openapi.Parameter(
                "category",
                openapi.IN_QUERY,
                description="Filter by category id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "min_price",
                openapi.IN_QUERY,
                description="Minimum price (decimal).",
                type=openapi.TYPE_NUMBER,
                format=openapi.FORMAT_DECIMAL,
            ),
            openapi.Parameter(
                "max_price",
                openapi.IN_QUERY,
                description="Maximum price (decimal).",
                type=openapi.TYPE_NUMBER,
                format=openapi.FORMAT_DECIMAL,
            ),
            openapi.Parameter(
                "municipality",
                openapi.IN_QUERY,
                description="Filter by municipality id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "department",
                openapi.IN_QUERY,
                description="Filter by department id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "unit",
                openapi.IN_QUERY,
                description="Filter by unit of measure (substring match).",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "is_featured",
                openapi.IN_QUERY,
                description="When true, only featured posts are returned.",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                "search",
                openapi.IN_QUERY,
                description="Search by title, content or location.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order by fields: created_at, price, quantity, published_at. Use '-' for desc.",
                type=openapi.TYPE_STRING,
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

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
            category_ids = self._get_category_and_descendants(category)
            if category_ids:
                queryset = queryset.filter(category_id__in=category_ids)
            else:
                queryset = queryset.none()

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

    def _get_category_and_descendants(self, category_id: str | int):
        """Return a list of category ids including all active descendants"""
        try:
            cid = int(category_id)
        except (TypeError, ValueError):
            return []

        ids = []
        to_visit = [cid]
        while to_visit:
            current = to_visit.pop()
            ids.append(current)
            children = Category.objects.filter(
                parent_id=current, is_active=True
            ).values_list("id", flat=True)
            to_visit.extend(list(children))
        return ids

    def get_serializer_class(self):  # type: ignore
        """Use detailed serializer for retrieve"""
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer

    @swagger_auto_schema(
        operation_summary="Retrieve public post",
        operation_description=(
            "Returns public post detail and increments the view counter."
        ),
        tags=["Posts - Marketplace"],
    )
    def retrieve(self, request, *args, **kwargs):
        """Increment view counter when viewing a post"""
        instance = self.get_object()
        Post.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@swagger_auto_schema(tags=["Posts - My Listings"])
class UserPostViewSet(viewsets.ModelViewSet):
    """
    Full CRUD ViewSet for authenticated user's posts.

    Features:
    - Users can only manage their own posts
    - Full CRUD operations (Create, Read, Update, Delete)
    - Filter by status, visibility, category
    - Automatic image upload via django-storages
    """

    swagger_tags = ["Posts - My Listings"]
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "updated_at", "published_at"]
    ordering = ["-created_at"]

    # Type hint for request property to help Pylance
    request: Request

    @swagger_auto_schema(
        operation_summary="List my posts",
        operation_description=(
            "Returns only posts that belong to the authenticated user. "
            "Supports filters by `status`, `visibility`, `category` and ordering."
        ),
        tags=["Posts - My Listings"],
        manual_parameters=[
            openapi.Parameter(
                "status",
                openapi.IN_QUERY,
                description="Filter by status (pending_review, approved, rejected, active, sold, paused, expired).",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "visibility",
                openapi.IN_QUERY,
                description="Filter by visibility (public, private, unlisted).",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "category",
                openapi.IN_QUERY,
                description="Filter by category id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order by created_at, updated_at or published_at (prefix with '-' for desc).",
                type=openapi.TYPE_STRING,
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Create post",
        operation_description=(
            "Creates a post for the authenticated user. Writable fields: "
            "`title`, `content`, `category`, `price`, `quantity`, `unit_of_measure`, "
            "`municipality`, `visibility`, `expires_at`. Images are handled automatically "
            "via django-storages using `images` or `images[]` in multipart form-data."
        ),
        tags=["Posts - My Listings"],
        request_body=PostCreateUpdateSerializer,
        responses={201: PostDetailSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Retrieve my post",
        operation_description="Returns the detail of a post that belongs to the authenticated user.",
        tags=["Posts - My Listings"],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Update post",
        operation_description=(
            "Full update of a user post. Replaces all writable fields: `title`, `content`, "
            "`category`, `price`, `quantity`, `unit_of_measure`, `municipality`, `visibility`, "
            "`expires_at`."
        ),
        tags=["Posts - My Listings"],
        request_body=PostCreateUpdateSerializer,
        responses={200: PostDetailSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Partial update post",
        operation_description=(
            "Partial update of a user post. Only provided fields are modified. "
            "Accepted fields: `title`, `content`, `category`, `price`, `quantity`, "
            "`unit_of_measure`, `municipality`, `visibility`, `expires_at`."
        ),
        tags=["Posts - My Listings"],
        request_body=PostCreateUpdateSerializer,
        responses={200: PostDetailSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

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

    @swagger_auto_schema(
        operation_summary="Delete post (soft delete)",
        operation_description=(
            "Soft-delete: sets visibility to private instead of removing the record."
        ),
        tags=["Posts - My Listings"],
        responses={204: "Deleted"},
    )
    def destroy(self, request, *args, **kwargs):
        """Soft delete by setting visibility to private instead of actual deletion."""
        instance = self.get_object()
        instance.visibility = Post.VisibilityChoices.PRIVATE
        instance.save(update_fields=["visibility"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        methods=["patch"],
        operation_summary="Toggle visibility",
        operation_description="Switches the post visibility between public and private.",
        tags=["Posts - My Listings"],
        request_body=None,
    )
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

    @swagger_auto_schema(
        methods=["patch"],
        operation_summary="Mark as sold",
        operation_description="Marks an active product as sold. Only allowed when status is ACTIVE.",
        tags=["Posts - My Listings"],
        request_body=None,
    )
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

    @swagger_auto_schema(
        methods=["patch"],
        operation_summary="Pause or resume listing",
        operation_description="Pauses or reactivates a listing. Only works when status is ACTIVE or PAUSED.",
        tags=["Posts - My Listings"],
        request_body=None,
    )
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


@swagger_auto_schema(tags=["Posts - Moderation"])
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

    @swagger_auto_schema(
        operation_summary="List posts for moderation",
        operation_description="Lists posts available to moderators, ordered by date.",
        tags=["Posts - Moderation"],
        manual_parameters=[
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order by created_at or updated_at (prefix with '-' for desc).",
                type=openapi.TYPE_STRING,
            )
        ],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Retrieve post for moderation",
        operation_description="Returns the detail of a post for moderator review.",
        tags=["Posts - Moderation"],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

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

    def perform_update(self, serializer):
        """Persist updates and set reviewer metadata"""
        serializer.save(reviewed_by=self.request.user, reviewed_at=timezone.now())

    @swagger_auto_schema(
        operation_summary="Update post in moderation",
        operation_description=(
            "Allows moderators to edit fields during review. Writable fields: "
            "`status`, `visibility`, `is_featured`, `review_notes`."
        ),
        tags=["Posts - Moderation"],
        request_body=PostModerationSerializer,
        responses={200: PostDetailSerializer},
    )
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

    @swagger_auto_schema(
        operation_summary="Partial update in moderation",
        operation_description=(
            "Partially updates a post and logs the reviewing moderator. "
            "Accepted fields: `status`, `visibility`, `is_featured`, `review_notes`."
        ),
        tags=["Posts - Moderation"],
        request_body=PostModerationSerializer,
        responses={200: PostDetailSerializer},
    )
    def partial_update(self, request, *args, **kwargs):
        """Allow moderators to partially update posts"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    @swagger_auto_schema(
        methods=["patch"],
        operation_summary="Approve post",
        operation_description="Marks a post as approved and records the reviewer.",
        tags=["Posts - Moderation"],
        request_body=None,
    )
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

    @swagger_auto_schema(
        methods=["patch"],
        operation_summary="Reject post",
        operation_description="Rejects a post. You can include `review_notes` in the payload.",
        tags=["Posts - Moderation"],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "review_notes": openapi.Schema(
                    type=openapi.TYPE_STRING, description="Optional review notes."
                )
            },
        ),
    )
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

    @swagger_auto_schema(
        methods=["patch"],
        operation_summary="Activate approved post",
        operation_description="Activates an approved post and sets `published_at` if it was missing.",
        tags=["Posts - Moderation"],
        request_body=None,
    )
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

    @swagger_auto_schema(
        methods=["get"],
        operation_summary="Pending review",
        operation_description="Returns all posts with status `PENDING_REVIEW`.",
        tags=["Posts - Moderation"],
        request_body=None,
    )
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
