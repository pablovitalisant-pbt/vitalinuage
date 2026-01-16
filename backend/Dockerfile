FROM node:18-alpine AS frontend-builder

# Install bash as requested
RUN apk add --no-cache bash

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
# CRITICAL FIX for Exit Code 126
RUN chmod -R +x node_modules/.bin

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_API_URL
ARG VITE_FEATURE_SEARCH
ARG VITE_FEATURE_NEW_UI

ENV VITE_FEATURE_SEARCH=${VITE_FEATURE_SEARCH}
ENV VITE_FEATURE_NEW_UI=${VITE_FEATURE_NEW_UI}
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID
ENV VITE_API_URL=$VITE_API_URL

COPY frontend/ ./
# Use npx as requested
RUN npm run build

FROM python:3.10-slim
WORKDIR /app

# Ensure pythonpath
ENV PYTHONPATH=/app

# System deps
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 \
    libffi-dev libjpeg-dev libopenjp2-7-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Backend code - Preserving structure
COPY backend /app/backend

# Frontend dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
