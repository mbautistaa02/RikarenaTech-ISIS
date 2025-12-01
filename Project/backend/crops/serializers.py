from rest_framework import serializers
from .models import Product, Crop

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "all"


class CropSerializer(serializers.ModelSerializer):
    # user_id no se expone para escritura; se establece desde el request
    user_id = serializers.ReadOnlyField()


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
    
    start_date = attrs.get("start_date")
    harvest_date = attrs.get("harvest_date")
    area = attrs.get("area")
    production_qty = attrs.get("production_qty")

    errors = {}

    if start_date and harvest_date and harvest_date < start_date:
        errors["harvest_date"] = "La fecha de cosecha no puede ser anterior a la de siembra."

    if area is None:
        errors["area"] = "La superficie (area) es obligatoria."
    elif area <= 0:
        errors["area"] = "La superficie (area) debe ser mayor que 0."

    if production_qty is None:
        errors["production_qty"] = "La producción es obligatoria."
    elif production_qty < 0:
        errors["production_qty"] = "La producción no puede ser negativa."

    if errors:
        raise serializers.ValidationError(errors)
    
    return attrs



def create(self, validated_data):
    
    request = self.context.get("request")
    if not request or not request.user or not request.user.is_authenticated:
        raise serializers.ValidationError("Autenticación requerida para crear un cultivo.")
    
    # Asociar el owner del registro desde el usuario autenticado
    validated_data["user_id"] = getattr(request.user, "id", None)
    if validated_data["user_id"] is None:
        raise serializers.ValidationError("No fue posible identificar al usuario autenticado.")
    
    return super().create(validated_data)