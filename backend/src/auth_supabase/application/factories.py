from ..domain.entities import Profile
import uuid

class ProfileFactory:
    @staticmethod
    def create_entity(email: str, role: str, external_auth_id: str = None) -> Profile:
        if role not in ["client", "therapist"]:
            raise ValueError(f"Rol inválido: {role}")
            
        return Profile(
            id=uuid.uuid4(),
            external_auth_id=external_auth_id,
            email=email,
            role=role
        )
