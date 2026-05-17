import uuid
from datetime import datetime

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
