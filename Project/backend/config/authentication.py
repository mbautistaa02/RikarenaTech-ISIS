"""
Custom authentication classes for development
"""

from rest_framework.authentication import SessionAuthentication


class NoCSRFSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication without CSRF checks for development
    """

    def enforce_csrf(self, request):
        """
        Override to skip CSRF validation completely
        """
        return  # Do nothing - no CSRF enforcement
