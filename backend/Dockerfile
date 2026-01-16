FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV PYTHONPATH=/app

WORKDIR /app

# System dependencies for WeasyPrint
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*


# deps
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# code
COPY . .

# FRONTEND BUILD
WORKDIR /app/frontend
# Install dependencies
RUN npm install

# FORZAR PERMISOS DE EJECUCIÓN (Crucial para evitar el error 127/Permission Denied)
RUN chmod -R +x node_modules/.bin

# Build Arguments from Pipeline
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_API_URL

# Environment Variables for Vite Build
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL

# Build Frontend
RUN npm run build

# Switch back to app root for backend execution
WORKDIR /app

EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
