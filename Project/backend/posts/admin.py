from django.contrib import admin
from .models import Category, Post, PostImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent", "slug", "is_active", "created_at"]
    list_filter = ["is_active", "parent"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "user",
        "category",
        "status",
        "visibility",
        "price",
        "created_at",
    ]
    list_filter = ["status", "visibility", "category", "is_featured"]
    search_fields = ["title", "content", "user__username"]
    readonly_fields = ["slug", "view_count"]
    fields = [
        "title",
        "slug",
        "content",
        "user",
        "category",
        "price",
        "quantity",
        "unit_of_measure",
        "location_city",
        "location_state",
        "status",
        "visibility",
        "is_featured",
        "expires_at",
        "view_count",
    ]


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = ["post", "order", "created_at"]
    list_filter = ["created_at", "order"]
    search_fields = ["post__title", "alt_text", "caption"]
    fields = ["post", "image_url", "alt_text", "caption", "order"]
