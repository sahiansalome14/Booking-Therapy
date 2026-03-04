import uuid
from django.db import models
from django.core.exceptions import ValidationError
from auth_supabase.infrastructure.models import ProfileModel
from datetime import time, datetime

class GlobalAgendaConfig(models.Model):
    """
    Configuración global de la plataforma para la agenda.
    Se espera que solo haya una instancia (Singleton).
    """
    hora_inicio_plataforma = models.TimeField(default=time(6, 0))
    hora_fin_plataforma = models.TimeField(default=time(18, 0))
    duracion_sesion_minutos = models.PositiveIntegerField(default=45)
    descanso_minutos = models.PositiveIntegerField(default=15)
    
    class Meta:
        verbose_name = "Configuración Global de Agenda"
        verbose_name_plural = "Configuraciones Globales de Agenda"

    def __str__(self):
        return f"Reglas: {self.hora_inicio_plataforma}-{self.hora_fin_plataforma} ({self.duracion_sesion_minutos}min + {self.descanso_minutos}min)"

    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(id=1)
        return config

class TherapistAvailability(models.Model):
    """
    Disponibilidad semanal recurrente de un terapeuta.
    """
    DAYS_OF_WEEK = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]
    
    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    therapist = models.ForeignKey(
        ProfileModel, 
        on_delete=models.CASCADE, 
        related_name="availabilities",
        limit_choices_to={'role': 'therapist'}
    )
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        db_table = "agenda_therapist_availability"
        unique_together = ["therapist", "day_of_week"]

    def __str__(self):
        return f"{self.therapist} - {self.get_day_of_week_display()} ({self.hora_inicio}-{self.hora_fin})"

class TherapistBlock(models.Model):
    """
    Bloqueos específicos del terapeuta (vacaciones, eventos, etc.).
    """
    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    therapist = models.ForeignKey(
        ProfileModel, 
        on_delete=models.CASCADE, 
        related_name="blocks",
        limit_choices_to={'role': 'therapist'}
    )
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "agenda_therapist_block"

    def clean(self):
        if self.start_datetime >= self.end_datetime:
            raise ValidationError("La fecha de inicio debe ser anterior a la de fin.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class AppointmentStatus(models.TextChoices):
    RESERVADO = "RESERVADO", "Reservado"
    COMPLETADO = "COMPLETADO", "Completado"
    CANCELADO = "CANCELADO", "Cancelado"

class Appointment(models.Model):
    """
    Citas reales reservadas en la plataforma.
    """
    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    therapist = models.ForeignKey(
        ProfileModel, 
        on_delete=models.CASCADE, 
        related_name="appointments_as_therapist",
        limit_choices_to={'role': 'therapist'}
    )
    patient = models.ForeignKey(
        ProfileModel, 
        on_delete=models.CASCADE, 
        related_name="appointments_as_patient",
        limit_choices_to={'role': 'patient'}
    )
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    status = models.CharField(
        max_length=20, 
        choices=AppointmentStatus.choices, 
        default=AppointmentStatus.RESERVADO
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agenda_appointment"
        indexes = [
            models.Index(fields=['start_datetime', 'end_datetime']),
        ]

    def __str__(self):
        return f"Cita: {self.patient} con {self.therapist} ({self.start_datetime})"
