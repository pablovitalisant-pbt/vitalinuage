import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Fail-fast validation
const missingKeys = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

if (missingKeys.length > 0) {
    console.error('[FIREBASE CONFIG] Missing environment variables for keys:', missingKeys);
    throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}. Check your .env file or build environment variables.`);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
