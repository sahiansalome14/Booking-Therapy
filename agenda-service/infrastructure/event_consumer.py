import os
import sys
import json
import time
import logging
import redis
from datetime import datetime

# Añadir directorio raíz al path para resolver las importaciones del paquete
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from infrastructure.database import SessionLocal, Base, engine
from infrastructure.persistence.models import AuthUser, Profile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("event_consumer")

# Configuración del broker Redis y colas de resiliencia
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
QUEUE_NAME = "agenda_events_queue"
DLQ_NAME = "agenda_events_dlq"
PROCESSED_SET = "processed_event_ids"

# Políticas de reintento exponencial
MAX_RETRIES = 5
INITIAL_BACKOFF = 1.0  # segundos


def process_event(event_data):
    """
    Procesa y persiste el evento de sincronización de usuario en la base de datos de la Agenda.
    """
    event_id = event_data.get("event_id")
    event_type = event_data.get("event_type")
    data = event_data.get("data", {})

    if not event_id or not event_type:
        logger.error(f"Estructura de evento inválida: {event_data}")
        return True

    # ── Control de Idempotencia mediante Redis ──
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)
    is_new = r.sadd(PROCESSED_SET, event_id)
    if is_new == 0:
        logger.info(f"Evento {event_id} ya procesado previamente. Omitiendo.")
        return True

    # ── Sincronización Transaccional en Base de Datos Aislada ──
    db = SessionLocal()
    try:
        email = data.get("email")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        internal_id = data.get("internal_id")

        # Resolver e insertar/actualizar el registro de AuthUser
        user = db.query(AuthUser).filter(AuthUser.email == email).first()
        if not user:
            user = AuthUser(
                email=email, first_name=first_name, last_name=last_name
            )
            db.add(user)
            db.flush()  # Obtener el ID autogenerado del usuario
        else:
            user.first_name = first_name
            user.last_name = last_name

        # Resolver e insertar/actualizar el perfil del usuario (consistencia eventual)
        profile = (
            db.query(Profile).filter(Profile.internal_id == internal_id).first()
        )
        if not profile:
            profile = Profile(
                internal_id=internal_id,
                user_id=user.id,
                role=data.get("role"),
                external_auth_id=data.get("external_auth_id"),
                bio=data.get("bio"),
                specialty=data.get("specialty"),
                session_price=data.get("session_price", 50.0),
                experience_years=data.get("experience_years", 0),
                location=data.get("location"),
                avatar_url=data.get("avatar_url"),
            )
            db.add(profile)
        else:
            profile.role = data.get("role")
            profile.external_auth_id = data.get("external_auth_id")
            profile.bio = data.get("bio")
            profile.specialty = data.get("specialty")
            profile.session_price = data.get("session_price", 50.0)
            profile.experience_years = data.get("experience_years", 0)
            profile.location = data.get("location")
            profile.avatar_url = data.get("avatar_url")

        db.commit()
        logger.info(
            f"Evento {event_id} ({event_type}) procesado con éxito para: {email}"
        )
        return True
    except Exception as e:
        db.rollback()
        # Remover el ID del evento de Redis en caso de fallo para permitir reintentos
        r.srem(PROCESSED_SET, event_id)
        logger.error(
            f"Fallo de escritura en base de datos para el evento {event_id}: {str(e)}"
        )
        raise e
    finally:
        db.close()


def run_consumer():
    """
    Inicializa el consumidor, crea las tablas si no existen y arranca el loop de escucha.
    """
    logger.info("Inicializando tablas DDL en la base de datos de la Agenda...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas de base de datos inicializadas con éxito.")
    except Exception as e:
        logger.error(f"Fallo al inicializar base de datos: {str(e)}")

    logger.info(f"Conectando a Redis en {REDIS_HOST}:{REDIS_PORT}...")
    r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

    logger.info(
        f"Consumidor de eventos iniciado. Escuchando cola '{QUEUE_NAME}'..."
    )
    while True:
        try:
            # BLPOP bloquea de forma eficiente hasta recibir un nuevo evento
            message = r.blpop(QUEUE_NAME, timeout=10)
            if not message:
                continue

            queue, raw_data = message
            event_data = json.loads(raw_data.decode("utf-8"))

            logger.info(
                f"Recibido evento: {event_data.get('event_type')} (ID: {event_data.get('event_id')})"
            )

            # Loop de resiliencia con Backoff Exponencial
            success = False
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    process_event(event_data)
                    success = True
                    break
                except Exception as e:
                    backoff = INITIAL_BACKOFF * (2 ** (attempt - 1))
                    logger.warning(
                        f"Intento {attempt}/{MAX_RETRIES} fallido para evento {event_data.get('event_id')}. Reintentando en {backoff}s... Error: {str(e)}"
                    )
                    time.sleep(backoff)

            # Si se agotan los reintentos, se enruta a la Dead Letter Queue (DLQ)
            if not success:
                logger.error(
                    f"Máximos reintentos alcanzados para evento {event_data.get('event_id')}. Enrutando a DLQ: {DLQ_NAME}"
                )
                event_data["dlq_metadata"] = {
                    "routed_at": datetime.now().isoformat(),
                    "reason": "Max retries exceeded",
                }
                r.rpush(DLQ_NAME, json.dumps(event_data))

        except KeyboardInterrupt:
            logger.info("Consumidor de eventos detenido por teclado.")
            break
        except Exception as e:
            logger.error(f"Error inesperado en el loop del consumidor: {str(e)}")
            time.sleep(2)


if __name__ == "__main__":
    run_consumer()
