"""
Microservicio de Agenda — Flask (Strangler Pattern)
Modularized Entry Point
"""

import logging
from flask import Flask, g
from api.routes import agenda_bp

# ── Configuración ─────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Registrar Blueprints
# El prefijo /api/v2/agenda se mantiene para compatibilidad
app.register_blueprint(agenda_bp, url_prefix="/api/v2/agenda")


# ── Manejo de ciclo de vida de BD por request ─────────────────────────────────
@app.teardown_appcontext
def close_db_session(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
