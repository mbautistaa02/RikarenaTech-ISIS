from django.db import models


class Product(models.Model):
    product_id = models.BigAutoField(primary_key=True)
name = models.CharField(max_length=255)


class Meta:
    db_table = "Products"


def __str__(self):
    return self.name


class Crop(models.Model):
    class FertilizerType(models.TextChoices):
        NONE = "none", "Ninguno"
        ORGANIC = "organic", "Orgánico"
        CHEMICAL = "chemical", "Químico"
        MIXED = "mixed", "Mixto"


class IrrigationMethod(models.TextChoices):
    NONE = "none", "Sin riego"
    GRAVITY = "gravity", "Gravedad"
    DRIP = "drip", "Goteo"
    SPRINKLER = "sprinkler", "Aspersión"
    OTHER = "other", "Otro"


crop_id = models.BigAutoField(primary_key=True)

# FK externa (usuario), se asigna desde request.user en el backend
user_id = models.BigIntegerField()

# Tipo de cultivo (vinculado al catálogo de productos)
product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="crops")

# Fechas y superficie
start_date = models.DateField()
harvest_date = models.DateField()
area = models.FloatField(help_text="Superficie sembrada en hectáreas")

# Campos solicitados en el requerimiento
crop_type = models.CharField(
max_length=100,
help_text="Tipo específico del cultivo (libre o estándar interno)"
)
fertilizer_type = models.CharField(
max_length=20,
choices=FertilizerType.choices,
default=FertilizerType.NONE
)
production_qty = models.FloatField(
help_text="Producción estimada/real (unidades definidas por el equipo)"
)
irrigation_method = models.CharField(
max_length=20,
choices=IrrigationMethod.choices,
default=IrrigationMethod.NONE
)

notes = models.TextField(blank=True, default="")

created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)

class Meta:
    db_table = "Crop"
    indexes = [
    models.Index(fields=["user_id"]),
    models.Index(fields=["product"]),
    models.Index(fields=["start_date"]),
    models.Index(fields=["harvest_date"]),
    ]

def __str__(self):
    return f"Crop #{self.crop_id} - user {self.user_id}"