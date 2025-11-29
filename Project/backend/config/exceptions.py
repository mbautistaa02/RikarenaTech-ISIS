"""
Comprehensive exception handler for Django REST Framework
"""

from django.utils import timezone
from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    ValidationError,
    AuthenticationFailed,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    Throttled,
    ParseError,
)
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
import logging

logger = logging.getLogger(__name__)

# Comprehensive error messages by category
ERROR_MESSAGES = {
    # Authentication & Authorization
    401: "Authentication credentials are required",
    403: "You don't have permission to perform this action",
    # Client errors
    400: "The request contains invalid data",
    404: "The requested resource was not found",
    405: "This method is not allowed for this endpoint",
    422: "The provided data failed validation",
    429: "Too many requests, please try again later",
    # Server errors
    500: "An internal server error occurred",
    502: "Bad gateway",
    503: "Service temporarily unavailable",
}

# Error codes for programmatic handling
ERROR_CODES = {
    400: "INVALID_REQUEST",
    401: "AUTHENTICATION_REQUIRED",
    403: "PERMISSION_DENIED",
    404: "RESOURCE_NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    422: "VALIDATION_FAILED",
    429: "RATE_LIMITED",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
}

# JWT-specific user-friendly messages
JWT_ERROR_PATTERNS = {
    "expired": "Your session has expired. Please log in again.",
    "invalid": "Your session is invalid. Please log in again.",
    "signature": "Invalid authentication token. Please log in again.",
    "decode": "Authentication token is malformed. Please log in again.",
    "token": "Authentication failed. Please log in again.",
}


def custom_exception_handler(exc, context):
    """Handle exceptions with comprehensive, user-friendly responses"""
    response = exception_handler(exc, context)

    if response is not None:
        status_code = response.status_code
        request = context.get("request")
        view = context.get("view")

        # Log errors appropriately
        if status_code >= 500:
            logger.error(
                f"Server error {status_code}: {exc}",
                exc_info=True,
                extra={
                    "request_path": request.path if request else None,
                    "view": view.__class__.__name__ if view else None,
                },
            )
        elif status_code >= 400 and status_code != 404:
            logger.warning(
                f"Client error {status_code}: {exc}",
                extra={
                    "request_path": request.path if request else None,
                    "view": view.__class__.__name__ if view else None,
                },
            )

        # Build comprehensive response
        custom_response = {
            "success": False,
            "message": _get_error_message(exc, status_code, response.data),
            "error_code": ERROR_CODES.get(status_code, "UNKNOWN_ERROR"),
            "data": None,
            "timestamp": timezone.now().isoformat(),
            "status_code": status_code,
        }

        # Add validation errors for better UX
        if status_code in [400, 422] and hasattr(response, "data"):
            validation_errors = _extract_validation_errors(response.data)
            if validation_errors:
                custom_response["validation_errors"] = validation_errors

        response.data = custom_response

    return response


def _get_error_message(exc, status_code, response_data):
    """Generate contextual error messages"""
    # Handle JWT authentication errors with friendly messages
    if status_code in [401, 403] and response_data:
        detail = str(response_data.get("detail", "")).lower()
        for pattern, friendly_msg in JWT_ERROR_PATTERNS.items():
            if pattern in detail:
                return friendly_msg

    # Use response detail if it's user-friendly
    if response_data and isinstance(response_data, dict):
        detail = response_data.get("detail")
        if detail and isinstance(detail, str) and len(detail) < 200:
            # Filter out technical details
            technical_terms = ["traceback", "exception", "stack", "django", "python"]
            if not any(term in detail.lower() for term in technical_terms):
                return detail

    # Exception-specific messages
    if isinstance(exc, ValidationError):
        return "The submitted data contains validation errors"
    elif isinstance(
        exc, (AuthenticationFailed, PermissionDenied, DjangoPermissionDenied)
    ):
        return ERROR_MESSAGES.get(status_code, "Access denied")
    elif isinstance(exc, NotFound):
        return "The requested resource could not be found"
    elif isinstance(exc, MethodNotAllowed):
        allowed_methods = getattr(exc, "detail", {}).get("allowed_methods", [])
        if allowed_methods:
            return f"Method not allowed. Allowed methods: {', '.join(allowed_methods)}"
        return "This HTTP method is not allowed for this endpoint"
    elif isinstance(exc, Throttled):
        wait_time = getattr(exc, "wait", None)
        if wait_time:
            return f"Rate limit exceeded. Try again in {int(wait_time)} seconds"
        return ERROR_MESSAGES.get(429)
    elif isinstance(exc, ParseError):
        return "Unable to parse the request data"

    # Fallback to standard messages
    return ERROR_MESSAGES.get(status_code, "An error occurred")


def _extract_validation_errors(data):
    """Extract and format validation errors for better user experience"""
    if not isinstance(data, dict):
        return None

    errors = {}

    for field, messages in data.items():
        if field in ["detail", "message"]:
            continue

        if isinstance(messages, list):
            friendly_messages = []
            for msg in messages:
                msg_str = str(msg)
                # Translate common Django validation messages
                if "required" in msg_str.lower():
                    friendly_messages.append(
                        f"{field.replace('_', ' ').title()} is required"
                    )
                elif "invalid" in msg_str.lower():
                    friendly_messages.append(
                        f"{field.replace('_', ' ').title()} format is invalid"
                    )
                elif "blank" in msg_str.lower():
                    friendly_messages.append(
                        f"{field.replace('_', ' ').title()} cannot be empty"
                    )
                elif "unique" in msg_str.lower():
                    friendly_messages.append(
                        f"{field.replace('_', ' ').title()} must be unique"
                    )
                else:
                    friendly_messages.append(msg_str)
            errors[field] = friendly_messages
        else:
            errors[field] = [str(messages)]

    return errors if errors else None
