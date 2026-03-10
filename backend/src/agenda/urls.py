from django.urls import path, include

urlpatterns = [
    path("", include("agenda.presentation.urls")),
]
