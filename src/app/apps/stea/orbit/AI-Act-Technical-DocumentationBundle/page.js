'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';

const ORBIT_POC_TENANT_ID = 'l5nH79ZIiknHuqPT8YW7';

export default function AIActTechnicalDocumentationPage() {
  const router = useRouter();
  const { availableTenants, loading: tenantLoading } = useTenant();
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ingestion');
  const [uploadedLogs, setUploadedLogs] = useState([]);
  const [lineage, setLineage] = useState(null);
  const [documentationBundle, setDocumentationBundle] = useState(null);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [policyDeviations, setPolicyDeviations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);

  // Mock data for dashboard
  const [dashboardData, setDashboardData] = useState({
    dataSourcesIngested: 12,
    modelsReconstructed: 3,
    lineageMaps: 8,
    violationsDetected: 2,
    bundlesGenerated: 5,
    riskScore: 78,
  });

  // Add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthLoading(false);
      if (!firebaseUser) {
        router.replace('/apps/stea?next=/apps/stea/orbit/AI-Act-Technical-DocumentationBundle');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Authorization check - must be member of Orbit POC workspace
  useEffect(() => {
    if (!tenantLoading && !authLoading) {
      const hasOrbitPocAccess = availableTenants?.some(
        tenant => tenant.id === ORBIT_POC_TENANT_ID || tenant.tenantId === ORBIT_POC_TENANT_ID
      );
      if (!hasOrbitPocAccess) {
        router.replace('/apps/stea?error=no_orbit_poc_access');
      }
    }
  }, [availableTenants, tenantLoading, authLoading, router]);

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle log file upload
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('logs', file);
      });

      const response = await fetch('/api/orbit/ai-act/ingest-logs', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setUploadedLogs(prev => [...prev, ...data.logs]);
        setDashboardData(prev => ({ ...prev, dataSourcesIngested: prev.dataSourcesIngested + data.logs.length }));
        addNotification(`Successfully ingested ${data.logs.length} log file(s)`, 'success');
        
        // Automatically reconstruct lineage after ingestion
        if (data.logs.length > 0) {
          await reconstructLineage();
        }
      } else {
        addNotification(`Error: ${data.error || 'Failed to ingest logs'}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading logs:', error);
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Reconstruct lineage from ingested logs
  const reconstructLineage = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/orbit/ai-act/reconstruct-lineage', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (response.ok) {
        setLineage(data.lineage);
        setDashboardData(prev => ({ ...prev, modelsReconstructed: prev.modelsReconstructed + 1, lineageMaps: prev.lineageMaps + 1 }));
        addNotification('Lineage reconstructed successfully', 'success');
        
        // Automatically generate documentation bundle
        await generateDocumentationBundle(data.lineage);
      } else {
        addNotification(`Error: ${data.error || 'Failed to reconstruct lineage'}`, 'error');
      }
    } catch (error) {
      console.error('Error reconstructing lineage:', error);
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Technical Documentation Bundle
  const generateDocumentationBundle = async (lineageData = lineage) => {
    if (!lineageData) {
      addNotification('Please reconstruct lineage first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orbit/ai-act/generate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lineage: lineageData }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setDocumentationBundle(data.bundle);
        setCompletenessScore(data.completenessScore || 0);
        setPolicyDeviations(data.policyDeviations || []);
        setDashboardData(prev => ({ 
          ...prev, 
          bundlesGenerated: prev.bundlesGenerated + 1,
          violationsDetected: prev.violationsDetected + (data.policyDeviations?.length || 0),
        }));
        addNotification('Technical Documentation Bundle generated', 'success');
        setActiveTab('bundles'); // Switch to bundles tab
      } else {
        addNotification(`Error: ${data.error || 'Failed to generate bundle'}`, 'error');
      }
    } catch (error) {
      console.error('Error generating bundle:', error);
      addNotification(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download documentation bundle
  const downloadBundle = (type = 'full') => {
    if (!documentationBundle) {
      addNotification('No documentation bundle available', 'warning');
      return;
    }

    const bundle = type === 'full' ? documentationBundle : { ...documentationBundle, type };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = type === 'full' 
      ? `FullTechnicalDocumentationBundle-${new Date().toISOString().split('T')[0]}.zip`
      : type === 'training' 
      ? `TrainingDataSummary-${new Date().toISOString().split('T')[0]}.pdf`
      : type === 'lineage'
      ? `DecisionLineage-${new Date().toISOString().split('T')[0]}.json`
      : type === 'oversight'
      ? `HumanOversightEvidence-${new Date().toISOString().split('T')[0]}.pdf`
      : `ModelExecutionTrace-${new Date().toISOString().split('T')[0]}.md`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addNotification(`Downloaded ${filename}`, 'success');
  };

  // Helper to truncate hashes
  const truncateHash = (hash) => {
    if (!hash || typeof hash !== 'string') return hash;
    if (hash.length <= 12) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">AI Act Technical Documentation</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Automated compliance documentation from logs → lineage → regulator-ready proofs
              </p>
            </div>
            <Link
              href="/apps/stea/orbit"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Orbit
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'ingestion', label: 'Data Ingestion' },
              { id: 'dashboard', label: 'Compliance Dashboard' },
              { id: 'bundles', label: 'Documentation Bundles' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ingestion Tab */}
        {activeTab === 'ingestion' && (
          <div className="space-y-6">
            <EnterpriseIngestionExplainer />
            <EnterpriseIngestionUI onFileUpload={handleFileUpload} fileInputRef={fileInputRef} loading={loading} uploadedLogs={uploadedLogs} />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardExplainer />
            <ComplianceDashboard 
              dashboardData={dashboardData}
              completenessScore={completenessScore}
              policyDeviations={policyDeviations}
              lineage={lineage}
              onReconstructLineage={reconstructLineage}
              onGenerateBundle={generateDocumentationBundle}
              loading={loading}
            />
          </div>
        )}

        {/* Bundles Tab */}
        {activeTab === 'bundles' && (
          <div className="space-y-6">
            <BundlesExplainer />
            <DocumentationBundles 
              documentationBundle={documentationBundle}
              onDownloadBundle={downloadBundle}
              truncateHash={truncateHash}
            />
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`max-w-sm w-full rounded-lg shadow-lg p-4 flex items-start space-x-3 ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : notification.type === 'error'
                ? 'bg-red-50 border border-red-200'
                : notification.type === 'warning'
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              ✕
            </button>
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
        ))}
      </div>
    </main>
  );
}

