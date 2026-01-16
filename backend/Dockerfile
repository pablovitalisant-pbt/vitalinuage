FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV PYTHONPATH=/app

WORKDIR /app

# System dependencies for WeasyPrint
# Install system dependencies (no nodejs needed)
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*


# deps
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# code
COPY . .

# 1. Limpieza de comandos COPY anteriores
# 2. Copiamos la carpeta que movimos dentro de backend/ durante el pipeline
# Nota: Como el contexto del build es la raíz (.), la ruta es backend/static_dist
COPY backend/static_dist /app/frontend/dist

WORKDIR /app


EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
