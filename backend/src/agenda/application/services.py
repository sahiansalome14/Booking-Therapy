from datetime import datetime, date, time, timedelta
from django.db import transaction
from ..infrastructure.models import (
    GlobalAgendaConfig, 
    TherapistAvailability, 
    TherapistBlock, 
    Appointment, 
    AppointmentStatus
)
from ..infrastructure.repositories import (
    AvailabilityRepository, 
    BlockRepository, 
    AppointmentRepository
)
from datetime import timezone

COLOMBIA_TZ = timezone(timedelta(hours=-5))

class SlotGeneratorService:
    def execute(self, therapist_id: str, target_date: date):
        config = GlobalAgendaConfig.get_config()
        day_of_week = target_date.weekday()
        
        availability = TherapistAvailability.objects.filter(
            therapist__internal_id=therapist_id, 
            day_of_week=day_of_week
        ).first()
        
        if not availability:
            return []

        day_start_local = datetime.combine(target_date, time.min).replace(tzinfo=COLOMBIA_TZ)
        day_end_local = datetime.combine(target_date, time.max).replace(tzinfo=COLOMBIA_TZ)
        
        day_start_utc = day_start_local.astimezone(timezone.utc)
        day_end_utc = day_end_local.astimezone(timezone.utc)

        blocks = TherapistBlock.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__gte=day_start_utc,
            start_datetime__lte=day_end_utc
        )
        
        appointments = Appointment.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__gte=day_start_utc,
            start_datetime__lte=day_end_utc
        ).exclude(status=AppointmentStatus.CANCELADO)

        duration = config.duracion_sesion_minutos
        rest = config.descanso_minutos
        cycle_delta = timedelta(minutes=duration + rest)
        session_delta = timedelta(minutes=duration)
        
        start_time = max(availability.hora_inicio, config.hora_inicio_plataforma)
        end_limit = min(availability.hora_fin, config.hora_fin_plataforma)
        
        slots = []
        current_dt = datetime.combine(target_date, start_time).replace(tzinfo=COLOMBIA_TZ)
        limit_dt = datetime.combine(target_date, end_limit).replace(tzinfo=COLOMBIA_TZ)
        
        while current_dt + session_delta <= limit_dt:
            slot_start = current_dt 
            slot_end = current_dt + session_delta 
            
            is_blocked = any(
                b.start_datetime < slot_end and b.end_datetime > slot_start 
                for b in blocks
            )
            
            is_reserved = any(
                a.start_datetime < slot_end and a.end_datetime > slot_start 
                for a in appointments
            )
            
            if not is_blocked and not is_reserved:
                slots.append({
                    "start": slot_start.strftime("%H:%M"),
                    "end": slot_end.strftime("%H:%M"),
                    "start_datetime": slot_start.astimezone(timezone.utc).isoformat(),
                    "end_datetime": slot_end.astimezone(timezone.utc).isoformat(),
                    "date": target_date.isoformat()
                })
            
            current_dt += cycle_delta
            
        return slots

class BookingService:
    def __init__(self, appointment_repo: AppointmentRepository):
        self.appointment_repo = appointment_repo
        self.slot_generator = SlotGeneratorService()

    @transaction.atomic
    def execute(self, therapist_id: str, patient_id: str, target_date: date, start_time: time):

        available_slots = self.slot_generator.execute(therapist_id, target_date)
        
        requested_time_str = start_time.strftime("%H:%M")
        is_valid_slot = any(s["start"] == requested_time_str for s in available_slots)
        
        if not is_valid_slot:
            raise ValueError("El horario solicitado no está disponible o es inválido.")
        
        # Verificar overlap en DB 
        config = GlobalAgendaConfig.get_config()
        start_dt = datetime.combine(target_date, start_time).replace(tzinfo=COLOMBIA_TZ)
        end_dt = start_dt + timedelta(minutes=config.duracion_sesion_minutos)
        
        start_dt_utc = start_dt.astimezone(timezone.utc)
        end_dt_utc = end_dt.astimezone(timezone.utc)
        
        if self.appointment_repo.exists_overlap(therapist_id, start_dt_utc, end_dt_utc):
            raise ValueError("Existe un conflicto de horario para esta cita.")
            
        # Crear appointment
        from auth_supabase.infrastructure.models import ProfileModel
        therapist = ProfileModel.objects.get(internal_id=therapist_id)
        patient = ProfileModel.objects.get(internal_id=patient_id)
        
        return self.appointment_repo.create(
            therapist=therapist,
            patient=patient,
            start_datetime=start_dt_utc,
            end_datetime=end_dt_utc,
            status=AppointmentStatus.RESERVADO
        )

class AvailabilityService:
    def set_availability(self, therapist_id: str, availabilities_data: list):
        with transaction.atomic():
            TherapistAvailability.objects.filter(therapist__internal_id=therapist_id).delete()
            from auth_supabase.infrastructure.models import ProfileModel
            therapist = ProfileModel.objects.get(internal_id=therapist_id)
            
            new_availabilities = []
            for item in availabilities_data:
                new_availabilities.append(TherapistAvailability(
                    therapist=therapist,
                    day_of_week=item['day'],
                    hora_inicio=item['start'],
                    hora_fin=item['end']
                ))
            TherapistAvailability.objects.bulk_create(new_availabilities)
        return True
