from drf_yasg import openapi
from drf_yasg.generators import OpenAPISchemaGenerator
from drf_yasg.views import get_schema_view
from rest_framework import permissions


class CustomSchemaGenerator(OpenAPISchemaGenerator):
    def get_tags(self, paths, prefix):
        tags = []

        # Define tag order and grouping
        tag_groups = {
            "Authentication": ["Authentication - Login", "Authentication - JWT"],
            "Posts": [
                "Posts - Categories",
                "Posts - Public Feed",
                "Posts - User Management",
                "Posts - Moderation",
            ],
            "Users": ["Users - Sellers", "Users - Profile"],
            "Crops": ["Crops - Products", "Crops - Management"],
            "Alerts": ["Alerts - Notifications"],
        }

        # Extract tags from paths and group them
        for path in paths:
            for method in paths[path]:
                operation = paths[path][method]
                if "tags" in operation and operation["tags"]:
                    for tag in operation["tags"]:
                        if tag not in [t["name"] for t in tags]:
                            # Determine group
                            group_name = "Other"
                            for group, group_tags in tag_groups.items():
                                if any(group_tag in tag for group_tag in group_tags):
                                    group_name = group
                                    break

                            tags.append(
                                {
                                    "name": tag,
                                    "description": f"{group_name} related endpoints",
                                }
                            )

        return tags


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
        - **Crops**: Crop information and management
        - **Alerts**: Notification and alerts system
        """,
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@rikarenatech.com"),
        license=openapi.License(name="BSD License"),
    ),
    generator_class=CustomSchemaGenerator,
    public=False,
    permission_classes=(permissions.IsAuthenticated,),
    authentication_classes=[],
)
