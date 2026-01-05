# Go Live & Deployment Checklist (Slice 07)

## 1. Verify Cloud Run Configuration

Ensure the following environment variables are set in your Cloud Run service (`vitalinuage-backend`):

- **DATABASE_URL**: Must be the Neon Production URL.
- **RESEND_API_KEY**: `re_12345678...` (Get this from Resend Dashboard)
- **FRONTEND_URL**: `https://vitalinuage.web.app` (or your firebase app URL)

**Command to update:**
```bash
gcloud run services update vitalinuage-backend \
  --region us-central1 \
  --set-env-vars RESEND_API_KEY="<YOUR_API_KEY>" \
  --set-env-vars FRONTEND_URL="https://vitalinuage.web.app"
```

## 2. Verify Database Schema

Ensure the migration script `backend/migration_slice_07.sql` was run against the Neon database.
Columns `is_verified`, `verification_token`, `verification_token_expires_at` MUST exist.

## 3. Redeploy Backend

The "Token NULL" issue indicates the backend running is NOT the latest version.
You MUST redeploy the backend to apply the changes to `main.py` logic.

```bash
# From root directory
./deploy.sh
# OR manually:
gcloud builds submit --tag gcr.io/vitalinuage-cloud/vitalinuage-backend ./backend
gcloud run deploy vitalinuage-backend --image gcr.io/vitalinuage-cloud/vitalinuage-backend --platform managed --region us-central1
```

## 4. Frontend Deployment

To see the new alert message ("Por favor, verifica tu email..."), redeploy the frontend.

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## 5. Test It

1. Register a NEW user (so `is_verified` logic starts fresh).
2. Check `users` table: `verification_token` should NOT be NULL.
3. Check email inbox: Should receive email from `vitalinuage@resend.dev`.
4. Click link: Should redirect to Frontend -> Verify -> Login.
5. Login: Should succeed.
