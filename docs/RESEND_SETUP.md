# Resend Configuration & Domain Verification Guide

To ensure high deliverability and avoid security warnings (like "Dangerous Link" from Google), please follow these configuration steps in your Resend Dashboard.

## 1. Disable Click Tracking (CRITICAL)

**Why?** Google and other providers flag redirection links (used for tracking clicks) as potentially dangerous in email verification flows.

**Steps:**
1. Log in to [Resend Dashboard](https://resend.com/dashboard).
2. Go to **Settings** (Gear icon) -> **Emails**.
3. Find **Click Tracking** setting.
4. Set it to **OFF**.
5. Save changes.

*Effect:* The verification link in the email will be the direct `https://vitalinuage.web.app/verify?token=...` URL, which is trusted.

## 2. Domain Verification (Go Live)

**Why?** To send emails from `...@vitalinuage.app` instead of `...@resend.dev` and avoid Spam folders.

**Steps:**
1. In Resend Dashboard, go to **Domains**.
2. Click **Add Domain**.
3. Enter your domain: `vitalinuage.app` (or your actual production domain).
4. Resend will provide a list of DNS records (MX, TXT for SPF/DKIM).
5. Login to your DNS Provider (Namecheap, GoDaddy, Cloudflare, etc.).
6. Add the expected records.
7. Click **Verify Status** in Resend.

**After Verification:**
Once the domain status is "Verified":
1. Update `backend/services/email_service.py`:
   Change:
   ```python
   "from": "Vitalinuage <onboarding@resend.dev>"
   ```
   To:
   ```python
   "from": "Vitalinuage <no-reply@vitalinuage.app>"
   ```
2. Redeploy the backend.
