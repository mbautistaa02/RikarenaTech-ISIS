from django.conf import settings
from django.contrib.auth.models import Group
from django.db import OperationalError, ProgrammingError
from django.db.models.signals import post_save
from django.dispatch import receiver

from allauth.socialaccount.models import SocialAccount
from django.contrib.auth.signals import user_logged_in
import logging

logger = logging.getLogger(__name__)
from allauth.socialaccount.signals import pre_social_login, social_account_added

from .models import Profile


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
        logger.info("post_save user (created) id=%s username=%s", instance.id, instance.username)
        try:
            profile = Profile.objects.create(user=instance)
        except (OperationalError, ProgrammingError):
            # During test DB setup or before migrations exist the Profile table
            # may not be available. Ignore profile creation in that case so
            # tests and migrations can run without failing.
            return

        # Assign to users group
        user_group, _ = Group.objects.get_or_create(name="users")
        instance.groups.add(user_group)

        # Try to update profile picture if Google social account exists
        social_account = SocialAccount.objects.filter(user=instance).first()
        if social_account and "picture" in social_account.extra_data:
            profile.picture_url = social_account.extra_data["picture"]
            profile.save()
    else:
        # Create profile if it doesn't exist for existing users
        if not hasattr(instance, "profile"):
            Profile.objects.create(user=instance)
            logger.info("post_save user (existing) created missing profile id=%s username=%s", instance.id, instance.username)


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

    extra_data = sociallogin.account.extra_data

    # Google provides the image in the 'picture' field
    if "picture" in extra_data:
        picture_url = extra_data["picture"]
        if user.profile.picture_url != picture_url:
            user.profile.picture_url = picture_url
            user.profile.save(update_fields=["picture_url"])
            logger.info("Updated profile picture from social provider for user id=%s", user.id)


@receiver(user_logged_in)
def update_profile_picture_on_login(sender, request, user, **kwargs):
    """
    Ensure profile picture is synced from Google on every login.
    Works for existing accounts even if previous signals didn't run.
    """
    logger.info("user_logged_in signal received user id=%s username=%s", user.id, user.username)
    try:
        social_account = SocialAccount.objects.filter(user=user).first()
    except OperationalError:
        return

    if not social_account:
        logger.info("user_logged_in: no social account found for user id=%s", user.id)
        return

    # Ensure profile exists
    profile, _ = Profile.objects.get_or_create(user=user)

    picture_url = social_account.extra_data.get("picture")
    if picture_url and profile.picture_url != picture_url:
        profile.picture_url = picture_url
        profile.save(update_fields=["picture_url"])
        logger.info("user_logged_in: synced profile picture for user id=%s", user.id)
