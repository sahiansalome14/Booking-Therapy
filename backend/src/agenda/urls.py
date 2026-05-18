from django.urls import path, include

urlpatterns = [
    path("", include("agenda.api.urls")),
]
