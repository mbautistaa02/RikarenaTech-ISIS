from django.urls import path

from .views import AlertCategoryViewSet, AlertViewSet

urlpatterns = [
    # Create alert
    path("create/", AlertViewSet.as_view({"post": "create"}), name="alert-create"),
    # List all alerts
    path("", AlertViewSet.as_view({"get": "list"}), name="alert-list"),
    # Alert categories
    path(
        "categories/",
        AlertCategoryViewSet.as_view({"get": "list"}),
        name="alert-categories-list",
    ),
]
