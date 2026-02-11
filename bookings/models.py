from django.db import models

from django.db import models
from django.contrib.auth.models import User

class Sesion(models.Model):
    cliente = models.ForeignKey(User, on_delete=models.CASCADE)
    terapeuta = models.CharField(max_length=255)
    slot = models.JSONField()  
    tipo = models.CharField(max_length=100)
    confirmado = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sesion de {self.cliente} con {self.terapeuta}"

