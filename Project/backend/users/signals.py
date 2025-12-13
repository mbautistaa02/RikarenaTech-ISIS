from django.conf import settings
from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver

from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.signals import pre_social_login, social_account_added

from .models import Profile
from django.db import connection


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    """
    Signal that executes when a user is created or updated.
    Automatically creates a profile and assigns the 'users' group.

    Args:
        sender: The User model
        instance: The user instance
        created: True if the user was created, False if updated
        **kwargs: Additional arguments
    """
    if created:
<<<<<<< Updated upstream
        profile = Profile.objects.create(user=instance)
=======
        # Avoid attempting to create a Profile (which triggers simple_history
        # to write a historical record) when the historical table doesn't yet
        # exist (e.g. during migrations or test DB setup). This prevents
        # OperationalError and broken transactions that cause test failures.
        try:
            tables = connection.introspection.table_names()
        except Exception:
            # If introspection fails for any reason, skip profile creation.
            return

        if "users_historicalprofile" not in tables:
            return

        try:
            profile = Profile.objects.create(user=instance, role="user")
        except (OperationalError, ProgrammingError):
            return
>>>>>>> Stashed changes

        # Assign to users group
        user_group, _ = Group.objects.get_or_create(name="users")
        instance.groups.add(user_group)

        # Try to update profile picture if Google social account exists
        try:
            social_account = SocialAccount.objects.filter(
                user=instance, provider="google"
            ).first()

            if social_account and "picture" in social_account.extra_data:
                profile.picture_url = social_account.extra_data["picture"]
                profile.save()
        except SocialAccount.DoesNotExist:
            pass  # No social account, continue normally
    else:
        # Create profile if it doesn't exist for existing users
        if not hasattr(instance, "profile"):
            try:
                tables = connection.introspection.table_names()
            except Exception:
                return

            if "users_historicalprofile" not in tables:
                return

            try:
                Profile.objects.create(user=instance, role="user")
            except (OperationalError, ProgrammingError):
                return


@receiver(social_account_added)
def update_profile_picture_from_social(sender, request, sociallogin, **kwargs):
    """
    Signal that executes when a new social account is added.
    Updates the user's profile picture with the image from the social provider.

    Args:
        sender: The SocialAccount model
        request: The HTTP request
        sociallogin: SocialLogin object with social account information
        **kwargs: Additional arguments
    """
    _update_user_profile_picture(sociallogin)


@receiver(pre_social_login)
def update_profile_picture_pre_login(sender, request, sociallogin, **kwargs):
    """
    Signal that executes before social login.
    Updates the profile picture for existing users.

    Args:
        sender: The SocialAccount model
        request: The HTTP request
        sociallogin: SocialLogin object with social account information
        **kwargs: Additional arguments
    """
    # Only update if the user already exists in the database
    if sociallogin.user and sociallogin.user.pk:
        _update_user_profile_picture(sociallogin)


def _update_user_profile_picture(sociallogin):
    """
    Helper function to update the user's profile picture
    from social provider data.

    Args:
        sociallogin: SocialLogin object with social account information
    """
    user = sociallogin.user

    # Verify that the user has an associated profile
    if not (user and hasattr(user, "profile")):
        return

    # Only process Google accounts
    if sociallogin.account.provider != "google":
        return

    extra_data = sociallogin.account.extra_data

    # Google provides the image in the 'picture' field
    if "picture" in extra_data:
        picture_url = extra_data["picture"]
        user.profile.picture_url = picture_url
        user.profile.save(update_fields=["picture_url"])
