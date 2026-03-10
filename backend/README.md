# Booking Therapy


# 📦 Backend - Vis Vitalis

Backend desarrollado con Django + Django REST Framework, utilizando PostgreSQL como base de datos y Poetry para la gestión de dependencias.

---

## 🏗  Tecnologías principales

* Django

* Django REST Framework

* PostgreSQL

* Poetry

* Supabase (Autenticación)

---

## 🚀 Requisitos

* Python 3.10+

* PostgreSQL 13+

* Poetry instalado

Instalar Poetry:

```bash
pip install poetry
```

Verificar instalación:

```bash
poetry --version
```
---
## ⚙️ Instalación del proyecto

1. Clonar el repositorio y entrar a la carpeta backend:

```bash
cd backend
```

2. Configurar Poetry para crear el entorno virtual dentro del proyecto:

```bash
poetry config virtualenvs.in-project true
```

3. Crear / seleccionar entorno virtual:

```bash
poetry env use python

```

4. Instalar dependencias:

```bash
poetry install

```
## 🐘 Configuración de PostgreSQL

Crear base de datos:
```bash
CREATE DATABASE vis_vitalis;
```

Crear usuario (opcional):
```bash
CREATE USER vis_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE vis_vitalis TO vis_user;
```
---
## 📦 Dependencias principales

Si necesitas agregarlas manualmente:


```bash
poetry add django djangorestframework django-cors-headers
poetry add python-dotenv
```


## 🔐 Variables de Entorno

Este proyecto utiliza un archivo .env para manejar configuraciones sensibles.

### Crear archivo .env

En la raíz del backend crea un archivo llamado: .env

En la carpeta del backend hay un .env.example sigue el ejemplo y configura tu .env 

Ejemplo:

```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# PostgreSQL
DATABASE_URL=postgresql://vis_user:password@localhost:5432/vis_vitalis_db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```
🌍 CORS

Configurado con django-cors-headers.

Permite conexión con frontend local.

---
## ▶️ Ejecutar el servidor

Activar entorno virtual:


```bash
poetry env activate
```

Ejecutar las migraciones:


```bash
poetry run python manage.py makemigrations
```

```bash
poetry run python manage.py migrate
```

Luego ejecutar:


```bash
poetry run python manage.py runserver
```

El servidor correrá en:

http://127.0.0.1:8000/

---

## 📁 Estructura básica

```bash
backend/
│── config/
│── apps/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
│── manage.py
│── pyproject.toml
│── poetry.lock
│── .env
│── .env.example
│── README.md
```