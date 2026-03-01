import uuid
from django.db import models
from django.contrib.auth.models import User

class ProfileModel(models.Model):
    ROLE_CHOICES = [
        ("client", "Client"),
        ("therapist", "Therapist"),
    ]

    # Use internal_id as the domain UUID
    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    # Renamed from supabase_id to be provider-agnostic
    external_auth_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    class Meta:
        db_table = "auth_supabase_profile"

    def __str__(self):
        return f"{self.user.email} ({self.role})"
