/* eslint-disable require-jsdoc, indent, max-len, operator-linebreak */
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const engine = require('./engine');
const seedRatings = require('./ratings.json');
const seedResults = require('./results.json');
const seedFixtures = require('./fixtures.json');

const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';
const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];
const PRIOR_GAMES = 4;

/*
 * Per-market lambda blend weights (= sharp-market share; 1−w is the Elo model).
 * Forward sweep on the 36 graded games with stored sharp lambdas (2026-07-03):
 * Brier improved monotonically toward the market on BOTH markets. 1X2 keeps the
 * 50/50 the UI has always shown (model is near-market there: 68.4% vs 69.4%);
 * totals anchors hard to the line because pure Elo was 47.4% vs market 63.9% —
 * the favourite-tail Poisson shape error the 06-21 decomposition diagnosed.
 */
const W_MARKET_1X2 = 0.5;
const W_MARKET_TOTALS = 0.9;

const collections = {
  teams: 'wc26_teams',
  fixtures: 'wc26_fixtures',
  results: 'wc26_results',
  predictions: 'wc26_predictions',
  meta: 'wc26_meta',
};

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchId(home, away) {
  return `${slug(home)}-v-${slug(away)}`;
}

function round(value, places = 3) {
  const p = 10 ** places;
  return Math.round(value * p) / p;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hasScore(result) {
  return Number.isFinite(Number(result.g1)) && Number.isFinite(Number(result.g2));
}

function requireSuperAdmin(context) {
  const email = normalizeEmail(context && context.auth && context.auth.token.email);
  if (!email || !SUPER_ADMINS.includes(email)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only STEa super admins can run WC26 admin sync jobs.',
    );
  }
  return email;
}

