'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const MAGIC_LINK_EMAIL_KEY = 'sorr_controlui_magic_email';

const TOKENS = {
  surface: '#F8F9FF',
  surfaceLow: '#EFF4FF',
  surfaceCard: '#FFFFFF',
  text: '#0B1C30',
  textSoft: '#4C5D74',
  primary: '#001432',
  primaryContainer: '#10294D',
  secondary: '#006C50',
  secondarySoft: '#53FDC7',
  tertiary: '#FF5B33',
  tertiarySoft: '#FFDCCF',
};

const SHORTCUTS = [
  'Draft a customer update for a billing dispute after smart meter fault.',
  'Summarise a complaint escalation and propose policy-compliant remedy.',
  'Generate a tariff comparison summary for support advisors.',
  'Prepare safeguarding support steps for vulnerable customer arrears case.',
];

function TierBadge({ tier }) {
  const map = {
    1: { bg: '#D7F7EC', color: '#0B6B4D', label: 'T1 Low' },
    2: { bg: '#FFF0D8', color: '#865100', label: 'T2 Internal' },
    3: { bg: '#FFE0D4', color: '#A1420A', label: 'T3 Sensitive' },
    4: { bg: '#FFD7D2', color: '#8A1C17', label: 'T4 Critical' },
  };
  const tone = map[tier] || map[4];
  return (
    <span
      style={{
        borderRadius: 999,
        background: tone.bg,
        color: tone.color,
        fontSize: 12,
        fontWeight: 700,
        padding: '5px 10px',
      }}
    >
      {tone.label}
    </span>
  );
}

function StepDot({ active, done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 999,
          background: done ? TOKENS.secondarySoft : active ? '#A8EFD8' : '#CCD6E8',
          boxShadow: active ? '0 0 0 6px rgba(83,253,199,0.22)' : 'none',
        }}
      />
      <span style={{ color: active || done ? TOKENS.text : TOKENS.textSoft, fontSize: 13, fontWeight: active ? 700 : 500 }}>
        {label}
      </span>
    </div>
  );
}

