/*
 * WC26 results/fixtures ingest — pinned structured source, NO LLM.
 *
 * Source: openfootball/worldcup.json (public domain, CC0).
 *   https://github.com/openfootball/worldcup.json
 * Shape per match: { round, date, time, team1, team2, group, ground,
 *                    score?: { ft: [g1,g2], ht: [g1,g2] } }
 * A match with a `score.ft` pair = played (→ result). Without = upcoming (→ fixture).
 *
 * There is nothing to hallucinate here: this is a fetch + schema-validate +
 * name-reconcile pipeline. Unknown/placeholder teams are REJECTED and reported,
 * never invented. The LLM is not involved in results or fixtures at all.
 */

export const OPENFOOTBALL_WC26_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

/* openfootball name → ratings-seed canonical name. Extend as new teams gain priors. */
export const TEAM_ALIASES = {
  'Czech Republic': 'Czechia',
  'South Korea': 'Korea Republic',
  'USA': 'United States',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Cape Verde': 'Cabo Verde',
  'Curaçao': 'Curacao',
};

/* Bracket placeholders ("1A", "2C", "3A/B/C/D/F", "W73", "L101") are not real teams. */
function isPlaceholderTeam(name) {
  return /^[0-9]/.test(name) || /^[WL]\d+$/.test(name) || name.includes('/');
}

function canonicalTeam(name) {
  return TEAM_ALIASES[name] || name;
}

function hasFinalScore(match) {
  const ft = match && match.score && match.score.ft;
  return Array.isArray(ft) && ft.length === 2 &&
    Number.isInteger(ft[0]) && Number.isInteger(ft[1]) &&
    ft[0] >= 0 && ft[1] >= 0;
}

/**
 * Parse + validate the openfootball payload against the set of known team names
 * (from wc26_teams / ratings seed). Pure function — no I/O.
 *
 * @param {object} payload  openfootball worldcup.json object ({ name, matches })
 * @param {Set<string>} knownTeams  canonical team names that have ratings
 * @returns {{ results, fixtures, rejected, sourceName }}
 */
export function parseOpenfootball(payload, knownTeams) {
  if (!payload || !Array.isArray(payload.matches)) {
    throw new Error('Unexpected source shape: missing matches array.');
  }
  const results = [];
  const fixtures = [];
  const rejected = [];

  for (const m of payload.matches) {
    const t1 = typeof m.team1 === 'string' ? m.team1.trim() : '';
    const t2 = typeof m.team2 === 'string' ? m.team2.trim() : '';
    if (!t1 || !t2) {
      rejected.push({ reason: 'missing-team', match: m });
      continue;
    }
    // Skip bracket placeholders silently-ish (they are never real teams).
    if (isPlaceholderTeam(t1) || isPlaceholderTeam(t2)) {
      rejected.push({ reason: 'placeholder', home: t1, away: t2 });
      continue;
    }
    const home = canonicalTeam(t1);
    const away = canonicalTeam(t2);

    // Reconcile to known teams; reject (do NOT invent) unknown real teams.
    const unknown = [];
    if (!knownTeams.has(home)) unknown.push(t1);
    if (!knownTeams.has(away)) unknown.push(t2);
    if (unknown.length) {
      rejected.push({ reason: 'unknown-team', home: t1, away: t2, unknown });
      continue;
    }

    const base = {
      home,
      away,
      date: typeof m.date === 'string' ? m.date : null,
      group: m.group || null,
      round: m.round || null,
      // World Cup matches are at neutral venues except host nations; the engine
      // defaults neutral=true and the pricer exposes a host toggle. Keep neutral.
      neutral: true,
    };

    if (hasFinalScore(m)) {
      results.push({ ...base, g1: m.score.ft[0], g2: m.score.ft[1] });
    } else {
      fixtures.push(base);
    }
  }

  return {
    sourceName: payload.name || 'World Cup 2026',
    results,
    fixtures,
    rejected,
  };
}

/** Fetch the pinned source. Throws on non-200 or bad JSON. */
export async function fetchOpenfootball(fetchImpl = fetch) {
  const res = await fetchImpl(OPENFOOTBALL_WC26_URL, {
    headers: { Accept: 'application/json' },
    // Source updates ~daily; avoid a stale CDN copy.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Source fetch failed: HTTP ${res.status}`);
  }
  return res.json();
}
