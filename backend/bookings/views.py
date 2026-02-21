
from django.views import View
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .services import ReservaService
from django.shortcuts import render

@method_decorator(csrf_exempt, name='dispatch')
class CrearReservaView(View):

    def get(self, request):
        return render(request, 'reserva.html')

    def post(self, request):
        service = ReservaService()

        data = {
            "terapeuta": request.POST.get('terapeuta'),
            "slot": {"disponible": request.POST.get('slot')},
            "tipo": request.POST.get('tipo')
        }

        service.crear_reserva(request.user, data)
        return JsonResponse({"status": "reserva creada"})