from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    CropViewSet,
)

# Main router for this app
router = DefaultRouter()

# Register CRUD endpoints
router.register("", CropViewSet, basename="")
router.register("products/", ProductViewSet, basename="products")

urlpatterns = [
    path("", include(router.urls)),
]
