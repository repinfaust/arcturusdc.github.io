'use client';

import { useState, useEffect, useCallback } from 'react';
import { Space_Mono } from 'next/font/google';

const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'] });

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

const EVENT_TYPES = [
  { id: 'release',   label: 'Release',   color: '#34d399' },
  { id: 'milestone', label: 'Milestone', color: '#f72585' },
  { id: 'event',     label: 'Event',     color: '#4cc9f0' },
  { id: 'marketing', label: 'Marketing', color: '#f59e0b' },
];

const SEED_EVENTS = [
  {
    id: 'seed-launch-2026',
    title: 'Dialled MTB Production Launch',
    date: '2026-05-15',
    type: 'release',
    note: 'v1.0 live on Google Play',
  },
];

const STORAGE_KEY = 'dialled-mtb-calendar-v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }
function toKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstWeekday(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; } // Mon=0

function formatDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function typeColor(t) { return EVENT_TYPES.find(e => e.id === t)?.color ?? '#888890'; }
function typeLabel(t) { return EVENT_TYPES.find(e => e.id === t)?.label ?? t; }

// ─── Inline styles ────────────────────────────────────────────────────────────

const bg        = '#0e0e10';
const surface   = '#17171a';
const surface2  = '#1e1e22';
const accent    = '#f72585';
const textMain  = '#f0f0f0';
const muted     = '#888890';
const muted2    = '#4a4a55';
const border    = 'rgba(255,255,255,0.07)';
const borderMd  = 'rgba(255,255,255,0.11)';

// ─── Sub-components ───────────────────────────────────────────────────────────

function TriangleMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 7 57 52H7L32 7Z" stroke="#F72585" strokeWidth="6" strokeLinejoin="round" />
      <path d="M32 19 46 44H18L32 19Z" fill="#0e0e10" />
    </svg>
  );
}

function TypeBadge({ type, small }) {
  const color = typeColor(type);
  return (
    <span style={{
      display: 'inline-block',
      fontSize: small ? '8px' : '9px',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      padding: small ? '2px 6px' : '3px 8px',
      borderRadius: '2px',
      background: `${color}18`,
      border: `1px solid ${color}45`,
      color,
    }}>
      {typeLabel(type)}
    </span>
  );
}

