import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

@dataclass
class OrderItem:
    """
    Representa un producto o servicio individual que se está cobrando.
    Al ser una dataclass, se mantiene independiente de cualquier framework de persistencia.
    """

    item_type: str  # Tipo de ítem: 'session' (cita), 'product', 'service'.
    item_id: str  # Referencia al ID original del objeto (ejemplo UUID del terapeuta).
    name: str  # Nombre descriptivo - recibo.
    price: float  # Precio unitario - transacción.
    quantity: int  # Cantidad de unidades.
    metadata: dict = field(
        default_factory=dict
    )  # Información adicional 


# Entidad principal de dominio para la gestión de pagos.
@dataclass
class Order:
    """
    Agrupa los ítems, el cliente y el estado financiero de la transacción.
    Es el objeto central que fluye a través del Builder y el Procesador de Pagos.
    """

    internal_id: uuid.UUID
    patient_id: str
    items: List[OrderItem]
    total_amount: float
    status: str  # Estados posibles: 'PENDING', 'PAID', 'CANCELLED', 'FAILED'.
    created_at: datetime
    payment_info: Optional[dict] = (
        None  # Detalles técnicos del medio de pago 
    )
