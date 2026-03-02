import os
import requests
from ..domain.repositories import AuthProvider

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")


class SupabaseClient(AuthProvider):

    def __init__(self):
        self.base_url = SUPABASE_URL.rstrip("/")

    def _headers(self):
        return {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        }

    def signup(self, email, password):
        url = f"{self.base_url}/auth/v1/signup"
        return requests.post(url, json={"email": email, "password": password}, headers=self._headers())

    def signin(self, email, password):
        url = f"{self.base_url}/auth/v1/token?grant_type=password"
        return requests.post(url, json={"email": email, "password": password}, headers=self._headers())

    def get_user(self, token):
        url = f"{self.base_url}/auth/v1/user"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",  
            "apikey": SUPABASE_ANON_KEY,
        }
        return requests.get(url, headers=headers)