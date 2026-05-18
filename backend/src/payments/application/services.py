from ..infrastructure.repositories import OrderRepository
from .factories import PaymentProcessorFactory
from ..domain.builders import OrderBuilder


# Servicio que coordina el flujo de negocio relacionado con el procesamiento de pagos.
class OrderService:
    """
    Orquestador que une el Dominio (OrderBuilder) con la
    Infraestructura (OrderRepository) y servicios externos (PaymentProcessor).
    """

    def __init__(self, order_repo: OrderRepository):
        self.order_repo = order_repo

    def process_booking_payment(
        self, patient_id: str, items_data: list, payment_info: dict
    ):
        """
        Caso de Uso: Procesa el pago de una reserva de cita.
        """

        # Se utiliza el patrón Builder para manejar la complejidad de crear la orden y sus ítems.
        builder = OrderBuilder()
        builder.set_patient(patient_id)
        builder.set_payment_info(payment_info)

        for item in items_data:
            builder.add_item(
                item_type=item["type"],
                item_id=item["id"],
                name=item["name"],
                price=item["price"],
                quantity=item.get("quantity", 1),
                metadata=item.get("metadata"),
            )

        # El Builder realiza la validación y el cálculo del monto total.
        order = builder.build()

        # Se obtiene el procesador adecuado mediante la Factory (abstracción).
        processor = PaymentProcessorFactory.get_processor("mock")
        payment_success = processor.process(order.total_amount, payment_info)

        if payment_success:
            order.status = "PAID"
            # Se guarda la orden en la base de datos de infraestructura.
            return self.order_repo.save_order(order)
        else:
            order.status = "FAILED"
            raise ValueError(
                "El procesamiento del pago ha fallado. Verifique su medio de pago."
            )
