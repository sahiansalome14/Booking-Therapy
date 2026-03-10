# Mapeador (Mapper) entre la capa de dominio y la capa de infraestructura.
# ProfileModel (Django ORM) a Profile (entidad de dominio pura)

from ..domain.entities import Profile
from .models import ProfileModel


class ProfileMapper:
    @staticmethod
    def to_domain(model: ProfileModel) -> Profile:
        # Convierte un modelo de Django en una entidad de dominio pura
        return Profile(
            id=model.internal_id,
            external_auth_id=model.external_auth_id,
            email=model.user.email,
            role=model.role,
            full_name=model.user.first_name,
        )

    @staticmethod
    def to_infrastructure_data(profile: Profile) -> dict:
        # Extrae los campos necesarios para guardar/actualizar en la base de datos
        return {
            "internal_id": profile.id,
            "external_auth_id": profile.external_auth_id,
            "role": profile.role,
        }
