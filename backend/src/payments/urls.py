from django.urls import path
from .presentation.views import OrderListView

urlpatterns = [
    path("orders/", OrderListView.as_view(), name="order-list"),
]
