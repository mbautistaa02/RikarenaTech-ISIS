from django.contrib import admin

from .models import Category, Post, PostImage


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent", "is_active", "created_at"]
    list_filter = ["is_active", "parent"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "status", "price", "municipality", "created_at"]
    list_filter = [
        "status",
        "visibility",
        "category",
        "is_featured",
        "municipality__department",
    ]
    search_fields = ["title", "user__username", "municipality__name"]
    readonly_fields = ["slug", "view_count", "created_at", "updated_at"]
    inlines = [PostImageInline]

    fieldsets = (
        (None, {"fields": ("title", "slug", "content", "user", "category")}),
        (
            "Producto",
            {"fields": ("price", "quantity", "unit_of_measure", "municipality")},
        ),
        ("Estado", {"fields": ("status", "visibility", "is_featured", "expires_at")}),
        (
            "Moderación",
            {
                "fields": ("reviewed_by", "reviewed_at", "review_notes"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = ["post", "alt_text", "order", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["post__title", "alt_text"]
