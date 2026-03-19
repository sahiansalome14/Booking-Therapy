# ---- Etapa 1: Build ----
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copiar dependencias
COPY package.json bun.lock ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# Copiar código fuente
COPY . .

# Variables de entorno 
ARG VITE_BACKEND_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Construir la aplicación para producción
RUN bun run build

# Servir con Nginx 
FROM nginx:alpine

# Copiar los archivos estáticos desde el builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx para React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
