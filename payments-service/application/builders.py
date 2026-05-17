from ..domain.models import Order, OrderItem

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
