from .models import OrderModel, OrderItemModel
from auth_supabase.infrastructure.models import ProfileModel
import logging

logger = logging.getLogger(__name__)


class OrderRepository:
    """
    Implementa los métodos necesarios para guardar los cambios
    del dominio en el medio de almacenamiento persistente
    """

    def create_order(self, patient_id, items_data, payment_info):

        patient = ProfileModel.objects.get(internal_id=patient_id)

        # Cálculo del total transaccional.
        total = sum(item["price"] * item["quantity"] for item in items_data)

        order = OrderModel.objects.create(
            patient=patient,
            total_amount=total,
            payment_method=payment_info.get("method"),
            payment_metadata=payment_info,
            status="PAID",
        )

        # Creación de los registros de detalle (ítems).
        for item in items_data:
            OrderItemModel.objects.create(
                order=order,
                item_type=item["item_type"],
                item_id=item["item_id"],
                name=item["name"],
                price=item["price"],
                quantity=item["quantity"],
                metadata=item.get("metadata"),
            )

        logger.info(
            f"ORDEN CREADA: Id {order.internal_id} para Cliente {patient.user.email}. "
            f"Monto: {total}. Info Pago: {payment_info}"
        )

        return order

    def save_order(self, order):
        """
        Traduce una entidad de dominio 'Order' a registros de 'OrderModel' e 'OrderItemModel'.
        Este método es el puente real entre la lógica pura de negocio y la base de datos.
        """
        patient = ProfileModel.objects.get(internal_id=order.patient_id)

        # Mapeo de campos del objeto de dominio al modelo de infraestructura.
        db_order = OrderModel.objects.create(
            internal_id=order.internal_id,
            patient=patient,
            total_amount=order.total_amount,
            payment_method=order.payment_info.get("method")
            if order.payment_info
            else "MOCK",
            payment_metadata=order.payment_info or {},
            status=order.status,
            created_at=order.created_at,
        )

        # Mapeo de la lista de ítems de dominio a registros de base de datos.
        for item in order.items:
            OrderItemModel.objects.create(
                order=db_order,
                item_type=item.item_type,
                item_id=item.item_id,
                name=item.name,
                price=item.price,
                quantity=item.quantity,
                metadata=item.metadata,
            )

        logger.info(
            f"ORDEN (DOMAIN) GUARDADA: Id {db_order.internal_id} para Cliente {patient.user.email}. "
            f"Monto: {order.total_amount}. Status: {order.status}"
        )
        return db_order
