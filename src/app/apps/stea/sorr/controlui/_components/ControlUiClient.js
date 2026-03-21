'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const NAV_ITEMS = [
  { id: 'overview', href: '/apps/stea/sorr/controlui/overview', label: 'Dashboard' },
  { id: 'request', href: '/apps/stea/sorr/controlui/request', label: 'Requests' },
  { id: 'approvals', href: '/apps/stea/sorr/controlui/approvals', label: 'Approvals' },
  { id: 'audit', href: '/apps/stea/sorr/controlui/audit', label: 'Audit' },
  { id: 'classification', href: '/apps/stea/sorr/controlui/classification', label: 'Security Policy' },
  { id: 'workspace', href: '/apps/stea/sorr/controlui/workspace', label: 'Resource Hub' },
];

const SHORTCUTS = [
  'Analyse churn across our last three customer cohorts.',
  'Combine feature adoption data with support feedback themes and summarise likely drivers.',
  'Run the pricing review agent against this quarter’s usage data.',
  'Create a workspace that tracks onboarding drop-off weekly and updates the report.',
  'Turn this analysis into a product update for leadership.',
];

const PRODUCT_POC_LINKS = [
  { href: '/apps/stea/sorr/controlui', label: 'Product Overview' },
  { href: '/apps/stea/sorr/controlui/handoff', label: 'Claude Handoff States' },
  { href: '/apps/stea/sorr/controlui/use-cases', label: 'Governed Use Cases' },
  { href: '/apps/stea/sorr/controlui/implementation', label: 'Implementation' },
  { href: '/apps/stea/sorr/controlui/fulfilment-loop', label: 'Fulfilment Loop' },
  { href: '/apps/stea/sorr/controlui/admin-preview', label: 'Admin Console Preview' },
];

const TOKENS = {
  page: '#E4E8F0',
  side: '#CBD2DE',
  sideActive: '#F4F6FA',
  main: '#E8EBF3',
  card: '#F7F8FC',
  cardAlt: '#F3F5FB',
  navy: '#10294D',
  navyDeep: '#001432',
  text: '#0B1C30',
  textSoft: '#4F5D70',
  mint: '#53FDC7',
  mintText: '#006C50',
  orange: '#FF5B33',
  orangeSoft: '#F8D8D0',
  t1: '#44D6A4',
  t2: '#FFB650',
  t3: '#FF7A45',
  t4: '#E54747',
};

const tierTone = {
  1: { bg: '#D8F8EC', text: '#086A4B', label: 'T1 Low Risk' },
  2: { bg: '#FFEBCB', text: '#835300', label: 'T2 Internal' },
  3: { bg: '#FFD9C8', text: '#A13A00', label: 'T3 Sensitive' },
  4: { bg: '#FFD7D7', text: '#8A1B1B', label: 'T4 Critical' },
};

function fmtDate(value) {
  if (!value) return 'n/a';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'n/a';
  return d.toLocaleString();
}

function MetricCard({ icon, status, title, value, sub }) {
  return (
    <div style={{ background: TOKENS.card, borderRadius: 16, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: TOKENS.cardAlt, display: 'grid', placeItems: 'center', color: TOKENS.navy, fontWeight: 700 }}>
          {icon}
        </div>
        <span style={{ borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, background: status?.bg || '#E5EAF5', color: status?.color || TOKENS.textSoft }}>
          {status?.label || 'ACTIVE'}
        </span>
      </div>
      <div style={{ marginTop: 18, fontSize: 14, color: TOKENS.textSoft }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 50, lineHeight: '52px', letterSpacing: '-0.04em', color: TOKENS.navyDeep, fontFamily: 'var(--font-controlui-display)' }}>{value}</div>
      {sub ? <div style={{ marginTop: 6, fontSize: 13, color: TOKENS.textSoft }}>{sub}</div> : null}
    </div>
  );
}

