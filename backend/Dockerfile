# ETAPA 1: CONSTRUCCIÓN DEL FRONTEND (NODE)
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copiar archivos de dependencias
COPY frontend/package*.json ./
RUN npm ci --quiet

# Definir Argumentos de Construcción (Los secretos de Firebase)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_API_URL

# Inyectar como Variables de Entorno para Vite
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL

# Copiar el resto del código del frontend y construir
COPY frontend/ ./
RUN npm run build

# ETAPA 2: SERVIDOR BACKEND (PYTHON)
FROM python:3.10-slim
WORKDIR /app

ENV PYTHONPATH=/app

# Instalar dependencias de sistema para WeasyPrint
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 \
    libffi-dev libjpeg-dev libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar dependencias de Python
# Context is root.
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# COPIAR EL FRONTEND YA CONSTRUIDO DESDE LA ETAPA 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copiar el código del backend manteniendo estructura de paquete
COPY backend /app/backend

# Exponer y ejecutar
EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
