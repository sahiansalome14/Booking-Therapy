from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from datetime import date
from .entities import Therapist, AvailabilitySlot, Appointment

class TherapistRepository(ABC):
    @abstractmethod
    def get_by_id(self, therapist_id: UUID) -> Optional[Therapist]:
        pass
    
    @abstractmethod
    def get_all_active(self) -> List[Therapist]:
        pass

class AvailabilityRepository(ABC):
    @abstractmethod
    def get_available_slots(self, therapist_id: UUID, date: date) -> List[AvailabilitySlot]:
        pass
    
    @abstractmethod
    def save_slot(self, slot: AvailabilitySlot) -> AvailabilitySlot:
        pass
    
    @abstractmethod
    def book_slot(self, slot_id: UUID) -> bool:
        pass

class AppointmentRepository(ABC):
    @abstractmethod
    def create(self, appointment: Appointment) -> Appointment:
        pass
    
    @abstractmethod
    def get_by_client(self, client_id: UUID) -> List[Appointment]:
        pass
    
    @abstractmethod
    def get_by_therapist(self, therapist_id: UUID) -> List[Appointment]:
        pass