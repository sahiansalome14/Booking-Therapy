from django.contrib.auth.models import User
from ..domain.entities import Profile
from ..domain.repositories import ProfileRepository
from .models import ProfileModel
from .mappers import ProfileMapper
from uuid import UUID

class DjangoProfileRepository(ProfileRepository):

    def get_by_id(self, internal_id: str) -> Profile:
        model = ProfileModel.objects.filter(internal_id=internal_id).first()
        return ProfileMapper.to_domain(model) if model else None

    def get_by_email(self, email: str) -> Profile:
        model = ProfileModel.objects.filter(user__email=email).first()
        if not model:
            model = ProfileModel.objects.filter(user__username=email).first()
        return ProfileMapper.to_domain(model) if model else None

    def get_by_external_auth_id(self, external_id: str) -> Profile:
        model = ProfileModel.objects.filter(external_auth_id=external_id).first()
        return ProfileMapper.to_domain(model) if model else None

    def save_profile(self, profile: Profile) -> Profile:
        user = User.objects.filter(email=profile.email).first()
        if not user:
            user = User.objects.filter(username=profile.email).first()
            
        if not user:
            user = User.objects.create(
                username=profile.email,
                email=profile.email
            )
            user.set_unusable_password()
            user.save()

        model, created = ProfileModel.objects.update_or_create(
            user=user,
            defaults={
                "internal_id": profile.id,
                "role": profile.role,
                "external_auth_id": profile.external_auth_id,
            }
        )
        
        return ProfileMapper.to_domain(model)