import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummy",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vitalinuage.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vitalinuage",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vitalinuage.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
