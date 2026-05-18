# Servicio de aplicación que orquesta los casos de uso de autenticación y perfiles.
# Contiene toda la lógica de negocio del módulo: registro, login y verificación.

from ..domain.repositories import AuthProvider, ProfileRepository
from .factories import ProfileFactory


class AuthService:
    def __init__(self, auth_provider: AuthProvider, profile_repo: ProfileRepository):
        # Inyección de dependencias: el servicio no conoce qué implementaciones concretas usa
        self._auth_provider = auth_provider
        self._profile_repo = profile_repo

    @property
    def profile_repo(self):
        return self._profile_repo

    def signup(self, email: str, password: str, role: str):
        # Registrar al usuario en el proveedor externo (Supabase)
        resp = self._auth_provider.signup(email, password)

        if resp.status_code not in (200, 201):
            return resp.json(), resp.status_code

        data = resp.json()
        user_info = data.get("user", {})
        external_id = user_info.get("id")
        full_name = user_info.get("user_metadata", {}).get("full_name", "")

        # Crear la entidad de dominio Profile usando la fábrica (con validación de rol)
        profile = ProfileFactory.create_entity(
            email=email, role=role, external_auth_id=external_id, full_name=full_name
        )

        # Persistir el perfil en la base de datos interna
        self._profile_repo.save_profile(profile)

        # Enriquecer la respuesta con el ID interno y el estado del perfil
        data.setdefault("user", {})["internal_id"] = str(profile.id)
        data.setdefault("user", {})["is_profile_complete"] = True

        return data, resp.status_code

    def signin(self, email: str, password: str):
        # Autenticar en el proveedor externo y obtener el JWT
        resp = self._auth_provider.signin(email, password)

        if resp.status_code != 200:
            return resp.json(), resp.status_code

        data = resp.json()

        # Buscar el perfil interno y enriquecer la respuesta con datos de la plataforma
        profile = self._profile_repo.get_by_email(email)
        if profile:
            user_info = data.get("user", {})
            full_name = user_info.get("user_metadata", {}).get("full_name", "")
            if full_name and profile.full_name != full_name:
                # Sincronizar nombre si fue modificado en Supabase
                profile.full_name = full_name
                self._profile_repo.save_profile(profile)

            data.setdefault("user", {})["role"] = profile.role
            data.setdefault("user", {})["internal_id"] = str(profile.id)
            data.setdefault("user", {})["name"] = (
                profile.full_name or f"Usuario {profile.role.capitalize()}"
            )
            data.setdefault("user", {})["is_profile_complete"] = True
        else:
            # Perfil no encontrado: el usuario debe completar su registro
            data.setdefault("user", {})["is_profile_complete"] = False

        return data, resp.status_code

    def verify_token(self, token: str):
        # Validar el JWT contra el proveedor externo
        resp = self._auth_provider.get_user(token)

        if resp.status_code != 200:
            return resp.json(), resp.status_code

        user_info = resp.json()
        external_id = user_info.get("id")

        if external_id:
            # Buscar el perfil interno por el ID de Supabase
            profile = self._profile_repo.get_by_external_auth_id(external_id)
            if profile:
                # Sincronizar el nombre si ha cambiado en Supabase
                full_name = user_info.get("user_metadata", {}).get("full_name", "")
                if full_name and profile.full_name != full_name:
                    profile.full_name = full_name
                    self._profile_repo.save_profile(profile)

                # Enriquecer la respuesta con datos de la plataforma
                user_info["role"] = profile.role
                user_info["internal_id"] = str(profile.id)
                user_info["name"] = (
                    profile.full_name or f"Usuario {profile.role.capitalize()}"
                )
                user_info["is_profile_complete"] = True
            else:
                # Token válido pero sin perfil interno: aún no completó el registro
                user_info["is_profile_complete"] = False
        else:
            user_info["is_profile_complete"] = False

        return user_info, 200
