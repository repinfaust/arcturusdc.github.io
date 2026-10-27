/**
 * Orbit Firestore collection names. Kept free of imports so handlers can be tested without
 * Firebase; db-admin.js re-exports them as COLLECTIONS.
 */

export const COLLECTION_NAMES = {
  ORGS: 'orbit_orgs',
  USERS: 'orbit_users',
  SNAPSHOTS: 'orbit_snapshots',
  LEDGER_EVENTS: 'orbit_ledger_events',
  CONSENT_STATE: 'orbit_consent_state',
  VERIFICATION_ROUTES: 'orbit_verification_routes',
  ALERTS: 'orbit_alerts',
};
