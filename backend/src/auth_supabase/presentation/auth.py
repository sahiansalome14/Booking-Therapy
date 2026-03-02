from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from ..application.auth_service_factory import AuthServiceFactory


class SupabaseUser:
    def __init__(self, email, sub):
        self.email = email
        self.sub = sub
        self.is_active = True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False


class SupabaseAuthentication(BaseAuthentication):

    def authenticate(self, request):
        print("AUTH EXECUTED")

        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        if not token:
            raise exceptions.AuthenticationFailed("Token requerido")

        service = AuthServiceFactory.create()
        user_data, status_code = service.verify_token(token)

        print("VERIFY STATUS:", status_code)
        print("USER DATA:", user_data)

        if status_code != 200:
            raise exceptions.AuthenticationFailed("Token inválido")

        if "email" not in user_data:
            raise exceptions.AuthenticationFailed("Email no presente en token")
            
        return (SupabaseUser(user_data["email"], user_data["id"]), token)