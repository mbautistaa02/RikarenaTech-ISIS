from django.contrib import admin

from .models import Department, Municipality, Profile


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
        "role",
        "municipality",
        "registration_date",
    )
    search_fields = ("user__username", "user__email", "cellphone_number", "role")
    list_filter = (
        "role",
        "municipality__department",
        "municipality",
        "registration_date",
    )
    ordering = ("user__username",)
    readonly_fields = ("registration_date", "created_at", "updated_at")

    # Optimizar consultas
    list_select_related = ("user", "municipality", "municipality__department")

    # Organizar campos en el formulario
    fieldsets = (
        ("Información del Usuario", {"fields": ("user",)}),
        (
            "Información Personal",
            {"fields": ("cellphone_number", "role", "picture_url")},
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
