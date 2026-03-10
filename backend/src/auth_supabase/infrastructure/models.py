# Modelo de infraestructura que representa a un usuario de la plataforma en la base de datos.
# Pertenece a la capa de infraestructura: depende de Django ORM.

import uuid
from django.db import models
from django.contrib.auth.models import User


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
