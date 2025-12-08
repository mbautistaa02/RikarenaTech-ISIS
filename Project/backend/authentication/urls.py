from django.urls import include, path

urlpatterns = [
    # OAuth login/logout (allauth)
    path("auth/", include("allauth.urls")),
]
