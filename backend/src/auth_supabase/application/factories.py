# Fábrica de entidades de dominio para el módulo de autenticación.

# Centraliza la creación de objetos Profile, garantizando que nunca
# se instancie un perfil con datos inválidos

from ..domain.entities import Profile
import uuid


class ProfileFactory:
    @staticmethod
    def create_entity(
        email: str, role: str, external_auth_id: str = None, full_name: str = ""
    ) -> Profile:
        # Valida que el rol sea uno de los valores permitidos en el sistema
        if role not in ["client", "therapist"]:
            raise ValueError(f"Rol inválido: {role}")

        # Crea y retorna la entidad de dominio
        return Profile(
            id=uuid.uuid4(), external_auth_id=external_auth_id, email=email, role=role
        )
