import logging
from datetime import datetime
from flask import Blueprint, jsonify, request
from ..application.services import OrderService

logger = logging.getLogger(__name__)
payments_bp = Blueprint("payments", __name__)

@payments_bp.route("/health", methods=["GET"])
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


@payments_bp.route("/process", methods=["POST"])
def process_payment():
    """
    Procesa el pago de una reserva de cita.
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
