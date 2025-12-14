"""
Users API Views

This module provides comprehensive user and seller management endpoints:

SELLER ENDPOINTS (SellerUserViewSet):
- GET /api/users/sellers/ - List all sellers with advanced filtering
- GET /api/users/sellers/{username}/ - Get specific seller details
- GET /api/users/sellers/{username}/posts/ - Get seller's posts with filtering

USER MANAGEMENT ENDPOINTS:
- GET /api/users/me/ - Get complete authenticated user profile with groups
- GET /api/users/all/ - List all users (moderators only)
- GET /api/users/{username}/ - Get any user's details
- PATCH /api/users/{username}/profile/ - Update own profile

All endpoints require authentication. Sellers are users with at least one active post.
Supports extensive filtering, searching, and pagination for optimal performance.
"""

from django.contrib.auth.models import User
from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from posts.models import Post
from posts.serializers import PostListSerializer

from .models import Department, Profile
from .serializers import (
    CurrentUserSerializer,
    DepartmentWithMunicipalitiesSerializer,
    ProfileSerializer,
    SellerUserSerializer,
    UserSerializer,
)


class UserApiView(APIView):
    """Get all active users with their profiles"""

    permission_classes = [IsAuthenticated]

    def check_permissions(self, request):
        """
        Check if the user has permission to access this view.
        Only users in the 'moderators' group.
        """

        super().check_permissions(request)

        if not (
            request.user.groups.filter(name="moderators").exists()
            or request.user.is_staff
        ):
            self.permission_denied(
                request,
                message="You do not have permission to access this resource.",
            )

    @swagger_auto_schema(
        operation_summary="List all active users",
        operation_description="Lists active users with profile included. Requires moderator/staff.",
        tags=["Users"],
        responses={200: UserSerializer(many=True)},
    )
    def get(self, request):
        """Return all active users with their profiles."""
        users = User.objects.filter(is_active=True).select_related("profile")
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurrentUserApiView(APIView):
    """Get complete profile for the authenticated user"""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Get my profile",
        operation_description="Returns the complete profile for the authenticated user, including groups and location.",
        tags=["Users"],
        responses={200: CurrentUserSerializer},
    )
    def get(self, request):
        user = request.user
        serializer = CurrentUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailApiView(APIView):
    """Get detailed user information by username"""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Get user by username",
        operation_description="Returns user details (including profile) for an active user by username.",
        tags=["Users"],
        manual_parameters=[
            openapi.Parameter(
                "username",
                openapi.IN_PATH,
                description="Username of the user to retrieve.",
                type=openapi.TYPE_STRING,
            )
        ],
        responses={200: UserSerializer},
    )
    def get(self, request, username):
        user = get_object_or_404(User, username=username, is_active=True)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileDetailApiView(APIView):
    """Update user profile information"""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Update my profile",
        operation_description=(
            "Allows a user to update their own profile. Only these fields are allowed: "
            "`cellphone_number`, `municipality`, `first_name`, `last_name`, "
            "`picture_url`, `username`, `bio`."
        ),
        tags=["Users"],
        manual_parameters=[
            openapi.Parameter(
                "username",
                openapi.IN_PATH,
                description="Must match the authenticated user's username.",
                type=openapi.TYPE_STRING,
            )
        ],
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "cellphone_number": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Phone number",
                ),
                "municipality": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="Municipality id",
                ),
                "first_name": openapi.Schema(type=openapi.TYPE_STRING),
                "last_name": openapi.Schema(type=openapi.TYPE_STRING),
                "picture_url": openapi.Schema(
                    type=openapi.TYPE_STRING, format=openapi.FORMAT_URI
                ),
                "username": openapi.Schema(type=openapi.TYPE_STRING),
                "bio": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="User bio or description",
                ),
            },
            additional_properties=False,
        ),
        responses={200: UserSerializer},
    )
    def patch(self, request, username):

        user = get_object_or_404(User, username=username, is_active=True)

        # Ensure the user is updating their own profile
        if request.user.username != username:
            return Response(
                {"detail": "You do not have permission to update this profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Allowed fields for update
        allowed_fields = {
            "cellphone_number",
            "municipality",
            "first_name",
            "last_name",
            "picture_url",
            "username",
            "bio",
        }

        if not set(request.data.keys()).issubset(allowed_fields):
            return Response(
                {
                    "detail": "You can only modify: cellphone_number, municipality, first_name, last_name, picture_url, username, bio"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = get_object_or_404(Profile, user__username=username)

        profile_fields = {}
        user_fields = {}

        for key, value in request.data.items():
            if key in ["cellphone_number", "municipality", "bio"]:
                profile_fields[key] = value
            else:
                user_fields[key] = value

        # update PROFILE fields
        if profile_fields:
            profile_serializer = ProfileSerializer(
                profile, data=profile_fields, partial=True
            )
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                return Response(
                    profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

        # update USER fields
        if user_fields:
            user_serializer = UserSerializer(user, data=user_fields, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                return Response(
                    user_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

        # Refresh user to get updated data
        user.refresh_from_db()
        user.profile.refresh_from_db()

        # Devuelve el usuario completo actualizado con grupos
        full_user_serializer = CurrentUserSerializer(user)
        return Response(full_user_serializer.data, status=status.HTTP_200_OK)


class SellerUserViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only directory for users who are sellers (have public active posts)"""

    swagger_tags = ["Users - Sellers"]
    serializer_class = SellerUserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "username"  # Use username instead of id
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "posts__municipality__name",
        "posts__municipality__department__name",
    ]
    ordering_fields = ["active_posts_count", "latest_post_date", "username"]
    ordering = ["-latest_post_date"]

    def get_queryset(self):  # type: ignore
        """
        Return users who have al menos un post público (activo, vendido o expirado) con estadísticas
        """
        # Add swagger detection to prevent schema generation errors
        if getattr(self, "swagger_fake_view", False):
            return User.objects.none()

        # Incluimos ACTIVE, SOLD y EXPIRED (se excluyen rechazados y privados)
        valid_statuses = [
            Post.StatusChoices.ACTIVE,
            Post.StatusChoices.SOLD,
            Post.StatusChoices.EXPIRED,
        ]

        queryset = (
            User.objects.filter(
                is_active=True,
                posts__status__in=valid_statuses,
                posts__visibility=Post.VisibilityChoices.PUBLIC,
            )
            .select_related(
                "profile", "profile__municipality", "profile__municipality__department"
            )
            .annotate(
                active_posts_count=Count(
                    "posts",
                    filter=Q(
                        posts__status__in=valid_statuses,
                        posts__visibility=Post.VisibilityChoices.PUBLIC,
                    ),
                ),
                total_posts_count=Count("posts"),
                latest_post_date=Max(
                    "posts__published_at",
                    filter=Q(
                        posts__status__in=valid_statuses,
                        posts__visibility=Post.VisibilityChoices.PUBLIC,
                    ),
                ),
            )
            .filter(active_posts_count__gt=0)
            .distinct()
        )

        # Additional filtering by query parameters

        # Filter by username (exact or partial match)
        username = self.request.query_params.get("username")
        if username:
            queryset = queryset.filter(username__icontains=username)

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(posts__category_id=category)

        # Filter by name (searches in username, first_name, and last_name)
        name = self.request.query_params.get("name")
        if name:
            queryset = queryset.filter(
                Q(username__icontains=name)
                | Q(first_name__icontains=name)
                | Q(last_name__icontains=name)
            )

        # Filter by municipality
        municipality = self.request.query_params.get("municipality")
        if municipality:
            queryset = queryset.filter(
                Q(profile__municipality__name__icontains=municipality)
                | Q(profile__municipality__id=municipality)
            )

        # Filter by department
        department = self.request.query_params.get("department")
        if department:
            queryset = queryset.filter(
                Q(profile__municipality__department__name__icontains=department)
                | Q(profile__municipality__department__id=department)
            )

        # Filter by minimum posts count
        min_posts = self.request.query_params.get("min_posts")
        if min_posts:
            try:
                min_posts_int = int(min_posts)
                queryset = queryset.filter(active_posts_count__gte=min_posts_int)
            except ValueError:
                pass

        return queryset

    @swagger_auto_schema(
        operation_summary="List seller users",
        operation_description=(
            "Lists users with al menos un post público (activo, vendido o expirado). "
            "Soporta filtros por username, name, category, municipality, department, min_posts "
            "y búsqueda de texto. Ordenable por active_posts_count, latest_post_date, username."
        ),
        tags=["Users - Sellers"],
        manual_parameters=[
            openapi.Parameter(
                "search",
                openapi.IN_QUERY,
                description="Text search across username, first_name, last_name, municipality, department.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "username",
                openapi.IN_QUERY,
                description="Filter by username (partial match).",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "name",
                openapi.IN_QUERY,
                description="Filter by username, first_name or last_name (partial match).",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "category",
                openapi.IN_QUERY,
                description="Filter by post category id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "municipality",
                openapi.IN_QUERY,
                description="Filter by municipality name or id.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "department",
                openapi.IN_QUERY,
                description="Filter by department name or id.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "min_posts",
                openapi.IN_QUERY,
                description="Minimum number of active posts.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order by active_posts_count, latest_post_date, username (prefix with '-' for desc).",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: SellerUserSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="Get seller by username",
        operation_description="Returns seller details including profile and stats. Uses username as lookup.",
        tags=["Users - Sellers"],
        manual_parameters=[
            openapi.Parameter(
                "username",
                openapi.IN_PATH,
                description="Username of the seller to retrieve.",
                type=openapi.TYPE_STRING,
            )
        ],
        responses={200: SellerUserSerializer},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="List posts by seller",
        operation_description=(
            "Returns public active posts for the specified seller. Supports filters by "
            "`category`, `min_price`, `max_price`, `city` and ordering by `published_at`, "
            "`price`, `title`."
        ),
        tags=["Users - Sellers"],
        manual_parameters=[
            openapi.Parameter(
                "username",
                openapi.IN_PATH,
                description="Seller username.",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "category",
                openapi.IN_QUERY,
                description="Filter by category id.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                "min_price",
                openapi.IN_QUERY,
                description="Minimum price (inclusive).",
                type=openapi.TYPE_NUMBER,
                format=openapi.FORMAT_DECIMAL,
            ),
            openapi.Parameter(
                "max_price",
                openapi.IN_QUERY,
                description="Maximum price (inclusive).",
                type=openapi.TYPE_NUMBER,
                format=openapi.FORMAT_DECIMAL,
            ),
            openapi.Parameter(
                "city",
                openapi.IN_QUERY,
                description="Filter by city (partial match).",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                "ordering",
                openapi.IN_QUERY,
                description="Order by published_at, price or title (prefix with '-' for desc).",
                type=openapi.TYPE_STRING,
            ),
        ],
        responses={200: PostListSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, username=None):
        user = self.get_object()

        # Get user's public posts (except rejected)
        posts_queryset = (
            Post.objects.filter(
                user=user,
                status__in=[
                    Post.StatusChoices.ACTIVE,
                    Post.StatusChoices.SOLD,
                    Post.StatusChoices.EXPIRED,
                ],
                visibility=Post.VisibilityChoices.PUBLIC,
            )
            .select_related("category")
            .prefetch_related("images")
        )

        # Apply same filtering as marketplace
        category = request.query_params.get("category")
        if category:
            posts_queryset = posts_queryset.filter(category_id=category)

        min_price = request.query_params.get("min_price")
        if min_price:
            posts_queryset = posts_queryset.filter(price__gte=min_price)

        max_price = request.query_params.get("max_price")
        if max_price:
            posts_queryset = posts_queryset.filter(price__lte=max_price)

        city = request.query_params.get("city")
        if city:
            posts_queryset = posts_queryset.filter(location_city__icontains=city)

        # Ordering
        ordering = request.query_params.get("ordering", "-published_at")
        posts_queryset = posts_queryset.order_by(ordering)

        # Paginate results
        page = self.paginate_queryset(posts_queryset)
        if page is not None:
            serializer = PostListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PostListSerializer(posts_queryset, many=True)
        return Response(serializer.data)


class DepartmentListApiView(APIView):
    """Get all departments with their municipalities nested"""

    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="List departments with municipalities",
        operation_description=(
            "Returns all departments with their municipalities nested. "
            "Includes municipality count for each department."
        ),
        tags=["Departments & Municipalities"],
        responses={200: DepartmentWithMunicipalitiesSerializer(many=True)},
    )
    def get(self, request):
        """Return all departments with nested municipalities."""
        departments = Department.objects.prefetch_related("municipalities").all()
        serializer = DepartmentWithMunicipalitiesSerializer(departments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
