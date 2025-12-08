from django.contrib import admin

from .models import Alert, AlertCategory, AlertImage


@admin.register(AlertCategory)
class AlertCategoryAdmin(admin.ModelAdmin):
    list_display = ["category_name", "description", "created_at"]
    search_fields = ["category_name"]
    list_filter = ["created_at"]


class AlertImageInline(admin.TabularInline):
    model = AlertImage
    extra = 1


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        "alert_title",
        "category",
        "scope",
        "municipality",
        "created_by",
        "created_at",
    ]
    list_filter = ["category", "scope", "created_at", "municipality"]
    search_fields = ["alert_title", "alert_message"]
    raw_id_fields = ["municipality", "created_by"]
    inlines = [AlertImageInline]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Scope and Location", {"fields": ("scope", "municipality", "department")}),
        (
            "Alert Details",
            {"fields": ("alert_title", "alert_message", "category", "image")},
        ),
        (
            "Metadata",
            {
                "fields": ("created_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(AlertImage)
class AlertImageAdmin(admin.ModelAdmin):
    list_display = ["alert", "uploaded_at"]
    list_filter = ["uploaded_at"]
    raw_id_fields = ["alert"]
