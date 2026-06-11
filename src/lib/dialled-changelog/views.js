// Dialled MTB changelog — view builders.
// buildPublicView(): filters to public nodes/releases and compacts the sparse
// grid (§5.4) — a public-build transform only; the canonical layout is untouched.
// buildInternalView(): the full tree, canonical coordinates, internal fields.
// These run server-side only; whatever they return is what gets serialised to
// the client — so the public view must already be stripped (§5.1).
import 'server-only';

import {
  FEATURES,
  STATUS_LABEL,
  LANE_LABEL,
  CAT_LABEL,
  PUBLIC_LIFECYCLES,
} from './features';
import { loadReleases, publicReleases, deriveStatus, releasesForFeature } from './releases';

// Source artefact hardcodes lane row bands; reproduce verbatim for the internal view.
const CANONICAL_LANE_ROWS = (maxRow) => ({ core: [0, 2], setup: [3, 7], labs: [8, maxRow] });

const NEW_MARKER_WINDOW_DAYS = 30; // §10 — quiet recency marker, ages out

function daysSince(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate + 'T00:00:00Z').getTime()) / 86400000);
}

function serialiseRelease(r) {
  return {
    id: r.id,
    date: r.date,
    type: r.type,
    title: r.title,
    version: r.version,
    platform: r.platform,
    notes: r.notes,
    media: r.media,
    featureIds: r.featureIds,
  };
}

export function buildPublicView() {
  const releases = publicReleases();

  const nodes = FEATURES.filter((f) => f.visibility === 'public')
    .map((f) => {
      const own = releasesForFeature(f.id, releases);
      const { status, lastShipped } = deriveStatus(f, own);
      return { feature: f, status, lastShipped, releases: own };
    })
    .filter(({ status }) => PUBLIC_LIFECYCLES.includes(status));

  const includedIds = new Set(nodes.map((n) => n.feature.id));

  // §5.4 sparse-grid compaction: remap used cols/rows to consecutive indices,
  // preserving relative order and dependency structure.
  const usedCols = [...new Set(nodes.map((n) => n.feature.col))].sort((a, b) => a - b);
  const usedRows = [...new Set(nodes.map((n) => n.feature.row))].sort((a, b) => a - b);
  const colMap = new Map(usedCols.map((c, i) => [c, i]));
  const rowMap = new Map(usedRows.map((r, i) => [r, i]));

  const features = nodes.map(({ feature: f, status, lastShipped, releases: own }) => ({
    id: f.id,
    lane: f.lane,
    col: colMap.get(f.col),
    row: rowMap.get(f.row),
    title: f.title,
    cats: f.cats || [],
    phase: f.phase,
    deps: f.deps.filter((d) => includedIds.has(d)), // edges to internal nodes never emitted
    status,
    statusLabel: STATUS_LABEL[status],
    lastShipped,
    publicSummary: f.publicSummary,
    releases: own.map(serialiseRelease),
    isNew:
      status === 'shipped' && lastShipped !== null && daysSince(lastShipped) <= NEW_MARKER_WINDOW_DAYS,
  }));

  // Lane bands from the compacted rows (contiguous by construction: core < setup < labs).
  const laneRows = {};
  for (const lane of ['core', 'setup', 'labs']) {
    const rows = features.filter((f) => f.lane === lane).map((f) => f.row);
    if (rows.length) laneRows[lane] = [Math.min(...rows), Math.max(...rows)];
  }

  const latest = releases[0] || null;

  return {
    variant: 'public',
    features,
    laneRows,
    latest: latest
      ? { id: latest.id, title: latest.title, version: latest.version, date: latest.date, daysAgo: daysSince(latest.date) }
      : null,
    legendStatuses: PUBLIC_LIFECYCLES,
    labels: {
      // Only the public lifecycle labels — 'Avoid'/'Kill'/'Validate' must never
      // be serialised into the public payload (§5.5).
      status: Object.fromEntries(PUBLIC_LIFECYCLES.map((s) => [s, STATUS_LABEL[s]])),
      lane: LANE_LABEL,
      cat: CAT_LABEL,
    },
  };
}

export function buildInternalView() {
  const releases = loadReleases();
  const maxRow = Math.max(...FEATURES.map((f) => f.row));

  const features = FEATURES.map((f) => {
    const own = releasesForFeature(f.id, releases);
    const { status, lastShipped } = deriveStatus(f, own);
    return {
      id: f.id,
      lane: f.lane,
      col: f.col,
      row: f.row,
      title: f.title,
      cats: f.cats || [],
      phase: f.phase,
      deps: f.deps,
      status,
      statusLabel: STATUS_LABEL[status],
      lastShipped,
      publicSummary: f.publicSummary,
      desc: f.desc,
      why: f.why,
      scores: f.scores,
      visibility: f.visibility,
      releases: own.map((r) => ({ ...serialiseRelease(r), visibility: r.visibility })),
      isNew: false,
    };
  });

  const latest = releases[0] || null;

  return {
    variant: 'internal',
    features,
    laneRows: CANONICAL_LANE_ROWS(maxRow),
    latest: latest
      ? { id: latest.id, title: latest.title, version: latest.version, date: latest.date, daysAgo: daysSince(latest.date) }
      : null,
    legendStatuses: ['shipped', 'progress', 'next', 'open', 'validate', 'locked', 'avoid'],
    labels: { status: STATUS_LABEL, lane: LANE_LABEL, cat: CAT_LABEL },
  };
}

// Helpers for the permalink pages
export function getPublicFeature(id) {
  return buildPublicView().features.find((f) => f.id === id) || null;
}

export function getPublicRelease(id) {
  const r = publicReleases().find((x) => x.id === id);
  return r ? serialiseRelease(r) : null;
}