function TierPill({ tier }) {
  const tone = tierTone[tier] || tierTone[4];
  return (
    <span style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: tone.bg, color: tone.text }}>
      {tone.label}
    </span>
  );
}

function SimpleBars() {
  const bars = [42, 68, 55, 88, 62, 58, 47, 72, 81, 43, 51, 64];
  return (
    <div style={{ marginTop: 22, padding: '8px 8px 0', height: 320, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 10, alignItems: 'end' }}>
      {bars.map((h, idx) => (
        <div key={`${idx}-${h}`} style={{ height: `${h}%`, borderRadius: '10px 10px 0 0', background: idx === 3 ? TOKENS.mintText : '#C9D6EC' }} />
      ))}
    </div>
  );
}

export default function ControlUiClient({ activeView }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [kpis, setKpis] = useState(null);
  const [requests, setRequests] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [prompt, setPrompt] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [notice, setNotice] = useState('');

  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalsBusy, setApprovalsBusy] = useState(false);

  const [draftBusy, setDraftBusy] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftProvider, setDraftProvider] = useState('');

  const pendingApprovals = useMemo(() => requests.filter((r) => r.status === 'PENDING_APPROVAL'), [requests]);
  const selectedRequest = useMemo(() => requests.find((r) => r.id === selectedRequestId) || null, [requests, selectedRequestId]);
  const criticalRecent = useMemo(() => requests.filter((r) => Number(r.tier) >= 3).slice(0, 5), [requests]);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/sorr/controlui/bootstrap', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load SoRR Control data.');
      }
      setKpis(data.kpis || null);
      setRequests(data.requests || []);
      setAuditLog(data.auditLog || []);
      if (!selectedRequestId && data.requests?.length) setSelectedRequestId(data.requests[0].id);
    } catch (error) {
      setLoadError(error?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

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
        setAuthError('Could not establish a secure session cookie.');
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
      .catch((error) => {
        setAuthError(error?.message || 'Magic link sign-in failed.');
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

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
      const code = error?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError('Email-link sign-in is not enabled in Firebase Authentication for this project.');
      } else if (code === 'auth/unauthorized-continue-uri') {
        setAuthError('Current domain is not authorized for email-link sign-in.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(error?.message || 'Failed to send sign-in link.');
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      await signOut(auth).catch(() => undefined);
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitRequest() {
    const text = prompt.trim();
    if (!text) return;
    setRequestBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/sorr/controlui/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Classification failed.');
      }
      setClassificationResult({ request: data.request, policyBundle: data.policyBundle });
      setPrompt('');
      setNotice(`Request ${data.request.id} created.`);
      await loadData();
    } catch (error) {
      setNotice(error?.message || 'Failed to submit request.');
    } finally {
      setRequestBusy(false);
    }
  }

  async function applyApproval(action) {
    if (!selectedRequestId) return;
    setApprovalsBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/sorr/controlui/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequestId, action, note: approvalNote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Approval action failed.');
      setNotice(`Request ${selectedRequestId} updated: ${data.requestStatus}.`);
      setApprovalNote('');
      await loadData();
    } catch (error) {
      setNotice(error?.message || 'Approval action failed.');
    } finally {
      setApprovalsBusy(false);
    }
  }

  async function generateDraft() {
    if (!selectedRequestId) return;
    setDraftBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/sorr/controlui/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequestId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Draft generation failed.');
      setDraftText(data.draft || '');
      setDraftProvider(data.provider || '');
      setNotice(`Draft generated for ${selectedRequestId}.`);
      await loadData();
    } catch (error) {
      setNotice(error?.message || 'Draft generation failed.');
    } finally {
      setDraftBusy(false);
    }
  }

  if (!authReady) {
    return <div style={{ color: '#fff' }}>Checking authentication...</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 600, margin: '48px auto', background: TOKENS.card, borderRadius: 24, padding: 30, boxShadow: '0 24px 80px rgba(0,20,50,0.18)' }}>
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: '40px', color: TOKENS.navyDeep, fontFamily: 'var(--font-controlui-display)' }}>SoRR Control</h1>
        <p style={{ marginTop: 10, color: TOKENS.textSoft, fontSize: 16 }}>
          This proof of concept is gated behind magic-link authentication.
        </p>
        <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            style={{ flex: 1, borderRadius: 12, border: 'none', background: '#E9EEF8', padding: '12px 14px', fontSize: 14, outline: 'none', color: TOKENS.text }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={authBusy || !email}
            style={{ border: 'none', borderRadius: 12, padding: '0 16px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #10294D, #001432)', opacity: authBusy || !email ? 0.6 : 1 }}
          >
            {authBusy ? 'Sending...' : 'Send Link'}
          </button>
        </div>
        {authError ? <p style={{ marginTop: 12, color: '#A13A00', fontSize: 13 }}>{authError}</p> : null}
        {notice ? <p style={{ marginTop: 12, color: TOKENS.mintText, fontSize: 13 }}>{notice}</p> : null}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', background: TOKENS.page, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,20,50,0.25)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr' }}>
        <aside style={{ background: TOKENS.side, padding: 20, minHeight: '85vh' }}>
          <div style={{ padding: 14, borderRadius: 14, background: TOKENS.card }}>
            <div style={{ color: TOKENS.navyDeep, fontWeight: 800, fontSize: 32, lineHeight: '28px', fontFamily: 'var(--font-controlui-display)' }}>ENSEK</div>
            <div style={{ marginTop: 6, color: '#7084A5', fontSize: 12, letterSpacing: '0.11em', textTransform: 'uppercase' }}>Enterprise Control</div>
          </div>

          <nav style={{ marginTop: 18, display: 'grid', gap: 8 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  background: activeView === item.id ? TOKENS.sideActive : 'transparent',
                  color: activeView === item.id ? TOKENS.mintText : '#2D415F',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: 20, borderRadius: 12, background: '#D8DEE9', padding: 10 }}>
            <div style={{ color: '#556C8F', fontSize: 11, letterSpacing: '0.09em', textTransform: 'uppercase', fontWeight: 700 }}>
              Product POC
            </div>
            <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
              {PRODUCT_POC_LINKS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      textDecoration: 'none',
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontSize: 12,
                      fontWeight: active ? 700 : 600,
                      background: active ? '#F4F6FA' : '#E7EBF3',
                      color: active ? TOKENS.primaryContainer : '#425879',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={authBusy}
              style={{ border: 'none', borderRadius: 12, background: TOKENS.card, padding: '10px 12px', textAlign: 'left', color: '#2D415F', fontWeight: 600 }}
            >
              {authBusy ? 'Signing out...' : 'Logout'}
            </button>
            <div style={{ color: '#556C8F', fontSize: 12 }}>Signed in as {user.email}</div>
          </div>
        </aside>

        <main style={{ background: TOKENS.main, padding: 24 }}>
          <header style={{ background: '#D9DEEA', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 40, lineHeight: '44px', fontFamily: 'var(--font-controlui-display)' }}>SoRR Control</h1>
              <div style={{ color: TOKENS.mintText, fontWeight: 700 }}>Overview</div>
              <div style={{ color: '#2D415F' }}>Security Policy</div>
              <div style={{ color: '#2D415F' }}>Resource Hub</div>
            </div>
            <div style={{ minWidth: 250, background: '#C6D6ED', borderRadius: 12, padding: '10px 14px', color: '#48638A', fontSize: 14 }}>
              Search governance logs...
            </div>
          </header>

          {loading ? <p style={{ marginTop: 14, color: TOKENS.textSoft }}>Loading SoRR Control data...</p> : null}
          {loadError ? <p style={{ marginTop: 14, color: '#A13A00' }}>{loadError}</p> : null}
          {notice ? <p style={{ marginTop: 14, color: TOKENS.mintText }}>{notice}</p> : null}

          {activeView === 'overview' ? (
            <section style={{ marginTop: 16 }}>
              <h2 style={{ margin: 0, fontSize: 62, lineHeight: '64px', letterSpacing: '-0.04em', color: TOKENS.navyDeep, fontFamily: 'var(--font-controlui-display)' }}>Operational Command</h2>
              <p style={{ marginTop: 6, marginBottom: 0, fontSize: 18, color: TOKENS.textSoft }}>Real-time AI governance and safety-over-resource compliance.</p>

              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
                <MetricCard icon="🚀" status={{ label: 'ACTIVE TODAY', bg: '#D6F3EA', color: '#0F6A50' }} title="Total Requests Today" value={kpis?.throughput24h ?? 1284} />
                <MetricCard icon="🛡️" status={{ label: 'T1 LOW RISK', bg: '#BFF7E4', color: '#086A4B' }} title="Average Risk Score" value={`${kpis?.avgRiskScore ?? 0.12}`} sub="/1.0" />
                <MetricCard icon="🗂️" status={{ label: 'ACTION REQUIRED', bg: TOKENS.orangeSoft, color: '#8E2D1A' }} title="Pending Approvals" value={kpis?.pendingApprovals ?? 42} />
              </div>

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
                <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                  <div style={{ color: TOKENS.navyDeep, fontSize: 34, lineHeight: '38px', fontFamily: 'var(--font-controlui-display)' }}>Request Volume</div>
                  <div style={{ marginTop: 2, color: TOKENS.textSoft }}>Intra-day governance throughput (24h)</div>
                  <SimpleBars />
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ borderRadius: 16, padding: 20, color: '#D9EDFF', background: 'linear-gradient(135deg,#10294D,#001432)' }}>
                    <div style={{ color: '#53FDC7', fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>System Health</div>
                    <div style={{ marginTop: 8, fontSize: 48, lineHeight: '50px', fontFamily: 'var(--font-controlui-display)' }}>Operational Optimal</div>
                    <p style={{ marginTop: 10, marginBottom: 0, color: '#9AC1DF', fontSize: 15 }}>Latency remains below 45ms. All safety-gate clusters are responding within parameters.</p>
                  </div>

                  <div style={{ borderRadius: 16, padding: 18, background: TOKENS.card }}>
                    <div style={{ fontSize: 13, letterSpacing: '0.08em', fontWeight: 700, color: TOKENS.navyDeep, textTransform: 'uppercase' }}>Recent Critical Tiers</div>
                    <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
                      {criticalRecent.map((r) => (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ color: TOKENS.text, fontSize: 14 }}>{r.id}</span>
                          <TierPill tier={Number(r.tier)} />
                        </div>
                      ))}
                      {!criticalRecent.length ? <div style={{ color: TOKENS.textSoft, fontSize: 13 }}>No T3/T4 items currently.</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeView === 'request' ? (
            <section style={{ marginTop: 16, display: 'grid', gap: 14 }}>
              <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                <h2 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 42, lineHeight: '44px', fontFamily: 'var(--font-controlui-display)' }}>Review Access</h2>
                <p style={{ marginTop: 4, color: TOKENS.textSoft }}>Task-first input with access review and governed routing.</p>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={6}
                  placeholder="What do you need to do?"
                  style={{ marginTop: 12, width: '100%', borderRadius: 14, border: 'none', background: TOKENS.cardAlt, padding: 14, color: TOKENS.text, fontSize: 15, outline: 'none' }}
                />
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SHORTCUTS.map((item) => (
                    <button key={item} type="button" onClick={() => setPrompt(item)} style={{ border: 'none', borderRadius: 999, background: '#E1E7F5', color: '#2D415F', padding: '6px 11px', fontSize: 12, fontWeight: 700 }}>
                      Use Case Shortcut
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={requestBusy || !prompt.trim()}
                  style={{ marginTop: 12, border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#10294D,#001432)', color: 'white', fontWeight: 700, padding: '10px 14px', opacity: requestBusy || !prompt.trim() ? 0.6 : 1 }}
                >
                  {requestBusy ? 'Reviewing access...' : 'Review Access'}
                </button>
              </div>

              {classificationResult ? (
                <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                  <div style={{ color: TOKENS.navyDeep, fontWeight: 700, fontSize: 15 }}>What happens next</div>
                  <div style={{ marginTop: 8, color: TOKENS.textSoft, fontSize: 14 }}>Request: {classificationResult.request.id}</div>
                  <div style={{ color: TOKENS.textSoft, fontSize: 14 }}>Use case: {classificationResult.policyBundle.matchedUseCase?.name || 'Blocked/Unknown'}</div>
                  <div style={{ color: TOKENS.textSoft, fontSize: 14 }}>Route: {classificationResult.policyBundle.route}</div>
                  <div style={{ color: TOKENS.textSoft, fontSize: 14 }}>Confidence: {classificationResult.policyBundle.confidence}</div>
                  <div style={{ color: TOKENS.textSoft, fontSize: 14 }}>Allowed actions: {(classificationResult.policyBundle.permittedTools || []).join(', ') || 'None'}</div>
                  <div style={{ color: TOKENS.textSoft, fontSize: 14 }}>Cannot use enterprise tools: {(classificationResult.policyBundle.blockedActions || []).join(', ') || 'None'}</div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeView === 'classification' ? (
            <section style={{ marginTop: 16, background: TOKENS.card, borderRadius: 16, padding: 20 }}>
              <h2 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 42, lineHeight: '44px', fontFamily: 'var(--font-controlui-display)' }}>What Happens Next</h2>
              <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
                {requests.slice(0, 14).map((row) => (
                  <div key={row.id} style={{ background: TOKENS.cardAlt, borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ color: TOKENS.navyDeep, fontWeight: 700 }}>{row.id}</div>
                      <TierPill tier={Number(row.tier)} />
                    </div>
                    <div style={{ marginTop: 4, color: TOKENS.textSoft, fontSize: 13 }}>Matched use case: {row.useCaseId || 'NONE'} | Route: {row.route || 'blocked'} | Confidence: {row.confidence ?? 'n/a'}</div>
                    <div style={{ marginTop: 3, color: '#7084A5', fontSize: 12 }}>Updated: {fmtDate(row.updatedAt)}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeView === 'approvals' ? (
            <section style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                <h2 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 42, lineHeight: '44px', fontFamily: 'var(--font-controlui-display)' }}>Approvals Queue</h2>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  {pendingApprovals.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedRequestId(row.id)}
                      style={{
                        border: 'none',
                        borderRadius: 12,
                        background: selectedRequestId === row.id ? TOKENS.navy : TOKENS.cardAlt,
                        color: selectedRequestId === row.id ? 'white' : TOKENS.text,
                        textAlign: 'left',
                        padding: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{row.id}</span>
                        <TierPill tier={Number(row.tier)} />
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, opacity: 0.85 }}>{row.useCaseName}</div>
                    </button>
                  ))}
                  {!pendingApprovals.length ? <div style={{ color: TOKENS.textSoft }}>No pending approvals.</div> : null}
                </div>
              </div>

              <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                <h3 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 28, lineHeight: '30px', fontFamily: 'var(--font-controlui-display)' }}>Decision</h3>
                <div style={{ marginTop: 8, color: TOKENS.textSoft, fontSize: 14 }}>Selected request: {selectedRequest?.id || 'None selected'}</div>
                <textarea
                  value={approvalNote}
                  onChange={(event) => setApprovalNote(event.target.value)}
                  rows={4}
                  placeholder="Rejection note required when rejecting"
                  style={{ marginTop: 10, width: '100%', borderRadius: 12, border: 'none', background: TOKENS.cardAlt, padding: 12, outline: 'none', color: TOKENS.text }}
                />
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => applyApproval('APPROVE')} disabled={approvalsBusy || !selectedRequestId} style={{ border: 'none', borderRadius: 12, background: TOKENS.mintText, color: 'white', fontWeight: 700, padding: '9px 12px', opacity: approvalsBusy || !selectedRequestId ? 0.6 : 1 }}>Approve</button>
                  <button type="button" onClick={() => applyApproval('REJECT')} disabled={approvalsBusy || !selectedRequestId} style={{ border: 'none', borderRadius: 12, background: TOKENS.orange, color: 'white', fontWeight: 700, padding: '9px 12px', opacity: approvalsBusy || !selectedRequestId ? 0.6 : 1 }}>Reject</button>
                </div>
              </div>
            </section>
          ) : null}

          {activeView === 'audit' ? (
            <section style={{ marginTop: 16, background: TOKENS.card, borderRadius: 16, padding: 20 }}>
              <h2 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 42, lineHeight: '44px', fontFamily: 'var(--font-controlui-display)' }}>Audit Trail</h2>
              <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
                {auditLog.slice(0, 50).map((item) => (
                  <div key={item.id} style={{ background: TOKENS.cardAlt, borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: TOKENS.navyDeep }}>
                      <strong>{item.action}</strong>
                      <span style={{ color: '#6F829E', fontSize: 12 }}>{fmtDate(item.createdAt)}</span>
                    </div>
                    <div style={{ marginTop: 4, color: TOKENS.textSoft, fontSize: 13 }}>Request: {item.requestId || 'n/a'} | Actor: {item.actor || 'system'} | Tier: {item.tier || 'n/a'}</div>
                    <div style={{ marginTop: 3, color: '#4E6486', fontSize: 13 }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeView === 'workspace' ? (
            <section style={{ marginTop: 16, display: 'grid', gap: 14 }}>
              <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                <h2 style={{ margin: 0, color: TOKENS.navyDeep, fontSize: 42, lineHeight: '44px', fontFamily: 'var(--font-controlui-display)' }}>Governed Workspace</h2>
                <p style={{ marginTop: 6, color: TOKENS.textSoft }}>
                  A persistent environment for working with company data, running approved analysis, and producing auditable outputs. Multi-turn work continues here with full context, permissions, and traceability.
                </p>
                <select value={selectedRequestId} onChange={(event) => setSelectedRequestId(event.target.value)} style={{ marginTop: 10, width: '100%', borderRadius: 12, border: 'none', background: TOKENS.cardAlt, padding: 12, outline: 'none', color: TOKENS.text }}>
                  <option value="">Select request...</option>
                  {requests.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.id} | {row.status} | T{row.tier}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={generateDraft} disabled={draftBusy || !selectedRequestId} style={{ marginTop: 10, border: 'none', borderRadius: 12, background: `linear-gradient(135deg, ${TOKENS.navy}, ${TOKENS.navyDeep})`, color: 'white', fontWeight: 700, padding: '9px 12px', opacity: draftBusy || !selectedRequestId ? 0.6 : 1 }}>
                  {draftBusy ? 'Generating draft...' : 'Generate Draft'}
                </button>
              </div>

              <div style={{ background: TOKENS.card, borderRadius: 16, padding: 20 }}>
                <div style={{ color: TOKENS.navyDeep, fontWeight: 700 }}>AI Output Workspace {draftProvider ? `(${draftProvider})` : ''}</div>
                <pre style={{ marginTop: 10, marginBottom: 0, borderRadius: 12, background: TOKENS.cardAlt, padding: 12, whiteSpace: 'pre-wrap', color: TOKENS.textSoft, fontSize: 13, lineHeight: '18px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  {draftText || 'No draft generated yet.'}
                </pre>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
