import uuid
from datetime import datetime
from typing import List, Optional
from .models import Order, OrderItem

class OrderBuilder:
    """
    Se encarga de la construcción paso a paso de una instancia de la entidad Order.
    Permite encapsular la lógica compleja de creación y cálculo de totales.
    """

    def __init__(self):
        self._reset()

    def _reset(self):
        # Reinicia el estado interno del constructor después de cada producto final.
        self._patient_id: Optional[str] = None
        self._items: List[OrderItem] = []
        self._status: str = "PENDING"
        self._payment_info: Optional[dict] = None

    def set_patient(self, patient_id: str) -> "OrderBuilder":
        # Asigna el ID del paciente/cliente a la orden.
        self._patient_id = patient_id
        return self

    def add_item(
        self,
        item_type: str,
        item_id: str,
        name: str,
        price: float,
        quantity: int = 1,
        metadata: dict = None,
    ) -> "OrderBuilder":
        # Crea un OrderItem de dominio y lo añade a la lista de la orden.
        item = OrderItem(
            item_type=item_type,
            item_id=item_id,
            name=name,
            price=price,
            quantity=quantity,
            metadata=metadata or {},
        )
        self._items.append(item)
        return self

    def set_status(self, status: str) -> "OrderBuilder":
        # Permite forzar el estado de la orden (ej: 'PAID' después de un callback).
        self._status = status
        return self

    def set_payment_info(self, payment_info: dict) -> "OrderBuilder":
        # Adjunta información técnica del pago (medio, recibo, ...)
        self._payment_info = payment_info
        return self

    def build(self) -> Order:
        """
        Finaliza el proceso de construcción validando que se tengan los datos mínimos requeridos.
        Actúa como el método que genera el 'producto final' (entidad de dominio Order).
        """
        if not self._patient_id:
            raise ValueError("Se requiere el ID del paciente para construir una Orden.")

        # Realiza el cálculo automático del monto total sumando cada ítem.
        total_amount = sum(item.price * item.quantity for item in self._items)

        order = Order(
            internal_id=uuid.uuid4(),
            patient_id=self._patient_id,
            items=self._items,
            total_amount=total_amount,
            status=self._status,
            created_at=datetime.now(),
            payment_info=self._payment_info,
        )

        # Limpieza para que el builder pueda ser reutilizado inmediatamente.
        self._reset()
        return order
