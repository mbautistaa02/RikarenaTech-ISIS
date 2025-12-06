from django.contrib.auth.models import User

from rest_framework import serializers

from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        exclude = ["password"]


class SellerUserSerializer(serializers.ModelSerializer):
    """Serializer for users who are sellers (have active posts)"""

    profile = ProfileSerializer(read_only=True)
    active_posts_count = serializers.IntegerField(read_only=True)
    total_posts_count = serializers.IntegerField(read_only=True)
    location_city = serializers.CharField(read_only=True)
    location_state = serializers.CharField(read_only=True)
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
            "location_city",
            "location_state",
            "latest_post_date",
        ]
