# Esto asegura que la aplicación Celery se importe siempre que se inicie Django,
# permitiendo que la anotación @shared_task use esta aplicación.

from .celery import app as celery_app

__all__ = ("celery_app",)
