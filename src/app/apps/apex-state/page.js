'use client';

import Link from 'next/link';
import { useState } from 'react';

const ORANGE = '#FF4B1F';
const INK = '#0A0A0A';
const RAISED = '#141414';
const BORDER = '#2A2A2A';
const TEXT = '#FFFFFF';
const SECONDARY = '#A3A3A3';
const TERTIARY = '#525252';

const GRID_BG = {
  backgroundImage:
    'linear-gradient(to right, rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.028) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
};

function PeakMarkIcon({ size = 48, bg = RAISED }) {
  const r = Math.round(size * 0.22);
  // Computed from marks.jsx: viewBox 0 0 100 100, padding 0.18
  // chevron: M23 77 L50 30 L77 77, crossbar at y≈58, plus at upper-right
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: 'block', borderRadius: r, flexShrink: 0 }}
    >
      <rect width="100" height="100" fill={bg} rx="22" />
      <path
        d="M 23 77 L 50 30 L 77 77"
        fill="none"
        stroke={TEXT}
        strokeWidth="8.3"
        strokeLinejoin="miter"
        strokeMiterlimit="4"
      />
      <rect x="39" y="58" width="23" height="4.6" fill={TEXT} />
      <rect x="80.7" y="22" width="3.1" height="14" fill={ORANGE} />
      <rect x="75" y="27.5" width="14" height="3.1" fill={ORANGE} />
    </svg>
  );
}

