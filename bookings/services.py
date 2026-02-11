from .domain.builders import SesionBuilder
from .infra.factories import PagoFactory

class ReservaService:

    def crear_reserva(self, cliente, data):

        sesion = (
            SesionBuilder()
            .para_cliente(cliente)
            .con_terapeuta(data["terapeuta"])
            .en_slot(data["slot"])
            .con_tipo(data["tipo"])
            .build()
        )

        pago_service = PagoFactory.create()
        pago_service.procesar(sesion)

        sesion.confirmar()
        return sesion
