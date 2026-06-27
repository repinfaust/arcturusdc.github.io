/**
 * Firestore + Storage security-rules tests (emulator-based).
 *
 * Purpose: lock in the 2026-06-27 security remediation so the fixed
 * vulnerabilities cannot silently regress. Each `test` is a security assertion;
 * a failing test means a rule has been weakened. Run in CI before deploy.
 *
 * Run:
 *   npm run test:rules         (starts the emulator + runs this suite)
 *
 * Requires: @firebase/rules-unit-testing, a JDK (Firebase emulator), and the
 * project's firestore.rules / storage.rules.
 */
const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');
const { setDoc, getDoc, doc, deleteDoc } = require('firebase/firestore');

const PROJECT_ID = 'stea-775cd-test';
const TENANT_A = 'tenantA';
const TENANT_B = 'tenantB';

let testEnv;

// Seed helper: write tenant_members so inTenant()/canAccessTenant() resolve.
async function seed(env) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // alice@ is an active member of TENANT_A only.
    await setDoc(doc(db, `tenant_members/alice@x.com_${TENANT_A}`), {
      userEmail: 'alice@x.com', tenantId: TENANT_A, status: 'active', role: 'member',
    });
    // A tenant-A card and a tenant-B card.
    await setDoc(doc(db, 'stea_cards/cardA'), { tenantId: TENANT_A, title: 'A' });
    await setDoc(doc(db, 'stea_cards/cardB'), { tenantId: TENANT_B, title: 'B' });
    await setDoc(doc(db, 'stea_epics/epicA'), { tenantId: TENANT_A, title: 'EA' });
    // A personal (tenant-less) project owned by alice.
    await setDoc(doc(db, 'projects/p_alice'), {
      ownerUid: 'alice', members: ['alice'], title: 'Felix-style personal',
    });
  });
}

// Auth context helpers.
const alice = () => testEnv.authenticatedContext('alice', { email: 'alice@x.com' }).firestore();
const mallory = () => testEnv.authenticatedContext('mallory', { email: 'mallory@evil.com' }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8') },
  });
});
afterAll(async () => { await testEnv?.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); await seed(testEnv); });

describe('P0 — hans_cases submissions are not publicly writable', () => {
  test('unauthenticated create is DENIED (was `if true`)', async () => {
    await assertFails(setDoc(doc(anon(), 'hans_cases/c1/submissions/s1'), { foo: 1 }));
  });
  test('authenticated create is allowed', async () => {
    await assertSucceeds(setDoc(doc(alice(), 'hans_cases/c1/submissions/s1'), { foo: 1 }));
  });
});

describe('P1 — tenant isolation (no escape hatch)', () => {
  test('member reads own-tenant card', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'stea_cards/cardA')));
  });
  test('member CANNOT read other-tenant card', async () => {
    await assertFails(getDoc(doc(alice(), 'stea_cards/cardB')));
  });
  test('non-member CANNOT read any tenant card', async () => {
    await assertFails(getDoc(doc(mallory(), 'stea_cards/cardA')));
  });
  test('cannot create a tenant-less card to land in the global bucket', async () => {
    await assertFails(setDoc(doc(alice(), 'stea_cards/cardX'), { title: 'no tenant' }));
  });
});

describe('P1 — comments are tenant-scoped', () => {
  test('member reads own-tenant epic comment', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'stea_epics/epicA/comments/c1'), { body: 'hi' }));
    await assertSucceeds(getDoc(doc(alice(), 'stea_epics/epicA/comments/c1')));
  });
  test('non-member CANNOT delete a comment in another tenant', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) =>
      setDoc(doc(ctx.firestore(), 'stea_epics/epicA/comments/c1'), { body: 'hi' }));
    await assertFails(deleteDoc(doc(mallory(), 'stea_epics/epicA/comments/c1')));
  });
});

describe('Decision — projects are membership-primary, tenant-optional', () => {
  test('owner reads their tenant-less personal project (not locked out)', async () => {
    await assertSucceeds(getDoc(doc(alice(), 'projects/p_alice')));
  });
  test('non-member CANNOT read someone else\'s personal project', async () => {
    await assertFails(getDoc(doc(mallory(), 'projects/p_alice')));
  });
});
