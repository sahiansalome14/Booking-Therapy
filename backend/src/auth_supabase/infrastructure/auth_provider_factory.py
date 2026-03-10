# Fábrica que decide qué implementación concreta de AuthProvider usar,
# basándose en la variable de configuración AUTH_PROVIDER del settings.

from django.conf import settings
from ..domain.repositories import AuthProvider
from .supabase_client import SupabaseClient


class AuthProviderFactory:
    @staticmethod
    def create() -> AuthProvider:
        # Lee el proveedor configurado en settings.py (por defecto: supabase)
        provider = getattr(settings, "AUTH_PROVIDER", "supabase")

        if provider == "supabase":
            return SupabaseClient()

        raise ValueError(f"Unsupported auth provider: {provider}")
