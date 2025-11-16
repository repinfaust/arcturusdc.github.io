'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const DEMO_USER_ID = 'user_12345';

export default function OrbitPocPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [orgs, setOrgs] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [consentState, setConsentState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consoleVisible, setConsoleVisible] = useState(true);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const consoleEndRef = useRef(null);

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
      const orgsRes = await fetch('/api/orbit/orgs');
      const orgsData = await orgsRes.json();
      if (orgsRes.ok) {
        addLog('success', `Loaded ${orgsData.orgs?.length || 0} organisations`, orgsData);
        setOrgs(orgsData.orgs || []);
      } else {
        addLog('error', `Failed to load orgs: ${orgsData.error}`, orgsData);
      }

      // Load events
      addLog('request', `GET /api/orbit/events?userId=${DEMO_USER_ID}`);
      const eventsRes = await fetch(`/api/orbit/events?userId=${DEMO_USER_ID}`);
      const eventsData = await eventsRes.json();
      if (eventsRes.ok) {
        addLog('success', `Loaded ${eventsData.events?.length || 0} events`, eventsData);
        setEvents(eventsData.events || []);
      } else {
        addLog('error', `Failed to load events: ${eventsData.error}`, eventsData);
      }

      // Load alerts
      addLog('request', `GET /api/orbit/alerts?userId=${DEMO_USER_ID}`);
      const alertsRes = await fetch(`/api/orbit/alerts?userId=${DEMO_USER_ID}`);
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        addLog('success', `Loaded ${alertsData.alerts?.length || 0} alerts`, alertsData);
        setAlerts(alertsData.alerts || []);
      } else {
        addLog('error', 'Failed to load alerts', await alertsRes.json());
      }

      // Load consent state
      addLog('request', `GET /api/orbit/consent?userId=${DEMO_USER_ID}`);
      const consentRes = await fetch(`/api/orbit/consent?userId=${DEMO_USER_ID}`);
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
      ];

      for (const org of demoOrgs) {
        addLog('request', `POST /api/orbit/orgs - Creating ${org.orgId}`, org);
        const res = await fetch('/api/orbit/orgs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      alert('Demo data seeded! Check the Overview tab.');
    } catch (error) {
      addLog('error', `Error seeding data: ${error.message}`, error);
      console.error('Error seeding data:', error);
      alert('Error seeding data. Check console.');
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
              { id: 'timeline', label: 'Timeline' },
              { id: 'consent', label: 'Consent' },
              { id: 'alerts', label: 'Alerts' },
              { id: 'sandbox', label: 'Org Sandbox' },
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
        {loading ? (
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
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">Event Timeline</h2>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-neutral-600">
                    <p>No events yet. Use the Org Sandbox tab to create events.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map(event => (
                      <div key={event.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${eventTypeColors[event.eventType] || 'bg-gray-100 text-gray-800'}`}>
                              {event.eventType}
                            </span>
                            <span className="ml-3 text-sm text-neutral-600">by {event.orgId}</span>
                          </div>
                          <div className="text-xs text-neutral-500">
                            {event.timestamp?.toDate?.()?.toLocaleString() || 'Recently'}
                          </div>
                        </div>
                        <div className="text-sm text-neutral-700 space-y-1">
                          {event.scopes && (
                            <div>Scopes: {Array.isArray(event.scopes) ? event.scopes.join(', ') : event.scopes}</div>
                          )}
                          {event.purpose && <div>Purpose: {event.purpose}</div>}
                          {event.verificationClaim && <div>Claim: {event.verificationClaim}</div>}
                          {event.verificationResult && <div>Result: {event.verificationResult}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Consent Tab */}
            {activeTab === 'consent' && (
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
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
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
            )}

            {/* Sandbox Tab */}
            {activeTab === 'sandbox' && (
              <OrgSandbox orgs={orgs} onEventCreated={loadData} onLog={addLog} />
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
    </main>
  );
}

// Org Sandbox Component
function OrgSandbox({ orgs, onEventCreated, onLog }) {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [action, setAction] = useState('profile');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

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
        alert('Organisation not found');
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
        endpoint = 'POST /api/orbit/snapshots';
        requestBody = {
          userId: 'user_12345',
          data: formData.data || { name: 'David', dob: '1983-05-01', creditScore: 712 },
          scopes: formData.scopes || ['basic_identity'],
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/snapshots', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
      } else if (action === 'consent') {
        // Grant/revoke consent
        endpoint = 'POST /api/orbit/events';
        requestBody = {
          eventType: formData.status === 'GRANTED' ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
          userId: 'user_12345',
          orgId: org.orgId,
          consentScope: formData.scope || 'basic_identity',
          consentStatus: formData.status || 'GRANTED',
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/events', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
      } else if (action === 'data-used') {
        // Declare data usage
        endpoint = 'POST /api/orbit/events';
        requestBody = {
          eventType: 'DATA_USED',
          userId: 'user_12345',
          orgId: org.orgId,
          scopes: formData.scopes || ['basic_identity'],
          purpose: formData.purpose || 'account_opening',
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/events', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
      } else if (action === 'verification') {
        // Request verification
        endpoint = 'POST /api/orbit/verification/request';
        requestBody = {
          userId: 'user_12345',
          claimId: formData.claimId || 'verified_address',
          purpose: formData.purpose || 'account_opening',
        };
        onLog('request', endpoint, { headers: { 'X-Orbit-Org-Id': org.orgId }, body: requestBody });
        response = await fetch('/api/orbit/verification/request', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
      }

      const responseData = await response.json();
      if (response.ok) {
        onLog('success', `${endpoint} - Success`, responseData);
        onLog('event', `Event created: ${requestBody.eventType || 'PROFILE_REGISTERED'}`, responseData);
        alert('Action completed successfully!');
        setFormData({});
        onEventCreated();
      } else {
        onLog('error', `${endpoint} - Failed: ${responseData.error}`, responseData);
        alert(`Error: ${responseData.error}`);
      }
    } catch (error) {
      onLog('error', `Error performing action: ${error.message}`, error);
      console.error('Error:', error);
      alert('Error performing action');
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

        {action === 'consent' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Scope</label>
              <input
                type="text"
                value={formData.scope || ''}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="basic_identity"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
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
              <label className="block text-sm font-medium text-neutral-700 mb-2">Scopes (comma-separated)</label>
              <input
                type="text"
                value={formData.scopes || ''}
                onChange={(e) => setFormData({ ...formData, scopes: e.target.value.split(',').map(s => s.trim()) })}
                placeholder="basic_identity, credit_profile"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Purpose</label>
              <input
                type="text"
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="account_opening"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
            </div>
          </>
        )}

        {action === 'verification' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Claim ID</label>
              <input
                type="text"
                value={formData.claimId || ''}
                onChange={(e) => setFormData({ ...formData, claimId: e.target.value })}
                placeholder="verified_address"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Purpose</label>
              <input
                type="text"
                value={formData.purpose || ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="account_opening"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2"
              />
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

