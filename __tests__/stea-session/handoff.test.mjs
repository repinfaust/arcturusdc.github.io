import test from 'node:test';
import assert from 'node:assert/strict';
import { handoffSteaSession, sanitizeSteaNext } from '../../src/lib/steaSessionHandoff.mjs';

function browser() {
  const records = new Map();
  const navigations = [];
  return {
    location: { replace: (path) => navigations.push(path) },
    storage: {
      getItem: (key) => records.get(key) ?? null,
      setItem: (key, value) => records.set(key, value),
    },
    navigations,
    records,
  };
}

test('session handoff uses a fresh document navigation and bounds a repeated server bounce', () => {
  const tab = browser();
  const path = '/apps/stea/career';
  assert.equal(handoffSteaSession(path, { ...tab, now: 100_000 }), true);
  assert.deepEqual(tab.navigations, [path]);
  assert.equal(handoffSteaSession(path, { ...tab, now: 101_000 }), false);
  assert.deepEqual(tab.navigations, [path]);
  assert.equal(handoffSteaSession(path, { ...tab, now: 130_000 }), true);
  assert.deepEqual(tab.navigations, [path, path]);
});

test('another destination or a fresh tab can establish its own handoff', () => {
  const tab = browser();
  handoffSteaSession('/apps/stea/career', { ...tab, now: 100_000 });
  assert.equal(handoffSteaSession('/apps/stea/harls', { ...tab, now: 101_000 }), true);
  assert.equal(handoffSteaSession('/apps/stea/career', { ...browser(), now: 101_000 }), true);
});

test('local nested destinations retain their query and fragment', () => {
  const path = '/apps/stea/career/apply?role=123#answers';
  assert.equal(sanitizeSteaNext(path), path);
  const tab = browser();
  handoffSteaSession(path, { ...tab, now: 100_000 });
  assert.deepEqual(tab.navigations, [path]);
});

test('external destinations and sign-in self redirects cannot become document navigations', () => {
  for (const value of [undefined, '', 'https://example.com', '//example.com', '/\\example.com',
    '/\n/example.com', '/apps/stea', '/apps/stea?next=/apps/stea/career', '/apps/stea/',
    '/apps/stea/career/..', '/stea#login']) {
    assert.equal(sanitizeSteaNext(value), null, String(value));
    const tab = browser();
    assert.throws(() => handoffSteaSession(value, { ...tab, now: 100_000 }));
    assert.deepEqual(tab.navigations, []);
    assert.equal(tab.records.size, 0);
  }
});
