from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from datetime import datetime
from auth_supabase.infrastructure.models import ProfileModel
from django.core.exceptions import ValidationError

from ..application.services import (
    SlotGeneratorService,
    BookingService,
    AvailabilityService,
    BlockService,
    TherapistProfileService,
)
from ..application.selectors import AgendaSelector
from auth_supabase.application.auth_service_factory import AuthServiceFactory
from ..infrastructure.repositories import AppointmentRepository, TherapistRepository
from .serializers import (
    AvailabilitySerializer,
    BlockSerializer,
    AppointmentSerializer,
    CreateAppointmentSerializer,
    TherapistSerializer,
    TherapistProfileUpdateSerializer,
)


# Vista base que proporciona utilidades de resolución de perfiles para todas las vistas de la agenda.
class AgendaBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile_id(self, request):
        """
        Recupera el ID de perfil interno (UUID) del usuario autenticado actualmente.
        """

        service = AuthServiceFactory.create()
        profile = service.profile_repo.get_by_external_auth_id(request.user.sub)
        if not profile:
            return None
        return str(profile.id)

    def resolve_profile_id(self, input_id):
        """
        Intenta encontrar un profile_id válido ya sea recibiendo un UUID o un external_auth_id.
        """
        if not input_id:
            return None

        # ¿Es un internal_id (UUID)?
        try:
            profile = ProfileModel.objects.filter(internal_id=input_id).first()
            if profile:
                return str(profile.internal_id)
        except (ValidationError, ValueError, Exception):
            pass

        # ¿Es un external_auth_id (String de Supabase)
        try:
            profile = ProfileModel.objects.filter(external_auth_id=input_id).first()
            if profile:
                return str(profile.internal_id)
        except Exception:
            pass

        return input_id


