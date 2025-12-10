from django.contrib import admin

from .models import (
    Department,
    HistoricalDepartment,
    HistoricalMunicipality,
    HistoricalProfile,
    Municipality,
    Profile,
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at", "updated_at")
    search_fields = ("name",)
    list_filter = ("created_at", "updated_at")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Municipality)
class MunicipalityAdmin(admin.ModelAdmin):
    list_display = ("name", "department", "created_at", "updated_at")
    search_fields = ("name", "department__name")
    list_filter = ("department", "created_at", "updated_at")
    ordering = ("department__name", "name")
    readonly_fields = ("created_at", "updated_at")

    # Agregar filtro jerárquico por departamento
    list_select_related = ("department",)


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "cellphone_number",
        "municipality",
        "registration_date",
    )
    search_fields = ("user__username", "user__email", "cellphone_number")
    list_filter = ("municipality__department", "municipality", "registration_date")
    ordering = ("user__username",)
    readonly_fields = ("registration_date", "created_at", "updated_at")

    # Optimizar consultas
    list_select_related = ("user", "municipality", "municipality__department")

    # Organizar campos en el formulario
    fieldsets = (
        ("Información del Usuario", {"fields": ("user",)}),
        (
            "Información Personal",
            {"fields": ("cellphone_number", "picture_url")},
        ),
        ("Ubicación", {"fields": ("municipality",)}),
        (
            "Fechas",
            {
                "fields": ("registration_date", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(HistoricalDepartment)
class HistoricalDepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "history_type",
        "history_date",
        "history_user",
    )
    list_filter = ("history_type", "history_date")
    search_fields = ("name", "history_user__username")
    readonly_fields = (
        "name",
        "created_at",
        "updated_at",
        "history_id",
        "history_date",
        "history_change_reason",
        "history_type",
        "history_user",
    )
    ordering = ("-history_date", "-history_id")


@admin.register(HistoricalMunicipality)
class HistoricalMunicipalityAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "department",
        "history_type",
        "history_date",
        "history_user",
    )
    list_filter = ("department", "history_type", "history_date")
    search_fields = ("name", "department__name", "history_user__username")
    readonly_fields = (
        "name",
        "department",
        "created_at",
        "updated_at",
        "history_id",
        "history_date",
        "history_change_reason",
        "history_type",
        "history_user",
    )
    ordering = ("-history_date", "-history_id")
    list_select_related = ("department",)


@admin.register(HistoricalProfile)
class HistoricalProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "cellphone_number",
        "municipality",
        "history_type",
        "history_date",
        "history_user",
    )
    list_filter = (
        "municipality",
        "municipality__department",
        "history_type",
        "history_date",
    )
    search_fields = (
        "user__username",
        "user__email",
        "cellphone_number",
        "history_user__username",
    )
    readonly_fields = (
        "user",
        "cellphone_number",
        "municipality",
        "registration_date",
        "picture_url",
        "bio",
        "created_at",
        "updated_at",
        "history_id",
        "history_date",
        "history_change_reason",
        "history_type",
        "history_user",
    )
    ordering = ("-history_date", "-history_id")
    list_select_related = ("user", "municipality", "municipality__department")
