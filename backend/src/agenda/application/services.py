from datetime import datetime, date, time, timedelta
from django.db import transaction
from ..infrastructure.models import (
    GlobalAgendaConfig,
    TherapistAvailability,
    TherapistBlock,
    Appointment,
    AppointmentStatus,
)
from ..infrastructure.repositories import AppointmentRepository
from datetime import timezone
from auth_supabase.infrastructure.models import ProfileModel
from payments.application.services import OrderService
from payments.infrastructure.repositories import OrderRepository


# Definición de la zona horaria local para Colombia.
COLOMBIA_TZ = timezone(timedelta(hours=-5))


# Servicio encargado de calcular los espacios (slots) disponibles para una fecha.
class SlotGeneratorService:
    """
    Lógica de negocio para transformar la disponibilidad y bloqueos
    en opciones reales de reserva para el paciente.
    """

    def execute(self, therapist_id: str, target_date: date):
        # Obtener configuración global
        config = GlobalAgendaConfig.get_config()
        day_of_week = target_date.weekday()

        # Verificar si el terapeuta trabaja ese día de la semana
        availability = TherapistAvailability.objects.filter(
            therapist__internal_id=therapist_id, day_of_week=day_of_week
        ).first()

        if not availability:
            return []

        # Definir límites del día en zona horaria local y convertir a UTC para consultas DB
        day_start_local = datetime.combine(target_date, time.min).replace(
            tzinfo=COLOMBIA_TZ
        )
        day_end_local = datetime.combine(target_date, time.max).replace(
            tzinfo=COLOMBIA_TZ
        )

        day_start_utc = day_start_local.astimezone(timezone.utc)
        day_end_utc = day_end_local.astimezone(timezone.utc)

        # Obtener bloqueos y citas existentes para cruzar información
        blocks = TherapistBlock.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__gte=day_start_utc,
            start_datetime__lte=day_end_utc,
        )

        appointments = Appointment.objects.filter(
            therapist__internal_id=therapist_id,
            start_datetime__gte=day_start_utc,
            start_datetime__lte=day_end_utc,
        ).exclude(status=AppointmentStatus.CANCELADO)

        # Parámetros de generación de slots
        duration = config.duracion_sesion_minutos
        rest = config.descanso_minutos
        cycle_delta = timedelta(minutes=duration + rest)  # Ciclo = Sesión + Descanso
        session_delta = timedelta(minutes=duration)

        # Lapsos exactos de trabajo (intersección entre reglas globales y disponibilidad del terapeuta)
        start_time = max(availability.hora_inicio, config.hora_inicio_plataforma)
        end_limit = min(availability.hora_fin, config.hora_fin_plataforma)

        slots = []
        current_dt = datetime.combine(target_date, start_time).replace(
            tzinfo=COLOMBIA_TZ
        )
        limit_dt = datetime.combine(target_date, end_limit).replace(tzinfo=COLOMBIA_TZ)

        # Iterar para generar cada slot posible en el horario
        while current_dt + session_delta <= limit_dt:
            slot_start = current_dt
            slot_end = current_dt + session_delta

            # No permitir reservar espacios que ya pasaron en el tiempo real
            now_colombia = datetime.now(COLOMBIA_TZ)
            if slot_start < now_colombia:
                current_dt += cycle_delta
                continue

            # Verificar si el slot se solapa con algún bloqueo (vacaciones/eventos)
            is_blocked = any(
                b.start_datetime < slot_end and b.end_datetime > slot_start
                for b in blocks
            )

            # Verificar si el slot se solapa con una cita ya reservada
            is_reserved = any(
                a.start_datetime < slot_end and a.end_datetime > slot_start
                for a in appointments
            )

            # Si el espacio está totalmente libre, se añade a la lista
            if not is_blocked and not is_reserved:
                slots.append(
                    {
                        "start": slot_start.strftime("%H:%M"),
                        "end": slot_end.strftime("%H:%M"),
                        "start_datetime": slot_start.astimezone(
                            timezone.utc
                        ).isoformat(),
                        "end_datetime": slot_end.astimezone(timezone.utc).isoformat(),
                        "date": target_date.isoformat(),
                    }
                )

            # Avanzar al siguiente ciclo (sesión + descanso)
            current_dt += cycle_delta

        return slots


