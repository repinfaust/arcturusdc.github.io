/*
 * WC26 Elo prior — independent, continuum-valued team strength.
 *
 * Source: eloratings.net TSV exports (free, no key, machine-readable behind the
 * SPA). World Football Elo is market-INDEPENDENT and a continuum, which fixes
 * the coarse 5-tier-bucket problem (Spain/France/Argentina/Brazil were all an
 * identical "Elite 1.6/0.58"). Because it's independent of the betting line, the
 * model is *allowed to dissent* from the market — the only way a transparent
 * model can ever have an edge.
 *
 * Elo -> (atk, dfn) is a direct port of the Python engine's ratings_from_elo():
 *   z   = (elo - elo_avg) / 200
 *   atk = exp(spread * z),  dfn = exp(-spread * z)
 * with elo_avg set to the MEAN of the qualified field (not the global 1700),
 * so atk/dfn are centred on the tournament, not the world.
 */

import { TEAM_ALIASES } from './ingestResults';

export const ELO_WORLD_TSV = 'https://www.eloratings.net/World.tsv';
export const ELO_TEAMS_TSV = 'https://www.eloratings.net/en.teams.tsv';
export const ELO_SPREAD = 0.45; // matches the Python engine default

// eloratings team-name -> our canonical name, layered on top of TEAM_ALIASES.
const ELO_NAME_FIXUPS = {
  USA: 'United States',
  'South Korea': 'Korea Republic',
  'Czech Republic': 'Czechia',
  'Cape Verde': 'Cabo Verde',
  'IR Iran': 'Iran',
  'Ivory Coast': 'Ivory Coast',
};

function canonical(name) {
  return ELO_NAME_FIXUPS[name] || TEAM_ALIASES[name] || name;
}

function parseTsv(text) {
  return text
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter(Boolean)
    .map((line) => line.split('\t'));
}

/** Map ISO code -> team name from en.teams.tsv. */
export function parseTeamNames(teamsTsv) {
  const out = {};
  for (const row of parseTsv(teamsTsv)) {
    if (row.length >= 2 && row[0] && row[1]) out[row[0]] = row[1];
  }
  return out;
}

/**
 * Parse World.tsv into { canonicalName: elo } for the supplied set of known
 * canonical team names. World.tsv columns: rank, rank, ISO, ELO, ...
 * eloratings uses a Unicode minus (−) in some fields but ELO is plain digits.
 */
export function parseEloByTeam(worldTsv, codeToName, knownTeams) {
  const out = {};
  for (const row of parseTsv(worldTsv)) {
    if (row.length < 4) continue;
    const code = row[2];
    const elo = Number(row[3]);
    if (!code || !Number.isFinite(elo)) continue;
    const name = canonical(codeToName[code] || code);
    if (knownTeams && !knownTeams.has(name)) continue;
    out[name] = elo;
  }
  return out;
}

const round3 = (n) => Math.round(n * 1000) / 1000;

/** elo -> {atk, dfn}, centred on eloAvg (port of ratings_from_elo). */
export function eloToRating(elo, eloAvg, spread = ELO_SPREAD) {
  const z = (elo - eloAvg) / 200;
  return { atk: round3(Math.exp(spread * z)), dfn: round3(Math.exp(-spread * z)) };
}

/**
 * Build Elo-based priors for the known teams. Uses the MEAN Elo of the matched
 * field as the centre, so multipliers are relative to the tournament.
 *
 * @returns {{ priors: {name:{atk,dfn,elo}}, eloAvg, matched, missing }}
 */
export function buildEloPriors(worldTsv, teamsTsv, knownTeams) {
  const codeToName = parseTeamNames(teamsTsv);
  const eloByTeam = parseEloByTeam(worldTsv, codeToName, knownTeams);
  const matchedNames = Object.keys(eloByTeam);
  if (!matchedNames.length) throw new Error('No Elo ratings matched the known teams.');

  const eloAvg = matchedNames.reduce((s, n) => s + eloByTeam[n], 0) / matchedNames.length;

  const priors = {};
  for (const name of matchedNames) {
    const { atk, dfn } = eloToRating(eloByTeam[name], eloAvg);
    priors[name] = { atk, dfn, elo: eloByTeam[name] };
  }
  const missing = knownTeams ? [...knownTeams].filter((t) => !priors[t]) : [];
  return { priors, eloAvg: Math.round(eloAvg), matched: matchedNames.length, missing };
}

/** Fetch both TSVs. Throws on non-200. */
export async function fetchEloTsv(fetchImpl = fetch) {
  const [w, t] = await Promise.all([
    fetchImpl(ELO_WORLD_TSV, { cache: 'no-store' }),
    fetchImpl(ELO_TEAMS_TSV, { cache: 'no-store' }),
  ]);
  if (!w.ok) throw new Error(`Elo World.tsv HTTP ${w.status}`);
  if (!t.ok) throw new Error(`Elo teams.tsv HTTP ${t.status}`);
  return { worldTsv: await w.text(), teamsTsv: await t.text() };
}
