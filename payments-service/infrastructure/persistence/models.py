"""
Modelos de persistencia para el microservicio de Pagos.
Representa las órdenes y la sincronización de perfiles mapeadas a la base de datos exclusiva (vis_payments_db).
"""

import uuid
from infrastructure.database import db

class AuthUser(db.Model):
    """
    Tabla espejo local de usuarios administrada mediante eventos asíncronos.
    """
    __tablename__ = "auth_user"
    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(254), nullable=False)
    first_name = db.Column(db.String(150), default="")
    last_name  = db.Column(db.String(150), default="")
    profile    = db.relationship("Profile", back_populates="user", uselist=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

class Profile(db.Model):
    """
    Tabla espejo local de perfiles de usuario para facturación y cobros.
    """
    __tablename__ = "auth_supabase_profile"
    id               = db.Column(db.Integer, primary_key=True)
    internal_id      = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    user_id          = db.Column(db.Integer, db.ForeignKey("auth_user.id"), nullable=False)
    user             = db.relationship("AuthUser", back_populates="profile")
    role             = db.Column(db.String(20), nullable=False)
    external_auth_id = db.Column(db.String(255), unique=True)
    bio              = db.Column(db.Text)
    specialty        = db.Column(db.String(255))
    session_price    = db.Column(db.Numeric(10, 2), default=50.00)
    experience_years = db.Column(db.Integer, default=0)
    location         = db.Column(db.String(255))
    avatar_url       = db.Column(db.String(200))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @property
    def display_name(self):
        if self.user:
            name = f"{self.user.first_name} {self.user.last_name}".strip()
            return name if name else self.user.email
        return ""

    @property
    def email_address(self):
        return self.user.email if self.user else ""


class DBOrder(db.Model):
    """
    Representa una orden o intención de pago por reserva de cita.
    """
    __tablename__ = "orders"
    
    internal_id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.String(30), nullable=False)
    
    items = db.relationship("DBOrderItem", backref="order", lazy=True)

class DBOrderItem(db.Model):
    """
    Representa cada ítem o concepto asociado a una orden de pago.
    """
    __tablename__ = "order_items"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.String(36), db.ForeignKey("orders.internal_id"), nullable=False)
    item_type = db.Column(db.String(50), nullable=False)
    item_id = db.Column(db.String(36), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    metadata_json = db.Column(db.JSON, nullable=True)
