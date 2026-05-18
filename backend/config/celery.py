import os
from celery import Celery

# Establecer el módulo de configuración de Django por defecto para Celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")

# Usar una cadena de configuración de Django para la configuración de Celery.
# namespace='CELERY' significa que todas las configuraciones relacionadas con Celery deben tener el prefijo CELERY_.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Cargar tareas automáticamente de todas las aplicaciones registradas en INSTALLED_APPS
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
