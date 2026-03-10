# Implementación concreta del repositorio de perfiles usando Django ORM.

# Implementa el contrato ProfileRepository definido en el dominio,
# encapsulando toda la lógica de acceso a base de datos en este archivo.
from django.contrib.auth.models import User
from ..domain.entities import Profile
from ..domain.repositories import ProfileRepository
from .models import ProfileModel
from .mappers import ProfileMapper


class DjangoProfileRepository(ProfileRepository):
    def get_by_id(self, internal_id: str) -> Profile:
        # Busca el ProfileModel por UUID interno y lo convierte a entidad de dominio
        model = ProfileModel.objects.filter(internal_id=internal_id).first()
        return ProfileMapper.to_domain(model) if model else None

    def get_by_email(self, email: str) -> Profile:
        # Intenta buscar primero por email, luego por username (ambos almacenan el email)
        model = ProfileModel.objects.filter(user__email=email).first()
        if not model:
            model = ProfileModel.objects.filter(user__username=email).first()
        return ProfileMapper.to_domain(model) if model else None

    def get_by_external_auth_id(self, external_id: str) -> Profile:
        # Busca por el ID de Supabase, usado en la validación del JWT
        model = ProfileModel.objects.filter(external_auth_id=external_id).first()
        return ProfileMapper.to_domain(model) if model else None

    def save_profile(self, profile: Profile) -> Profile:
        # Busca o crea el usuario de Django asociado al perfil
        user = User.objects.filter(email=profile.email).first()
        if not user:
            user = User.objects.filter(username=profile.email).first()

        if not user:
            # Primer acceso: crea el usuario de Django sin contraseña (auth via Supabase)
            user = User.objects.create(
                username=profile.email,
                email=profile.email,
                first_name=profile.full_name,
            )
            user.set_unusable_password()
            user.save()
        else:
            # Sincroniza el nombre si cambió en Supabase
            if user.first_name != profile.full_name:
                user.first_name = profile.full_name
                user.save()

        # Crea o actualiza el ProfileModel vinculado al usuario
        model, created = ProfileModel.objects.update_or_create(
            user=user,
            defaults={
                "internal_id": profile.id,
                "role": profile.role,
                "external_auth_id": profile.external_auth_id,
            },
        )

        return ProfileMapper.to_domain(model)
