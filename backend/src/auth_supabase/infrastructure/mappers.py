from ..domain.entities import Profile
from .models import ProfileModel

class ProfileMapper:
    @staticmethod
    def to_domain(model: ProfileModel) -> Profile:
        return Profile(
            id=model.internal_id,
            external_auth_id=model.external_auth_id,
            email=model.user.email,
            role=model.role
        )

    @staticmethod
    def to_infrastructure_data(profile: Profile) -> dict:
        return {
            "internal_id": profile.id,
            "external_auth_id": profile.external_auth_id,
            "role": profile.role
        }
