from .domain.builders import SesionBuilder
from .domain.entities import Sesion as DomainSesion
from .infra.factories import PagoFactory


class ReservaService:

    def crear_reserva(self, cliente, data_or_sesion):

        if isinstance(data_or_sesion, DomainSesion):
            sesion = data_or_sesion
        else:
            sesion = (
                SesionBuilder()
                .para_cliente(cliente)
                .con_terapeuta(data_or_sesion["terapeuta"])
                .en_slot(data_or_sesion["slot"])
                .con_tipo(data_or_sesion["tipo"])
                .build()
            )

        pago_service = PagoFactory.create()
        pago_service.procesar(sesion)

        sesion.confirmar()
        return sesion
