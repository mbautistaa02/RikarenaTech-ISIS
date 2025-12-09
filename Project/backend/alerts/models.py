from django.contrib.auth.models import User
from django.db import models

from simple_history.models import HistoricalRecords

from users.models import Department, Municipality

# Create your models here.


class AlertCategory(models.Model):
    """Alert category classification"""

    category_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = "Alert Category"
        verbose_name_plural = "Alert Categories"


class Alert(models.Model):
    """Alert model with image support and scope management"""

    SCOPE_CHOICES = [
        ("global", "Global"),
        ("departamental", "Departamental"),
    ]

    # Scope and Location
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="global")
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="alerts",
    )

    # Alert Details
    alert_title = models.CharField(max_length=200)
    alert_message = models.TextField()
    category = models.ForeignKey(
        AlertCategory, on_delete=models.CASCADE, related_name="alerts"
    )

    # Image field (supports upload to R2/S3)
    image = models.ImageField(
        upload_to="alerts/%Y/%m/%d/",
        null=True,
        blank=True,
        help_text="Alert image or screenshot",
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="alerts_created"
    )
    history = HistoricalRecords()

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Alert"
        verbose_name_plural = "Alerts"
        indexes = [
            models.Index(fields=["-created_at"]),
        ]


class AlertImage(models.Model):
    """Images for alerts - supports multiple images per alert"""

    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(
        upload_to="alerts/%Y/%m/%d/", help_text="Alert image or screenshot"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ["uploaded_at"]
        verbose_name = "Alert Image"
        verbose_name_plural = "Alert Images"
