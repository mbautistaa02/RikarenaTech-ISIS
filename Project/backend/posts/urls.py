from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    PostFeedViewSet,
    PostModerationViewSet,
    UserPostViewSet,
)

# Main router
router = DefaultRouter()

# Register main viewsets
router.register("categories", CategoryViewSet)
router.register("marketplace", PostFeedViewSet, basename="marketplace-feed")
router.register("my-listings", UserPostViewSet, basename="user-listings")
router.register("moderation", PostModerationViewSet, basename="post-moderation")

# URL patterns
urlpatterns = [
    path("", include(router.urls)),
]
