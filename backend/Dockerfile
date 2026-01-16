# ETAPA 1: BUILD DEL FRONTEND (NODE)
FROM node:18-alpine AS builder
WORKDIR /app/frontend

# Copiar dependencias y asegurar permisos
COPY frontend/package*.json ./
RUN npm ci --quiet

# Declarar argumentos (Vienen de los --build-arg del pipeline)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_API_URL

# Exponerlos como variables de entorno para Vite
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL

# Copiar código y compilar
COPY frontend/ ./
RUN npm run build

# ETAPA 2: RUNTIME DEL BACKEND (PYTHON)
FROM python:3.10-slim
WORKDIR /app

# Ensure backend package can be imported from root
ENV PYTHONPATH=/app

# Dependencias de sistema para WeasyPrint
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 \
    libffi-dev libjpeg-dev libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el frontend compilado desde la etapa anterior
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Copiar el código del servidor
COPY backend/ /app/backend/
WORKDIR /app/backend

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
