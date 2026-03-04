from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import datetime

from ..application.services import SlotGeneratorService, BookingService, AvailabilityService
from ..application.selectors import AgendaSelector
from ..infrastructure.repositories import AppointmentRepository
from .serializers import (
    SlotSerializer, 
    AvailabilitySerializer, 
    BlockSerializer, 
    AppointmentSerializer,
    CreateAppointmentSerializer
)

class AgendaBaseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_profile_id(self, request):
        from auth_supabase.application.auth_service_factory import AuthServiceFactory
        service = AuthServiceFactory.create()
        profile = service.profile_repo.get_by_external_auth_id(request.user.sub)
        if not profile:
            return None
        return str(profile.id)

    def resolve_profile_id(self, input_id):
        if not input_id:
            return None
        from auth_supabase.infrastructure.models import ProfileModel
        from django.db.models import Q
        try:
            profile = ProfileModel.objects.filter(
                Q(internal_id=input_id) | Q(external_auth_id=input_id)
            ).first()
            if profile:
                return str(profile.internal_id)
        except Exception:
            pass
        return input_id

class AvailabilityView(AgendaBaseView):
    def get(self, request):
        therapist_id = self.resolve_profile_id(request.query_params.get("therapist_id")) or self.get_profile_id(request)
        selector = AgendaSelector()
        availabilities = selector.get_availabilities(therapist_id)
        return Response(AvailabilitySerializer(availabilities, many=True).data)

    def post(self, request):
        therapist_id = self.get_profile_id(request)
        service = AvailabilityService()
        try:
            service.set_availability(therapist_id, request.data.get("availabilities", []))
            return Response({"detail": "Disponibilidad actualizada"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SlotListView(AgendaBaseView):
    def get(self, request):
        therapist_id = self.resolve_profile_id(request.query_params.get("therapist_id"))
        fecha_str = request.query_params.get("fecha")
        
        if not therapist_id or not fecha_str:
            return Response({"detail": "Faltan parámetros"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Fecha inválida (YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)

        service = SlotGeneratorService()
        slots = service.execute(therapist_id, fecha)
        return Response(slots)

class AppointmentView(AgendaBaseView):
    def get(self, request):
        profile_id = self.get_profile_id(request)
        selector = AgendaSelector()
        # Ver citas como terapeuta o como paciente
        is_therapist = request.query_params.get("role") == "therapist"
        
        if is_therapist:
            appointments = selector.get_appointments_by_therapist(profile_id)
        else:
            appointments = selector.get_appointments_by_patient(profile_id)
            
        return Response(AppointmentSerializer(appointments, many=True).data)

    def post(self, request):
        patient_id = self.get_profile_id(request)
        serializer = CreateAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        service = BookingService(AppointmentRepository())
        try:
            appointment = service.execute(
                therapist_id=str(serializer.validated_data["therapist_id"]),
                patient_id=patient_id,
                target_date=serializer.validated_data["target_date"],
                start_time=serializer.validated_data["start_time"]
            )
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BlockView(AgendaBaseView):
    def get(self, request):
        therapist_id = self.resolve_profile_id(request.query_params.get("therapist_id")) or self.get_profile_id(request)
        selector = AgendaSelector()
        blocks = selector.get_blocks(therapist_id)
        return Response(BlockSerializer(blocks, many=True).data)

    def post(self, request):
        therapist_id = self.get_profile_id(request)
        from ..infrastructure.models import TherapistBlock
        from auth_supabase.infrastructure.models import ProfileModel
        
        therapist = ProfileModel.objects.get(internal_id=therapist_id)
        
        serializer = BlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        block = TherapistBlock.objects.create(
            therapist=therapist,
            start_datetime=serializer.validated_data["start_datetime"],
            end_datetime=serializer.validated_data["end_datetime"],
            reason=serializer.validated_data.get("reason", "")
        )
        return Response(BlockSerializer(block).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        block_id = request.query_params.get("block_id")
        if not block_id:
            return Response({"detail": "Falta block_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        therapist_id = self.get_profile_id(request)
        from ..infrastructure.models import TherapistBlock
        try:
            block = TherapistBlock.objects.get(internal_id=block_id, therapist__internal_id=therapist_id)
            block.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except TherapistBlock.DoesNotExist:
            return Response({"detail": "Bloqueo no encontrado"}, status=status.HTTP_404_NOT_FOUND)
