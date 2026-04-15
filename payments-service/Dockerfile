# ── Imagen base oficial de Python (slim para menor tamaño) ───────────────────
FROM python:3.13-slim

# Evitar archivos .pyc y forzar logs sin buffer (igual que el Dockerfile de Django)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiar e instalar dependencias primero (aprovecha la caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente del microservicio
COPY . .

# Exponer el puerto que usa Gunicorn / Flask
EXPOSE 5000

# Arrancar con Gunicorn en modo producción
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "60"]
