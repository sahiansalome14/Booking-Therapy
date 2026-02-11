class PagoMock:
    def procesar(self, sesion):
        print(f"[MOCK] Pago procesado para {sesion.cliente}")

class PagoReal:
    def procesar(self, sesion):
        print("[REAL] Pago enviado a pasarela externa")
