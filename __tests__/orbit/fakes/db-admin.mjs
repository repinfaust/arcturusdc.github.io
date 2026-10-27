import { state } from './state.mjs';
// Inlined so this fake also loads at commits before collections.js existed.
export const COLLECTIONS = {
  ORGS: 'orbit_orgs', USERS: 'orbit_users', SNAPSHOTS: 'orbit_snapshots',
  LEDGER_EVENTS: 'orbit_ledger_events', CONSENT_STATE: 'orbit_consent_state',
  VERIFICATION_ROUTES: 'orbit_verification_routes', ALERTS: 'orbit_alerts',
};
const read = (what, ...args) => { state.reads.push([what, ...args]); return []; };
export async function upsertOrg(d) { state.upserts.push(d); return 'doc1'; }
export async function getOrg(orgId) { return state.orgs.find((o) => o.orgId === orgId) ?? null; }
export async function getAllOrgs() { return state.orgs; }
export async function createSnapshot() { return 'snap1'; }
let pointerSnapshot = null;
export function setSnapshot(s) { pointerSnapshot = s; }
export async function getSnapshot(p) { read('snapshot', p); return pointerSnapshot?.id === p ? pointerSnapshot : null; }
export async function getLatestSnapshot(u, o) { read('latestSnapshot', u, o); return { userId: u, orgId: o, data: {} }; }
export async function addLedgerEvent() { return 'ev1'; }
export async function getLatestEvent() { return null; }
export async function getUserEvents(u) { return read('events', u); }
export async function updateConsentState() {}
export async function getConsentState(u) { return read('consent', u); }
export async function createAlert() { return 'al1'; }
export async function getUserAlerts(u) { return read('alerts', u); }
