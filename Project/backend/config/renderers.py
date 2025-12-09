"""
Standard JSON renderer with comprehensive response formatting
"""

from django.utils import timezone

from rest_framework.renderers import JSONRenderer

# Success messages by HTTP status
SUCCESS_MESSAGES = {
    200: "Operation completed successfully",
    201: "Resource created successfully",
    202: "Request accepted for processing",
    204: "Resource deleted successfully",
}

# Action-specific success messages
ACTION_MESSAGES = {
    "list": "Resources retrieved successfully",
    "retrieve": "Resource retrieved successfully",
    "create": "Resource created successfully",
    "update": "Resource updated successfully",
    "partial_update": "Resource updated successfully",
    "destroy": "Resource deleted successfully",
}

# Error messages (fallback for non-exception cases)
ERROR_MESSAGES = {
    400: "Invalid request data provided",
    401: "Authentication credentials required",
    403: "Insufficient permissions for this action",
    404: "Requested resource not found",
    405: "HTTP method not allowed",
    429: "Too many requests - rate limit exceeded",
    500: "Internal server error occurred",
}

# JWT error keyword mappings for user-friendly messages
JWT_ERROR_PATTERNS = {
    "expired": "Your session has expired. Please log in again.",
    "invalid": "Invalid authentication token. Please log in again.",
    "signature": "Authentication token signature is invalid. Please log in again.",
    "decode": "Cannot decode authentication token. Please log in again.",
    "token": "Authentication token error. Please log in again.",
}


class StandardJSONRenderer(JSONRenderer):
    """Renderer that ensures consistent, comprehensive API response format"""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if renderer_context is None:
            return super().render(data, accepted_media_type, renderer_context)

        response = renderer_context.get("response")
        request = renderer_context.get("request")
        view = renderer_context.get("view")

        if response is None:
            return super().render(data, accepted_media_type, renderer_context)

        # Skip formatting if already in standard format
        if self._is_already_formatted(data):
            return super().render(data, accepted_media_type, renderer_context)

        status_code = response.status_code
        is_success = 200 <= status_code < 400

        # Keep pagination info before we strip results
        pagination_meta = (
            self._extract_pagination_meta(data) if is_success else None
        )

        # Build comprehensive response structure
        formatted_data = {
            "success": is_success,
            "message": self._generate_message(data, status_code, view),
            "data": self._extract_response_data(data, is_success),
            "timestamp": timezone.now().isoformat(),
            "status_code": status_code,
        }

        if pagination_meta:
            formatted_data["meta"] = pagination_meta

        # Add request context for debugging (staff users only)
        if (
            request
            and hasattr(request, "user")
            and getattr(request.user, "is_staff", False)
        ):
            formatted_data["request_info"] = {
                "method": request.method,
                "path": request.path,
            }

        return super().render(formatted_data, accepted_media_type, renderer_context)

    def _is_already_formatted(self, data):
        """Check if response is already in standard format"""
        return isinstance(data, dict) and all(
            key in data for key in ["success", "message", "data", "timestamp"]
        )

    def _generate_message(self, data, status_code, view):
        """Generate contextually appropriate response message"""
        # Use existing message or detail from response data
        if isinstance(data, dict):
            if "message" in data:
                return data["message"]
            if "detail" in data:
                detail_str = str(data["detail"])
                # Handle JWT errors with user-friendly messages
                detail_lower = detail_str.lower()
                for pattern, friendly_msg in JWT_ERROR_PATTERNS.items():
                    if pattern in detail_lower:
                        return friendly_msg
                return detail_str

        # Generate contextual success messages
        if 200 <= status_code < 400:
            if view and hasattr(view, "action"):
                action = view.action
                if action in ACTION_MESSAGES:
                    # Customize message with model name if available
                    if hasattr(view, "queryset") and view.queryset is not None:
                        model_name = view.queryset.model._meta.verbose_name
                        return ACTION_MESSAGES[action].replace(
                            "Resource", model_name.title()
                        )
                    return ACTION_MESSAGES[action]

            return SUCCESS_MESSAGES.get(status_code, "Operation successful")

        # Error messages
        return ERROR_MESSAGES.get(status_code, "An error occurred")

    def _extract_response_data(self, original_data, is_success):
        """Extract the actual data payload from response"""
        if not is_success:
            return None

        if isinstance(original_data, dict):
            # Remove control fields to get clean data
            excluded_fields = {"message", "detail", "errors", "non_field_errors"}
            clean_data = {
                k: v for k, v in original_data.items() if k not in excluded_fields
            }

            # For paginated responses, extract results
            if "results" in clean_data:
                return clean_data["results"]

            return clean_data if clean_data else original_data

        return original_data

    def _has_pagination_data(self, data):
        """Check if response contains DRF pagination information"""
        return isinstance(data, dict) and any(
            key in data for key in ["count", "next", "previous", "results"]
        )

    def _extract_pagination_meta(self, data):
        """Extract pagination metadata for client use"""
        if not isinstance(data, dict):
            return None

        results = data.get("results", [])
        return {
            "pagination": {
                "count": data.get("count", 0),
                "next": data.get("next"),
                "previous": data.get("previous"),
                "page_size": len(results) if results else 0,
                "has_next": data.get("next") is not None,
                "has_previous": data.get("previous") is not None,
            }
        }
