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
# Context is now root (.), so requirements.txt is at backend/requirements.txt
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# code
# Context is root. We copy contents of backend/ dir to /app/backend to maintain package structure
COPY backend /app/backend

# COPIAR FRONTEND
# El contexto es la raíz (.), así que 'final_dist_payload' está al mismo nivel que 'backend'
COPY final_dist_payload /app/frontend/dist

WORKDIR /app


EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
