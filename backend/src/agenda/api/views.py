from rest_framework.views import APIView
from rest_framework.response import Response

class AppointmentView(APIView):
    def get(self, request):
        return Response({"message": "Agenda endpoint"})
