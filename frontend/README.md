
# 🎨 Frontend - Vis Vitalis

Frontend desarrollado con **React + Vite**, usando **Bun** como gestor de paquetes.

---

## 🚀 Requisitos

## Opción A: Bun (Recomendado)
Linux/macOS: 
```bash
curl -fsSL https://bun.sh/install | bash
```

Windows (PowerShell): 
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

Verificar:
 ```bash
bun --version
```

## Opción B: npm (Node.js)

Instalador: Descarga la versión LTS desde [Node.js](https://nodejs.org/es)

macOS (Homebrew): brew install node

Verificar: node -v y npm -v
---

## ⚙️ Instalación

Entrar a la carpeta frontend:

```bash
cd frontend
```

Instalar dependencias:

## Opción A

```bash
bun install
```

## Opción B
```bash
npm install
```

---

## ▶️ Ejecutar entorno de desarrollo

## Opción A

```bash
bun dev
```

## Opción B

```bash
npm run dev
```

Servidor disponible en:

http://localhost:5173

---

## 🔐 Autenticación con Supabase

La página de login se implementa usando Supabase Auth UI para manejar
registro, inicio de sesión y proveedores sociales (Google, GitHub, etc.).

 Copia `.env.example` a `.env` y define:
   ```env
   VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
   VITE_SUPABASE_ANON_KEY=<tu-anon-key>
   ```

⚠ Importante: Las variables deben comenzar con VITE_ para que Vite las exponga al frontend.


## Estructura

```bash
frontend/
│── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   └── router/
│── public/
│── vite.config.ts
│── package.json
│── .env
│── .env.example
│── README.md
```