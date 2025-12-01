from django.db import models
from django.contrib.auth.models import AbstractUser


# ----------------------
# Department
# ----------------------
class Department(models.Model):
    department_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150)

    def __str__(self):
        return self.name


# ----------------------
# Custom User
# ----------------------
class User(AbstractUser):

    user_id = models.BigAutoField(primary_key=True)

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    cellphone_number = models.BigIntegerField(null=True, blank=True)

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users"
    )

    role = models.CharField(max_length=50)
    register_date = models.DateField(auto_now_add=True)

    # M2M con Alert usando tabla intermedia
    alerts = models.ManyToManyField(
        "Alert",
        through="UserAlert",
        related_name="users"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email


# ----------------------
# Administrator extension
# ----------------------
class Administrator(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="administrator_profile"
    )

    permissions = models.TextField()

    def __str__(self):
        return f"Admin: {self.user.email}"


# ----------------------
# Products
# ----------------------
class Product(models.Model):

    product_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150)

    def __str__(self):
        return self.name


# ----------------------
# Crop
# ----------------------
class Crop(models.Model):

    crop_id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="crops"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="crops"
    )

    start_date = models.DateField()
    harvest_date = models.DateField()
    area = models.FloatField()

    def __str__(self):
        return f"Crop {self.crop_id} - {self.product.name}"


# ----------------------
# Post Category
# ----------------------
class PostCategory(models.Model):

    category_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150)

    def __str__(self):
        return self.name


# ----------------------
# Post
# ----------------------
class Post(models.Model):

    post_id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posts"
    )

    category = models.ForeignKey(
        PostCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name="posts"
    )

    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField()

    def __str__(self):
        return self.title


# ----------------------
# Alert Category
# ----------------------
class AlertCategory(models.Model):

    category_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150)

    def __str__(self):
        return self.name


# ----------------------
# Alert
# ----------------------
class Alert(models.Model):

    alert_id = models.BigAutoField(primary_key=True)

    admin = models.ForeignKey(
        Administrator,
        on_delete=models.CASCADE,
        related_name="alerts"
    )

    category = models.ForeignKey(
        AlertCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name="alerts"
    )

    title = models.CharField(max_length=200)
    content = models.TextField()
    date = models.DateField()

    def __str__(self):
        return self.title


# ----------------------
# Tabla intermedia User - Alert
# ----------------------
class UserAlert(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "alert")

    def __str__(self):
        return f"{self.user.email} - {self.alert.title}"
