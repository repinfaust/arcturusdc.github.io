'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

import TenantSwitcher from '@/components/TenantSwitcher';
import { useTenant } from '@/contexts/TenantContext';
import { auth, firebaseInitError } from '@/lib/firebase';

const ALLOWED_WORKSPACES = ['dialled mtb', 'arcturusdc'];

// Chart palette validated (dataviz six checks, dark surface #12161A):
// free = #F72585, premium = #0284C7. Fixed assignment — never repaint on filter.
const COLOR_FREE = '#F72585';
const COLOR_PREMIUM = '#0284C7';

const numberFormat = new Intl.NumberFormat('en-GB');

// GA4 auto-collected noise, excluded from the Top events table (raw counts stay
// in the snapshot for the Ask panel).
const GA4_DEFAULT_EVENTS = new Set(['screen_view', 'user_engagement']);

function workspaceAllowed(tenant) {
  return ALLOWED_WORKSPACES.includes(String(tenant?.name || '').trim().toLowerCase());
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Sortable table headers: click toggles the active column (always starts
// descending — that's the useful direction for these count/rate tables),
// click again on the same column flips direction.
function useSortableRows(rows, defaultKey, accessors) {
  const [sort, setSort] = useState({ key: defaultKey, direction: 'desc' });

  const sortedRows = useMemo(() => {
    const accessor = accessors[sort.key];
    if (!accessor) return rows;
    const withValues = rows.map((row) => ({ row, value: accessor(row) }));
    withValues.sort((a, b) => {
      const av = a.value;
      const bv = b.value;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp;
      if (typeof av === 'string' && typeof bv === 'string') cmp = av.localeCompare(bv);
      else cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return withValues.map((entry) => entry.row);
  }, [rows, sort, accessors]);

  function toggleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  }

  return { sortedRows, sort, toggleSort };
}

function SortableTh({ label, sortKey, sort, onSort, align = 'left', className = '' }) {
  const active = sort.key === sortKey;
  return (
    <th className={`${align === 'right' ? 'text-right' : 'text-left'} font-bold ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-[0.14em] transition hover:text-[#F4F6F8] ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${active ? 'text-[#FF6EAF]' : 'text-[#68717A]'}`}
      >
        {label}
        <span className="text-[9px]">{active ? (sort.direction === 'desc' ? '▼' : '▲') : ''}</span>
      </button>
    </th>
  );
}

function StatTile({ label, value, hint }) {
  return (
    <div className="bg-[#0D1013] px-4 py-5" title={hint || undefined}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#68717A]">{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold text-[#F4F6F8]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] leading-4 text-[#68717A]">{hint}</p> : null}
    </div>
  );
}

function SectionCard({ eyebrow, title, subtitle, children }) {
  return (
    <section className="rounded-xl border border-white/10 bg-[#12161A] p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F72585]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-black text-[#F4F6F8]">{title}</h2>
      {subtitle ? <p className="mt-1 max-w-3xl text-xs leading-5 text-[#8A939D]">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FunnelChart({ funnel }) {
  const max = Math.max(1, ...funnel.map((step) => step.count));
  const registered = funnel.find((step) => step.stage === 'registered')?.count || 0;
  return (
    <div className="space-y-2.5">
      {funnel.map((step, index) => {
        const share = registered ? Math.round((step.count / registered) * 100) : 0;
        const prev = index > 0 ? funnel[index - 1].count : null;
        const drop = prev && prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : 0;
        const bigDrop = index === 1 && drop >= 40;
        return (
          <div key={step.stage} className="grid grid-cols-[130px_1fr] items-center gap-3 sm:grid-cols-[160px_1fr]">
            <p className="text-xs font-semibold text-[#A8B0B8]">{step.label}</p>
            <div className="flex items-center gap-3">
              <div className="h-5 flex-1 overflow-hidden rounded-r-[4px] bg-white/[0.04]">
                <div
                  className="h-full rounded-r-[4px]"
                  style={{ width: `${Math.max(1.5, (step.count / max) * 100)}%`, background: COLOR_FREE }}
                  title={`${step.label}: ${step.count} users (${share}% of registered)`}
                />
              </div>
              <p className="w-28 shrink-0 font-mono text-xs text-[#F4F6F8]">
                {numberFormat.format(step.count)}
                <span className="ml-1.5 text-[#68717A]">{share}%</span>
              </p>
              {bigDrop ? (
                <span className="shrink-0 rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[10px] font-black text-red-300">
                  −{drop}% cliff
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Sparkline({ points, width = 560, height = 96 }) {
  if (!points?.length) return null;
  const max = Math.max(1, ...points.map((point) => point.sessions));
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => ({
    x: index * stepX,
    y: height - 8 - (point.sessions / max) * (height - 20),
    ...point,
  }));
  const path = coords.map((coord, index) => `${index ? 'L' : 'M'}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ');
  const ga4Date = (value) => `${value.slice(6, 8)}/${value.slice(4, 6)}`;
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Sessions per day, last 30 days">
        <path d={path} fill="none" stroke={COLOR_FREE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((coord) => (
          <circle key={coord.date} cx={coord.x} cy={coord.y} r="7" fill="transparent">
            <title>{`${ga4Date(coord.date)} — ${coord.sessions} sessions`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[#68717A]">
        <span>{ga4Date(points[0].date)}</span>
        <span>peak {max}/day</span>
        <span>{ga4Date(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function TrendChart({ series, ariaLabel, width = 560, height = 150 }) {
  const drawn = (series || []).filter((entry) => entry.points?.length);
  const allPoints = drawn.flatMap((entry) => entry.points);
  if (!allPoints.length) return null;

  const toTime = (date) => new Date(`${date}T00:00:00Z`).getTime();
  const times = allPoints.map((point) => toTime(point.date));
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const maxValue = Math.max(1, ...allPoints.map((point) => point.value));
  const padTop = 10;
  const padBottom = 8;
  const padRight = 44;
  const plotWidth = width - padRight;
  const x = (date) => (maxT === minT ? plotWidth / 2 : ((toTime(date) - minT) / (maxT - minT)) * plotWidth);
  const y = (value) => height - padBottom - (value / maxValue) * (height - padTop - padBottom);

  // Nudge end-of-line labels apart when two series finish close together.
  const endLabels = drawn.map((entry) => {
    const last = entry.points[entry.points.length - 1];
    return { name: entry.name, color: entry.color, x: x(last.date), y: y(last.value), value: last.value };
  }).sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i += 1) {
    if (endLabels[i].y - endLabels[i - 1].y < 12) endLabels[i].y = endLabels[i - 1].y + 12;
  }

  return (
    <div>
      {drawn.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-[#A8B0B8]">
          {drawn.map((entry) => (
            <span key={entry.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              {entry.name}
              <span className="font-mono text-[#F4F6F8]">{numberFormat.format(entry.points[entry.points.length - 1].value)}</span>
            </span>
          ))}
        </div>
      ) : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={ariaLabel}>
        {[0.5, 1].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2={plotWidth}
            y1={y(maxValue * fraction)}
            y2={y(maxValue * fraction)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        {drawn.map((entry) => (
          <path
            key={entry.name}
            d={entry.points.map((point, index) => `${index ? 'L' : 'M'}${x(point.date).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={entry.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {drawn.map((entry) =>
          entry.points.map((point) => (
            <circle key={`${entry.name}-${point.date}`} cx={x(point.date)} cy={y(point.value)} r="7" fill="transparent">
              <title>{`${formatDate(point.date)} — ${numberFormat.format(point.value)} ${entry.name.toLowerCase()}`}</title>
            </circle>
          )),
        )}
        {endLabels.map((label) => (
          <text
            key={label.name}
            x={label.x + 6}
            y={label.y + 3.5}
            fontSize="11"
            fontFamily="ui-monospace, monospace"
            fill="#D7DCE0"
          >
            {numberFormat.format(label.value)}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[#68717A]">
        <span>{formatDate(new Date(minT).toISOString())}</span>
        <span>{formatDate(new Date(maxT).toISOString())}</span>
      </div>
    </div>
  );
}

function DistributionChart({ title, unitLabel, distribution }) {
  if (!distribution) return null;
  const { buckets, summary } = distribution;
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  return (
    <div className="rounded-lg border border-white/10 bg-[#0D1013] p-4">
      <p className="text-xs font-bold text-[#D7DCE0]">{title}</p>
      <div className="mt-3 space-y-2">
        {buckets.map((bucket) => {
          const share = total ? Math.round((bucket.count / total) * 100) : 0;
          return (
            <div key={bucket.label} className="grid grid-cols-[52px_1fr_auto] items-center gap-2.5">
              <p className="text-right text-[11px] font-mono text-[#68717A]">{bucket.label}</p>
              <div className="h-4 overflow-hidden rounded-r-[4px] bg-white/[0.04]">
                <div
                  className="h-full rounded-r-[4px]"
                  style={{ width: `${Math.max(1.5, (bucket.count / max) * 100)}%`, background: COLOR_FREE }}
                  title={`${bucket.count} riders (${share}%)`}
                />
              </div>
              <p className="w-16 shrink-0 text-right font-mono text-[11px] text-[#F4F6F8]">{bucket.count}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 pt-3 text-[10px] text-[#68717A]">
        <span>Median <span className="text-[#D7DCE0]">{summary.median}</span> {unitLabel}</span>
        <span>Mean <span className="text-[#D7DCE0]">{summary.mean}</span></span>
        <span>P90 <span className="text-[#D7DCE0]">{summary.p90}</span></span>
        <span>Max <span className="text-[#D7DCE0]">{summary.max}</span></span>
      </div>
    </div>
  );
}

function SegmentBar({ pctValue, color }) {
  return (
    <div className="h-3.5 w-full overflow-hidden rounded-r-[3px] bg-white/[0.04]">
      <div className="h-full rounded-r-[3px]" style={{ width: `${Math.min(100, Math.max(pctValue > 0 ? 1.5 : 0, pctValue))}%`, background: color }} />
    </div>
  );
}

function FeatureMatrix({ featureMatrix, freeTotal, premiumTotal }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">
            <th className="pb-3 pr-4 font-bold">Feature</th>
            <th className="pb-3 pr-4 font-bold">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: COLOR_FREE }} />
              Free ({freeTotal})
            </th>
            <th className="pb-3 pr-4 font-bold">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: COLOR_PREMIUM }} />
              Premium ({premiumTotal})
            </th>
            <th className="pb-3 font-bold text-right">Events free / premium</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {featureMatrix.map((row) => (
            <tr key={row.feature}>
              <td className="py-2.5 pr-4 font-semibold text-[#A8B0B8]">{row.label || row.feature}</td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <SegmentBar pctValue={row.free.pctOfSegment} color={COLOR_FREE} />
                  <span className="w-20 shrink-0 font-mono text-[#F4F6F8]">{row.free.users} · {row.free.pctOfSegment}%</span>
                </div>
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <SegmentBar pctValue={row.premium.pctOfSegment} color={COLOR_PREMIUM} />
                  <span className="w-20 shrink-0 font-mono text-[#F4F6F8]">{row.premium.users} · {row.premium.pctOfSegment}%</span>
                </div>
              </td>
              <td className="py-2.5 text-right font-mono text-[#8A939D]">
                {numberFormat.format(row.free.events)} / {numberFormat.format(row.premium.events)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const WEEKLY_COHORT_ACCESSORS = {
  weekStart: (row) => row.weekStart,
  registered: (row) => row.registered,
  bikeCreated: (row) => row.bikeCreated,
  setupComplete: (row) => row.setupComplete,
  stravaConnected: (row) => row.stravaConnected,
  rideLogged: (row) => row.rideLogged,
  premium: (row) => row.premium,
};

function WeeklyCohortsTable({ cohorts }) {
  const { sortedRows, sort, toggleSort } = useSortableRows(cohorts, 'registered', WEEKLY_COHORT_ACCESSORS);
  return (
    <div className="mt-6 overflow-x-auto">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#68717A]">Weekly signup cohorts</p>
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">
            <SortableTh label="Week" sortKey="weekStart" sort={sort} onSort={toggleSort} className="pb-2.5 pr-4" />
            <SortableTh label="Registered" sortKey="registered" sort={sort} onSort={toggleSort} align="right" className="pb-2.5 pr-4" />
            <SortableTh label="Bike" sortKey="bikeCreated" sort={sort} onSort={toggleSort} align="right" className="pb-2.5 pr-4" />
            <SortableTh label="Setup" sortKey="setupComplete" sort={sort} onSort={toggleSort} align="right" className="pb-2.5 pr-4" />
            <SortableTh label="Strava" sortKey="stravaConnected" sort={sort} onSort={toggleSort} align="right" className="pb-2.5 pr-4" />
            <SortableTh label="Ride" sortKey="rideLogged" sort={sort} onSort={toggleSort} align="right" className="pb-2.5 pr-4" />
            <SortableTh label="Premium" sortKey="premium" sort={sort} onSort={toggleSort} align="right" className="pb-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedRows.map((cohort) => (
            <tr key={cohort.weekStart}>
              <td className="py-2 pr-4 font-mono text-[#A8B0B8]">{formatDate(cohort.weekStart)}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#F4F6F8]">{cohort.registered}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#D7DCE0]">{cohort.bikeCreated}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#D7DCE0]">{cohort.setupComplete}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#D7DCE0]">{cohort.stravaConnected}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#D7DCE0]">{cohort.rideLogged}</td>
              <td className="py-2 text-right font-mono text-[#D7DCE0]">{cohort.premium}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RECENT_REGISTRANTS_ACCESSORS = {
  createdAt: (row) => row.createdAt,
  daysSinceSignup: (row) => row.daysSinceSignup,
  stravaConnected: (row) => (row.stravaConnected ? 1 : 0),
  aiUsed: (row) => (row.aiUsed ? 1 : 0),
};

function RecentRegistrantsTable({ registrants }) {
  const { sortedRows, sort, toggleSort } = useSortableRows(registrants, 'createdAt', RECENT_REGISTRANTS_ACCESSORS);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">
            <th className="pb-2.5 pr-4 font-bold">User</th>
            <SortableTh label="Signed up" sortKey="createdAt" sort={sort} onSort={toggleSort} className="pb-2.5 pr-4" />
            <SortableTh label="Days ago" sortKey="daysSinceSignup" sort={sort} onSort={toggleSort} align="right" className="pb-2.5 pr-4" />
            <SortableTh label="Strava" sortKey="stravaConnected" sort={sort} onSort={toggleSort} className="pb-2.5 pr-4" />
            <SortableTh label="Used AI" sortKey="aiUsed" sort={sort} onSort={toggleSort} className="pb-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedRows.map((registrant) => (
            <tr key={registrant.uid}>
              <td className="py-2 pr-4 font-mono text-[#A8B0B8]" title={registrant.uid}>{registrant.uid.slice(0, 10)}…</td>
              <td className="py-2 pr-4 text-[#D7DCE0]">{formatDate(registrant.createdAt)}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#F4F6F8]">{registrant.daysSinceSignup}</td>
              <td className="py-2 pr-4 text-[#D7DCE0]">{registrant.stravaConnected ? 'Yes' : '—'}</td>
              <td className="py-2 text-[#D7DCE0]">{registrant.aiUsed ? 'Yes' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOP_EVENTS_ACCESSORS = {
  eventName: (row) => row.eventName,
  lifetime: (row) => row.lifetime,
  last30d: (row) => row.last30d,
};

function TopEventsTable({ events }) {
  const { sortedRows, sort, toggleSort } = useSortableRows(events, 'lifetime', TOP_EVENTS_ACCESSORS);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">
            <SortableTh label="Event" sortKey="eventName" sort={sort} onSort={toggleSort} className="pb-3 pr-4" />
            <SortableTh label="Lifetime" sortKey="lifetime" sort={sort} onSort={toggleSort} align="right" className="pb-3 pr-4" />
            <SortableTh label="Last 30d" sortKey="last30d" sort={sort} onSort={toggleSort} align="right" className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedRows.map((event) => (
            <tr key={event.eventName}>
              <td className="py-2 pr-4 font-mono text-[#A8B0B8]">{event.eventName}</td>
              <td className="py-2 pr-4 text-right font-mono text-[#F4F6F8]">{numberFormat.format(event.lifetime)}</td>
              <td className="py-2 text-right font-mono text-[#8A939D]">{numberFormat.format(event.last30d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RIDER_DETAIL_ACCESSORS = {
  uid: (row) => row.uid,
  plan: (row) => (row.isPremium ? 1 : 0),
  createdAt: (row) => row.createdAt,
  bikes: (row) => row.bikes,
  rides: (row) => row.rides,
  maintenanceEntries: (row) => row.maintenanceEntries,
  aiConversations: (row) => row.aiConversations,
  stravaConnected: (row) => (row.stravaConnected ? 1 : 0),
  daysToFirstBike: (row) => row.daysToFirstBike,
  lastActiveAt: (row) => row.lastActiveAt,
};

function RiderDetailTable({ users }) {
  const { sortedRows, sort, toggleSort } = useSortableRows(users, 'lastActiveAt', RIDER_DETAIL_ACCESSORS);
  return (
    <div className="overflow-x-auto border-t border-white/10 px-5 py-5 sm:px-6">
      <table className="w-full min-w-[860px] text-left text-xs">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">
            <SortableTh label="User" sortKey="uid" sort={sort} onSort={toggleSort} className="pb-3 pr-3" />
            <SortableTh label="Plan" sortKey="plan" sort={sort} onSort={toggleSort} className="pb-3 pr-3" />
            <SortableTh label="Signed up" sortKey="createdAt" sort={sort} onSort={toggleSort} className="pb-3 pr-3" />
            <SortableTh label="Bikes" sortKey="bikes" sort={sort} onSort={toggleSort} align="right" className="pb-3 pr-3" />
            <SortableTh label="Rides" sortKey="rides" sort={sort} onSort={toggleSort} align="right" className="pb-3 pr-3" />
            <SortableTh label="Maint." sortKey="maintenanceEntries" sort={sort} onSort={toggleSort} align="right" className="pb-3 pr-3" />
            <SortableTh label="AI" sortKey="aiConversations" sort={sort} onSort={toggleSort} align="right" className="pb-3 pr-3" />
            <SortableTh label="Strava" sortKey="stravaConnected" sort={sort} onSort={toggleSort} className="pb-3 pr-3" />
            <SortableTh label="Days to bike" sortKey="daysToFirstBike" sort={sort} onSort={toggleSort} align="right" className="pb-3 pr-3" />
            <SortableTh label="Last active" sortKey="lastActiveAt" sort={sort} onSort={toggleSort} className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {sortedRows.map((row) => (
            <tr key={row.uid}>
              <td className="py-2 pr-3 font-mono text-[#A8B0B8]" title={row.uid}>{row.uid.slice(0, 10)}…</td>
              <td className="py-2 pr-3">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                  style={row.isPremium
                    ? { background: 'rgba(2,132,199,0.15)', color: '#7DC8F0', border: '1px solid rgba(2,132,199,0.4)' }
                    : { background: 'rgba(247,37,133,0.1)', color: '#FF6EAF', border: '1px solid rgba(247,37,133,0.3)' }}
                >
                  {row.isPremium ? 'Premium' : 'Free'}
                </span>
              </td>
              <td className="py-2 pr-3 text-[#D7DCE0]">{formatDate(row.createdAt)}</td>
              <td className="py-2 pr-3 text-right font-mono text-[#F4F6F8]">{row.bikes}</td>
              <td className="py-2 pr-3 text-right font-mono text-[#F4F6F8]">{row.rides}</td>
              <td className="py-2 pr-3 text-right font-mono text-[#F4F6F8]">{row.maintenanceEntries}</td>
              <td className="py-2 pr-3 text-right font-mono text-[#F4F6F8]">{row.aiConversations}</td>
              <td className="py-2 pr-3 text-[#D7DCE0]">{row.stravaConnected ? 'Yes' : '—'}</td>
              <td className="py-2 pr-3 text-right font-mono text-[#D7DCE0]">{row.daysToFirstBike ?? '—'}</td>
              <td className="py-2 text-[#D7DCE0]">{row.lastActiveAt ? formatDate(row.lastActiveAt) : 'Never'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AskPanel({ authenticatedFetch, tenantId, generatedAt }) {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState('');
  const threadEndRef = useRef(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread, asking]);

  async function ask() {
    const trimmed = question.trim();
    if (!trimmed || asking) return;
    setAsking(true);
    setAskError('');
    const history = thread.slice(-6);
    setThread((current) => [...current, { role: 'user', content: trimmed }]);
    setQuestion('');
    try {
      const response = await authenticatedFetch('/api/stea/dialled-mtb/dashboard/ask', {
        method: 'POST',
        body: JSON.stringify({ tenantId, question: trimmed, history }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The assistant could not answer.');
      setThread((current) => [...current, { role: 'assistant', content: payload.answer }]);
    } catch (error) {
      setAskError(error.message || 'The assistant could not answer.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <SectionCard
      eyebrow="Ask the data"
      title="Interrogate the numbers in plain English"
      subtitle={`Answers come from the latest snapshot (${formatDateTime(generatedAt)}) — hit Refresh first if you want live numbers.`}
    >
      {thread.length > 0 ? (
        <div className="mb-4 max-h-96 space-y-3 overflow-y-auto rounded-lg border border-white/10 bg-[#0D1013] p-4">
          {thread.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className={turn.role === 'user' ? 'text-right' : ''}>
              <div
                className={`inline-block max-w-[92%] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-left text-sm leading-6 ${
                  turn.role === 'user'
                    ? 'border border-[#F72585]/30 bg-[#F72585]/10 text-[#F4F6F8]'
                    : 'border border-white/10 bg-[#12161A] text-[#C9D1D7]'
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}
          {asking ? <p className="text-xs text-[#68717A]">Analysing…</p> : null}
          <div ref={threadEndRef} />
        </div>
      ) : null}

      {askError ? (
        <div className="mb-3 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{askError}</div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0D1013]">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void ask();
            }
          }}
          rows={3}
          placeholder="e.g. Which free users were active in the last 30 days, and what did they do?"
          className="w-full resize-vertical border-none bg-transparent px-4 py-3 text-sm text-[#F4F6F8] outline-none placeholder:text-[#68717A]"
        />
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3.5 py-2.5">
          <span className="text-[11px] text-[#68717A]">Snapshot data only — no PII beyond pseudonymous user ids. Cmd+Enter to send.</span>
          <button
            type="button"
            onClick={ask}
            disabled={asking || question.trim().length === 0}
            className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-[0.1em] transition ${
              asking || question.trim().length === 0
                ? 'bg-white/10 text-[#68717A]'
                : 'bg-[#F72585] text-white hover:bg-[#FF6EAF]'
            }`}
          >
            {asking ? 'Analysing…' : 'Ask'}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

export default function DialledDashboardClient() {
  const router = useRouter();
  const { currentTenant, loading: tenantLoading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('exec');

  const canAdmin = Boolean(isSuperAdmin || isWorkspaceAdmin);
  const hasWorkspace = workspaceAllowed(currentTenant);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'engagement' || tab === 'riders') setActiveTab(tab);
  }, []);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setError(
        firebaseInitError
          ? 'The dashboard is unavailable because Firebase client configuration is invalid in this environment.'
          : 'The dashboard is unavailable in this environment.',
      );
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) router.replace('/apps/stea?next=/apps/stea/dialled-mtb/dashboard');
    });
    return unsubscribe;
  }, [router]);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    if (!user) throw new Error('Sign in again to continue.');
    const token = await user.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }, [user]);

  const loadSnapshot = useCallback(async () => {
    if (!user || !currentTenant?.id || !hasWorkspace || !canAdmin) return;
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`/api/stea/dialled-mtb/dashboard?tenantId=${encodeURIComponent(currentTenant.id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load the dashboard.');
      setSnapshot(payload.snapshot || null);
    } catch (loadError) {
      setError(loadError.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, canAdmin, currentTenant?.id, hasWorkspace, user]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  async function refresh() {
    if (refreshing || !currentTenant?.id) return;
    setRefreshing(true);
    setError('');
    try {
      const response = await authenticatedFetch('/api/stea/dialled-mtb/dashboard', {
        method: 'POST',
        body: JSON.stringify({ tenantId: currentTenant.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not refresh the dashboard.');
      setSnapshot(payload.snapshot || null);
    } catch (refreshError) {
      setError(refreshError.message || 'Could not refresh the dashboard.');
    } finally {
      setRefreshing(false);
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'engagement' || tab === 'riders') url.searchParams.set('tab', tab);
    else url.searchParams.delete('tab');
    window.history.replaceState(null, '', url.toString());
  }

  const totals = snapshot?.totals;
  const ga4 = snapshot?.ga4;
  const ga4Ready = ga4 && !ga4.error;
  const topEvents = useMemo(
    () => (ga4Ready ? (ga4.eventCounts || []).filter((event) => !GA4_DEFAULT_EVENTS.has(event.eventName)).slice(0, 12) : []),
    [ga4, ga4Ready],
  );

  if (!authReady || tenantLoading) {
    return <div className="flex min-h-[65vh] items-center justify-center bg-[#0D1013] text-sm text-[#8A939D]">Checking workspace access…</div>;
  }

  if (!auth) {
    return (
      <main className="min-h-[70vh] bg-[#0D1013] px-5 py-14 text-[#F4F6F8]">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-400/20 bg-[#12161A] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F72585]">Analytics</p>
          <h1 className="mt-3 text-2xl font-black">Firebase configuration required</h1>
          <p className="mt-3 text-sm leading-6 text-[#C9A7B6]">{error}</p>
          <Link href="/apps/stea" className="mt-6 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-[#E8EBEE] hover:border-[#F72585]/50">Back to STEa</Link>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (!hasWorkspace || !canAdmin) {
    return (
      <main className="min-h-[70vh] bg-[#0D1013] px-5 py-14 text-[#F4F6F8]">
        <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#12161A] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F72585]">Analytics</p>
          <h1 className="mt-3 text-2xl font-black">Workspace admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-[#8A939D]">Select the Dialled MTB or ArcturusDC workspace with an admin account.</p>
          <div className="mt-6"><TenantSwitcher /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1013] px-4 py-8 text-[#F4F6F8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1300px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7E8790]">
              <Link href="/apps/stea/dialled-mtb" className="transition hover:text-[#F72585]">Dialled MTB</Link>
              <span>/</span>
              <span className="text-[#F72585]">Analytics</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Rider analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8A939D]">
              Lifetime platform health plus the free-rider engagement picture. Data refreshes automatically every 24 hours.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">Data as of</p>
              <p className="font-mono text-xs text-[#D7DCE0]">{snapshot ? formatDateTime(snapshot.generatedAt) : '—'}</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing || loading}
              className={`rounded-lg px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] transition ${
                refreshing || loading ? 'bg-white/10 text-[#68717A]' : 'bg-[#F72585] text-white hover:bg-[#FF6EAF]'
              }`}
            >
              {refreshing ? 'Refreshing…' : 'Refresh now'}
            </button>
            <TenantSwitcher />
          </div>
        </header>

        <nav className="mt-6 flex gap-2">
          {[
            ['exec', 'Exec summary'],
            ['engagement', 'Engagement & onboarding'],
            ['riders', 'Rider distribution'],
          ].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchTab(tab)}
              aria-pressed={activeTab === tab}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'border-[#F72585]/60 bg-[#F72585]/10 text-[#FF6EAF]'
                  : 'border-white/10 bg-[#15191D] text-[#7E8790] hover:border-white/20 hover:text-[#D7DCE0]'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {error ? (
          <div className="mt-5 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {loading && !snapshot ? (
          <div className="mt-10 flex min-h-[30vh] items-center justify-center text-sm text-[#8A939D]">
            Building the first snapshot — this reads every collection and can take a few seconds…
          </div>
        ) : null}

        {snapshot ? (
          <div className="mt-7 space-y-7">
            {activeTab === 'exec' ? (
              <>
                {snapshot.trends ? (
                  <div className="grid gap-7 lg:grid-cols-2">
                    <SectionCard
                      eyebrow="Growth"
                      title="Registered users — lifetime"
                      subtitle="Cumulative signups from Firebase user profiles (createdAt)."
                    >
                      <TrendChart
                        ariaLabel="Cumulative registered users over time"
                        series={[{
                          name: 'Registered',
                          color: COLOR_FREE,
                          points: (snapshot.trends.registrations || []).map((point) => ({ date: point.date, value: point.count })),
                        }]}
                      />
                    </SectionCard>
                    <SectionCard
                      eyebrow="Plan mix"
                      title="Premium vs free"
                      subtitle="Daily counts from stored dashboard snapshots. Premium start dates aren't recorded retroactively, so this history begins with the first snapshot and grows one point per day."
                    >
                      {(snapshot.trends.premiumVsFree || []).length >= 2 ? (
                        <TrendChart
                          ariaLabel="Premium and free users per day"
                          series={[
                            {
                              name: 'Free',
                              color: COLOR_FREE,
                              points: snapshot.trends.premiumVsFree
                                .filter((point) => point.freeUsers != null)
                                .map((point) => ({ date: point.date, value: point.freeUsers })),
                            },
                            {
                              name: 'Premium',
                              color: COLOR_PREMIUM,
                              points: snapshot.trends.premiumVsFree
                                .filter((point) => point.premiumUsers != null)
                                .map((point) => ({ date: point.date, value: point.premiumUsers })),
                            },
                          ]}
                        />
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-[#0D1013] px-4 py-4 text-xs leading-5 text-[#8A939D]">
                          Only {snapshot.trends.premiumVsFree?.length || 0} day(s) of snapshot history so far — the daily 05:00 UTC
                          snapshot adds a point each day. Current split: {numberFormat.format(totals.freeUsers)} free ·{' '}
                          {numberFormat.format(totals.premiumUsers)} premium.
                        </div>
                      )}
                    </SectionCard>
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-[#12161A] px-4 py-3 text-xs text-[#8A939D]">
                    Trend charts appear once a fresh snapshot is computed — hit Refresh now.
                  </div>
                )}

                {snapshot.trends?.bikeAdoption?.points?.length ? (
                  <SectionCard
                    eyebrow="Onboarding"
                    title="% of free users who added at least one bike"
                    subtitle="Cumulative, lifetime-accurate — scoped to users who are free today, so upgrading to premium never causes this line to drop."
                  >
                    <TrendChart
                      ariaLabel="Percentage of free users with at least one bike over time"
                      series={[{
                        name: 'Free, with a bike',
                        color: COLOR_FREE,
                        points: snapshot.trends.bikeAdoption.points.map((point) => ({ date: point.date, value: point.pctWithBike })),
                      }]}
                    />
                  </SectionCard>
                ) : null}

                <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-5">
                  <StatTile label="Registered users" value={numberFormat.format(totals.registeredUsers)} />
                  <StatTile
                    label="Premium users"
                    value={numberFormat.format(totals.premiumUsers)}
                    hint="Active entitlement now; churned counts as free"
                  />
                  <StatTile label="Bike profiles" value={numberFormat.format(totals.bikeProfiles)} hint={totals.bikeProfilesArchived ? `+${totals.bikeProfilesArchived} archived` : undefined} />
                  <StatTile
                    label="Total rides"
                    value={numberFormat.format(totals.totalRides)}
                    hint={`${totals.ridesBySource.manual} manual · ${totals.ridesBySource.strava} Strava · ${totals.ridesBySource.health} Health`}
                  />
                  <StatTile label="Sessions" value={ga4Ready ? numberFormat.format(ga4.sessionsLifetime) : '—'} hint={ga4Ready ? `${numberFormat.format(ga4.sessions30d)} in last 30 days` : 'GA4 access pending'} />
                  <StatTile label="Strava connected" value={numberFormat.format(totals.stravaConnectedUsers)} />
                  <StatTile label="Maintenance users" value={numberFormat.format(totals.usersWithMaintenanceActivity)} hint={`${totals.usersWithMaintenanceDue} with tasks due`} />
                  <StatTile label="AI conversations" value={numberFormat.format(totals.aiConversations)} hint={`${totals.usersWithAi} users`} />
                  <StatTile label="Feedback items" value={numberFormat.format(totals.feedbackCount)} />
                  <StatTile label="Free users" value={numberFormat.format(totals.freeUsers)} />
                </section>

                <SectionCard
                  eyebrow="User funnel"
                  title="Where riders stop"
                  subtitle="Distinct users per stage, lifetime. Stages are independent counts, not sequentially gated."
                >
                  <FunnelChart funnel={snapshot.funnel} />
                </SectionCard>

                <SectionCard
                  eyebrow="Sessions"
                  title="Daily sessions — last 30 days"
                  subtitle={ga4Ready ? 'Google Analytics, all users (aggregate — GA4 cannot split free vs premium).' : null}
                >
                  {ga4Ready ? (
                    <Sparkline points={ga4.dailySessions30d} />
                  ) : (
                    <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-4 py-4 text-xs leading-5 text-[#B9A98C]">
                      GA4 access pending — {ga4?.error || 'not configured yet.'} Grant the service account Viewer access on the GA4
                      property and set DIALLED_MTB_GA4_PROPERTY_ID, then hit Refresh.
                    </div>
                  )}
                </SectionCard>

                {ga4Ready && topEvents.length ? (
                  <SectionCard eyebrow="App events" title="Top GA4 events" subtitle="All users, aggregate. Lifetime vs last 30 days.">
                    <TopEventsTable events={topEvents} />
                  </SectionCard>
                ) : null}
              </>
            ) : null}

            {activeTab === 'engagement' ? (
              <>
                <SectionCard
                  eyebrow="Free vs premium"
                  title="Which features free riders actually touch"
                  subtitle="Share of each segment that has ever used the feature, with lifetime event volumes. Free riders who never reach a feature can never convert on it."
                >
                  <FeatureMatrix
                    featureMatrix={snapshot.engagement.featureMatrix}
                    freeTotal={totals.freeUsers}
                    premiumTotal={totals.premiumUsers}
                  />
                </SectionCard>

                <SectionCard
                  eyebrow="Activity"
                  title="How recently each segment was active"
                  subtitle="Activity = rides, AI exchanges, maintenance logs or bike edits — deliberate in-app actions only."
                >
                  <div className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2">
                    {['free', 'premium'].map((segment) => {
                      const stats = snapshot.engagement.activity[segment];
                      const segmentTotal = segment === 'free' ? totals.freeUsers : totals.premiumUsers;
                      return (
                        <div key={segment} className="bg-[#0D1013] px-5 py-5">
                          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#68717A]">
                            <span className="h-2 w-2 rounded-full" style={{ background: segment === 'free' ? COLOR_FREE : COLOR_PREMIUM }} />
                            {segment} ({segmentTotal})
                          </p>
                          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div><dt className="text-[#68717A]">Active 7d</dt><dd className="mt-0.5 font-mono text-lg font-bold text-[#F4F6F8]">{stats.active7d}</dd></div>
                            <div><dt className="text-[#68717A]">Active 30d</dt><dd className="mt-0.5 font-mono text-lg font-bold text-[#F4F6F8]">{stats.active30d}</dd></div>
                            <div><dt className="text-[#68717A]">Never active</dt><dd className="mt-0.5 font-mono text-lg font-bold text-[#F4F6F8]">{stats.neverActive}</dd></div>
                            <div><dt className="text-[#68717A]">Avg actions / active user / 30d</dt><dd className="mt-0.5 font-mono text-lg font-bold text-[#F4F6F8]">{stats.avgEventsPerActive30d}</dd></div>
                          </dl>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard
                  eyebrow="Onboarding"
                  title="Registration → first bike"
                  subtitle={`${snapshot.onboarding.pctNeverCreatedBike}% of all registrants never created a bike. Median time to first bike for those who did: ${snapshot.onboarding.medianDaysToFirstBike ?? '—'} day(s). Without a bike there is no setup, no maintenance, no Strava — the product is inert.`}
                >
                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-5">
                    {[
                      ['Same day', snapshot.onboarding.timeToFirstBike.sameDay],
                      ['1–3 days', snapshot.onboarding.timeToFirstBike.d1to3],
                      ['4–7 days', snapshot.onboarding.timeToFirstBike.d4to7],
                      ['8+ days', snapshot.onboarding.timeToFirstBike.d8plus],
                      ['Never', snapshot.onboarding.timeToFirstBike.never],
                    ].map(([label, value]) => (
                      <StatTile key={label} label={label} value={numberFormat.format(value)} />
                    ))}
                  </div>

                  {snapshot.onboarding.weeklyCohorts.length ? (
                    <WeeklyCohortsTable cohorts={snapshot.onboarding.weeklyCohorts} />
                  ) : null}

                  {snapshot.onboarding.recentRegistrantsWithoutBike.length ? (
                    <div className="mt-6">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#68717A]">
                        Registered in the last 30 days, garage still empty — the re-engagement list ({snapshot.onboarding.recentRegistrantsWithoutBike.length})
                      </p>
                      <RecentRegistrantsTable registrants={snapshot.onboarding.recentRegistrantsWithoutBike} />
                    </div>
                  ) : null}
                </SectionCard>
              </>
            ) : null}

            {activeTab === 'riders' ? (
              <>
                <SectionCard
                  eyebrow="Rider distribution"
                  title="How usage is spread across the whole user base"
                  subtitle="Every rider counted once, free and premium together — shows whether activity is concentrated in a few power users or spread evenly. Pseudonymous uids only."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DistributionChart title="Bikes per rider" unitLabel="bikes" distribution={snapshot.distributions?.bikes} />
                    <DistributionChart title="Rides per rider" unitLabel="rides" distribution={snapshot.distributions?.rides} />
                    <DistributionChart title="Maintenance logs per rider" unitLabel="logs" distribution={snapshot.distributions?.maintenanceEntries} />
                    <DistributionChart title="AI conversations per rider" unitLabel="conversations" distribution={snapshot.distributions?.aiConversations} />
                  </div>
                </SectionCard>

                <details className="group rounded-xl border border-white/10 bg-[#12161A]" open>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 outline-none transition hover:bg-white/[0.02] sm:px-6 [&::-webkit-details-marker]:hidden">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F72585]">Rider detail</p>
                      <h2 className="mt-1 text-xl font-black">Every rider, most recently active first</h2>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#8A939D] group-open:text-[#FF6EAF]">
                      <span className="group-open:hidden">Open table</span>
                      <span className="hidden group-open:inline">Hide table</span>
                    </span>
                  </summary>
                  <RiderDetailTable users={snapshot.users} />
                </details>
              </>
            ) : null}

            <AskPanel authenticatedFetch={authenticatedFetch} tenantId={currentTenant.id} generatedAt={snapshot.generatedAt} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
