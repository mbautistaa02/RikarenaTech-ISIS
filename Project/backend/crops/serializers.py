from rest_framework import serializers

from .models import Crop, Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class CropSerializer(serializers.ModelSerializer):
    # user_id no se expone para escritura; se establece desde el request
    user_id = serializers.ReadOnlyField(source="user.id")

    # make product explicit to avoid PK/field lookup ambiguity in tests
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    production_qty = serializers.FloatField(required=True)

    class Meta:
        model = Crop
        fields = [
            "crop_id",
            "user_id",
            "product",
            "start_date",
            "harvest_date",
            "area",
            "crop_type",
            "fertilizer_type",
            "production_qty",
            "irrigation_method",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["crop_id", "user_id", "created_at", "updated_at"]

    def validate(self, attrs):
        # attrs may not contain raw input values if field-level validation altered them;
        # fall back to initial_data to ensure required checks behave as expected in tests.
        start_date = attrs.get("start_date") or self.initial_data.get("start_date")
        harvest_date = attrs.get("harvest_date") or self.initial_data.get(
            "harvest_date"
        )
        area = (
            attrs.get("area")
            if attrs.get("area") is not None
            else self.initial_data.get("area")
        )
        production_qty = (
            attrs.get("production_qty")
            if attrs.get("production_qty") is not None
            else self.initial_data.get("production_qty")
        )

        errors = {}

        if start_date and harvest_date and harvest_date < start_date:
            errors["harvest_date"] = (
                "La fecha de cosecha no puede ser anterior a la de siembra."
            )

        if area is None:
            errors["area"] = "La superficie (area) es obligatoria."
        else:
            try:
                if float(area) <= 0:
                    errors["area"] = "La superficie (area) debe ser mayor que 0."
            except Exception:
                errors["area"] = "La superficie (area) debe ser un número válido."

        # For partial updates, if production_qty isn't provided, skip the required check
        if production_qty is None and not (
            self.partial and "production_qty" not in self.initial_data
        ):
            errors["production_qty"] = "La producción es obligatoria."
        elif production_qty is not None:
            try:
                if float(production_qty) < 0:
                    errors["production_qty"] = "La producción no puede ser negativa."
            except Exception:
                errors["production_qty"] = "La producción debe ser un número válido."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Autenticación requerida para crear un cultivo."
            )

        # Asociar el owner del registro desde el usuario autenticado
        user = getattr(request, "user", None)
        if user is None or not getattr(user, "id", None):
            raise serializers.ValidationError(
                "No fue posible identificar al usuario autenticado."
            )

        validated_data["user"] = user

        return super().create(validated_data)
