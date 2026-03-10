# Fábrica que ensambla el servicio de autenticación con sus dependencias concretas.

# Aplica el patrón de Inyección de Dependencias: AuthService no sabe qué
# implementación de AuthProvider o ProfileRepository está usando

# Si se cambia el proveedor (de Supabase a Firebase), solo se modifica esta clase.
from ..infrastructure.auth_provider_factory import AuthProviderFactory
from ..infrastructure.django_repositories import DjangoProfileRepository
from .services import AuthService


class AuthServiceFactory:
    @staticmethod
    def create() -> AuthService:
        # Construye el servicio inyectando el proveedor de auth y el repositorio de perfiles
        return AuthService(
            auth_provider=AuthProviderFactory.create(),
            profile_repo=DjangoProfileRepository(),
        )
