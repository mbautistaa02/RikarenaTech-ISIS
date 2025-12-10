"""
Comprehensive middleware for handling errors and security
"""

import ipaddress
import logging

from django.core.exceptions import PermissionDenied, SuspiciousOperation
from django.http import Http404, JsonResponse
from django.utils import timezone

from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated
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

        def _first_public_ip(candidates):
            """Return the first public-looking IP from a list of candidates"""
            for raw_ip in candidates:
                if not raw_ip:
                    continue
                ip_only = raw_ip.split(":")[0].strip()  # drop port if present
                try:
                    ip_obj = ipaddress.ip_address(ip_only)
                except ValueError:
                    continue
                if not (
                    ip_obj.is_private
                    or ip_obj.is_loopback
                    or ip_obj.is_reserved
                    or ip_obj.is_unspecified
                ):
                    return ip_only
            # fallback to the first non-empty candidate even if private
            for raw_ip in candidates:
                if raw_ip:
                    return raw_ip.split(":")[0].strip()
            return None

        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = _first_public_ip([ip.strip() for ip in x_forwarded_for.split(",")])
            if ip:
                return ip

        x_real_ip = request.META.get("HTTP_X_REAL_IP")
        if x_real_ip:
            ip = _first_public_ip([x_real_ip.strip()])
            if ip:
                return ip

        forwarded = request.META.get("HTTP_FORWARDED")
        if forwarded:
            forwarded_ips = []
            for entry in forwarded.split(","):
                for token in entry.split(";"):
                    token = token.strip()
                    if token.lower().startswith("for="):
                        candidate = token[4:].strip().strip('"')
                        candidate = candidate.strip("[]")  # remove brackets for IPv6
                        forwarded_ips.append(candidate)
            ip = _first_public_ip(forwarded_ips)
            if ip:
                return ip

        return request.META.get("REMOTE_ADDR", "Unknown")