# Servicio principal para el flujo de reserva de citas.
class BookingService:
    """
    Coordina la validación, el pago y la creación final de una cita.
    Representa un Caso de Uso.
    """

    def __init__(self, appointment_repo: AppointmentRepository):
        self.appointment_repo = appointment_repo
        self.slot_generator = SlotGeneratorService()

    @transaction.atomic
    def execute(
        self,
        therapist_id: str,
        patient_id: str,
        target_date: date,
        start_time: time,
        patient_name: str = None,
        patient_email: str = None,
        patient_phone: str = None,
        payment_info: dict = None,
        modality: str = "VIRTUAL",
    ):
        from ..domain.builders import AppointmentBuilder
        from uuid import UUID, uuid4

        # Doble validación: ¿El slot sigue estando disponible?
        available_slots = self.slot_generator.execute(therapist_id, target_date)

        requested_time_str = start_time.strftime("%H:%M")
        is_valid_slot = any(s["start"] == requested_time_str for s in available_slots)

        if not is_valid_slot:
            raise ValueError(
                "El horario solicitado no está disponible o es inválido (puede estar en el pasado o ya reservado)."
            )

        # Validación de colisiones en base de datos
        config = GlobalAgendaConfig.get_config()
        start_dt = datetime.combine(target_date, start_time).replace(tzinfo=COLOMBIA_TZ)
        end_dt = start_dt + timedelta(minutes=config.duracion_sesion_minutos)

        start_dt_utc = start_dt.astimezone(timezone.utc)
        end_dt_utc = end_dt.astimezone(timezone.utc)

        if self.appointment_repo.exists_overlap(therapist_id, start_dt_utc, end_dt_utc):
            raise ValueError("Existe un conflicto de horario para esta cita.")

        # Recuperar perfiles involucrados
        therapist = ProfileModel.objects.get(internal_id=therapist_id)

        # Generación de recursos para la sesión
        meeting_link = None
        if modality == "VIRTUAL":
            import hashlib

            # Generar una sala para Jitsi
            room_name = hashlib.sha256(
                f"{therapist_id}-{patient_id}-{start_dt_utc.isoformat()}".encode()
            ).hexdigest()[:20]
            meeting_link = f"https://meet.jit.si/VisVitalis-{room_name}"

        # Orquestación del proceso de pago
        items_data = [
            {
                "type": "session",
                "id": therapist_id,
                "name": f"Sesión con {therapist.user.email}",
                "price": float(therapist.session_price),
                "quantity": 1,
                "metadata": {
                    "date": str(target_date),
                    "time": str(start_time),
                    "modality": modality,
                },
            }
        ]

        # Se procesa mediante el servicio de órdenes (que usa Builder y Factory de pagos)
        payment_service = OrderService(OrderRepository())
        payment_service.process_booking_payment(
            patient_id=patient_id,
            items_data=items_data,
            payment_info=payment_info or {},
        )

        # 6. Si el pago es exitoso, persistir la cita usando el Domain Builder
        domain_appointment = (
            AppointmentBuilder()
            .with_therapist(UUID(therapist_id))
            .for_client(UUID(patient_id))
            .for_slot(uuid4())  # ID temporal para el slot
            .with_schedule(start_dt_utc, end_dt_utc)
            .with_price(float(therapist.session_price))
            .with_modality(modality)
            .with_meeting_link(meeting_link)
            .build()
        )

        # Guardar en repositorio (que ahora maneja modality y link)
        return self.appointment_repo.create(domain_appointment)

    def cancel_appointment(self, appointment_id: str, profile_id: str):
        """
        Permite anular una reserva verificando permisos y reglas temporales.
        """
        from uuid import UUID

        appointment_domain = self.appointment_repo.get_by_id(UUID(appointment_id))
        if not appointment_domain:
            raise ValueError("Cita no encontrada.")

        # Solo los participantes pueden cancelar
        if (
            str(appointment_domain.therapist_id) != profile_id
            and str(appointment_domain.client_id) != profile_id
        ):
            raise ValueError("No tienes permiso para cancelar esta cita.")

        # Regla de negocio: No se cancelan citas pasadas
        now_colombia = datetime.now(COLOMBIA_TZ)
        if appointment_domain.start_datetime < now_colombia:
            raise ValueError("No se puede cancelar una cita que ya ha pasado.")

        # Lógica de dominio encapsulada
        appointment_domain.cancel()

        return self.appointment_repo.save(appointment_domain)

    def confirm_appointment(self, appointment_id: str, therapist_id: str):
        """
        Cambia el estado de SOLICITADO (Scheduled) a RESERVADO (Confirmed).
        """
        from uuid import UUID

        appointment_domain = self.appointment_repo.get_by_id(UUID(appointment_id))
        if not appointment_domain:
            raise ValueError("Cita no encontrada.")

        if str(appointment_domain.therapist_id) != therapist_id:
            raise ValueError("No tienes permiso para confirmar esta cita.")

        # Lógica de dominio
        appointment_domain.confirm()

        return self.appointment_repo.save(appointment_domain)

    def complete_appointment(self, appointment_id: str, therapist_id: str):
        """
        Cierre administrativo de la sesión. Solo el terapeuta puede completarla.
        """
        from uuid import UUID

        appointment_domain = self.appointment_repo.get_by_id(UUID(appointment_id))
        if not appointment_domain:
            raise ValueError("Cita no encontrada.")

        if str(appointment_domain.therapist_id) != therapist_id:
            raise ValueError("No tienes permiso para marcar esta cita como completada.")

        # Lógica de dominio
        appointment_domain.complete()

        return self.appointment_repo.save(appointment_domain)


