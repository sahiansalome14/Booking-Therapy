from abc import ABC, abstractmethod


class AuthProvider(ABC):

    @abstractmethod
    def signup(self, email: str, password: str):
        pass

    @abstractmethod
    def signin(self, email: str, password: str):
        pass

    @abstractmethod
    def get_user(self, token: str):
        pass


from .entities import Profile

class ProfileRepository(ABC):

    @abstractmethod
    def get_by_id(self, internal_id: str) -> Profile:
        pass

    @abstractmethod
    def get_by_email(self, email: str) -> Profile:
        pass

    @abstractmethod
    def get_by_external_auth_id(self, external_id: str) -> Profile:
        pass

    @abstractmethod
    def save_profile(self, profile: Profile) -> Profile:
        pass