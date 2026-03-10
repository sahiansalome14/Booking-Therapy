from abc import ABC, abstractmethod


# Interfaz abstracta que define el contrato para cualquier pasarela de pago (Stripe, PayPal, etc.).
class PaymentProcessor(ABC):
    """
    Define qué debe ser capaz de hacer un procesador de pagos.
    """

    @abstractmethod
    def process(self, amount: float, payment_info: dict) -> bool:
        """
        Método obligatorio para ejecutar el cobro.
        Retorna True si la transacción fue exitosa.
        """
        pass


# Implementación de prueba (Mock) del procesador de pagos.
class MockPaymentProcessor(PaymentProcessor):
    def process(self, amount: float, payment_info: dict) -> bool:
        print(f"DEBUG: Procesando pago de ${amount} mediante el MockProcessor")
        print(f"DEBUG: Información de Pago Recibida: {payment_info}")
        return True
