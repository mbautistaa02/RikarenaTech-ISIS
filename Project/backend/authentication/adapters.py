import logging

from django.conf import settings

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

logger = logging.getLogger(__name__)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_login_redirect_url(self, request):
        """
        Redirects to the frontend after a successful OAuth login.

        Args:
            request: The HTTP request

        Returns:
            str: Frontend redirect URL
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(f"Redirecting after OAuth login to: {redirect_url}")
        return redirect_url

    def get_signup_redirect_url(self, request):
        """
        Redirects to the frontend after a successful OAuth signup.

        Args:
            request: The HTTP request

        Returns:
            str: Frontend redirect URL
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(f"Redirecting after OAuth signup to: {redirect_url}")
        return redirect_url

    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirects after connecting a social account.

        Args:
            request: The HTTP request
            socialaccount: The social account being connected

        Returns:
            str: Frontend redirect URL
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(f"Redirecting after social account connection to: {redirect_url}")
        return redirect_url

    def save_user(self, request, sociallogin, form=None):
        """
        Saves the user and updates the profile picture with Google data.

        Args:
            request: The HTTP request
            sociallogin: SocialLogin object with social account information
            form: Optional form with additional user data

        Returns:
            User: The saved user instance
        """
        logger.debug(f"Saving user from social login: {sociallogin.user}")

        # Save the user first using the parent method
        user = super().save_user(request, sociallogin, form)

        # Update profile picture if it's a Google account and profile exists
        if (
            sociallogin.account.provider == "google"
            and hasattr(user, "profile")
            and "picture" in sociallogin.account.extra_data
        ):

            picture_url = sociallogin.account.extra_data["picture"]
            user.profile.picture_url = picture_url
            user.profile.save(update_fields=["picture_url"])

        return user


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        """
        Redirects to the frontend after login.

        Args:
            request: The HTTP request

        Returns:
            str: Frontend redirect URL
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(f"Redirecting after login to: {redirect_url}")
        return redirect_url

    def get_logout_redirect_url(self, request):
        """
        Redirects to the frontend after logout.

        Args:
            request: The HTTP request

        Returns:
            str: Frontend redirect URL
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/"
        logger.debug(f"Redirecting after logout to: {redirect_url}")
        return redirect_url
