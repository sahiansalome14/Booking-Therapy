"""
Microservicio de Agenda — Flask (Strangler Pattern)

Endpoints:
  GET    /api/v2/agenda/health
  GET    /api/v2/agenda/therapists/
  GET    /api/v2/agenda/therapists/<id>/
  GET    /api/v2/agenda/therapists/profile/
  PUT    /api/v2/agenda/therapists/profile/
  GET    /api/v2/agenda/slots/
  GET    /api/v2/agenda/availability/
  POST   /api/v2/agenda/availability/
  GET    /api/v2/agenda/appointments/
  POST   /api/v2/agenda/appointments/
  GET    /api/v2/agenda/appointments/<id>/
  POST   /api/v2/agenda/appointments/<id>/cancel/
  POST   /api/v2/agenda/appointments/<id>/confirm/
  POST   /api/v2/agenda/appointments/<id>/complete/
  GET    /api/v2/agenda/blocks/
  POST   /api/v2/agenda/blocks/
  DELETE /api/v2/agenda/blocks/
"""

import os
import uuid
import hashlib
import logging
import requests as http_client
from datetime import datetime, date, time, timedelta, timezone
from functools import wraps

from flask import Flask, jsonify, request, g
from sqlalchemy import (
    create_engine, Column, String, Integer, Numeric,
    DateTime, Time, Text, ForeignKey, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# ── Configuración ─────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

DATABASE_URL      = os.getenv("DATABASE_URL", "postgresql://vis_user:secret@db:5432/vis_vitalis_db")
SUPABASE_URL      = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
PAYMENTS_URL      = os.getenv("PAYMENTS_SERVICE_URL", "http://payments-service:5000")
COLOMBIA_TZ       = timezone(timedelta(hours=-5))

engine       = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base         = declarative_base()


# ═══════════════════════════════════════════════════════════════════════════════
#  INFRASTRUCTURE — SQLAlchemy (espejo de los modelos Django)
# ═══════════════════════════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════════════════════════
#  INFRAESTRUCTURA — Sesión de BD por request
# ═══════════════════════════════════════════════════════════════════════════════

def get_db():
    if "db" not in g:
        g.db = SessionLocal()
    return g.db


@app.teardown_appcontext
def close_db_session(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS — Serialización
# ═══════════════════════════════════════════════════════════════════════════════

STATUS_MAP = {
    "PENDIENTE": "scheduled",
    "RESERVADO":  "confirmed",
    "CANCELADO":  "cancelled",
    "COMPLETADO": "completed",
}


def profile_to_dict(p: Profile) -> dict:
    return {
        "id":               str(p.internal_id),
        "name":             p.display_name,
        "email":            p.email,
        "role":             p.role,
        "specialty":        p.specialty or "",
        "bio":              p.bio or "",
        "session_price":    float(p.session_price or 0),
        "experience_years": p.experience_years or 0,
        "location":         p.location or "",
        "avatar_url":       p.avatar_url,
    }


def appointment_to_dict(a: Appointment) -> dict:
    return {
        "id":                str(a.internal_id),
        "therapist_id":      str(a.therapist.internal_id) if a.therapist else None,
        "therapist_name":    a.therapist.display_name if a.therapist else "",
        "therapist_email":   a.therapist.email if a.therapist else "",
        "therapist_location": a.therapist.location if a.therapist else "",
        "patient_id":        str(a.patient.internal_id) if a.patient else None,
        "patient_name":      a.patient.display_name if a.patient else "",
        "patient_email":     a.patient.email if a.patient else "",
        "start_datetime":    a.start_datetime.isoformat() if a.start_datetime else None,
        "end_datetime":      a.end_datetime.isoformat() if a.end_datetime else None,
        "price":             float(a.price or 0),
        "status":            STATUS_MAP.get(a.status, a.status),
        "modality":          a.modality,
        "meeting_link":      a.meeting_link,
        "created_at":        a.created_at.isoformat() if a.created_at else None,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPERS — Repositorio
# ═══════════════════════════════════════════════════════════════════════════════

def get_profile_by_internal_id(db, internal_id: str):
    return db.query(Profile).filter(Profile.internal_id == internal_id).first()


def get_profile_by_external_auth_id(db, external_auth_id: str):
    return db.query(Profile).filter(Profile.external_auth_id == external_auth_id).first()


def get_or_create_config(db) -> GlobalAgendaConfig:
    config = db.query(GlobalAgendaConfig).filter_by(id=1).first()
    if not config:
        config = GlobalAgendaConfig(id=1)
        db.add(config)
        db.commit()
    return config


def resolve_therapist(db, therapist_id: str):
    """Busca terapeuta por internal_id o external_auth_id."""
    t = get_profile_by_internal_id(db, therapist_id)
    if not t:
        t = get_profile_by_external_auth_id(db, therapist_id)
    return t


# ═══════════════════════════════════════════════════════════════════════════════
#  APPLICATION — Generación de slots disponibles
# ═══════════════════════════════════════════════════════════════════════════════

def generate_slots(db, therapist_internal_id: str, target_date: date) -> list:
    config      = get_or_create_config(db)
    day_of_week = target_date.weekday()

    therapist = get_profile_by_internal_id(db, therapist_internal_id)
    if not therapist:
        return []

    availability = db.query(TherapistAvailability).filter(
        TherapistAvailability.therapist_id == therapist.id,
        TherapistAvailability.day_of_week  == day_of_week,
    ).first()
    if not availability:
        return []

    day_start_local = datetime.combine(target_date, time.min).replace(tzinfo=COLOMBIA_TZ)
    day_end_local   = datetime.combine(target_date, time.max).replace(tzinfo=COLOMBIA_TZ)
    day_start_utc   = day_start_local.astimezone(timezone.utc)
    day_end_utc     = day_end_local.astimezone(timezone.utc)

    blocks = db.query(TherapistBlock).filter(
        TherapistBlock.therapist_id    == therapist.id,
        TherapistBlock.start_datetime  <  day_end_utc,
        TherapistBlock.end_datetime    >  day_start_utc,
    ).all()

    appointments = db.query(Appointment).filter(
        Appointment.therapist_id    == therapist.id,
        Appointment.start_datetime  <  day_end_utc,
        Appointment.end_datetime    >  day_start_utc,
        Appointment.status          != "CANCELADO",
    ).all()

    duration      = config.duracion_sesion_minutos
    rest          = config.descanso_minutos
    cycle_delta   = timedelta(minutes=duration + rest)
    session_delta = timedelta(minutes=duration)

    start_limit = max(availability.hora_inicio, config.hora_inicio_plataforma)
    end_limit   = min(availability.hora_fin,    config.hora_fin_plataforma)

    current_dt   = datetime.combine(target_date, start_limit).replace(tzinfo=COLOMBIA_TZ)
    limit_dt     = datetime.combine(target_date, end_limit).replace(tzinfo=COLOMBIA_TZ)
    now_colombia = datetime.now(COLOMBIA_TZ)

    slots = []
    while current_dt + session_delta <= limit_dt:
        slot_start = current_dt
        slot_end   = current_dt + session_delta

        if slot_start < now_colombia:
            current_dt += cycle_delta
            continue

        is_blocked  = any(b.start_datetime < slot_end and b.end_datetime > slot_start for b in blocks)
        is_reserved = any(a.start_datetime < slot_end and a.end_datetime > slot_start for a in appointments)

        if not is_blocked and not is_reserved:
            slots.append({
                "start":          slot_start.strftime("%H:%M"),
                "end":            slot_end.strftime("%H:%M"),
                "start_datetime": slot_start.astimezone(timezone.utc).isoformat(),
                "end_datetime":   slot_end.astimezone(timezone.utc).isoformat(),
                "date":           target_date.isoformat(),
            })
        current_dt += cycle_delta

    return slots


# ═══════════════════════════════════════════════════════════════════════════════
#  APPLICATION — Reservar cita
# ═══════════════════════════════════════════════════════════════════════════════

def book_appointment(db, therapist_internal_id: str, patient_internal_id: str,
                     target_date: date, start_time_obj: time,
                     modality: str = "VIRTUAL", payment_info: dict = None) -> Appointment:
    available_slots = generate_slots(db, therapist_internal_id, target_date)
    requested_str   = start_time_obj.strftime("%H:%M")
    if not any(s["start"] == requested_str for s in available_slots):
        raise ValueError("El horario solicitado no está disponible o ya pasó.")

    config    = get_or_create_config(db)
    therapist = get_profile_by_internal_id(db, therapist_internal_id)
    patient   = get_profile_by_internal_id(db, patient_internal_id)

    if not therapist:
        raise ValueError("Terapeuta no encontrado.")
    if not patient:
        raise ValueError("Paciente no encontrado.")

    start_dt  = datetime.combine(target_date, start_time_obj).replace(tzinfo=COLOMBIA_TZ)
    end_dt    = start_dt + timedelta(minutes=config.duracion_sesion_minutos)
    start_utc = start_dt.astimezone(timezone.utc)
    end_utc   = end_dt.astimezone(timezone.utc)

    # Verificar colisión
    overlap = db.query(Appointment).filter(
        Appointment.therapist_id   == therapist.id,
        Appointment.start_datetime <  end_utc,
        Appointment.end_datetime   >  start_utc,
        Appointment.status         != "CANCELADO",
    ).first()
    if overlap:
        raise ValueError("Existe un conflicto de horario para esta cita.")

    # Generar link de reunión
    meeting_link = None
    if modality == "VIRTUAL":
        room_name = hashlib.sha256(
            f"{therapist_internal_id}-{patient_internal_id}-{start_utc.isoformat()}".encode()
        ).hexdigest()[:20]
        meeting_link = f"https://meet.jit.si/VisVitalis-{room_name}"

    # Llamar al microservicio de pagos
    items_data = [{
        "type":     "session",
        "id":       therapist_internal_id,
        "name":     f"Sesión con {therapist.display_name}",
        "price":    float(therapist.session_price or 50),
        "quantity": 1,
        "metadata": {"date": str(target_date), "modality": modality},
    }]
    try:
        resp = http_client.post(
            f"{PAYMENTS_URL}/api/v2/payments/process",
            json={"patient_id": patient_internal_id, "items": items_data,
                  "payment_info": payment_info or {}},
            timeout=10,
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Error en el servicio de pagos: {resp.text}")
    except http_client.exceptions.ConnectionError:
        raise RuntimeError("No se pudo conectar al servicio de pagos.")

    now  = datetime.now(timezone.utc)
    appt = Appointment(
        internal_id    = uuid.uuid4(),
        therapist_id   = therapist.id,
        patient_id     = patient.id,
        start_datetime = start_utc,
        end_datetime   = end_utc,
        price          = float(therapist.session_price or 0),
        status         = "RESERVADO",
        modality       = modality,
        meeting_link   = meeting_link,
        created_at     = now,
        updated_at     = now,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTH — Middleware JWT (valida contra Supabase)
# ═══════════════════════════════════════════════════════════════════════════════

def _verify_token_with_supabase(token: str) -> str:
    """Valida el token con Supabase y devuelve el external_auth_id (sub)."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_URL y SUPABASE_ANON_KEY no configurados.")
    resp = http_client.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey":         SUPABASE_ANON_KEY,
        },
        timeout=8,
    )
    if resp.status_code != 200:
        raise PermissionError("Token inválido o expirado.")
    return resp.json().get("id")


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token requerido", "code": "UNAUTHORIZED"}), 401

        token = auth_header.split(" ", 1)[1]
        db    = get_db()
        try:
            external_id = _verify_token_with_supabase(token)
        except PermissionError as e:
            return jsonify({"error": str(e), "code": "INVALID_TOKEN"}), 401
        except Exception as e:
            logger.exception("Error validando token")
            return jsonify({"error": "Error de autenticación", "code": "AUTH_ERROR"}), 500

        if not external_id:
            return jsonify({"error": "Token sin identidad", "code": "INVALID_TOKEN"}), 401

        profile = get_profile_by_external_auth_id(db, external_id)
        if not profile:
            return jsonify({"error": "Perfil no encontrado", "code": "PROFILE_NOT_FOUND"}), 401

        g.profile = profile
        return f(*args, **kwargs)
    return decorated


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Health
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/agenda/health")
def health():
    return jsonify({"status": "ok", "service": "agenda-service", "version": "2.0"})


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Terapeutas
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/agenda/therapists/", methods=["GET"])
def list_therapists():
    db        = get_db()
    specialty = request.args.get("specialty")
    q         = db.query(Profile).filter(Profile.role == "therapist")
    if specialty and specialty != "Todos":
        q = q.filter(Profile.specialty == specialty)
    return jsonify([profile_to_dict(t) for t in q.all()])


@app.route("/api/v2/agenda/therapists/profile/", methods=["GET", "PUT"])
@require_auth
def therapist_own_profile():
    db      = get_db()
    profile = g.profile

    if request.method == "GET":
        return jsonify(profile_to_dict(profile))

    data      = request.get_json(silent=True) or {}
    UPDATABLE = {"bio", "specialty", "session_price", "experience_years", "location", "avatar_url"}
    for field, value in data.items():
        if field in UPDATABLE:
            setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return jsonify(profile_to_dict(profile))


@app.route("/api/v2/agenda/therapists/<therapist_id>/", methods=["GET"])
def therapist_detail(therapist_id):
    db        = get_db()
    therapist = get_profile_by_internal_id(db, therapist_id)
    if not therapist or therapist.role != "therapist":
        return jsonify({"detail": "Terapeuta no encontrado"}), 404
    return jsonify(profile_to_dict(therapist))


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Slots
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/agenda/slots/", methods=["GET"])
def list_slots():
    db           = get_db()
    therapist_id = request.args.get("therapist_id")
    fecha_str    = request.args.get("fecha")

    if not therapist_id or not fecha_str:
        return jsonify({"detail": "Parámetros requeridos: therapist_id y fecha"}), 400

    therapist = resolve_therapist(db, therapist_id)
    if not therapist:
        return jsonify({"detail": "Terapeuta no encontrado"}), 404

    try:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"detail": "Fecha inválida. Usar formato YYYY-MM-DD"}), 400

    try:
        slots = generate_slots(db, str(therapist.internal_id), fecha)
        return jsonify(slots)
    except Exception:
        logger.exception("Error generando slots")
        return jsonify({"detail": "Error interno al calcular disponibilidad"}), 500


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Disponibilidad
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/agenda/availability/", methods=["GET", "POST"])
@require_auth
def availability():
    db = get_db()

    if request.method == "GET":
        therapist_id = request.args.get("therapist_id")
        therapist    = resolve_therapist(db, therapist_id) if therapist_id else g.profile
        if not therapist:
            return jsonify([])
        avails = db.query(TherapistAvailability).filter(
            TherapistAvailability.therapist_id == therapist.id
        ).order_by(TherapistAvailability.day_of_week).all()
        return jsonify([{
            "id":          str(a.internal_id),
            "day_of_week": a.day_of_week,
            "hora_inicio": a.hora_inicio.strftime("%H:%M"),
            "hora_fin":    a.hora_fin.strftime("%H:%M"),
        } for a in avails])

    # POST — sobreescribir disponibilidad
    data          = request.get_json(silent=True) or {}
    availabilities = data.get("availabilities", [])
    therapist      = g.profile

    db.query(TherapistAvailability).filter(
        TherapistAvailability.therapist_id == therapist.id
    ).delete()
    for item in availabilities:
        db.add(TherapistAvailability(
            therapist_id = therapist.id,
            day_of_week  = item["day"],
            hora_inicio  = datetime.strptime(item["start"], "%H:%M").time(),
            hora_fin     = datetime.strptime(item["end"],   "%H:%M").time(),
        ))
    db.commit()
    return jsonify({"detail": "Disponibilidad actualizada"})


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Citas
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/agenda/appointments/", methods=["GET", "POST"])
@require_auth
def appointments():
    db      = get_db()
    profile = g.profile

    if request.method == "GET":
        is_therapist = request.args.get("role") == "therapist"
        if is_therapist:
            appts = db.query(Appointment).filter(Appointment.therapist_id == profile.id).all()
        else:
            appts = db.query(Appointment).filter(Appointment.patient_id == profile.id).all()
        return jsonify([appointment_to_dict(a) for a in appts])

    # POST — crear cita
    data         = request.get_json(silent=True) or {}
    therapist_id = data.get("therapist_id")
    fecha_str    = data.get("target_date")
    hora_str     = data.get("start_time")
    modality     = data.get("modality", "VIRTUAL")
    payment_info = data.get("payment_info", {})

    if not all([therapist_id, fecha_str, hora_str]):
        return jsonify({"detail": "Campos requeridos: therapist_id, target_date, start_time"}), 400

    try:
        fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        hora  = datetime.strptime(hora_str,  "%H:%M").time()
    except ValueError:
        return jsonify({"detail": "Formato inválido: target_date=YYYY-MM-DD, start_time=HH:MM"}), 400

    therapist = resolve_therapist(db, therapist_id)
    if not therapist:
        return jsonify({"detail": "Terapeuta no encontrado"}), 404

    try:
        appt = book_appointment(
            db, str(therapist.internal_id), str(profile.internal_id),
            fecha, hora, modality, payment_info,
        )
        return jsonify(appointment_to_dict(appt)), 201
    except ValueError as e:
        return jsonify({"detail": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"detail": str(e)}), 502
    except Exception:
        logger.exception("Error creando cita")
        return jsonify({"detail": "Error interno al procesar la reserva"}), 500


@app.route("/api/v2/agenda/appointments/<appointment_id>/", methods=["GET"])
@require_auth
def appointment_detail(appointment_id):
    db      = get_db()
    profile = g.profile
    appt    = db.query(Appointment).filter(Appointment.internal_id == appointment_id).first()
    if not appt:
        return jsonify({"detail": "Sesión no encontrada"}), 404
    if appt.therapist_id != profile.id and appt.patient_id != profile.id:
        return jsonify({"detail": "No tienes permiso para ver esta sesión"}), 403
    return jsonify(appointment_to_dict(appt))


@app.route("/api/v2/agenda/appointments/<appointment_id>/cancel/", methods=["POST"])
@require_auth
def cancel_appointment(appointment_id):
    db      = get_db()
    profile = g.profile
    appt    = db.query(Appointment).filter(Appointment.internal_id == appointment_id).first()
    if not appt:
        return jsonify({"detail": "Cita no encontrada"}), 404
    if appt.therapist_id != profile.id and appt.patient_id != profile.id:
        return jsonify({"detail": "No tienes permiso para cancelar esta cita"}), 403
    if appt.status in ("COMPLETADO", "CANCELADO"):
        return jsonify({"detail": f"No se puede cancelar una cita en estado {appt.status}"}), 400
    if appt.start_datetime < datetime.now(timezone.utc):
        return jsonify({"detail": "No se puede cancelar una cita que ya pasó"}), 400
    appt.status     = "CANCELADO"
    appt.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(appt)
    return jsonify(appointment_to_dict(appt))


@app.route("/api/v2/agenda/appointments/<appointment_id>/confirm/", methods=["POST"])
@require_auth
def confirm_appointment(appointment_id):
    db      = get_db()
    profile = g.profile
    appt    = db.query(Appointment).filter(Appointment.internal_id == appointment_id).first()
    if not appt:
        return jsonify({"detail": "Cita no encontrada"}), 404
    if appt.therapist_id != profile.id:
        return jsonify({"detail": "Solo el terapeuta puede confirmar esta cita"}), 403
    if appt.status != "PENDIENTE":
        return jsonify({"detail": "Solo se pueden confirmar citas en estado PENDIENTE"}), 400
    appt.status     = "RESERVADO"
    appt.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(appt)
    return jsonify(appointment_to_dict(appt))


@app.route("/api/v2/agenda/appointments/<appointment_id>/complete/", methods=["POST"])
@require_auth
def complete_appointment(appointment_id):
    db      = get_db()
    profile = g.profile
    appt    = db.query(Appointment).filter(Appointment.internal_id == appointment_id).first()
    if not appt:
        return jsonify({"detail": "Cita no encontrada"}), 404
    if appt.therapist_id != profile.id:
        return jsonify({"detail": "Solo el terapeuta puede completar esta cita"}), 403
    if appt.status != "RESERVADO":
        return jsonify({"detail": "Solo se pueden completar citas en estado RESERVADO"}), 400
    appt.status     = "COMPLETADO"
    appt.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(appt)
    return jsonify(appointment_to_dict(appt))


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Bloqueos
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/agenda/blocks/", methods=["GET", "POST", "DELETE"])
@require_auth
def blocks():
    db      = get_db()
    profile = g.profile

    if request.method == "GET":
        therapist_id = request.args.get("therapist_id")
        therapist    = resolve_therapist(db, therapist_id) if therapist_id else profile
        if not therapist:
            return jsonify([])
        blks = db.query(TherapistBlock).filter(
            TherapistBlock.therapist_id == therapist.id
        ).order_by(TherapistBlock.start_datetime).all()
        return jsonify([{
            "id":             str(b.internal_id),
            "start_datetime": b.start_datetime.isoformat(),
            "end_datetime":   b.end_datetime.isoformat(),
            "reason":         b.reason or "",
        } for b in blks])

    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        try:
            start = datetime.fromisoformat(data["start_datetime"])
            end   = datetime.fromisoformat(data["end_datetime"])
        except (KeyError, ValueError):
            return jsonify({"detail": "start_datetime y end_datetime requeridos (ISO 8601)"}), 400
        if start >= end:
            return jsonify({"detail": "start_datetime debe ser anterior a end_datetime"}), 400
        blk = TherapistBlock(
            therapist_id   = profile.id,
            start_datetime = start,
            end_datetime   = end,
            reason         = data.get("reason", ""),
        )
        db.add(blk)
        db.commit()
        db.refresh(blk)
        return jsonify({
            "id":             str(blk.internal_id),
            "start_datetime": blk.start_datetime.isoformat(),
            "end_datetime":   blk.end_datetime.isoformat(),
            "reason":         blk.reason or "",
        }), 201

    # DELETE
    block_id = request.args.get("block_id")
    if not block_id:
        return jsonify({"detail": "Falta parámetro block_id"}), 400
    blk = db.query(TherapistBlock).filter(
        TherapistBlock.internal_id   == block_id,
        TherapistBlock.therapist_id  == profile.id,
    ).first()
    if not blk:
        return jsonify({"detail": "Bloqueo no encontrado"}), 404
    db.delete(blk)
    db.commit()
    return "", 204


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
