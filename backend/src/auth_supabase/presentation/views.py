# src/auth_supabase/presentation/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from ..application.auth_service_factory import AuthServiceFactory
from django.contrib.auth.models import User
from .auth import SupabaseAuthentication
from .serializers import SignupSerializer, EmailPasswordSerializer, SetRoleSerializer


# Signup
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


# Login
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


# Verify Token
class VerifyTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print("🔍 VerifyTokenView GET CALLED")
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            print("❌ No token provided to VerifyTokenView")
            return Response({"detail": "Token no provisto"}, status=401)

        service = AuthServiceFactory.create()
        data, status_code = service.verify_token(token)
        print("🔍 VerifyTokenView RETURNS:", data)
        return Response(data, status=status_code)



# Provider Redirect (ejemplo OAuth)
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
            from ..application.factories import ProfileFactory
            new_profile = ProfileFactory.create_entity(
                email=user_data["email"],
                role="client",
                external_auth_id=external_id
            )
            service.profile_repo.save_profile(new_profile)
            user_data["role"] = "client"
            user_data["internal_id"] = str(new_profile.id)
        else:
            user_data["role"] = profile.role
            user_data["internal_id"] = str(profile.id)

        return Response(user_data, status=200)


# Set Role (frontend usa /api/auth/set-role/)
class SetRoleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("ENTRÓ A LA VISTA")

        external_id = request.user.id # Supabase ID from request.user (via auth backend)
        email = request.user.email

        serializer = SetRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data["role"]

        service = AuthServiceFactory.create()

        # Check if profile already exists
        profile = service.profile_repo.get_by_external_auth_id(external_id)
        if not profile:
            from ..application.factories import ProfileFactory
            profile = ProfileFactory.create_entity(
                email=email,
                role=role,
                external_auth_id=external_id
            )
        else:
            profile.role = role

        service.profile_repo.save_profile(profile)

        return Response({
            "detail": f"Rol asignado a {role}",
            "internal_id": str(profile.id)
        })