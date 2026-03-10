import uuid
from django.db import models
from django.core.exceptions import ValidationError
from auth_supabase.infrastructure.models import ProfileModel
from datetime import time


# Configuración global de la agenda para definir reglas de negocio transversales.
class GlobalAgendaConfig(models.Model):
    """
    Representa la configuración base para el funcionamiento de la agenda en toda la plataforma.
    Se implementa como un Singleton mediante el método de clase get_config.
    """

    # Horarios operativos permitidos por la plataforma para cualquier terapeuta.
    hora_inicio_plataforma = models.TimeField(default=time(6, 0))
    hora_fin_plataforma = models.TimeField(default=time(18, 0))

    # Duración estándar y tiempo de descanso entre sesiones.
    duracion_sesion_minutos = models.PositiveIntegerField(default=45)
    descanso_minutos = models.PositiveIntegerField(default=15)

    class Meta:
        verbose_name = "Configuración Global de Agenda"
        verbose_name_plural = "Configuraciones Globales de Agenda"

    def __str__(self):
        return f"Reglas: {self.hora_inicio_plataforma}-{self.hora_fin_plataforma} ({self.duracion_sesion_minutos}min + {self.descanso_minutos}min)"

    @classmethod
    def get_config(cls):
        # Asegura que siempre exista una instancia de configuración.
        config, created = cls.objects.get_or_create(id=1)
        return config


# Define la disponibilidad semanal que ofrece un terapeuta.
class TherapistAvailability(models.Model):
    """
    Almacena los horarios de atención fijos por día de la semana para cada terapeuta.
    """

    DAYS_OF_WEEK = [
        (0, "Lunes"),
        (1, "Martes"),
        (2, "Miércoles"),
        (3, "Jueves"),
        (4, "Viernes"),
        (5, "Sábado"),
        (6, "Domingo"),
    ]

    # Identificador interno desacoplado del ID de base de datos.
    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Relación con el perfil (debe ser rol 'therapist').
    therapist = models.ForeignKey(
        ProfileModel,
        on_delete=models.CASCADE,
        related_name="availabilities",
        limit_choices_to={"role": "therapist"},
    )

    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        db_table = "agenda_therapist_availability"
        # No se permite más de una configuración de disponibilidad para el mismo día por terapeuta.
        unique_together = ["therapist", "day_of_week"]

    def __str__(self):
        return f"{self.therapist} - {self.get_day_of_week_display()} ({self.hora_inicio}-{self.hora_fin})"


# Representa periodos donde el terapeuta no estará disponible, fuera de su horario recurrente.
class TherapistBlock(models.Model):
    """
    Se utiliza para bloquear espacios específicos como vacaciones, emergencias o eventos personales.
    """

    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    therapist = models.ForeignKey(
        ProfileModel,
        on_delete=models.CASCADE,
        related_name="blocks",
        limit_choices_to={"role": "therapist"},
    )

    # Rango de tiempo exacto del bloqueo.
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()

    # Motivo opcional del bloqueo.
    reason = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "agenda_therapist_block"

    def clean(self):
        # Validación de integridad: el inicio no puede ser posterior al fin.
        if self.start_datetime >= self.end_datetime:
            raise ValidationError("La fecha de inicio debe ser anterior a la de fin.")

    def save(self, *args, **kwargs):
        # Fuerza la validación de dominio antes de persistir en la base de datos.
        self.full_clean()
        super().save(*args, **kwargs)


# Enumeración de estados posibles para una cita.
class AppointmentStatus(models.TextChoices):
    PENDIENTE = (
        "PENDIENTE",
        "Pendiente",
    )  # La cita ha sido solicitada pero no confirmada/pagada.
    RESERVADO = "RESERVADO", "Reservado"  # La cita está confirmada y pagada.
    COMPLETADO = "COMPLETADO", "Completado"  # La sesión ya se llevó a cabo.
    CANCELADO = "CANCELADO", "Cancelado"  # La cita fue anulada.


# Modos de atención ofrecidos.
class AppointmentModality(models.TextChoices):
    VIRTUAL = "VIRTUAL", "Virtual"
    PRESENCIAL = "PRESENCIAL", "Presencial"


# El núcleo del sistema de agenda: las citas entre pacientes y terapeutas.
class Appointment(models.Model):
    """
    Entidad de infraestructura que almacena los detalles de una reserva completada.
    """

    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Referencia al profesional que atiende.
    therapist = models.ForeignKey(
        ProfileModel,
        on_delete=models.CASCADE,
        related_name="appointments_as_therapist",
        limit_choices_to={"role": "therapist"},
    )

    # Referencia al cliente que reserva.
    patient = models.ForeignKey(
        ProfileModel,
        on_delete=models.CASCADE,
        related_name="appointments_as_patient",
        limit_choices_to={"role": "client"},
    )

    # Tiempos precisos de inicio y fin (guardados en UTC).
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()

    # Aspectos económicos de la cita en el momento de la reserva.
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Gestión de estado de la cita.
    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.RESERVADO,
    )

    # Cómo se llevará a cabo la sesión.
    modality = models.CharField(
        max_length=20,
        choices=AppointmentModality.choices,
        default=AppointmentModality.VIRTUAL,
    )

    # Enlace para videollamada si la modalidad es virtual.
    meeting_link = models.URLField(max_length=500, blank=True, null=True)

    # Metadatos de auditoría.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agenda_appointment"
        indexes = [
            models.Index(fields=["start_datetime", "end_datetime"]),
        ]

    def __str__(self):
        return f"Cita: {self.patient} con {self.therapist} ({self.start_datetime})"
