from django.conf import settings
from django.db import models

from simple_history.models import HistoricalRecords


class Profile(models.Model):
    """Model for user profiles"""

    cellphone_number = models.BigIntegerField(unique=True, null=True, blank=True)
    # role kept for compatibility with migrations and historical records
    role = models.CharField(max_length=50, default="user")
    registration_date = models.DateTimeField(auto_now_add=True)
    picture_url = models.URLField(max_length=200, blank=True, null=True)
    bio = models.TextField(
        max_length=500, blank=True, null=True, help_text="User biography or description"
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )

    municipality = models.ForeignKey(
        "Municipality",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="profiles",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.user.username}"

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"


class Department(models.Model):
    """Model for departments"""

    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ["name"]


class Municipality(models.Model):
    """Model for municipalities"""

    name = models.CharField(max_length=100)
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name="municipalities"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.name}, {self.department.name}"

    class Meta:
        verbose_name = "Municipality"
        verbose_name_plural = "Municipalities"
        ordering = ["name"]
