from .models import DBOrder, DBOrderItem
from infrastructure.database import db

class OrderRepository:
    def save(self, order_domain):
        """
        Convierte una entidad de dominio Order a un modelo de DB y lo persiste.
        """
        db_order = DBOrder(
            internal_id=order_domain.internal_id,
            patient_id=order_domain.patient_id,
            total_amount=order_domain.total_amount,
            status=order_domain.status,
            created_at=order_domain.created_at
        )
        
        for item in order_domain.items:
            db_item = DBOrderItem(
                item_type=item.item_type,
                item_id=item.item_id,
                name=item.name,
                price=item.price,
                quantity=item.quantity,
                metadata_json=item.metadata
            )
            db_order.items.append(db_item)
            
        db.session.add(db_order)
        db.session.commit()
        return db_order
