'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';

const POLL_INTERVAL_MS = 60_000;

// ---------------------------------------------------------------------------
// Confidence chip helpers
// ---------------------------------------------------------------------------

const CONFIDENCE_LABELS = {
  confirmed: 'Confirmed',
  estimated: 'Estimated',
  stale: 'Not checked recently',
  unknown: 'Not set',
};

function ConfidenceChip({ state }) {
  if (!state || state === 'unknown') {
    return <span className="text-xs text-white/30">Not set</span>;
  }
  const label = CONFIDENCE_LABELS[state] ?? state;
  const color =
    state === 'confirmed' ? 'text-white/40' :
    state === 'estimated' ? 'text-white/40' :
    'text-amber-400/70';
  return <span className={`text-xs ${color}`}>{label}</span>;
}

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------

function FieldRow({ label, value, unit, confidence }) {
  if (value == null) return null;
  return (
    <div className="flex items-baseline justify-between gap-2 py-2 border-b border-dialled-border/40 last:border-0">
      <span className="text-sm text-dialled-text/70">{label}</span>
      <span className="text-right">
        <span className="text-sm font-semibold text-white">
          {value}{unit ? <span className="text-dialled-text/60 font-normal ml-0.5">{unit}</span> : null}
        </span>
        {confidence && (
          <span className="ml-2">
            <ConfidenceChip state={confidence} />
          </span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SectionCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-dialled-border bg-white/[0.04] p-4 space-y-1">
      <h2 className="text-xs font-bold uppercase tracking-widest text-dialled-accent mb-3">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expiry countdown
// ---------------------------------------------------------------------------

function useCountdown(isoExpiry) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!isoExpiry) return;
    const tick = () => {
      const diff = new Date(isoExpiry).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      if (h > 0) setRemaining(`${h}h ${m}m`);
      else if (m > 0) setRemaining(`${m}m ${s}s`);
      else setRemaining(`${s}s`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [isoExpiry]);

  return remaining;
}

// ---------------------------------------------------------------------------
// End-state page — same neutral template for all terminal states
// ---------------------------------------------------------------------------

function EndState({ message }) {
  return (
    <div className="min-h-screen bg-dialled-bg flex flex-col items-center justify-center px-6 text-center">
      <DialledMark size={52} />
      <p className="mt-6 text-dialled-text text-base max-w-xs">{message}</p>
      <a
        href="https://apps.apple.com/gb/app/dialled-mtb/id6737574159"
        className="mt-8 inline-block rounded-full bg-dialled-accent px-6 py-2.5 text-sm font-semibold text-white"
      >
        Get Dialled MTB
      </a>
      <AboutFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// About footer
// ---------------------------------------------------------------------------

function AboutFooter() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-10 w-full max-w-sm text-center">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs text-white/30 hover:text-white/50 transition-colors"
      >
        About this share {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-3 text-xs text-dialled-text/50 leading-relaxed space-y-1">
          <p>This page was shared by a Dialled MTB user using the Coach Mode feature.</p>
          <p>The link is time-limited and shows only the setup data the rider chose to include.</p>
          <p>No account is needed to view this page.</p>
        </div>
      )}
      <div className="mt-4">
        <a
          href="https://apps.apple.com/gb/app/dialled-mtb/id6737574159"
          className="text-xs text-dialled-accent/70 hover:text-dialled-accent transition-colors"
        >
          Get Dialled MTB →
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Maintenance task list
// ---------------------------------------------------------------------------

function TaskList({ tasks }) {
  if (!tasks?.length) return <p className="text-sm text-dialled-text/50">No tasks recorded.</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.taskId} className="flex items-center justify-between gap-2">
          <span className="text-sm text-dialled-text capitalize">{t.taskId.replace(/-/g, ' ')}</span>
          <DueStateBadge state={t.dueState} />
        </li>
      ))}
    </ul>
  );
}