# Gestiona la configuración de disponibilidad horaria del terapeuta.
class AvailabilityView(AgendaBaseView):
    def get(self, request):
        # Permite consultar la disponibilidad de un terapeuta específico o la propia.
        therapist_id = self.resolve_profile_id(
            request.query_params.get("therapist_id")
        ) or self.get_profile_id(request)
        selector = AgendaSelector()
        availabilities = selector.get_availabilities(therapist_id)
        return Response(AvailabilitySerializer(availabilities, many=True).data)

    def post(self, request):
        # Actualiza la disponibilidad del terapeuta autenticado.
        therapist_id = self.get_profile_id(request)
        service = AvailabilityService()
        try:
            service.set_availability(
                therapist_id, request.data.get("availabilities", [])
            )
            return Response(
                {"detail": "Disponibilidad actualizada"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Endpoint público para que los pacientes vean qué horas están libres para reservar.
class SlotListView(AgendaBaseView):
    permission_classes = [
        AllowAny
    ]  # Público para permitir reservas sin login previo obligatorio.

    def get(self, request):
        try:
            therapist_id = self.resolve_profile_id(
                request.query_params.get("therapist_id")
            )
            fecha_str = request.query_params.get("fecha")

            if not therapist_id or not fecha_str:
                return Response(
                    {"detail": "Faltan parámetros"}, status=status.HTTP_400_BAD_REQUEST
                )

            try:
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "Fecha inválida (YYYY-MM-DD)"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Delega la lógica pesada de cálculo de slots al servicio correspondiente.
            service = SlotGeneratorService()
            slots = service.execute(therapist_id, fecha)
            return Response(slots)
        except Exception as e:
            import traceback

            print(traceback.format_exc())
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TherapistListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        repo = TherapistRepository()
        specialty = request.query_params.get("specialty")

        # El filtro por especialidad se delega al repositorio (infraestructura),
        # manteniendo la View libre de lógica de negocio.
        if specialty and specialty != "Todos":
            therapists = repo.get_all_active_by_specialty(specialty)
        else:
            therapists = repo.get_all_active()

        return Response(TherapistSerializer(therapists, many=True).data)


# Crud de citas orientado a la visualización y creación.
class AppointmentView(AgendaBaseView):
    def get(self, request):
        profile_id = self.get_profile_id(request)
        selector = AgendaSelector()

        # El contexto cambia dependiendo de si el usuario actúa como terapeuta o paciente.
        is_therapist = request.query_params.get("role") == "therapist"

        if is_therapist:
            appointments = selector.get_appointments_by_therapist(profile_id)
        else:
            appointments = selector.get_appointments_by_patient(profile_id)

        return Response(AppointmentSerializer(appointments, many=True).data)

    def post(self, request):
        # Orquesta la creación de una nueva reserva.
        patient_id = self.get_profile_id(request)
        serializer = CreateAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Delega al BookingService para manejar transacciones y pagos.
        repo = AppointmentRepository()
        service = BookingService(repo)
        try:
            appointment = service.execute(
                therapist_id=str(serializer.validated_data["therapist_id"]),
                patient_id=patient_id,
                target_date=serializer.validated_data["target_date"],
                start_time=serializer.validated_data["start_time"],
                patient_name=serializer.validated_data.get("patient_name"),
                patient_email=serializer.validated_data.get("patient_email"),
                patient_phone=serializer.validated_data.get("patient_phone"),
                payment_info=serializer.validated_data.get("payment_info"),
                modality=serializer.validated_data.get("modality", "VIRTUAL"),
            )
            return Response(
                AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            import traceback

            print(traceback.format_exc())
            return Response(
                {"detail": "Error interno al procesar la reserva"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AppointmentDetailView(AgendaBaseView):
    def get(self, request, appointment_id):
        try:
            profile_id = self.get_profile_id(request)
            selector = AgendaSelector()
            appointment = selector.get_appointment_by_id(str(appointment_id))

            if not appointment:
                return Response(
                    {"detail": "Sesión no encontrada"}, status=status.HTTP_404_NOT_FOUND
                )

            # Verificar permisos (debe ser el paciente o el terapeuta)
            if (
                str(appointment.client_id) != profile_id
                and str(appointment.therapist_id) != profile_id
            ):
                return Response(
                    {"detail": "No tienes permiso para ver esta sesión"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            return Response(AppointmentSerializer(appointment).data)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Gestión de bloqueos manuales por parte del terapeuta.
class BlockView(AgendaBaseView):
    def get(self, request):
        therapist_id = self.resolve_profile_id(
            request.query_params.get("therapist_id")
        ) or self.get_profile_id(request)
        selector = AgendaSelector()
        blocks = selector.get_blocks(therapist_id)
        return Response(BlockSerializer(blocks, many=True).data)

    def post(self, request):
        therapist_id = self.get_profile_id(request)
        serializer = BlockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = BlockService()
        try:
            block = service.create_block(
                therapist_id=therapist_id,
                start_datetime=serializer.validated_data["start_datetime"],
                end_datetime=serializer.validated_data["end_datetime"],
                reason=serializer.validated_data.get("reason", ""),
            )
            return Response(BlockSerializer(block).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        block_id = request.query_params.get("block_id")
        if not block_id:
            return Response(
                {"detail": "Falta block_id"}, status=status.HTTP_400_BAD_REQUEST
            )

        therapist_id = self.get_profile_id(request)
        service = BlockService()
        try:
            service.delete_block(block_id=block_id, therapist_id=therapist_id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)


# Vista de detalle de un terapeuta específico.
class TherapistDetailView(AgendaBaseView):
    permission_classes = [AllowAny]

    def get(self, request, therapist_id):
        repo = TherapistRepository()
        therapist = repo.get_by_internal_id(str(therapist_id))

        if not therapist:
            return Response(
                {"detail": "Terapeuta no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(TherapistSerializer(therapist).data)


# Cancelación.
class AppointmentCancelView(AgendaBaseView):
    def post(self, request, appointment_id):
        profile_id = self.get_profile_id(request)
        service = BookingService(AppointmentRepository())
        try:
            appointment = service.cancel_appointment(str(appointment_id), profile_id)
            return Response(
                AppointmentSerializer(appointment).data, status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Confirmación.
class AppointmentConfirmView(AgendaBaseView):
    def post(self, request, appointment_id):
        therapist_id = self.get_profile_id(request)
        service = BookingService(AppointmentRepository())
        try:
            appointment = service.confirm_appointment(str(appointment_id), therapist_id)
            return Response(
                AppointmentSerializer(appointment).data, status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Finalización.
class AppointmentCompleteView(AgendaBaseView):
    def post(self, request, appointment_id):
        therapist_id = self.get_profile_id(request)
        service = BookingService(AppointmentRepository())
        try:
            appointment = service.complete_appointment(
                str(appointment_id), therapist_id
            )
            return Response(
                AppointmentSerializer(appointment).data, status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# Vista para que el terapeuta gestione sus propios datos de perfil profesional.
class TherapistProfileUpdateView(AgendaBaseView):
    def get(self, request):
        profile_id = self.get_profile_id(request)
        repo = TherapistRepository()
        profile = repo.get_by_internal_id(profile_id)

        if not profile:
            return Response(
                {"detail": "Perfil no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(TherapistSerializer(profile).data)

    def put(self, request):
        profile_id = self.get_profile_id(request)

        serializer = TherapistProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        service = TherapistProfileService()
        try:
            updated_profile = service.update_profile(
                therapist_id=profile_id,
                data=serializer.validated_data,
            )
            return Response(TherapistSerializer(updated_profile).data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
