from rest_framework import serializers

from users.models import Department

from .models import Alert, AlertCategory, AlertImage


class AlertCategorySerializer(serializers.ModelSerializer):
    """Serializer for Alert Categories"""

    class Meta:
        model = AlertCategory
        fields = ["category_name", "description"]


class AlertImageSerializer(serializers.ModelSerializer):
    """Serializer for alert images"""

    class Meta:
        model = AlertImage
        fields = ["image", "uploaded_at"]
        read_only_fields = ["uploaded_at"]


class AlertWriteSerrializer(serializers.ModelSerializer):
    """Serializer for creating alerts - only moderators/staff can use this"""

    category_name = serializers.CharField(write_only=True)
    department_name = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )

    class Meta:
        model = Alert
        fields = [
            "alert_title",
            "alert_message",
            "category_name",
            "scope",
            "department_name",
        ]

        read_only_fields = ["id"]

    def validate(self, data):  # type: ignore
        """Custom validation and category/department lookup by name"""

        scope = data.get("scope")

        # Validate departmental scope has department
        if scope == "departamental" and not data.get("department_name"):
            raise serializers.ValidationError(
                "Department name must be set for departamental scope alerts."
            )

        # Lookup category by name
        category_name = data.pop("category_name", None)
        if not category_name:
            raise serializers.ValidationError("category_name is required.")

        try:
            category = AlertCategory.objects.get(category_name=category_name)
            data["category"] = category
        except AlertCategory.DoesNotExist:
            raise serializers.ValidationError(
                f"Category '{category_name}' does not exist."
            )

        # Lookup department by name
        department_name = data.pop("department_name", None)
        if department_name:
            try:
                department = Department.objects.get(name=department_name)
                data["department"] = department
            except Department.DoesNotExist:
                raise serializers.ValidationError(
                    f"Department '{department_name}' does not exist."
                )

        return data

    def create(self, validated_data):
        """Create Alert with the user who created it and handle multiple images"""

        from django.conf import settings

        request = self.context.get("request")
        validated_data["created_by"] = request.user if request else None

        # Get images from request FILES (same pattern as Posts)
        images = (
            request.FILES.getlist("images") or request.FILES.getlist("images[]")
            if request
            else []
        )

        # Validate minimum and maximum images
        max_images = getattr(
            settings, "MAX_IMAGES_PER_ALERT", settings.MAX_IMAGES_PER_POST
        )
        if len(images) > max_images:
            raise serializers.ValidationError(
                f"Too many images. Maximum {max_images} allowed."
            )

        # Create the alert
        alert = Alert.objects.create(**validated_data)

        # Create images - django-storages handles R2 upload automatically
        for _, image_file in enumerate(images):
            AlertImage.objects.create(alert=alert, image=image_file)

        return alert

    def to_representation(self, instance):
        """Include images in the response"""
        data = super().to_representation(instance)
        data["images"] = AlertImageSerializer(
            instance.images.all(), many=True, context=self.context
        ).data
        return data


class AlertReadSerializer(serializers.ModelSerializer):
    """Visualization serializer for Alerts"""

    department_name = serializers.CharField(
        source="department.name", read_only=True, allow_null=True
    )
    category = AlertCategorySerializer(read_only=True)
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )
    images = AlertImageSerializer(many=True, read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "alert_title",
            "alert_message",
            "category",
            "scope",
            "department_name",
            "images",
            "created_at",
            "updated_at",
            "created_by_username",
        ]
