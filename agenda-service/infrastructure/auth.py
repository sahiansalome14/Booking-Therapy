import os
import uuid
import logging
import requests as http_client
from functools import wraps
from flask import request, jsonify, g
from infrastructure.database import get_db
from infrastructure.persistence.models import AuthUser, Profile
from infrastructure.persistence.repositories import get_profile_by_external_auth_id

logger = logging.getLogger(__name__)

SUPABASE_URL      = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


def _verify_token_with_supabase(token: str) -> dict:
    """Valida el token con Supabase y devuelve los datos del usuario."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_URL y SUPABASE_ANON_KEY no configurados.")
    resp = http_client.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey":         SUPABASE_ANON_KEY,
        },
        timeout=8,
    )
    if resp.status_code != 200:
        raise PermissionError("Token inválido o expirado.")
    return resp.json()


def _get_or_create_profile(db, supabase_user: dict) -> Profile:
    """Devuelve el perfil local, creándolo si no existe (sincronización lazy)."""
    external_id = supabase_user.get("id")
    profile = get_profile_by_external_auth_id(db, external_id)
    if profile:
        return profile

    # Extraer datos básicos de Supabase
    email      = supabase_user.get("email", "")
    meta       = supabase_user.get("user_metadata") or {}
    role       = supabase_user.get("role") or meta.get("role", "patient")
    first_name = meta.get("first_name") or meta.get("name", "").split()[0] if meta.get("name") else ""
    last_name  = meta.get("last_name")  or (" ".join(meta.get("name", "").split()[1:]) if meta.get("name") else "")

    # Crear AuthUser espejo
    auth_user = AuthUser(email=email, first_name=first_name, last_name=last_name)
    db.add(auth_user)
    db.flush()  # obtener auth_user.id sin commit aún

    # Crear Profile espejo (reutilizar internal_id de Django si viene en metadata)
    internal_id_meta = meta.get("internal_id")
    profile_kwargs = dict(
        user_id=auth_user.id,
        external_auth_id=external_id,
        role=role,
    )
    if internal_id_meta:
        try:
            profile_kwargs["internal_id"] = uuid.UUID(str(internal_id_meta))
        except (ValueError, AttributeError):
            pass

    profile = Profile(**profile_kwargs)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    logger.info("Perfil auto-creado en agenda-service para %s (role=%s)", email, role)
    return profile


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token requerido", "code": "UNAUTHORIZED"}), 401

        token = auth_header.split(" ", 1)[1]
        db    = get_db()
        try:
            supabase_user = _verify_token_with_supabase(token)
        except PermissionError as e:
            return jsonify({"error": str(e), "code": "INVALID_TOKEN"}), 401
        except Exception:
            logger.exception("Error validando token")
            return jsonify({"error": "Error de autenticación", "code": "AUTH_ERROR"}), 500

        if not supabase_user.get("id"):
            return jsonify({"error": "Token sin identidad", "code": "INVALID_TOKEN"}), 401

        try:
            profile = _get_or_create_profile(db, supabase_user)
        except Exception:
            logger.exception("Error obteniendo/creando perfil")
            return jsonify({"error": "Error interno de perfil", "code": "PROFILE_ERROR"}), 500

        g.profile = profile
        return f(*args, **kwargs)
    return decorated
