import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const APP_NAME = 'sidestand-admin';
const PROJECT_ID = 'sidestand-b19e7';

function readServiceAccount() {
  const raw =
    process.env.SIDESTAND_FIREBASE_SERVICE_ACCOUNT_KEY_JSON ||
    process.env.SIDESTAND_FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) return null;

  const trimmed = raw.trim();
  const json = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');

  try {
    return JSON.parse(json);
  } catch {
    throw new Error('Sidestand Firebase service account could not be parsed.');
  }
}
export function getSidestandAdmin() {
  const existing = getApps().find((app) => app.name === APP_NAME);
  if (existing) return { app: existing, db: getFirestore(existing) };

  const serviceAccount = readServiceAccount();
  const app = initializeApp(
    {
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId: serviceAccount?.project_id || PROJECT_ID,
    },
    APP_NAME,
  );

  return { app, db: getFirestore(app) };
}