// Enterprise Ingestion Explainer
function EnterpriseIngestionExplainer() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Enterprise Data Ingestion</h2>
      <p className="text-neutral-700 mb-6">
        Orbit supports enterprise-grade data ingestion from multiple sources. In production, Orbit integrates with 
        your existing infrastructure to automatically ingest logs and reconstruct data lineage for AI Act compliance.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This PoC demonstrates manual file upload. Production deployments support automated 
          ingestion from cloud storage and on-premises agents.
        </p>
      </div>
    </div>
  );
}

// Enterprise Ingestion UI
function EnterpriseIngestionUI({ onFileUpload, fileInputRef, loading, uploadedLogs }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Data Ingestion Architecture</h2>
      
      {/* Enterprise Ingestion Options */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">S3</div>
            <div>
              <h3 className="font-bold text-neutral-900">AWS S3 Bucket</h3>
              <p className="text-xs text-neutral-600">Automated ingestion from S3 buckets</p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 mb-3">
            Orbit monitors S3 buckets for new log files and automatically ingests them. 
            Supports CloudTrail logs, application logs, and model inference logs.
          </p>
          <div className="text-xs text-neutral-500 bg-white rounded p-2">
            Production: EventBridge → SQS → Orbit Ingestion Service
          </div>
        </div>

        <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">GCS</div>
            <div>
              <h3 className="font-bold text-neutral-900">Google Cloud Storage</h3>
              <p className="text-xs text-neutral-600">Automated ingestion from GCS buckets</p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 mb-3">
            Orbit integrates with GCS to automatically ingest logs from your Google Cloud infrastructure. 
            Supports Pub/Sub notifications and scheduled scans.
          </p>
          <div className="text-xs text-neutral-500 bg-white rounded p-2">
            Production: Cloud Functions → Pub/Sub → Orbit Ingestion Service
          </div>
        </div>

        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">AZ</div>
            <div>
              <h3 className="font-bold text-neutral-900">Azure Blob Storage</h3>
              <p className="text-xs text-neutral-600">Automated ingestion from Azure Blob</p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 mb-3">
            Orbit connects to Azure Blob Storage to automatically ingest logs. 
            Supports Event Grid triggers and scheduled ingestion.
          </p>
          <div className="text-xs text-neutral-500 bg-white rounded p-2">
            Production: Event Grid → Azure Functions → Orbit Ingestion Service
          </div>
        </div>

        <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-purple-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">🔌</div>
            <div>
              <h3 className="font-bold text-neutral-900">On-Premises Agent</h3>
              <p className="text-xs text-neutral-600">Lightweight agent for on-prem infrastructure</p>
            </div>
          </div>
          <p className="text-sm text-neutral-700 mb-3">
            Deploy Orbit's lightweight agent on-premises to monitor log directories and forward logs securely. 
            Supports file system watchers and syslog integration.
          </p>
          <div className="text-xs text-neutral-500 bg-white rounded p-2">
            Production: File Watcher → Orbit Agent → Secure API → Orbit Cloud
          </div>
        </div>
      </div>

      {/* Manual Upload (PoC) */}
      <div className="border-t border-neutral-200 pt-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Manual Upload (PoC Demo)</h3>
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json,.log,.txt,.csv"
            onChange={onFileUpload}
            className="hidden"
            id="log-upload"
          />
          <label
            htmlFor="log-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg className="w-12 h-12 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-lg font-medium text-neutral-700 mb-2">
              Click to upload log files (PoC)
            </span>
            <span className="text-sm text-neutral-500">
              Supported: CloudTrail, API logs, model inference logs, training config, IdP logs
            </span>
          </label>
        </div>

        {uploadedLogs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Uploaded Logs</h4>
            <div className="space-y-2">
              {uploadedLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <div className="font-medium text-neutral-900">{log.filename}</div>
                    <div className="text-sm text-neutral-500">
                      {log.type} • {log.entries || 0} entries • {new Date(log.uploadedAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    Ingested
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Compliance Dashboard
function ComplianceDashboard({ dashboardData, completenessScore, policyDeviations, lineage, onReconstructLineage, onGenerateBundle, loading }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="Data Sources" value={dashboardData.dataSourcesIngested} icon="📊" />
        <MetricCard label="Models Reconstructed" value={dashboardData.modelsReconstructed} icon="🤖" />
        <MetricCard label="Lineage Maps" value={dashboardData.lineageMaps} icon="🔗" />
        <MetricCard label="Violations Detected" value={dashboardData.violationsDetected} icon="⚠️" color="red" />
        <MetricCard label="Bundles Generated" value={dashboardData.bundlesGenerated} icon="📦" />
        <MetricCard label="Risk Score" value={`${dashboardData.riskScore}%`} icon="📈" />
      </div>

      {/* Completeness Score */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">AI Act Compliance Completeness</h2>
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-neutral-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - completenessScore / 100)}`}
                  className="text-blue-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-neutral-900">{completenessScore}%</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-neutral-600 mb-4">
              This score reflects compliance with AI Act requirements for technical documentation (Annex IV), 
              post-market monitoring (Annex VIII), and quality management systems (Annex XI).
            </p>
            <div className="flex gap-3">
              <button
                onClick={onReconstructLineage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Reconstruct Lineage
              </button>
              <button
                onClick={onGenerateBundle}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Generate Bundle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lineage Visualization */}
      {lineage && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">Data Lineage Map</h2>
          <div className="bg-neutral-50 rounded-lg p-6">
            <div className="flex items-center justify-center space-x-4 overflow-x-auto py-4">
              {lineage.nodes?.map((node, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="bg-white border-2 border-blue-200 rounded-lg p-4 min-w-[200px] text-center">
                    <div className="font-semibold text-neutral-900">{node.label}</div>
                    {node.version && (
                      <div className="text-xs text-neutral-500 mt-1">v{node.version}</div>
                    )}
                    {node.timestamp && (
                      <div className="text-xs text-neutral-400 mt-1">
                        {new Date(node.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {idx < (lineage.nodes?.length || 0) - 1 && (
                    <div className="mx-2 text-blue-600 font-bold">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Policy Deviations */}
      {policyDeviations.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <h2 className="text-2xl font-bold text-red-900 mb-4">Policy Deviations Detected</h2>
          <div className="space-y-3">
            {policyDeviations.map((deviation, idx) => (
              <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-red-900">{deviation.type}</div>
                    <div className="text-sm text-red-700 mt-1">{deviation.description}</div>
                  </div>
                  {deviation.severity && (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      deviation.severity === 'high' ? 'bg-red-200 text-red-900' :
                      deviation.severity === 'medium' ? 'bg-amber-200 text-amber-900' :
                      'bg-yellow-200 text-yellow-900'
                    }`}>
                      {deviation.severity.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, icon, color = 'blue' }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${
          color === 'red' ? 'text-red-600' : 'text-blue-600'
        }`}>
          {value}
        </span>
      </div>
      <div className="text-sm text-neutral-600">{label}</div>
    </div>
  );
}

// Documentation Bundles
function DocumentationBundles({ documentationBundle, onDownloadBundle, truncateHash }) {
  const bundleOutputs = [
    { id: 'training', name: 'TrainingDataSummary.pdf', description: 'Training data summary and preprocessing documentation', annex: 'Annex IV' },
    { id: 'lineage', name: 'DecisionLineage.json', description: 'Complete decision lineage from input to output', annex: 'Annex IV' },
    { id: 'oversight', name: 'HumanOversightEvidence.pdf', description: 'Human oversight and intervention evidence', annex: 'Annex VIII' },
    { id: 'trace', name: 'ModelExecutionTrace.md', description: 'Model execution trace and inference logs', annex: 'Annex IV' },
    { id: 'full', name: 'FullTechnicalDocumentationBundle.zip', description: 'Complete AI Act technical documentation bundle', annex: 'Annex IV, VIII, XI' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">AI Act Documentation Bundle Generator</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Orbit automatically generates regulator-ready documentation bundles that comply with AI Act Annexes IV, VIII, and XI.
        </p>

        {/* Bundle Outputs */}
        <div className="space-y-4 mb-6">
          {bundleOutputs.map((output) => (
            <div key={output.id} className="border border-neutral-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">
                      {output.id === 'training' ? '📄' : output.id === 'lineage' ? '📋' : output.id === 'oversight' ? '👤' : output.id === 'trace' ? '🔍' : '📦'}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{output.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">{output.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {output.annex}
                    </span>
                    <span className="text-xs text-neutral-500">
                      AI Act Compliant
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onDownloadBundle(output.id)}
                  disabled={!documentationBundle}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bundle Details */}
        {documentationBundle && (
          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Bundle Contents</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm text-neutral-500">Model Version</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {documentationBundle.modelVersion || 'N/A'}
                </div>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="text-sm text-neutral-500">Generated At</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {documentationBundle.generatedAt 
                    ? new Date(documentationBundle.generatedAt).toLocaleString()
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* AI Act Annex Compliance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="font-semibold text-blue-900 mb-2">AI Act Annex Compliance</div>
              <div className="space-y-2 text-sm text-blue-800">
                <div>✓ <strong>Annex IV:</strong> Technical Documentation (inputs, outputs, model version, oversight chain)</div>
                <div>✓ <strong>Annex VIII:</strong> Post-Market Monitoring Evidence (log completeness, attestations)</div>
                <div>✓ <strong>Annex XI:</strong> Quality Management System Artefacts (consent basis, policy compliance)</div>
              </div>
            </div>

            {/* Cryptographic Seal */}
            {documentationBundle.cryptographicSeal && (
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="font-medium text-green-900 mb-2">🔒 Tamper-Evident Record</div>
                <div className="text-sm text-green-800 space-y-1">
                  <div>Sealed: {new Date(documentationBundle.cryptographicSeal.timestamp).toLocaleString()}</div>
                  <div className="font-mono text-xs">
                    Seal: {truncateHash(documentationBundle.cryptographicSeal.hash)}
                  </div>
                  <div className="text-xs text-green-700 mt-2">
                    This bundle is cryptographically sealed to ensure integrity and provide proof of authenticity for regulators.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Explainer
function DashboardExplainer() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Compliance Dashboard</h2>
      <p className="text-neutral-700 mb-6">
        The Compliance Dashboard provides a comprehensive view of your AI Act compliance status, including data sources, 
        models, lineage maps, violations, and risk scoring. This is your regulator-ready compliance view.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-semibold text-blue-900 mb-2">AI Act Annex Compliance</div>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• <strong>Annex IV:</strong> Technical Documentation requirements</div>
          <div>• <strong>Annex VIII:</strong> Post-Market Monitoring evidence</div>
          <div>• <strong>Annex XI:</strong> Quality Management System artefacts</div>
        </div>
      </div>
    </div>
  );
}

// Bundles Explainer
function BundlesExplainer() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">AI Act Documentation Bundle Generator</h2>
      <p className="text-neutral-700 mb-6">
        Orbit automatically generates regulator-ready documentation bundles that comply with AI Act requirements. 
        Each bundle includes all necessary documentation for regulatory submission.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="font-semibold text-green-900 mb-2">Compliance Coverage</div>
        <div className="text-sm text-green-800 space-y-1">
          <div>✓ <strong>Annex IV:</strong> Technical Documentation (inputs, outputs, model version, oversight chain)</div>
          <div>✓ <strong>Annex VIII:</strong> Post-Market Monitoring Evidence (log completeness, attestations)</div>
          <div>✓ <strong>Annex XI:</strong> Quality Management System Artefacts (consent basis, policy compliance)</div>
        </div>
      </div>
    </div>
  );
}
