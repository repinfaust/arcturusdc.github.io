'use client';

import { useState, useEffect } from 'react';

export default function CareerOpsDashboard() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [jdUrl, setJdUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const tabs = [
    { id: 'pipeline', label: 'Pipeline', icon: '📋' },
    { id: 'scans', label: 'Live Scans', icon: '📡' },
    { id: 'cvs', label: 'CV Tailoring', icon: '📄' },
    { id: 'settings', label: 'Config', icon: '⚙️' },
  ];

  async function handleAnalyze() {
    if (!jdUrl.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', url: jdUrl }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Search / Input Area */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #D6E0F4', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#10294D', marginBottom: 16 }}>Process New Role</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            placeholder="Paste Job URL or Description..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #D6E0F4',
              fontSize: 14,
              outline: 'none',
              background: '#F8FAFC'
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#10294D',
              color: '#FFFFFF',
              borderRadius: 12,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Role'}
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
            <p>Your pipeline is empty. Analyze a role to get started.</p>
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
           <div style={{ display: 'grid', gap: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#10294D' }}>Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                 <div style={{ padding: 16, border: '1px solid #D6E0F4', borderRadius: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#10294D', marginBottom: 8 }}>Scoring Weights</h4>
                    <p style={{ fontSize: 12, color: '#64748B' }}>12-factor PM specific model is active.</p>
                 </div>
                 <div style={{ padding: 16, border: '1px solid #D6E0F4', borderRadius: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: '#10294D', marginBottom: 8 }}>Candidate Profile</h4>
                    <p style={{ fontSize: 12, color: '#64748B' }}>David Loake: Senior PM | UK Remote</p>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
