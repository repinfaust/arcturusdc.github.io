/**
 * Orbit Firestore Database Helpers (Server-side)
 * Uses Firebase Admin SDK for API routes
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Ensure adminDb is available
if (!adminDb) {
  console.error('Firebase Admin DB not initialized. Check FIREBASE_SERVICE_ACCOUNT environment variable.');
}

// Collection names
export const COLLECTIONS = {
  ORGS: 'orbit_orgs',
  USERS: 'orbit_users',
  SNAPSHOTS: 'orbit_snapshots',
  LEDGER_EVENTS: 'orbit_ledger_events',
  CONSENT_STATE: 'orbit_consent_state',
  VERIFICATION_ROUTES: 'orbit_verification_routes',
  ALERTS: 'orbit_alerts',
};

/**
 * Create or update an organisation
 */
export async function upsertOrg(orgData) {
  if (!adminDb) {
    throw new Error('Firebase Admin DB not initialized');
  }
  const orgsRef = adminDb.collection(COLLECTIONS.ORGS);
  const snapshot = await orgsRef.where('orgId', '==', orgData.orgId).get();

  if (snapshot.empty) {
    // Create new org
    const docRef = await orgsRef.add({
      ...orgData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } else {
    // Update existing org
    const docRef = snapshot.docs[0].ref;
    await docRef.update({
      ...orgData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }
}

/**
 * Get organisation by orgId
 */
export async function getOrg(orgId) {
  if (!adminDb) {
    throw new Error('Firebase Admin DB not initialized');
  }
  const orgsRef = adminDb.collection(COLLECTIONS.ORGS);
  const snapshot = await orgsRef.where('orgId', '==', orgId).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get all organisations
 */
export async function getAllOrgs() {
  if (!adminDb) {
    throw new Error('Firebase Admin DB not initialized');
  }
  const orgsRef = adminDb.collection(COLLECTIONS.ORGS);
  const snapshot = await orgsRef.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a snapshot
 */
export async function createSnapshot(snapshotData) {
  const snapshotsRef = adminDb.collection(COLLECTIONS.SNAPSHOTS);
  const docRef = await snapshotsRef.add({
    ...snapshotData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get snapshot by pointer
 */
export async function getSnapshot(snapshotPointer) {
  const snapshotsRef = adminDb.collection(COLLECTIONS.SNAPSHOTS);
  const snapshot = await snapshotsRef.where('snapshotId', '==', snapshotPointer).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get latest snapshot for user/org
 */
export async function getLatestSnapshot(userId, orgId) {
  const snapshotsRef = adminDb.collection(COLLECTIONS.SNAPSHOTS);
  // Fetch all matching snapshots and sort in memory to avoid index requirement
  const snapshot = await snapshotsRef
    .where('userId', '==', userId)
    .where('orgId', '==', orgId)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  // Sort by version descending and return the latest
  const sorted = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.version || 0) - (a.version || 0));
  
  return sorted[0];
}

/**
 * Add ledger event
 */
export async function addLedgerEvent(event) {
  const eventsRef = adminDb.collection(COLLECTIONS.LEDGER_EVENTS);
  const docRef = await eventsRef.add({
    ...event,
    timestamp: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get ledger events for a user
 */
export async function getUserEvents(userId, filters = {}) {
  let query = adminDb.collection(COLLECTIONS.LEDGER_EVENTS)
    .where('userId', '==', userId);

  if (filters.orgId) {
    query = query.where('orgId', '==', filters.orgId);
  }
  if (filters.eventType) {
    query = query.where('eventType', '==', filters.eventType);
  }

  // Try to order by timestamp, but if index doesn't exist, fetch all and sort
  try {
    const snapshot = await query.orderBy('timestamp', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // If orderBy fails (no index), fetch without ordering and sort in memory
    console.warn('OrderBy failed, sorting in memory:', error.message);
    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by timestamp descending
    return events.sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || a.timestamp || 0;
      const bTime = b.timestamp?.toMillis?.() || b.timestamp || 0;
      return bTime - aTime;
    });
  }
}

/**
 * Update consent state
 */
export async function updateConsentState(userId, orgId, scope, status) {
  const consentRef = adminDb.collection(COLLECTIONS.CONSENT_STATE);
  const snapshot = await consentRef
    .where('userId', '==', userId)
    .where('orgId', '==', orgId)
    .where('scope', '==', scope)
    .get();

  if (snapshot.empty) {
    // Create new consent state
    await consentRef.add({
      userId,
      orgId,
      scope,
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Update existing
    await snapshot.docs[0].ref.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Get consent state for user/org
 */
export async function getConsentState(userId, orgId) {
  let query = adminDb.collection(COLLECTIONS.CONSENT_STATE)
    .where('userId', '==', userId);
  
  if (orgId) {
    query = query.where('orgId', '==', orgId);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create alert
 */
export async function createAlert(alertData) {
  const alertsRef = adminDb.collection(COLLECTIONS.ALERTS);
  const docRef = await alertsRef.add({
    ...alertData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get alerts for a user
 */
export async function getUserAlerts(userId) {
  const alertsRef = adminDb.collection(COLLECTIONS.ALERTS);
  try {
    const snapshot = await alertsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    // If orderBy fails, fetch without ordering and sort in memory
    console.warn('OrderBy failed for alerts, sorting in memory:', error.message);
    const snapshot = await alertsRef.where('userId', '==', userId).get();
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return alerts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
      return bTime - aTime;
    });
  }
}

