# Todos los endpoints se registran bajo el prefijo /api/v1/auth/ (definido en config/urls.py).
from django.urls import path
from .api.views import (
    SignupView,
    LoginView,
    VerifyTokenView,
    ProviderRedirectView,
    SetRoleView,
)

app_name = (
    "auth_supabase" 
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),  # POST  /api/v1/auth/signup/
    path("login/", LoginView.as_view(), name="login"),  # POST  /api/v1/auth/login/
    path(
        "verify/", VerifyTokenView.as_view(), name="verify"
    ),  # GET   /api/v1/auth/verify/
    path(
        "set-role/", SetRoleView.as_view(), name="set_role"
    ),  # POST  /api/v1/auth/set-role/
    path(
        "redirect/<str:provider>/",
        ProviderRedirectView.as_view(),
        name="provider_redirect",
    ), 
]
