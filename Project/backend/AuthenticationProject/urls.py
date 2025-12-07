from django.urls import include, path

from . import views

urlpatterns = [
     # OAuth login/logout (allauth)
    path("auth/", include("allauth.urls")),
    path("token/", views.get_jwt_token, name="get_token"),
]