function DueStateBadge({ state }) {
  const styles = {
    due: 'bg-dialled-accent/20 text-dialled-accent',
    upcoming: 'bg-white/10 text-white/60',
    ok: 'bg-white/5 text-white/40',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[state] ?? styles.ok}`}>
      {state ?? 'ok'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dialled logo
// ---------------------------------------------------------------------------

function DialledMark({ size = 48 }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/img/dialled-mtb-logo-wordmark-transparent.png" height={size} alt="Dialled MTB" style={{ width: 'auto', maxWidth: size * 4 }} />;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CoachPage() {
  const { token } = useParams();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const stateVersionRef = useRef(null);
  const countdown = useCountdown(snapshot?.data?.expiresAt);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/dialled-mtb/coach/${token}`, { cache: 'no-store' });
      const body = await res.json();
      setSnapshot(body);
      if (body.data?.snapshotStateVersion != null) {
        stateVersionRef.current = body.data.snapshotStateVersion;
      }
    } catch {
      setSnapshot({ status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => { fetchSnapshot(); }, [fetchSnapshot]);

  // 60-second poll
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/dialled-mtb/coach/${token}/poll`, { cache: 'no-store' });
        const body = await res.json();
        if (
          body.status === 'ok' &&
          body.snapshotStateVersion != null &&
          stateVersionRef.current != null &&
          body.snapshotStateVersion !== stateVersionRef.current
        ) {
          // Snapshot was refreshed — refetch full payload
          await fetchSnapshot();
        }
      } catch {
        // Non-fatal
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [token, fetchSnapshot]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dialled-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-dialled-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const status = snapshot?.status;

  if (status !== 'ok') {
    return (
      <EndState
        message="This setup share is no longer available. The rider may have revoked or it has expired."
      />
    );
  }

  const { data } = snapshot;
  const bike = data?.bike ?? {};
  const setup = data?.setup;
  const maintenance = data?.maintenance;
  const rides = data?.ridesSummary;
  const fc = data?.fitConfidence ?? {};
  const units = data?.units ?? 'metric';
  const weightUnit = units === 'imperial' ? 'lbs' : 'kg';
  const pressureUnit = 'psi';

  return (
    <div className="min-h-screen bg-dialled-bg text-white">
      <div className="max-w-md mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <DialledMark size={40} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-dialled-accent">Dialled MTB</p>
            <p className="text-xs text-dialled-text/50">{data?.riderDisplayName ?? 'Rider'}</p>
          </div>
        </div>

        {/* Bike identity */}
        <div className="rounded-2xl border border-dialled-border bg-white/[0.04] p-4">
          {bike.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bike.photoUrl}
              alt="Bike photo"
              className="w-full h-40 object-cover rounded-xl mb-3"
            />
          )}
          <div className="flex items-baseline gap-2 flex-wrap">
            {bike.customName ? (
              <h1 className="text-xl font-extrabold tracking-tight">{bike.customName}</h1>
            ) : (
              <h1 className="text-xl font-extrabold tracking-tight">
                {[bike.year, bike.make, bike.model].filter(Boolean).join(' ')}
              </h1>
            )}
            {bike.type && (
              <span className="text-xs text-dialled-text/50 capitalize">
                {bike.type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {bike.customName && (
            <p className="text-sm text-dialled-text/60 mt-0.5">
              {[bike.year, bike.make, bike.model].filter(Boolean).join(' ')}
            </p>
          )}
        </div>

        {/* Setup */}
        {setup && (
          <SectionCard title="Setup">
            <FieldRow
              label="Rider weight"
              value={setup.rider?.weightKg}
              unit={weightUnit}
              confidence={fc.riderWeightKg}
            />
            <FieldRow
              label="Riding style"
              value={setup.rider?.ridingStyle}
              confidence={fc.ridingStyle}
            />
            {setup.suspension && (
              <>
                <FieldRow label="Fork travel" value={setup.suspension.forkTravelMm} unit="mm" />
                <FieldRow
                  label="Fork pressure"
                  value={setup.suspension.forkPsi}
                  unit={pressureUnit}
                  confidence={fc.forkPsi}
                />
                <FieldRow
                  label="Fork sag"
                  value={setup.suspension.forkSagMm}
                  unit="mm"
                  confidence={fc.forkSagMm}
                />
                <FieldRow label="Shock stroke" value={setup.suspension.shockStrokeMm} unit="mm" />
                <FieldRow
                  label="Shock pressure"
                  value={setup.suspension.shockPsi}
                  unit={pressureUnit}
                  confidence={fc.shockPsi}
                />
                <FieldRow
                  label="Shock sag"
                  value={setup.suspension.shockSagMm}
                  unit="mm"
                  confidence={fc.shockSagMm}
                />
              </>
            )}
            {setup.tyreFront && (
              <FieldRow
                label="Front tyre"
                value={[setup.tyreFront.brand, setup.tyreFront.model].filter(Boolean).join(' ') || null}
              />
            )}
            <FieldRow
              label="Front pressure"
              value={setup.tyreFrontPsi}
              unit={pressureUnit}
              confidence={fc.tyreFrontPsi}
            />
            {setup.tyreRear && (
              <FieldRow
                label="Rear tyre"
                value={[setup.tyreRear.brand, setup.tyreRear.model].filter(Boolean).join(' ') || null}
              />
            )}
            <FieldRow
              label="Rear pressure"
              value={setup.tyreRearPsi}
              unit={pressureUnit}
              confidence={fc.tyreRearPsi}
            />
          </SectionCard>
        )}

        {/* Maintenance */}
        {maintenance && (
          <SectionCard title="Maintenance">
            <div className="flex gap-4 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{maintenance.totalRides ?? '—'}</p>
                <p className="text-xs text-dialled-text/50">rides</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{maintenance.totalHours ?? '—'}</p>
                <p className="text-xs text-dialled-text/50">hours</p>
              </div>
            </div>
            {maintenance.tasks && <TaskList tasks={maintenance.tasks} />}
          </SectionCard>
        )}

        {/* Rides summary */}
        {rides && (
          <SectionCard title="Riding">
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{rides.last30Days?.rides ?? '—'}</p>
                <p className="text-xs text-dialled-text/50">rides (30d)</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{rides.last30Days?.hours ?? '—'}</p>
                <p className="text-xs text-dialled-text/50">hours (30d)</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{rides.allTime?.rides ?? '—'}</p>
                <p className="text-xs text-dialled-text/50">total rides</p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Snapshot metadata */}
        <div className="rounded-2xl border border-dialled-border/40 bg-white/[0.02] px-4 py-3 space-y-1">
          <div className="flex justify-between items-center text-xs text-dialled-text/50">
            <span>Shared</span>
            <span>{data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-dialled-text/50">
            <span>Expires</span>
            <span>{countdown || '—'}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-dialled-text/50">
            <span>Revision</span>
            <span>v{data?.snapshotRevision ?? 1}</span>
          </div>
        </div>

        <AboutFooter />
      </div>
    </div>
  );
}
