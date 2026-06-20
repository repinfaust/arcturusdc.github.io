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

function predictionPayload(fixture, ratings, existing) {
  const homeRating = ratings[fixture.home];
  const awayRating = ratings[fixture.away];
  if (!homeRating || !awayRating) return null;

  const match = engine.buildMatch(homeRating, awayRating, {
    neutral: fixture.neutral !== false,
  });
  const prices = engine.priceAll(match);
  const ranked = engine.recommend([fixture], ratings);
  const top = engine.topRecommendation([fixture], ratings);

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

function gradePrediction(result, prediction) {
  const market = prediction.prices && prediction.prices['1X2'];
  if (!market || !market.Home || !market.Draw || !market.Away) return null;

  const probs = [market.Home[0], market.Draw[0], market.Away[0]].map(Number);
  const labels = ['Home', 'Draw', 'Away'];
  const actualIdx = result.g1 > result.g2 ? 0 : (result.g1 === result.g2 ? 1 : 2);
  const pickIdx = probs.indexOf(Math.max(...probs));
  const brier = probs.reduce(
    (sum, p, idx) => sum + (p - (idx === actualIdx ? 1 : 0)) ** 2,
    0,
  );

  return {
    actual: labels[actualIdx],
    pick: labels[pickIdx],
    pickProb: probs[pickIdx],
    correct: actualIdx === pickIdx,
    brier1x2: brier,
    score: `${result.g1}-${result.g2}`,
  };
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

    const grade = gradePrediction(result, snap.data());
    if (!grade) continue;

    await ref.set({
      grade,
      locked: true,
      gradedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    graded++;
  }

  const summary = await rebuildWc26Summary(db, ratings, results);
  return {tenantId: ARCTURUSDC_TENANT_ID, graded, summary};
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
};