// ─── Add / Detail Modal ───────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: surface,
          border: `1px solid rgba(247,37,133,0.28)`,
          borderRadius: '12px',
          padding: '28px 28px 24px',
          width: '440px',
          maxWidth: '92vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DialledMtbCalendarClient() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState([]);
  const [selDate, setSelDate] = useState(null);   // date string for add modal
  const [detailEvt, setDetailEvt] = useState(null); // event object for detail modal
  const [form, setForm] = useState({ title: '', type: 'milestone', note: '', date: '' });
  const [addOpen, setAddOpen] = useState(false);

  // Load / seed
  useEffect(() => {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch {}
    const ids = new Set(stored.map(e => e.id));
    const merged = [...stored, ...SEED_EVENTS.filter(s => !ids.has(s.id))];
    setEvents(merged);
  }, []);

  const persist = useCallback((evts) => {
    setEvents(evts);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(evts)); } catch {}
  }, []);

  const openAdd = (dateStr) => {
    setForm({ title: '', type: 'milestone', note: '', date: dateStr });
    setAddOpen(true);
  };

  const submitAdd = () => {
    if (!form.title.trim() || !form.date) return;
    persist([...events, {
      id: `evt-${Date.now()}`,
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      note: form.note.trim(),
    }]);
    setAddOpen(false);
    setForm({ title: '', type: 'milestone', note: '', date: '' });
  };

  const deleteEvent = (id) => {
    persist(events.filter(e => e.id !== id));
    setDetailEvt(null);
  };

  // Navigation
  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // Calendar grid
  const totalDays  = daysInMonth(year, month);
  const startPad   = firstWeekday(year, month);
  const todayKey   = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const byDate = {};
  for (const e of events) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  // Upcoming: future events sorted
  const upcoming = [...events]
    .filter(e => e.date >= todayKey)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={spaceMono.className} style={{ minHeight: '100vh', background: bg, color: textMain, padding: '40px 32px 80px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingBottom: '24px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TriangleMark size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '0.16em', color: accent, lineHeight: 1 }}>DIALLED MTB</div>
              <div style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: muted2, marginTop: '3px' }}>Calendar</div>
            </div>
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={prev} style={navBtnStyle}>&#8592;</button>
            <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: '180px', textAlign: 'center', color: textMain }}>
              {MONTHS[month]} {year}
            </span>
            <button onClick={next} style={navBtnStyle}>&#8594;</button>
          </div>

          {/* Add event */}
          <button
            onClick={() => openAdd(todayKey)}
            style={{ background: accent, border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 18px' }}
          >
            + Add Event
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>

          {/* Calendar grid */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '10px', overflow: 'hidden' }}>

            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${border}` }}>
              {DAYS.map(d => (
                <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: '9px', letterSpacing: '0.14em', color: muted2, fontWeight: 700 }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {/* Leading empty cells */}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} style={{ minHeight: '90px', borderRight: `1px solid rgba(255,255,255,0.04)`, borderBottom: `1px solid rgba(255,255,255,0.04)`, background: 'rgba(0,0,0,0.18)' }} />
              ))}

              {/* Date cells */}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
                const key  = toKey(year, month, day);
                const evts = byDate[key] || [];
                const isToday = key === todayKey;

                return (
                  <div
                    key={day}
                    onClick={() => openAdd(key)}
                    style={{
                      minHeight: '90px',
                      padding: '8px 8px 6px',
                      borderRight: `1px solid rgba(255,255,255,0.04)`,
                      borderBottom: `1px solid rgba(255,255,255,0.04)`,
                      cursor: 'pointer',
                      background: isToday ? 'rgba(247,37,133,0.05)' : 'transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(247,37,133,0.05)' : 'transparent'; }}
                  >
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '22px', height: '22px', borderRadius: '50%',
                      fontSize: '11px', fontWeight: isToday ? 700 : 400,
                      color: isToday ? accent : muted,
                      background: isToday ? 'rgba(247,37,133,0.15)' : 'transparent',
                      border: isToday ? `1px solid rgba(247,37,133,0.4)` : '1px solid transparent',
                      marginBottom: '4px',
                    }}>
                      {day}
                    </div>

                    {evts.slice(0, 3).map(evt => (
                      <div
                        key={evt.id}
                        onClick={e => { e.stopPropagation(); setDetailEvt(evt); }}
                        style={{
                          display: 'block',
                          fontSize: '9px',
                          color: typeColor(evt.type),
                          background: `${typeColor(evt.type)}16`,
                          border: `1px solid ${typeColor(evt.type)}38`,
                          borderRadius: '2px',
                          padding: '2px 5px',
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          letterSpacing: '0.01em',
                          lineHeight: '1.5',
                        }}
                      >
                        {evt.title}
                      </div>
                    ))}
                    {evts.length > 3 && (
                      <div style={{ fontSize: '8px', color: muted2, letterSpacing: '0.06em', marginTop: '1px' }}>+{evts.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Upcoming events */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: `1px solid ${border}`, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: muted2, fontWeight: 700 }}>
                Upcoming
              </div>
              {upcoming.length === 0 && (
                <div style={{ padding: '20px 16px', fontSize: '11px', color: muted2, textAlign: 'center' }}>No upcoming events</div>
              )}
              {upcoming.map((evt, i) => (
                <div
                  key={evt.id}
                  onClick={() => setDetailEvt(evt)}
                  style={{
                    padding: '12px 16px',
                    borderTop: i === 0 ? 'none' : `1px solid rgba(255,255,255,0.05)`,
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <TypeBadge type={evt.type} small />
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: textMain, letterSpacing: '0.02em', lineHeight: 1.4, marginBottom: '3px' }}>
                    {evt.title}
                  </div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.06em', color: muted2 }}>
                    {formatDisplay(evt.date)}
                  </div>
                </div>
              ))}
            </div>

            {/* All events count strip */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: muted2 }}>Total events</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: accent }}>{events.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {addOpen && (
        <Modal onClose={() => setAddOpen(false)}>
          <div style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: '18px' }}>
            Add Event / Milestone
          </div>

          <label style={labelStyle}>Title</label>
          <input
            autoFocus
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') submitAdd(); }}
            placeholder="e.g. Malvern Classics"
            style={inputStyle}
          />

          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />

          <label style={labelStyle}>Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            style={selectStyle}
          >
            {EVENT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <label style={labelStyle}>Note <span style={{ color: muted2, fontWeight: 400 }}>(optional)</span></label>
          <textarea
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Any additional context..."
            style={textareaStyle}
          />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button onClick={() => setAddOpen(false)} style={cancelBtnStyle}>Cancel</button>
            <button
              onClick={submitAdd}
              disabled={!form.title.trim() || !form.date}
              style={{ ...confirmBtnStyle, opacity: (!form.title.trim() || !form.date) ? 0.4 : 1 }}
            >
              Add Event
            </button>
          </div>
        </Modal>
      )}

      {/* Event Detail Modal */}
      {detailEvt && (
        <Modal onClose={() => setDetailEvt(null)}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '12px' }}>
            <TypeBadge type={detailEvt.type} />
            <span style={{ fontSize: '10px', color: muted, letterSpacing: '0.04em' }}>{formatDisplay(detailEvt.date)}</span>
          </div>

          <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.03em', color: textMain, marginBottom: '10px', lineHeight: 1.4 }}>
            {detailEvt.title}
          </div>

          {detailEvt.note && (
            <div style={{ fontSize: '12px', color: muted, lineHeight: 1.7, marginBottom: '20px', padding: '12px', background: surface2, borderRadius: '5px', border: `1px solid ${border}` }}>
              {detailEvt.note}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: detailEvt.note ? 0 : '20px' }}>
            <button
              onClick={() => deleteEvent(detailEvt.id)}
              style={{ ...cancelBtnStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              Delete
            </button>
            <button onClick={() => setDetailEvt(null)} style={confirmBtnStyle}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared style objects ─────────────────────────────────────────────────────

const navBtnStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: '5px',
  color: '#f0f0f0',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
  padding: '6px 14px',
  lineHeight: 1,
};

const labelStyle = {
  display: 'block',
  fontSize: '9px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#4a4a55',
  fontWeight: 700,
  marginBottom: '6px',
  fontFamily: 'inherit',
};

const inputStyle = {
  width: '100%',
  background: '#0e0e10',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '5px',
  color: '#f0f0f0',
  fontFamily: 'inherit',
  fontSize: '12px',
  padding: '10px 12px',
  marginBottom: '16px',
  outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '72px',
};

const cancelBtnStyle = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '5px',
  color: '#888890',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '11px',
  letterSpacing: '0.06em',
  padding: '8px 18px',
  transition: 'border-color 0.15s',
};

const confirmBtnStyle = {
  background: '#f72585',
  border: 'none',
  borderRadius: '5px',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  padding: '8px 18px',
  transition: 'opacity 0.15s',
};
