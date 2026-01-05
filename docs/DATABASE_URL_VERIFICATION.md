# DATABASE_URL Verification Checklist

## Current DATABASE_URL in deploy.sh

```
postgresql://neondb_owner:npg_c9bZ5mOQfKzI@ep-delicate-scene-a5500e5a-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Verification Steps

### 1. Verify Neon Console Database URL

**Action Required:**
1. Log into Neon Console: https://console.neon.tech
2. Navigate to your project
3. Select the **production** branch (NOT main or development)
4. Copy the connection string from the "Connection Details" section
5. Compare it EXACTLY with the URL above

**Key Components to Verify:**
- **Host**: `ep-delicate-scene-a5500e5a-pooler.us-east-2.aws.neon.tech`
- **Database**: `neondb`
- **User**: `neondb_owner`
- **Password**: `npg_c9bZ5mOQfKzI`
- **SSL Mode**: `require`

### 2. Verify Cloud Run Environment Variable

**Action Required:**
```bash
# Check current DATABASE_URL in Cloud Run
gcloud run services describe vitalinuage-backend \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env[?name=='DATABASE_URL'].value)"
```

**Expected Output:**
Should match the URL from deploy.sh exactly.

### 3. If URLs Don't Match

**Option A: Update deploy.sh and redeploy**
```bash
# Edit deploy.sh with the correct DATABASE_URL from Neon Console
# Then redeploy:
./deploy.sh
```

**Option B: Update Cloud Run directly (faster)**
```bash
gcloud run services update vitalinuage-backend \
  --region us-central1 \
  --set-env-vars DATABASE_URL="<CORRECT_URL_FROM_NEON>"
```

### 4. Test Database Connection

After updating, verify the connection:

```bash
# Check Cloud Run logs for successful database connection
gcloud run services logs read vitalinuage-backend \
  --region us-central1 \
  --limit 50
```

Look for:
- ✅ No database connection errors
- ✅ Successful user queries
- ✅ User count matches Neon Console

### 5. Verify User Count

**In Neon Console:**
1. Go to SQL Editor
2. Run: `SELECT COUNT(*) FROM users;`
3. Note the count

**In Application:**
1. Try to login with existing credentials
2. Check backend logs for user lookup success
3. User should be found and login should succeed

## Common Issues

### Issue: "0 users in Neon Console"

**Possible Causes:**
1. Looking at wrong branch (main vs production)
2. DATABASE_URL points to different database
3. Users were created in local/test database, not production

**Solution:**
- Verify you're viewing the **production** branch in Neon
- If users truly don't exist, re-register through the application
- Check Cloud Run logs to see which database is being written to

### Issue: "Password match: True but still can't login"

**This is now FIXED** ✅
- The frontend now properly syncs the token with DoctorContext
- Navigation to dashboard should work immediately after login

## Security Note

⚠️ **IMPORTANT**: The admin endpoints `/admin/migrate-to-bcrypt` and `/admin/reset-password` have been removed from the codebase for security.

If you need to reset a password in production, use the Neon SQL Editor:

```sql
-- Generate a bcrypt hash for the new password
-- Use an online bcrypt generator or Python:
-- python -c "import bcrypt; print(bcrypt.hashpw(b'newpassword', bcrypt.gensalt()).decode())"

UPDATE users 
SET hashed_password = '$2b$12$YOUR_BCRYPT_HASH_HERE'
WHERE email = 'director@vitalinuage.com';
```

## Final Verification

After all fixes:

1. ✅ Frontend redirects to dashboard after successful login
2. ✅ ProtectedRoute doesn't cause redirect loops
3. ✅ User count in Neon matches application behavior
4. ✅ Admin endpoints removed from backend
5. ✅ DATABASE_URL in Cloud Run matches Neon production branch
