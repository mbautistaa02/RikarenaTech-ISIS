from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

# Schema view for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="RikarenaTech ISIS API",
        default_version="v1",
        description="""
        API documentation for RikarenaTech ISIS project - Agricultural Marketplace Platform

        ## API Organization:
        - **Authentication**: User registration, login, and JWT token management
        - **Posts**: Marketplace posts, categories, and feed management
        - **Users**: User profiles, sellers directory, and user management
        - **Crops**: Crop information and management (coming soon)
        - **Alerts**: Notification and alerts system (coming soon)
        """,
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@rikarenatech.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    authentication_classes=[],
)
