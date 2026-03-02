from django.conf import settings
from ..domain.repositories import AuthProvider
from .supabase_client import SupabaseClient


class AuthProviderFactory:

    @staticmethod
    def create() -> AuthProvider:
        provider = getattr(settings, "AUTH_PROVIDER", "supabase")

        if provider == "supabase":
            return SupabaseClient()

        raise ValueError(f"Unsupported auth provider: {provider}")