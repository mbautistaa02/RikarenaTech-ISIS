from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    ProfileDetailApiView,
    SellerUserViewSet,
    UserApiView,
    UserDetailApiView,
)

# Router para endpoints con ViewSet
router = DefaultRouter()
router.register("sellers", SellerUserViewSet, basename="sellers")

urlpatterns = [
    # User management endpoints - specific path to avoid router conflicts
    path("all/", UserApiView.as_view(), name="users-list"),
    # Seller endpoints (ViewSet routes)
    path("", include(router.urls)),
    # Username-based endpoints (must be after sellers to avoid conflicts)
    path("<str:username>/", UserDetailApiView.as_view(), name="user-detail"),
    path(
        "<str:username>/profile/", ProfileDetailApiView.as_view(), name="user-profile"
    ),
]
