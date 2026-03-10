from datetime import datetime
from uuid import UUID, uuid4
from .entities import Appointment, AppointmentStatus


class AppointmentBuilder:
    """Builder para crear citas"""

    def __init__(self):
        self._appointment = Appointment(
            id=uuid4(),
            slot_id=None,
            client_id=None,
            therapist_id=None,
            status=AppointmentStatus.SCHEDULED,
            start_datetime=None,
            end_datetime=None,
            created_at=datetime.now(),
            notes=None,
            price=0.0,
        )

    def for_client(self, client_id: UUID):
        self._appointment.client_id = client_id
        return self

    def for_slot(self, slot_id: UUID):
        self._appointment.slot_id = slot_id
        return self

    def with_therapist(self, therapist_id: UUID):
        self._appointment.therapist_id = therapist_id
        return self

    def with_schedule(self, start_dt: datetime, end_dt: datetime):
        self._appointment.start_datetime = start_dt
        self._appointment.end_datetime = end_dt
        return self

    def with_price(self, price: float):
        self._appointment.price = price
        return self

    def with_modality(self, modality: str):
        self._appointment.modality = modality
        return self

    def with_meeting_link(self, meeting_link: str):
        self._appointment.meeting_link = meeting_link
        return self

    def with_notes(self, notes: str):
        self._appointment.notes = notes
        return self

    def build(self) -> Appointment:
        """Valida y retorna la cita construida"""
        if not self._appointment.client_id:
            raise ValueError("Client ID is required")
        if not self._appointment.slot_id:
            raise ValueError("Slot ID is required")
        if not self._appointment.therapist_id:
            raise ValueError("Therapist ID is required")
        if not self._appointment.start_datetime or not self._appointment.end_datetime:
            raise ValueError("Schedule (start/end) is required")

        return self._appointment
