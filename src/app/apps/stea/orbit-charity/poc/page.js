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
  obsidian: '#F5F3F0',
  graphite: '#FFFFFF',
  slate: '#F0EDE8',
  border: '#DDD8D0',
  textPrimary: '#1A1814',
  textSecondary: '#5C5650',
  textDim: '#9C9690',
  navyDeep: '#FFFFFF',
  teal: '#3D7A5C',
  tealFaint: '#EAF4EF',
  tealDim: '#6BAE8A',
  blue: '#005EB8',
  blueDark: '#003087',
  high: '#006747',
  highBg: '#E8F5EF',
  medium: '#B06000',
  mediumBg: '#FEF6E8',
  low: '#AE1C28',
  lowBg: '#FBEAEA',
  critical: '#7B1A6B',
  criticalBg: '#F7EAF5',
  criticalBorder: '#D4A8CC',
};

const DEMO_BANNER_KEY = 'orbit_charity_demo_banner_hidden';
const MAGIC_LINK_EMAIL_KEY = 'orbit_charity_magic_email';
const LOCAL_KEY_PREFIX = 'orbit_charity_real_';
const TARGET_OII = 'oii_mc_demo_001';

const ORGS = [
  { orgId: 'charity_crm', displayName: 'Hartwell Cancer Support (Demo) - CRM', domain: 'donor' },
  { orgId: 'case_mgmt', displayName: 'Hartwell Cancer Support (Demo) - Services', domain: 'service_user' },
  { orgId: 'volunteer_mgmt', displayName: 'Hartwell Cancer Support (Demo) - Volunteering', domain: 'volunteer' },
  { orgId: 'nhs_trust', displayName: 'Midlands NHS Trust (Demo)', domain: 'nhs' },
  { orgId: 'mailing_house', displayName: 'DirectReach Agency (Demo)', domain: 'donor' },
  { orgId: 'gift_aid_processor', displayName: 'ClaimSmart Ltd (Demo)', domain: 'donor' },
  { orgId: 'wealth_screener', displayName: 'ProspectIQ (Demo)', domain: 'donor' },
  { orgId: 'dbs_service', displayName: 'DBS Checking Service (Demo)', domain: 'volunteer' },
];

const DOMAIN_COLORS = {
  donor: { bg: '#E8F1FB', color: '#005EB8', border: '#B8D4F0' },
  service_user: { bg: '#EAF4EF', color: '#2A5740', border: '#B3DCC8' },
  volunteer: { bg: '#FEF6E8', color: '#6B4F00', border: '#F5CC88' },
  nhs: { bg: '#F7EAF5', color: '#7B1A6B', border: '#D4A8CC' },
  mixed: { bg: '#F0EDE8', color: '#5C5650', border: '#DDD8D0' },
};

const ALERT_STYLES = {
  LOW: { bg: COLORS.highBg, color: COLORS.high, border: '#B3DCC8' },
  MEDIUM: { bg: COLORS.mediumBg, color: COLORS.medium, border: '#F5CC88' },
  HIGH: { bg: COLORS.lowBg, color: COLORS.low, border: '#E8A8A8' },
  CRITICAL: { bg: COLORS.criticalBg, color: COLORS.critical, border: COLORS.criticalBorder },
};

const MARGARET_PROFILE = {
  oii: TARGET_OII,
  roles: [
    { role: 'Service User', system: 'Case Management', roleId: 'SU_mc001', status: 'Active - post-treatment support', since: 'Jan 2023' },
    { role: 'Donor', system: 'Fundraising CRM', roleId: 'DN_mc001', status: 'Active - monthly donor GBP25/month', since: 'Mar 2021' },
    { role: 'Volunteer', system: 'Volunteer Management', roleId: 'VL_mc001', status: 'Active - Tuesday facilitator', since: 'Sep 2023' },
    { role: 'NHS Referral', system: 'Midlands NHS Trust', roleId: 'NHS_mc001', status: 'Closed - referral completed', since: 'Jan 2023' },
  ],
};

