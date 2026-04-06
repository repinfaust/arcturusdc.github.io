'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';

export default function CareerOpsDashboard() {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [jdUrl, setJdUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [configStatus, setConfigStatus] = useState({ loading: true, has_config: false });

  useEffect(() => {
    if (currentTenant?.id) {
      checkConfig();
    }
  }, [currentTenant]);

  async function checkConfig() {
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      setConfigStatus({ loading: false, has_config: data.has_config });
    } catch (err) {
      console.error('Failed to check config', err);
      setConfigStatus({ loading: false, has_config: false });
    }
  }

  const tabs = [
    { id: 'pipeline', label: 'Pipeline', icon: '📋' },
    { id: 'scans', label: 'Live Scans', icon: '📡' },
    { id: 'cvs', label: 'CV Tailoring', icon: '📄' },
    { id: 'settings', label: 'Config', icon: '⚙️' },
  ];

  async function handleAnalyse() {
    if (!jdUrl.trim() || !currentTenant?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyse', 
          url: jdUrl,
          tenantId: currentTenant.id 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analyse failed');
      setResults(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (tenantLoading || configStatus.loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading Career Ops...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Setup Warning */}
      {!configStatus.has_config && activeTab !== 'settings' && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 16, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#9A3412', fontSize: 14 }}>Workspace Setup Required</div>
            <div style={{ color: '#C2410C', fontSize: 13, marginTop: 2 }}>You need to configure your Candidate Profile and Evidence Library before you can analyse roles.</div>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ background: '#EA580C', color: '#FFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Go to Config
          </button>
        </div>
      )}

      {/* Search / Input Area */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #D6E0F4', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#10294D', marginBottom: 16 }}>Process New Role</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            placeholder="Paste Job URL or Description..."
            disabled={!configStatus.has_config}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #D6E0F4',
              fontSize: 14,
              outline: 'none',
              background: configStatus.has_config ? '#F8FAFC' : '#F1F5F9',
              cursor: configStatus.has_config ? 'text' : 'not-allowed'
            }}
          />
          <button
            onClick={handleAnalyse}
            disabled={loading || !configStatus.has_config}
            style={{
              padding: '12px 24px',
              background: '#10294D',
              color: '#FFFFFF',
              borderRadius: 12,
              fontWeight: 600,
              border: 'none',
              cursor: (loading || !configStatus.has_config) ? 'not-allowed' : 'pointer',
              opacity: (loading || !configStatus.has_config) ? 0.7 : 1
            }}
          >
            {loading ? 'Analysing...' : 'Analyse Role'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, background: '#EFF4FF', padding: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.id ? '#10294D' : '#4C5D74',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #D6E0F4', minHeight: 400 }}>
        {activeTab === 'pipeline' && (
          <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 100 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <p>Your pipeline is empty. Analyse a role to get started.</p>
          </div>
        )}
        
        {activeTab === 'scans' && (
          <div style={{ display: 'grid', gap: 16 }}>
             <h3 style={{ fontSize: 16, fontWeight: 700, color: '#10294D' }}>Live Portal Scans</h3>
             <p style={{ color: '#4C5D74', fontSize: 14 }}>Scanning 45+ pre-configured portals for Senior/Lead PM roles...</p>
             {/* Mock Scan Results */}
             <div style={{ padding: 16, background: '#F1F5F9', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'monospace' }}>
                [INFO] Starting scan for "Platform Product Manager UK"...<br/>
                [INFO] Checking Greenhouse (Anthropic, OpenAI)...<br/>
                [INFO] Checking Ashby (Vercel, n8n)...<br/>
                [INFO] Found 12 potential matches. Filtering by "Senior" level...
             </div>
          </div>
        )}

        {activeTab === 'cvs' && (
          <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 100 }}>
             <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
             <p>Generate tailored CVs for your shortlisted roles.</p>
          </div>
        )}

        {activeTab === 'settings' && (
           <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', pb: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#10294D' }}>Config & Personalisation</h3>
                <p style={{ color: '#64748B', fontSize: 14 }}>Tailor the system to your specific profile and target roles.</p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                 <div style={{ padding: 20, border: '1px solid #D6E0F4', borderRadius: 16, background: '#F8FAFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', mb: 12 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#10294D' }}>Candidate Profile</h4>
                      <span style={{ fontSize: 12, color: '#006C50', fontWeight: 700 }}>profile.yaml</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', mb: 16 }}>Define your level, location, and core PM strengths.</p>
                    <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 13, fontWeight: 600, color: '#10294D', cursor: 'pointer' }}>Edit Profile</button>
                 </div>

                 <div style={{ padding: 20, border: '1px solid #D6E0F4', borderRadius: 16, background: '#F8FAFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', mb: 12 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#10294D' }}>Evidence Library</h4>
                      <span style={{ fontSize: 12, color: '#006C50', fontWeight: 700 }}>evidence.yaml</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', mb: 16 }}>The "Single Source of Truth" for your achievements and anchors.</p>
                    <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 13, fontWeight: 600, color: '#10294D', cursor: 'pointer' }}>Manage Anchors</button>
                 </div>

                 <div style={{ padding: 20, border: '1px solid #D6E0F4', borderRadius: 16, background: '#F8FAFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', mb: 12 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#10294D' }}>Scoring Framework</h4>
                      <span style={{ fontSize: 12, color: '#006C50', fontWeight: 700 }}>weights.yaml</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', mb: 16 }}>Adjust the weights for domain complexity, pay, and fit.</p>
                    <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 13, fontWeight: 600, color: '#10294D', cursor: 'pointer' }}>Tune Weights</button>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
