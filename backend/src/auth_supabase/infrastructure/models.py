# Modelo de infraestructura que representa a un usuario de la plataforma en la base de datos.
# Pertenece a la capa de infraestructura: depende de Django ORM.

import json
import logging
import os
import uuid
from datetime import datetime

import redis
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


class ProfileModel(models.Model):
    ROLE_CHOICES = [
        ("client", "Client"),
        ("therapist", "Therapist"),
    ]

    # UUID interno del sistema, independiente del ID de Supabase
    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Relación con el usuario de Django (necesario para permisos y autenticación DRF)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    # ID externo del proveedor de autenticación (Supabase UUID)
    external_auth_id = models.CharField(
        max_length=255, blank=True, null=True, unique=True
    )

    # Campos exclusivos del perfil de terapeuta
    bio = models.TextField(blank=True, null=True)
    specialty = models.CharField(max_length=255, blank=True, null=True)
    session_price = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    experience_years = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=255, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)

    class Meta:
        db_table = "auth_supabase_profile"

    def __str__(self):
        return f"{self.user.email} ({self.role})"


# ── Publicador de Eventos a Redis (Event-Driven Architecture) ───────────────
@receiver(post_save, sender=ProfileModel)
def publish_profile_event(sender, instance, created, **kwargs):
    """
    Publica eventos de creación o actualización de perfiles en Redis.
    Sincroniza asíncronamente las colas de Agenda y Pagos para lograr consistencia eventual.
    """
    try:
        redis_host = os.getenv("REDIS_HOST", "redis")
        r = redis.Redis(host=redis_host, port=6379, db=0)
        event = {
            "event_id": str(uuid.uuid4()),
            "event_type": "user.created" if created else "user.updated",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "internal_id": str(instance.internal_id),
                "email": instance.user.email,
                "first_name": instance.user.first_name,
                "last_name": instance.user.last_name,
                "role": instance.role,
                "external_auth_id": instance.external_auth_id,
                "bio": instance.bio,
                "specialty": instance.specialty,
                "session_price": float(instance.session_price or 50.00),
                "experience_years": instance.experience_years,
                "location": instance.location,
                "avatar_url": instance.avatar_url,
            },
        }
        # Publicación multicast a las colas de ambos microservicios (consistencia eventual)
        r.rpush("agenda_events_queue", json.dumps(event))
        r.rpush("payments_events_queue", json.dumps(event))
        logger.info(
            f"Publicado evento de perfil {event['event_id']} en Redis: {event['event_type']}"
        )
    except Exception as e:
        logger.error(f"Error publicando evento de perfil en Redis: {str(e)}")
