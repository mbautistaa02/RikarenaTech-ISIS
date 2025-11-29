from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from django.db.models import QuerySet


class Category(models.Model):
    """Model for post categories"""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subcategories",
    )

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    # Type hints for Django model fields and reverse relations
    if TYPE_CHECKING:
        id: int
        subcategories: QuerySet[Category]
        posts: QuerySet[Post]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} -> {self.name}"
        return self.name

    @property
    def is_subcategory(self):
        return self.parent is not None

    def get_all_subcategories(self):
        """Returns all active subcategories of this category"""
        return Category.objects.filter(parent=self, is_active=True)


class Post(models.Model):
    """Model for blog/feed posts"""

    class StatusChoices(models.TextChoices):
        PENDING_REVIEW = "pending_review", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        ACTIVE = "active", "Active"
        SOLD = "sold", "Sold"
        PAUSED = "paused", "Paused"
        EXPIRED = "expired", "Expired"

    class VisibilityChoices(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"
        UNLISTED = "unlisted", "Unlisted"

    # Basic fields
    title = models.CharField(max_length=200)
    content = models.TextField()
    slug = models.SlugField(unique=True, blank=True)

    # Relaciones
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="posts"
    )

    # Status y visibiltity
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING_REVIEW,
    )
    visibility = models.CharField(
        max_length=10,
        choices=VisibilityChoices.choices,
        default=VisibilityChoices.PUBLIC,
    )

    # Agricultural marketplace fields
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_of_measure = models.CharField(max_length=50)  # kg, tons, boxes, etc.
    location_city = models.CharField(max_length=100)
    location_state = models.CharField(max_length=100)

    # Metadata
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Tiem fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    # Moderation
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_posts",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "visibility"]),
            models.Index(fields=["category", "status"]),
            models.Index(fields=["author", "status"]),
            models.Index(fields=["-created_at"]),
        ]

    # Type hints for Django model fields and reverse relations
    if TYPE_CHECKING:
        id: int
        images: QuerySet[PostImage]

    def __str__(self):
        return f"{self.title} - {self.author.username}"

    def save(self, *args, **kwargs):
        # Auto-generate slug if it doesn't exist
        if not self.slug:
            import uuid

            from django.utils.text import slugify

            self.slug = slugify(self.title)[:45] + "-" + str(uuid.uuid4())[:8]

        # Set published_at when activating
        if self.status == self.StatusChoices.ACTIVE and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status == self.StatusChoices.ACTIVE

    @property
    def is_available(self):
        return (
            self.visibility == self.VisibilityChoices.PUBLIC
            and self.is_active
            and (not self.expires_at or self.expires_at > timezone.now())
        )

    @property
    def is_sold(self):
        return self.status == self.StatusChoices.SOLD

    @property
    def total_value(self):
        return self.price * self.quantity

    def can_be_edited_by(self, user):
        """Checks if a user can edit this post"""
        # Author can always edit
        if self.author == user:
            return True
        # Moderators can edit any post
        return user.groups.filter(name="moderators").exists() or user.is_staff

    def can_be_moderated_by(self, user):
        """Checks if a user can moderate this post"""
        return user.groups.filter(name="moderators").exists() or user.is_staff

    def get_first_image(self):
        """Get the first image"""
        return self.images.first()


class PostImage(models.Model):
    """Simple model for post images"""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=200, blank=True)
    caption = models.CharField(max_length=300, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]
        unique_together = ["post", "order"]

    # Type hints for Django model fields
    if TYPE_CHECKING:
        id: int

    def __str__(self):
        return f"Image for {self.post.title}"