function pseudoHash(input) {
  const text = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash << 5) - hash + text.charCodeAt(i);
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex}${hex}${hex}${hex}`;
}

function shortHash(value) {
  if (!value) return 'GENESIS';
  const text = String(value);
  if (text.length < 16) return text;
  return `${text.slice(0, 7)}...${text.slice(-7)}`;
}

function makeSeedEvents() {
  const raw = [
    [1, 'CONSENT_GRANTED', 'donor', 'charity_crm', 'contact_details,giving_history,communication_preferences', 'donor_relationship_management', null],
    [2, 'CONSENT_GRANTED', 'donor', 'charity_crm', 'gift_aid_declaration', 'gift_aid_claim_processing', null],
    [3, 'DATA_SHARED', 'donor', 'gift_aid_processor', 'contact_details,gift_aid_declaration', 'hmrc_gift_aid_submission', null],
    [4, 'DATA_RECEIVED', 'nhs', 'nhs_trust', 'nhs_pathway_data,referral_source', 'cancer_support_referral', null],
    [5, 'CONSENT_GRANTED', 'service_user', 'case_mgmt', 'diagnosis_type,treatment_stage,service_engagement,support_needs', 'support_service_delivery', null],
    [6, 'DATA_USED', 'service_user', 'case_mgmt', 'diagnosis_type,service_engagement', 'service_outcome_reporting', null],
    [7, 'CONSENT_GRANTED', 'volunteer', 'volunteer_mgmt', 'volunteer_contact,role_history,availability,training_records', 'volunteer_coordination', null],
    [8, 'DATA_SHARED', 'volunteer', 'dbs_service', 'volunteer_contact,dbs_status', 'statutory_dbs_check', null],
    [9, 'CONSENT_GRANTED', 'donor', 'charity_crm', 'contact_details,giving_segment,campaign_history', 'direct_mail_appeal', null],
    [10, 'DATA_SHARED', 'donor', 'mailing_house', 'contact_details,giving_segment,campaign_history', 'q4_christmas_appeal', null],
    [11, 'CONSENT_REVOKED', 'donor', 'charity_crm', 'communication_preferences', 'donor_opt_out_email', null],
    [12, 'DATA_USED', 'donor', 'charity_crm', 'contact_details,communication_preferences', 'fundraising_email_campaign', { type: 'GDPR_VIOLATION', severity: 'HIGH', message: 'Fundraising email sent after consent revocation.' }],
    [13, 'DATA_SHARED', 'donor', 'wealth_screener', 'contact_details,wealth_screening_data', 'major_donor_prospecting', { type: 'NO_CONSENT', severity: 'HIGH', message: 'Wealth screening shared without explicit consent.' }],
    [14, 'CROSS_DOMAIN_ACCESS_ATTEMPT', 'mixed', 'charity_crm', 'diagnosis_type,service_engagement', 'appeal_personalisation', { type: 'CROSS_DOMAIN_VIOLATION', severity: 'CRITICAL', message: 'Service user data accessed by donor domain.' }],
    [15, 'DATA_SHARED', 'mixed', 'charity_crm', 'nhs_pathway_data', 'grateful_patient_fundraising', { type: 'GRATEFUL_PATIENT_VIOLATION', severity: 'CRITICAL', message: 'NHS pathway data shared into donor context.' }],
    [16, 'VERIFICATION_REQUESTED', 'mixed', 'charity_crm', 'all_domains', 'internal_audit_preparation', null],
    [17, 'CONSENT_GRANTED', 'donor', 'charity_crm', 'wealth_screening_data', 'retrospective_consent_attempt', { type: 'WARN_CONSENT_SEQUENCE', severity: 'MEDIUM', message: 'Consent recorded after prior sharing.' }],
  ];

  const baseTime = new Date('2026-03-11T09:00:00.000Z').getTime();
  let previousHash = 'GENESIS';

  return raw.map((item, idx) => {
    const [blockIndex, eventType, domain, orgId, scopesRaw, purpose, alert] = item;
    const event = {
      id: `seed-${blockIndex}`,
      blockIndex,
      oii: TARGET_OII,
      roleIds: ['SU_mc001', 'DN_mc001', 'VL_mc001', 'NHS_mc001'],
      eventType,
      domain,
      orgId,
      scopes: scopesRaw.split(','),
      purpose,
      timestamp: new Date(baseTime + idx * 3600 * 1000).toISOString(),
      previousHash,
    };
    event.eventHash = pseudoHash(event);
    event.signature = pseudoHash(`sig-${event.eventHash}`);
    previousHash = event.eventHash;
    if (alert) event.alert = alert;
    return event;
  });
}

const SEEDED_EVENTS = makeSeedEvents();

function deriveSeededAlerts(events) {
  return events
    .filter((event) => event.alert)
    .map((event) => ({
      id: `alert-${event.blockIndex}`,
      blockIndex: event.blockIndex,
      alertType: event.alert.type,
      severity: event.alert.severity,
      message: event.alert.message,
      orgId: event.orgId,
      domain: event.domain,
      oii: event.oii,
      createdAt: event.timestamp,
    }));
}

const SEEDED_ALERTS = deriveSeededAlerts(SEEDED_EVENTS);

const SEEDED_CONSENT = [
  { domain: 'donor', scope: 'contact_details', status: 'GRANTED', updatedAt: SEEDED_EVENTS[0].timestamp },
  { domain: 'donor', scope: 'communication_preferences', status: 'REVOKED', updatedAt: SEEDED_EVENTS[10].timestamp },
  { domain: 'service_user', scope: 'diagnosis_type', status: 'GRANTED', updatedAt: SEEDED_EVENTS[4].timestamp },
  { domain: 'volunteer', scope: 'volunteer_contact', status: 'GRANTED', updatedAt: SEEDED_EVENTS[6].timestamp },
  { domain: 'donor', scope: 'wealth_screening_data', status: 'GRANTED', updatedAt: SEEDED_EVENTS[16].timestamp },
];

const SEED_STATE = {
  orgs: ORGS,
  events: SEEDED_EVENTS,
  alerts: SEEDED_ALERTS,
  consent: SEEDED_CONSENT,
  dsa: {
    reference: 'NHS-DSA-HCS-2026-019',
    expiresAt: '2026-12-31',
  },
};

function cloneSeedState() {
  return {
    orgs: SEED_STATE.orgs.map((org) => ({ ...org })),
    events: SEED_STATE.events.map((event) => ({ ...event, scopes: [...event.scopes], roleIds: [...event.roleIds] })),
    alerts: SEED_STATE.alerts.map((alert) => ({ ...alert })),
    consent: SEED_STATE.consent.map((consent) => ({ ...consent })),
    dsa: { ...SEED_STATE.dsa },
  };
}

function domainStyle(domain) {
  return DOMAIN_COLORS[domain] || DOMAIN_COLORS.mixed;
}

function severityStyle(severity) {
  return ALERT_STYLES[severity] || ALERT_STYLES.HIGH;
}

function chainIntact(events) {
  if (events.length < 2) return true;
  for (let i = 1; i < events.length; i += 1) {
    if (events[i].previousHash !== events[i - 1].eventHash) return false;
  }
  return true;
}

function wallStatus(events) {
  const hasServiceToDonor = events.some((event) => event.blockIndex === 14 || event.alert?.type === 'CROSS_DOMAIN_VIOLATION');
  const hasNhsToDonor = events.some((event) => event.blockIndex === 15 || event.alert?.type === 'GRATEFUL_PATIENT_VIOLATION');
  return [
    { pair: 'Service User -> Donor', state: hasServiceToDonor ? 'BREACH DETECTED' : 'WALL INTACT' },
    { pair: 'NHS Referral -> Donor', state: hasNhsToDonor ? 'BREACH DETECTED' : 'WALL INTACT' },
    { pair: 'Service User -> Volunteer', state: 'WALL INTACT' },
    { pair: 'NHS Referral -> Volunteer', state: 'WALL INTACT' },
  ];
}

export default function OrbitCharityPocPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authErrorCode, setAuthErrorCode] = useState('');
  const [email, setEmail] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [searchOii, setSearchOii] = useState(TARGET_OII);
  const [demoState, setDemoState] = useState(SEED_STATE);
  const [realState, setRealState] = useState({ orgs: ORGS, events: [], alerts: [], consent: [], dsa: SEED_STATE.dsa });
  const [notice, setNotice] = useState(null);

  const tier = user ? 'authenticated' : 'public';

  const scoped = useMemo(() => (tier === 'authenticated' ? realState : demoState), [tier, demoState, realState]);
  const filteredTimeline = useMemo(() => scoped.events.filter((event) => event.oii === searchOii.trim()), [scoped.events, searchOii]);
  const nhsBoundaryEvents = useMemo(() => scoped.events.filter((event) => event.scopes.includes('nhs_pathway_data') || event.domain === 'nhs' || event.blockIndex === 15), [scoped.events]);
  const criticalAlerts = useMemo(() => scoped.alerts.filter((alert) => alert.severity === 'CRITICAL'), [scoped.alerts]);
  const roleCollisionRiskScore = useMemo(() => {
    const oiis = new Set(scoped.events.map((event) => event.oii));
    const multiRoleIndividuals = scoped.events.some((event) => event.roleIds?.length > 1) ? 1 : 0;
    if (oiis.size === 0) return 0;
    return Math.round((multiRoleIndividuals / oiis.size) * 100);
  }, [scoped.events]);

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
        // Keep POC usable without server cookie sync.
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const cachedEmail = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
    const emailForLink = cachedEmail || window.prompt('Confirm your sign-in email');
    if (!emailForLink) return;

    setAuthBusy(true);
    signInWithEmailLink(auth, emailForLink, window.location.href)
      .then(() => {
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        window.history.replaceState({}, document.title, '/apps/stea/orbit-charity/poc');
      })
      .catch((error) => setAuthError(error?.message || 'Magic link sign-in failed.'))
      .finally(() => setAuthBusy(false));
  }, []);

  useEffect(() => {
    if (!user || typeof window === 'undefined') {
      setRealState({ orgs: ORGS, events: [], alerts: [], consent: [], dsa: SEED_STATE.dsa });
      return;
    }

    const stored = window.localStorage.getItem(`${LOCAL_KEY_PREFIX}${user.uid}`);
    if (!stored) {
      setRealState({ orgs: ORGS, events: [], alerts: [], consent: [], dsa: SEED_STATE.dsa });
      return;
    }

    try {
      setRealState(JSON.parse(stored));
    } catch {
      setRealState({ orgs: ORGS, events: [], alerts: [], consent: [], dsa: SEED_STATE.dsa });
    }
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    window.localStorage.setItem(`${LOCAL_KEY_PREFIX}${user.uid}`, JSON.stringify(realState));
  }, [user, realState]);

  function dismissBanner() {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(DEMO_BANNER_KEY, '1');
    setBannerVisible(false);
  }

  function showNotice(message, type = 'success') {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3200);
  }

  function seedDemo() {
    if (tier === 'public') {
      setDemoState(cloneSeedState());
      showNotice('Demo data initialised.');
      return;
    }
    setRealState(cloneSeedState());
    showNotice('Your data has been initialised.');
  }

  function resetSandbox() {
    if (tier === 'public') {
      setDemoState(cloneSeedState());
    } else {
      setRealState({ orgs: ORGS, events: [], alerts: [], consent: [], dsa: SEED_STATE.dsa });
    }
  }

  async function sendMagicLink() {
    setAuthBusy(true);
    setAuthError('');
    setAuthErrorCode('');
    try {
      const target = `${window.location.origin}/apps/stea/orbit-charity/poc`;
      await sendSignInLinkToEmail(auth, email, { url: target, handleCodeInApp: true });
      window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
      setModalOpen(false);
    } catch (error) {
      const code = error?.code || '';
      setAuthErrorCode(code);
      if (code === 'auth/operation-not-allowed') {
        setAuthError('Magic link sign-in is not enabled in the Firebase project for this environment.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Enter a valid email address.');
      } else if (code === 'auth/unauthorized-continue-uri') {
        setAuthError('This domain is not authorised for Firebase email-link sign-in.');
      } else {
        setAuthError(error?.message || 'Unable to send sign-in link.');
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await signOut(auth).catch(() => undefined);
  }

  function postDemoAuditEvent() {
    if (!user) {
      setModalOpen(true);
      return;
    }

    const prev = realState.events[realState.events.length - 1];
    const blockIndex = (prev?.blockIndex || 0) + 1;
    const event = {
      id: `real-${Date.now()}`,
      blockIndex,
      oii: TARGET_OII,
      roleIds: ['SU_mc001', 'DN_mc001', 'VL_mc001', 'NHS_mc001'],
      eventType: 'VERIFICATION_REQUESTED',
      domain: 'mixed',
      orgId: 'charity_crm',
      scopes: ['all_domains'],
      purpose: 'internal_audit_preparation',
      timestamp: new Date().toISOString(),
      previousHash: prev?.eventHash || 'GENESIS',
    };
    event.eventHash = pseudoHash(event);
    event.signature = pseudoHash(`sig-${event.eventHash}-${user.uid}`);

    setRealState((current) => ({ ...current, events: [...current.events, event] }));
  }

  function downloadEvidencePack() {
    const walls = wallStatus(scoped.events);
    const payload = {
      watermark: tier === 'public' ? 'DEMO DATASET - ICO WALKTHROUGH ONLY' : undefined,
      generatedAt: new Date().toISOString(),
      tier,
      oii: TARGET_OII,
      cover: {
        title: 'Orbit Charity ICO Evidence Pack',
        organisation: 'Hartwell Cancer Support (Demo)',
        dsaReference: scoped.dsa.reference,
        dsaExpiry: scoped.dsa.expiresAt,
      },
      criticalAlertSummary: criticalAlerts,
      domainWallBreachLog: walls.filter((item) => item.state === 'BREACH DETECTED'),
      events: scoped.events,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-charity-ico-evidence-${tier}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sandbox', label: 'Org Sandbox' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'individual', label: 'Individual Timeline' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'ico', label: 'ICO Audit View' },
  ];

  const walls = wallStatus(scoped.events);

  return (
    <main style={{ minHeight: '100vh', background: COLORS.obsidian, color: COLORS.textPrimary }}>
      <style>{`
        * { box-sizing: border-box; }
        .oc-wrap { max-width: 1140px; margin: 0 auto; padding: 0 20px; }
        .oc-card { background: ${COLORS.graphite}; border: 1px solid ${COLORS.border}; border-radius: 10px; }
        .oc-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .oc-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .oc-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
        @media (max-width: 960px) {
          .oc-grid-2, .oc-grid-3, .oc-grid-4 { grid-template-columns: 1fr; }
          .oc-nav { overflow: auto; white-space: nowrap; }
        }
      `}</style>

      <header style={{ background: COLORS.navyDeep, borderBottom: `3px solid ${COLORS.blue}` }}>
        <div className="oc-wrap" style={{ minHeight: 72, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/apps/stea/orbit" style={{ color: COLORS.textSecondary, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>← Back to Orbit</Link>
            <div style={{ width: 1, height: 20, background: COLORS.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${COLORS.teal}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.teal }} />
              </span>
              <div>
                <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 13, fontWeight: 700 }}>ORBIT</div>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: COLORS.textSecondary }}>Charity Sector POC v2.0</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textSecondary, padding: '5px 8px', borderRadius: 4, fontFamily: "'Source Code Pro', monospace", fontSize: 10 }}>
              {tier === 'public' ? 'PUBLIC / DEMO' : 'AUTHENTICATED'}
            </span>
            {!authReady ? (
              <button className="oc-card" style={{ padding: '8px 12px', borderRadius: 6, fontSize: 13, color: COLORS.textSecondary }}>Checking auth...</button>
            ) : user ? (
              <>
                <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: COLORS.textSecondary }}>{user.email}</span>
                <button onClick={handleSignOut} style={{ border: `1px solid ${COLORS.teal}`, background: 'transparent', color: COLORS.teal, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>Sign Out</button>
              </>
            ) : (
              <button onClick={() => setModalOpen(true)} style={{ border: 'none', background: COLORS.blue, color: '#FFFFFF', borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, fontWeight: 700 }}>Sign In</button>
            )}
          </div>
        </div>
      </header>

      {tier === 'public' && bannerVisible && (
        <div style={{ background: COLORS.tealFaint, borderBottom: `1px solid ${COLORS.teal}` }}>
          <div className="oc-wrap" style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div style={{ fontFamily: "'Source Sans 3', sans-serif", color: COLORS.teal, fontSize: 13 }}>
              You are viewing demo data. Sign in to post real governance events.
            </div>
            <button onClick={dismissBanner} style={{ border: `1px solid ${COLORS.teal}`, background: 'transparent', color: COLORS.teal, borderRadius: 4, padding: '4px 10px', fontFamily: "'Source Code Pro', monospace", fontSize: 10 }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <nav className="oc-nav" style={{ background: COLORS.graphite, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="oc-wrap" style={{ display: 'flex' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab.id ? `2px solid ${COLORS.teal}` : '2px solid transparent',
                color: activeTab === tab.id ? COLORS.teal : COLORS.textSecondary,
                padding: '13px 16px',
                fontFamily: "'Source Sans 3', sans-serif",
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

      {notice && (
        <div className="oc-wrap" style={{ paddingTop: 12 }}>
          <div style={{
            border: `1px solid ${notice.type === 'error' ? '#E8A8A8' : '#B3DCC8'}`,
            background: notice.type === 'error' ? COLORS.lowBg : COLORS.highBg,
            color: notice.type === 'error' ? COLORS.low : COLORS.high,
            borderRadius: 8,
            padding: '10px 12px',
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: 13,
          }}>
            {notice.message}
          </div>
        </div>
      )}

      <section className="oc-wrap" style={{ paddingTop: 22, paddingBottom: 40 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="oc-card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 18 }}>What This Demonstrates</div>
              <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                Orbit Consent Ledger is a proof of concept addressing one of the most common and consequential data governance failures in the UK charity sector: the absence of a unified, auditable record of who consented to what, and what happened to their data after that consent was given - or withdrawn. Most charities hold data about the same individual across multiple disconnected systems - a fundraising CRM, a volunteer management platform, a case management system - each operating under different consent grounds, with no real-time view of whether active data sharing still aligns with current consent records. When the ICO comes knocking, the honest answer for most organisations is a spreadsheet, an email chain, and a hope. Orbit is built around the premise that it does not have to be.
              </div>
              <div style={{ marginTop: 10, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                The POC is designed for data protection officers, heads of information security, and senior charity leaders who carry personal accountability for GDPR compliance and are familiar with the ICO's enforcement history in the sector. It models a scenario that every cancer charity will recognise: a single individual - Margaret - who is simultaneously a donor, a volunteer, and a service user receiving clinical support, with an NHS referral in her pathway. Each role sits in a different database, under a different consent basis, with different permissible data flows. The POC demonstrates what happens when those boundaries are respected, what happens when they are violated, and what an immutable, tamper-evident audit trail of both looks like when you need to hand something credible to a regulator.
              </div>
              <div style={{ marginTop: 10, fontFamily: "'Source Code Pro', monospace", color: COLORS.teal, fontSize: 10, letterSpacing: '0.07em' }}>
                To explore: open Org Sandbox, seed data, then inspect Timeline, Alerts, Individual Timeline, and ICO Audit View.
              </div>
            </div>

            <div className="oc-grid-4">
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Code Pro', monospace", color: COLORS.textSecondary, fontSize: 10 }}>Orbit Individual ID</div>
                <div style={{ marginTop: 6, fontFamily: "'Source Code Pro', monospace", fontSize: 15 }}>{TARGET_OII}</div>
              </div>
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Code Pro', monospace", color: COLORS.textSecondary, fontSize: 10 }}>Seeded Events</div>
                <div style={{ marginTop: 6, fontFamily: "'Source Code Pro', monospace", fontSize: 24 }}>{scoped.events.length}</div>
              </div>
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Code Pro', monospace", color: COLORS.textSecondary, fontSize: 10 }}>Critical Alerts</div>
                <div style={{ marginTop: 6, fontFamily: "'Source Code Pro', monospace", fontSize: 24, color: criticalAlerts.length ? COLORS.critical : COLORS.high }}>{criticalAlerts.length}</div>
              </div>
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Code Pro', monospace", color: COLORS.textSecondary, fontSize: 10 }}>Hash Chain</div>
                <div style={{ marginTop: 6, fontFamily: "'Source Code Pro', monospace", fontSize: 20, color: chainIntact(scoped.events) ? COLORS.high : COLORS.low }}>
                  {chainIntact(scoped.events) ? 'INTACT' : 'BROKEN'}
                </div>
              </div>
            </div>

            <div className="oc-card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: COLORS.teal, letterSpacing: '0.08em' }}>MULTI-ROLE INDIVIDUAL MODEL</div>
              <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
                Margaret appears across donor, volunteer, service user, and NHS referral data domains. Orbit tracks role separation with a pseudonymous OII and flags cross-domain bleed as CRITICAL.
              </div>
            </div>

            <div className="oc-card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Domain Wall Status</div>
              <div className="oc-grid-2">
                {walls.map((wall) => (
                  <div key={wall.pair} style={{ border: `1px solid ${wall.state === 'BREACH DETECTED' ? COLORS.criticalBorder : COLORS.border}`, background: wall.state === 'BREACH DETECTED' ? COLORS.criticalBg : COLORS.slate, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, fontWeight: 600 }}>{wall.pair}</div>
                    <div style={{ marginTop: 6, fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: wall.state === 'BREACH DETECTED' ? COLORS.critical : COLORS.high }}>{wall.state}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="oc-card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Role Records (Margaret)</div>
              <div className="oc-grid-2">
                {MARGARET_PROFILE.roles.map((role) => (
                  <div key={role.roleId} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, borderRadius: 8, padding: 12 }}>
                    <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 14, fontWeight: 700 }}>{role.role}</div>
                    <div style={{ marginTop: 4, fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>{role.roleId}</div>
                    <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: COLORS.textSecondary }}>{role.status}</div>
                    <div style={{ marginTop: 4, fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: COLORS.textDim }}>Since {role.since}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="oc-card" style={{ padding: 16 }}>
            <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Timeline</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {scoped.events.map((event) => {
                const ds = domainStyle(event.domain);
                const critical = event.alert?.severity === 'CRITICAL';
                return (
                  <div key={event.id} style={{ border: `1px solid ${critical ? COLORS.criticalBorder : COLORS.border}`, background: critical ? COLORS.criticalBg : COLORS.slate, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>#{event.blockIndex}</span>
                        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11 }}>{event.eventType}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${ds.border}`, background: ds.bg, color: ds.color, fontFamily: "'Source Code Pro', monospace", fontSize: 10 }}>{event.domain}</span>
                        {critical && <span style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${COLORS.criticalBorder}`, background: COLORS.criticalBg, color: COLORS.critical, fontFamily: "'Source Code Pro', monospace", fontSize: 10 }}>CRITICAL</span>}
                      </div>
                      <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: COLORS.textDim }}>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary }}>
                      {event.orgId} · {event.purpose}
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>
                      scopes: {event.scopes.join(', ')}
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>
                      prev: {shortHash(event.previousHash)} · hash: {shortHash(event.eventHash)} · sig: {shortHash(event.signature)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'individual' && (
          <div className="oc-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 20, fontWeight: 700 }}>Individual Timeline</div>
                <div style={{ marginTop: 4, fontFamily: "'Source Sans 3', sans-serif", color: COLORS.textSecondary, fontSize: 13 }}>Search by Orbit Individual ID (OII) across all domains.</div>
              </div>
              <input
                value={searchOii}
                onChange={(event) => setSearchOii(event.target.value)}
                style={{ minWidth: 260, background: COLORS.slate, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textPrimary, padding: '9px 10px', fontFamily: "'Source Code Pro', monospace", fontSize: 12 }}
              />
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              {filteredTimeline.length === 0 ? (
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", color: COLORS.textSecondary, fontSize: 14 }}>No events found for this OII.</div>
              ) : (
                filteredTimeline.map((event) => {
                  const critical = event.blockIndex === 14 || event.blockIndex === 15;
                  const ds = domainStyle(event.domain);
                  return (
                    <div key={`ind-${event.id}`} style={{ border: `1px solid ${critical ? COLORS.criticalBorder : COLORS.border}`, background: critical ? COLORS.criticalBg : COLORS.slate, borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11 }}>Block #{event.blockIndex}</span>
                          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>{event.eventType}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${ds.border}`, background: ds.bg, color: ds.color, fontFamily: "'Source Code Pro', monospace", fontSize: 10 }}>{event.domain}</span>
                          {critical && <span style={{ padding: '2px 8px', borderRadius: 4, border: `1px solid ${COLORS.criticalBorder}`, background: COLORS.criticalBg, color: COLORS.critical, fontFamily: "'Source Code Pro', monospace", fontSize: 10 }}>CRITICAL</span>}
                        </div>
                        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: COLORS.textDim }}>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary }}>{event.purpose}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="oc-card" style={{ padding: 16 }}>
            <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Alerts</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {scoped.alerts.map((alert) => {
                const as = severityStyle(alert.severity);
                return (
                  <div key={alert.id} style={{ border: `1px solid ${as.border}`, background: as.bg, borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Source Code Pro', monospace", color: as.color, fontSize: 10 }}>{alert.severity}</span>
                        <span style={{ fontFamily: "'Source Code Pro', monospace", color: as.color, fontSize: 11 }}>{alert.alertType}</span>
                        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>Block #{alert.blockIndex}</span>
                      </div>
                      <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: COLORS.textDim }}>{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", color: COLORS.textSecondary, fontSize: 13 }}>{alert.message}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ico' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="oc-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 20, fontWeight: 700 }}>ICO Audit View</div>
                <div style={{ marginTop: 4, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary }}>Includes critical alert summary, NHS boundary log, and evidence pack export.</div>
              </div>
              <button onClick={downloadEvidencePack} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textPrimary, borderRadius: 6, padding: '9px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>Download ICO Evidence Pack</button>
            </div>

            <div className="oc-grid-3">
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600 }}>Role Collision Risk Score</div>
                <div style={{ marginTop: 8, fontFamily: "'Source Code Pro', monospace", fontSize: 30, color: roleCollisionRiskScore >= 50 ? COLORS.low : COLORS.high }}>{roleCollisionRiskScore}</div>
                <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: COLORS.textSecondary }}>Deterministic metric based on multi-role OIIs</div>
              </div>
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600 }}>Critical Alerts</div>
                <div style={{ marginTop: 8, fontFamily: "'Source Code Pro', monospace", fontSize: 30, color: COLORS.critical }}>{criticalAlerts.length}</div>
                <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: COLORS.textSecondary }}>CROSS_DOMAIN + GRATEFUL_PATIENT</div>
              </div>
              <div className="oc-card" style={{ padding: 14 }}>
                <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 600 }}>DSA Status</div>
                <div style={{ marginTop: 8, fontFamily: "'Source Code Pro', monospace", fontSize: 13 }}>{scoped.dsa.reference}</div>
                <div style={{ marginTop: 4, fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: COLORS.textSecondary }}>Expires {scoped.dsa.expiresAt}</div>
              </div>
            </div>

            <div className="oc-card" style={{ padding: 16 }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>NHS Data Boundary Panel</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {nhsBoundaryEvents.map((event) => {
                  const breached = event.blockIndex === 15;
                  return (
                    <div key={`nhs-${event.id}`} style={{ border: `1px solid ${breached ? COLORS.criticalBorder : COLORS.border}`, background: breached ? COLORS.criticalBg : COLORS.slate, borderRadius: 8, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11 }}>Block #{event.blockIndex}</span>
                          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: COLORS.textSecondary }}>{event.eventType}</span>
                          {breached && <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 10, color: COLORS.critical }}>NHS_DATA_BOUNDARY BREACH</span>}
                        </div>
                        <span style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 11, color: COLORS.textDim }}>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ marginTop: 7, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary }}>{event.purpose}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <div className="oc-card" style={{ padding: 16 }}>
            <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 20, fontWeight: 700 }}>Org Sandbox</div>
            <div style={{ marginTop: 6, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary }}>
              Public tier allows read-only walkthrough and evidence download. Authenticated tier allows posting new verification events.
            </div>
            <div style={{ marginTop: 12, border: `1px solid ${COLORS.border}`, background: COLORS.slate, borderRadius: 8, padding: 12 }}>
              <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 14, fontWeight: 600 }}>How To Run The Demo</div>
              <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
                1. Click {tier === 'public' ? '"Seed Demo Data"' : '"Seed My Data"'} to load Margaret's 17-block sequence.
                <br />
                2. Open Timeline and jump to Blocks #14 and #15 to see CRITICAL cross-domain events.
                <br />
                3. Open Alerts to review CROSS_DOMAIN_VIOLATION and GRATEFUL_PATIENT_VIOLATION.
                <br />
                4. Open ICO Audit View and download the evidence pack.
                <br />
                5. Return to Overview to see status updates following alerts.
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={seedDemo} style={{ border: `1px solid ${COLORS.teal}`, background: 'transparent', color: COLORS.teal, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>
                {tier === 'public' ? 'Seed Demo Data' : 'Seed My Data'}
              </button>
              <button onClick={resetSandbox} style={{ border: `1px solid ${COLORS.low}`, background: 'transparent', color: COLORS.low, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>Reset Sandbox</button>
              <button onClick={postDemoAuditEvent} style={{ border: 'none', background: COLORS.teal, color: COLORS.obsidian, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, fontWeight: 700 }}>Post Real Event</button>
              <button onClick={downloadEvidencePack} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textPrimary, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>Download ICO Evidence Pack</button>
            </div>
          </div>
        )}
      </section>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 16 }}>
          <div className="oc-card" style={{ width: '100%', maxWidth: 430, padding: 18 }}>
            <div style={{ fontFamily: "'Source Sans 3', sans-serif", fontSize: 20, fontWeight: 700 }}>Staff Sign-In (Magic Link)</div>
            <p style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
              This charity POC supports role-based staff access. Enter an email to receive a sign-in link.
            </p>
            <label style={{ display: 'block', marginTop: 12, fontFamily: "'Source Code Pro', monospace", color: COLORS.textSecondary, fontSize: 11 }}>Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="dpo@charity.org"
              style={{ width: '100%', marginTop: 6, border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textPrimary, borderRadius: 6, padding: '10px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 14 }}
            />
            {authError && <div style={{ marginTop: 8, fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: COLORS.low }}>{authError}</div>}
            {authErrorCode === 'auth/operation-not-allowed' && (
              <div style={{ marginTop: 8, border: `1px solid ${COLORS.border}`, background: COLORS.slate, borderRadius: 6, padding: '10px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                Firebase setup required:
                <br />
                1. Firebase Console -> Authentication -> Sign-in method.
                <br />
                2. Enable Email/Password and toggle Email link (passwordless).
                <br />
                3. Add `www.arcturusdc.com` to authorised domains.
              </div>
            )}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setModalOpen(false)} style={{ border: `1px solid ${COLORS.border}`, background: COLORS.slate, color: COLORS.textSecondary, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13 }}>Cancel</button>
              <button onClick={sendMagicLink} disabled={authBusy || !email} style={{ border: 'none', opacity: authBusy || !email ? 0.6 : 1, background: COLORS.teal, color: COLORS.obsidian, borderRadius: 6, padding: '8px 12px', fontFamily: "'Source Sans 3', sans-serif", fontSize: 13, fontWeight: 700 }}>{authBusy ? 'Sending...' : 'Send Sign-In Link'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
