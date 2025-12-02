from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import ProfileSerializer, UserSerializer


class UserApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return all active users with their profiles."""
        users = User.objects.filter(is_active=True).select_related("profile")
        serializer = UserSerializer(users, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class UserDetailApiView(APIView):
    """Get user detail by ID with profile included"""

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_active=True)
        serializer = UserSerializer(user)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)


class ProfileDetailApiView(APIView):
    """Update profile of a user"""

    def patch(self, request, pk):
        # get the profile USING the user id
        profile = get_object_or_404(Profile, user__pk=pk)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Profile updated", "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
