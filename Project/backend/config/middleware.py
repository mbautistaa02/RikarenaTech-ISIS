"""
Comprehensive middleware for handling errors and security
"""

import logging

from django.core.exceptions import PermissionDenied, SuspiciousOperation
from django.http import Http404, JsonResponse
from django.utils import timezone

from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
)
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)

# Error response configurations
ERROR_RESPONSES = {
    400: {
        "message": "Bad request - the server cannot process this request",
        "code": "BAD_REQUEST",
    },
    401: {
        "message": "Authentication credentials are required",
        "code": "AUTHENTICATION_REQUIRED",
    },
    403: {
        "message": "You don't have permission to access this resource",
        "code": "PERMISSION_DENIED",
    },
    404: {
        "message": "The requested resource was not found",
        "code": "RESOURCE_NOT_FOUND",
    },
    500: {
        "message": "An internal server error occurred. Please try again later",
        "code": "INTERNAL_SERVER_ERROR",
    },
}

# JWT-specific friendly messages
JWT_FRIENDLY_MESSAGES = {
    InvalidToken: "Your session is invalid. Please log in again.",
    TokenError: "Authentication token error. Please log in again.",
}


class ErrorHandlingMiddleware:
    """Comprehensive error handling middleware for APIs"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """Handle exceptions with appropriate error responses"""
        # Only handle API requests
        if not request.path.startswith("/api/"):
            return None

        # Determine status code and message based on exception
        status_code, message = self._categorize_exception(exception, request)

        # Log errors appropriately
        self._log_exception(exception, status_code, request)

        # Build error response
        error_config = ERROR_RESPONSES.get(status_code, ERROR_RESPONSES[500])

        response_data = {
            "success": False,
            "message": message or error_config["message"],
            "error_code": error_config["code"],
            "data": None,
            "timestamp": timezone.now().isoformat(),
            "status_code": status_code,
        }

        # Add debug info for staff users
        if hasattr(request, "user") and getattr(request.user, "is_staff", False):
            response_data["debug_info"] = {
                "exception_type": exception.__class__.__name__,
                "exception_message": str(exception),
            }

        return JsonResponse(response_data, status=status_code)

    def _categorize_exception(self, exception, request):
        """Categorize exception and determine status code and message"""
        # JWT/Authentication errors
        if isinstance(exception, (InvalidToken, TokenError)):
            friendly_msg = JWT_FRIENDLY_MESSAGES.get(type(exception))
            return 401, friendly_msg
        elif isinstance(exception, (AuthenticationFailed, NotAuthenticated)):
            return 401, "Authentication credentials are required"

        # Permission errors
        elif isinstance(exception, (PermissionDenied, DRFPermissionDenied)):
            return 403, "You don't have permission to perform this action"

        # Not found errors
        elif isinstance(exception, Http404):
            return 404, "The requested resource was not found"

        # Suspicious operations
        elif isinstance(exception, SuspiciousOperation):
            return 400, "Bad request - suspicious operation detected"

        # Server errors
        else:
            return 500, None

    def _log_exception(self, exception, status_code, request):
        """Log exceptions with appropriate level and context"""
        extra_context = {
            "request_method": request.method,
            "request_path": request.path,
            "user": getattr(request, "user", None),
            "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            "remote_addr": self._get_client_ip(request),
        }

        if status_code >= 500:
            logger.error(
                f"Server error in {request.method} {request.path}: {exception}",
                exc_info=True,
                extra=extra_context,
            )
        elif status_code >= 400 and status_code != 404:
            logger.warning(
                f"Client error {status_code} in {request.method} {request.path}: {exception}",
                extra=extra_context,
            )
        # Don't log 404s to avoid spam

    def _get_client_ip(self, request):
        """Get the client's IP address from request headers"""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "Unknown")
