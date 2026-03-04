from ..infrastructure.models import (
    TherapistAvailability, 
    TherapistBlock, 
    Appointment, 
    GlobalAgendaConfig
)

class AgendaSelector:
    def get_availabilities(self, therapist_id: str):
        return TherapistAvailability.objects.filter(therapist__internal_id=therapist_id).order_by('day_of_week')

    def get_blocks(self, therapist_id: str):
        return TherapistBlock.objects.filter(therapist__internal_id=therapist_id).order_by('start_datetime')

    def get_appointments_by_therapist(self, therapist_id: str):
        return Appointment.objects.filter(therapist__internal_id=therapist_id).order_by('start_datetime')

    def get_appointments_by_patient(self, patient_id: str):
        return Appointment.objects.filter(patient__internal_id=patient_id).order_by('start_datetime')
        
    def get_global_config(self):
        return GlobalAgendaConfig.get_config()
