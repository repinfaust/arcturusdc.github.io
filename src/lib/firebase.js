// src/lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app only once
let app;
let db;

if (typeof window !== 'undefined') {
  // Only initialize in browser
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);

    // Initialize Firestore with proper settings to prevent ns binding errors
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (error) {
      // If initialization fails (e.g., already initialized), get existing instance
      console.warn('Firestore initialization warning:', error.message);
      db = getFirestore(app);
    }
  } else {
    app = getApps()[0];
    db = getFirestore(app);
  }
}

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
export { db };
