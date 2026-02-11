class Sesion:
    def __init__(self, cliente, terapeuta, slot, tipo):
        self.cliente = cliente
        self.terapeuta = terapeuta
        self.slot = slot
        self.tipo = tipo
        self.estado = "CREADA"

    def confirmar(self):
        self.estado = "CONFIRMADA"

    def cancelar(self):
        self.estado = "CANCELADA"
