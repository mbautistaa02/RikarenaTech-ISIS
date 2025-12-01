from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import Profile


class Command(BaseCommand):
    help = "Genera perfiles faltantes para usuarios existentes"

    def handle(self, *args, **kwargs):
        created_count = 0

        for user in User.objects.all():
            profile, created = Profile.objects.get_or_create(
                user=user, defaults={"role": "USER"}
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Perfiles creados: {created_count}"))
