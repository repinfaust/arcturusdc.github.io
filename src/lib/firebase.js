// src/lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// All Firebase ops are client-only. On the server (SSR) export nulls so client
// component imports do not 500 during render. Client init failures are logged
// and exported so STEa pages can show an explicit configuration error.
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;
let microsoftProvider = null;
let firebaseInitError = null;

if (typeof window !== 'undefined') {
  try {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

    auth = getAuth(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();

    // Microsoft sign-in (personal hotmail/outlook + org accounts).
    microsoftProvider = new OAuthProvider('microsoft.com');
    microsoftProvider.setCustomParameters({ prompt: 'select_account' });

    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (error) {
    firebaseInitError = error;
    console.error('[Firebase] Client initialization failed:', error?.message || error);
    auth = null;
    db = null;
    storage = null;
    googleProvider = null;
    microsoftProvider = null;
  }
}

export { auth, db, storage, googleProvider, microsoftProvider, firebaseInitError };
