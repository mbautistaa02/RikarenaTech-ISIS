from django.db import models
from django.conf import settings


class Profile(models.Model):

    cellphone_number = models.BigIntegerField(unique=True, null=True, blank=True)
    department_id = models.BigIntegerField(null=True)
    role = models.CharField(max_length=100)
    registration_date = models.DateTimeField(auto_now_add=True)
    picture_url = models.URLField(max_length=200, blank=True, null=True)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
