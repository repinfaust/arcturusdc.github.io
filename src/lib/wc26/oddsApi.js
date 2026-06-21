/*
 * WC26 odds ingest — The Odds API (the-odds-api.com), upcoming matches only.
 *
 * Real REST odds source (free tier 500 req/month). This replaces any LLM odds
 * path: there is nothing to fabricate — the API returns structured prices.
 * The validation gate here exists to reject SUSPENDED / IN-PLAY events whose
 * prices are nonsensical (a real risk: a match kicking off now shows e.g.
 * H:294 D:294 A:1.0 with a wild overround).
 *
 * Sport key: soccer_fifa_world_cup. We request decimal odds, markets h2h+totals.
 */

import { TEAM_ALIASES } from './ingestResults';

export const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
export const WC_SPORT_KEY = 'soccer_fifa_world_cup';

function canonicalTeam(name) {
  return TEAM_ALIASES[name] || name;
}

/* Median is more robust than best-price to a single book's stale/outlier quote. */
function median(nums) {
  const s = nums.filter((n) => Number.isFinite(n) && n > 1).sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Reduce one event's many bookmakers to a single consensus price per engine
 * market key, then validate the 1X2 overround for sanity.
 *
 * @returns {{ home, away, commenceTime, odds, overround, accepted } | null}
 */
export function consensusForEvent(ev) {
  if (!ev || !ev.home_team || !ev.away_team || !Array.isArray(ev.bookmakers)) return null;
  const home = ev.home_team;
  const away = ev.away_team;

  const h2hHome = [];
  const h2hDraw = [];
  const h2hAway = [];
  const over25 = [];
  const under25 = [];

  for (const bm of ev.bookmakers) {
    for (const m of bm.markets || []) {
      if (m.key === 'h2h') {
        for (const o of m.outcomes || []) {
          if (o.name === home) h2hHome.push(o.price);
          else if (o.name === away) h2hAway.push(o.price);
          else if (o.name === 'Draw') h2hDraw.push(o.price);
        }
      } else if (m.key === 'totals') {
        for (const o of m.outcomes || []) {
          if (o.point === 2.5 && o.name === 'Over') over25.push(o.price);
          if (o.point === 2.5 && o.name === 'Under') under25.push(o.price);
        }
      }
    }
  }

  const odds = {};
  const h = median(h2hHome);
  const d = median(h2hDraw);
  const a = median(h2hAway);
  if (h) odds.Home = round2(h);
  if (d) odds.Draw = round2(d);
  if (a) odds.Away = round2(a);
  const o25 = median(over25);
  const u25 = median(under25);
  if (o25) odds['Over 2.5'] = round2(o25);
  if (u25) odds['Under 2.5'] = round2(u25);

  // Overround sanity on the 1X2 triple — the gate that rejects in-play/suspended.
  let overround = null;
  let accepted = true;
  let reason = null;
  if (odds.Home && odds.Draw && odds.Away) {
    overround = 1 / odds.Home + 1 / odds.Draw + 1 / odds.Away;
    // Pre-match 1X2 overround is ~1.00–1.15. Reject anything outside a tolerant band.
    if (overround < 1.0 || overround > 1.25) {
      accepted = false;
      reason = `overround ${(overround * 100).toFixed(0)}% out of range (suspended/in-play?)`;
    }
  } else {
    accepted = false;
    reason = 'incomplete 1X2 prices';
  }

  return { home, away, commenceTime: ev.commence_time, odds, overround, accepted, reason };
}

/**
 * Parse a full Odds API response into per-fixture consensus odds, reconciled to
 * canonical team names. Pure — no I/O.
 *
 * @param {Array} events  Odds API response array
 * @returns {{ accepted: Array<{home,away,commenceTime,odds,overround}>, rejected: Array }}
 */
export function parseOddsApi(events) {
  if (!Array.isArray(events)) throw new Error('Odds API: expected an array of events.');
  const accepted = [];
  const rejected = [];
  for (const ev of events) {
    const c = consensusForEvent(ev);
    if (!c) {
      rejected.push({ reason: 'malformed-event', event: ev?.id });
      continue;
    }
    const row = {
      home: canonicalTeam(c.home),
      away: canonicalTeam(c.away),
      commenceTime: c.commenceTime,
      odds: c.odds,
      overround: c.overround,
    };
    if (c.accepted) accepted.push(row);
    else rejected.push({ home: row.home, away: row.away, reason: c.reason, overround: c.overround });
  }
  return { accepted, rejected };
}

/** Fetch upcoming WC odds. Throws on non-200. */
export async function fetchWcOdds(apiKey, { regions = 'uk', fetchImpl = fetch } = {}) {
  if (!apiKey) throw new Error('Missing Odds API key.');
  const url =
    `${ODDS_API_BASE}/sports/${WC_SPORT_KEY}/odds/` +
    `?apiKey=${encodeURIComponent(apiKey)}&regions=${regions}&markets=h2h,totals&oddsFormat=decimal`;
  const res = await fetchImpl(url, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Odds API HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const remaining = res.headers?.get?.('x-requests-remaining');
  const events = await res.json();
  return { events, remaining: remaining ? Number(remaining) : null };
}
