"""
Microservicio de Pagos - Flask

Rutas disponibles:
  GET  /api/v2/payments/health   → Health-check del servicio
  POST /api/v2/payments/process  → Procesa el pago de una reserva
"""

from flask import Flask, jsonify, request
from datetime import datetime
import uuid
import logging

# ── Configuración ─────────────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ═════════════════════════════════════════════════════════════════════════════
#  DOMINIO
# ═════════════════════════════════════════════════════════════════════════════

class OrderItem:
    """Representa un producto/servicio individual dentro de una orden de pago."""

    def __init__(self, item_type: str, item_id: str, name: str,
                 price: float, quantity: int = 1, metadata: dict = None):
        self.item_type = item_type
        self.item_id   = item_id
        self.name      = name
        self.price     = price
        self.quantity  = quantity
        self.metadata  = metadata or {}

    def to_dict(self):
        return {
            "item_type": self.item_type,
            "item_id":   self.item_id,
            "name":      self.name,
            "price":     self.price,
            "quantity":  self.quantity,
            "metadata":  self.metadata,
        }


class Order:
    """Entidad principal del dominio de pagos."""

    def __init__(self, patient_id: str, items: list, payment_info: dict = None):
        self.internal_id   = str(uuid.uuid4())
        self.patient_id    = patient_id
        self.items         = items                              # list[OrderItem]
        self.total_amount  = sum(i.price * i.quantity for i in items)
        self.status        = "PENDING"
        self.created_at    = datetime.utcnow().isoformat() + "Z"
        self.payment_info  = payment_info or {}

    def to_dict(self):
        return {
            "internal_id":  self.internal_id,
            "patient_id":   self.patient_id,
            "items":        [i.to_dict() for i in self.items],
            "total_amount": self.total_amount,
            "status":       self.status,
            "created_at":   self.created_at,
        }


# ═════════════════════════════════════════════════════════════════════════════
#  BUILDER
# ═════════════════════════════════════════════════════════════════════════════

class OrderBuilder:
    """
    Construye paso a paso una instancia de Order.
    Encapsula la lógica de validación y cálculo de totales,
    manteniendo la misma interfaz que el Builder del monolito Django.
    """

    def __init__(self):
        self._reset()

    def _reset(self):
        self._patient_id: str | None = None
        self._items: list[OrderItem] = []
        self._payment_info: dict = {}

    def set_patient(self, patient_id: str) -> "OrderBuilder":
        self._patient_id = patient_id
        return self

    def add_item(self, item_type: str, item_id: str, name: str,
                 price: float, quantity: int = 1, metadata: dict = None) -> "OrderBuilder":
        self._items.append(OrderItem(
            item_type=item_type,
            item_id=item_id,
            name=name,
            price=price,
            quantity=quantity,
            metadata=metadata,
        ))
        return self

    def set_payment_info(self, payment_info: dict) -> "OrderBuilder":
        self._payment_info = payment_info
        return self

    def build(self) -> Order:
        if not self._patient_id:
            raise ValueError("Se requiere el ID del paciente para construir una Orden.")
        if not self._items:
            raise ValueError("La orden debe contener al menos un ítem.")

        order = Order(
            patient_id=self._patient_id,
            items=self._items,
            payment_info=self._payment_info,
        )
        self._reset()   # El builder puede reutilizarse inmediatamente
        return order


# ═════════════════════════════════════════════════════════════════════════════
#  PROCESADORES DE PAGO  (Abstract Factory)
# ═════════════════════════════════════════════════════════════════════════════

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


# ═════════════════════════════════════════════════════════════════════════════
#  SERVICIO DE APLICACIÓN
# ═════════════════════════════════════════════════════════════════════════════

