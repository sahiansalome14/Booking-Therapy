import logging
from django.utils.translation import gettext as _
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..application.auth_service_factory import AuthServiceFactory
from ..application.factories import ProfileFactory

logger = logging.getLogger(__name__)


class SignupView(APIView):
    """
    Registra un usuario en Supabase y crea su perfil interno en Django.
    """
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        role = request.data.get("role")

        if not email or not password or not role:
            return Response(
                {"error": _("Faltan campos requeridos: email, contraseña y rol son obligatorios.")},
                status=status.HTTP_400_BAD_REQUEST
            )

        auth_service = AuthServiceFactory.create()
        try:
            data, status_code = auth_service.signup(email, password, role)
            return Response(data, status=status_code)
        except Exception as e:
            logger.error(f"Error in SignupView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Autentica al usuario en Supabase y retorna sus datos junto con el perfil interno.
    """
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": _("Faltan campos requeridos: email y contraseña son obligatorios.")},
                status=status.HTTP_400_BAD_REQUEST
            )

        auth_service = AuthServiceFactory.create()
        try:
            data, status_code = auth_service.signin(email, password)
            return Response(data, status=status_code)
        except Exception as e:
            logger.error(f"Error in LoginView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class VerifyTokenView(APIView):
    """
    Valida el token Bearer JWT contra Supabase y retorna la información enriquecida del perfil.
    """
    def get(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"error": _("Se requiere token de autorización")},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = auth_header.split(" ")[1]
        auth_service = AuthServiceFactory.create()
        try:
            user_info, status_code = auth_service.verify_token(token)
            return Response(user_info, status=status_code)
        except Exception as e:
            logger.error(f"Error in VerifyTokenView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


class ProviderRedirectView(APIView):
    """
    Endpoint opcional para redirecciones de proveedores de terceros (OAuth).
    """
    def get(self, request):
        return Response({"message": _("Redirección de proveedor")}, status=status.HTTP_200_OK)


class SetRoleView(APIView):
    """
    Asigna o actualiza el rol de un usuario authenticated a través de su token JWT.
    Sincroniza el perfil interno con Django y publica el evento en Redis.
    """
    def post(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return Response(
                {"error": _("Se requiere token de autorización")},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = auth_header.split(" ")[1]
        role = request.data.get("role")

        if not role or role not in ("client", "therapist"):
            return Response(
                {"error": _("Rol inválido o faltante. Debe ser 'client' o 'therapist'.")},
                status=status.HTTP_400_BAD_REQUEST
            )

        auth_service = AuthServiceFactory.create()
        try:
            # 1. Verificar token y obtener información del usuario de Supabase
            user_info, status_code = auth_service.verify_token(token)
            if status_code != 200:
                return Response(user_info, status=status_code)

            external_id = user_info.get("id")
            email = user_info.get("email")

            if not external_id or not email:
                return Response(
                    {"error": _("Detalles de token inválidos retornados por el proveedor de autenticación.")},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Buscar si ya existe el perfil por id externo o email
            profile = auth_service.profile_repo.get_by_external_auth_id(external_id)
            if not profile:
                profile = auth_service.profile_repo.get_by_email(email)

            if profile:
                # Actualizar el rol del perfil existente
                profile.role = role
            else:
                # Crear un nuevo perfil de dominio usando la fábrica
                full_name = user_info.get("user_metadata", {}).get("full_name", "")
                profile = ProfileFactory.create_entity(
                    email=email,
                    role=role,
                    external_auth_id=external_id,
                    full_name=full_name
                )

            # 3. Persistir el perfil (activa el post_save para sincronizar en Redis)
            auth_service.profile_repo.save_profile(profile)

            # 4. Encolar notificación de bienvenida asíncrona mediante Celery
            try:
                from ..tasks import send_welcome_notification_task
                send_welcome_notification_task.delay(email, role)
                logger.info(f"[Celery] Tarea de bienvenida encolada desde SetRoleView para {email}")
            except Exception as celery_err:
                logger.error(f"[Celery] Error encolando tarea de bienvenida en SetRoleView: {str(celery_err)}")

            return Response(
                {
                    "message": _("Rol asignado exitosamente"),
                    "role": role,
                    "internal_id": str(profile.id)
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error in SetRoleView: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
