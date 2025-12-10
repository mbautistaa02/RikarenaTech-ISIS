from django.contrib import admin

from simple_history.admin import SimpleHistoryAdmin

from .models import Crop, HistoricalCrop, HistoricalProduct, Product


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


@admin.register(HistoricalProduct)
class HistoricalProductAdmin(SimpleHistoryAdmin):
    list_display = ("name", "history_type", "history_date", "history_user")
    list_filter = ("history_type", "history_date")
    search_fields = ("name", "history_user__username")
    readonly_fields = [field.name for field in HistoricalProduct._meta.fields]


@admin.register(HistoricalCrop)
class HistoricalCropAdmin(SimpleHistoryAdmin):
    list_display = ("crop_id", "product", "user", "history_type", "history_date")
    list_filter = (
        "history_type",
        "history_date",
        "product",
        "fertilizer_type",
        "irrigation_method",
    )
    search_fields = ("crop_id", "user__username", "history_user__username")
    readonly_fields = [field.name for field in HistoricalCrop._meta.fields]
    list_select_related = ("product", "user")
