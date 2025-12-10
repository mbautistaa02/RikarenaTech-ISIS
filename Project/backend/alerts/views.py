from django.db.models import Q

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from users.models import Municipality

from .models import Alert, AlertCategory
from .serializers import (
    AlertCategorySerializer,
    AlertReadSerializer,
    AlertWriteSerrializer,
)


class IsModeratorOrReadOnly(BasePermission):
    """Custom permission to only allow moderators to edit objects."""

    def has_permission(self, request, view):
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True
        return request.user and (
            request.user.groups.filter(name="moderators").exists()
            or request.user.is_staff
        )


class AlertCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Alert Categories (read-only).
    Everyone can view categories.
    """

    queryset = AlertCategory.objects.all().order_by("category_name")
    serializer_class = AlertCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["category_name", "description"]


class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Alerts - Read-only for regular users, Create for moderators.

    Alerts are automatically filtered by user location:
    - Global alerts: Everyone sees them
    - Municipal alerts: Only users in that municipality see them
    - Departmental alerts: Everyone sees them
    """

    queryset = (
        Alert.objects.all()
        .select_related("category", "created_by", "department")
        .prefetch_related("images")
        .order_by("-created_at")
    )

    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["scope", "category"]
    search_fields = ["alert_title", "alert_message"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):  # type: ignore
        """Return write serializer for create, read serializer for list/retrieve"""
        if self.action == "create":
            return AlertWriteSerrializer
        return AlertReadSerializer

    def get_queryset(self):  # type: ignore
        """
        Smart filtering based on user location (scope).

        - Global (scope='global'): Everyone sees (always)
        - Departmental (scope='departamental'): Only users in that department
        """
        queryset = (
            Alert.objects.all()
            .select_related("category", "created_by", "department")
            .prefetch_related("images")
            .order_by("-created_at")
        )

        # Build filters based on user's location
        # Always include global alerts
        filters = Q(scope="global")

        # Add departmental alerts if user has a department
        if self.request.user.is_authenticated and hasattr(self.request.user, "profile"):
            user_profile = self.request.user.profile  # type: ignore
            try:
                municipality = user_profile.municipality
            except Municipality.DoesNotExist:  # type: ignore
                municipality = None

            if municipality and municipality.department:
                filters |= Q(scope="departamental", department=municipality.department)

        return queryset.filter(filters)

    def create(self, request, *args, **kwargs):
        """Create alert - only moderators can do this"""
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        alert = serializer.save()

        # Return the created alert with read serializer
        read_serializer = AlertReadSerializer(alert, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
