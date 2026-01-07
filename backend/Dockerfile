FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y \
    python3-dev gcc libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info libgobject-2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el contenido de backend a la raíz del contenedor
COPY . .
ENV PYTHONPATH=/app

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
