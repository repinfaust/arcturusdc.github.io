'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const COLORS = {
  obsidian: '#0D1117',
  graphite: '#161B22',
  slate: '#21262D',
  border: '#30363D',
  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textDim: '#484F58',
  navyDeep: '#0E1F35',
  teal: '#2DD4BF',
  tealDim: '#1A9E8F',
  tealFaint: '#0D4A43',
  high: '#10B981',
  highBg: '#052E1C',
  medium: '#F59E0B',
  mediumBg: '#2D1F00',
  low: '#EF4444',
  lowBg: '#2D0808',
  unknown: '#6B7280',
  unknownBg: '#1A1C20',
};

const LOCAL_KEY_PREFIX = 'orbit_grapheneos_real_';
const DEMO_BANNER_KEY = 'orbit_grapheneos_demo_banner_hidden';
const MAGIC_LINK_EMAIL_KEY = 'orbit_grapheneos_magic_email';

const DEMO_ORGS = [
  { orgId: 'device_emitter', displayName: 'GrapheneOS Device Emitter' },
  { orgId: 'soc_team', displayName: 'Security Operations' },
  { orgId: 'regulator', displayName: 'Regulator View (Demo)' },
];

const DEMO_SIGNALS = {
  verified_boot_state: 'verified',
  bootloader_status: 'green',
  kernel_version: '5.10.168-android13',
  security_patch_level: '2026-02-01',
  selinux_enforcing: '1',
  developer_options_enabled: '0',
  adb_enabled: '0',
  install_unknown_sources: '0',
  play_services_present: 'false',
  play_services_sandboxed: 'false',
  hardware_attestation_available: 'true',
  os_name: 'grapheneos',
  device_fingerprint_hash: '2d2fbc6b8d233c83f91ca91ac0f66c1df8f0a95dd6416f63bfc2ca30f03a9b72',
};

function shortHash(value) {
  if (!value) return 'GENESIS';
  const text = String(value);
  if (text.length <= 14) return text;
  return `${text.slice(0, 7)}...${text.slice(-7)}`;
}

function pseudoHash(input) {
  const text = JSON.stringify(input);
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h << 5) - h + text.charCodeAt(i);
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `${hex}${hex}${hex}${hex}`;
}

function daysSince(dateString) {
  const then = new Date(dateString).getTime();
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

function computeTrustRating(signals) {
  const patchAge = daysSince(signals.security_patch_level);
  const verified = signals.verified_boot_state === 'verified';
  const enforcing = signals.selinux_enforcing === '1';
  const adbOff = signals.adb_enabled === '0';
  const devOff = signals.developer_options_enabled === '0';
  const playPresent = signals.play_services_present === 'true';

  const requiredSignals = [
    'verified_boot_state',
    'selinux_enforcing',
    'adb_enabled',
    'developer_options_enabled',
    'security_patch_level',
  ];

  if (requiredSignals.some((key) => !signals[key])) return 'UNKNOWN';
  if (!verified || !devOff || !adbOff || patchAge > 180) return 'LOW';
  if (signals.verified_boot_state === 'self_signed' || (patchAge >= 90 && patchAge <= 180) || playPresent) return 'MEDIUM';
  if (verified && enforcing && adbOff && devOff && patchAge < 90) return 'HIGH';
  return 'UNKNOWN';
}

function deriveAlerts(rating, signals) {
  if (rating === 'LOW') {
    return [
      {
        alertType: 'INTEGRITY_VIOLATION',
        message: signals.adb_enabled === '1' || signals.developer_options_enabled === '1'
          ? 'ADB or developer options enabled. Device posture degraded.'
          : 'Critical trust posture failure detected.',
      },
    ];
  }
  if (rating === 'MEDIUM') {
    return [{ alertType: 'WARN_POSTURE', message: 'Posture degraded. Security review recommended.' }];
  }
  if (rating === 'UNKNOWN') {
    return [{ alertType: 'SIGNAL_INCOMPLETE', message: 'One or more required signals unavailable.' }];
  }
  return [];
}

function buildDemoEvents() {
  const eventHash = pseudoHash({ id: 'demo-1', payload: DEMO_SIGNALS });
  return [
    {
      id: 'demo-1',
      eventType: 'DEVICE_SIGNAL_REPORTED',
      orgId: 'device_emitter',
      userId: 'demo_device_grapheneos',
      trustRating: 'HIGH',
      purpose: 'device_trust_assessment',
      timestamp: new Date('2026-03-10T09:30:00.000Z').toISOString(),
      blockIndex: 1,
      previousHash: 'GENESIS',
      eventHash,
      signature: pseudoHash(`sig-${eventHash}`),
      payload: DEMO_SIGNALS,
    },
  ];
}

const DEMO_BASE = {
  orgs: DEMO_ORGS,
  events: buildDemoEvents(),
  consent: [
    {
      orgId: 'device_emitter',
      scope: 'device_trust_assessment',
      status: 'GRANTED',
      updatedAt: new Date('2026-03-10T09:25:00.000Z').toISOString(),
    },
  ],
  alerts: [],
};

function TrustBadge({ level }) {
  const map = {
    HIGH: { bg: COLORS.highBg, color: COLORS.high, border: '#0A4A2E' },
    MEDIUM: { bg: COLORS.mediumBg, color: COLORS.medium, border: '#4A3000' },
    LOW: { bg: COLORS.lowBg, color: COLORS.low, border: '#4A1010' },
    UNKNOWN: { bg: COLORS.unknownBg, color: COLORS.unknown, border: '#2A2C30' },
  };
  const style = map[level] || map.UNKNOWN;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 4,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
      {level}
    </span>
  );
}

