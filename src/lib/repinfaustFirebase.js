import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const REPINFAUST_APP_NAME = 'repinfaust';
const REPINFAUST_REGION = 'europe-west2';

// Firebase client config is public by design; Firestore rules and callable
// Functions enforce the single verified owner account. Env vars can override
// these defaults, but the web mirror should not fail because Vercel rebuilt
// before public config variables were present.
const defaultFirebaseConfig = {
  apiKey: 'AIzaSyAna2KHwREcEQCnWuO109cdiPH63ghGHKc',
  authDomain: 'repinfaust.firebaseapp.com',
  projectId: 'repinfaust',
  storageBucket: 'repinfaust.firebasestorage.app',
  messagingSenderId: '695189923882',
  appId: '1:695189923882:web:648e603e0e2737f1fdbb53',
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_REPINFAUST_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_REPINFAUST_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_REPINFAUST_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_REPINFAUST_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_REPINFAUST_FIREBASE_MESSAGING_SENDER_ID ||
    defaultFirebaseConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_REPINFAUST_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
};

export const repinfaustRequiredEnv = [
  'NEXT_PUBLIC_REPINFAUST_FIREBASE_API_KEY',
  'NEXT_PUBLIC_REPINFAUST_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_REPINFAUST_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_REPINFAUST_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_REPINFAUST_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_REPINFAUST_FIREBASE_APP_ID',
];

export const repinfaustMissingEnv = repinfaustRequiredEnv.filter((name) => {
  const key = name.replace('NEXT_PUBLIC_REPINFAUST_FIREBASE_', '');
  const configKey =
    key === 'API_KEY'
      ? 'apiKey'
      : key === 'AUTH_DOMAIN'
        ? 'authDomain'
        : key === 'PROJECT_ID'
          ? 'projectId'
          : key === 'STORAGE_BUCKET'
            ? 'storageBucket'
            : key === 'MESSAGING_SENDER_ID'
              ? 'messagingSenderId'
              : key === 'APP_ID'
                ? 'appId'
                : null;
  return configKey ? !firebaseConfig[configKey] : true;
});

let repinfaustAuth = null;
let repinfaustDb = null;
let repinfaustFunctions = null;
let repinfaustGoogleProvider = null;
let repinfaustFirebaseInitError = null;

if (typeof window !== 'undefined' && repinfaustMissingEnv.length === 0) {
  try {
    const app = getApps().some((candidate) => candidate.name === REPINFAUST_APP_NAME)
      ? getApp(REPINFAUST_APP_NAME)
      : initializeApp(firebaseConfig, REPINFAUST_APP_NAME);

    repinfaustAuth = getAuth(app);
    repinfaustGoogleProvider = new GoogleAuthProvider();
    repinfaustGoogleProvider.setCustomParameters({ prompt: 'select_account' });
    repinfaustFunctions = getFunctions(app, REPINFAUST_REGION);

    try {
      repinfaustDb = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        experimentalForceLongPolling: true,
      });
    } catch {
      repinfaustDb = getFirestore(app);
    }
  } catch (error) {
    repinfaustFirebaseInitError = error;
    console.error('[Repinfaust] Firebase initialization failed:', error?.message || error);
    repinfaustAuth = null;
    repinfaustDb = null;
    repinfaustFunctions = null;
    repinfaustGoogleProvider = null;
  }
}

export {
  repinfaustAuth,
  repinfaustDb,
  repinfaustFunctions,
  repinfaustGoogleProvider,
  repinfaustFirebaseInitError,
};
