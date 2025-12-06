from django.contrib.auth.models import User
from django.db.models import Count, Max, Q
from django.shortcuts import get_object_or_404

from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from posts.models import Post
from posts.serializers import PostListSerializer

from .models import Profile
from .serializers import ProfileSerializer, SellerUserSerializer, UserSerializer


class UserApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return all active users with their profiles."""
        users = User.objects.filter(is_active=True).select_related("profile")
        serializer = UserSerializer(users, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class UserDetailApiView(APIView):
    """Get user detail by ID with profile included"""

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        serializer = UserSerializer(user)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class ProfileDetailApiView(APIView):
    """Update profile of a user"""

    def patch(self, request, pk):
        # get the profile USING the user id
        profile = get_object_or_404(Profile, user__pk=pk)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated", "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SellerUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for users who are sellers (have published posts)
    Read-only access to search and list sellers
    """

    serializer_class = SellerUserSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "posts__location_city",
        "posts__location_state",
    ]
    ordering_fields = ["active_posts_count", "latest_post_date", "username"]
    ordering = ["-latest_post_date"]

    class Meta:
        swagger_tags = ["Users - Sellers"]

    # Type hint for request property
    request: Request

    def get_queryset(self):
        """
        Return users who have at least one active post with statistics
        """
        queryset = (
            User.objects.filter(
                is_active=True,
                posts__status=Post.StatusChoices.ACTIVE,
                posts__visibility=Post.VisibilityChoices.PUBLIC,
                profile__isnull=False,  # Solo usuarios con perfil
            )
            .select_related("profile")
            .annotate(
                active_posts_count=Count(
                    "posts",
                    filter=Q(
                        posts__status=Post.StatusChoices.ACTIVE,
                        posts__visibility=Post.VisibilityChoices.PUBLIC,
                    ),
                ),
                total_posts_count=Count("posts"),
                latest_post_date=Max(
                    "posts__published_at",
                    filter=Q(
                        posts__status=Post.StatusChoices.ACTIVE,
                        posts__visibility=Post.VisibilityChoices.PUBLIC,
                    ),
                ),
                # Get the most frequent location from user's posts
                location_city=Max("posts__location_city"),
                location_state=Max("posts__location_state"),
            )
            .filter(active_posts_count__gt=0)
            .distinct()
        )

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
    def posts(self, request, pk=None):
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