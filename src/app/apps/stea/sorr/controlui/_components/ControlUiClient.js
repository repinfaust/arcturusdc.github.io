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

const NAV_ITEMS = [
  { id: 'overview', href: '/apps/stea/sorr/controlui', label: 'Overview' },
  { id: 'request', href: '/apps/stea/sorr/controlui/request', label: 'Request Engine' },
  { id: 'classification', href: '/apps/stea/sorr/controlui/classification', label: 'Classification' },
  { id: 'approvals', href: '/apps/stea/sorr/controlui/approvals', label: 'Approvals Queue' },
  { id: 'audit', href: '/apps/stea/sorr/controlui/audit', label: 'Audit Trail' },
  { id: 'workspace', href: '/apps/stea/sorr/controlui/workspace', label: 'Governed Workspace' },
];

const SHORTCUTS = [
  'Draft a billing correction explanation for an estimated meter read dispute.',
  'Summarise a complaint escalation for regulator review with remedy options.',
  'Prepare metering dispute decision notes for high-risk account review.',
  'Generate tariff comparison guidance for support colleagues.',
  'Prepare safeguarding support plan for vulnerable customer arrears case.',
];

const tierTone = {
  1: 'bg-emerald-100 text-emerald-900',
  2: 'bg-amber-100 text-amber-900',
  3: 'bg-orange-100 text-orange-900',
  4: 'bg-red-100 text-red-900',
};

function fmtDate(value) {
  if (!value) return 'n/a';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'n/a';
  return d.toLocaleString();
}

function MetricCard({ label, value, help }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[#10294d]">{value}</div>
      {help ? <div className="mt-1 text-xs text-slate-500">{help}</div> : null}
    </div>
  );
}

function TierBadge({ tier }) {
  const tone = tierTone[tier] || tierTone[4];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>T{tier}</span>;
}

