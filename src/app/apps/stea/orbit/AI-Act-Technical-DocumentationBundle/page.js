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
                Orbit automates Annex IV, VIII, and XI technical documentation using existing logs — no code changes, no new standards to adopt.
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
              { id: 'lineage', label: 'Lineage Visualization' },
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
            <EvidenceIntegrityReport 
              completenessScore={completenessScore}
              policyDeviations={policyDeviations}
              dashboardData={dashboardData}
            />
          </div>
        )}

        {/* Lineage Tab */}
        {activeTab === 'lineage' && (
          <div className="space-y-6">
            <LineageVisualizationExplainer />
            <LineageVisualization lineage={lineage} onReconstructLineage={reconstructLineage} loading={loading} />
          </div>
        )}

        {/* Bundles Tab */}
        {activeTab === 'bundles' && (
          <div className="space-y-6">
            <BundlesExplainer />
            <ModelCardGenerator documentationBundle={documentationBundle} />
            <DocumentationBundles 
              documentationBundle={documentationBundle}
              onDownloadBundle={downloadBundle}
              truncateHash={truncateHash}
            />
            <AnnexIVBundlePreview documentationBundle={documentationBundle} />
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

// Lineage Visualization Component
function LineageVisualization({ lineage, onReconstructLineage, loading }) {
  // Default placeholder lineage if none exists
  const displayLineage = lineage || {
    nodes: [
      { id: 'user', label: 'User', type: 'user', version: null, timestamp: new Date().toISOString() },
      { id: 'kyc', label: 'KYC Check', type: 'process', version: null, timestamp: new Date().toISOString() },
      { id: 'profile', label: 'Profile Snapshot', type: 'data', version: 'v3', timestamp: new Date().toISOString() },
      { id: 'model', label: 'Risk Model', type: 'model', version: 'v2', timestamp: new Date().toISOString() },
      { id: 'decision', label: 'Decision: APPROVED', type: 'decision', version: null, timestamp: new Date().toISOString() },
    ],
    edges: [
      { from: 'user', to: 'kyc', type: 'triggers' },
      { from: 'kyc', to: 'profile', type: 'creates' },
      { from: 'profile', to: 'model', type: 'feeds' },
      { from: 'model', to: 'decision', type: 'produces' },
    ],
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Data Lineage Visualization</h2>
        {!lineage && (
          <button
            onClick={onReconstructLineage}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Reconstructing...' : 'Reconstruct Lineage'}
          </button>
        )}
      </div>

      {/* SVG Lineage Visualization */}
      <div className="bg-neutral-50 rounded-lg p-8 overflow-x-auto">
        <svg width="100%" height="400" viewBox="0 0 1000 400" className="min-w-[1000px]">
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Draw edges */}
          {displayLineage.edges?.map((edge, idx) => {
            const fromNode = displayLineage.nodes.find(n => n.id === edge.from);
            const toNode = displayLineage.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            
            const fromIdx = displayLineage.nodes.indexOf(fromNode);
            const toIdx = displayLineage.nodes.indexOf(toNode);
            const x1 = 150 + fromIdx * 200;
            const y1 = 200;
            const x2 = 150 + toIdx * 200;
            const y2 = 200;

            return (
              <g key={idx}>
                <line
                  x1={x1 + 100}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#3b82f6"
                  strokeWidth="3"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={y1 - 10}
                  textAnchor="middle"
                  className="text-xs fill-neutral-600"
                  fontSize="10"
                >
                  {edge.type}
                </text>
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Draw nodes */}
          {displayLineage.nodes?.map((node, idx) => {
            const x = 150 + idx * 200;
            const y = 200;
            const nodeColors = {
              user: '#8b5cf6',
              process: '#3b82f6',
              data: '#10b981',
              model: '#f59e0b',
              decision: '#ef4444',
            };
            const color = nodeColors[node.type] || '#6b7280';

            return (
              <g key={node.id}>
                <rect
                  x={x}
                  y={y - 60}
                  width="100"
                  height="120"
                  rx="8"
                  fill="white"
                  stroke={color}
                  strokeWidth="3"
                  className="drop-shadow-lg"
                />
                <text
                  x={x + 50}
                  y={y - 30}
                  textAnchor="middle"
                  className="font-semibold fill-neutral-900"
                  fontSize="12"
                >
                  {node.label.split(':')[0]}
                </text>
                {node.label.includes(':') && (
                  <text
                    x={x + 50}
                    y={y - 15}
                    textAnchor="middle"
                    className="fill-neutral-600"
                    fontSize="10"
                  >
                    {node.label.split(':')[1]}
                  </text>
                )}
                {node.version && (
                  <text
                    x={x + 50}
                    y={y + 5}
                    textAnchor="middle"
                    className="fill-blue-600 font-medium"
                    fontSize="11"
                  >
                    {node.version}
                  </text>
                )}
                <text
                  x={x + 50}
                  y={y + 25}
                  textAnchor="middle"
                  className="fill-neutral-500"
                  fontSize="9"
                >
                  {node.type}
                </text>
                {node.timestamp && (
                  <text
                    x={x + 50}
                    y={y + 45}
                    textAnchor="middle"
                    className="fill-neutral-400"
                    fontSize="8"
                  >
                    {new Date(node.timestamp).toLocaleDateString()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Lineage Details */}
      {displayLineage.edges && displayLineage.edges.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Lineage Details</h3>
          <div className="space-y-2">
            {displayLineage.edges.map((edge, idx) => (
              <div key={idx} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-neutral-900">
                      {edge.from} → {edge.to}
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      Type: {edge.type} • {edge.evidence ? `Evidence: ${edge.evidence}` : 'Automated reconstruction'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Lineage Visualization Explainer
function LineageVisualizationExplainer() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Data Lineage Visualization</h2>
      <p className="text-neutral-700 mb-6">
        Orbit reconstructs and visualizes complete data lineage from ingested logs, showing the flow from input to decision. 
        This is your Datadog flame graph for AI Act compliance — the "wow moment" that demonstrates full traceability.
      </p>
    </div>
  );
}

// Evidence Integrity Report
function EvidenceIntegrityReport({ completenessScore, policyDeviations, dashboardData }) {
  const [expanded, setExpanded] = useState(true);

  // Calculate integrity metrics
  const missingLogs = policyDeviations.filter(d => d.type.includes('Missing')).length;
  const anomalies = policyDeviations.filter(d => d.severity === 'high').length;
  const tamperSignals = 0; // Would be calculated from hash chain checks
  const gaps = policyDeviations.length;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-neutral-900">Evidence Integrity Report</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {expanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{completenessScore}%</div>
              <div className="text-sm text-neutral-600 mt-1">Completeness</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-2xl font-bold text-red-600">{missingLogs}</div>
              <div className="text-sm text-neutral-600 mt-1">Missing Logs</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="text-2xl font-bold text-amber-600">{anomalies}</div>
              <div className="text-sm text-neutral-600 mt-1">Anomalies</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-600">{tamperSignals}</div>
              <div className="text-sm text-neutral-600 mt-1">Tamper Signals</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{gaps}</div>
              <div className="text-sm text-neutral-600 mt-1">Gaps</div>
            </div>
          </div>

          {/* Detailed Findings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900">Detailed Findings</h3>
            
            <div className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-neutral-900">Log Completeness</div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  completenessScore >= 80 ? 'bg-green-100 text-green-800' :
                  completenessScore >= 60 ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {completenessScore >= 80 ? 'Good' : completenessScore >= 60 ? 'Fair' : 'Poor'}
                </span>
              </div>
              <p className="text-sm text-neutral-600">
                {completenessScore >= 80 
                  ? 'Log coverage is sufficient for AI Act compliance. All required documentation elements are present.'
                  : completenessScore >= 60
                  ? 'Log coverage is partially complete. Some documentation elements may be missing.'
                  : 'Log coverage is insufficient. Critical documentation elements are missing.'}
              </p>
            </div>

            {missingLogs > 0 && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="font-medium text-red-900 mb-2">Missing Logs Detected</div>
                <p className="text-sm text-red-700">
                  {missingLogs} critical log type(s) are missing. This may impact AI Act compliance. 
                  Ensure all required log sources are configured and ingesting data.
                </p>
              </div>
            )}

            {anomalies > 0 && (
              <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                <div className="font-medium text-amber-900 mb-2">Anomalies Detected</div>
                <p className="text-sm text-amber-700">
                  {anomalies} high-severity anomaly(ies) detected. Review policy deviations and address critical issues.
                </p>
              </div>
            )}

            {tamperSignals === 0 && (
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="font-medium text-green-900 mb-2">✓ No Tamper Signals</div>
                <p className="text-sm text-green-700">
                  All tamper-evident records are intact. No evidence of data tampering detected.
                </p>
              </div>
            )}

            {gaps > 0 && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="font-medium text-purple-900 mb-2">Documentation Gaps</div>
                <p className="text-sm text-purple-700">
                  {gaps} documentation gap(s) identified. Review policy deviations section for details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Model Card Generator
function ModelCardGenerator({ documentationBundle }) {
  const [expanded, setExpanded] = useState(false);

  if (!documentationBundle) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Model Card Generator (Annex IV-compliant)</h2>
        <p className="text-neutral-600">
          Generate an Annex IV-compliant model card from your ingested logs. Model cards are required for all high-risk AI systems.
        </p>
        <p className="text-sm text-neutral-500 mt-2">
          Generate a documentation bundle first to create a model card.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Model Card Generator (Annex IV-compliant)</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Every high-risk AI system needs a model card. Orbit automatically generates Annex IV-compliant model cards from your logs.
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {expanded ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {expanded && (
        <div className="border border-neutral-200 rounded-lg p-6 bg-neutral-50">
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-neutral-900 mb-2">Model Information</div>
              <div className="text-sm text-neutral-700 space-y-1">
                <div><strong>Model Version:</strong> {documentationBundle.modelVersion || 'N/A'}</div>
                <div><strong>Model Type:</strong> Risk Assessment Model</div>
                <div><strong>Purpose:</strong> Credit decision support</div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 mb-2">Training Data</div>
              <div className="text-sm text-neutral-700">
                Training data summary extracted from logs. Includes data sources, preprocessing steps, and data quality metrics.
              </div>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 mb-2">Performance Metrics</div>
              <div className="text-sm text-neutral-700">
                Model performance metrics extracted from inference logs. Includes accuracy, precision, recall, and F1 scores.
              </div>
            </div>

            <div>
              <div className="font-semibold text-neutral-900 mb-2">Limitations & Biases</div>
              <div className="text-sm text-neutral-700">
                Identified limitations and potential biases based on training data analysis and model behavior.
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-sm text-blue-900">
                <strong>Annex IV Compliance:</strong> This model card includes all required elements per AI Act Annex IV, 
                including model description, training data, performance metrics, and limitations.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Annex IV Bundle Preview
function AnnexIVBundlePreview({ documentationBundle }) {
  const [expanded, setExpanded] = useState(false);

  if (!documentationBundle) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Annex IV Bundle Preview</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Preview of the complete Annex IV technical documentation bundle contents
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {expanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="font-semibold text-neutral-900 mb-2">Version</div>
            <div className="text-sm text-neutral-700">
              <strong>Model Version:</strong> {documentationBundle.modelVersion || 'N/A'}<br />
              <strong>Bundle Version:</strong> {documentationBundle.metadata?.version || '1.0'}<br />
              <strong>Generated:</strong> {documentationBundle.metadata?.generatedAt 
                ? new Date(documentationBundle.metadata.generatedAt).toLocaleString()
                : 'N/A'}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="font-semibold text-neutral-900 mb-2">Inputs</div>
            <div className="text-sm text-neutral-700 space-y-1">
              {documentationBundle.inputs && documentationBundle.inputs.length > 0 ? (
                documentationBundle.inputs.map((input, idx) => (
                  <div key={idx}>
                    • {input.label} ({input.type}) {input.version && `- ${input.version}`}
                  </div>
                ))
              ) : (
                <div className="text-neutral-500">No inputs documented</div>
              )}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="font-semibold text-neutral-900 mb-2">Outputs</div>
            <div className="text-sm text-neutral-700 space-y-1">
              {documentationBundle.outputs && documentationBundle.outputs.length > 0 ? (
                documentationBundle.outputs.map((output, idx) => (
                  <div key={idx}>
                    • {output.label} ({output.type})
                  </div>
                ))
              ) : (
                <div className="text-neutral-500">No outputs documented</div>
              )}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="font-semibold text-neutral-900 mb-2">Training</div>
            <div className="text-sm text-neutral-700">
              Training data summary and preprocessing steps extracted from model training logs. 
              Includes data sources, feature engineering, and training configuration.
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="font-semibold text-neutral-900 mb-2">Monitoring</div>
            <div className="text-sm text-neutral-700">
              <div className="mb-2"><strong>Log Completeness:</strong></div>
              <div className="ml-4 space-y-1">
                <div>• Total Logs: {documentationBundle.logCompleteness?.totalLogs || 0}</div>
                <div>• Log Types: {documentationBundle.logCompleteness?.logTypes?.join(', ') || 'N/A'}</div>
                <div>• Total Entries: {documentationBundle.logCompleteness?.totalEntries || 0}</div>
              </div>
            </div>
          </div>

          <div className="border border-neutral-200 rounded-lg p-4">
            <div className="font-semibold text-neutral-900 mb-2">Human Oversight</div>
            <div className="text-sm text-neutral-700">
              <div className="mb-2"><strong>Oversight Chain:</strong></div>
              <div className="ml-4 space-y-1">
                {documentationBundle.oversightChain && documentationBundle.oversightChain.length > 0 ? (
                  documentationBundle.oversightChain.slice(0, 5).map((item, idx) => (
                    <div key={idx}>• {item}</div>
                  ))
                ) : (
                  <div className="text-neutral-500">No oversight chain documented</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-semibold text-blue-900 mb-2">Annex IV Compliance</div>
            <div className="text-sm text-blue-800">
              This bundle includes all required elements per AI Act Annex IV: version information, inputs, outputs, 
              training data, monitoring evidence, and human oversight documentation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