function teamPayload(name, rating, extra = {}) {
  return {
    tenantId: ARCTURUSDC_TENANT_ID,
    name,
    atk: Number(rating.atk),
    dfn: Number(rating.dfn),
    priorAtk: Number(rating.priorAtk || rating.atk),
    priorDfn: Number(rating.priorDfn || rating.dfn),
    tier: rating.tier || 'Custom',
    source: extra.source || 'seed',
    gamesPlayed: Number(extra.gamesPlayed || rating.gamesPlayed || 0),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function fixturePayload(fixture) {
  return {
    tenantId: ARCTURUSDC_TENANT_ID,
    matchId: matchId(fixture.home, fixture.away),
    home: fixture.home,
    away: fixture.away,
    neutral: fixture.neutral !== false,
    odds: fixture.odds || {},
    status: fixture.status || 'scheduled',
    source: fixture.source || 'seed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function resultPayload(result) {
  return {
    tenantId: ARCTURUSDC_TENANT_ID,
    matchId: matchId(result.home, result.away),
    home: result.home,
    away: result.away,
    g1: Number(result.g1),
    g2: Number(result.g2),
    neutral: result.neutral !== false,
    status: result.status || 'final',
    source: result.source || 'seed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function loadRatings(db) {
  const snap = await db.collection(collections.teams)
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID)
    .get();

  if (snap.empty) return {...seedRatings};

  const ratings = {};
  snap.forEach((doc) => {
    const data = doc.data() || {};
    if (!data.name || !Number.isFinite(Number(data.atk)) ||
        !Number.isFinite(Number(data.dfn))) {
      return;
    }
    ratings[data.name] = {
      atk: Number(data.atk),
      dfn: Number(data.dfn),
      tier: data.tier || 'Custom',
      priorAtk: Number(data.priorAtk || data.atk),
      priorDfn: Number(data.priorDfn || data.dfn),
      gamesPlayed: Number(data.gamesPlayed || 0),
    };
  });

  return Object.keys(ratings).length ? ratings : {...seedRatings};
}

async function loadFixtures(db) {
  const snap = await db.collection(collections.fixtures)
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID)
    .get();
  return snap.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

async function loadResults(db) {
  const snap = await db.collection(collections.results)
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID)
    .get();
  return snap.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

async function seedWc26DataImpl({reset = false} = {}) {
  const db = admin.firestore();
  const batch = db.batch();
  let writes = 0;

  for (const [name, rating] of Object.entries(seedRatings)) {
    const ref = db.collection(collections.teams).doc(slug(name));
    const snap = await ref.get();
    if (!snap.exists || reset) {
      batch.set(ref, teamPayload(name, rating), {merge: true});
      writes++;
    }
  }

  for (const fixture of seedFixtures) {
    const ref = db.collection(collections.fixtures)
      .doc(matchId(fixture.home, fixture.away));
    const snap = await ref.get();
    if (!snap.exists || reset) {
      batch.set(ref, fixturePayload(fixture), {merge: true});
      writes++;
    }
  }

  for (const result of seedResults) {
    const ref = db.collection(collections.results)
      .doc(matchId(result.home, result.away));
    const snap = await ref.get();
    if (!snap.exists || reset) {
      batch.set(ref, resultPayload(result), {merge: true});
      writes++;
    }
  }

  batch.set(db.collection(collections.meta).doc('config'), {
    tenantId: ARCTURUSDC_TENANT_ID,
    baseGoals: engine.DEFAULTS.baseGoals,
    rho: engine.DEFAULTS.rho,
    source: 'seed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  writes++;

  await batch.commit();
  return {tenantId: ARCTURUSDC_TENANT_ID, writes};
}

function refitRatingsFromResults(ratings, results) {
  const valid = results.filter((r) => hasScore(r));
  if (!valid.length) return {ratings, games: 0};

  const stats = {};
  let totalGoals = 0;

  for (const result of valid) {
    const g1 = Number(result.g1);
    const g2 = Number(result.g2);
    totalGoals += g1 + g2;
    for (const team of [result.home, result.away]) {
      if (!stats[team]) stats[team] = {games: 0, gf: 0, ga: 0};
    }
    stats[result.home].games++;
    stats[result.home].gf += g1;
    stats[result.home].ga += g2;
    stats[result.away].games++;
    stats[result.away].gf += g2;
    stats[result.away].ga += g1;
  }

  const averageTeamGoals = totalGoals / (valid.length * 2);
  const updated = {};

  for (const [name, current] of Object.entries(ratings)) {
    const prior = seedRatings[name] || current;
    const teamStats = stats[name] || {games: 0, gf: 0, ga: 0};
    const weight = teamStats.games / (teamStats.games + PRIOR_GAMES);

    const observedAtk = teamStats.games
      ? clamp((teamStats.gf / teamStats.games) / averageTeamGoals, 0.55, 1.85)
      : Number(prior.atk);
    const observedDfn = teamStats.games
      ? clamp((teamStats.ga / teamStats.games) / averageTeamGoals, 0.55, 1.65)
      : Number(prior.dfn);

    updated[name] = {
      atk: round(Number(prior.atk) * (1 - weight) + observedAtk * weight),
      dfn: round(Number(prior.dfn) * (1 - weight) + observedDfn * weight),
      priorAtk: Number(prior.atk),
      priorDfn: Number(prior.dfn),
      tier: current.tier || prior.tier || 'Custom',
      gamesPlayed: teamStats.games,
    };
  }

  return {ratings: updated, games: valid.length};
}

async function rebuildWc26Summary(db, ratings, results) {
  const completed = results.filter((r) => hasScore(r));
  const grade = engine.gradeHistory(completed, ratings);
  await db.collection(collections.meta).doc('summary').set({
    tenantId: ARCTURUSDC_TENANT_ID,
    source: 'current_ratings_backtest',
    summary: grade.summary,
    rows: grade.rows,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
  return grade.summary;
}

async function refitWc26RatingsImpl() {
  const db = admin.firestore();
  await seedWc26DataImpl();
  const ratings = await loadRatings(db);
  const results = await loadResults(db);
  const refit = refitRatingsFromResults(ratings, results);
  const batch = db.batch();

  for (const [name, rating] of Object.entries(refit.ratings)) {
    const ref = db.collection(collections.teams).doc(slug(name));
    batch.set(ref, teamPayload(name, rating, {
      gamesPlayed: rating.gamesPlayed,
      source: 'deterministic_shrinkage_refit',
    }), {merge: true});
  }

  batch.set(db.collection(collections.meta).doc('ratings'), {
    tenantId: ARCTURUSDC_TENANT_ID,
    method: 'goals_per_game_bayesian_shrinkage',
    priorGames: PRIOR_GAMES,
    source: 'deterministic_refit',
    games: refit.games,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  await batch.commit();
  const summary = await rebuildWc26Summary(db, refit.ratings, results);
  return {tenantId: ARCTURUSDC_TENANT_ID, games: refit.games, summary};
}

/*
 * The market-anchored ("blended") forecast track. Both inputs are stored real
 * data — Elo lambdas from the refit ratings, sharp lambdas solved from devigged
 * sharp-book lines at odds-pull time. Nothing here is fabricated; when there is
 * no sharp line the track is simply null (pure-Elo remains the only forecast).
 */
function blendedTrack(eloLam, sharp) {
  if (!eloLam || !sharp ||
      !Number.isFinite(Number(sharp.lamHome)) ||
      !Number.isFinite(Number(sharp.lamAway))) {
    return null;
  }
  const mk = (w) => engine.buildMatchFromLambdas(
    w * Number(sharp.lamHome) + (1 - w) * eloLam.home,
    w * Number(sharp.lamAway) + (1 - w) * eloLam.away,
  );
  const m1 = engine.market1x2(mk(W_MARKET_1X2));
  const mt = engine.marketTotals(mk(W_MARKET_TOTALS), [2.5]);
  return {
    w1x2: W_MARKET_1X2,
    wTotals: W_MARKET_TOTALS,
    p1x2: [round(m1.Home[0], 4), round(m1.Draw[0], 4), round(m1.Away[0], 4)],
    pOver25: round(mt['Over 2.5'][0], 4),
  };
}

/* Devigged consensus-book probabilities — the accuracy yardstick, snapshotted
 * at prediction-log time so grading never depends on a later fixture read. */
function marketBaselineFromOdds(odds) {
  if (!odds) return null;
  const out = {};
  const h = Number(odds.Home); const d = Number(odds.Draw); const a = Number(odds.Away);
  if (h > 1 && d > 1 && a > 1) {
    const r = [1 / h, 1 / d, 1 / a];
    const s = r[0] + r[1] + r[2];
    out.p1x2 = r.map((x) => round(x / s, 4));
  }
  const o = Number(odds['Over 2.5']); const u = Number(odds['Under 2.5']);
  if (o > 1 && u > 1) out.pOver25 = round((1 / o) / (1 / o + 1 / u), 4);
  return (out.p1x2 || out.pOver25 != null) ? out : null;
}

function predictionPayload(fixture, ratings, existing) {
  const homeRating = ratings[fixture.home];
  const awayRating = ratings[fixture.away];
  if (!homeRating || !awayRating) return null;

  const match = engine.buildMatch(homeRating, awayRating, {
    neutral: fixture.neutral !== false,
  });
  const prices = engine.priceAll(match);
  // Flag picks off the SAME calibrated board the UI shows (blended matrices,
  // no-vig comparison, |Δp| ranking) so the graded ledger measures the picks
  // a user actually saw. Falls back to pure-Elo pricing inside the engine
  // when the fixture has no sharp lambdas.
  const ranked = engine.recommendCalibrated([fixture], ratings);
  const top = engine.topRecommendationCalibrated([fixture], ratings);

  const payload = {
    tenantId: ARCTURUSDC_TENANT_ID,
    matchId: fixture.matchId || matchId(fixture.home, fixture.away),
    fixtureId: fixture.id || matchId(fixture.home, fixture.away),
    home: fixture.home,
    away: fixture.away,
    neutral: fixture.neutral !== false,
    baseGoals: engine.DEFAULTS.baseGoals,
    xg: {
      home: round(match.lamHome, 4),
      away: round(match.lamAway, 4),
      total: round(match.expTotal, 4),
    },
    prices,
    topRecommendation: top || null,
    rankedRecommendations: ranked.slice(0, 20),
    // Two-track forecast: pure Elo above (prices/xg), market-anchored below.
    sharpLambdas: fixture.marketLambdas ? {
      lamHome: Number(fixture.marketLambdas.lamHome),
      lamAway: Number(fixture.marketLambdas.lamAway),
    } : null,
    blended: blendedTrack(
      {home: match.lamHome, away: match.lamAway},
      fixture.marketLambdas || null,
    ),
    marketBaseline: marketBaselineFromOdds(fixture.odds || null),
    source: 'deterministic_engine',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!existing || !existing.firstLoggedAt) {
    payload.firstLoggedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  return payload;
}

async function syncWc26PredictionsImpl({force = false} = {}) {
  const db = admin.firestore();
  await seedWc26DataImpl();
  const ratings = await loadRatings(db);
  const fixtures = await loadFixtures(db);
  const now = new Date();
  let written = 0;
  let skipped = 0;

  for (const fixture of fixtures) {
    if (['final', 'cancelled', 'postponed'].includes(fixture.status)) {
      skipped++;
      continue;
    }

    const id = fixture.matchId || matchId(fixture.home, fixture.away);
    const ref = db.collection(collections.predictions).doc(id);
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : null;
    const kickoff = fixture.kickoff && fixture.kickoff.toDate
      ? fixture.kickoff.toDate()
      : (fixture.kickoff ? new Date(fixture.kickoff) : null);
    const locked = existing && existing.locked;
    const afterKickoff = kickoff instanceof Date &&
      !Number.isNaN(kickoff.valueOf()) &&
      kickoff <= now;

    if (!force && (locked || afterKickoff)) {
      skipped++;
      continue;
    }

    const payload = predictionPayload(fixture, ratings, existing);
    if (!payload) {
      skipped++;
      continue;
    }

    if (afterKickoff) payload.locked = true;
    await ref.set(payload, {merge: true});
    written++;
  }

  await db.collection(collections.meta).doc('predictions').set({
    tenantId: ARCTURUSDC_TENANT_ID,
    written,
    skipped,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return {tenantId: ARCTURUSDC_TENANT_ID, written, skipped};
}

// Settle a single selection against a final score. null = not gradable here.
function settleSelection(sel, g1, g2) {
  const t = g1 + g2;
  const M = {
    Home: g1 > g2, Draw: g1 === g2, Away: g2 > g1,
    'Over 1.5': t > 1.5, 'Under 1.5': t < 1.5,
    'Over 2.5': t > 2.5, 'Under 2.5': t < 2.5,
    'Over 3.5': t > 3.5, 'Under 3.5': t < 3.5,
    'BTTS Yes': g1 >= 1 && g2 >= 1, 'BTTS No': !(g1 >= 1 && g2 >= 1),
    'Home Over 0.5': g1 > 0.5, 'Home Under 0.5': g1 < 0.5,
    'Home Over 1.5': g1 > 1.5, 'Home Under 1.5': g1 < 1.5,
    'Home Over 2.5': g1 > 2.5,
    'Away Over 0.5': g2 > 0.5, 'Away Under 0.5': g2 < 0.5,
    'Away Over 1.5': g2 > 1.5, 'Away Under 1.5': g2 < 1.5,
    'Away Over 2.5': g2 > 2.5,
  };
  return sel in M ? M[sel] : null;
}

function marketFamily(group) {
  if (group === 'Totals') return 'Totals';
  if (group === 'BTTS') return 'BTTS';
  if (group === 'Team Totals') return 'TeamTotals';
  if (group === '1X2') return '1X2/draw-val';
  return group;
}

/*
 * The forward record grades the FLAGGED PICKS (the bets the board surfaced
 * pre-kickoff in rankedRecommendations), by market family — NOT the per-game
 * 1X2 argmax. 1X2 argmax is kept only as a calibration-sanity sub-field.
 * CLV is left null here; it requires a closing-line snapshot we don't yet take
 * for already-played picks (logged result + P&L only — never a fabricated close).
 */
/* Accuracy of one probability track against the final score. Returns null if
 * the track has neither a 1X2 nor an O/U 2.5 probability to grade. */
function trackAccuracy(p1x2, pOver25, actualIdx, over25) {
  const out = {};
  if (Array.isArray(p1x2) && p1x2.length === 3 &&
      p1x2.every((x) => Number.isFinite(Number(x)))) {
    const probs = p1x2.map(Number);
    out.hit1x2 = probs.indexOf(Math.max(...probs)) === actualIdx;
    out.brier1x2 = round(
      probs.reduce((s, p, i) => s + (p - (i === actualIdx ? 1 : 0)) ** 2, 0), 4);
  }
  if (Number.isFinite(Number(pOver25))) {
    const p = Number(pOver25);
    out.hitOU = (p >= 0.5) === over25;
    out.brierOU = round((p - (over25 ? 1 : 0)) ** 2, 4);
  }
  return Object.keys(out).length ? out : null;
}

function gradePrediction(result, prediction) {
  const market = prediction.prices && prediction.prices['1X2'];
  if (!market || !market.Home || !market.Draw || !market.Away) return null;

  const g1 = Number(result.g1);
  const g2 = Number(result.g2);

  // Calibration-sanity 1X2 argmax (demoted — not the scorecard).
  const probs = [market.Home[0], market.Draw[0], market.Away[0]].map(Number);
  const labels = ['Home', 'Draw', 'Away'];
  const actualIdx = g1 > g2 ? 0 : (g1 === g2 ? 1 : 2);
  const pickIdx = probs.indexOf(Math.max(...probs));
  const brier = probs.reduce((sum, p, idx) => sum + (p - (idx === actualIdx ? 1 : 0)) ** 2, 0);

  // Accuracy per forecast track (the headline since 2026-07-03 — the user's
  // stated goal is accuracy, not betting edge). Elo = what the engine logged;
  // blended = market-anchored track; market = devigged consensus baseline.
  const over25 = g1 + g2 > 2.5;
  const totalsMkt = prediction.prices && prediction.prices['Totals'];
  const eloOver = totalsMkt && totalsMkt['Over 2.5'] ? Number(totalsMkt['Over 2.5'][0]) : null;
  const accuracy = {
    over25,
    retro: Boolean(prediction.tracksRetro),
    elo: trackAccuracy(probs, eloOver, actualIdx, over25),
    blended: prediction.blended ?
      trackAccuracy(prediction.blended.p1x2, prediction.blended.pOver25, actualIdx, over25) : null,
    market: prediction.marketBaseline ?
      trackAccuracy(prediction.marketBaseline.p1x2, prediction.marketBaseline.pOver25, actualIdx, over25) : null,
  };

  // Flagged-picks ledger for THIS game.
  const flagged = Array.isArray(prediction.rankedRecommendations) ? prediction.rankedRecommendations : [];
  const closing = prediction.closingOdds || null; // devigged closing line, if snapshotted
  const ledger = [];
  for (const r of flagged) {
    const won = settleSelection(r.selection, g1, g2);
    if (won === null) continue; // skip pushes/handicaps we can't settle simply
    const stake = Number(r.stakeUnits) || 0;
    const price = Number(r.offered) || 0;
    const pnl = price > 1 ? (won ? stake * (price - 1) : -stake) : 0;
    // CLV = price_taken / closing_price − 1, computed only if we snapshotted a
    // closing price for this exact selection. Never fabricated.
    const closingPrice = closing && Number(closing[r.selection]) > 1 ? Number(closing[r.selection]) : null;
    const clvPct = closingPrice && price > 1 ? price / closingPrice - 1 : null;
    ledger.push({
      family: marketFamily(r.group),
      selection: r.selection,
      modelProb: r.modelProb ?? null,
      priceTaken: price || null,
      closingPrice,
      clvPct: clvPct == null ? null : +clvPct.toFixed(4),
      edgeAtFlag: r.edge ?? null,
      stakeUnits: stake,
      won,
      pnlUnits: +pnl.toFixed(3),
    });
  }

  return {
    score: `${g1}-${g2}`,
    // demoted calibration-sanity fields
    actual: labels[actualIdx],
    pick: labels[pickIdx],
    pickProb: probs[pickIdx],
    correct: actualIdx === pickIdx,
    brier1x2: brier,
    // per-track accuracy (the headline metric)
    accuracy,
    // the flagged-picks betting ledger (secondary since 2026-07-03)
    ledger,
  };
}

/*
 * Predictions graded before 2026-07-03 predate two-track logging. Their Elo
 * lambdas (xg) and the fixture's sharp lambdas / consensus odds were all stored
 * PRE-KICKOFF, so the blended + market tracks can be computed retrospectively
 * from real stored inputs — flagged `tracksRetro` so the page can say so.
 */
async function attachRetroTracks(db, ref, prediction) {
  if (prediction.blended || prediction.marketBaseline) return prediction;
  const fxSnap = await db.collection(collections.fixtures).doc(ref.id).get();
  if (!fxSnap.exists) return prediction;
  const f = fxSnap.data() || {};
  const eloLam = prediction.xg && Number.isFinite(Number(prediction.xg.home)) ?
    {home: Number(prediction.xg.home), away: Number(prediction.xg.away)} : null;
  const blended = eloLam ? blendedTrack(eloLam, f.marketLambdas || null) : null;
  const marketBaseline = marketBaselineFromOdds(f.odds || null);
  if (!blended && !marketBaseline) return prediction;
  const patch = {tracksRetro: true};
  if (blended) patch.blended = blended;
  if (marketBaseline) patch.marketBaseline = marketBaseline;
  if (f.marketLambdas) {
    patch.sharpLambdas = {
      lamHome: Number(f.marketLambdas.lamHome),
      lamAway: Number(f.marketLambdas.lamAway),
    };
  }
  await ref.set(patch, {merge: true});
  return {...prediction, ...patch};
}

async function gradeWc26PredictionsImpl({matchId: onlyMatchId} = {}) {
  const db = admin.firestore();
  const ratings = await loadRatings(db);
  const results = await loadResults(db);
  let graded = 0;

  for (const result of results.filter((r) => hasScore(r))) {
    const id = result.matchId || matchId(result.home, result.away);
    if (onlyMatchId && id !== onlyMatchId) continue;

    const ref = db.collection(collections.predictions).doc(id);
    const snap = await ref.get();
    if (!snap.exists) continue;

    const prediction = await attachRetroTracks(db, ref, snap.data());
    const grade = gradePrediction(result, prediction);
    if (!grade) continue;

    await ref.set({
      grade,
      locked: true,
      gradedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    graded++;
  }

  const summary = await rebuildWc26Summary(db, ratings, results);
  const ledger = await rebuildLedger(db);
  const accuracy = await rebuildAccuracy(db);
  return {tenantId: ARCTURUSDC_TENANT_ID, graded, summary, ledger: ledger.totals, accuracy};
}

/*
 * Aggregate the flagged-picks ledger across all graded predictions, by market
 * family, with CLV as the intended headline (n/a until closing snapshots exist).
 * Written to wc26_meta/ledger for the page to render.
 */
async function rebuildLedger(db) {
  const snap = await db.collection(collections.predictions)
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID).get();
  const families = {};
  const rows = [];
  let clvSum = 0; let clvCount = 0;

  snap.forEach((doc) => {
    const d = doc.data() || {};
    const entries = d.grade && Array.isArray(d.grade.ledger) ? d.grade.ledger : [];
    for (const e of entries) {
      const f = families[e.family] || {picks: 0, hits: 0, staked: 0, pnl: 0, clvSum: 0, clvCount: 0};
      f.picks += 1;
      f.hits += e.won ? 1 : 0;
      f.staked += e.stakeUnits || 0;
      f.pnl += e.pnlUnits || 0;
      if (typeof e.clvPct === 'number') { f.clvSum += e.clvPct; f.clvCount += 1; clvSum += e.clvPct; clvCount += 1; }
      families[e.family] = f;
      rows.push({game: `${d.home} v ${d.away}`, ...e});
    }
  });

  const byFamily = Object.entries(families).map(([family, s]) => ({
    family,
    picks: s.picks,
    hitRate: s.picks ? s.hits / s.picks : 0,
    staked: +s.staked.toFixed(2),
    pnl: +s.pnl.toFixed(2),
    roi: s.staked ? s.pnl / s.staked : 0,
    avgClv: s.clvCount ? s.clvSum / s.clvCount : null,
  }));

  const totalPicks = byFamily.reduce((a, b) => a + b.picks, 0);
  const totalStaked = byFamily.reduce((a, b) => a + b.staked, 0);
  const totalPnl = byFamily.reduce((a, b) => a + b.pnl, 0);
  const totalHits = byFamily.reduce((a, b) => a + Math.round(b.hitRate * b.picks), 0);

  const totals = {
    picks: totalPicks,
    hitRate: totalPicks ? totalHits / totalPicks : 0,
    staked: +totalStaked.toFixed(2),
    pnl: +totalPnl.toFixed(2),
    roi: totalStaked ? totalPnl / totalStaked : 0,
    avgClv: clvCount ? clvSum / clvCount : null, // null = no closing snapshots yet
    clvCoverage: totalPicks ? clvCount / totalPicks : 0,
  };

  await db.collection(collections.meta).doc('ledger').set({
    tenantId: ARCTURUSDC_TENANT_ID,
    totals, byFamily, rows,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return {totals, byFamily, rows};
}

/*
 * Forward accuracy aggregate across all graded games, per track (elo /
 * blended / market) and per market (1X2, O/U 2.5). Written to
 * wc26_meta/accuracy — the page's headline panel.
 */
async function rebuildAccuracy(db) {
  const snap = await db.collection(collections.predictions)
    .where('tenantId', '==', ARCTURUSDC_TENANT_ID).get();
  const mk = () => ({n1x2: 0, hit1x2: 0, brier1x2: 0, nOU: 0, hitOU: 0, brierOU: 0});
  const byTrack = {elo: mk(), blended: mk(), market: mk()};
  let gradedGames = 0;
  let retroCount = 0;

  snap.forEach((doc) => {
    const acc = doc.data() && doc.data().grade && doc.data().grade.accuracy;
    if (!acc) return;
    gradedGames += 1;
    if (acc.retro) retroCount += 1;
    for (const track of ['elo', 'blended', 'market']) {
      const t = acc[track];
      if (!t) continue;
      const agg = byTrack[track];
      if (typeof t.hit1x2 === 'boolean') {
        agg.n1x2 += 1; agg.hit1x2 += t.hit1x2 ? 1 : 0; agg.brier1x2 += t.brier1x2;
      }
      if (typeof t.hitOU === 'boolean') {
        agg.nOU += 1; agg.hitOU += t.hitOU ? 1 : 0; agg.brierOU += t.brierOU;
      }
    }
  });

  const summarise = (agg) => ({
    n1x2: agg.n1x2,
    acc1x2: agg.n1x2 ? round(agg.hit1x2 / agg.n1x2, 4) : null,
    brier1x2: agg.n1x2 ? round(agg.brier1x2 / agg.n1x2, 4) : null,
    nOU: agg.nOU,
    accOU: agg.nOU ? round(agg.hitOU / agg.nOU, 4) : null,
    brierOU: agg.nOU ? round(agg.brierOU / agg.nOU, 4) : null,
  });

  const payload = {
    tenantId: ARCTURUSDC_TENANT_ID,
    gradedGames,
    retroCount,
    weights: {w1x2: W_MARKET_1X2, wTotals: W_MARKET_TOTALS},
    byTrack: {
      elo: summarise(byTrack.elo),
      blended: summarise(byTrack.blended),
      market: summarise(byTrack.market),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection(collections.meta).doc('accuracy').set(payload, {merge: true});
  return payload;
}

async function seedWc26Data(data, context) {
  requireSuperAdmin(context);
  return seedWc26DataImpl({reset: Boolean(data && data.reset)});
}

async function refitWc26RatingsNow(data, context) {
  requireSuperAdmin(context);
  return refitWc26RatingsImpl();
}

async function syncWc26PredictionsNow(data, context) {
  requireSuperAdmin(context);
  return syncWc26PredictionsImpl({force: Boolean(data && data.force)});
}

async function gradeWc26PredictionsNow(data, context) {
  requireSuperAdmin(context);
  return gradeWc26PredictionsImpl(data || {});
}

async function refitWc26RatingsScheduled() {
  return refitWc26RatingsImpl();
}

async function syncWc26PredictionsScheduled() {
  return syncWc26PredictionsImpl();
}

async function onWc26ResultFinalized(change, context) {
  const after = change.after.exists ? change.after.data() : null;
  if (!after || after.tenantId !== ARCTURUSDC_TENANT_ID || !hasScore(after)) {
    return null;
  }
  return gradeWc26PredictionsImpl({matchId: after.matchId || context.params.id});
}

module.exports = {
  ARCTURUSDC_TENANT_ID,
  collections,
  seedWc26Data,
  refitWc26RatingsNow,
  refitWc26RatingsScheduled,
  syncWc26PredictionsNow,
  syncWc26PredictionsScheduled,
  gradeWc26PredictionsNow,
  onWc26ResultFinalized,
  // Export internals for lightweight local smoke tests.
  refitRatingsFromResults,
  seedWc26DataImpl,
  syncWc26PredictionsImpl,
  gradeWc26PredictionsImpl,
  gradePrediction,
  blendedTrack,
  marketBaselineFromOdds,
};
