from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .services import ReservaService

@method_decorator(csrf_exempt, name='dispatch')
class CrearReservaView(View):

    def post(self, request):
        service = ReservaService()

        data = {
            "terapeuta": "Terapeuta Demo",
            "slot": {"disponible": True},
            "tipo": "Masaje"
        }

        service.crear_reserva(request.user, data)
        return JsonResponse({"status": "reserva creada"})

