// src/lib/firebase.js
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, terminate } from 'firebase/firestore';
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

// Use global variable to persist across hot reloads in development
// This prevents multiple Firebase instances during Next.js hot module replacement
const globalForFirebase = globalThis;

if (!globalForFirebase._firebaseInitialized) {
  globalForFirebase._firebaseApp = null;
  globalForFirebase._firebaseDb = null;
  globalForFirebase._firebaseAuth = null;
  globalForFirebase._firebaseStorage = null;
  globalForFirebase._firebaseInitialized = false;
}

function initializeFirebaseApp() {
  // Return existing instance if already initialized
  if (globalForFirebase._firebaseInitialized && globalForFirebase._firebaseApp) {
    return {
      app: globalForFirebase._firebaseApp,
      db: globalForFirebase._firebaseDb,
      auth: globalForFirebase._firebaseAuth,
      storage: globalForFirebase._firebaseStorage,
    };
  }

  // Only initialize in browser
  if (typeof window === 'undefined') {
    return { app: null, db: null, auth: null, storage: null };
  }

  try {
    // Get or create Firebase app
    let app;
    const existingApps = getApps();

    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }

    // Initialize Firestore with long polling to avoid WebChannel/Listen errors
    // This forces the use of long polling instead of WebSocket connections
    // which can fail in certain network/browser configurations
    let db;
    try {
      // Try to initialize with long polling settings
      // This will fail if already initialized, so we'll catch and use getFirestore
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true,
      });
    } catch (error) {
      // If already initialized (e.g., hot reload), get the existing instance
      console.log('Using existing Firestore instance');
      db = getFirestore(app);
    }

    const auth = getAuth(app);
    const storage = getStorage(app);

    // Store in global to survive hot reloads
    globalForFirebase._firebaseApp = app;
    globalForFirebase._firebaseDb = db;
    globalForFirebase._firebaseAuth = auth;
    globalForFirebase._firebaseStorage = storage;
    globalForFirebase._firebaseInitialized = true;

    // Cleanup on hot module replacement
    if (module.hot) {
      module.hot.dispose(async () => {
        try {
          if (db) await terminate(db);
          if (app) await deleteApp(app);
        } catch (error) {
          console.warn('Firebase cleanup warning:', error);
        }
        globalForFirebase._firebaseInitialized = false;
      });
    }

    return { app, db, auth, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize once
const { app, db, auth, storage } = initializeFirebaseApp();

export { auth, db, storage };
export const googleProvider = new GoogleAuthProvider();
