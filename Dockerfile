FROM python:3.9-slim-bookworm
RUN apt-get update && apt-get install -y \
    build-essential python3-dev python3-pip python3-cffi \
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 \
    libffi-dev shared-mime-info libglib2.0-0 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN python -m pip install --upgrade pip
COPY backend/requirements.txt .
RUN python -m pip install --no-cache-dir -r requirements.txt
# Aseguramos psycopg2-binary para la conexiÃ³n con Neon
RUN python -m pip install --no-cache-dir psycopg2-binary reportlab weasyprint jinja2 pydantic-settings passlib[bcrypt] python-jose[cryptography]
COPY backend/ .
ENV PORT=8080
ENV onboarding_workflow=true
ENV PYTHONUNBUFFERED=1

# Ejecutamos la migraciÃ³n en Neon antes de arrancar la API
CMD python migrate_prod.py && uvicorn main:app --host 0.0.0.0 --port 8080