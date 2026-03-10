from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID


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
    email: str
    specialization: str
    bio: str
    hourly_rate: float
    experience_years: int = 0
    location: str = ""
    avatar_url: Optional[str] = None
    is_active: bool = True


@dataclass
class Appointment:
    id: UUID
    slot_id: UUID
    client_id: UUID
    therapist_id: UUID
    status: AppointmentStatus
    start_datetime: datetime
    end_datetime: datetime
    created_at: datetime
    patient_name: str = ""
    patient_email: str = ""
    therapist_name: str = ""
    therapist_email: str = ""
    therapist_location: str = ""
    modality: str = "VIRTUAL"
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    price: float = 0.0

    def confirm(self):
        if self.status != AppointmentStatus.SCHEDULED:
            raise ValueError("Only scheduled appointments can be confirmed")
        self.status = AppointmentStatus.CONFIRMED

    def cancel(self):
        if self.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]:
            raise ValueError(f"Cannot cancel appointment in {self.status} state")
        self.status = AppointmentStatus.CANCELLED

    def complete(self):
        if self.status != AppointmentStatus.CONFIRMED:
            raise ValueError("Only confirmed appointments can be completed")
        self.status = AppointmentStatus.COMPLETED