# Servicio para la gestión de horarios de trabajo de los profesionales.
class AvailabilityService:
    def set_availability(self, therapist_id: str, availabilities_data: list):
        """
        Actualiza de forma masiva los días y horas de atención de un terapeuta.
        """
        with transaction.atomic():
            # Limpiar disponibilidad previa para sobreescribir con la nueva configuración
            TherapistAvailability.objects.filter(
                therapist__internal_id=therapist_id
            ).delete()

            therapist = ProfileModel.objects.get(internal_id=therapist_id)

            new_availabilities = []
            for item in availabilities_data:
                new_availabilities.append(
                    TherapistAvailability(
                        therapist=therapist,
                        day_of_week=item["day"],
                        hora_inicio=item["start"],
                        hora_fin=item["end"],
                    )
                )
            # Inserción
            TherapistAvailability.objects.bulk_create(new_availabilities)
        return True


# Servicio para gestionar excepciones manuales en la agenda.
class BlockService:
    """Gestiona los bloqueos temporales (vacaciones, eventos) en la agenda de un terapeuta."""

    def create_block(
        self, therapist_id: str, start_datetime, end_datetime, reason: str = ""
    ) -> TherapistBlock:
        from auth_supabase.infrastructure.models import ProfileModel

        therapist = ProfileModel.objects.get(internal_id=therapist_id)
        block = TherapistBlock(
            therapist=therapist,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            reason=reason,
        )
        # Dispara validaciones de modelo (ej: start < end)
        block.full_clean()
        block.save()
        return block

    def delete_block(self, block_id: str, therapist_id: str) -> None:
        try:
            block = TherapistBlock.objects.get(
                internal_id=block_id,
                therapist__internal_id=therapist_id,
            )
            block.delete()
        except TherapistBlock.DoesNotExist:
            raise ValueError("Bloqueo no encontrado.")


# Servicio para la actualización de la información profesional del terapeuta.
class TherapistProfileService:
    """Encapsula la lógica de actualización de perfiles profesionales."""

    # Solo permitimos actualizar ciertos campos no de datos críticos
    UPDATABLE_FIELDS = {
        "bio",
        "specialty",
        "session_price",
        "experience_years",
        "location",
        "avatar_url",
    }

    def update_profile(self, therapist_id: str, data: dict):
        # Aseguramos que el perfil existe y tiene el rol correcto
        therapist = ProfileModel.objects.get(internal_id=therapist_id, role="therapist")

        for field, value in data.items():
            if field in self.UPDATABLE_FIELDS:
                setattr(therapist, field, value)

        # Guardar solo los campos modificados
        therapist.save(update_fields=[f for f in data if f in self.UPDATABLE_FIELDS])
        return therapist
