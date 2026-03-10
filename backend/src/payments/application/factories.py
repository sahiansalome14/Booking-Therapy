from .payment_processors import PaymentProcessor, MockPaymentProcessor


# Clase encargada de la instanciación de procesadores de pago específicos.
class PaymentProcessorFactory:

    @staticmethod
    def get_processor(processor_type: str = "mock") -> PaymentProcessor:
        """
        Retorna una implementación del procesador basada en el tipo solicitado.
    
        """
        if processor_type == "mock":
            return MockPaymentProcessor()

        else:
            raise ValueError(f"Tipo de procesador desconocido: {processor_type}")
