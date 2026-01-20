/**
 * Orbit Firestore Database Helpers (Server-side)
 * Uses Firebase Admin SDK for API routes
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Get Firebase Admin instances
function getAdminDb() {
  try {
    const { db } = getFirebaseAdmin();
    return db;
  } catch (error) {
    console.error('[Orbit DB] Firebase Admin not initialized:', error.message);
    throw new Error('Firebase Admin DB not initialized');
  }
}

function getFieldValue() {
  const { FieldValue } = getFirebaseAdmin();
  return FieldValue;
}

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefined(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
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
  const adminDb = getAdminDb();
  const FieldValue = getFieldValue();
  const orgsRef = adminDb.collection(COLLECTIONS.ORGS);
  const snapshot = await orgsRef.where('orgId', '==', orgData.orgId).get();

  if (snapshot.empty) {
    // Create new org
    const cleanedData = removeUndefined(orgData);
    const docRef = await orgsRef.add({
      ...cleanedData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } else {
    // Update existing org
    const docRef = snapshot.docs[0].ref;
    const cleanedData = removeUndefined(orgData);
    await docRef.update({
      ...cleanedData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }
}

/**
 * Get organisation by orgId
 */
export async function getOrg(orgId) {
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
  const orgsRef = adminDb.collection(COLLECTIONS.ORGS);
  const snapshot = await orgsRef.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a snapshot
 */
export async function createSnapshot(snapshotData) {
  const adminDb = getAdminDb();
  const FieldValue = getFieldValue();
  const snapshotsRef = adminDb.collection(COLLECTIONS.SNAPSHOTS);
  const cleanedData = removeUndefined(snapshotData);
  const docRef = await snapshotsRef.add({
    ...cleanedData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get snapshot by pointer
 */
export async function getSnapshot(snapshotPointer) {
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
  const FieldValue = getFieldValue();
  const eventsRef = adminDb.collection(COLLECTIONS.LEDGER_EVENTS);
  const cleanedEvent = removeUndefined(event);
  const docRef = await eventsRef.add({
    ...cleanedEvent,
    timestamp: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get latest event for a user/org (for hash chain linking)
 */
export async function getLatestEvent(userId, orgId) {
  const adminDb = getAdminDb();
  const eventsRef = adminDb.collection(COLLECTIONS.LEDGER_EVENTS);
  
  try {
    // Try to order by blockIndex first (for events with hash chain)
    const snapshot = await eventsRef
      .where('userId', '==', userId)
      .where('orgId', '==', orgId)
      .orderBy('blockIndex', 'desc')
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  } catch (error) {
    // If orderBy fails (no index or no blockIndex field), fall back to timestamp
    console.warn('OrderBy blockIndex failed, trying timestamp:', error.message);
  }
  
  // Fallback: order by timestamp
  try {
    const snapshot = await eventsRef
      .where('userId', '==', userId)
      .where('orgId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  } catch (error) {
    // If that also fails, fetch all and sort in memory
    console.warn('OrderBy timestamp failed, sorting in memory:', error.message);
    const snapshot = await eventsRef
      .where('userId', '==', userId)
      .where('orgId', '==', orgId)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by blockIndex if available, otherwise by timestamp
    const sorted = events.sort((a, b) => {
      if (a.blockIndex && b.blockIndex) {
        return b.blockIndex - a.blockIndex;
      }
      const aTime = a.timestamp?.toMillis?.() || a.timestamp || 0;
      const bTime = b.timestamp?.toMillis?.() || b.timestamp || 0;
      return bTime - aTime;
    });
    return sorted[0];
  }
  
  return null;
}

/**
 * Get ledger events for a user
 */
export async function getUserEvents(userId, filters = {}) {
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
  const FieldValue = getFieldValue();
  const consentRef = adminDb.collection(COLLECTIONS.CONSENT_STATE);
  const snapshot = await consentRef
    .where('userId', '==', userId)
    .where('orgId', '==', orgId)
    .where('scope', '==', scope)
    .get();

  if (snapshot.empty) {
    // Create new consent state
    const consentData = removeUndefined({ userId, orgId, scope, status });
    await consentRef.add({
      ...consentData,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Update existing
    const updateData = removeUndefined({ status });
    await snapshot.docs[0].ref.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Get consent state for user/org
 */
export async function getConsentState(userId, orgId) {
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
  const FieldValue = getFieldValue();
  const alertsRef = adminDb.collection(COLLECTIONS.ALERTS);
  const cleanedData = removeUndefined(alertData);
  const docRef = await alertsRef.add({
    ...cleanedData,
    createdAt: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get alerts for a user
 */
export async function getUserAlerts(userId) {
  const adminDb = getAdminDb();
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

