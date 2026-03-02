from django.urls import path
from .presentation.views import SignupView, LoginView, VerifyTokenView, ProviderRedirectView, SetRoleView

app_name = "auth_supabase"

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify/", VerifyTokenView.as_view(), name="verify"),
    path("set-role/", SetRoleView.as_view(), name="set_role"),
    path("redirect/<str:provider>/", ProviderRedirectView.as_view(), name="provider_redirect"),
]
