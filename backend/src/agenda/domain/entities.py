from dataclasses import dataclass
from datetime import datetime, time
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

class AppointmentStatus(Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

@dataclass
class Therapist:
    id: UUID
    user_id: UUID
    name: str
    specialization: str
    bio: str
    hourly_rate: float
    is_active: bool = True

@dataclass
class AvailabilitySlot:
    id: UUID
    therapist_id: UUID
    date: datetime.date
    start_time: time
    end_time: time
    is_booked: bool = False

@dataclass
class Appointment:
    id: UUID
    slot_id: UUID
    client_id: UUID
    therapist_id: UUID
    status: AppointmentStatus
    created_at: datetime
    notes: Optional[str] = None
    
    def confirm(self):
        if self.status != AppointmentStatus.SCHEDULED:
            raise ValueError("Only scheduled appointments can be confirmed")
        self.status = AppointmentStatus.CONFIRMED
    
    def cancel(self):
        if self.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise ValueError(f"Cannot cancel appointment in {self.status} state")
        self.status = AppointmentStatus.CANCELLED