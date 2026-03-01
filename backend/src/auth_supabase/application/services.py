from ..domain.repositories import AuthProvider, ProfileRepository
from .factories import ProfileFactory


class AuthService:

    def __init__(self, auth_provider: AuthProvider, profile_repo: ProfileRepository):
        self._auth_provider = auth_provider
        self._profile_repo = profile_repo

    @property
    def profile_repo(self):
        return self._profile_repo

    def signup(self, email: str, password: str, role: str):
        resp = self._auth_provider.signup(email, password)

        if resp.status_code not in (200, 201):
            return resp.json(), resp.status_code

        data = resp.json()
        user_info = data.get("user", {})
        external_id = user_info.get("id")

        # Use factory to create domain entity
        profile = ProfileFactory.create_entity(
            email=email,
            role=role,
            external_auth_id=external_id
        )

        self._profile_repo.save_profile(profile)

        # Include internal ID in the response
        data.setdefault("user", {})["internal_id"] = str(profile.id)

        return data, resp.status_code

    def signin(self, email: str, password: str):
        resp = self._auth_provider.signin(email, password)

        if resp.status_code != 200:
            return resp.json(), resp.status_code

        data = resp.json()

        profile = self._profile_repo.get_by_email(email)
        if profile:
            data.setdefault("user", {})["role"] = profile.role
            data.setdefault("user", {})["internal_id"] = str(profile.id)
            data.setdefault("user", {})["name"] = f"Usuario {profile.role.capitalize()}" # In the future, this can be the real name from the Profile model

        return data, resp.status_code

    def verify_token(self, token: str):
        resp = self._auth_provider.get_user(token)

        if resp.status_code != 200:
            return resp.json(), resp.status_code

        user_info = resp.json()
        external_id = user_info.get("id")

        if external_id:
            profile = self._profile_repo.get_by_external_auth_id(external_id)
            if profile:
                user_info["role"] = profile.role
                user_info["internal_id"] = str(profile.id)
                user_info["name"] = f"Usuario {profile.role.capitalize()}"

        return user_info, 200