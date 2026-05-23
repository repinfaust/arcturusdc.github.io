// src/lib/firebase.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
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

// All Firebase ops are client-only. On the server (SSR) export nulls so that
// SSR of client components succeeds without throwing a 500. Do NOT throw here —
// the original throw caused HTTP 500 responses when Next.js SSR'd client
// components that import this file.
let auth = null;
let db = null;
let storage = null;
let googleProvider = null;

if (typeof window !== 'undefined') {
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

  auth = getAuth(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();

  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    db = getFirestore(app);
  }
}

export { auth, db, storage, googleProvider };
