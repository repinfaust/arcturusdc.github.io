const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

async function mount(next, loginResponse) {
  const handoff = await import('../../src/lib/steaSessionHandoff.mjs');
  const values = [];
  const effects = [];
  const navigations = [];
  let cursor = 0;
  let authCallback;
  let signedOut = false;
  const slot = (initial) => {
    const index = cursor++;
    if (!(index in values)) values[index] = initial;
    return [values[index], (value) => { values[index] = value; }];
  };
  const hooks = {
    useState: slot,
    useRef: (value) => slot({ current: value })[0],
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useEffect: (fn) => effects.push(fn),
  };
  const records = new Map();
  const mocks = {
    react: { ...React, ...hooks },
    'next/navigation': {
      useRouter: () => ({ replace: () => assert.fail('session handoff used the soft router') }),
      useSearchParams: () => new URLSearchParams(next ? { next } : {}),
    },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', { ...props, 'data-soft-navigation': true }, children) },
    'next/image': { default: () => null },
    '@/lib/firebase': { auth: {}, googleProvider: {}, microsoftProvider: {} },
    'firebase/auth': {
      onAuthStateChanged: (_, callback) => { authCallback = callback; return () => {}; },
      signOut: async () => { signedOut = true; },
    },
    '@/contexts/TenantContext': {
      useTenant: () => ({ currentTenant: { id: 'test', name: 'Career Ops' }, availableTenants: [], loading: false }),
    },
    '@/components/TenantSwitcher': { default: () => null },
    '@/components/workspace/WorkspacePulse': { default: () => null },
    '@/lib/steaAppCatalog': { isSteaAppAllowed: ({ appKey }) => ['career', 'art-atlas'].includes(appKey) },
    '@/lib/steaSessionHandoff.mjs': handoff,
    'react/jsx-runtime': require('react/jsx-runtime'),
  };
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync('src/app/apps/stea/page.js', 'utf8'), {
    fileName: 'page.jsx',
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports: module.exports,
    require: (name) => {
      assert.ok(name in mocks, `Unexpected dependency: ${name}`);
      return mocks[name];
    },
    URLSearchParams,
    console: { error: () => {} },
    fetch: async () => loginResponse,
    window: {
      location: { replace: (path) => navigations.push(path) },
      sessionStorage: {
        getItem: (key) => records.get(key) ?? null,
        setItem: (key, value) => records.set(key, value),
        removeItem: (key) => records.delete(key),
      },
    },
  });
  const render = () => {
    cursor = 0;
    return renderToStaticMarkup(module.exports.default());
  };
  render();
  effects[0]();
  return {
    render, navigations,
    authenticate: () => authCallback({ uid: 'test', displayName: 'Test', getIdToken: async () => 'test-token' }),
    unauthenticate: () => authCallback(null),
    signedOut: () => signedOut,
  };
}

test('no app links or navigation appear until cookie creation completes', async () => {
  let resolveLogin;
  const pending = new Promise((resolve) => { resolveLogin = resolve; });
  const page = await mount('/apps/stea/career', pending);
  const authWork = page.authenticate();
  assert.match(page.render(), /Checking STEa access/);
  assert.deepEqual(page.navigations, []);
  resolveLogin({ ok: true });
  await authWork;
  assert.deepEqual(page.navigations, ['/apps/stea/career']);
});

test('failed cookie creation stays off protected pages and reports an error', async () => {
  const page = await mount('/apps/stea/career', { ok: false, status: 401 });
  await page.authenticate();
  assert.deepEqual(page.navigations, []);
  assert.equal(page.signedOut(), true);
  assert.match(page.render(), /trouble creating your session/);
});

test('STEa app cards use document links while public cards retain soft navigation', async () => {
  const page = await mount('', { ok: true });
  await page.authenticate();
  const html = page.render();
  const career = html.match(/<a[^>]*href="\/apps\/stea\/career"[^>]*>/)[0];
  const publicCard = html.match(/<a[^>]*href="\/portfolio\/art-atlas"[^>]*>/)[0];
  assert.doesNotMatch(career, /data-soft-navigation/);
  assert.match(publicCard, /data-soft-navigation/);
});

test('an immediate bounce displays an error without another automatic navigation', async () => {
  const page = await mount('/apps/stea/career', { ok: true });
  await page.authenticate();
  await page.authenticate();
  assert.deepEqual(page.navigations, ['/apps/stea/career']);
  assert.match(page.render(), /Automatic retries have stopped/);
  assert.equal(page.signedOut(), false);
});

test('signing out permits a fresh sign-in to retry the destination immediately', async () => {
  const page = await mount('/apps/stea/career', { ok: true });
  await page.authenticate();
  await page.unauthenticate();
  await page.authenticate();
  assert.deepEqual(page.navigations, ['/apps/stea/career', '/apps/stea/career']);
});
