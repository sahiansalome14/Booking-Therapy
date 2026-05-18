import logging

logger = logging.getLogger(__name__)

class PaymentProcessor:
    """Interfaz base para cualquier pasarela de pago (Stripe, PayPal, etc.)."""

    def process(self, amount: float, payment_info: dict) -> bool:
        raise NotImplementedError


class MockPaymentProcessor(PaymentProcessor):
    """
    Implementación mock del procesador de pagos.
    Simula siempre una transacción exitosa para desarrollo/pruebas.
    """

    def process(self, amount: float, payment_info: dict) -> bool:
        logger.info("[MockProcessor] Procesando pago de $%.2f", amount)
        logger.info("[MockProcessor] Info de pago recibida: %s", payment_info)
        return True  # Siempre aprobado en entorno mock


class PaymentProcessorFactory:
    """
    Factory Method que retorna la implementación correcta del procesador
    según el tipo solicitado. Extensible sin modificar el servicio.
    """

    @staticmethod
    def get_processor(processor_type: str = "mock") -> PaymentProcessor:
        processors = {
            "mock": MockPaymentProcessor,
        }
        cls = processors.get(processor_type)
        if not cls:
            raise ValueError(f"Tipo de procesador desconocido: '{processor_type}'")
        return cls()
