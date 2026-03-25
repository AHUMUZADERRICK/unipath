import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update a default admin account for deployments."

    def handle(self, *args, **options):
        username = os.getenv("DEFAULT_ADMIN_USERNAME", "AZD").strip()
        password = os.getenv("DEFAULT_ADMIN_PASSWORD", "azd123456")
        email = os.getenv("DEFAULT_ADMIN_EMAIL", "azd@unipath.local").strip().lower()

        if not username:
            self.stdout.write(self.style.WARNING("DEFAULT_ADMIN_USERNAME is empty. Skipping."))
            return

        if not password:
            self.stdout.write(self.style.WARNING("DEFAULT_ADMIN_PASSWORD is empty. Skipping."))
            return

        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save(update_fields=["email", "is_staff", "is_superuser", "password"])

        if created:
            self.stdout.write(self.style.SUCCESS(f"Created default admin user '{username}'."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Updated default admin user '{username}'."))
