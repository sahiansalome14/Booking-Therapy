import os
import logging
import requests as http_client
from functools import wraps
from flask import request, jsonify, g
from infrastructure.database import get_db
from infrastructure.persistence.repositories import get_profile_by_external_auth_id

logger = logging.getLogger(__name__)

SUPABASE_URL      = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

def _verify_token_with_supabase(token: str) -> str:
    """Valida el token con Supabase y devuelve el external_auth_id (sub)."""
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
    return resp.json().get("id")


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token requerido", "code": "UNAUTHORIZED"}), 401

        token = auth_header.split(" ", 1)[1]
        db    = get_db()
        try:
            external_id = _verify_token_with_supabase(token)
        except PermissionError as e:
            return jsonify({"error": str(e), "code": "INVALID_TOKEN"}), 401
        except Exception:
            logger.exception("Error validando token")
            return jsonify({"error": "Error de autenticación", "code": "AUTH_ERROR"}), 500

        if not external_id:
            return jsonify({"error": "Token sin identidad", "code": "INVALID_TOKEN"}), 401

        profile = get_profile_by_external_auth_id(db, external_id)
        if not profile:
            return jsonify({"error": "Perfil no encontrado", "code": "PROFILE_NOT_FOUND"}), 401

        g.profile = profile
        return f(*args, **kwargs)
    return decorated
