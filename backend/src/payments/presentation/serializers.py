from rest_framework import serializers
from ..infrastructure.models import OrderModel, OrderItemModel


# Serializador para el detalle de cada ítem de una orden.
class OrderItemSerializer(serializers.ModelSerializer):
    """
   Transforma el modelo OrderItemModel a JSON.
    """

    class Meta:
        model = OrderItemModel
        fields = ["item_type", "item_id", "name", "price", "quantity", "metadata"]


# Serializador principal para visualizar las órdenes de pago.
class OrderSerializer(serializers.ModelSerializer):
    """
    Proporciona la representación externa de una Orden.
    Incluye la relación anidada con sus ítems.
    """

    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = OrderModel
        fields = [
            "internal_id",
            "total_amount",
            "status",
            "payment_method",
            "payment_metadata",
            "created_at",
            "items",
        ]
