# Firebase CD Configuration Specs

## Overview
Implement automatic deployment to Firebase Hosting using GitHub Actions.
- **Production:** Deploy to live site on merge to `main`.
- **Preview:** Deploy to preview channel on Pull Requests.

## Configuration Files

### 1. `firebase.json` (Frontend)
Ensure the `hosting` configuration points to the correct public directory (`frontend/dist` typically for Vite) and handles rewrites for SPA.

### 2. `.github/workflows/firebase-hosting-merge.yml`
- **Trigger:** Push to `main`.
- **Jobs:**
    - Checkout code.
    - Install dependencies (`npm ci` in `frontend`).
    - Build (`npm run build` in `frontend`).
    - Deploy to Firebase Authentication & Hosting (Live).

### 3. `.github/workflows/firebase-hosting-pull-request.yml`
- **Trigger:** Pull Request to `main`.
- **Jobs:**
    - Checkout code.
    - Install dependencies.
    - Build.
    - Deploy to Firebase Preview Channel.

## Secrets Required
- `FIREBASE_SERVICE_ACCOUNT_VITALINUAGE`: JSON service account key.
