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
from .serializers import ProfileSerializer, SellerUserSerializer, UserSerializer


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


class UserDetailApiView(APIView):

    permission_classes = [IsAuthenticated]

    """Get user detail by username with profile included"""

    def get(self, request, username):
        user = get_object_or_404(User, username=username, is_active=True)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileDetailApiView(APIView):
    """
    Update profile of a user
    Only the owner of the profile can update it
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
        }

        if not set(request.data.keys()).issubset(allowed_fields):
            return Response(
                {
                    "detail": "You can only modify: cellphone_number, municipality, first_name, last_name, picture_url"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = get_object_or_404(Profile, user__username=username)

        profile_fields = {}
        user_fields = {}

        for key, value in request.data.items():
            if key in ["cellphone_number", "municipality"]:
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
    """

    serializer_class = SellerUserSerializer
    permission_classes = []  # Public access
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
            .select_related("profile")
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
                # Get location from user's most recent post
                municipality_name=Max("posts__municipality__name"),
                department_name=Max("posts__municipality__department__name"),
            )
            .filter(active_posts_count__gt=0)
            .distinct()
        )

        return queryset

        # Additional filtering
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

        # Filter by minimum posts count
        min_posts = self.request.query_params.get("min_posts")
        if min_posts:
            queryset = queryset.filter(active_posts_count__gte=min_posts)

        return queryset

    @action(detail=True, methods=["get"], url_path="posts")
    def posts(self, request, username=None):
        """
        Get all active posts for a specific seller
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
