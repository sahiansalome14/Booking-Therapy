import logging
from .builders import OrderBuilder
from infrastructure.processors import PaymentProcessorFactory
from infrastructure.persistence.repositories import OrderRepository

logger = logging.getLogger(__name__)

class OrderService:
    """
    Caso de uso: 'Procesar pago de reserva de cita'.
    Orquesta el flujo: Builder → Procesador de Pago → Confirmación → Persistencia.
    """

    def __init__(self, repository: OrderRepository = None):
        self.repository = repository or OrderRepository()

    def process_booking_payment(self, patient_id: str,
                                 items_data: list, payment_info: dict) -> dict:
        # 1. Construir la orden con el Builder
        builder = OrderBuilder()
        builder.set_patient(patient_id)
        builder.set_payment_info(payment_info)

        for item in items_data:
            builder.add_item(
                item_type=item["type"],
                item_id=item["id"],
                name=item["name"],
                price=float(item["price"]),
                quantity=item.get("quantity", 1),
                metadata=item.get("metadata"),
            )

        order = builder.build()

        # 2. Obtener el procesador mediante la Factory y ejecutar el cobro
        processor = PaymentProcessorFactory.get_processor("mock")
        success = processor.process(order.total_amount, payment_info)

        # 3. Actualizar el estado de la orden según el resultado
        if success:
            order.status = "PAID"
            
            # 4. Persistir en la base de datos
            self.repository.save(order)
            
            logger.info("[OrderService] Pago exitoso — Order ID: %s | Total: $%.2f",
                        order.internal_id, order.total_amount)
            return order.to_dict()

        order.status = "FAILED"
        raise RuntimeError(
            "El procesamiento del pago ha fallado. Verifique su medio de pago."
        )
