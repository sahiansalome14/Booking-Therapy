import os
from .payment_gateway import PagoMock, PagoReal

class PagoFactory:

    @staticmethod
    def create():
        if os.getenv("ENV") == "PROD":
            return PagoReal()
        return PagoMock()