function summaryIntegrity(events) {
  if (events.length <= 1) return true;
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].previousHash !== events[i - 1].eventHash) return false;
  }
  return true;
}

export default function OrbitGrapheneosPocPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [demoData, setDemoData] = useState(DEMO_BASE);
  const [realData, setRealData] = useState({ events: [], alerts: [], consent: [] });

  const tier = user ? 'authenticated' : 'public';

  const scopedData = useMemo(() => {
    if (tier === 'authenticated') {
      return {
        orgs: DEMO_ORGS,
        events: realData.events,
        alerts: realData.alerts,
        consent: realData.consent,
      };
    }
    return demoData;
  }, [demoData, realData, tier]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setBannerVisible(window.sessionStorage.getItem(DEMO_BANNER_KEY) !== '1');
  }, []);

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
        // Continue in client-only POC mode if session cookie setup fails.
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const cached = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
    const emailForLink = cached || window.prompt('Confirm your sign-in email');
    if (!emailForLink) return;

    setAuthBusy(true);
    setAuthError('');
    signInWithEmailLink(auth, emailForLink, window.location.href)
      .then(() => {
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        window.history.replaceState({}, document.title, '/apps/stea/orbit-grapheneos/poc');
      })
      .catch((error) => {
        setAuthError(error?.message || 'Magic link sign-in failed.');
      })
      .finally(() => setAuthBusy(false));
  }, []);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      setRealData({ events: [], alerts: [], consent: [] });
      return;
    }

    const key = `${LOCAL_KEY_PREFIX}${user.uid}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setRealData({
        events: [],
        alerts: [],
        consent: [
          {
            orgId: 'device_emitter',
            scope: 'device_trust_assessment',
            status: 'GRANTED',
            updatedAt: new Date().toISOString(),
          },
        ],
      });
      return;
    }

    try {
      setRealData(JSON.parse(stored));
    } catch {
      setRealData({ events: [], alerts: [], consent: [] });
    }
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    window.localStorage.setItem(`${LOCAL_KEY_PREFIX}${user.uid}`, JSON.stringify(realData));
  }, [realData, user]);

  async function sendMagicLink() {
    setAuthBusy(true);
    setAuthError('');
    try {
      const target = `${window.location.origin}/apps/stea/orbit-grapheneos/poc`;
      await sendSignInLinkToEmail(auth, email, {
        url: target,
        handleCodeInApp: true,
      });
      window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
      setModalOpen(false);
    } catch (error) {
      setAuthError(error?.message || 'Unable to send sign-in link.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await signOut(auth).catch(() => undefined);
  }

  function dismissBanner() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(DEMO_BANNER_KEY, '1');
    }
    setBannerVisible(false);
  }

  function seedDemoData() {
    if (tier === 'public') {
      setDemoData(DEMO_BASE);
      return;
    }

    const payload = { ...DEMO_SIGNALS };
    const trustRating = computeTrustRating(payload);
    const seededBase = {
      id: `seed-${Date.now()}`,
      eventType: 'DEVICE_SIGNAL_REPORTED',
      orgId: 'device_emitter',
      userId: user?.uid || 'seeded_user',
      scopes: Object.keys(payload),
      purpose: 'device_trust_assessment',
      timestamp: new Date().toISOString(),
      previousHash: 'GENESIS',
      blockIndex: 1,
      trustRating,
      payload,
    };
    const eventHash = pseudoHash(seededBase);
    const seededEvent = {
      ...seededBase,
      eventHash,
      signature: pseudoHash(`sig-${eventHash}-${user?.uid || 'seed'}`),
    };

    setRealData({
      events: [seededEvent],
      alerts: deriveAlerts(trustRating, payload).map((alert) => ({
        ...alert,
        id: `${seededEvent.id}-${alert.alertType}`,
        orgId: 'device_emitter',
        eventId: seededEvent.id,
        createdAt: seededEvent.timestamp,
      })),
      consent: [
        {
          orgId: 'device_emitter',
          scope: 'device_trust_assessment',
          status: 'GRANTED',
          updatedAt: seededEvent.timestamp,
        },
      ],
    });
  }

  function resetSandbox() {
    if (tier === 'public') {
      setDemoData(DEMO_BASE);
    } else {
      setRealData({
        events: [],
        alerts: [],
        consent: [
          {
            orgId: 'device_emitter',
            scope: 'device_trust_assessment',
            status: 'GRANTED',
            updatedAt: new Date().toISOString(),
          },
        ],
      });
    }
  }

  function mutateSignals() {
    const options = [
      { adb_enabled: '0', developer_options_enabled: '0', security_patch_level: '2026-02-01', verified_boot_state: 'verified' },
      { adb_enabled: '1', developer_options_enabled: '1', security_patch_level: '2025-03-01', verified_boot_state: 'verified' },
      { adb_enabled: '0', developer_options_enabled: '0', security_patch_level: '2025-08-01', verified_boot_state: 'self_signed' },
    ];

    const pick = options[Math.floor(Math.random() * options.length)];
    return { ...DEMO_SIGNALS, ...pick };
  }

  function postRealEvent() {
    if (!user) {
      setModalOpen(true);
      return;
    }

    const payload = mutateSignals();
    const trustRating = computeTrustRating(payload);
    const lastEvent = realData.events[realData.events.length - 1];
    const previousHash = lastEvent?.eventHash || 'GENESIS';

    const baseEvent = {
      id: `ev-${Date.now()}`,
      eventType: 'DEVICE_SIGNAL_REPORTED',
      orgId: 'device_emitter',
      userId: user.uid,
      scopes: Object.keys(payload),
      purpose: 'device_trust_assessment',
      timestamp: new Date().toISOString(),
      previousHash,
      blockIndex: (lastEvent?.blockIndex || 0) + 1,
      trustRating,
      payload,
    };

    const eventHash = pseudoHash(baseEvent);
    const event = {
      ...baseEvent,
      eventHash,
      signature: pseudoHash(`sig-${eventHash}-${user.uid}`),
    };

    const derived = deriveAlerts(trustRating, payload).map((alert) => ({
      ...alert,
      id: `${event.id}-${alert.alertType}`,
      orgId: 'device_emitter',
      eventId: event.id,
      createdAt: new Date().toISOString(),
    }));

    setRealData((prev) => ({
      ...prev,
      events: [...prev.events, event],
      alerts: [...derived, ...prev.alerts],
    }));
  }

  function downloadAuditBundle() {
    const isDemo = tier === 'public';
    const payload = {
      watermark: isDemo ? 'DEMO DATASET - NOT LIVE DEVICE EVENTS' : undefined,
      tier,
      generatedAt: new Date().toISOString(),
      userId: user?.uid || 'demo_public',
      orgs: scopedData.orgs,
      events: scopedData.events,
      alerts: scopedData.alerts,
      consent: scopedData.consent,
      integrity: {
        allEventsSigned: scopedData.events.every((event) => Boolean(event.signature)),
        hashChainIntact: summaryIntegrity(scopedData.events),
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-device-trust-${isDemo ? 'demo' : 'real'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sandbox', label: 'Org Sandbox' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'consent', label: 'Consent' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'regulator', label: 'Regulator View' },
  ];

  return (
    <main style={{ minHeight: '100vh', background: COLORS.obsidian, color: COLORS.textPrimary }}>
      <style>{`
        * { box-sizing: border-box; }
        .og-wrap { max-width: 1120px; margin: 0 auto; padding: 0 20px; }
        .og-card { background: ${COLORS.graphite}; border: 1px solid ${COLORS.border}; border-radius: 10px; }
        .og-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .og-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        @media (max-width: 960px) {
          .og-grid-3, .og-grid-2 { grid-template-columns: 1fr; }
          .og-nav { overflow: auto; white-space: nowrap; }
        }
      `}</style>

      <header style={{ background: COLORS.navyDeep, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="og-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 70, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/apps/stea/orbit" style={{ color: COLORS.textSecondary, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>← Back to Orbit</Link>
            <div style={{ width: 1, height: 20, background: COLORS.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${COLORS.teal}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.teal }} />
              </span>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>ORBIT</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 11 }}>Device Trust POC v2 · GrapheneOS</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textSecondary, padding: '5px 8px', borderRadius: 4, fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
              {tier === 'public' ? 'PUBLIC / DEMO' : 'AUTHENTICATED'}
            </span>
            {!authReady ? (
              <button className="og-card" style={{ padding: '8px 14px', background: COLORS.slate, color: COLORS.textSecondary, borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Checking auth...</button>
            ) : user ? (
              <>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: COLORS.textSecondary }}>{user.email}</span>
                <button onClick={handleSignOut} style={{ border: `1px solid ${COLORS.teal}`, color: COLORS.teal, background: 'transparent', borderRadius: 6, padding: '8px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Sign Out</button>
              </>
            ) : (
              <button onClick={() => setModalOpen(true)} style={{ border: 'none', color: COLORS.obsidian, background: COLORS.teal, borderRadius: 6, padding: '8px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700 }}>Sign In</button>
            )}
          </div>
        </div>
      </header>

      {tier === 'public' && bannerVisible && (
        <div style={{ background: COLORS.tealFaint, borderBottom: `1px solid ${COLORS.tealDim}` }}>
          <div className="og-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 20px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.teal, fontSize: 13 }}>
              You are viewing demo data. Sign in to post real device events.
            </div>
            <button onClick={dismissBanner} style={{ border: `1px solid ${COLORS.tealDim}`, background: 'transparent', color: COLORS.teal, borderRadius: 4, padding: '4px 10px', fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <nav className="og-nav" style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.graphite }}>
        <div className="og-wrap" style={{ display: 'flex' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${COLORS.teal}` : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? COLORS.teal : COLORS.textSecondary,
                padding: '13px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <section className="og-wrap" style={{ paddingTop: 24, paddingBottom: 40 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="og-grid-3">
              <div className="og-card" style={{ padding: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.textSecondary }}>Total Events</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 30, marginTop: 6 }}>{scopedData.events.length}</div>
              </div>
              <div className="og-card" style={{ padding: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.textSecondary }}>Active Alerts</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 30, marginTop: 6, color: scopedData.alerts.length ? COLORS.low : COLORS.high }}>{scopedData.alerts.length}</div>
              </div>
              <div className="og-card" style={{ padding: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.textSecondary }}>Hash Chain</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 30, marginTop: 6, color: summaryIntegrity(scopedData.events) ? COLORS.high : COLORS.low }}>
                  {summaryIntegrity(scopedData.events) ? 'INTACT' : 'BROKEN'}
                </div>
              </div>
            </div>

            <div className="og-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: COLORS.teal }}>TWO-TIER ACCESS MODEL</div>
                  <div style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 14 }}>
                    Public tier is stateless and demo-only. Authenticated tier uses Firebase Email Link and enables real event posting.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={seedDemoData} style={{ border: `1px solid ${COLORS.teal}`, color: COLORS.teal, background: 'transparent', borderRadius: 6, padding: '8px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                    {tier === 'public' ? 'Seed Demo Data' : 'Seed My Data'}
                  </button>
                  <button onClick={resetSandbox} style={{ border: `1px solid ${COLORS.low}`, color: COLORS.low, background: 'transparent', borderRadius: 6, padding: '8px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Reset Sandbox</button>
                </div>
              </div>
            </div>

            <div className="og-grid-3">
              {scopedData.orgs.map((org) => (
                <div key={org.orgId} className="og-card" style={{ padding: 16 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700 }}>{org.displayName}</div>
                  <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.textSecondary }}>{org.orgId}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="og-card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20 }}>Org Sandbox</div>
            <div style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 14 }}>
              Post Real Event is gated behind authentication per spec. Public users can still run demo read flows.
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={postRealEvent} style={{ background: COLORS.teal, color: COLORS.obsidian, border: 'none', borderRadius: 6, padding: '9px 14px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13 }}>
                Post Real Event
              </button>
              <button style={{ background: 'transparent', color: COLORS.teal, border: `1px solid ${COLORS.teal}`, borderRadius: 6, padding: '9px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                Request External Verification
              </button>
              <button onClick={downloadAuditBundle} style={{ background: COLORS.slate, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                Download Audit Proof Bundle
              </button>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="og-card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Event Timeline</div>
            {scopedData.events.length === 0 ? (
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 14 }}>No events yet. Run an assessment from Org Sandbox.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {scopedData.events.map((event) => (
                  <div key={event.id} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>{event.eventType}</span>
                        <TrustBadge level={event.trustRating || 'UNKNOWN'} />
                      </div>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.textDim, fontSize: 12 }}>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="og-grid-2" style={{ marginTop: 10 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", color: COLORS.textSecondary, fontSize: 11 }}>prev: {shortHash(event.previousHash)}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", color: COLORS.textSecondary, fontSize: 11 }}>hash: {shortHash(event.eventHash)}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", color: COLORS.teal, fontSize: 11 }}>sig: {shortHash(event.signature)}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", color: COLORS.textSecondary, fontSize: 11 }}>block: #{event.blockIndex}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consent' && (
          <div className="og-card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Consent State</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {scopedData.consent.map((item, index) => (
                <div key={`${item.orgId}-${index}`} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{item.orgId}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", color: COLORS.textSecondary, fontSize: 11, marginTop: 4 }}>{item.scope}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: item.status === 'GRANTED' ? COLORS.high : COLORS.low }}>{item.status}</span>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.textDim, fontSize: 11, marginTop: 4 }}>{new Date(item.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="og-card" style={{ padding: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 14 }}>Policy Alerts</div>
            {scopedData.alerts.length === 0 ? (
              <div style={{ fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 14 }}>No alerts. Device posture currently stable.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {scopedData.alerts.map((alert) => (
                  <div key={alert.id || `${alert.alertType}-${alert.createdAt}`} style={{ border: `1px solid #4A1010`, background: COLORS.lowBg, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: COLORS.low }}>{alert.alertType}</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: COLORS.textDim }}>{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Recently'}</span>
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textSecondary }}>{alert.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'regulator' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="og-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 20 }}>Regulator View</div>
                <div style={{ marginTop: 6, fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 14 }}>
                  {tier === 'public' ? 'Demo export includes DEMO watermark.' : 'Authenticated export includes your real event history.'}
                </div>
              </div>
              <button onClick={downloadAuditBundle} style={{ background: COLORS.slate, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                Download Audit Proof Bundle
              </button>
            </div>
            <div className="og-grid-2">
              <div className="og-card" style={{ padding: 16 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Integrity Checks</div>
                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  <div style={{ color: scopedData.events.every((e) => e.signature) ? COLORS.high : COLORS.low, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                    {scopedData.events.every((e) => e.signature) ? '✓' : '⚠'} All events cryptographically signed (HMAC-SHA256)
                  </div>
                  <div style={{ color: summaryIntegrity(scopedData.events) ? COLORS.high : COLORS.low, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                    {summaryIntegrity(scopedData.events) ? '✓' : '⚠'} Hash chain integrity {summaryIntegrity(scopedData.events) ? 'verified' : 'failed'}
                  </div>
                </div>
              </div>
              <div className="og-card" style={{ padding: 16 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Trust Summary</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'].map((level) => (
                    <div key={level} style={{ minWidth: 120, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10, background: COLORS.slate }}>
                      <TrustBadge level={level} />
                      <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 16 }}>
                        {scopedData.events.filter((e) => (e.trustRating || 'UNKNOWN') === level).length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 16 }}>
          <div className="og-card" style={{ width: '100%', maxWidth: 440, padding: 18 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700 }}>Sign in with Magic Link</div>
            <p style={{ marginTop: 8, fontFamily: "'DM Sans', sans-serif", color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6 }}>
              Email is used for authentication only. Orbit payloads keep a device UUID and hashed fingerprint only.
            </p>
            <label style={{ display: 'block', marginTop: 14, fontFamily: "'Space Mono', monospace", color: COLORS.textSecondary, fontSize: 11 }}>Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="name@company.com"
              style={{ width: '100%', marginTop: 6, background: COLORS.slate, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
            />
            {authError && <div style={{ marginTop: 10, color: COLORS.low, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>{authError}</div>}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModalOpen(false)} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textSecondary, borderRadius: 6, padding: '8px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Cancel</button>
              <button onClick={sendMagicLink} disabled={authBusy || !email} style={{ border: 'none', opacity: authBusy || !email ? 0.6 : 1, background: COLORS.teal, color: COLORS.obsidian, borderRadius: 6, padding: '8px 12px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700 }}>
                {authBusy ? 'Sending...' : 'Send Sign-In Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