function FeatureIcon({ name }) {
  const paths = {
    sessions: (
      <>
        <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
    garage: (
      <>
        <path d="M2 8l8-4 8 4v9H2V8z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="7" y="11" width="6" height="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    strategy: (
      <>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
    skill: (
      <>
        <rect x="3" y="12" width="4" height="5" rx="1" fill="currentColor" />
        <rect x="8" y="8" width="4" height="9" rx="1" fill="currentColor" opacity="0.7" />
        <rect x="13" y="4" width="4" height="13" rx="1" fill="currentColor" opacity="0.5" />
      </>
    ),
    paddock: (
      <>
        <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="14" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M14 17c0-2 1.5-3 4-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    history: (
      <>
        <path d="M10 3c-3.9 0-7 3.1-7 7s3.1 7 7 7 7-3.1 7-7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  };
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Feature({ title, desc, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span
        style={{
          flexShrink: 0,
          marginTop: 2,
          background: '#1A1A1A',
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: 8,
          display: 'grid',
          placeItems: 'center',
          color: SECONDARY,
        }}
      >
        <FeatureIcon name={icon} />
      </span>
      <div>
        <div style={{ fontWeight: 600, color: TEXT, fontSize: 15, marginBottom: 3 }}>{title}</div>
        <div style={{ color: SECONDARY, fontSize: 14, lineHeight: 1.45 }}>{desc}</div>
      </div>
    </div>
  );
}

function AccordionItem({ question, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${open ? '#3A3A3A' : BORDER}`,
        background: open ? '#161616' : RAISED,
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: TEXT,
          fontFamily: 'inherit',
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        }}
      >
        <span>{question}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'none',
            color: SECONDARY,
          }}
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            padding: '0 16px 16px',
            color: SECONDARY,
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const FEATURES = [
  { title: 'Session Logging', desc: 'Log tyre pressures, compounds, gearing, and notes between sessions', icon: 'sessions' },
  { title: 'Bike Garage', desc: 'Manage multiple bikes with their own setup histories', icon: 'garage' },
  { title: 'Track Strategy', desc: 'Annotate the circuit with braking points, lines, and coaching notes', icon: 'strategy' },
  { title: 'Skill-Based UI', desc: 'Three modes unlock fields progressively', icon: 'skill' },
  { title: 'Paddock View', desc: 'See what others are running at the same event', icon: 'paddock' },
  { title: 'Event History', desc: 'Compare setups, spot patterns, track progression', icon: 'history' },
];

const FAQS = [
  {
    q: 'Who is Apex State for?',
    a: 'Apex State is designed for everyday track riders through to aspiring racers. Whether you\'re doing your first track day or competing regularly, it helps you build structure around your setup and find what\'s actually fast.',
  },
  {
    q: "What does 'Skill-Based UI' mean?",
    a: 'The app has three modes that unlock fields progressively. Beginners see simplified options to avoid overwhelm, while experienced riders and racers access detailed suspension geometry, electronics settings, and advanced setup tracking.',
  },
  {
    q: 'Can I track multiple bikes?',
    a: 'Yes. The Bike Garage lets you manage multiple bikes, each with their own complete setup history, making it easy to switch between machines or compare configurations.',
  },
  {
    q: 'What is Paddock View?',
    a: "Paddock View shows anonymised setup data from other riders at the same event. It's a way to benchmark your setup and learn from the paddock community without revealing personal information.",
  },
  {
    q: 'How does Track Strategy work?',
    a: 'You can annotate circuit maps with braking points, racing lines, and coaching notes. This visual reference helps you remember what worked and plan improvements for your next session.',
  },
  {
    q: 'Is my data private?',
    a: 'All your setup data is private by default. You control what\'s shared in Paddock View, and even then it\'s anonymised. Your detailed notes, suspension settings, and historical data remain completely private.',
  },
];

const MONO = "'JetBrains Mono', 'Courier New', monospace";
const SANS = "'Space Grotesk', system-ui, sans-serif";

export default function ApexState() {
  return (
    <main style={{ paddingBottom: 40, fontFamily: SANS }}>

      {/* Summary card */}
      <div className="card p-4 flex items-start gap-3 mt-2">
        <PeakMarkIcon size={64} bg={RAISED} />
        <div>
          <div style={{ fontWeight: 800, color: '#111', letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 2 }}>
            Apex State
            <span style={{ color: ORANGE, fontWeight: 800, marginLeft: 2 }}>+</span>
          </div>
          <div className="text-muted text-sm">telemetry, sessions and setup — for riders who actually ride.</div>
          <p className="mt-2 text-sm text-neutral-700">
            Apex State is a track-day setup companion for motorcyclists who want structure over guesswork.
            Log tyre pressures, session notes, and suspension settings—then compare them across events
            to find what&rsquo;s actually fast.
          </p>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative mt-3 overflow-hidden rounded-2xl"
        style={{ background: INK, border: `1px solid ${BORDER}` }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            ...GRID_BG,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 36px' }}>

          {/* Top meta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0 0',
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: TERTIARY,
            }}
          >
            <span>+ now in beta</span>
            <span>apexstate.app</span>
          </div>

          {/* Wordmark + icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 24,
              marginTop: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'clamp(44px, 9vw, 84px)',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 0.95,
                  color: TEXT,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                apex state
                <span style={{ color: ORANGE, fontSize: '0.52em', lineHeight: 1, marginTop: '0.1em', marginLeft: '0.06em' }}>+</span>
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 16,
                  color: SECONDARY,
                  lineHeight: 1.4,
                  maxWidth: 440,
                  letterSpacing: '-0.01em',
                }}
              >
                telemetry, sessions and setup — for riders who actually ride.
              </div>
            </div>
            <PeakMarkIcon size={148} bg="#141414" />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: BORDER, margin: '40px 0 32px' }} />

          {/* Key Features */}
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: ORANGE,
                marginBottom: 12,
              }}
            >
              01 — key features
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: TEXT,
                marginBottom: 20,
                letterSpacing: '-0.02em',
              }}
            >
              Built for the paddock
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {FEATURES.map((f) => (
                <Feature key={f.title} {...f} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: BORDER, margin: '40px 0 32px' }} />

          {/* FAQ */}
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: ORANGE,
                marginBottom: 12,
              }}
            >
              02 — faq
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: TEXT,
                marginBottom: 20,
                letterSpacing: '-0.02em',
              }}
            >
              Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQS.map((f) => (
                <AccordionItem key={f.q} question={f.q}>
                  {f.a}
                </AccordionItem>
              ))}
            </div>
          </div>

          {/* Footer strip */}
          <div
            style={{
              marginTop: 36,
              paddingTop: 24,
              borderTop: `1px solid ${BORDER}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: TERTIARY,
              }}
            >
              function over fashion
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Privacy Policy', href: '/apps/apex-state/privacy-policy' },
                { label: 'Terms of Use', href: '/apps/apex-state/terms-of-use' },
                { label: 'Delete Account', href: '/apps/apex-state/delete-account' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  style={{ fontSize: 12, color: SECONDARY, textDecoration: 'none', letterSpacing: '-0.01em' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}
