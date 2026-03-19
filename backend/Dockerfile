# Utilizaremos una imagen base oficial de Python 3.13
FROM python:3.13-slim

# Evitar que python escriba .pyc y forzar logs sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias para compilar paquetes (como psycopg)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Instalar Poetry y Gunicorn
RUN pip install --no-cache-dir poetry gunicorn

# Desactivar la creación de entornos virtuales ya que estamos dentro de un contenedor
RUN poetry config virtualenvs.create false

# Copiar archivos de dependencias
COPY pyproject.toml poetry.lock ./

# Instalar dependencias del proyecto 
RUN poetry install --only main --no-root

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 8000

# Comando por defecto usando Gunicorn para producción
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
