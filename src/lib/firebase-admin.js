/**
 * Firebase Admin SDK initialization
 * For use in API routes and server-side operations
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
let adminDb, adminAuth, adminStorage;

if (!admin.apps.length) {
  try {
    // In production, credentials are provided via GOOGLE_APPLICATION_CREDENTIALS env var
    // or via service account JSON loaded from env
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined;

    const app = admin.initializeApp({
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    adminDb = admin.firestore();
    adminAuth = admin.auth();
    adminStorage = admin.storage();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    console.error('Error details:', error.message);
    // Set to null so we can check for initialization failure
    adminDb = null;
    adminAuth = null;
    adminStorage = null;
  }
} else {
  // Already initialized
  adminDb = admin.firestore();
  adminAuth = admin.auth();
  adminStorage = admin.storage();
}

export { adminDb, adminAuth, adminStorage };

export default admin;
