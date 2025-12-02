from django.urls import include, path

from . import views

urlpatterns = [
    path("auth/", include("allauth.urls")),
    path("token/", views.get_jwt_token, name="get_token"),
]
