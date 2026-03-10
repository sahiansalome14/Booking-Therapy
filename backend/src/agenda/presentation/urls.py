from django.urls import path
from .views import (
    AvailabilityView,
    SlotListView,
    AppointmentView,
    BlockView,
    TherapistDetailView,
    TherapistListView,
    AppointmentCancelView,
    TherapistProfileUpdateView,
    AppointmentCompleteView,
    AppointmentConfirmView,
    AppointmentDetailView,
)

urlpatterns = [
    path("availability/", AvailabilityView.as_view(), name="availability"),
    path("slots/", SlotListView.as_view(), name="slots"),
    path("appointments/", AppointmentView.as_view(), name="appointments"),
    path(
        "appointments/<uuid:appointment_id>/cancel/",
        AppointmentCancelView.as_view(),
        name="appointment-cancel",
    ),
    path(
        "appointments/<uuid:appointment_id>/confirm/",
        AppointmentConfirmView.as_view(),
        name="appointment-confirm",
    ),
    path(
        "appointments/<uuid:appointment_id>/complete/",
        AppointmentCompleteView.as_view(),
        name="appointment-complete",
    ),
    path(
        "appointments/<uuid:appointment_id>/",
        AppointmentDetailView.as_view(),
        name="appointment-detail",
    ),
    path("blocks/", BlockView.as_view(), name="blocks"),
    path("therapists/", TherapistListView.as_view(), name="therapist-list"),
    path(
        "therapists/profile/",
        TherapistProfileUpdateView.as_view(),
        name="therapist-profile-own",
    ),
    path(
        "therapists/<uuid:therapist_id>/",
        TherapistDetailView.as_view(),
        name="therapist-detail",
    ),
]
