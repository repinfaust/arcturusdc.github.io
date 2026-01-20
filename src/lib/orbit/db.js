/**
 * Orbit Firestore Database Helpers
 */

import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

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
  const orgsRef = collection(db, COLLECTIONS.ORGS);
  const q = query(orgsRef, where('orgId', '==', orgData.orgId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new org
    const docRef = await addDoc(orgsRef, {
      ...orgData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } else {
    // Update existing org
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      ...orgData,
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }
}

/**
 * Get organisation by orgId
 */
export async function getOrg(orgId) {
  const orgsRef = collection(db, COLLECTIONS.ORGS);
  const q = query(orgsRef, where('orgId', '==', orgId));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get all organisations
 */
export async function getAllOrgs() {
  const orgsRef = collection(db, COLLECTIONS.ORGS);
  const snapshot = await getDocs(orgsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a snapshot
 */
export async function createSnapshot(snapshotData) {
  const snapshotsRef = collection(db, COLLECTIONS.SNAPSHOTS);
  const docRef = await addDoc(snapshotsRef, {
    ...snapshotData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get snapshot by pointer
 */
export async function getSnapshot(snapshotPointer) {
  const snapshotsRef = collection(db, COLLECTIONS.SNAPSHOTS);
  const q = query(snapshotsRef, where('snapshotId', '==', snapshotPointer));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Get latest snapshot for user/org
 */
export async function getLatestSnapshot(userId, orgId) {
  const snapshotsRef = collection(db, COLLECTIONS.SNAPSHOTS);
  const q = query(
    snapshotsRef,
    where('userId', '==', userId),
    where('orgId', '==', orgId),
    orderBy('version', 'desc')
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Add ledger event
 */
export async function addLedgerEvent(event) {
  const eventsRef = collection(db, COLLECTIONS.LEDGER_EVENTS);
  const docRef = await addDoc(eventsRef, {
    ...event,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get ledger events for a user
 */
export async function getUserEvents(userId, filters = {}) {
  const eventsRef = collection(db, COLLECTIONS.LEDGER_EVENTS);
  let q = query(
    eventsRef,
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  if (filters.orgId) {
    q = query(q, where('orgId', '==', filters.orgId));
  }
  if (filters.eventType) {
    q = query(q, where('eventType', '==', filters.eventType));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update consent state
 */
export async function updateConsentState(userId, orgId, scope, status) {
  const consentRef = collection(db, COLLECTIONS.CONSENT_STATE);
  const q = query(
    consentRef,
    where('userId', '==', userId),
    where('orgId', '==', orgId),
    where('scope', '==', scope)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new consent state
    await addDoc(consentRef, {
      userId,
      orgId,
      scope,
      status,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Update existing
    await updateDoc(snapshot.docs[0].ref, {
      status,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Get consent state for user/org
 */
export async function getConsentState(userId, orgId) {
  const consentRef = collection(db, COLLECTIONS.CONSENT_STATE);
  const q = query(
    consentRef,
    where('userId', '==', userId),
    where('orgId', '==', orgId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create alert
 */
export async function createAlert(alertData) {
  const alertsRef = collection(db, COLLECTIONS.ALERTS);
  const docRef = await addDoc(alertsRef, {
    ...alertData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Get alerts for a user
 */
export async function getUserAlerts(userId) {
  const alertsRef = collection(db, COLLECTIONS.ALERTS);
  const q = query(
    alertsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

