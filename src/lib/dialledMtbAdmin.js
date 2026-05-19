import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const DIALLED_APP_NAME = 'dialled-mtb-admin';

function readServiceAccount() {
  const raw =
    process.env.DIALLED_MTB_FIREBASE_SERVICE_ACCOUNT_KEY_JSON ||
    process.env.DIALLED_MTB_FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error('Dialled MTB Firebase service account is not configured.');
  }

  const trimmed = raw.trim();
  const jsonString = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error('Dialled MTB Firebase service account could not be parsed.');
  }
}

function getBucketName(serviceAccount) {
  return (
    process.env.DIALLED_MTB_FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_DIALLED_MTB_FIREBASE_STORAGE_BUCKET ||
    (serviceAccount?.project_id ? `${serviceAccount.project_id}.firebasestorage.app` : null)
  );
}

export function getDialledMtbAdmin() {
  const existing = getApps().find((app) => app.name === DIALLED_APP_NAME);
  if (existing) {
    return {
      app: existing,
      db: getFirestore(existing),
      storage: getStorage(existing),
      FieldValue,
    };
  }

  const serviceAccount = readServiceAccount();
  const storageBucket = getBucketName(serviceAccount);

  const app = initializeApp(
    {
      credential: cert(serviceAccount),
      storageBucket,
    },
    DIALLED_APP_NAME,
  );

  return {
    app,
    db: getFirestore(app),
    storage: getStorage(app),
    FieldValue,
  };
}

export async function createFeedbackScreenshotUrl(storage, screenshotPath) {
  if (!screenshotPath || typeof screenshotPath !== 'string') return null;

  try {
    const [url] = await storage
      .bucket()
      .file(screenshotPath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
      });

    return url;
  } catch (error) {
    console.warn('[dialled-feedback] screenshot URL failed', {
      path: screenshotPath,
      message: error?.message,
    });
    return null;
  }
}
