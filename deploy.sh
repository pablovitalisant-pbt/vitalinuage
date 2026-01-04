#!/bin/bash

# ======================================================
# DEPLOYMENT SCRIPT FOR VITALINUAGE
# ======================================================

# --- Configuration ---
PROJECT_ID="vitalinuage-cloud" # REPLACE WITH YOUR GOOGLE CLOUD PROJECT ID
REGION="us-central1"
SERVICE_NAME="vitalinuage-backend"
DATABASE_URL="postgresql://neondb_owner:npg_c9bZ5mOQfKzI@ep-delicate-scene-a5500e5a-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# --- 1. DEPLOY BACKEND (CLOUD RUN) ---
print("🚀 Deploying Backend to Cloud Run...")
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME ./backend

gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="$DATABASE_URL" \
  --set-env-vars SECRET_KEY="change_this_to_a_secure_random_string_in_production" \
  --memory 1Gi

# --- 2. DEPLOY FRONTEND (FIREBASE) ---
print("🚀 Building and Deploying Frontend...")
cd frontend
npm install
npm run build
cd ..
firebase deploy --only hosting

print("✅ Deployment Complete!")
