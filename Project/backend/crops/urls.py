from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import CropViewSet, ProductViewSet

# Main router for this app
router = DefaultRouter()

# Register endpoints
router.register("products", ProductViewSet, basename="products")
router.register("", CropViewSet, basename="crops")

urlpatterns = [
    path("", include(router.urls)),
]
