from .models import TherapistAvailability, TherapistBlock, Appointment, GlobalAgendaConfig
from django.db import transaction

class AvailabilityRepository:
    def get_by_therapist(self, therapist_id: str):
        return TherapistAvailability.objects.filter(therapist__internal_id=therapist_id).all()

    def get_for_day(self, therapist_id: str, day_of_week: int):
        return TherapistAvailability.objects.filter(
            therapist__internal_id=therapist_id, 
            day_of_week=day_of_week
        ).first()

class BlockRepository:
    def get_by_therapist_and_date(self, therapist_id: str, date):
        return TherapistBlock.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__date=date
        ).all()

class AppointmentRepository:
    def get_by_therapist_and_date(self, therapist_id: str, date):
        return Appointment.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__date=date
        ).exclude(status="CANCELADO").all()

    def exists_overlap(self, therapist_id: str, start_dt, end_dt):
        return Appointment.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__lt=end_dt,
            end_datetime__gt=start_dt
        ).exclude(status="CANCELADO").exists()

    @transaction.atomic
    def create(self, **kwargs):
        return Appointment.objects.create(**kwargs)
