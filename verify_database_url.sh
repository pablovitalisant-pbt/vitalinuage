#!/bin/bash

# ======================================================
# QUICK DATABASE_URL VERIFICATION SCRIPT
# ======================================================
# This script helps verify and fix DATABASE_URL sync issues
# between Cloud Run and Neon Console

set -e

PROJECT_ID="vitalinuage-cloud"
REGION="us-central1"
SERVICE_NAME="vitalinuage-backend"

echo "🔍 Checking DATABASE_URL in Cloud Run..."
echo ""

CURRENT_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format="value(spec.template.spec.containers[0].env[?name=='DATABASE_URL'].value)" 2>/dev/null || echo "NOT_FOUND")

if [ "$CURRENT_URL" = "NOT_FOUND" ]; then
  echo "❌ ERROR: Could not retrieve DATABASE_URL from Cloud Run"
  echo "   Make sure you're authenticated: gcloud auth login"
  exit 1
fi

echo "📋 Current DATABASE_URL in Cloud Run:"
echo "$CURRENT_URL"
echo ""

echo "📋 Expected DATABASE_URL from deploy.sh:"
EXPECTED_URL="postgresql://neondb_owner:npg_c9bZ5mOQfKzI@ep-delicate-scene-a5500e5a-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
echo "$EXPECTED_URL"
echo ""

if [ "$CURRENT_URL" = "$EXPECTED_URL" ]; then
  echo "✅ DATABASE_URL matches deploy.sh"
  echo ""
  echo "Next steps:"
  echo "1. Verify this URL matches your Neon Console production branch"
  echo "2. Check Neon Console: https://console.neon.tech"
  echo "3. Navigate to production branch → Connection Details"
else
  echo "⚠️  WARNING: DATABASE_URL does NOT match deploy.sh"
  echo ""
  echo "To update Cloud Run to match deploy.sh, run:"
  echo ""
  echo "gcloud run services update $SERVICE_NAME \\"
  echo "  --region $REGION \\"
  echo "  --set-env-vars DATABASE_URL=\"$EXPECTED_URL\""
  echo ""
fi

echo ""
echo "🔍 Checking recent Cloud Run logs..."
echo ""
gcloud run services logs read $SERVICE_NAME \
  --region $REGION \
  --limit 20 \
  --format="table(timestamp,severity,textPayload)" 2>/dev/null || echo "Could not fetch logs"

echo ""
echo "✅ Verification complete!"
echo ""
echo "📖 For detailed instructions, see: docs/DATABASE_URL_VERIFICATION.md"
