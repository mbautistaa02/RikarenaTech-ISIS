from django.urls import path

from .views import ProfileDetailApiView, UserApiView, UserDetailApiView

urlpatterns = [
    path("users/", UserApiView.as_view()),
    path("users/<int:pk>/", UserDetailApiView.as_view()),
    path("users/<int:pk>/profile/", ProfileDetailApiView.as_view()),
]
