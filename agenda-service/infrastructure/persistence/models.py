import uuid
from datetime import time
from sqlalchemy import (
    Column, String, Integer, Numeric, DateTime, Time, Text, ForeignKey, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from infrastructure.database import Base

class AuthUser(Base):
    __tablename__ = "auth_user"
    id         = Column(Integer, primary_key=True)
    email      = Column(String(254), nullable=False)
    first_name = Column(String(150), default="")
    last_name  = Column(String(150), default="")
    profile    = relationship("Profile", back_populates="user", uselist=False)


class Profile(Base):
    __tablename__ = "auth_supabase_profile"
    id               = Column(Integer, primary_key=True)
    internal_id      = Column(PGUUID(as_uuid=True), unique=True, default=uuid.uuid4)
    user_id          = Column(Integer, ForeignKey("auth_user.id"), nullable=False)
    user             = relationship("AuthUser", back_populates="profile")
    role             = Column(String(20), nullable=False)
    external_auth_id = Column(String(255), unique=True)
    bio              = Column(Text)
    specialty        = Column(String(255))
    session_price    = Column(Numeric(10, 2), default=50.00)
    experience_years = Column(Integer, default=0)
    location         = Column(String(255))
    avatar_url       = Column(String(200))

    @property
    def display_name(self):
        if self.user:
            name = f"{self.user.first_name} {self.user.last_name}".strip()
            return name if name else self.user.email
        return ""

    @property
    def email(self):
        return self.user.email if self.user else ""


class GlobalAgendaConfig(Base):
    __tablename__ = "agenda_globalagendaconfig"
    id                      = Column(Integer, primary_key=True)
    hora_inicio_plataforma  = Column(Time, default=time(6, 0))
    hora_fin_plataforma     = Column(Time, default=time(18, 0))
    duracion_sesion_minutos = Column(Integer, default=45)
    descanso_minutos        = Column(Integer, default=15)


class TherapistAvailability(Base):
    __tablename__  = "agenda_therapist_availability"
    __table_args__ = (UniqueConstraint("therapist_id", "day_of_week"),)
    id           = Column(Integer, primary_key=True)
    internal_id  = Column(PGUUID(as_uuid=True), unique=True, default=uuid.uuid4)
    therapist_id = Column(Integer, ForeignKey("auth_supabase_profile.id"), nullable=False)
    therapist    = relationship("Profile")
    day_of_week  = Column(Integer, nullable=False)
    hora_inicio  = Column(Time, nullable=False)
    hora_fin     = Column(Time, nullable=False)


class TherapistBlock(Base):
    __tablename__ = "agenda_therapist_block"
    id             = Column(Integer, primary_key=True)
    internal_id    = Column(PGUUID(as_uuid=True), unique=True, default=uuid.uuid4)
    therapist_id   = Column(Integer, ForeignKey("auth_supabase_profile.id"), nullable=False)
    therapist      = relationship("Profile")
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime   = Column(DateTime(timezone=True), nullable=False)
    reason         = Column(String(255), default="")


class Appointment(Base):
    __tablename__ = "agenda_appointment"
    id             = Column(Integer, primary_key=True)
    internal_id    = Column(PGUUID(as_uuid=True), unique=True, default=uuid.uuid4)
    therapist_id   = Column(Integer, ForeignKey("auth_supabase_profile.id"), nullable=False)
    therapist      = relationship("Profile", foreign_keys=[therapist_id])
    patient_id     = Column(Integer, ForeignKey("auth_supabase_profile.id"), nullable=False)
    patient        = relationship("Profile", foreign_keys=[patient_id])
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime   = Column(DateTime(timezone=True), nullable=False)
    price          = Column(Numeric(10, 2), default=0)
    status         = Column(String(20), default="PENDIENTE")
    modality       = Column(String(20), default="VIRTUAL")
    meeting_link   = Column(String(500))
    created_at     = Column(DateTime(timezone=True))
    updated_at     = Column(DateTime(timezone=True))
