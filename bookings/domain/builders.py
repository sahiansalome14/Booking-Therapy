from .entities import Sesion

class SesionBuilder:

    def __init__(self):
        self._cliente = None
        self._terapeuta = None
        self._slot = None
        self._tipo = None

    def para_cliente(self, cliente):
        self._cliente = cliente
        return self

    def con_terapeuta(self, terapeuta):
        self._terapeuta = terapeuta
        return self

    def en_slot(self, slot):
        if not slot.get("disponible"):
            raise ValueError("Slot no disponible")
        self._slot = slot
        return self

    def con_tipo(self, tipo):
        self._tipo = tipo
        return self

    def build(self):
        if not all([self._cliente, self._terapeuta, self._slot]):
            raise ValueError("Sesión inválida")

        return Sesion(
            cliente=self._cliente,
            terapeuta=self._terapeuta,
            slot=self._slot,
            tipo=self._tipo
        )
