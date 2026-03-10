from ..infrastructure.repositories import AppointmentRepository
from uuid import UUID


class AgendaSelector:
    """
    Selector encargado de las operaciones de lectura (queries) de la agenda.
    Mantiene la lógica de consulta separada de los servicios
    """

    def __init__(self):
        self.appointment_repo = AppointmentRepository()

    def get_availabilities(self, therapist_id: str):
        """
        Recupera los horarios de atención de un terapeuta
        ordenados por día de la semana.
        """
        from ..infrastructure.models import TherapistAvailability

        return TherapistAvailability.objects.filter(
            therapist__internal_id=therapist_id
        ).order_by("day_of_week")

    def get_blocks(self, therapist_id: str):
        """
        Recupera los bloqueos manuales (vacaciones, excepciones) de un terapeuta
        ordenados cronológicamente.
        """
        from ..infrastructure.models import TherapistBlock

        return TherapistBlock.objects.filter(
            therapist__internal_id=therapist_id
        ).order_by("start_datetime")

    def get_appointments_by_therapist(self, therapist_id: str):
        """
        Obtiene todas las citas asociadas a un profesional específico.
        Devuelve entidades de dominio.
        """
        return self.appointment_repo.get_by_therapist(UUID(therapist_id))

    def get_appointments_by_patient(self, patient_id: str):
        """
        Obtiene todas las citas reservadas por un paciente.
        Devuelve entidades de dominio.
        """
        return self.appointment_repo.get_by_client(UUID(patient_id))

    def get_global_config(self):
        """
        Acceso a la configuración global de la plataforma para la agenda.
        """
        from ..infrastructure.models import GlobalAgendaConfig

        return GlobalAgendaConfig.get_config()
