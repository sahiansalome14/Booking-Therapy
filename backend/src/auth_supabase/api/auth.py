# DRF llama a este backend automáticamente en cada request que requiere autenticación.
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from ..application.auth_service_factory import AuthServiceFactory


# No se persiste: solo existe en memoria durante la petición.
class SupabaseUser:
    def __init__(self, email, sub):
        self.email = email  # Correo del usuario
        self.sub = sub  # ID de Supabase (usado para buscar el perfil interno)
        self.is_active = True

    @property
    def is_authenticated(self):
        # Siempre True: si llegamos aquí, el token fue validado exitosamente
        return True

    @property
    def is_anonymous(self):
        return False


# Implementación de BaseAuthentication que valida el JWT de Supabase.
# Se registra en settings.py bajo DEFAULT_AUTHENTICATION_CLASSES.
class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        print("AUTH EXECUTED")

        # Extrae el token del header Authorization: Bearer <token>
        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        if not token:
            raise exceptions.AuthenticationFailed("Token requerido")
            # return None

        # Delega la validación al servicio de autenticación
        service = AuthServiceFactory.create()
        user_data, status_code = service.verify_token(token)

        print("VERIFY STATUS:", status_code)
        # print("USER DATA:", user_data)

        if status_code != 200:
            raise exceptions.AuthenticationFailed("Token inválido")

        if "email" not in user_data:
            raise exceptions.AuthenticationFailed("Email no presente en token")

        # Retorna (usuario, token) el formato que DRF espera
        return (SupabaseUser(user_data["email"], user_data["id"]), token)
