from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, viewsets
from rest_framework.pagination import PageNumberPagination

from .models import Crop, Product
from .permissions import IsOwner
from .serializers import CropSerializer, ProductSerializer


class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


@swagger_auto_schema(tags=["Crops - Products"])
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/products
    GET /api/products/{id}
    """

    queryset = Product.objects.all().order_by("name")
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = DefaultPagination


@swagger_auto_schema(tags=["Crops - Management"])
class CropViewSet(viewsets.ModelViewSet):
    """
    POST /api/crops -> crear un cultivo (esta tarea)
    GET /api/crops -> (futuro) listar (idealmente "mine")
    GET /api/crops/{id} -> (futuro) detalle si owner
    PATCH /api/crops/{id} -> (futuro) editar si owner
    DELETE /api/crops/{id} -> (futuro) eliminar si owner
    """

    serializer_class = CropSerializer
    pagination_class = DefaultPagination

    def get_permissions(self):
        # Solo autenticados pueden interactuar con crops.
        if self.action in [
            "create",
            "list",
            "retrieve",
            "update",
            "partial_update",
            "destroy",
        ]:
            base = [permissions.IsAuthenticated]
        else:
            base = [permissions.IsAuthenticated]

        # Para operaciones sobre objeto (retrieve/update/destroy), exigir ownership
        if self.action in ["retrieve", "update", "partial_update", "destroy"]:
            base.append(IsOwner)

        return [perm() for perm in base]

    def get_queryset(self):
        """
        Seguridad por defecto: limitar al owner cuando se liste/lea desde este ViewSet.
        """
        user = self.request.user
        if not user or not user.is_authenticated:
            return Crop.objects.none()
        return Crop.objects.filter(user_id=getattr(user, "id", None)).order_by(
            "-created_at"
        )
