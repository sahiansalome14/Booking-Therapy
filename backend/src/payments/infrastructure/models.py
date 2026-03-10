from django.db import models
import uuid


# Modelo de base de datos que representa la persistencia de una Orden de pago.
class OrderModel(models.Model):
    """
    Almacena de forma permanente los datos de facturación.
    Se separa de la entidad de dominio para permitir una evolución independiente del esquema.
    """

    internal_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    # Relación con el perfil del paciente que realizó la compra.
    patient = models.ForeignKey(
        "auth_supabase.ProfileModel", on_delete=models.CASCADE, related_name="orders"
    )

    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, default="PAID"
    )  # Estado final de la transacción en DB.

    # Detalles del método utilizado
    payment_method = models.CharField(max_length=50, blank=True, null=True)

   
    payment_metadata = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments_order"


# Representación en base de datos de cada línea de detalle de la orden.
class OrderItemModel(models.Model):
    """
    Almacena el detalle individual de lo que se compró (citas, productos, etc).
    """

    order = models.ForeignKey(
        OrderModel, on_delete=models.CASCADE, related_name="items"
    )
    item_type = models.CharField(max_length=50)  # 'session', 'product', 'service'
    item_id = models.CharField(max_length=255)  # ID original del servicio comprado.
    name = models.CharField(max_length=255)  # Nombre en el momento de la compra.
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    metadata = models.JSONField(blank=True, null=True)

    class Meta:
        db_table = "payments_order_item"
