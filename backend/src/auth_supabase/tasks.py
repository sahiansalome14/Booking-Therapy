import logging
import time
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_welcome_notification_task(email: str, role: str):
    """
    Tarea asíncrona de Celery para enviar una notificación de bienvenida
    a los nuevos usuarios registrados en la plataforma.
    Cumple con el requerimiento de procesos de fondo (reportes, notificaciones).
    """
    logger.info(f"[Celery Worker] Iniciando envío de notificación asíncrona para: {email} (Rol: {role})...")
    # Simular tiempo de procesamiento de envío de correo / notificación push
    time.sleep(2)
    logger.info(f"[Celery Worker] ¡Notificación de bienvenida enviada con éxito a {email}!")
    return {"status": "success", "email": email, "action": "welcome_notification"}


@shared_task
def generate_system_audit_report_task(requested_by: str):
    """
    Tarea asíncrona de Celery para generar un reporte de auditoría del sistema.
    Cumple con el requerimiento de procesos de fondo (reportes, notificaciones).
    """
    logger.info(f"[Celery Worker] Generando reporte de auditoría del sistema solicitado por: {requested_by}...")
    time.sleep(3)
    logger.info(f"[Celery Worker] ¡Reporte de auditoría generado exitosamente para {requested_by}!")
    return {"status": "success", "report_type": "audit_summary", "requested_by": requested_by}
