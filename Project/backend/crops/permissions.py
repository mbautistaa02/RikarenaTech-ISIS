from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsOwner(BasePermission):
    """
    Permite acceso solo si el objeto pertenece al usuario autenticado.
    Para GET/PUT/PATCH/DELETE en endpoints de detalle.
    """

    def has_object_permission(self, request, view, obj):
        # obj.user_id es un entero; request.user.id debe coincidir
        try:
            return obj.user_id == getattr(request.user, "id", None)
        except Exception:
            return False