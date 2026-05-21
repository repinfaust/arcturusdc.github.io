import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APP_NAME = 'dialledmtb';

let cachedDb = null;

function parseServiceAccount() {
  const raw = process.env.DIALLEDMTB_FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('DIALLEDMTB_FIREBASE_SERVICE_ACCOUNT is not set');
  const trimmed = raw.trim();
  const json = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
  return JSON.parse(json);
}

function initApp() {
  if (cachedDb) return;
  const existing = getApps().find((a) => a.name === APP_NAME);
  const app = existing ?? initializeApp({ credential: cert(parseServiceAccount()) }, APP_NAME);
  cachedDb = getFirestore(app);
}

export function getDialledMTBDb() {
  initApp();
  return cachedDb;
}
