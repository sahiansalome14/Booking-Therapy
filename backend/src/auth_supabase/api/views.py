# Cada vista extiende APIView y delega toda la lógica al Service Layer.
# Las vistas solo: 1) validan entrada con Serializers, 2) llaman al servicio, 3) retornan HTTP response.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..application.auth_service_factory import AuthServiceFactory
from .serializers import SignupSerializer, EmailPasswordSerializer, SetRoleSerializer
from ..application.factories import ProfileFactory


# Registro de nuevos usuarios: valida email, password y rol, luego delega a AuthService.signup()
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = AuthServiceFactory.create()
        data, status_code = service.signup(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
            serializer.validated_data["role"],
        )

        return Response(data, status=status_code)


# Inicio de sesión: valida credenciales y retorna el JWT de Supabase y datos del perfil
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = AuthServiceFactory.create()
        data, status_code = service.signin(
            serializer.validated_data["email"],
            serializer.validated_data["password"],
        )

        return Response(data, status=status_code)


# Verificación de token: confirma que el JWT es válido y retorna los datos del usuario
class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return Response({"detail": "Token no provisto"}, status=401)

        service = AuthServiceFactory.create()
        data, status_code = service.verify_token(token)
        return Response(data, status=status_code)


# Manejo del callback OAuth (Google, etc.): recibe el access_token e identifica al usuario
class ProviderRedirectView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("access_token")
        if not token:
            return Response({"detail": "Token no provisto"}, status=400)

        service = AuthServiceFactory.create()
        user_data, status_code = service.verify_token(token)

        if status_code != 200:
            return Response(user_data, status=status_code)

        external_id = user_data.get("id")
        profile = service.profile_repo.get_by_external_auth_id(external_id)

        if not profile:
            user_data["is_profile_complete"] = False
            user_data["role"] = None
        else:
            user_data["is_profile_complete"] = True
            user_data["role"] = profile.role
            user_data["internal_id"] = str(profile.id)

        return Response(user_data, status=200)


# Asignación de rol post-registro: para usuarios que entraron por OAuth y aún no tienen rol
class SetRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        external_id = (
            request.user.sub
        )  
        email = request.user.email

        serializer = SetRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data["role"]

        service = AuthServiceFactory.create()

        profile = service.profile_repo.get_by_external_auth_id(external_id)
        if not profile:
            profile = ProfileFactory.create_entity(
                email=email, role=role, external_auth_id=external_id
            )
        else:
            profile.role = role

        service.profile_repo.save_profile(profile)

        return Response(
            {"detail": f"Rol asignado a {role}", "internal_id": str(profile.id)}
        )
