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
    # User management endpoints
    path("", UserApiView.as_view(), name="users-list"),
    path("<str:username>/", UserDetailApiView.as_view(), name="user-detail"),
    path("<str:username>/profile/", ProfileDetailApiView.as_view(), name="user-profile"),
    
    # Seller endpoints (ViewSet routes)
    path("sellers/", include(router.urls)),
]
