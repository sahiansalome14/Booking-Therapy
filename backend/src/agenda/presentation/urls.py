from django.urls import path
from .views import AvailabilityView, SlotListView, AppointmentView, BlockView

urlpatterns = [
    path('availability/', AvailabilityView.as_view(), name='availability'),
    path('slots/', SlotListView.as_view(), name='slots-list'),
    path('appointments/', AppointmentView.as_view(), name='appointments'),
    path('blocks/', BlockView.as_view(), name='blocks'),
]