class OrderService:
    """
    Caso de uso: 'Procesar pago de reserva de cita'.
    Orquesta el flujo: Builder → Procesador de Pago → Confirmación.
    """

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
            logger.info("[OrderService] Pago exitoso — Order ID: %s | Total: $%.2f",
                        order.internal_id, order.total_amount)
            return order.to_dict()

        order.status = "FAILED"
        raise RuntimeError(
            "El procesamiento del pago ha fallado. Verifique su medio de pago."
        )


# ═════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS REST
# ═════════════════════════════════════════════════════════════════════════════

@app.route("/api/v2/payments/health", methods=["GET"])
def health_check():
    """
    Health-check del microservicio.
    Nginx y orquestadores usan este endpoint para verificar disponibilidad.
    """
    return jsonify({
        "service":   "payments-microservice",
        "status":    "ok",
        "version":   "2.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }), 200


@app.route("/api/v2/payments/process", methods=["POST"])
def process_payment():
    """
    Procesa el pago de una reserva de cita.

    Cuerpo JSON esperado:
    {
        "patient_id": "uuid-del-paciente",
        "items": [
            {
                "type":     "session",
                "id":       "uuid-del-terapeuta",
                "name":     "Sesión con Dr. García",
                "price":    80000,
                "quantity": 1,
                "metadata": { "date": "2024-06-01", "modality": "VIRTUAL" }
            }
        ],
        "payment_info": {
            "method":    "credit_card",
            "card_last4": "4242"
        }
    }
    """
    data = request.get_json(silent=True)

    # ── Validación 400: cuerpo JSON ──────────────────────────────────────────
    if not data:
        return jsonify({
            "error": "El cuerpo de la solicitud debe ser JSON válido.",
            "code":  "INVALID_JSON",
        }), 400

    missing_root = [f for f in ("patient_id", "items") if f not in data]
    if missing_root:
        return jsonify({
            "error":          "Campos requeridos faltantes en el cuerpo.",
            "missing_fields": missing_root,
            "code":           "MISSING_FIELDS",
        }), 400

    if not isinstance(data["items"], list) or len(data["items"]) == 0:
        return jsonify({
            "error": "El campo 'items' debe ser una lista con al menos un elemento.",
            "code":  "EMPTY_ITEMS",
        }), 400

    # Validar cada ítem de la orden
    required_item_fields = ("type", "id", "name", "price")
    for idx, item in enumerate(data["items"]):
        missing_item = [f for f in required_item_fields if f not in item]
        if missing_item:
            return jsonify({
                "error":          f"Ítem [{idx}] tiene campos faltantes.",
                "missing_fields": missing_item,
                "code":           "ITEM_MISSING_FIELDS",
            }), 400

        if not isinstance(item["price"], (int, float)) or item["price"] <= 0:
            return jsonify({
                "error": f"Ítem [{idx}]: 'price' debe ser un número positivo.",
                "code":  "INVALID_PRICE",
            }), 400

    # ── Procesamiento ────────────────────────────────────────────────────────
    try:
        service = OrderService()
        result = service.process_booking_payment(
            patient_id=data["patient_id"],
            items_data=data["items"],
            payment_info=data.get("payment_info", {}),
        )
        return jsonify({
            "message": "Pago procesado exitosamente.",
            "order":   result,
        }), 201

    except ValueError as exc:
        # Errores de validación de dominio (Builder / reglas de negocio)
        logger.warning("[process_payment] Error de dominio: %s", exc)
        return jsonify({"error": str(exc), "code": "DOMAIN_ERROR"}), 400

    except RuntimeError as exc:
        # Fallo del procesador de pagos (gateway)
        logger.error("[process_payment] Fallo del procesador: %s", exc)
        return jsonify({"error": str(exc), "code": "PAYMENT_GATEWAY_ERROR"}), 502

    except Exception:
        # Error inesperado — no exponer detalles internos en producción
        logger.exception("[process_payment] Error inesperado")
        return jsonify({
            "error": "Error interno del servidor de pagos.",
            "code":  "INTERNAL_SERVER_ERROR",
        }), 500


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
