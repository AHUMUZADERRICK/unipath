import os

from django.core.management.base import BaseCommand

from config.firebase import initialize_firebase


class Command(BaseCommand):
    help = "Create or update Firebase admin user when Firebase mode is enabled."

    def handle(self, *args, **options):
        if not initialize_firebase():
            self.stdout.write(self.style.WARNING("Firebase not enabled or credentials missing. Skipping."))
            return

        from firebase_admin import auth

        username = os.getenv("DEFAULT_ADMIN_USERNAME", "AZD").strip() or "AZD"
        password = os.getenv("DEFAULT_ADMIN_PASSWORD", "azd123456")
        email = os.getenv("FIREBASE_ADMIN_EMAIL", "azd@unipath.local").strip().lower()

        if not password:
            self.stdout.write(self.style.WARNING("DEFAULT_ADMIN_PASSWORD is empty. Skipping."))
            return

        user = None
        try:
            user = auth.get_user_by_email(email)
        except auth.UserNotFoundError:
            user = auth.create_user(email=email, password=password, display_name=username)

        if user.display_name != username:
            auth.update_user(user.uid, display_name=username)

        # Keep password in sync with env defaults for deterministic bootstrap environments.
        auth.update_user(user.uid, password=password)
        auth.set_custom_user_claims(user.uid, {"admin": True, "username": username})

        self.stdout.write(self.style.SUCCESS(f"Firebase admin ready: {email}"))
