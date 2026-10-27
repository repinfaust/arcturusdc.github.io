// Server-side page gates (D-SITE-064). The root middleware.js never ran (D-SITE-061), so every
// route it listed gets a server layout that checks the session, and the Repinfaust and Orbit
// evidence routes check the owner's email. src/middleware.js keeps only edge-safe work.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { PROTECTED_ROUTES, gateDecision } from '../../src/lib/protectedRoutes.js';

const ROOT = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const OWNER = { authenticated: true, user: { uid: 'u1', email: 'repinfaust@gmail.com', emailVerified: true } };
const OTHER = { authenticated: true, user: { uid: 'u2', email: 'someone@example.test', emailVerified: true } };
const OUT = { authenticated: false };

// Every path the old root middleware.js listed (as of 10682b0), /apps form.
const OLD_PROTECTED = [
  '/apps/stea/admin', '/apps/stea/automatedtestsdashboard', '/apps/stea/art-atlas', '/apps/stea/autoproduct',
  '/apps/stea/career', '/apps/stea/squared', '/apps/stea/dialled-mtb', '/apps/stea/filo', '/apps/stea/hans',
  '/apps/stea/harls', '/apps/stea/orbit/poc', '/apps/stea/orbit/AI-Act-Technical-DocumentationBundle',
  '/apps/stea/orbit/evidence', '/apps/stea/repinfaust', '/apps/stea/toume', '/apps/stea/dialled-mtb/riders',
  '/apps/stea/dialledmtb-riders', '/apps/stea/fof', '/apps/stea/wc26',
];

test('every formerly protected path is covered by a gate, or has no route at all', () => {
  for (const p of OLD_PROTECTED) {
    const covered = PROTECTED_ROUTES.some((r) => p === r.base || p.startsWith(`${r.base}/`));
    const dir = `src/app${p}`;
    assert.ok(covered || !existsSync(new URL(dir, ROOT)), `${p} has a route but no gate`);
  }
});

for (const r of PROTECTED_ROUTES) {
  test(`${r.base}: its folder has a server layout that enforces the gate`, () => {
    const layout = read(`src/app${r.base}/layout.js`);
    assert.doesNotMatch(layout, /^['"]use client['"]/m, 'a gate layout must be a server component');
    assert.match(layout, new RegExp(`enforceGate\\(['"]${r.base.replace(/[/.-]/g, '\\$&')}['"]\\)`));
    assert.match(layout, /force-dynamic/);
  });
}

test('gateDecision: signed out goes to sign-in with the route as next', () => {
  assert.deepEqual(gateDecision(OUT, { base: '/apps/stea/fof' }), { redirect: '/apps/stea?next=%2Fapps%2Fstea%2Ffof' });
  assert.deepEqual(gateDecision(OTHER, { base: '/apps/stea/fof' }), { allow: true });
});

test('gateDecision: the Repinfaust route needs the owner email', () => {
  const rule = PROTECTED_ROUTES.find((r) => r.base === '/apps/stea/repinfaust');
  assert.deepEqual(gateDecision(OTHER, rule), { redirect: '/apps/stea?denied=repinfaust' });
  assert.deepEqual(gateDecision({ ...OWNER, user: { ...OWNER.user, emailVerified: false } }, rule), { redirect: '/apps/stea?denied=repinfaust' });
  assert.deepEqual(gateDecision(OWNER, rule), { allow: true });
  assert.deepEqual(gateDecision(OUT, rule).redirect, '/apps/stea?next=%2Fapps%2Fstea%2Frepinfaust');
});

test('gateDecision: the Orbit evidence route is a 404 for anyone but the owner', () => {
  const rule = PROTECTED_ROUTES.find((r) => r.base === '/apps/stea/orbit/evidence');
  assert.deepEqual(gateDecision(OTHER, rule), { notFound: true });
  assert.deepEqual(gateDecision(OUT, rule), { notFound: true });
  assert.deepEqual(gateDecision(OWNER, rule), { allow: true });
});

test('the root middleware.js is gone; src/middleware.js is edge-safe', () => {
  assert.equal(existsSync(new URL('middleware.js', ROOT)), false);
  const mw = read('src/middleware.js');
  assert.doesNotMatch(mw, /firebase-admin|firebaseAdmin|verifySessionCookie/);
  assert.match(mw, /Content-Security-Policy/);
  assert.match(mw, /www\.arcturusdc\.com/);
  assert.doesNotMatch(mw, /protectedPaths/);
});

test('src/middleware.js redirects a request with no session cookie on every gated route', () => {
  const mw = read('src/middleware.js');
  assert.match(mw, /import \{ PROTECTED_ROUTES, SIGN_IN_PATH \} from '\.\/lib\/protectedRoutes'/);
  assert.match(mw, /req\.cookies\.get\('__session'\)/);
  assert.match(mw, /startsWith\('\/stea\/'\)/);
});

test('protectedRoutes.js stays edge-safe: no Node-only imports', () => {
  const src = read('src/lib/protectedRoutes.js') + read('src/lib/orbit/owner.js');
  assert.doesNotMatch(src, /from ['"](crypto|fs|path|child_process|firebase-admin)['"]|@\/lib\/firebaseAdmin/);
});
