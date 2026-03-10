from abc import ABC, abstractmethod
from .entities import Profile


# Interfaz para el proveedor de autenticación externo (p.ej. Supabase, Firebase).
# Cualquier implementación concreta debe respetar este contrato.
class AuthProvider(ABC):
    @abstractmethod
    def signup(self, email: str, password: str):
        # Registra un nuevo usuario en el proveedor externo
        pass

    @abstractmethod
    def signin(self, email: str, password: str):
        # Autentica un usuario existente y retorna sus tokens de sesión
        pass

    @abstractmethod
    def get_user(self, token: str):
        # Obtiene la información del usuario a partir de un JWT válido
        pass


# Interfaz para el repositorio de perfiles internos de la plataforma.
# Desacopla la capa de dominio de cualquier motor de base de datos específico.
class ProfileRepository(ABC):
    @abstractmethod
    def get_by_id(self, internal_id: str) -> Profile:
        # Busca un perfil por su UUID interno
        pass

    @abstractmethod
    def get_by_email(self, email: str) -> Profile:
        # Busca un perfil por correo electrónico
        pass

    @abstractmethod
    def get_by_external_auth_id(self, external_id: str) -> Profile:
        # Busca un perfil usando el ID del proveedor externo (Supabase ID)
        pass

    @abstractmethod
    def save_profile(self, profile: Profile) -> Profile:
        # Persiste un perfil nuevo o actualiza uno existente
        pass
