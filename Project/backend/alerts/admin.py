from django.contrib import admin

from simple_history.admin import SimpleHistoryAdmin

from .models import (
    Alert,
    AlertCategory,
    AlertImage,
    HistoricalAlert,
    HistoricalAlertCategory,
    HistoricalAlertImage,
)


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
        "department",
        "created_by",
        "created_at",
    ]
    list_filter = ["category", "scope", "created_at", "department"]
    search_fields = ["alert_title", "alert_message"]
    raw_id_fields = ["department", "created_by"]
    inlines = [AlertImageInline]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        ("Scope and Location", {"fields": ("scope", "department")}),
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


@admin.register(HistoricalAlertCategory)
class HistoricalAlertCategoryAdmin(SimpleHistoryAdmin):
    list_display = ("category_name", "history_type", "history_date", "history_user")
    list_filter = ("history_type", "history_date")
    search_fields = ("category_name", "history_user__username")
    readonly_fields = [field.name for field in HistoricalAlertCategory._meta.fields]


@admin.register(HistoricalAlert)
class HistoricalAlertAdmin(SimpleHistoryAdmin):
    list_display = ("alert_title", "scope", "category", "history_type", "history_date")
    list_filter = ("scope", "category", "history_type", "history_date")
    search_fields = ("alert_title", "alert_message", "history_user__username")
    readonly_fields = [field.name for field in HistoricalAlert._meta.fields]


@admin.register(HistoricalAlertImage)
class HistoricalAlertImageAdmin(SimpleHistoryAdmin):
    list_display = ("alert", "uploaded_at", "history_type", "history_date")
    list_filter = ("history_type", "history_date")
    search_fields = ("alert__alert_title", "history_user__username")
    readonly_fields = [field.name for field in HistoricalAlertImage._meta.fields]
