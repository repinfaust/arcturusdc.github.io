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
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedLogs, setUploadedLogs] = useState([]);
  const [lineage, setLineage] = useState(null);
  const [documentationBundle, setDocumentationBundle] = useState(null);
  const [completenessScore, setCompletenessScore] = useState(0);
  const [policyDeviations, setPolicyDeviations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const fileInputRef = useRef(null);

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
        addNotification('Technical Documentation Bundle generated', 'success');
        setActiveTab('dashboard'); // Switch to dashboard tab
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
  const downloadBundle = () => {
    if (!documentationBundle) {
      addNotification('No documentation bundle available', 'warning');
      return;
    }

    const blob = new Blob([JSON.stringify(documentationBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-act-technical-documentation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addNotification('Documentation bundle downloaded', 'success');
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
              { id: 'upload', label: 'Log Ingestion' },
              { id: 'lineage', label: 'Lineage' },
              { id: 'dashboard', label: 'Dashboard' },
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
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Explainer Component */}
            <LogIngestionExplainer />
            
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Upload Log Files</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Upload log files to reconstruct data lineage and generate AI Act Technical Documentation.
                Supported formats: CloudTrail logs, API request logs, model inference logs, model training config, IdP access logs.
              </p>
              
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".json,.log,.txt,.csv"
                  onChange={handleFileUpload}
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
                    Click to upload log files
                  </span>
                  <span className="text-sm text-neutral-500">
                    or drag and drop files here
                  </span>
                </label>
              </div>

              {uploadedLogs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">Uploaded Logs</h3>
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
        )}

        {/* Lineage Tab */}
        {activeTab === 'lineage' && (
          <div className="space-y-6">
            {/* Explainer Component */}
            <LineageExplainer />
            
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-900">Data Lineage</h2>
                <button
                  onClick={reconstructLineage}
                  disabled={loading || uploadedLogs.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Reconstructing...' : 'Reconstruct Lineage'}
                </button>
              </div>

              {!lineage ? (
                <div className="text-center py-12 text-neutral-500">
                  <p>No lineage data available. Upload logs and click "Reconstruct Lineage" to begin.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Lineage Graph Visualization */}
                  <div className="bg-neutral-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Lineage Flow</h3>
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

                  {/* Lineage Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Lineage Details</h3>
                    <div className="space-y-3">
                      {lineage.edges?.map((edge, idx) => (
                        <div key={idx} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-neutral-900">
                                {edge.from} → {edge.to}
                              </div>
                              <div className="text-sm text-neutral-500 mt-1">
                                {edge.type} • {edge.timestamp ? new Date(edge.timestamp).toLocaleString() : 'N/A'}
                              </div>
                            </div>
                            {edge.evidence && (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                Evidence: {edge.evidence}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Explainer Component */}
            <DashboardExplainer />
            
            {/* Completeness Score */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Completeness Score</h2>
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
                  <p className="text-sm text-neutral-600">
                    This score reflects the completeness of your AI Act Technical Documentation based on:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-600">
                    <li>• Log completeness and coverage</li>
                    <li>• Lineage traceability</li>
                    <li>• Required documentation fields</li>
                    <li>• Evidence chain integrity</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Documentation Bundle */}
            {documentationBundle && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-neutral-900">Technical Documentation Bundle</h2>
                  <button
                    onClick={downloadBundle}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    📥 Download Bundle
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Bundle Summary */}
                  <div className="grid grid-cols-2 gap-4">
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

                  {/* Bundle Contents */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-neutral-900">Bundle Contents</h3>
                    
                    {documentationBundle.inputs && (
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <div className="font-medium text-neutral-900 mb-2">Inputs</div>
                        <pre className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(documentationBundle.inputs, null, 2)}
                        </pre>
                      </div>
                    )}

                    {documentationBundle.outputs && (
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <div className="font-medium text-neutral-900 mb-2">Outputs</div>
                        <pre className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(documentationBundle.outputs, null, 2)}
                        </pre>
                      </div>
                    )}

                    {documentationBundle.consentBasis && (
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <div className="font-medium text-neutral-900 mb-2">Consent Basis</div>
                        <div className="text-sm text-neutral-600">{documentationBundle.consentBasis}</div>
                      </div>
                    )}

                    {documentationBundle.oversightChain && (
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <div className="font-medium text-neutral-900 mb-2">Oversight Chain</div>
                        <div className="text-sm text-neutral-600 space-y-1">
                          {documentationBundle.oversightChain.map((item, idx) => (
                            <div key={idx}>• {item}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {documentationBundle.attestations && (
                      <div className="border border-neutral-200 rounded-lg p-4">
                        <div className="font-medium text-neutral-900 mb-2">Timestamped Attestations</div>
                        <div className="space-y-2">
                          {documentationBundle.attestations.map((att, idx) => (
                            <div key={idx} className="text-sm text-neutral-600">
                              <div className="font-medium">{att.type}</div>
                              <div className="text-xs text-neutral-500">
                                {new Date(att.timestamp).toLocaleString()}
                              </div>
                              {att.signature && (
                                <div className="text-xs font-mono text-neutral-400 mt-1">
                                  {truncateHash(att.signature)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {documentationBundle.cryptographicSeal && (
                      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                        <div className="font-medium text-blue-900 mb-2">🔒 Cryptographic Seal</div>
                        <div className="text-sm text-blue-800 space-y-1">
                          <div>Signature: {truncateHash(documentationBundle.cryptographicSeal.signature)}</div>
                          <div>Hash: {truncateHash(documentationBundle.cryptographicSeal.hash)}</div>
                          <div>Sealed At: {new Date(documentationBundle.cryptographicSeal.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Policy Deviations */}
            {policyDeviations.length > 0 && (
              <div className="bg-white rounded-2xl border border-red-200 p-6">
                <h2 className="text-2xl font-bold text-red-900 mb-4">Policy Deviations</h2>
                <div className="space-y-3">
                  {policyDeviations.map((deviation, idx) => (
                    <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="font-medium text-red-900">{deviation.type}</div>
                      <div className="text-sm text-red-700 mt-1">{deviation.description}</div>
                      {deviation.severity && (
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          deviation.severity === 'high' ? 'bg-red-200 text-red-900' :
                          deviation.severity === 'medium' ? 'bg-amber-200 text-amber-900' :
                          'bg-yellow-200 text-yellow-900'
                        }`}>
                          {deviation.severity.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

// Log Ingestion Explainer Component
function LogIngestionExplainer() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">How Log Ingestion Works</h2>
      <p className="text-neutral-700 mb-6">
        Orbit ingests log files from various sources to reconstruct data lineage and generate AI Act-compliant technical documentation. Here's how it works:
      </p>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-lg p-5 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Upload Log Files</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Upload log files from your systems. Orbit supports multiple log formats:
              </p>
              <ul className="text-sm text-neutral-700 space-y-1 ml-4 list-disc mb-3">
                <li><strong>CloudTrail logs</strong> - AWS API activity and access logs</li>
                <li><strong>API request logs</strong> - Application API call logs</li>
                <li><strong>Model inference logs</strong> - AI/ML model prediction logs</li>
                <li><strong>Model training config</strong> - Training configuration and metadata</li>
                <li><strong>IdP access logs</strong> - Identity provider authentication logs</li>
              </ul>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Call:</div>
                <div>POST /api/orbit/ai-act/ingest-logs</div>
                <div className="mt-2 text-neutral-500">→ Parses log files → Detects log type → Stores in Firestore → Creates LOG_INGESTED event</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-lg p-5 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Automatic Parsing & Detection</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit automatically detects the log type based on filename and content structure. 
                It parses JSON, CSV, and plain text formats, extracting relevant entries and metadata.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Process:</div>
                <div>Detect log type → Parse entries → Extract metadata → Store structured data</div>
                <div className="mt-2 text-neutral-500">Each log file is stored with its type, entry count, and upload timestamp</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-lg p-5 border border-purple-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Cryptographic Recording</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Each log ingestion is recorded as a <strong>LOG_INGESTED</strong> event in Orbit's ledger, 
                cryptographically signed and linked to the hash chain. This ensures the ingestion process 
                itself is tamper-evident and auditable.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Automatic:</div>
                <div>LOG_INGESTED event created → Signed with HMAC-SHA256 → Linked to hash chain</div>
                <div className="mt-2 text-neutral-500">After ingestion, lineage reconstruction begins automatically</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      <div className="mt-8 pt-6 border-t border-purple-200">
        <h3 className="font-bold text-neutral-900 mb-4">Key Concepts</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="font-semibold text-neutral-900 mb-2">📁 Multiple Log Formats</div>
            <p className="text-xs text-neutral-700">
              Orbit supports various log formats and automatically detects the type. 
              You can upload multiple files at once for batch processing.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="font-semibold text-neutral-900 mb-2">🔍 Smart Parsing</div>
            <p className="text-xs text-neutral-700">
              Logs are parsed intelligently to extract relevant entries, timestamps, 
              user IDs, model versions, and decision outcomes.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="font-semibold text-neutral-900 mb-2">🔐 Immutable Record</div>
            <p className="text-xs text-neutral-700">
              Every log ingestion is recorded in the ledger with cryptographic signatures, 
              ensuring the ingestion process itself is auditable and tamper-evident.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="font-semibold text-neutral-900 mb-2">⚡ Automatic Processing</div>
            <p className="text-xs text-neutral-700">
              After ingestion, Orbit automatically triggers lineage reconstruction, 
              so you can immediately see the data flow from your logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Lineage Explainer Component
function LineageExplainer() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">How Lineage Reconstruction Works</h2>
      <p className="text-neutral-700 mb-6">
        Orbit reconstructs data lineage from ingested logs, showing how data flows through your systems 
        from input to decision. This is critical for AI Act compliance, which requires full traceability.
      </p>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-lg p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Analyze Ingested Logs</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit analyzes all ingested logs to identify key events and data flows. 
                It looks for user interactions, KYC checks, profile snapshots, model inferences, and decisions.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Call:</div>
                <div>POST /api/orbit/ai-act/reconstruct-lineage</div>
                <div className="mt-2 text-neutral-500">→ Analyzes all logs → Identifies events → Builds lineage graph</div>
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
              <h3 className="font-bold text-neutral-900 mb-2">Build Lineage Graph</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit constructs a lineage graph showing the flow of data through your system. 
                Example flow: <strong>User → KYC Check → Profile Snapshot v3 → Risk Model v2 → Decision: APPROVED</strong>
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Process:</div>
                <div>Identify nodes (User, KYC, Profile, Model, Decision) → Create edges (triggers, creates, feeds, produces) → Link with timestamps</div>
                <div className="mt-2 text-neutral-500">Each connection includes evidence (which log file provided the link)</div>
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
              <h3 className="font-bold text-neutral-900 mb-2">Visualize Data Flow</h3>
              <p className="text-sm text-neutral-700 mb-3">
                The lineage graph is visualized as a flow diagram, showing each step in the data processing pipeline. 
                Each node includes version information (e.g., "Profile Snapshot v3", "Risk Model v2") and timestamps.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Display:</div>
                <div>Nodes (User, KYC, Profile, Model, Decision) → Arrows showing flow → Version numbers → Timestamps</div>
                <div className="mt-2 text-neutral-500">Click "Reconstruct Lineage" to rebuild the graph from current logs</div>
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
            <div className="font-semibold text-neutral-900 mb-2">🔗 Full Traceability</div>
            <p className="text-xs text-neutral-700">
              AI Act requires full traceability from input to output. Orbit's lineage graph 
              shows exactly how data flows through your system, meeting this requirement.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">📊 Visual Flow</div>
            <p className="text-xs text-neutral-700">
              The lineage graph provides a clear visual representation of data flow, 
              making it easy to understand and explain to regulators.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">🔍 Evidence Tracking</div>
            <p className="text-xs text-neutral-700">
              Each connection in the lineage graph includes evidence (which log file provided it), 
              ensuring you can trace back to the source data.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-neutral-900 mb-2">🔄 Version Awareness</div>
            <p className="text-xs text-neutral-700">
              Lineage includes model versions and snapshot versions, critical for AI Act compliance 
              which requires documenting which model version made which decision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Explainer Component
function DashboardExplainer() {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">How the Dashboard Works</h2>
      <p className="text-neutral-700 mb-6">
        The Dashboard provides a comprehensive view of your AI Act compliance status, including completeness scores, 
        technical documentation bundles, and policy deviation detection. This is your regulator-ready compliance view.
      </p>

      <div className="space-y-6">
        {/* Step 1 */}
        <div className="bg-white rounded-lg p-5 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Generate Documentation Bundle</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit automatically generates an AI Act Technical Documentation Bundle from your lineage data. 
                This bundle includes all required elements: inputs, outputs, model version, consent basis, 
                oversight chain, log completeness, and timestamped attestations.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">API Call:</div>
                <div>POST /api/orbit/ai-act/generate-bundle</div>
                <div className="mt-2 text-neutral-500">→ Extracts data from lineage → Builds documentation → Cryptographically seals → Calculates completeness</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-lg p-5 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Calculate Completeness Score</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit calculates a completeness score (0-100%) based on required AI Act documentation elements:
                lineage nodes/edges, API/CloudTrail logs, model logs, and decision points. 
                This score helps you understand how complete your documentation is.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Scoring:</div>
                <div>Lineage nodes (20%) + Edges (20%) + API logs (20%) + Model logs (20%) + Decision points (20%)</div>
                <div className="mt-2 text-neutral-500">Higher scores indicate more complete documentation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-lg p-5 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Detect Policy Deviations</h3>
              <p className="text-sm text-neutral-700 mb-3">
                Orbit automatically checks for AI Act policy deviations, such as missing consent basis, 
                incomplete lineage, missing model versions, or missing timestamps. 
                Deviations are flagged with severity levels (high, medium, low).
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Checks:</div>
                <div>Consent basis → Lineage completeness → Model versioning → Timestamp coverage</div>
                <div className="mt-2 text-neutral-500">Address deviations to improve compliance score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white rounded-lg p-5 border border-green-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-neutral-900 mb-2">Cryptographic Sealing</h3>
              <p className="text-sm text-neutral-700 mb-3">
                The documentation bundle is cryptographically sealed using HMAC-SHA256 signatures and hash chains. 
                This ensures the bundle cannot be tampered with and provides proof of integrity for regulators.
              </p>
              <div className="bg-neutral-50 rounded p-3 text-xs font-mono text-neutral-600">
                <div className="font-semibold mb-1">Process:</div>
                <div>Compute bundle hash → Sign with system key → Link to hash chain → Store seal in bundle</div>
                <div className="mt-2 text-neutral-500">Download bundle includes cryptographic seal for verification</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      <div className="mt-8 pt-6 border-t border-green-200">
        <h3 className="font-bold text-neutral-900 mb-4">Key Concepts</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-neutral-900 mb-2">📋 Complete Documentation</div>
            <p className="text-xs text-neutral-700">
              The bundle includes all AI Act requirements: inputs, outputs, model version, 
              consent basis, oversight chain, log completeness, and attestations.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-neutral-900 mb-2">📊 Completeness Score</div>
            <p className="text-xs text-neutral-700">
              A 0-100% score indicating how complete your documentation is. 
              Use this to identify gaps and improve compliance.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-neutral-900 mb-2">⚠️ Policy Deviations</div>
            <p className="text-xs text-neutral-700">
              Automatic detection of compliance issues with severity levels. 
              Address high-severity deviations first.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-neutral-900 mb-2">🔒 Cryptographic Seal</div>
            <p className="text-xs text-neutral-700">
              The bundle is cryptographically sealed, ensuring integrity and providing 
              proof that it hasn't been tampered with.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-neutral-900 mb-2">📥 Downloadable Bundle</div>
            <p className="text-xs text-neutral-700">
              Download the complete documentation bundle as JSON. This is your regulator-ready 
              proof of compliance, ready to submit to authorities.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="font-semibold text-neutral-900 mb-2">🏛️ AI Act Ready</div>
            <p className="text-xs text-neutral-700">
              The bundle format meets AI Act requirements for technical documentation, 
              making it ready for regulatory submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

