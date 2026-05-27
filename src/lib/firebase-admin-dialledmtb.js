import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APP_NAME = 'dialledmtb';

let cachedDb = null;

function parseServiceAccount() {
  const raw = process.env.DIALLEDMTB_FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('DIALLEDMTB_FIREBASE_SERVICE_ACCOUNT is not set');
  const trimmed = raw.trim();

  // Base64-encoded path (recommended for Vercel — avoids newline escaping issues)
  if (!trimmed.startsWith('{')) {
    return JSON.parse(Buffer.from(trimmed, 'base64').toString('utf8'));
  }

  // Raw JSON path — Vercel may have expanded \n escape sequences in the private_key
  // value into literal newlines, breaking JSON.parse. Re-escape them.
  try {
    return JSON.parse(trimmed);
  } catch {
    const sanitized = trimmed.replace(
      /("private_key"\s*:\s*")([\s\S]*?)(")/,
      (_, prefix, key, suffix) => prefix + key.replace(/\n/g, '\\n') + suffix,
    );
    return JSON.parse(sanitized);
  }
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
