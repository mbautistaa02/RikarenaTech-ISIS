import logging

from django.conf import settings

from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

logger = logging.getLogger(__name__)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def get_login_redirect_url(self, request):
        """
        Redirect to frontend after successful OAuth login
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(
            f"CustomSocialAccountAdapter.get_login_redirect_url called - redirecting to: {redirect_url}"
        )
        print(
            f"[DEBUG] CustomSocialAccountAdapter.get_login_redirect_url - redirecting to: {redirect_url}"
        )
        return redirect_url

    def get_signup_redirect_url(self, request):
        """
        Redirect to frontend after successful OAuth signup
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(
            f"CustomSocialAccountAdapter.get_signup_redirect_url called - redirecting to: {redirect_url}"
        )
        print(
            f"[DEBUG] CustomSocialAccountAdapter.get_signup_redirect_url - redirecting to: {redirect_url}"
        )
        return redirect_url

    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirect after connecting a social account
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(
            f"CustomSocialAccountAdapter.get_connect_redirect_url called - redirecting to: {redirect_url}"
        )
        print(
            f"[DEBUG] CustomSocialAccountAdapter.get_connect_redirect_url - redirecting to: {redirect_url}"
        )
        return redirect_url

    def save_user(self, request, sociallogin, form=None):
        """
        Debug method to see when user is saved
        """
        logger.debug(
            f"CustomSocialAccountAdapter.save_user called for user: {sociallogin.user}"
        )
        print(
            f"[DEBUG] CustomSocialAccountAdapter.save_user called for user: {sociallogin.user}"
        )
        return super().save_user(request, sociallogin, form)


class CustomAccountAdapter(DefaultAccountAdapter):
    def get_login_redirect_url(self, request):
        """
        Redirect to frontend after login
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/products"
        logger.debug(
            f"CustomAccountAdapter.get_login_redirect_url called - redirecting to: {redirect_url}"
        )
        print(
            f"[DEBUG] CustomAccountAdapter.get_login_redirect_url - redirecting to: {redirect_url}"
        )
        return redirect_url

    def get_logout_redirect_url(self, request):
        """
        Redirect to frontend after logout
        """
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url}/"
        logger.debug(
            f"CustomAccountAdapter.get_logout_redirect_url called - redirecting to: {redirect_url}"
        )
        print(
            f"[DEBUG] CustomAccountAdapter.get_logout_redirect_url - redirecting to: {redirect_url}"
        )
        return redirect_url
