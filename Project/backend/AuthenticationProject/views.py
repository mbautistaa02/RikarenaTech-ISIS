from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


def home(request):
    return render(request, "home.html")


@api_view(["GET"])
def get_jwt_token(request):
    if not request.user.is_authenticated:
        return Response({"error": "Please sign in first"}, status=401)
    refresh = RefreshToken.for_user(request.user)
    return Response(
        {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
    )
