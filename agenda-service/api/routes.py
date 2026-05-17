import logging
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, g

from infrastructure.database import get_db
from infrastructure.auth import require_auth
from infrastructure.persistence.models import Profile, TherapistAvailability, Appointment, TherapistBlock
from infrastructure.persistence.repositories import resolve_therapist, get_profile_by_internal_id
from application.services import generate_slots, book_appointment

logger = logging.getLogger(__name__)

agenda_bp = Blueprint("agenda", __name__)

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
#  ROUTES — Health
# ═══════════════════════════════════════════════════════════════════════════════

@agenda_bp.route("/health")
def health():
    return jsonify({"status": "ok", "service": "agenda-service", "version": "2.0"})


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Terapeutas
# ═══════════════════════════════════════════════════════════════════════════════

@agenda_bp.route("/therapists/", methods=["GET"])
def list_therapists():
    db        = get_db()
    specialty = request.args.get("specialty")
    q         = db.query(Profile).filter(Profile.role == "therapist")
    if specialty and specialty != "Todos":
        q = q.filter(Profile.specialty == specialty)
    return jsonify([profile_to_dict(t) for t in q.all()])


@agenda_bp.route("/therapists/profile/", methods=["GET", "PUT"])
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


@agenda_bp.route("/therapists/<therapist_id>/", methods=["GET"])
def therapist_detail(therapist_id):
    db        = get_db()
    therapist = get_profile_by_internal_id(db, therapist_id)
    if not therapist or therapist.role != "therapist":
        return jsonify({"detail": "Terapeuta no encontrado"}), 404
    return jsonify(profile_to_dict(therapist))


# ═══════════════════════════════════════════════════════════════════════════════
#  ROUTES — Slots
# ═══════════════════════════════════════════════════════════════════════════════

@agenda_bp.route("/slots/", methods=["GET"])
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

@agenda_bp.route("/availability/", methods=["GET", "POST"])
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

@agenda_bp.route("/appointments/", methods=["GET", "POST"])
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


@agenda_bp.route("/appointments/<appointment_id>/", methods=["GET"])
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


@agenda_bp.route("/appointments/<appointment_id>/cancel/", methods=["POST"])
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


@agenda_bp.route("/appointments/<appointment_id>/confirm/", methods=["POST"])
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


@agenda_bp.route("/appointments/<appointment_id>/complete/", methods=["POST"])
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

@agenda_bp.route("/blocks/", methods=["GET", "POST", "DELETE"])
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
