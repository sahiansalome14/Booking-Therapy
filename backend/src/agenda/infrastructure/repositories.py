from typing import List, Optional
from uuid import UUID
from ..domain.repositories import (
    TherapistRepository,
    AppointmentRepository,
)
from ..domain.entities import (
    Therapist as DomainTherapist,
    Appointment as DomainAppointment,
    AppointmentStatus as DomainStatus,
)
from .models import (
    Appointment as DjangoAppointment,
    AppointmentStatus as DjangoStatus,
)
from auth_supabase.infrastructure.models import ProfileModel


class TherapistRepository(TherapistRepository):
    """
    Implementación concreta del repositorio de terapeutas utilizando Django ORM.
    Se encarga de la persistencia y recuperación de perfiles profesionales.
    """

    def get_by_id(self, therapist_id: UUID) -> Optional[DomainTherapist]:
        """
        Busca un terapeuta por su internal_id.
        """
        profile = ProfileModel.objects.filter(
            internal_id=therapist_id, role="therapist"
        ).first()
        if not profile:
            return None
        return self._to_domain(profile)

    def get_by_internal_id(self, internal_id: str) -> Optional[DomainTherapist]:
        """
        Versión del buscador que acepta ID como string.
        """
        try:
            profile = ProfileModel.objects.get(
                internal_id=internal_id, role="therapist"
            )
            return self._to_domain(profile)
        except ProfileModel.DoesNotExist:
            return None

    def get_all_active(self) -> List[DomainTherapist]:
        """
        Retorna la lista de todos los terapeutas activos registrados.
        """
        profiles = ProfileModel.objects.filter(role="therapist")
        return [self._to_domain(p) for p in profiles]

    def get_all_active_by_specialty(self, specialty: str) -> List[DomainTherapist]:
        """
        Retorna terapeutas activos filtrados por especialidad.
        El filtro se realiza en base de datos (ORM), no en la capa de presentación.
        """
        profiles = ProfileModel.objects.filter(role="therapist", specialty=specialty)
        return [self._to_domain(p) for p in profiles]

    def _to_domain(self, profile: ProfileModel) -> DomainTherapist:
        """
        Mapea un modelo de infraestructura (Django ProfileModel)
        a una entidad de dominio
        """
        return DomainTherapist(
            id=profile.internal_id,
            user_id=profile.user.id,
            name=f"{profile.user.first_name} {profile.user.last_name}"
            if profile.user.first_name
            else profile.user.email,
            email=profile.user.email,
            specialization=profile.specialty or "",
            bio=profile.bio or "",
            hourly_rate=float(profile.session_price or 0.0),
            experience_years=profile.experience_years or 0,
            location=profile.location or "",
            avatar_url=profile.avatar_url,
            is_active=True,
        )


class AppointmentRepository(AppointmentRepository):
    """
    Implementación del repositorio de citas que conecta el dominio con Django.
    Maneja la persistencia de Appointment y el mapeo de estados.
    """

    def create(self, appointment: DomainAppointment) -> DomainAppointment:
        """
        Crea una nueva cita en la base de datos a partir de una entidad de dominio.
        """
        django_status = self._map_to_django_status(appointment.status)

        therapist = ProfileModel.objects.get(internal_id=appointment.therapist_id)
        patient = ProfileModel.objects.get(internal_id=appointment.client_id)

        DjangoAppointment.objects.create(
            internal_id=appointment.id,
            therapist=therapist,
            patient=patient,
            start_datetime=appointment.start_datetime,
            end_datetime=appointment.end_datetime,
            status=django_status,
            price=appointment.price,
            modality=appointment.modality,
            meeting_link=appointment.meeting_link,
        )
        return appointment

    def get_by_id(self, appointment_id: UUID) -> Optional[DomainAppointment]:
        """
        Recupera una cita por su UUID interno.
        """
        appointment = DjangoAppointment.objects.filter(
            internal_id=appointment_id
        ).first()
        if not appointment:
            return None
        return self._to_domain(appointment)

    def save(self, appointment: DomainAppointment) -> DomainAppointment:
        """
        Actualiza el estado de una cita existente.
        """
        django_appointment = DjangoAppointment.objects.get(internal_id=appointment.id)
        django_appointment.status = self._map_to_django_status(appointment.status)
        django_appointment.save()
        return appointment

    def get_by_client(self, client_id: UUID) -> List[DomainAppointment]:
        """
        Obtiene el historial de citas de un paciente.
        """
        appointments = DjangoAppointment.objects.filter(patient__internal_id=client_id)
        return [self._to_domain(a) for a in appointments]

    def get_by_therapist(self, therapist_id: UUID) -> List[DomainAppointment]:
        """
        Obtiene el listado de citas de un terapeuta.
        """
        appointments = DjangoAppointment.objects.filter(
            therapist__internal_id=therapist_id
        )
        return [self._to_domain(a) for a in appointments]

    def exists_overlap(self, therapist_id: str, start_dt, end_dt):
        """
        Verifica si existen citas que se traslapen con el horario dado
        para evitar duplicidad de reservas.
        """
        return (
            DjangoAppointment.objects.filter(
                therapist__internal_id=therapist_id,
                start_datetime__lt=end_dt,
                end_datetime__gt=start_dt,
            )
            .exclude(status=DjangoStatus.CANCELADO)
            .exists()
        )

    def _to_domain(self, appointment: DjangoAppointment) -> DomainAppointment:
        """
        Convierte un modelo Django Appointment a una entidad de dominio pura.
        """
        return DomainAppointment(
            id=appointment.internal_id,
            slot_id=None,  # Slot ID no existe directamente en el modelo Django
            client_id=appointment.patient.internal_id,
            therapist_id=appointment.therapist.internal_id,
            status=self._map_to_domain_status(appointment.status),
            start_datetime=appointment.start_datetime,
            end_datetime=appointment.end_datetime,
            created_at=appointment.created_at,
            patient_name=appointment.patient.user.get_full_name()
            or appointment.patient.user.email,
            patient_email=appointment.patient.user.email,
            therapist_name=appointment.therapist.user.get_full_name()
            or appointment.therapist.user.email,
            therapist_email=appointment.therapist.user.email,
            therapist_location=appointment.therapist.location,
            price=float(appointment.price),
            modality=appointment.modality,
            meeting_link=appointment.meeting_link,
        )

    def _map_to_django_status(self, domain_status: DomainStatus) -> str:
        """
        Mapea estados del dominio a estados de Infraestructura
        """
        mapping = {
            DomainStatus.SCHEDULED: DjangoStatus.PENDIENTE,
            DomainStatus.CONFIRMED: DjangoStatus.RESERVADO,
            DomainStatus.CANCELLED: DjangoStatus.CANCELADO,
            DomainStatus.COMPLETED: DjangoStatus.COMPLETADO,
        }
        return mapping.get(domain_status, DjangoStatus.PENDIENTE)

    def _map_to_domain_status(self, django_status: str) -> DomainStatus:
        """
        Mapea estados de Infraestructura a estados del dominio
        """
        mapping = {
            DjangoStatus.PENDIENTE: DomainStatus.SCHEDULED,
            DjangoStatus.RESERVADO: DomainStatus.CONFIRMED,
            DjangoStatus.CANCELADO: DomainStatus.CANCELLED,
            DjangoStatus.COMPLETADO: DomainStatus.COMPLETED,
        }
        return mapping.get(django_status, DomainStatus.SCHEDULED)