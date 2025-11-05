/**
 * STEa Multi-tenant Database Helpers
 *
 * These helpers ensure all STEa database operations include tenantId
 * for proper multi-tenant isolation.
 */

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Create a query for STEa entities filtered by tenantId
 */
export function createTenantQuery(collectionName, tenantId, ...queryConstraints) {
  if (!tenantId) {
    throw new Error('Tenant ID is required for querying STEa collections');
  }

  const baseQuery = [
    collection(db, collectionName),
    where('tenantId', '==', tenantId),
    ...queryConstraints,
  ];

  return query(...baseQuery);
}

/**
 * Create a card/epic/feature with tenantId
 */
export async function createSteaEntity(collectionName, tenantId, data) {
  if (!tenantId) {
    throw new Error('Tenant ID is required for creating STEa entities');
  }

  const payload = {
    ...data,
    tenantId,
    createdAt: data.createdAt || serverTimestamp(),
  };

  return await addDoc(collection(db, collectionName), payload);
}

/**
 * Update a STEa entity
 */
export async function updateSteaEntity(collectionName, entityId, updates) {
  // Remove tenantId from updates if present (shouldn't be changed)
  const { tenantId, ...safeUpdates } = updates;

  return await updateDoc(doc(db, collectionName, entityId), safeUpdates);
}

/**
 * Delete a STEa entity
 */
export async function deleteSteaEntity(collectionName, entityId) {
  return await deleteDoc(doc(db, collectionName, entityId));
}

/**
 * Get queries for all STEa collections with tenant filtering
 */
export function getSteaQueries(tenantId) {
  if (!tenantId) {
    return {
      cardsQuery: null,
      epicsQuery: null,
      featuresQuery: null,
    };
  }

  return {
    cardsQuery: createTenantQuery('stea_cards', tenantId, orderBy('createdAt', 'asc')),
    epicsQuery: createTenantQuery('stea_epics', tenantId),
    featuresQuery: createTenantQuery('stea_features', tenantId),
  };
}
