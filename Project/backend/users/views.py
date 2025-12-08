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

from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from posts.models import Post
from posts.serializers import PostListSerializer

from .models import Profile
from .serializers import (
    CurrentUserSerializer,
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

    def get(self, request):
        """Return all active users with their profiles."""
        users = User.objects.filter(is_active=True).select_related("profile")
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CurrentUserApiView(APIView):
    """Get complete profile for the authenticated user"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get complete profile information for the authenticated user

        Returns comprehensive user information including all profile details,
        groups, permissions, and location data. This endpoint provides everything
        the authenticated user needs about their own account.

        Response includes:
        - User basic info: id, username, email, first_name, last_name
        - Account status: is_active, is_staff, is_superuser, date_joined, last_login
        - Complete profile: cellphone_number, role, municipality (with department), picture_url, dates
        - Groups: All groups the user belongs to with id and name

        Example usage:
        - GET /api/users/me/

        Example response:
        {
            "id": 1,
            "username": "juan123",
            "email": "juan@example.com",
            "first_name": "Juan",
            "last_name": "Pérez",
            "is_active": true,
            "is_staff": false,
            "is_superuser": false,
            "date_joined": "2024-01-15T10:30:00Z",
            "last_login": "2024-12-08T14:20:00Z",
            "profile": {
                "id": 1,
                "cellphone_number": 3123456789,
                "role": "seller",
                "registration_date": "2024-01-15T10:30:00Z",
                "picture_url": "https://example.com/profile.jpg",
                "bio": "Agricultor especializado en cultivos orgánicos con 10 años de experiencia.",
                "municipality": {
                    "id": 1,
                    "name": "Bogotá",
                    "department": {
                        "id": 1,
                        "name": "Cundinamarca"
                    }
                },
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-12-08T14:20:00Z"
            },
            "groups": [
                {
                    "id": 1,
                    "name": "sellers"
                }
            ]
        }

        HTTP 200: Success with complete user profile
        HTTP 401: Authentication required
        """
        user = request.user
        serializer = CurrentUserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDetailApiView(APIView):
    """
    Get detailed user information by username

    Returns complete user information including profile details.
    Available for any active user, not just sellers.

    Path parameter:
    - username: The user's unique username

    Response includes:
    - User basic info: id, username, first_name, last_name, email, date_joined, last_login
    - Profile details: cellphone_number, role, municipality (with department), registration_date

    Example usage:
    - /api/users/{username}/

    HTTP 200: Success with user details
    HTTP 401: Authentication required
    HTTP 404: User not found or inactive
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        """Get user detail by username with profile included"""
        user = get_object_or_404(User, username=username, is_active=True)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileDetailApiView(APIView):
    """
    Update user profile information

    Allows users to update their own profile information including personal details
    and location. Only the profile owner can make modifications.

    Path parameter:
    - username: The user's unique username (must match authenticated user)

    Allowed fields for update:
    - cellphone_number: User's phone number (integer)
    - municipality: Municipality ID (foreign key)
    - first_name: User's first name
    - last_name: User's last name
    - picture_url: Profile picture URL
    - username: Change username
    - bio: User biography/description (max 500 characters)    Example usage:
    - PATCH /api/users/{username}/profile/

    Example request body:
    {
        "cellphone_number": 3123456789,
        "municipality": 1,
        "first_name": "Juan",
        "last_name": "Pérez",
        "bio": "Agricultor especializado en cultivos orgánicos con 10 años de experiencia."
    }

    HTTP 200: Profile updated successfully
    HTTP 400: Invalid data or field restrictions violated
    HTTP 401: Authentication required
    HTTP 403: Cannot update another user's profile
    HTTP 404: User not found
    """

    permission_classes = [IsAuthenticated]

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

        # Devuelve el usuario completo actualizado
        full_user_serializer = UserSerializer(user)
        return Response(full_user_serializer.data, status=status.HTTP_200_OK)


class SellerUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for users who are sellers (have published posts)
    Read-only access to search and list sellers

    Available filters:
    - search: Full-text search across username, first_name, last_name, municipality, and department
    - username: Filter by username (partial match, case-insensitive)
    - name: Filter by username, first_name, or last_name (partial match, case-insensitive)
    - category: Filter by post category ID
    - municipality: Filter by municipality name or ID
    - department: Filter by department name or ID
    - min_posts: Filter by minimum number of active posts

    Available ordering:
    - active_posts_count: Number of active posts
    - latest_post_date: Date of most recent post
    - username: Username alphabetically

    Example usage:
    - /api/users/sellers/?username=juan
    - /api/users/sellers/?search=bogota
    - /api/users/sellers/?municipality=bogota&min_posts=5
    - /api/users/sellers/?ordering=-active_posts_count
    """

    swagger_tags = ["Users - Sellers Directory"]
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
        Return users who have at least one active or approved post with statistics
        """
        # Add swagger detection to prevent schema generation errors
        if getattr(self, "swagger_fake_view", False):
            return User.objects.none()

        # Include both ACTIVE and APPROVED posts
        valid_statuses = [Post.StatusChoices.ACTIVE, Post.StatusChoices.APPROVED]

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

    def list(self, request, *args, **kwargs):
        """
        ViewSet for users who are sellers (have published posts)
        Read-only access to search and list sellers

        Available filters:
        - search: Full-text search across username, first_name, last_name, municipality, and department
        - username: Filter by username (partial match, case-insensitive)
        - name: Filter by username, first_name, or last_name (partial match, case-insensitive)
        - category: Filter by post category ID
        - municipality: Filter by municipality name or ID
        - department: Filter by department name or ID
        - min_posts: Filter by minimum number of active posts

        Available ordering:
        - active_posts_count: Number of active posts
        - latest_post_date: Date of most recent post
        - username: Username alphabetically

        Example usage:
        - /api/users/sellers/?username=juan
        - /api/users/sellers/?search=bogota
        - /api/users/sellers/?municipality=bogota&min_posts=5
        - /api/users/sellers/?ordering=-active_posts_count
        """
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """
        Get detailed information for a specific seller by username

        Returns complete seller information including profile and statistics.
        Uses username as lookup field instead of ID for better API usability.

        Path parameter:
        - username: The seller's unique username

        Response includes:
        - Complete user information (id, username, first_name, last_name, email)
        - Full profile details with municipality and department information
        - Post statistics (active_posts_count, total_posts_count, latest_post_date)

        HTTP 200: Success with seller details
        HTTP 401: Authentication required
        HTTP 404: Seller not found or has no active posts
        """
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, username=None):
        """
        Get all active posts for a specific seller by username

        This endpoint returns all active and public posts created by the specified seller.
        Supports filtering and ordering similar to the main marketplace.

        Available filters:
        - category: Filter by category ID
        - min_price: Filter by minimum price (inclusive)
        - max_price: Filter by maximum price (inclusive)
        - city: Filter by city name (partial match, case-insensitive)

        Available ordering:
        - published_at: Date published (default: -published_at for newest first)
        - price: Post price
        - title: Post title alphabetically

        Example usage:
        - /api/users/sellers/{username}/posts/
        - /api/users/sellers/{username}/posts/?category=1
        - /api/users/sellers/{username}/posts/?min_price=50000&max_price=100000
        - /api/users/sellers/{username}/posts/?city=bogota&ordering=price
        - /api/users/sellers/{username}/posts/?ordering=-published_at

        Returns:
        - Paginated list of posts with images and category information
        - Each post includes: id, title, description, price, images, category, location, dates
        """
        user = self.get_object()

        # Get user's active posts
        posts_queryset = (
            Post.objects.filter(
                user=user,
                status=Post.StatusChoices.ACTIVE,
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
