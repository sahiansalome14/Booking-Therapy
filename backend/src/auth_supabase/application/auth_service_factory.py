from ..infrastructure.auth_provider_factory import AuthProviderFactory
from ..infrastructure.django_repositories import DjangoProfileRepository
from .services import AuthService


class AuthServiceFactory:

    @staticmethod
    def create() -> AuthService:
        return AuthService(
            auth_provider=AuthProviderFactory.create(),
            profile_repo=DjangoProfileRepository(),
        )