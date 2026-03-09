from datetime import date, time, datetime, timedelta
from typing import List, Optional
from uuid import UUID, uuid4
from .entities import AvailabilitySlot, Appointment, AppointmentStatus, Therapist

class AvailabilitySlotBuilder:
    """Builder para crear slots individuales paso a paso"""
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        self._slot = AvailabilitySlot(
            id=uuid4(),
            therapist_id=None,
            date=None,
            start_time=None,
            end_time=None,
            is_booked=False
        )
        return self
    
    def with_therapist(self, therapist_id: UUID):
        self._slot.therapist_id = therapist_id
        return self
    
    def on_date(self, date: date):
        self._slot.date = date
        return self
    
    def from_time(self, start_time: time):
        self._slot.start_time = start_time
        return self
    
    def to_time(self, end_time: time):
        self._slot.end_time = end_time
        return self
    
    def build(self) -> AvailabilitySlot:
        """Valida y retorna el slot construido"""
        if not self._slot.therapist_id:
            raise ValueError("Therapist ID is required")
        if not self._slot.date:
            raise ValueError("Date is required")
        if not self._slot.start_time:
            raise ValueError("Start time is required")
        if not self._slot.end_time:
            raise ValueError("End time is required")
        
        return self._slot

class WeeklyScheduleBuilder:
    """Builder para crear horarios completos de la semana"""
    
    def __init__(self, therapist_id: UUID):
        self.therapist_id = therapist_id
        self._slots: List[AvailabilitySlot] = []
        self._slot_duration = 60  # minutos por defecto
    
    def with_slot_duration(self, minutes: int):
        """Define la duración de cada slot (default: 60 min)"""
        self._slot_duration = minutes
        return self
    
    def add_daily_slots(self, date: date, start_hour: int = 9, end_hour: int = 17):
        """
        Crea slots para un día específico
        Ejemplo: add_daily_slots(date(2024, 3, 15), 9, 17) 
        crea slots de 9:00 a 17:00
        """
        current = datetime.combine(date, time(start_hour, 0))
        end = datetime.combine(date, time(end_hour, 0))
        
        while current + timedelta(minutes=self._slot_duration) <= end:
            slot = AvailabilitySlotBuilder()\
                .with_therapist(self.therapist_id)\
                .on_date(date)\
                .from_time(current.time())\
                .to_time((current + timedelta(minutes=self._slot_duration)).time())\
                .build()
            
            self._slots.append(slot)
            current += timedelta(minutes=self._slot_duration)
        
        return self
    
    def add_break(self, date: date, break_start: time, break_end: time):
        """Elimina slots que caen dentro de un break"""
        self._slots = [
            slot for slot in self._slots 
            if not (slot.date == date and 
                   slot.start_time >= break_start and 
                   slot.end_time <= break_end)
        ]
        return self
    
    def build(self) -> List[AvailabilitySlot]:
        """Retorna todos los slots creados"""
        return self._slots

class AppointmentBuilder:
    """Builder para crear citas"""
    
    def __init__(self):
        self._appointment = Appointment(
            id=uuid4(),
            slot_id=None,
            client_id=None,
            therapist_id=None,
            status=AppointmentStatus.SCHEDULED,
            created_at=datetime.now(),
            notes=None
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
        
        return self._appointment