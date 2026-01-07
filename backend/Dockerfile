FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    python3-dev \
    gcc \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    libgobject-2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos requerimientos y los instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el contenido de la carpeta backend actual en una subcarpeta 'backend'
# Esto permite que los imports 'from backend.xxx' funcionen en la nube
COPY . ./backend

# Establecemos PYTHONPATH para que la raíz sea /app y reconozca el paquete 'backend'
ENV PYTHONPATH=/app

# Comando de arranque usando el path del módulo
CMD uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}