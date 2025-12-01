from django.contrib import admin
from .models import Product, Crop


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("product_id", "name")
    search_fields = ("name",)


@admin.register(Crop)
class CropAdmin(admin.ModelAdmin):
    list_display = (
        "crop_id",
        "user_id",
        "product",
        "crop_type",
        "area",
        "production_qty",
        "fertilizer_type",
        "irrigation_method",
        "start_date",
        "harvest_date",
        "created_at",
    )


list_filter = ("fertilizer_type", "irrigation_method", "product")
search_fields = ("crop_id", "user_id", "crop_type")
