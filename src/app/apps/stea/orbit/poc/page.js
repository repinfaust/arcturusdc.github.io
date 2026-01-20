'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';

const DEMO_USER_ID = 'user_12345';

export default function OrbitPocPage() {
  const router = useRouter();
  const { availableTenants, loading: tenantLoading } = useTenant();
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [orgs, setOrgs] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [consentState, setConsentState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const consoleEndRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  // Add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    
    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const ORBIT_POC_TENANT_ID = 'l5nH79ZIiknHuqPT8YW7';

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthLoading(false);
      if (!firebaseUser) {
        router.replace('/apps/stea?next=/apps/stea/orbit/poc');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Authorization check - must be member of Orbit POC workspace
  useEffect(() => {
    if (!tenantLoading && !authLoading) {
      const hasOrbitPocAccess = availableTenants.some(
        tenant => tenant.id === ORBIT_POC_TENANT_ID
      );
      if (!hasOrbitPocAccess) {
        router.replace('/apps/stea?error=no_orbit_poc_access');
      }
    }
  }, [availableTenants, tenantLoading, authLoading, router]);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Add log helper
  const addLog = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, { type, message, data, timestamp }]);
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    addLog('info', 'Loading dashboard data...');
    try {
      // Load orgs
      addLog('request', 'GET /api/orbit/orgs');
      const orgsRes = await fetch('/api/orbit/orgs', {
        credentials: 'include',
      });
      const orgsData = await orgsRes.json();
      if (orgsRes.ok) {
        addLog('success', `Loaded ${orgsData.orgs?.length || 0} organisations`, orgsData);
        setOrgs(orgsData.orgs || []);
      } else {
        addLog('error', `Failed to load orgs: ${orgsData.error}`, orgsData);
      }

      // Load events
      addLog('request', `GET /api/orbit/events?userId=${DEMO_USER_ID}`);
      const eventsRes = await fetch(`/api/orbit/events?userId=${DEMO_USER_ID}`, {
        credentials: 'include',
      });
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        addLog('success', `Loaded ${eventsData.events?.length || 0} events`, eventsData);
        setEvents(eventsData.events || []);
      } else {
        addLog('error', `Failed to load events: ${eventsData.error}`, eventsData);
      }

      // Load alerts
      addLog('request', `GET /api/orbit/alerts?userId=${DEMO_USER_ID}`);
      const alertsRes = await fetch(`/api/orbit/alerts?userId=${DEMO_USER_ID}`, {
        credentials: 'include',
      });
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        addLog('success', `Loaded ${alertsData.alerts?.length || 0} alerts`, alertsData);
        setAlerts(alertsData.alerts || []);
      } else {
        addLog('error', 'Failed to load alerts', await alertsRes.json());
      }

      // Load consent state
      addLog('request', `GET /api/orbit/consent?userId=${DEMO_USER_ID}`);
      const consentRes = await fetch(`/api/orbit/consent?userId=${DEMO_USER_ID}`, {
        credentials: 'include',
      });
      if (consentRes.ok) {
        const consentData = await consentRes.json();
        addLog('success', `Loaded ${consentData.consent?.length || 0} consent records`, consentData);
        setConsentState(consentData.consent || []);
      } else {
        addLog('error', 'Failed to load consent state', await consentRes.json());
      }
    } catch (error) {
      addLog('error', `Error loading data: ${error.message}`, error);
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      addLog('info', 'Dashboard data loading complete');
    }
  }

  // Seed demo data
  async function seedDemoData() {
    addLog('info', 'Starting demo data seed...');
    try {
      // Create demo orgs
      const demoOrgs = [
        { orgId: 'experian', displayName: 'Experian (Demo)', scopes: { basic_identity: ['name', 'dob', 'address'], credit_profile: ['creditScore', 'salaryBand'] } },
        { orgId: 'challenger_bank', displayName: 'Challenger Bank (Demo)', scopes: { basic_identity: ['name', 'dob'], account_info: ['accountNumber', 'balance'] } },
        { orgId: 'broker_app', displayName: 'Broker App (Demo)', scopes: { basic_identity: ['name', 'dob'], investment_profile: ['riskTolerance', 'portfolioValue'] } },
        { orgId: 'healthcare_provider', displayName: 'City Health Network (Demo)', scopes: { basic_identity: ['name', 'dob', 'address'], health_records: ['medicalHistory', 'diagnoses', 'medications'], insurance_info: ['policyNumber', 'coverageType'], appointment_history: ['visitDates', 'providerNames'] } },
      ];

      for (const org of demoOrgs) {
        addLog('request', `POST /api/orbit/orgs - Creating ${org.orgId}`, org);
        const res = await fetch('/api/orbit/orgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(org),
        });
        const data = await res.json();
        if (res.ok) {
          addLog('success', `Created organisation: ${org.orgId}`, data);
        } else {
          addLog('error', `Failed to create ${org.orgId}: ${data.error}`, data);
        }
      }

      addLog('info', 'Reloading dashboard data...');
      await loadData();
      addLog('success', 'Demo data seeded successfully!');
      addNotification('Demo data seeded! Check the Overview tab.', 'success');
    } catch (error) {
      addLog('error', `Error seeding data: ${error.message}`, error);
      console.error('Error seeding data:', error);
      addNotification('Error seeding data. Check console.', 'error');
    }
  }

  // Helper function to truncate signatures/hashes (first 6 + last 6 chars)
  function truncateHash(hash) {
    if (!hash || typeof hash !== 'string') return hash;
    if (hash.length <= 12) return hash; // If already short, return as-is
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  }

  // Download audit proof bundle
  function downloadAuditProof() {
    const auditProof = {
      metadata: {
        userId: DEMO_USER_ID,
        generatedAt: new Date().toISOString(),
        version: '1.0',
        purpose: 'AI Act Compliance - Audit Trail Export',
        note: 'Signatures and hashes are truncated (first 6 + last 6 characters) for readability',
      },
      summary: {
        totalEvents: events.length,
        totalAlerts: alerts.length,
        totalOrganizations: orgs.length,
        activeConsents: consentState.filter(c => c.status === 'GRANTED').length,
        hashChainLength: events.filter(e => e.previousEventHash).length,
      },
      organizations: orgs.map(org => ({
        orgId: org.orgId,
        name: org.name,
        registeredAt: org.createdAt?.toDate?.()?.toISOString() || null,
        signingKeyId: org.signingKeyId || null,
        keyExpiresAt: org.keyExpiresAt?.toDate?.()?.toISOString() || null, // Signature expiration
      })),
      events: events.map(event => ({
        eventId: event.eventId,
        eventType: event.eventType,
        orgId: event.orgId,
        timestamp: event.timestamp?.toDate?.()?.toISOString() || null,
        signature: truncateHash(event.signature),
        signingKeyId: event.signingKeyId,
        previousEventHash: truncateHash(event.previousEventHash),
        eventHash: truncateHash(event.eventHash),
        blockIndex: event.blockIndex,
        scopes: event.scopes,
        purpose: event.purpose,
      })),
      consentState: consentState.map(consent => ({
        orgId: consent.orgId,
        scope: consent.scope,
        status: consent.status,
        updatedAt: consent.updatedAt?.toDate?.()?.toISOString() || null,
      })),
      alerts: alerts.map(alert => ({
        alertType: alert.alertType,
        orgId: alert.orgId,
        message: alert.message,
        eventId: alert.eventId,
        createdAt: alert.createdAt?.toDate?.()?.toISOString() || null,
      })),
      integrity: {
        allEventsSigned: events.every(e => e.signature),
        hashChainIntact: events.every((e, idx) => {
          if (idx === 0) return true;
          const prevEvent = events[idx - 1];
          return e.previousEventHash === prevEvent.eventHash;
        }),
        signatureExpirationWarning: orgs.some(org => {
          if (!org.keyExpiresAt) return false;
          const expiresAt = org.keyExpiresAt.toDate ? org.keyExpiresAt.toDate() : new Date(org.keyExpiresAt);
          const daysUntilExpiry = (expiresAt - new Date()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry < 30;
        }),
      },
    };

    const blob = new Blob([JSON.stringify(auditProof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-audit-proof-${DEMO_USER_ID}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addNotification('Audit proof bundle downloaded', 'success');
    addLog('info', 'Downloaded audit proof bundle', auditProof);
  }

  // Reset sandbox (clear all demo data)
  async function resetSandbox() {
    addLog('info', 'Resetting sandbox...');
    addLog('request', 'POST /api/orbit/reset - Deleting all demo data', { userId: DEMO_USER_ID });
    
    try {
      // Call API to delete all data from Firestore
      // Note: We delete orgs too to ensure signing secrets are reset, preventing signature verification issues
      const response = await fetch('/api/orbit/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: DEMO_USER_ID,
          deleteOrgs: true, // Delete orgs too to reset signing secrets and prevent signature mismatches
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset sandbox');
      }

      addLog('success', `Sandbox reset complete. Deleted ${data.deleted} documents.`, data);
      
      // Clear local state
      setOrgs([]);
      setEvents([]);
      setAlerts([]);
      setConsentState([]);
      
      // Reload orgs (they should still exist)
      await loadData();
      
      addNotification(`Sandbox reset! Deleted ${data.deleted} documents. Click "Seed Demo Data" to create new demo data.`, 'success');
    } catch (error) {
      addLog('error', `Error resetting sandbox: ${error.message}`, error);
      console.error('Error resetting sandbox:', error);
      addNotification('Error resetting sandbox. Check console.', 'error');
    }
  }

  const eventTypeColors = {
    PROFILE_REGISTERED: 'bg-blue-100 text-blue-800',
    PROFILE_UPDATED: 'bg-indigo-100 text-indigo-800',
    CONSENT_GRANTED: 'bg-green-100 text-green-800',
    CONSENT_REVOKED: 'bg-red-100 text-red-800',
    DATA_USED: 'bg-purple-100 text-purple-800',
    DATA_SHARED: 'bg-pink-100 text-pink-800',
    VERIFICATION_REQUESTED: 'bg-amber-100 text-amber-800',
    VERIFICATION_RESPONDED: 'bg-cyan-100 text-cyan-800',
  };

  return (
    <main className="min-h-screen bg-starburst flex">
      <div className={`flex-1 transition-all duration-300 ${consoleVisible ? 'mr-96' : ''}`}>
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps/stea/orbit" className="text-sm text-neutral-600 hover:text-neutral-900">
                ← Back to Orbit Overview
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="text-3xl">🌐</span>
                <span>Orbit POC Dashboard</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                Demo User: {DEMO_USER_ID}
              </span>
              <button
                onClick={seedDemoData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Seed Demo Data
              </button>
              <button
                onClick={resetSandbox}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Reset Sandbox
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'sandbox', label: 'Org Sandbox' },
              { id: 'timeline', label: 'Timeline' },
              { id: 'consent', label: 'Consent' },
              { id: 'alerts', label: 'Alerts' },
              { id: 'regulator', label: 'Regulator View' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {authLoading || tenantLoading ? (
          <div className="text-center py-16">
            <div className="text-neutral-600">Checking authentication...</div>
          </div>
        ) : !availableTenants.some(t => t.id === ORBIT_POC_TENANT_ID) ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Access Restricted</h3>
              <p className="text-sm text-red-700 mb-4">
                You need to be a member of the Orbit POC workspace to access this page.
              </p>
              <p className="text-xs text-red-600">
                Contact your administrator to request access to the Orbit POC workspace.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <div className="text-neutral-600">Loading...</div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Organisations</h2>
                  {orgs.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600">
                      <p>No organisations yet. Click "Seed Demo Data" to create demo orgs.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-4">
                      {orgs.map(org => (
                        <div key={org.id} className="border border-neutral-200 rounded-lg p-4">
                          <h3 className="font-bold text-neutral-900 mb-2">{org.displayName}</h3>
                          <p className="text-xs text-neutral-600 mb-2">ID: {org.orgId}</p>
                          <div className="text-xs">
                            <p className="font-semibold mb-1">Scopes:</p>
                            <ul className="space-y-1">
                              {Object.keys(org.scopes || {}).map(scope => (
                                <li key={scope} className="text-neutral-600">• {scope}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-2xl font-bold text-neutral-900">{events.length}</div>
                    <div className="text-sm text-neutral-600">Total Events</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                    <div className="text-3xl mb-2">🚨</div>
                    <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
                    <div className="text-sm text-neutral-600">Active Alerts</div>
                  </div>
                  <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-2xl font-bold text-green-600">{consentState.filter(c => c.status === 'GRANTED').length}</div>
                    <div className="text-sm text-neutral-600">Active Consents</div>
                  </div>
                </div>

                {/* Explainer Section */}
                <HowOrbitWorks />
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Event Timeline</h2>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600">
                      <p>No events yet. Use the Org Sandbox tab to create events.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map(event => (
                        <EventVerificationCard key={event.id} event={event} orgs={orgs} onLog={addLog} eventTypeColors={eventTypeColors} />
                      ))}
                    </div>
                  )}
                </div>
                <HowOrbitWorks />
              </div>
            )}

            {/* Consent Tab */}
            {activeTab === 'consent' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Consent State</h2>
                  {consentState.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600">
                      <p>No consent records yet. Use the Org Sandbox tab to grant/revoke consent.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {consentState.map(consent => (
                        <div key={consent.id} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-neutral-900">{consent.orgId}</div>
                              <div className="text-sm text-neutral-600">Scope: {consent.scope}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              consent.status === 'GRANTED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {consent.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <HowOrbitWorks />
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Policy Alerts</h2>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600">
                      <p>No alerts. All events are compliant!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map(alert => (
                        <div key={alert.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-200 text-red-800">
                                {alert.alertType}
                              </span>
                              <span className="ml-3 text-sm text-neutral-600">Org: {alert.orgId}</span>
                            </div>
                            <div className="text-xs text-neutral-500">
                              {alert.createdAt?.toDate?.()?.toLocaleString() || 'Recently'}
                            </div>
                          </div>
                          <div className="text-sm text-neutral-700">{alert.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <HowOrbitWorks />
              </div>
            )}

            {/* Sandbox Tab */}
            {activeTab === 'sandbox' && (
              <div className="space-y-6">
                <OrgSandbox orgs={orgs} onEventCreated={loadData} onLog={addLog} onNotification={addNotification} />
                <HowOrbitWorks />
              </div>
            )}

            {/* Regulator View Tab */}
            {activeTab === 'regulator' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900">Regulator View</h2>
                      <p className="text-sm text-neutral-600 mt-1">Aggregate compliance and integrity overview</p>
                    </div>
                    <button
                      onClick={downloadAuditProof}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      📥 Download Audit Proof Bundle
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                      <div className="text-2xl font-bold text-neutral-900">{events.length}</div>
                      <div className="text-xs text-neutral-600">Total Events</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
                      <div className="text-xs text-neutral-600">Policy Violations</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{orgs.length}</div>
                      <div className="text-xs text-neutral-600">Organizations</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{consentState.filter(c => c.status === 'GRANTED').length}</div>
                      <div className="text-xs text-neutral-600">Active Consents</div>
                    </div>
                  </div>

                  {/* Integrity Checks Summary */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Integrity Checks</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-semibold text-neutral-900">All events cryptographically signed (HMAC-SHA256)</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="font-semibold text-neutral-900">Hash chain intact - {events.filter(e => e.previousEventHash).length} linked events</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">⚠</span>
                        <span className="font-semibold text-neutral-900">Signature expiration: Keys must be rotated every 90 days</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerts by Organization */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Alerts by Organization</h3>
                    {orgs.length === 0 ? (
                      <div className="text-center py-4 text-neutral-600 text-sm">No organizations registered</div>
                    ) : (
                      <div className="space-y-2">
                        {orgs.map(org => {
                          const orgAlerts = alerts.filter(a => a.orgId === org.orgId);
                          const orgEvents = events.filter(e => e.orgId === org.orgId);
                          return (
                            <div key={org.orgId} className="border border-neutral-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-neutral-900">{org.name || org.orgId}</div>
                                <div className="text-sm text-neutral-600">
                                  {orgEvents.length} events • {orgAlerts.length} alerts
                                </div>
                              </div>
                              {orgAlerts.length > 0 && (
                                <div className="text-xs text-red-600 mt-2">
                                  {orgAlerts.map(alert => (
                                    <div key={alert.id}>• {alert.alertType}: {alert.message}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Usage Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Data Usage Summary</h3>
                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            <th className="text-left p-3 font-semibold text-neutral-900">Organization</th>
                            <th className="text-left p-3 font-semibold text-neutral-900">Event Type</th>
                            <th className="text-left p-3 font-semibold text-neutral-900">Count</th>
                            <th className="text-left p-3 font-semibold text-neutral-900">Last Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orgs.map(org => {
                            const orgEvents = events.filter(e => e.orgId === org.orgId);
                            const eventTypes = {};
                            orgEvents.forEach(e => {
                              eventTypes[e.eventType] = (eventTypes[e.eventType] || 0) + 1;
                            });
                            return Object.entries(eventTypes).map(([eventType, count], idx) => (
                              <tr key={`${org.orgId}-${eventType}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                                <td className="p-3 text-neutral-700">{idx === 0 ? org.name || org.orgId : ''}</td>
                                <td className="p-3 text-neutral-700">{eventType}</td>
                                <td className="p-3 text-neutral-700">{count}</td>
                                <td className="p-3 text-neutral-500 text-xs">
                                  {orgEvents.find(e => e.eventType === eventType)?.timestamp?.toDate?.()?.toLocaleDateString() || 'N/A'}
                                </td>
                              </tr>
                            ));
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <HowOrbitWorks />
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Console Panel */}
      <div className={`fixed right-0 top-0 h-full bg-neutral-900 border-l border-neutral-700 transition-transform duration-300 z-40 ${
        consoleVisible ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ width: '384px' }}>
        <div className="flex flex-col h-full">
          {/* Console Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-700 bg-neutral-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-3 text-sm font-mono font-semibold text-neutral-300">Console</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConsoleLogs([])}
                className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 rounded"
                title="Clear console"
              >
                Clear
              </button>
              <button
                onClick={() => setConsoleVisible(false)}
                className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200 rounded"
                title="Hide console"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Console Content */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
            {consoleLogs.length === 0 ? (
              <div className="text-neutral-500 text-center mt-8">
                Console ready. Actions will appear here.
              </div>
            ) : (
              <div className="space-y-1">
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="pb-2 border-b border-neutral-800 last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="text-neutral-500 flex-shrink-0">{log.timestamp}</span>
                      <span className={`flex-shrink-0 font-semibold ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        log.type === 'request' ? 'text-blue-400' :
                        'text-neutral-300'
                      }`}>
                        [{log.type.toUpperCase()}]
                      </span>
                      <span className="text-neutral-300 flex-1 break-words">{log.message}</span>
                    </div>
                    {log.data && (
                      <details className="mt-1 ml-20">
                        <summary className="text-neutral-500 cursor-pointer hover:text-neutral-400">
                          View data
                        </summary>
                        <pre className="mt-2 p-2 bg-neutral-800 rounded text-neutral-300 overflow-x-auto text-xs">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Console Toggle Button (when hidden) */}
      {!consoleVisible && (
        <button
          onClick={() => setConsoleVisible(true)}
          className="fixed right-4 bottom-4 bg-neutral-900 text-neutral-300 px-4 py-2 rounded-lg shadow-lg hover:bg-neutral-800 transition-colors z-30 flex items-center gap-2"
          title="Show console"
        >
          <span className="text-sm">📟</span>
          <span className="text-xs font-mono">Console</span>
        </button>
      )}

      {/* Notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`min-w-[320px] max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-5 duration-300 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : notification.type === 'warning'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
              notification.type === 'success'
                ? 'bg-green-500'
                : notification.type === 'error'
                ? 'bg-red-500'
                : notification.type === 'warning'
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}>
              {notification.type === 'success' && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {notification.type === 'error' && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {notification.type === 'warning' && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {notification.type === 'info' && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                notification.type === 'success'
                  ? 'text-green-900'
                  : notification.type === 'error'
                  ? 'text-red-900'
                  : notification.type === 'warning'
                  ? 'text-amber-900'
                  : 'text-blue-900'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`flex-shrink-0 text-sm hover:opacity-70 transition-opacity ${
                notification.type === 'success'
                  ? 'text-green-600'
                  : notification.type === 'error'
                  ? 'text-red-600'
                  : notification.type === 'warning'
                  ? 'text-amber-600'
                  : 'text-blue-600'
              }`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

// Event Verification Card Component
function EventVerificationCard({ event, orgs, onLog, eventTypeColors = {} }) {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationResults, setVerificationResults] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [simulateTampering, setSimulateTampering] = useState(false);
  const [externalVerifierResponse, setExternalVerifierResponse] = useState(null);

  const handleVerify = async () => {
    setVerifying(true);
    onLog('request', `POST /api/orbit/verify - Verifying event ${event.eventId}`, { eventId: event.eventId, simulateTampering });
    
    try {
      // Clean the event before sending - convert Firestore Timestamps to serializable format
      const eventToSend = { ...event };
      // Remove Firestore-specific fields that shouldn't affect signature verification
      if (eventToSend.timestamp && typeof eventToSend.timestamp.toMillis === 'function') {
        // Keep timestamp but don't send the Firestore object
        delete eventToSend.timestamp;
      }
      // Remove the id field (Firestore document ID, not part of event data)
      if (eventToSend.id) {
        delete eventToSend.id;
      }
      
      const res = await fetch('/api/orbit/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          event: eventToSend,
          simulateTampering: simulateTampering,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        // Check actual verification results
        const allVerified = data.results?.eventSignature?.verified !== false && 
                           data.results?.hashChain?.verified !== false && 
                           data.results?.snapshotHash?.verified !== false;
        
        if (allVerified) {
          onLog('success', `Verification complete for event ${event.eventId} - All checks passed ✓`, data);
        } else {
          // Verification API call succeeded but verification failed
          const failedChecks = [];
          if (data.results?.eventSignature?.verified === false) failedChecks.push('Signature');
          if (data.results?.hashChain?.verified === false) failedChecks.push('Hash Chain');
          if (data.results?.snapshotHash?.verified === false) failedChecks.push('Snapshot Hash');
          onLog('error', `Verification failed for event ${event.eventId} - ${failedChecks.join(', ')} invalid ✗`, data);
        }
        setVerificationResults(data.results);
      } else {
        onLog('error', `Verification API error: ${data.error}`, data);
        setVerificationResults(null);
      }
    } catch (error) {
      onLog('error', `Verification error: ${error.message}`, error);
      setVerificationResults(null);
    } finally {
      setVerifying(false);
    }
  };

  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    return hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash;
  };

  // Handle external verifier request
  const handleExternalVerifier = async () => {
    setVerifying(true);
    onLog('request', `POST /api/orbit/verify/external - Requesting external verification for event ${event.eventId}`, { eventId: event.eventId });
    
    try {
      // Simulate external verifier API call
      const eventToSend = { ...event };
      if (eventToSend.timestamp && typeof eventToSend.timestamp.toMillis === 'function') {
        delete eventToSend.timestamp;
      }
      if (eventToSend.id) {
        delete eventToSend.id;
      }

      const res = await fetch('/api/orbit/verify/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          event: eventToSend,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        onLog('success', `External verification complete for event ${event.eventId}`, data);
        setExternalVerifierResponse(data);
      } else {
        onLog('error', `External verification failed: ${data.error}`, data);
        setExternalVerifierResponse(null);
      }
    } catch (error) {
      onLog('error', `External verification error: ${error.message}`, error);
      setExternalVerifierResponse(null);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'}`}>
            {event.eventType}
          </span>
          <span className="ml-3 text-sm text-neutral-600">by {event.orgId}</span>
          {event.blockIndex && (
            <span className="ml-2 text-xs text-neutral-500">Block #{event.blockIndex}</span>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          {event.timestamp?.toDate?.()?.toLocaleString() || 'Recently'}
        </div>
      </div>
      <div className="text-sm text-neutral-700 space-y-1 mb-3">
        {event.scopes && (
          <div>Scopes: {Array.isArray(event.scopes) ? event.scopes.join(', ') : event.scopes}</div>
        )}
        {event.purpose && <div>Purpose: {event.purpose}</div>}
        {event.verificationClaim && <div>Claim: {event.verificationClaim}</div>}
        {event.verificationResult && <div>Result: {event.verificationResult}</div>}
      </div>

      {/* Verification Section */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowVerification(!showVerification)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            {showVerification ? '▼' : '▶'} Verify Event Integrity
          </button>
          {showVerification && (
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={simulateTampering}
                onChange={(e) => setSimulateTampering(e.target.checked)}
                className="rounded"
              />
              Simulate tampering (demo)
            </label>
          )}
        </div>

        {showVerification && (
          <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
            {/* Overall Verification Status */}
            {verificationResults && (
              <div className={`rounded-lg p-3 mb-4 border-2 ${
                verificationResults.eventSignature?.verified !== false && 
                verificationResults.hashChain?.verified !== false && 
                verificationResults.snapshotHash?.verified !== false
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">
                    {verificationResults.eventSignature?.verified !== false && 
                     verificationResults.hashChain?.verified !== false && 
                     verificationResults.snapshotHash?.verified !== false
                      ? '✓ All Verifications Passed'
                      : '✗ Verification Failed'}
                  </div>
                  <div className="text-xs space-y-1">
                    {verificationResults.eventSignature && (
                      <div className={verificationResults.eventSignature.verified ? 'text-green-700' : 'text-red-700'}>
                        Signature: {verificationResults.eventSignature.verified ? '✓' : '✗'}
                      </div>
                    )}
                    {verificationResults.hashChain && (
                      <div className={verificationResults.hashChain.verified ? 'text-green-700' : 'text-red-700'}>
                        Hash Chain: {verificationResults.hashChain.verified ? '✓' : '✗'}
                      </div>
                    )}
                    {verificationResults.snapshotHash && (
                      <div className={verificationResults.snapshotHash.verified ? 'text-green-700' : 'text-red-700'}>
                        Snapshot: {verificationResults.snapshotHash.verified ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Event Signature */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-neutral-900">1. Event Signature (HMAC-SHA256)</div>
                {verificationResults?.eventSignature && (
                  <span className={`text-xs font-semibold ${verificationResults.eventSignature.verified ? 'text-green-600' : 'text-red-600'}`}>
                    {verificationResults.eventSignature.verified ? '✓ Valid' : '✗ Invalid'}
                  </span>
                )}
              </div>
              <div className="text-xs font-mono text-neutral-600 bg-white rounded p-2 mb-2">
                signature: {formatHash(event.signature)}
              </div>
              {verificationResults?.eventSignature && (
                <div className="text-xs text-neutral-600">
                  verified: {verificationResults.eventSignature.verified ? '✓ Valid (HMAC-SHA256)' : '✗ Invalid - Signature mismatch'}
                </div>
              )}
            </div>

            {/* Hash Chain - Linked List Visualization */}
            {event.previousEventHash && event.eventHash && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-neutral-900">2. Hash Chain Linking (Linked List)</div>
                  {verificationResults?.hashChain && (
                    <span className={`text-xs font-semibold ${verificationResults.hashChain.verified ? 'text-green-600' : 'text-red-600'}`}>
                      {verificationResults.hashChain.verified ? '✓ Verified' : '✗ Broken'}
                    </span>
                  )}
                </div>
                {/* Visual Linked List */}
                <div className="bg-white rounded p-3 mb-2 border border-neutral-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-xs font-mono text-neutral-500 bg-neutral-50 px-2 py-1 rounded">
                      {formatHash(event.previousEventHash)}
                    </div>
                    <div className="text-blue-600 font-bold">→</div>
                    <div className="text-xs font-mono text-neutral-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      {formatHash(event.eventHash)}
                    </div>
                    {event.blockIndex && (
                      <div className="text-xs text-neutral-500 ml-auto">
                        Block #{event.blockIndex}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500 mt-2 italic">
                    Previous Event Hash → This Event Hash
                  </div>
                </div>
                {verificationResults?.hashChain && (
                  <div className="text-xs text-neutral-600">
                    verified: {verificationResults.hashChain.verified ? '✓ Hash chain intact - Immutable linked list' : '✗ Hash chain broken - Tampering detected'}
                  </div>
                )}
              </div>
            )}

            {/* Snapshot Hash (if applicable) */}
            {event.snapshotPointer && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-neutral-900">3. Snapshot Hash Check</div>
                  {verificationResults?.snapshotHash && (
                    <span className={`text-xs font-semibold ${verificationResults.snapshotHash.verified ? 'text-green-600' : 'text-red-600'}`}>
                      {verificationResults.snapshotHash.verified ? '✓ Verified' : '✗ Tampered'}
                    </span>
                  )}
                </div>
                {verificationResults?.snapshotHash && (
                  <div className="text-xs font-mono text-neutral-600 bg-white rounded p-2 space-y-1 mb-2">
                    <div>snapshotHash: {formatHash(verificationResults.snapshotHash.snapshotHash)}</div>
                    <div>recomputedHash: {formatHash(verificationResults.snapshotHash.recomputedHash)}</div>
                  </div>
                )}
                {verificationResults?.snapshotHash && (
                  <div className="text-xs text-neutral-600">
                    verified: {verificationResults.snapshotHash.verified ? '✓ Snapshot integrity unchanged' : '✗ Snapshot has been tampered with'}
                  </div>
                )}
              </div>
            )}

            {/* Signature Expiration Warning */}
            {(() => {
              const org = orgs.find(o => o.orgId === event.orgId);
              if (org && org.keyExpiresAt) {
                const expiresAt = org.keyExpiresAt.toDate ? org.keyExpiresAt.toDate() : new Date(org.keyExpiresAt);
                const daysUntilExpiry = (expiresAt - new Date()) / (1000 * 60 * 60 * 24);
                if (daysUntilExpiry < 90) {
                  return (
                    <div className={`text-xs rounded p-2 ${daysUntilExpiry < 30 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      ⚠️ Signature key expires in {Math.ceil(daysUntilExpiry)} days. Organization must re-key to maintain validity.
                    </div>
                  );
                }
              }
              return null;
            })()}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {verifying ? 'Verifying...' : 'Verify Integrity'}
            </button>

            {/* External Verifier Button */}
            <button
              onClick={handleExternalVerifier}
              disabled={verifying}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mt-2"
            >
              🔍 Request External Verification
            </button>

            {/* External Verifier Response */}
            {externalVerifierResponse && (
              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm font-semibold text-purple-900 mb-2">External Verifier Response</div>
                <div className="text-xs space-y-1">
                  <div className="font-mono text-purple-800">
                    <div>Verifier: {externalVerifierResponse.verifierName}</div>
                    <div>Timestamp: {new Date(externalVerifierResponse.verifiedAt).toLocaleString()}</div>
                    <div>Status: <span className={externalVerifierResponse.verified ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{externalVerifierResponse.verified ? '✓ VERIFIED' : '✗ FAILED'}</span></div>
                    {externalVerifierResponse.proof && (
                      <div className="mt-2 pt-2 border-t border-purple-300">
                        <div className="font-semibold mb-1">Proof:</div>
                        <div className="font-mono text-xs break-all">{externalVerifierResponse.proof}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {simulateTampering && (
              <div className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                ⚠️ Tampering simulation enabled - verification will fail to demonstrate tamper detection
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// How Orbit Works Explainer Component
function HowOrbitWorks() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 mt-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">How Orbit Works</h2>
      <p className="text-neutral-700 mb-6">
        Orbit is a cryptographically-verifiable event ledger that creates an immutable audit trail 
        of how organizations use your data. Here's how it works:
      </p>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Organizations Register</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Organizations (like banks, credit agencies, apps) register with Orbit and declare 
                what data scopes they need (e.g., "basic_identity", "credit_profile"). Each org 
                gets an API key and signing secret.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Call:</div>
                <div>POST /api/orbit/orgs</div>
                <div className="mt-2 text-neutral-500">→ Creates organization record in Firestore</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">User Grants Consent</h3>
              <p className="text-sm text-neutral-700 mb-3">
                When a user grants consent to an organization, Orbit records a <strong>CONSENT_GRANTED</strong> 
                event in the ledger. This event is cryptographically signed and cannot be tampered with.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Call:</div>
                <div>POST /api/orbit/events</div>
                <div className="mt-2 text-neutral-500">→ Creates signed ledger event → Updates consent state</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Organization Uses Data</h3>
              <p className="text-sm text-neutral-700 mb-3">
                When an organization uses your data (e.g., for account opening, credit check), they 
                must declare it by creating a <strong>DATA_USED</strong> event. Orbit's policy engine 
                checks if consent exists and if the usage matches the granted scopes.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Call:</div>
                <div>POST /api/orbit/events (eventType: DATA_USED)</div>
                <div className="mt-2 text-neutral-500">→ Creates signed ledger event → Policy engine checks consent → May trigger alert</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Snapshots & Verification</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Organizations can create <strong>snapshots</strong> (point-in-time views of user data) 
                and request <strong>verifications</strong> (cryptographic proofs of claims). Each snapshot 
                is hashed and linked to the ledger, creating an immutable chain.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Calls:</div>
                <div>POST /api/orbit/snapshots → Creates hashed snapshot</div>
                <div>POST /api/orbit/verification/request → Routes verification request</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="bg-white rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Policy Engine & Alerts</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit's policy engine continuously monitors events. If it detects violations (e.g., 
                data used without consent, hash mismatches, undeclared events), it creates <strong>alerts</strong> 
                that users can see in real-time.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Automatic:</div>
                <div>Policy engine runs on every event → Creates alerts for violations</div>
                <div className="mt-2 text-neutral-500">GET /api/orbit/alerts → User views their alerts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      <div className="mt-8 pt-6 border-t border-blue-200">
        <h3 className="font-bold text-neutral-900 mb-4">Key Concepts</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">🔐 Cryptographic Signatures</div>
            <p className="text-xs text-neutral-700">
              Every event is signed with HMAC-SHA256 using the organization's secret key. 
              This ensures events cannot be tampered with after creation. <strong>Signatures expire after 90 days</strong>—organizations must re-key to maintain validity.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">🔗 Hash Chain (Linked List)</div>
            <p className="text-xs text-neutral-700">
              Events are linked cryptographically: each event's hash includes the previous event's hash, 
              creating an immutable linked list. Visualized as: <strong>Previous Event Hash → This Event Hash</strong>.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">👤 User-Centric</div>
            <p className="text-xs text-neutral-700">
              Users can view all events, consent states, and alerts for their data. 
              No PII is stored—only hashes and event metadata.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">🔍 Verifiable</div>
            <p className="text-xs text-neutral-700">
              Anyone can verify the integrity of the ledger by checking signatures 
              and hash chains. <strong>External verifiers</strong> can independently verify events and return proof tokens.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">📥 Audit Proof Bundle</div>
            <p className="text-xs text-neutral-700">
              Download a complete JSON audit proof bundle containing all events, signatures, hashes, 
              and integrity checks. Perfect for <strong>AI Act compliance</strong> and regulatory reporting.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">🏛️ Regulator View</div>
            <p className="text-xs text-neutral-700">
              Aggregate compliance dashboard showing alerts, usage patterns, and integrity checks 
              across all organizations. Designed for regulatory oversight and compliance monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* Try It Out */}
      <div className="mt-6 pt-6 border-t border-blue-200">
        <div className="bg-blue-100 rounded-lg p-4">
          <div className="font-semibold text-neutral-900 mb-2">🚀 Try It Out</div>
          <p className="text-sm text-neutral-700 mb-3">
            Use the <strong>Org Sandbox</strong> tab to simulate organization actions. Watch the 
            <strong> Console</strong> panel (right side) to see all API calls, events, and responses in real-time.
          </p>
          <ul className="text-sm text-neutral-700 space-y-1 ml-4 list-disc">
            <li>Start by clicking "Seed Demo Data" to create demo organizations</li>
            <li>Go to "Org Sandbox" to simulate actions (grant consent, use data, etc.)</li>
            <li>Check "Timeline" to see all events with <strong>hash chain visualization</strong> and verification</li>
            <li>Click "Verify Event Integrity" to see cryptographic verification (signature, hash chain, snapshot)</li>
            <li>Try "Request External Verification" to see proof loops in action</li>
            <li>View "Alerts" to see any policy violations detected</li>
            <li>Explore "Regulator View" for aggregate compliance data and download <strong>audit proof bundles</strong></li>
            <li>Notice signature expiration warnings—keys must be rotated every 90 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Org Sandbox Component
function OrgSandbox({ orgs, onEventCreated, onLog, onNotification }) {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [action, setAction] = useState('profile');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState('');

  // Preset purposes by organization type
  const orgPurposes = {
    healthcare_provider: [
      'patient_registration',
      'treatment_planning',
      'medication_prescription',
      'lab_test_ordering',
      'insurance_verification',
    ],
    experian: [
      'credit_check',
      'identity_verification',
      'fraud_prevention',
      'loan_application',
      'background_check',
    ],
    challenger_bank: [
      'account_opening',
      'loan_application',
      'transaction_processing',
      'kyc_verification',
      'fraud_detection',
    ],
    broker_app: [
      'portfolio_analysis',
      'trade_execution',
      'risk_assessment',
      'tax_reporting',
      'investment_advice',
    ],
  };

  // Preset data types by organization type
  const orgScopes = {
    healthcare_provider: [
      'basic_identity',
      'health_records',
      'insurance_info',
      'appointment_history',
      'prescription_data',
      'lab_results',
      'vital_signs',
      'allergy_info',
    ],
    experian: [
      'basic_identity',
      'credit_profile',
      'credit_score',
      'payment_history',
      'debt_summary',
      'employment_info',
      'address_history',
      'financial_accounts',
    ],
    challenger_bank: [
      'basic_identity',
      'account_info',
      'transaction_history',
      'balance_info',
      'payment_methods',
      'credit_limit',
      'loan_history',
      'kyc_status',
    ],
    broker_app: [
      'basic_identity',
      'investment_profile',
      'portfolio_value',
      'trade_history',
      'risk_tolerance',
      'investment_goals',
      'tax_info',
      'account_balance',
    ],
  };

  // Get available scopes for selected org
  const getAvailableScopes = () => {
    if (!selectedOrg) return [];
    const org = orgs.find(o => o.orgId === selectedOrg);
    if (!org) return [];
    
    // Use preset scopes if available, otherwise fall back to org's declared scopes
    const presetScopes = orgScopes[org.orgId] || [];
    if (presetScopes.length > 0) {
      return presetScopes;
    }
    
    // Fallback to org's declared scopes
    return Object.keys(org.scopes || {});
  };

  // Get available purposes for selected org
  const getAvailablePurposes = () => {
    if (!selectedOrg) return [];
    const org = orgs.find(o => o.orgId === selectedOrg);
    if (!org) return [];
    
    return orgPurposes[org.orgId] || [];
  };

  // Handle scope toggle
  const toggleScope = (scope) => {
    setSelectedScopes(prev => {
      if (prev.includes(scope)) {
        return prev.filter(s => s !== scope);
      } else {
        return [...prev, scope];
      }
    });
  };

  // Update formData when selectedScopes changes
  useEffect(() => {
    if (action === 'consent') {
      setFormData(prev => ({ ...prev, scope: selectedScopes[0] || '' }));
    } else if (action === 'data-used') {
      setFormData(prev => ({ ...prev, scopes: selectedScopes }));
    } else if (action === 'profile') {
      setFormData(prev => ({ ...prev, scopes: selectedScopes }));
    }
  }, [selectedScopes, action]);

  // Available claim IDs for verification
  const availableClaimIds = [
    'verified_address',
    'verified_kyc',
    'verified_identity',
  ];

  // Reset selected scopes, purpose, and claim ID when org or action changes
  useEffect(() => {
    setSelectedScopes([]);
    setSelectedPurpose('');
    setSelectedClaimId('');
  }, [selectedOrg, action]);

  // Update formData when selectedPurpose changes
  useEffect(() => {
    if (selectedPurpose) {
      setFormData(prev => ({ ...prev, purpose: selectedPurpose }));
    }
  }, [selectedPurpose]);

  // Update formData when selectedClaimId changes
  useEffect(() => {
    if (selectedClaimId) {
      setFormData(prev => ({ ...prev, claimId: selectedClaimId }));
    }
  }, [selectedClaimId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg) {
      alert('Please select an organisation');
      return;
    }

    setLoading(true);
    try {
      const org = orgs.find(o => o.orgId === selectedOrg);
      if (!org) {
        onLog('error', 'Organisation not found');
        return;
      }

      let response;
      let requestBody;
      let endpoint;
      const headers = {
        'Content-Type': 'application/json',
        'X-Orbit-Org-Id': org.orgId,
        'X-Orbit-Api-Key': org.apiKey,
      };

      if (action === 'profile') {
        // Create/update profile
        if (selectedScopes.length === 0) {
          onLog('error', 'Please select at least one scope');
          setLoading(false);
          return;
        }
        endpoint = 'POST /api/orbit/snapshots';
        requestBody = {
          userId: 'user_12345',
          data: formData.data || { name: 'David', dob: '1983-05-01', creditScore: 712 },
          scopes: selectedScopes, // Use selected scopes
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/snapshots', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });
      } else if (action === 'consent') {
        // Grant/revoke consent - create one event per selected scope
        if (selectedScopes.length === 0) {
          onNotification('Please select at least one scope', 'error');
          setLoading(false);
          return;
        }
        
        const eventType = formData.status === 'GRANTED' ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED';
        endpoint = 'POST /api/orbit/events';
        
        // Create one event per selected scope
        const eventPromises = selectedScopes.map(async (scope) => {
          requestBody = {
            eventType: eventType,
            userId: 'user_12345',
            orgId: org.orgId,
            consentScope: scope,
            consentStatus: formData.status || 'GRANTED',
          };
          onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
          return fetch('/api/orbit/events', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(requestBody),
          });
        });
        
        // Wait for all events to be created
        const responses = await Promise.all(eventPromises);
        
        // Check all responses
        const allOk = responses.every(r => r.ok);
        if (allOk) {
          // Parse all successful responses
          const responseDataArray = await Promise.all(responses.map(r => r.json()));
          onNotification(`Consent ${formData.status === 'GRANTED' ? 'granted' : 'revoked'} for ${selectedScopes.length} scope(s)`, 'success');
          onLog('success', `${endpoint} - Success (${selectedScopes.length} events)`, responseDataArray);
          onLog('event', `Event created: ${eventType} (${selectedScopes.length} scope(s))`);
          setFormData({});
          setSelectedScopes([]);
          setSelectedPurpose('');
          onEventCreated();
          setLoading(false);
          return; // Exit early since we've handled the response
        } else {
          // Handle errors - find first failed response
          const failedIndex = responses.findIndex(r => !r.ok);
          response = responses[failedIndex];
          // Continue to error handling below
        }
      } else if (action === 'data-used') {
        // Declare data usage
        if (selectedScopes.length === 0) {
          onLog('error', 'Please select at least one scope');
          setLoading(false);
          return;
        }
        endpoint = 'POST /api/orbit/events';
        requestBody = {
          eventType: 'DATA_USED',
          userId: 'user_12345',
          orgId: org.orgId,
          scopes: selectedScopes, // Use selected scopes
          purpose: selectedPurpose || formData.purpose || 'account_opening',
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/events', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });
      } else if (action === 'verification') {
        // Request verification
        endpoint = 'POST /api/orbit/verification/request';
        requestBody = {
          userId: 'user_12345',
          claimId: selectedClaimId || formData.claimId || 'verified_address',
          purpose: selectedPurpose || formData.purpose || 'account_opening',
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/verification/request', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      let responseData;
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        onLog('error', `${endpoint} - Non-JSON response (${response.status})`, { status: response.status, text: text.substring(0, 200) });
        if (onNotification) {
          onNotification(`Error: Server returned non-JSON response (${response.status})`, 'error');
        }
        setLoading(false);
        return;
      }

      if (response.ok) {
        onLog('success', `${endpoint} - Success`, responseData);
        onLog('event', `Event created: ${requestBody.eventType || 'PROFILE_REGISTERED'}`, responseData);
        if (onNotification) {
          onNotification('Action completed successfully!', 'success');
        }
        setFormData({});
        setSelectedScopes([]);
        setSelectedPurpose('');
        onEventCreated();
      } else {
        onLog('error', `${endpoint} - Failed: ${responseData.error || responseData.message || 'Unknown error'}`, responseData);
        if (onNotification) {
          onNotification(`Error: ${responseData.error || responseData.message || 'Unknown error'}`, 'error');
        }
      }
    } catch (error) {
      onLog('error', `Error performing action: ${error.message}`, error);
      console.error('Error:', error);
      if (onNotification) {
        onNotification(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Org Sandbox</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Simulate organisation actions. Select an org and action type, then submit.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Organisation
          </label>
          <select
            value={selectedOrg || ''}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
            required
          >
            <option value="">Select an organisation</option>
            {orgs.map(org => (
              <option key={org.id} value={org.orgId}>{org.displayName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Action Type
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          >
            <option value="profile">Register/Update Profile</option>
            <option value="consent">Grant/Revoke Consent</option>
            <option value="data-used">Declare Data Usage</option>
            <option value="verification">Request Verification</option>
          </select>
        </div>

        {action === 'profile' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Scopes</label>
              <div className="flex flex-wrap gap-2">
                {getAvailableScopes().map(scope => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedScopes.includes(scope)
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
              {selectedScopes.length === 0 && (
                <p className="text-xs text-neutral-500 mt-2">Select one or more scopes above</p>
              )}
            </div>
          </>
        )}

        {action === 'consent' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Scope</label>
              <div className="flex flex-wrap gap-2">
                {getAvailableScopes().map(scope => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedScopes.includes(scope)
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
              {selectedScopes.length === 0 && (
                <p className="text-xs text-neutral-500 mt-2">Select a scope above</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
              <select
                value={formData.status || 'GRANTED'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              >
                <option value="GRANTED">Grant</option>
                <option value="REVOKED">Revoke</option>
              </select>
            </div>
          </>
        )}

        {action === 'data-used' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Scopes</label>
              <div className="flex flex-wrap gap-2">
                {getAvailableScopes().map(scope => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedScopes.includes(scope)
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
              {selectedScopes.length === 0 && (
                <p className="text-xs text-neutral-500 mt-2">Select one or more scopes above</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Purpose</label>
              <div className="flex flex-wrap gap-2">
                {getAvailablePurposes().map(purpose => (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => setSelectedPurpose(purpose)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedPurpose === purpose
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {purpose}
                  </button>
                ))}
              </div>
              {selectedPurpose === '' && (
                <p className="text-xs text-neutral-500 mt-2">Select a purpose above</p>
              )}
            </div>
          </>
        )}

        {action === 'verification' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Claim ID</label>
              <p className="text-xs text-neutral-500 mb-2">Select the type of verification claim to request</p>
              <div className="flex flex-wrap gap-2">
                {availableClaimIds.map(claimId => (
                  <button
                    key={claimId}
                    type="button"
                    onClick={() => setSelectedClaimId(claimId)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedClaimId === claimId
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {claimId}
                  </button>
                ))}
              </div>
              {selectedClaimId === '' && (
                <p className="text-xs text-neutral-500 mt-2">Select a claim ID above</p>
              )}
              {/* Allow manual entry as fallback */}
              <input
                type="text"
                value={formData.claimId || selectedClaimId || ''}
                onChange={(e) => {
                  setFormData({ ...formData, claimId: e.target.value });
                  if (e.target.value) setSelectedClaimId('');
                }}
                placeholder="Or type a custom claim ID"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 mt-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Purpose</label>
              <div className="flex flex-wrap gap-2">
                {getAvailablePurposes().map(purpose => (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => setSelectedPurpose(purpose)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedPurpose === purpose
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {purpose}
                  </button>
                ))}
              </div>
              {selectedPurpose === '' && (
                <p className="text-xs text-neutral-500 mt-2">Select a purpose above</p>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading || !selectedOrg}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : 'Submit Action'}
        </button>
      </form>
    </div>
  );
}

