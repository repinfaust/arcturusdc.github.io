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

// Server-side: return nulls, all Firebase ops must be client-only
if (typeof window === 'undefined') {
  module.exports = { auth: null, db: null, storage: null, googleProvider: null };
  // eslint-disable-next-line no-throw-literal
  throw 'firebase.js imported server-side — use firebaseAdmin instead';
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// auth and storage are always needed — initialise eagerly
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Initialise Firestore eagerly on the client (server guard above handles SSR).
// The Proxy lazy-init approach was broken — Firebase SDK uses instanceof checks
// that a Proxy cannot satisfy, causing collection()/doc() calls to throw.
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}
export { db };
