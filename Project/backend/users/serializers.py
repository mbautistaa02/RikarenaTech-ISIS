from django.contrib.auth.models import Group, User

from rest_framework import serializers

from posts.serializers import MunicipalitySerializer

from .models import Profile


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for user groups"""

    class Meta:
        model = Group
        fields = ["id", "name"]


class CompleteProfileSerializer(serializers.ModelSerializer):
    """Complete profile serializer with all location details"""

    municipality = MunicipalitySerializer(read_only=True)

    class Meta:
        model = Profile
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    municipality = MunicipalitySerializer(read_only=True)

    class Meta:
        model = Profile
        exclude = ["id", "role", "picture_url", "user"]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        exclude = [
            "id",
            "password",
            "is_superuser",
            "is_staff",
            "user_permissions",
            "groups",
        ]
        ref_name = "UsersUserSerializer"


class SellerUserSerializer(serializers.ModelSerializer):
    """Serializer for users who are sellers (have active posts)"""

    profile = ProfileSerializer(read_only=True)
    active_posts_count = serializers.IntegerField(read_only=True)
    total_posts_count = serializers.IntegerField(read_only=True)
    latest_post_date = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "profile",
            "active_posts_count",
            "total_posts_count",
            "latest_post_date",
        ]


class CurrentUserSerializer(serializers.ModelSerializer):
    """Complete serializer for authenticated user's own profile"""

    profile = CompleteProfileSerializer(read_only=True)
    groups = GroupSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "last_login",
            "profile",
            "groups",
        ]
