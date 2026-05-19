from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class SignupView(APIView):
    def post(self, request):
        return Response({"message": "Signup endpoint"}, status=status.HTTP_200_OK)

class LoginView(APIView):
    def post(self, request):
        return Response({"message": "Login endpoint"}, status=status.HTTP_200_OK)

class VerifyTokenView(APIView):
    def get(self, request):
        return Response({"message": "Verify token endpoint"}, status=status.HTTP_200_OK)

class ProviderRedirectView(APIView):
    def get(self, request):
        return Response({"message": "Provider redirect"}, status=status.HTTP_200_OK)

class SetRoleView(APIView):
    def post(self, request):
        return Response({"message": "Set role endpoint"}, status=status.HTTP_200_OK)
