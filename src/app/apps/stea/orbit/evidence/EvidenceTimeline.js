'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';

const short = (h) => (h ? `${h.slice(0, 12)}…` : '—');
const LINK_LABEL = { subjectEventId: 'about', supersedesEventId: 'supersedes', withdrawsEventId: 'withdraws' };
const TYPE_STYLE = {
  CLAIM_WITHDRAWN: 'bg-red-50 text-red-800 border-red-200',
  REGRESSION_DETECTED: 'bg-red-50 text-red-800 border-red-200',
  PREREGISTRATION_FROZEN: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  RUBRIC_VERSIONED: 'bg-amber-50 text-amber-800 border-amber-200',
  EVALUATION_RUN: 'bg-blue-50 text-blue-800 border-blue-200',
  HUMAN_AUDIT_COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

function Mark({ ok, label }) {
  if (ok === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  );
}

export default function EvidenceTimeline({ orgId, rows, head }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/orbit/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orgId, chain: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const checks = new Map((result?.blocks ?? []).map((b) => [b.blockIndex, b]));

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/apps/stea/orbit" className="text-sm text-blue-600 hover:text-blue-700">← Orbit</Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">Evidence chain</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Org <span className="font-mono">{orgId}</span> · {rows.length} blocks · head{' '}
          <span className="font-mono">{head ? `${head.blockIndex} ${short(head.eventHash)}` : 'none'}</span> · read-only
        </p>

        <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={verify}
            disabled={busy || rows.length === 0}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'Verifying…' : 'Verify chain'}
          </button>
          <div className="text-sm text-neutral-700">
            {error && <span className="text-red-700">Verification failed to run: {error}</span>}
            {!error && !result && 'Checks every stored block: signature, hash, link and index, then the head.'}
            {result && (
              <span className={result.ok ? 'text-emerald-800' : 'text-red-800'}>
                {result.ok ? 'Chain verified' : 'Chain NOT verified'} against stored events: {result.blocks.length} blocks, head{' '}
                <span className="font-mono">{result.head ? `${result.head.blockIndex} ${short(result.head.eventHash)}` : 'none'}</span>,{' '}
                {new Date(result.verifiedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC. Verified by Orbit, not independently.
              </span>
            )}
          </div>
        </div>
        {result && !result.ok && (
          <ul className="mt-2 text-sm text-red-800 list-disc pl-6">
            {result.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}

        <ol className="mt-6 space-y-3">
          {rows.map((r) => {
            const c = checks.get(r.blockIndex);
            return (
              <li key={r.eventId} id={`block-${r.blockIndex}`} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-neutral-500">#{r.blockIndex}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${TYPE_STYLE[r.eventType] ?? 'bg-neutral-50 text-neutral-800 border-neutral-200'}`}>{r.eventType}</span>
                  <span className="text-sm text-neutral-800">{r.system}{r.version ? ` ${r.version}` : ''}</span>
                  {r.decisionId && <span className="text-sm font-semibold text-neutral-900">{r.decisionId}</span>}
                  <span className="text-sm text-neutral-500">{r.occurredAt}</span>
                  {r.backfilled && <span className="text-xs text-neutral-500">backfilled</span>}
                  <span className="ml-auto flex gap-3">
                    <Mark ok={c?.signature} label="signature" />
                    <Mark ok={c?.hash} label="hash" />
                    <Mark ok={c?.link} label="link" />
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-neutral-700">
                  {r.commit && (<><dt className="text-neutral-500">commit</dt><dd className="font-mono break-all">{r.commit}</dd></>)}
                  {r.relatedDecisionIds.length > 0 && (<><dt className="text-neutral-500">related</dt><dd>{r.relatedDecisionIds.join(', ')}</dd></>)}
                  {r.hashes.map(([k, v]) => (
                    <Fragment key={k}><dt className="text-neutral-500">{k}</dt><dd className="font-mono break-all" title={v}>{v.length > 16 ? short(v) : v}</dd></Fragment>
                  ))}
                  {r.modelSnapshots.length > 0 && (<><dt className="text-neutral-500">models</dt><dd className="font-mono break-all">{r.modelSnapshots.join(', ')}</dd></>)}
                  {r.links.map((l) => (
                    <Fragment key={l.field}><dt className="text-neutral-500">{LINK_LABEL[l.field]}</dt>
                      <dd>{l.blockIndex ? <a className="text-blue-600 hover:underline" href={`#block-${l.blockIndex}`}>block #{l.blockIndex}</a> : <span className="font-mono">{l.eventId}</span>}</dd></Fragment>
                  ))}
                  <dt className="text-neutral-500">eventHash</dt><dd className="font-mono break-all" title={r.eventHash}>{short(r.eventHash)}</dd>
                  <dt className="text-neutral-500">previous</dt><dd className="font-mono break-all" title={r.previousEventHash}>{short(r.previousEventHash)}</dd>
                </dl>
                {r.metrics.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="text-xs">
                      <tbody>
                        {r.metrics.map(([k, v]) => (
                          <tr key={k}><td className="pr-4 py-0.5 font-mono text-neutral-500">{k}</td><td className="py-0.5 font-mono text-neutral-900 text-right">{v}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {rows.length === 0 && <p className="mt-6 text-sm text-neutral-600">No blocks stored yet. Run the backfill (D-SITE-057).</p>}
      </div>
    </main>
  );
}
