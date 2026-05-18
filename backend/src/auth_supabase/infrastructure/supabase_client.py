# Implementación concreta de AuthProvider que se comunica con la API REST de Supabase.
# Si se migra a otro proveedor de auth, este archivo es el único que necesita reemplazarse.

import os
import requests
from ..domain.repositories import AuthProvider


class SupabaseClient(AuthProvider):
    def __init__(self):
        # Leemos las variables dinámicamente en el constructor para asegurar que django-environ ya haya cargado el .env
        self.supabase_url = os.environ.get("SUPABASE_URL") or ""
        self.supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY") or ""
        self.base_url = self.supabase_url.rstrip("/")

    def _headers(self):
        # Headers requeridos por la API de Supabase en cada petición
        return {
            "Content-Type": "application/json",
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {self.supabase_anon_key}",
        }

    def signup(self, email, password):
        # Registra un nuevo usuario en Supabase Auth
        url = f"{self.base_url}/auth/v1/signup"
        return requests.post(
            url, json={"email": email, "password": password}, headers=self._headers()
        )

    def signin(self, email, password):
        # Autentica con email y contraseña, retorna access_token y refresh_token
        url = f"{self.base_url}/auth/v1/token?grant_type=password"
        return requests.post(
            url, json={"email": email, "password": password}, headers=self._headers()
        )

    def get_user(self, token):
        # Valida un JWT y retorna la información del usuario autenticado
        url = f"{self.base_url}/auth/v1/user"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "apikey": self.supabase_anon_key,
        }
        return requests.get(url, headers=headers)
