from django.utils.translation import gettext as _
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import OrderSerializer
from ..infrastructure.models import OrderModel
from auth_supabase.application.auth_service_factory import AuthServiceFactory


# Vista para consultar el historial de transacciones del usuario.
class OrderListView(APIView):
    """
    Expone el endpoint para que los pacientes consulten sus pagos.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Recupera y retorna la lista de órdenes asociadas al perfil del usuario autenticado.
        """
        service = AuthServiceFactory.create()
        profile = service.profile_repo.get_by_external_auth_id(request.user.sub)

        if not profile:
            return Response({"detail": _("Perfil no encontrado")}, status=404)

        # Consulta filtrada por el propietario (paciente).
        orders = OrderModel.objects.filter(patient=profile).order_by("-created_at")

        # Transformación a JSON mediante el serializador.
        return Response(OrderSerializer(orders, many=True).data)
