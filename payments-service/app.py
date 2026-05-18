"""
Microservicio de Pagos - Flask

Rutas disponibles:
  GET  /api/v2/payments/health   → Health-check del servicio
  POST /api/v2/payments/process  → Procesa el pago de una reserva
"""

import logging
from flask import Flask
from api.routes import payments_bp
from infrastructure.database import init_db, db

# ── Configuración ─────────────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar Base de Datos
init_db(app)

# Crear tablas (esto se puede mejorar con migraciones como Flask-Migrate)
with app.app_context():
    from infrastructure.persistence import models  # noqa
    db.create_all()

# Registrar Blueprints
# El prefijo /api/v2/payments se mantiene para compatibilidad
app.register_blueprint(payments_bp, url_prefix="/api/v2/payments")

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
