// src/lib/firebaseAdmin.js
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

let cachedApp = null;
let cachedAuth = null;
let cachedDb = null;

function parseServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not set. Add the service account JSON (or base64-encoded string) to your environment.'
    );
  }

  const trimmed = raw.trim();
  const jsonString = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY_JSON. Ensure it is valid JSON.');
  }
}

function initializeFirebaseAdmin() {
  if (cachedApp) return;

  const serviceAccount = parseServiceAccount();

  cachedApp =
    getApps().length > 0
      ? getApps()[0]
      : initializeApp({
          credential: cert(serviceAccount),
        });

  cachedAuth = getAuth(cachedApp);
  cachedDb = getFirestore(cachedApp);
}

export function getFirebaseAdmin() {
  initializeFirebaseAdmin();
  return {
    app: cachedApp,
    auth: cachedAuth,
    db: cachedDb,
    FieldValue,
  };
}

export { FieldValue };