export default function FrontDoorClient() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('entry');
  const [stage, setStage] = useState(0);
  const [requestBusy, setRequestBusy] = useState(false);
  const [decision, setDecision] = useState(null);
  const [executionText, setExecutionText] = useState('');
  const [executionBusy, setExecutionBusy] = useState(false);

  const stageLabels = useMemo(
    () => ['Keyword Scan', 'Semantic Match', 'Policy Resolution'],
    []
  );

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => undefined);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) return;

      try {
        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch {
        setAuthError('Could not establish secure session.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const cachedEmail = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
    const emailForLink = cachedEmail || window.prompt('Confirm your email to complete sign-in');
    if (!emailForLink) return;

    signInWithEmailLink(auth, emailForLink, window.location.href)
      .then(() => {
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch((error) => setAuthError(error?.message || 'Magic link sign-in failed.'));
  }, []);

  async function sendMagicLink() {
    const clean = email.trim();
    if (!clean) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const target = window.location.href.split('#')[0];
      await sendSignInLinkToEmail(auth, clean, { url: target, handleCodeInApp: true });
      window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, clean);
      setNotice(`Magic link sent to ${clean}`);
    } catch (error) {
      setAuthError(error?.message || 'Failed to send sign-in link.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function classifyRequest() {
    const clean = prompt.trim();
    if (!clean) return;

    setMode('classifying');
    setStage(0);
    setDecision(null);
    setExecutionText('');
    setNotice('');
    setRequestBusy(true);

    const t1 = setTimeout(() => setStage(1), 520);
    const t2 = setTimeout(() => setStage(2), 1120);

    try {
      const response = await fetch('/api/sorr/controlui/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: clean }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Classification failed.');

      setDecision({
        request: data.request,
        policy: data.policyBundle,
      });

      setTimeout(() => {
        setMode('decision');
        setPrompt('');
      }, 1300);
    } catch (error) {
      setNotice(error?.message || 'Classification failed.');
      setMode('entry');
    } finally {
      setRequestBusy(false);
      clearTimeout(t1);
      clearTimeout(t2);
    }
  }

  async function runFastLane() {
    if (!decision?.request?.id) return;
    setExecutionBusy(true);
    try {
      const response = await fetch('/api/sorr/controlui/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: decision.request.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Execution failed.');
      setExecutionText(data.draft || '');
      setMode('execution');
    } catch (error) {
      setNotice(error?.message || 'Execution failed.');
    } finally {
      setExecutionBusy(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await signOut(auth).catch(() => undefined);
  }

  if (!authReady) {
    return <div style={{ color: 'white' }}>Checking authentication...</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 620, margin: '56px auto', background: TOKENS.surfaceCard, borderRadius: 20, padding: 28 }}>
        <h1 style={{ margin: 0, color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 38, lineHeight: '40px' }}>SoRR Control</h1>
        <p style={{ marginTop: 8, color: TOKENS.textSoft }}>Employee front door access via magic link.</p>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            style={{ flex: 1, borderRadius: 12, border: 'none', background: TOKENS.surfaceLow, padding: '12px 14px', outline: 'none', color: TOKENS.text }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={authBusy || !email}
            style={{
              border: 'none',
              borderRadius: 12,
              background: 'linear-gradient(135deg,#10294D,#001432)',
              color: 'white',
              fontWeight: 700,
              padding: '0 15px',
              opacity: authBusy || !email ? 0.6 : 1,
            }}
          >
            {authBusy ? 'Sending...' : 'Send Link'}
          </button>
        </div>
        {authError ? <div style={{ marginTop: 10, fontSize: 13, color: '#A13A00' }}>{authError}</div> : null}
        {notice ? <div style={{ marginTop: 10, fontSize: 13, color: TOKENS.secondary }}>{notice}</div> : null}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1120, margin: '20px auto 46px', background: TOKENS.surface, borderRadius: 22, padding: 24, boxShadow: '0 26px 86px rgba(0,20,50,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 54, lineHeight: '56px' }}>
            What do you need to do?
          </h1>
          <p style={{ margin: '6px 0 0', color: TOKENS.textSoft, fontSize: 17 }}>
            Task-first entry for governed AI requests. Compliance appears at decision time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/apps/stea/sorr/controlui/approvals" style={{ textDecoration: 'none', color: TOKENS.primaryContainer, fontWeight: 700, fontSize: 14 }}>
            Approvals Queue
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            style={{ border: 'none', borderRadius: 10, background: TOKENS.surfaceLow, color: TOKENS.text, padding: '8px 10px', fontWeight: 600 }}
          >
            Logout
          </button>
        </div>
      </div>

      {mode === 'entry' ? (
        <section style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          <div style={{ background: TOKENS.surfaceLow, borderRadius: 18, padding: 18 }}>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={8}
              placeholder="Describe the task in natural language..."
              style={{ width: '100%', border: 'none', borderRadius: 14, background: TOKENS.surfaceCard, padding: 14, fontSize: 15, color: TOKENS.text, outline: 'none' }}
            />
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SHORTCUTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPrompt(item)}
                  style={{ border: 'none', borderRadius: 999, background: TOKENS.surfaceCard, color: TOKENS.textSoft, fontSize: 12, padding: '7px 12px' }}
                >
                  Shortcut
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={classifyRequest}
              disabled={requestBusy || !prompt.trim()}
              style={{
                marginTop: 12,
                border: 'none',
                borderRadius: 12,
                background: 'linear-gradient(135deg,#10294D,#001432)',
                color: 'white',
                fontWeight: 700,
                padding: '10px 14px',
                transform: requestBusy ? 'scale(0.98)' : 'scale(1)',
                opacity: requestBusy || !prompt.trim() ? 0.65 : 1,
              }}
            >
              {requestBusy ? 'Classifying...' : 'Classify Request'}
            </button>
          </div>

          <div style={{ background: TOKENS.surfaceLow, borderRadius: 18, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: TOKENS.primaryContainer, textTransform: 'uppercase' }}>
              Front Door Flow
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 11 }}>
              <StepDot active={false} done={false} label="Request Entry" />
              <StepDot active={false} done={false} label="Classification" />
              <StepDot active={false} done={false} label="Policy Decision" />
              <StepDot active={false} done={false} label="Execution" />
            </div>
          </div>
        </section>
      ) : null}

      {mode === 'classifying' ? (
        <section style={{ marginTop: 22, background: TOKENS.surfaceLow, borderRadius: 18, padding: 20 }}>
          <h2 style={{ margin: 0, color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 38, lineHeight: '40px' }}>
            Classifying...
          </h2>
          <p style={{ marginTop: 6, color: TOKENS.textSoft }}>Building trust through transparent governance checks.</p>
          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {stageLabels.map((label, idx) => (
              <StepDot key={label} active={stage === idx} done={stage > idx} label={label} />
            ))}
          </div>
        </section>
      ) : null}

      {mode === 'decision' && decision ? (
        <section style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: TOKENS.surfaceLow, borderRadius: 18, padding: 18 }}>
            <h2 style={{ margin: 0, color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 36, lineHeight: '38px' }}>
              Policy Decision
            </h2>
            <div style={{ marginTop: 12, color: TOKENS.text, fontSize: 14 }}>
              <strong>Matched Use Case:</strong> {decision.policy.matchedUseCase?.name || 'Blocked / Unknown'}
            </div>
            <div style={{ marginTop: 8 }}>
              <TierBadge tier={decision.policy.tier} />
            </div>
            <div style={{ marginTop: 8, color: TOKENS.textSoft, fontSize: 14 }}>
              Route: <strong>{decision.policy.route}</strong> | Confidence: <strong>{decision.policy.confidence}</strong>
            </div>
          </div>

          <div style={{ background: TOKENS.surfaceLow, borderRadius: 18, padding: 18 }}>
            <div style={{ color: TOKENS.secondary, fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Rules of Engagement
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              <div style={{ background: '#E6FCF3', borderRadius: 12, padding: 12 }}>
                <div style={{ color: TOKENS.secondary, fontWeight: 700, fontSize: 13 }}>Permitted Tools</div>
                <div style={{ marginTop: 5, color: TOKENS.textSoft, fontSize: 13 }}>
                  {(decision.policy.permittedTools || []).join(', ') || 'None'}
                </div>
              </div>
              <div style={{ background: TOKENS.tertiarySoft, borderRadius: 12, padding: 12 }}>
                <div style={{ color: '#8E2D1A', fontWeight: 700, fontSize: 13 }}>Blocked Actions</div>
                <div style={{ marginTop: 5, color: TOKENS.textSoft, fontSize: 13 }}>
                  {(decision.policy.blockedActions || []).join(', ') || 'None'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {decision.policy.route === 'immediate' ? (
              <button
                type="button"
                onClick={runFastLane}
                disabled={executionBusy}
                style={{
                  border: 'none',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg,#10294D,#001432)',
                  color: 'white',
                  fontWeight: 700,
                  padding: '10px 14px',
                  transform: executionBusy ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                {executionBusy ? 'Executing...' : 'Run Fast Lane'}
              </button>
            ) : null}
            {decision.policy.route === 'approval' ? (
              <Link
                href="/apps/stea/sorr/controlui/approvals"
                style={{ textDecoration: 'none', borderRadius: 12, background: TOKENS.tertiarySoft, color: '#8E2D1A', fontWeight: 700, padding: '10px 14px' }}
              >
                Draft Held - Open Approval Queue
              </Link>
            ) : null}
            {decision.policy.route === 'workspace' ? (
              <Link
                href="/apps/stea/sorr/controlui/workspace"
                style={{ textDecoration: 'none', borderRadius: 12, background: TOKENS.surfaceLow, color: TOKENS.primaryContainer, fontWeight: 700, padding: '10px 14px' }}
              >
                Open Governed Workspace
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setMode('entry')}
              style={{ border: 'none', borderRadius: 12, background: TOKENS.surfaceLow, color: TOKENS.textSoft, padding: '10px 14px' }}
            >
              New Request
            </button>
          </div>
        </section>
      ) : null}

      {mode === 'execution' ? (
        <section style={{ marginTop: 22, background: TOKENS.surfaceLow, borderRadius: 18, padding: 18 }}>
          <h2 style={{ margin: 0, color: TOKENS.primary, fontFamily: 'var(--font-controlui-display)', fontSize: 36, lineHeight: '38px' }}>
            Fast Lane Output
          </h2>
          <pre
            style={{
              marginTop: 12,
              borderRadius: 12,
              background: TOKENS.surfaceCard,
              padding: 12,
              color: TOKENS.textSoft,
              whiteSpace: 'pre-wrap',
              fontSize: 13,
              lineHeight: '18px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}
          >
            {executionText || 'No output generated.'}
          </pre>
          <button
            type="button"
            onClick={() => setMode('entry')}
            style={{ marginTop: 10, border: 'none', borderRadius: 12, background: TOKENS.surfaceCard, color: TOKENS.textSoft, padding: '10px 14px' }}
          >
            Start Another Request
          </button>
        </section>
      ) : null}

      {notice ? <div style={{ marginTop: 10, color: TOKENS.secondary, fontSize: 13 }}>{notice}</div> : null}
    </div>
  );
}
