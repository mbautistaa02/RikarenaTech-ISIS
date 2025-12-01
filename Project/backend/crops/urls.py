from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ProductViewSet,
    CropViewSet,
)

# Main router for this app
router = DefaultRouter()

# Register CRUD endpoints
router.register("products", ProductViewSet, basename="products")
router.register("crops", CropViewSet, basename="crops")

urlpatterns = [
    path("", include(router.urls)),
]