// Single source of truth for STEa Companion enums + validation.
// Matches build spec §6 (activity states) and §7 (priority bands).
// Shared by API routes (validation) and mirrored in the desktop app.

export const ACTIVITY_STATES = [
  'digging',
  'mapping',
  'building',
  'testing',
  'releasing',
  'leaving',
  'done',
];

export const PRIORITY_BANDS = [
  'now',
  'next',
  'this_week',
  'waiting',
  'blocked',
  'parked',
  'backlog',
  'done',
];

export const JOT_STATUSES = ['captured', 'converted', 'parked', 'discarded'];

export const CONVERT_TARGETS = ['task', 'card', 'feature', 'epic', 'idea', 'note'];

// Bands that count as "active work" for the NOW WIP limit (AC4).
export const NOW_BAND = 'now';
export const NOW_WIP_LIMIT = 3;

export function isActivityState(v) {
  return typeof v === 'string' && ACTIVITY_STATES.includes(v);
}

export function isPriorityBand(v) {
  return typeof v === 'string' && PRIORITY_BANDS.includes(v);
}

// Collections that can carry companion metadata.
export const COMPANION_ITEM_COLLECTIONS = {
  epic: 'stea_epics',
  feature: 'stea_features',
  card: 'stea_cards',
};

export const JOTS_COLLECTION = 'stea_jots';
