import os
import uuid
import hashlib
import logging
import requests as http_client
from datetime import datetime, date, time, timedelta, timezone

from infrastructure.persistence.models import (
    TherapistAvailability, TherapistBlock, Appointment
)
from infrastructure.persistence.repositories import (
    get_profile_by_internal_id, get_or_create_config
)

logger = logging.getLogger(__name__)

COLOMBIA_TZ = timezone(timedelta(hours=-5))
PAYMENTS_URL = os.getenv("PAYMENTS_SERVICE_URL", "http://payments-service:5000")

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
