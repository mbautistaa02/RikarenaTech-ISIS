from django.urls import path

from .views import AlertCategoryViewSet, AlertViewSet

urlpatterns = [
    # Create alert
    path("create/", AlertViewSet.as_view({"post": "create"}), name="alert-create"),
    # My alerts (moderator's own alerts)
    path("my_alerts/", AlertViewSet.as_view({"get": "my_alerts"}), name="my-alerts"),
    # List all alerts
    path("", AlertViewSet.as_view({"get": "list"}), name="alert-list"),
    # Alert categories
    path(
        "categories/",
        AlertCategoryViewSet.as_view({"get": "list"}),
        name="alert-categories-list",
    ),
]
