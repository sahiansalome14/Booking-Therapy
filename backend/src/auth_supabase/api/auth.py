from rest_framework.authentication import BaseAuthentication

class SupabaseAuthentication(BaseAuthentication):
    def authenticate(self, request):
        return None
