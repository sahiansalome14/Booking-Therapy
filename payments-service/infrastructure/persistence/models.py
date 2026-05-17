from ..database import db

class DBOrder(db.Model):
    __tablename__ = "orders"
    
    internal_id = db.Column(db.String(36), primary_key=True)
    patient_id = db.Column(db.String(36), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.String(30), nullable=False)
    
    items = db.relationship("DBOrderItem", backref="order", lazy=True)

class DBOrderItem(db.Model):
    __tablename__ = "order_items"
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.String(36), db.ForeignKey("orders.internal_id"), nullable=False)
    item_type = db.Column(db.String(50), nullable=False)
    item_id = db.Column(db.String(36), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    metadata_json = db.Column(db.JSON, nullable=True)