export default function ControlUiClient({ activeView }) {
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
  const [useCases, setUseCases] = useState([]);

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
      setUseCases(data.useCases || []);
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
      setClassificationResult({
        request: data.request,
        policyBundle: data.policyBundle,
      });
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
        body: JSON.stringify({
          requestId: selectedRequestId,
          action,
          note: approvalNote,
        }),
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
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">
        Checking authentication...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-300/60">
        <h1 className="text-2xl font-semibold tracking-tight text-[#10294d]">SoRR Control Access</h1>
        <p className="mt-2 text-sm text-slate-600">
          This POC is behind magic link authentication. Enter your email to receive a sign-in link.
        </p>
        <div className="mt-5 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@company.com"
            className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:bg-white"
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={authBusy || !email}
            className="rounded-xl bg-gradient-to-br from-[#10294d] to-[#001432] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {authBusy ? 'Sending...' : 'Send Link'}
          </button>
        </div>
        {authError ? <p className="mt-3 text-sm text-red-700">{authError}</p> : null}
        {authError?.includes('not enabled') ? (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            Enable Firebase Console - Authentication - Sign-in method - Email/Password - Email link (passwordless sign-in).
          </div>
        ) : null}
        {authError?.includes('not authorized') ? (
          <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            Add this domain in Firebase Console - Authentication - Settings - Authorized domains.
          </div>
        ) : null}
        {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] rounded-[28px] bg-[#f8f9ff] p-4 shadow-xl shadow-slate-300/50 md:p-6">
      <div className="grid gap-4 md:grid-cols-[250px_1fr]">
        <aside className="rounded-3xl bg-[#eff4ff] p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[#10294d]/70">SoRR Control</div>
          <div className="mt-1 text-lg font-semibold text-[#10294d]">Governance Router</div>
          <nav className="mt-5 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`block rounded-xl px-3 py-2 text-sm ${
                  activeView === item.id ? 'bg-white text-[#10294d] shadow-sm' : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={authBusy}
            className="mt-6 w-full rounded-xl bg-white px-3 py-2 text-left text-sm text-slate-700"
          >
            {authBusy ? 'Signing out...' : `Signed in as ${user.email}`}
          </button>
        </aside>

        <section className="rounded-3xl bg-[#eff4ff] p-4 md:p-5">
          <header className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Target Environment</div>
                <h2 className="text-xl font-semibold text-[#10294d]">/apps/stea/sorr/controlui</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">Safety Gates: {kpis?.safetyGates || 'ONLINE'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Risk context active</span>
              </div>
            </div>
          </header>

          {loading ? <p className="mt-4 text-sm text-slate-500">Loading SoRR Control data...</p> : null}
          {loadError ? <p className="mt-4 text-sm text-red-700">{loadError}</p> : null}
          {notice ? <p className="mt-4 text-sm text-[#006c50]">{notice}</p> : null}

          {activeView === 'overview' ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <MetricCard label="Pending approvals" value={kpis?.pendingApprovals ?? 42} help={`${kpis?.pendingActual ?? 0} currently queued`} />
                <MetricCard label="High-risk escalations" value={kpis?.highRiskEscalations ?? 0} />
                <MetricCard label="Throughput (24h)" value={kpis?.throughput24h ?? 0} />
                <MetricCard label="Average risk score" value={kpis?.avgRiskScore ?? 0} />
                <MetricCard label="Use cases" value={useCases.length} />
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-[#10294d]">Recent high-tier requests</div>
                <div className="mt-3 space-y-2">
                  {requests.filter((r) => r.tier >= 3).slice(0, 6).map((row) => (
                    <div key={row.id} className="flex items-center justify-between rounded-xl bg-[#f8f9ff] p-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{row.id}</div>
                        <div className="text-xs text-slate-500">{row.useCaseName || 'Unclassified'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TierBadge tier={row.tier} />
                        <span className="text-xs text-slate-500">{row.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeView === 'request' ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-[#10294d]">What do you need to do?</div>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={5}
                  className="mt-3 w-full rounded-2xl bg-[#f8f9ff] p-3 text-sm text-slate-900 outline-none focus:bg-white"
                  placeholder="Describe the task in natural language..."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {SHORTCUTS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setPrompt(item)}
                      className="rounded-full bg-[#eff4ff] px-3 py-1 text-xs text-slate-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={submitRequest}
                  disabled={requestBusy || !prompt.trim()}
                  className="mt-3 rounded-xl bg-gradient-to-br from-[#10294d] to-[#001432] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {requestBusy ? 'Classifying...' : 'Classify Request'}
                </button>
              </div>

              {classificationResult ? (
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-[#10294d]">Latest classification</div>
                  <div className="mt-2 text-sm text-slate-700">Request: {classificationResult.request.id}</div>
                  <div className="mt-1 text-sm text-slate-700">Use case: {classificationResult.policyBundle.matchedUseCase?.name || 'Blocked/Unknown'}</div>
                  <div className="mt-1 text-sm text-slate-700">Route: {classificationResult.policyBundle.route}</div>
                  <div className="mt-1 text-sm text-slate-700">Confidence: {classificationResult.policyBundle.confidence}</div>
                  <div className="mt-1 text-sm text-slate-700">Blocked actions: {(classificationResult.policyBundle.blockedActions || []).join(', ') || 'None'}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeView === 'classification' ? (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-[#10294d]">Policy and classification decisions</div>
              <div className="mt-3 space-y-2">
                {requests.slice(0, 12).map((row) => (
                  <div key={row.id} className="rounded-xl bg-[#f8f9ff] p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-800">{row.id}</div>
                      <TierBadge tier={row.tier} />
                    </div>
                    <div className="mt-1 text-xs text-slate-600">Matched Use Case: {row.useCaseId || 'NONE'}</div>
                    <div className="text-xs text-slate-600">Route: {row.route || 'blocked'} | Confidence: {row.confidence ?? 'n/a'}</div>
                    <div className="text-xs text-slate-500">Updated: {fmtDate(row.updatedAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeView === 'approvals' ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-[#10294d]">Pending approvals queue</div>
                <div className="mt-3 space-y-2">
                  {pendingApprovals.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedRequestId(row.id)}
                      className={`w-full rounded-xl p-3 text-left ${
                        selectedRequestId === row.id ? 'bg-[#10294d] text-white' : 'bg-[#f8f9ff] text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{row.id}</span>
                        <TierBadge tier={row.tier} />
                      </div>
                      <div className="mt-1 text-xs opacity-80">{row.useCaseName}</div>
                    </button>
                  ))}
                  {!pendingApprovals.length ? <div className="text-sm text-slate-500">No pending approvals.</div> : null}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-[#10294d]">Approval action</div>
                <div className="mt-2 text-sm text-slate-700">Selected: {selectedRequest?.id || 'None selected'}</div>
                <textarea
                  value={approvalNote}
                  onChange={(event) => setApprovalNote(event.target.value)}
                  rows={3}
                  placeholder="Add reviewer note (required for reject)"
                  className="mt-3 w-full rounded-xl bg-[#f8f9ff] p-3 text-sm text-slate-900 outline-none focus:bg-white"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyApproval('APPROVE')}
                    disabled={approvalsBusy || !selectedRequestId}
                    className="rounded-xl bg-[#006c50] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => applyApproval('REJECT')}
                    disabled={approvalsBusy || !selectedRequestId}
                    className="rounded-xl bg-[#ff5b33] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeView === 'audit' ? (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-[#10294d]">Immutable audit stream</div>
              <div className="mt-3 space-y-2">
                {auditLog.slice(0, 40).map((item) => (
                  <div key={item.id} className="rounded-xl bg-[#f8f9ff] p-3 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{item.action}</span>
                      <span>{fmtDate(item.createdAt)}</span>
                    </div>
                    <div className="mt-1">Request: {item.requestId || 'n/a'} | Actor: {item.actor || 'system'} | Tier: {item.tier || 'n/a'}</div>
                    <div className="mt-1 text-slate-600">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeView === 'workspace' ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-[#10294d]">Governed workspace</div>
                <div className="mt-2 text-sm text-slate-700">
                  Select an approved request and generate a constrained draft output.
                </div>
                <select
                  value={selectedRequestId}
                  onChange={(event) => setSelectedRequestId(event.target.value)}
                  className="mt-3 w-full rounded-xl bg-[#f8f9ff] p-2.5 text-sm text-slate-900 outline-none"
                >
                  <option value="">Select request...</option>
                  {requests.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.id} | {row.status} | T{row.tier}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={generateDraft}
                  disabled={draftBusy || !selectedRequestId}
                  className="mt-3 rounded-xl bg-gradient-to-br from-[#10294d] to-[#001432] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {draftBusy ? 'Generating draft...' : 'Generate Draft'}
                </button>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-[#10294d]">AI output workspace {draftProvider ? `(${draftProvider})` : ''}</div>
                <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-[#f8f9ff] p-3 text-xs text-slate-700">{draftText || 'No draft generated yet.'}</pre>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
