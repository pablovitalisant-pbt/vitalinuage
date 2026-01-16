# ETAPA ÚNICA: Runtime Backend (Python) + Frontend Preconstruido
FROM python:3.10-slim
WORKDIR /app

# Ensure pythonpath
ENV PYTHONPATH=/app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# CRÍTICO: Copiar el frontend YA CONSTRUIDO con secretos desde el contexto
# Este dist/ viene del artefacto de GitHub Actions que ya tiene los secretos
COPY frontend/dist /app/frontend/dist

# Copiar código del backend
COPY backend/ /app/backend/

WORKDIR /app/backend
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]