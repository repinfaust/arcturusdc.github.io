import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { state } from './mailer.mjs';
import { POST } from '../../src/app/api/mandrake/deletion-request/route.js';

const UID = 'TEST_ONLY_DO_NOT_DELETE';
const request = (body, headers = {}) => new Request('https://www.arcturusdc.com/api/mandrake/deletion-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: 'https://www.arcturusdc.com', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

beforeEach(() => {
  state.messages = [];
  state.failure = null;
  state.accepted = ['info@arcturusdc.com'];
  state.closed = 0;
  Object.assign(process.env, { SMTP_HOST: 'smtp.example.test', SMTP_PORT: '465', SMTP_USER: 'sender@example.test', SMTP_PASS: 'test-only', SMTP_SECURE: 'true' });
});

test('a UID-only request forwards to the fixed inbox without identity or request metadata', async () => {
  const res = await POST(request({ uid: ` ${UID} `, website: '' }, { Cookie: 'private-cookie', 'User-Agent': 'private-agent', 'X-Forwarded-For': '192.0.2.1' }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(state.messages.length, 1);
  const mail = state.messages[0];
  assert.equal(mail.to, 'info@arcturusdc.com');
  assert.ok(mail.text.includes(`UID: ${UID}\n`));
  assert.ok(!('replyTo' in mail));
  for (const value of ['private-cookie', 'private-agent', '192.0.2.1']) assert.ok(!JSON.stringify(mail).includes(value));
  assert.equal(state.closed, 1);
});

test('SMTP failure reports failure instead of confirming an unsent request', async () => {
  state.failure = new Error(`SMTP failure containing ${UID}`);
  const res = await POST(request({ uid: UID }));
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { ok: false, error: 'unavailable' });
  assert.equal(state.closed, 1);
});

test('SMTP recipient refusal is not reported as a success', async () => {
  state.accepted = [];
  const res = await POST(request({ uid: UID }));
  assert.equal(res.status, 503);
  assert.equal((await res.json()).ok, false);
});

test('missing SMTP configuration fails before attempting delivery', async () => {
  delete process.env.SMTP_PASS;
  const res = await POST(request({ uid: UID }));
  assert.equal(res.status, 503);
  assert.equal(state.messages.length, 0);
});

test('malformed input, contact details, bot submissions and header injection never reach SMTP', async () => {
  for (const body of ['{', null, [], {}, { uid: 123 }, { uid: '' }, { uid: 'a'.repeat(129) }, { uid: 'test\nBcc: someone@example.test' }, { uid: UID, email: 'person@example.test' }, { uid: UID, website: 'bot' }]) {
    const res = await POST(request(body));
    assert.equal(res.status, 400);
  }
  assert.equal(state.messages.length, 0);
});

test('a cross-origin browser submission is rejected', async () => {
  const res = await POST(request({ uid: UID }, { Origin: 'https://other.example.test' }));
  assert.equal(res.status, 403);
  assert.equal(state.messages.length, 0);
});

test('unsupported body formats are rejected', async () => {
  const res = await POST(request('uid=test', { 'Content-Type': 'application/x-www-form-urlencoded' }));
  assert.equal(res.status, 415);
  assert.equal(state.messages.length, 0);
});

test('oversized bodies are bounded even without Content-Length', async () => {
  const res = await POST(request({ uid: 'a'.repeat(5000) }));
  assert.equal(res.status, 413);
  assert.equal(state.messages.length, 0);
});
