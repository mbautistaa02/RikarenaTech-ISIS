from django.contrib import admin
from . import views
from django.urls import path, include

urlpatterns = [
    path("auth/", include("allauth.urls")),
    path("token/", views.get_jwt_token, name="get_token"),
]
