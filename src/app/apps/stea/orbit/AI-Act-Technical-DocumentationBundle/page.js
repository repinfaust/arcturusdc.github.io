'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';

const ALLOWED_TENANT_IDS = ['l5nH79ZIiknHuqPT8YW7', 'FqhckqMaorJMAQ6B29mP']; // Orbit POC and ArcturusDC

export default function AIActTechnicalDocumentationPage() {
  const router = useRouter();
  const { availableTenants, loading: tenantLoading } = useTenant();
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kyc');
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
    sourceLogsUsed: {
      s3: true,
      pubsub: false,
      onprem: true,
      azure: false,
    },
  });

  // Regulatory version tracking
  const [regulatoryVersions, setRegulatoryVersions] = useState({
    regulationVersion: 'EU AI Act 2024/1689',
    templateVersion: '1.2.0',
    interpretationVersion: '2024.11',
    orbitVersion: '1.0.0',
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

  // Authorization check - must be member of Orbit POC or ArcturusDC workspace
  useEffect(() => {
    // Wait for both auth and tenants to finish loading
    if (tenantLoading || authLoading) {
      return;
    }

    // Add a small delay to ensure tenants are fully populated after sign-in
    const checkAccess = () => {
      console.log('[AI Act Access Check] Available tenants:', availableTenants);
      console.log('[AI Act Access Check] Allowed tenant IDs:', ALLOWED_TENANT_IDS);

      // If no tenants available, likely still loading - don't redirect yet
      if (!availableTenants || availableTenants.length === 0) {
        console.log('[AI Act Access Check] No tenants loaded yet, waiting...');
        return;
      }

      const hasAccess = availableTenants.some(
        tenant => {
          const tenantId = tenant.id || tenant.tenantId;
          console.log('[AI Act Access Check] Checking tenant:', tenantId, tenant.name);
          return ALLOWED_TENANT_IDS.includes(tenantId);
        }
      );

      console.log('[AI Act Access Check] Has access:', hasAccess);

      if (!hasAccess) {
        console.warn('[AI Act Access Check] Access denied. User tenants:', availableTenants.map(t => ({ id: t.id, name: t.name })));
        router.replace('/apps/stea?error=no_access_to_ai_act_demo');
      }
    };

    // Small delay to ensure tenants are populated after auth redirect
    const timeoutId = setTimeout(checkAccess, 100);
    return () => clearTimeout(timeoutId);
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
        
        if (data.warning) {
          addNotification(data.warning, 'warning');
        } else {
          addNotification('Lineage reconstructed successfully', 'success');
        }
        
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
    if (type === 'lineage') {
      // Export lineage as JSON
      if (!lineage) {
        addNotification('No lineage data available', 'warning');
        return;
      }
      const blob = new Blob([JSON.stringify(lineage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DecisionLineage-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('Lineage exported as JSON', 'success');
      return;
    }

    if (type === 'integrity') {
      // Export evidence integrity report
      const report = {
        completenessScore,
        policyDeviations,
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EvidenceIntegrityReport-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('Evidence Integrity Report exported', 'success');
      return;
    }

    if (type === 'modelcard') {
      // Export model card
      if (!documentationBundle) {
        addNotification('No documentation bundle available', 'warning');
        return;
      }
      const modelCard = {
        modelVersion: documentationBundle.modelVersion,
        modelType: 'Risk Assessment Model',
        purpose: 'Credit decision support',
        trainingData: 'Extracted from logs',
        performanceMetrics: 'Extracted from inference logs',
        limitations: 'Identified from training data analysis',
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(modelCard, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ModelCard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('Model Card exported', 'success');
      return;
    }

    if (type === 'scorecard') {
      // Export compliance scorecard
      const scorecard = {
        annexIV: {
          score: documentationBundle ? 
            (documentationBundle.inputs?.length > 0 ? 20 : 0) +
            (documentationBundle.outputs?.length > 0 ? 20 : 0) +
            (documentationBundle.modelVersion ? 20 : 0) +
            (documentationBundle.oversightChain?.length > 0 ? 20 : 0) +
            (documentationBundle.training ? 20 : 0) : 0,
        },
        annexVIII: {
          score: documentationBundle ?
            (documentationBundle.logCompleteness?.totalLogs > 0 ? 33 : 0) +
            (documentationBundle.attestations?.length > 0 ? 33 : 0) +
            (documentationBundle.monitoring ? 34 : 0) : 0,
        },
        annexXI: {
          score: documentationBundle ?
            (documentationBundle.consentBasis ? 33 : 0) +
            (documentationBundle.policyCompliance ? 33 : 0) +
            (documentationBundle.qualityManagement ? 34 : 0) : 0,
        },
        overallScore: completenessScore,
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(scorecard, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ComplianceScorecard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('Compliance Scorecard exported', 'success');
      return;
    }

    if (!documentationBundle) {
      addNotification('No documentation bundle available', 'warning');
      return;
    }

    const bundle = type === 'full' ? documentationBundle : { ...documentationBundle, type };

    // Safely stringify bundle, handling circular references
    let bundleJson;
    try {
      // Create a set to track seen objects and prevent circular references
      const seen = new WeakSet();
      bundleJson = JSON.stringify(bundle, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      }, 2);
    } catch (error) {
      console.error('Error stringifying bundle:', error);
      addNotification('Error preparing bundle for download', 'error');
      return;
    }

    const blob = new Blob([bundleJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = type === 'full'
      ? `FullTechnicalDocumentationBundle-${new Date().toISOString().split('T')[0]}.json`
      : type === 'training' 
      ? `TrainingDataSummary-${new Date().toISOString().split('T')[0]}.json`
      : type === 'lineage'
      ? `DecisionLineage-${new Date().toISOString().split('T')[0]}.json`
      : type === 'oversight'
      ? `HumanOversightEvidence-${new Date().toISOString().split('T')[0]}.json`
      : `ModelExecutionTrace-${new Date().toISOString().split('T')[0]}.json`;
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
                Compliance documentation as a service for AI providers. Generate Annex IV, VIII, and XI technical documentation
                using the Orbit Logging SDK and Integrity Service.
              </p>
            </div>
            <Link
              href="/apps/stea/orbit"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Back to Orbit
            </Link>
          </div>

          {/* Positioning Block */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                🎯
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-neutral-900 mb-2">
                  Orbit = AI Act Compliance Documentation Infrastructure for High-Risk AI Providers
                </h2>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  This demo highlights our strongest early use case: <span className="font-semibold text-neutral-900">KYC and Identity Verification vendors</span>,
                  who face immediate AI Act obligations and strict enterprise procurement requirements.
                  The same Orbit Logging SDK and Integrity Service apply to any high-risk AI system —
                  <span className="font-semibold text-neutral-900"> KYC is simply the first vertical where demand is urgent and the benefits are clearest</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            {[
              { id: 'kyc', label: 'Orbit and KYC Use Case' },
              { id: 'sdk', label: 'Orbit Logging SDK' },
              { id: 'ingestion', label: 'Data Ingestion' },
              { id: 'dashboard', label: 'Compliance Dashboard' },
              { id: 'workflow', label: 'Compliance Workflow' },
              { id: 'lineage', label: 'Lineage Visualisation' },
              { id: 'bundles', label: 'Documentation Bundles' },
              { id: 'model-risk', label: 'Model Risk Team View' },
              { id: 'security', label: 'Security & Architecture' },
            ].map(tab => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap flex-shrink-0 ${
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Orbit Logging SDK Tab */}
        {activeTab === 'sdk' && (
          <div className="space-y-6">
            <LoggingSDKExplainer />
            <LoggingSDKExamples />
          </div>
        )}

        {/* Why KYC Needs Orbit Tab */}
        {activeTab === 'kyc' && (
          <div className="space-y-6">
            <WhyKYCNeedsOrbitExplainer />
            <AnnexIVRequirementsMapping />
          </div>
        )}

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
            <ComplianceScorecard 
              completenessScore={completenessScore}
              documentationBundle={documentationBundle}
              onExport={downloadBundle}
            />
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
              onExport={downloadBundle}
            />
            <SourceLogsUsed dashboardData={dashboardData} />
            <RegulatoryVersionTracking regulatoryVersions={regulatoryVersions} />
          </div>
        )}

        {/* Compliance Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <ComplianceWorkflowExplainer />
            <ComplianceWorkflow 
              dashboardData={dashboardData}
              policyDeviations={policyDeviations}
              documentationBundle={documentationBundle}
            />
          </div>
        )}

        {/* Lineage Tab */}
        {activeTab === 'lineage' && (
          <div className="space-y-6">
            <LineageVisualisationExplainer />
            <LineageVisualization 
              lineage={lineage} 
              onReconstructLineage={reconstructLineage} 
              loading={loading}
              onExport={downloadBundle}
              addNotification={addNotification}
            />
          </div>
        )}

        {/* Bundles Tab */}
        {activeTab === 'bundles' && (
          <div className="space-y-6">
            <BundlesExplainer />
            <ModelCardGenerator 
              documentationBundle={documentationBundle}
              onExport={downloadBundle}
            />
            <DocumentationBundles 
              documentationBundle={documentationBundle}
              onDownloadBundle={downloadBundle}
              truncateHash={truncateHash}
            />
            <AnnexIVBundlePreview documentationBundle={documentationBundle} />
            <AnnexIVBundleExample />
          </div>
        )}

        {/* Model Risk Team View Tab */}
        {activeTab === 'model-risk' && (
          <div className="space-y-6">
            <ModelRiskTeamViewExplainer />
            <ModelRiskTeamView dashboardData={dashboardData} documentationBundle={documentationBundle} />
          </div>
        )}

        {/* Security & Architecture Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <SecurityArchitectureExplainer />
            <SecurityArchitecture />
          </div>
        )}
      </div>

      {/* Notifications - Centered and Prominent */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-3 w-full max-w-2xl px-4">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`w-full rounded-2xl shadow-2xl p-6 flex items-start gap-4 transform transition-all duration-300 ${
              notification.type === 'success'
                ? 'bg-green-50 border-2 border-green-400'
                : notification.type === 'error'
                ? 'bg-red-50 border-2 border-red-400'
                : notification.type === 'warning'
                ? 'bg-amber-50 border-3 border-amber-500 ring-4 ring-amber-200'
                : 'bg-blue-50 border-2 border-blue-400'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-2xl ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : notification.type === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : notification.type === 'warning' ? '⚠' : 'ℹ'}
            </div>
            <div className="flex-1">
              <p className={`font-bold mb-1 ${
                notification.type === 'success'
                  ? 'text-green-900 text-base'
                  : notification.type === 'error'
                  ? 'text-red-900 text-base'
                  : notification.type === 'warning'
                  ? 'text-amber-900 text-lg'
                  : 'text-blue-900 text-base'
              }`}>
                {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : notification.type === 'warning' ? 'Warning' : 'Info'}
              </p>
              <p className={`${
                notification.type === 'success'
                  ? 'text-green-800 text-sm'
                  : notification.type === 'error'
                  ? 'text-red-800 text-sm'
                  : notification.type === 'warning'
                  ? 'text-amber-800 text-base font-medium'
                  : 'text-blue-800 text-sm'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-700 text-xl font-bold"
            >
              ✕
            </button>
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
            <div id="compliance-actions" className="flex gap-3">
              <button
                onClick={onReconstructLineage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Reconstruct Lineage
              </button>
              <button
                onClick={() => onGenerateBundle()}
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
    { id: 'full', name: 'FullTechnicalDocumentationBundle.json', description: 'Complete AI Act technical documentation bundle', annex: 'Annex IV, VIII, XI' },
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

// Orbit Logging SDK Explainer
function LoggingSDKExplainer() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Orbit Logging SDK</h2>
      <p className="text-neutral-700 mb-6">
        The open standard for Annex IV-ready logging. Most AI vendors don't have the logs needed for compliance. 
        Orbit provides SDKs, schemas, and templates to generate compliant logs in 5 lines of code.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="font-semibold text-green-900 mb-2">Your Defensible Moat</div>
        <div className="text-sm text-green-800 space-y-1">
          <div>✓ Define the schema used by 100+ vendors → become the de facto AI Act logging standard</div>
          <div>✓ Much harder for OneTrust / ServiceNow to copy</div>
          <div>✓ Solves the "Show me the logs" problem by providing the logs</div>
        </div>
      </div>
    </div>
  );
}

// Orbit Logging SDK Examples Component
function LoggingSDKExamples() {
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const examples = {
    python: {
      code: `import { orbit } from "@orbit/sdk";

# Log model execution (Annex IV-ready)
orbit.log_execution(
    model="kyc_risk_v3",
    model_version="3.2.1",
    inputs={
        "applicant_income": 75000,
        "credit_score": 720,
        "debt_to_income": 0.35
    },
    outputs={
        "decision": "APPROVED",
        "confidence": 0.87,
        "risk_score": 0.12
    },
    timestamp=datetime.now()
)

# Log training data summary
orbit.log_training(
    model="kyc_risk_v3",
    data_size="2.3M records",
    period="2020-01-01 to 2023-12-31",
    sources=["internal_applications", "credit_bureau"]
)

# Log human oversight
orbit.log_oversight(
    decision_id="dec_12345",
    reviewer="analyst_jane",
    action="MANUAL_REVIEW",
    reason="confidence < 0.7"
)`,
      description: 'Python SDK - Generate Annex IV-ready logs in 5 lines of code',
    },
    nodejs: {
      code: `import { orbit } from '@orbit/sdk';

// Log model execution (Annex IV-ready)
orbit.logExecution({
  model: 'kyc_risk_v3',
  modelVersion: '3.2.1',
  inputs: {
    applicantIncome: 75000,
    creditScore: 720,
    debtToIncome: 0.35
  },
  outputs: {
    decision: 'APPROVED',
    confidence: 0.87,
    riskScore: 0.12
  },
  timestamp: new Date()
});

// Log training data summary
orbit.logTraining({
  model: 'kyc_risk_v3',
  dataSize: '2.3M records',
  period: '2020-01-01 to 2023-12-31',
  sources: ['internal_applications', 'credit_bureau']
});

// Log human oversight
orbit.logOversight({
  decisionId: 'dec_12345',
  reviewer: 'analyst_jane',
  action: 'MANUAL_REVIEW',
  reason: 'confidence < 0.7'
});`,
      description: 'Node.js SDK - TypeScript support, async/await ready',
    },
    java: {
      code: `import com.orbit.sdk.Orbit;

Orbit orbit = Orbit.getInstance();

// Log model execution (Annex IV-ready)
orbit.logExecution(ExecutionLog.builder()
    .model("kyc_risk_v3")
    .modelVersion("3.2.1")
    .inputs(Map.of(
        "applicantIncome", 75000,
        "creditScore", 720,
        "debtToIncome", 0.35
    ))
    .outputs(Map.of(
        "decision", "APPROVED",
        "confidence", 0.87,
        "riskScore", 0.12
    ))
    .timestamp(Instant.now())
    .build());

// Log training data summary
orbit.logTraining(TrainingLog.builder()
    .model("kyc_risk_v3")
    .dataSize("2.3M records")
    .period("2020-01-01 to 2023-12-31")
    .sources(List.of("internal_applications", "credit_bureau"))
    .build());`,
      description: 'Java SDK - Enterprise-ready with builder pattern',
    },
    go: {
      code: `import "github.com/orbit/orbit-go"

orbit := orbit.NewClient()

// Log model execution (Annex IV-ready)
orbit.LogExecution(orbit.ExecutionLog{
    Model:       "kyc_risk_v3",
    ModelVersion: "3.2.1",
    Inputs: map[string]interface{}{
        "applicantIncome": 75000,
        "creditScore":     720,
        "debtToIncome":    0.35,
    },
    Outputs: map[string]interface{}{
        "decision":   "APPROVED",
        "confidence": 0.87,
        "riskScore":  0.12,
    },
    Timestamp: time.Now(),
})

// Log training data summary
orbit.LogTraining(orbit.TrainingLog{
    Model:    "kyc_risk_v3",
    DataSize: "2.3M records",
    Period:   "2020-01-01 to 2023-12-31",
    Sources:  []string{"internal_applications", "credit_bureau"},
})`,
      description: 'Go SDK - High performance, minimal dependencies',
    },
  };

  const eventTypes = [
    { name: 'MODEL_EXECUTED', description: 'Log model inference execution with inputs/outputs' },
    { name: 'TRAINING_COMPLETED', description: 'Log model training with data summary' },
    { name: 'OVERSIGHT_ACTION', description: 'Log human oversight and intervention' },
    { name: 'VERSION_DEPLOYED', description: 'Log model version changes and approvals' },
    { name: 'DRIFT_DETECTED', description: 'Log data drift and model drift events' },
    { name: 'COMPLIANCE_CHECK', description: 'Log automated compliance validation results' },
  ];

  return (
    <div className="space-y-6">
      {/* Code Examples */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">SDK Examples</h2>
        
        {/* Language Selector */}
        <div className="flex gap-2 mb-4">
          {Object.keys(examples).map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                selectedLanguage === lang
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {lang === 'nodejs' ? 'Node.js' : lang.charAt(0).toUpperCase() + lang.slice(1)}
            </button>
          ))}
        </div>

        {/* Code Block */}
        <div className="bg-neutral-900 rounded-lg p-6 overflow-x-auto">
          <pre className="text-sm text-neutral-100 font-mono">
            <code>{examples[selectedLanguage].code}</code>
          </pre>
        </div>
        <p className="text-sm text-neutral-600 mt-3">{examples[selectedLanguage].description}</p>
      </div>

      {/* Event Types */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Standard Event Types</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Orbit defines a standard schema for Annex IV-compliant logging. These event types cover all requirements.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {eventTypes.map((event, idx) => (
            <div key={idx} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              <div className="font-semibold text-neutral-900 mb-1">{event.name}</div>
              <div className="text-sm text-neutral-600">{event.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Minimum Viable Log Set */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Minimum Viable Log Set</h2>
        <p className="text-sm text-neutral-600 mb-4">
          For Annex IV compliance, you need at minimum these log types:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">✓</div>
            <div>
              <div className="font-semibold text-neutral-900">Model Execution Logs</div>
              <div className="text-sm text-neutral-600">Every inference with inputs, outputs, model version, timestamp</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">✓</div>
            <div>
              <div className="font-semibold text-neutral-900">Training Data Summary</div>
              <div className="text-sm text-neutral-600">Data size, period, sources, preprocessing steps</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">✓</div>
            <div>
              <div className="font-semibold text-neutral-900">Human Oversight Logs</div>
              <div className="text-sm text-neutral-600">Review actions, escalations, intervention decisions</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">✓</div>
            <div>
              <div className="font-semibold text-neutral-900">Version Change Logs</div>
              <div className="text-sm text-neutral-600">Model version deployments, approvals, rollbacks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Installation</h2>
        <div className="space-y-4">
          <div>
            <div className="font-semibold text-neutral-900 mb-2">Python</div>
            <div className="bg-neutral-900 rounded-lg p-4">
              <code className="text-sm text-neutral-100">pip install orbit-sdk</code>
            </div>
          </div>
          <div>
            <div className="font-semibold text-neutral-900 mb-2">Node.js</div>
            <div className="bg-neutral-900 rounded-lg p-4">
              <code className="text-sm text-neutral-100">npm install @orbit/sdk</code>
            </div>
          </div>
          <div>
            <div className="font-semibold text-neutral-900 mb-2">Java</div>
            <div className="bg-neutral-900 rounded-lg p-4">
              <code className="text-sm text-neutral-100">&lt;dependency&gt;<br/>&nbsp;&nbsp;&lt;groupId&gt;com.orbit&lt;/groupId&gt;<br/>&nbsp;&nbsp;&lt;artifactId&gt;orbit-sdk&lt;/artifactId&gt;<br/>&lt;/dependency&gt;</code>
            </div>
          </div>
          <div>
            <div className="font-semibold text-neutral-900 mb-2">Go</div>
            <div className="bg-neutral-900 rounded-lg p-4">
              <code className="text-sm text-neutral-100">go get github.com/orbit/orbit-go</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compliance Workflow Explainer
function ComplianceWorkflowExplainer() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Compliance Workflow</h2>
      <p className="text-neutral-700 mb-6">
        Active governance alerts and compliance tasks powered by Orbit's policy engine. 
        Turn passive logging into active compliance workflows for AI system owners.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-semibold text-blue-900 mb-2">Governance Alerts</div>
        <div className="text-sm text-blue-800 space-y-1">
          <div>✓ Model executed without version change approval</div>
          <div>✓ Training data summary missing</div>
          <div>✓ Feature distribution drift exceeds threshold</div>
          <div>✓ Annex VIII violation: missing input logs for executions</div>
        </div>
      </div>
    </div>
  );
}

// Compliance Workflow Component
function ComplianceWorkflow({ dashboardData, policyDeviations, documentationBundle }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Mock compliance tasks and alerts
  const complianceTasks = [
    {
      id: 1,
      type: 'missing_logs',
      severity: 'high',
      title: 'Missing training data summary for model kyc_risk_v3',
      description: 'Annex IV requires training data documentation. Last training completed 2024-10-15 but no summary logged.',
      action: 'Log training data summary using orbit.log_training()',
      dueDate: '2024-11-20',
      status: 'open',
    },
    {
      id: 2,
      type: 'drift_detected',
      severity: 'medium',
      title: 'Data drift detected in income feature',
      description: 'Feature distribution shift of 12% detected. Threshold: 10%. Requires investigation per Annex VIII.',
      action: 'Review drift analysis and update model if needed',
      dueDate: '2024-11-18',
      status: 'open',
    },
    {
      id: 3,
      type: 'version_change',
      severity: 'medium',
      title: 'Model version change pending approval',
      description: 'Version 3.2.1 deployed but approval workflow not completed. Required for Annex IV compliance.',
      action: 'Complete version change approval workflow',
      dueDate: '2024-11-17',
      status: 'pending',
    },
    {
      id: 4,
      type: 'missing_documentation',
      severity: 'high',
      title: 'Annex IV bundle incomplete for customer submission',
      description: 'Customer requires Annex IV documentation by 2024-11-25. Bundle generation blocked: missing oversight chain logs.',
      action: 'Log oversight events for last 30 days',
      dueDate: '2024-11-22',
      status: 'open',
    },
    {
      id: 5,
      type: 'monitoring_gap',
      severity: 'low',
      title: 'Annex VIII monitoring gap: missing execution logs',
      description: '3 model executions in last 7 days missing input/output logs. Required for post-market monitoring.',
      action: 'Ensure all executions are logged via orbit.log_execution()',
      dueDate: '2024-11-19',
      status: 'open',
    },
  ];

  const filteredTasks = selectedFilter === 'all' 
    ? complianceTasks 
    : complianceTasks.filter(task => task.severity === selectedFilter);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'amber';
      case 'low': return 'blue';
      default: return 'neutral';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'red';
      case 'pending': return 'amber';
      case 'resolved': return 'green';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-900">Compliance Tasks & Alerts</h2>
          <div className="flex gap-2">
            {['all', 'high', 'medium', 'low'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  selectedFilter === filter
                    ? `bg-${getSeverityColor(filter === 'all' ? 'neutral' : filter)}-600 text-white`
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`border-l-4 border-${getSeverityColor(task.severity)}-500 bg-${getSeverityColor(task.severity)}-50 rounded-lg p-5`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold bg-${getSeverityColor(task.severity)}-200 text-${getSeverityColor(task.severity)}-900`}>
                      {task.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold bg-${getStatusColor(task.status)}-200 text-${getStatusColor(task.status)}-900`}>
                      {task.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-neutral-500">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">{task.title}</h3>
                  <p className="text-sm text-neutral-700 mb-3">{task.description}</p>
                  <div className="bg-white rounded p-3 border border-neutral-200">
                    <div className="text-xs font-semibold text-neutral-600 mb-1">Required Action:</div>
                    <div className="text-sm text-neutral-900 font-mono">{task.action}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm text-neutral-600 mb-2">Open Tasks</div>
          <div className="text-3xl font-bold text-neutral-900">
            {complianceTasks.filter(t => t.status === 'open').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm text-neutral-600 mb-2">High Priority</div>
          <div className="text-3xl font-bold text-red-600">
            {complianceTasks.filter(t => t.severity === 'high').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm text-neutral-600 mb-2">Overdue</div>
          <div className="text-3xl font-bold text-amber-600">
            {complianceTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'resolved').length}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm text-neutral-600 mb-2">Resolved (30d)</div>
          <div className="text-3xl font-bold text-green-600">42</div>
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

// Orbit Logging SDK Explainer

// Orbit Logging SDK Examples Component

// Compliance Workflow Explainer

// Compliance Workflow Component

// Lineage Visualization Component
function LineageVisualization({ lineage, onReconstructLineage, loading, onExport, addNotification }) {
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
        <h2 className="text-2xl font-bold text-neutral-900">Data Lineage Visualisation</h2>
        <div className="flex gap-2">
          {lineage && (
            <>
              <button
                onClick={() => onExport && onExport('lineage')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                📥 Export JSON
              </button>
              <button
                onClick={() => {
                  exportLineageToPDF(displayLineage, addNotification);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                📄 Export PDF
              </button>
              <button
                onClick={() => {
                  const svg = document.getElementById('lineage-graph-svg');
                  if (!svg) {
                    if (addNotification) addNotification('No lineage graph to export', 'warning');
                    return;
                  }

                  // Convert SVG to PNG with high resolution
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();

                  // Scale up for high-DPI export (3x resolution for crisp output)
                  const scale = 3;
                  const width = svg.viewBox.baseVal.width || 1000;
                  const height = svg.viewBox.baseVal.height || 500;

                  canvas.width = width * scale;
                  canvas.height = height * scale;

                  img.onload = () => {
                    // Scale the context and draw at higher resolution
                    ctx.scale(scale, scale);
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lineage-${new Date().toISOString().split('T')[0]}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      if (addNotification) addNotification('Lineage graph exported as PNG (high resolution)', 'success');
                    });
                  };

                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                🖼️ Export PNG
              </button>
            </>
          )}
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
      </div>

      {/* SVG Lineage Visualization */}
      <div className="bg-neutral-50 rounded-lg p-8 overflow-x-auto flex justify-center">
        <svg id="lineage-graph-svg" width="100%" height="500" viewBox="0 0 1000 500" className="max-w-full" preserveAspectRatio="xMidYMid meet">
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
            
            // Center the diagram - calculate center offset
            const totalWidth = (displayLineage.nodes.length - 1) * 200 + 100; // Total width of all nodes
            const centerOffset = (1000 - totalWidth) / 2; // Center the nodes in the 1000px viewBox
            
            const x1 = centerOffset + fromIdx * 200;
            const y1 = 280; // Move nodes further down to make room for labels
            const x2 = centerOffset + toIdx * 200;
            const y2 = 280;

            // Convert US to UK spelling
            const edgeLabel = edge.type === 'triggers' ? 'triggers' :
                            edge.type === 'creates' ? 'creates' :
                            edge.type === 'feeds' ? 'feeds' :
                            edge.type === 'produces' ? 'produces' :
                            edge.type;

            // Position label well above the nodes to ensure full visibility - much higher
            const labelY = y1 - 90; // Move much higher to avoid any overlap with nodes

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

          {/* Draw nodes AFTER edges so they appear on top */}
              {displayLineage.nodes?.map((node, idx) => {
                // Center the diagram - calculate center offset
                const totalWidth = (displayLineage.nodes.length - 1) * 200 + 100;
                const centerOffset = (1000 - totalWidth) / 2;
                
                const x = centerOffset + idx * 200;
                const y = 280; // Match the y position used for edges
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
                  fill="#171717"
                  fontSize="12"
                  fontWeight="600"
                >
                  {node.label.split(':')[0]}
                </text>
                {node.label.includes(':') && (
                  <text
                    x={x + 50}
                    y={y - 15}
                    textAnchor="middle"
                    fill="#525252"
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
                    fill="#2563eb"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {node.version}
                  </text>
                )}
                <text
                  x={x + 50}
                  y={y + 25}
                  textAnchor="middle"
                  fill="#737373"
                  fontSize="9"
                >
                  {node.type}
                </text>
                {node.timestamp && (
                  <text
                    x={x + 50}
                    y={y + 45}
                    textAnchor="middle"
                    fill="#a3a3a3"
                    fontSize="8"
                  >
                    {new Date(node.timestamp).toLocaleDateString()}
                  </text>
                )}
              </g>
            );
          })}

          {/* Draw edge labels LAST so they appear on top of everything */}
          {displayLineage.edges?.map((edge, idx) => {
            const fromNode = displayLineage.nodes.find(n => n.id === edge.from);
            const toNode = displayLineage.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            
            const fromIdx = displayLineage.nodes.indexOf(fromNode);
            const toIdx = displayLineage.nodes.indexOf(toNode);
            
            // Center the diagram - calculate center offset
            const totalWidth = (displayLineage.nodes.length - 1) * 200 + 100;
            const centerOffset = (1000 - totalWidth) / 2;
            
            const x1 = centerOffset + fromIdx * 200;
            const y1 = 280;
            const x2 = centerOffset + toIdx * 200;

            // Convert US to UK spelling
            const edgeLabel = edge.type === 'triggers' ? 'triggers' :
                            edge.type === 'creates' ? 'creates' :
                            edge.type === 'feeds' ? 'feeds' :
                            edge.type === 'produces' ? 'produces' :
                            edge.type;

            // Position label well above the nodes
            const labelY = y1 - 90;

            return (
              <g key={`label-${idx}`}>
                {/* Background rectangle for text to ensure visibility */}
                <rect
                  x={(x1 + x2) / 2 - 50}
                  y={labelY - 12}
                  width="100"
                  height="24"
                  fill="white"
                  fillOpacity="1"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                  rx="6"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={labelY + 4}
                  textAnchor="middle"
                  fill="#1f2937"
                  fontSize="13"
                  fontWeight="700"
                >
                  {edgeLabel}
                </text>
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
function LineageVisualisationExplainer() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Data Lineage Visualisation</h2>
      <p className="text-neutral-700 mb-6">
        Orbit reconstructs and visualises complete data lineage from ingested logs, showing the flow from input to decision. 
        This is your Datadog flame graph for AI Act compliance — the "wow moment" that demonstrates full traceability.
      </p>
    </div>
  );
}

// Evidence Integrity Report
function EvidenceIntegrityReport({ completenessScore, policyDeviations, dashboardData, onExport }) {
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
        <div className="flex gap-2">
          <button
            onClick={() => onExport && onExport('integrity')}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            📥 Export PDF
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {expanded ? '▼ Collapse' : '▶ Expand'}
          </button>
        </div>
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
function ModelCardGenerator({ documentationBundle, onExport }) {
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
        <div className="flex gap-2">
          <button
            onClick={() => onExport && onExport('modelcard')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            📥 Export PDF
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {expanded ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
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

// Compliance Scorecard Component
function ComplianceScorecard({ completenessScore, documentationBundle, onExport }) {
  // Calculate Annex-specific scores
  const annexIVScore = documentationBundle ? 
    (documentationBundle.inputs?.length > 0 ? 20 : 0) +
    (documentationBundle.outputs?.length > 0 ? 20 : 0) +
    (documentationBundle.modelVersion ? 20 : 0) +
    (documentationBundle.oversightChain?.length > 0 ? 20 : 0) +
    (documentationBundle.training ? 20 : 0)
    : 0;
  
  const annexVIIIScore = documentationBundle ?
    (documentationBundle.logCompleteness?.totalLogs > 0 ? 33 : 0) +
    (documentationBundle.attestations?.length > 0 ? 33 : 0) +
    (documentationBundle.monitoring ? 34 : 0)
    : 0;
  
  const annexXIScore = documentationBundle ?
    (documentationBundle.consentBasis ? 33 : 0) +
    (documentationBundle.policyCompliance ? 33 : 0) +
    (documentationBundle.qualityManagement ? 34 : 0)
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'amber';
    return 'red';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Complete';
    if (score >= 60) return 'Partial';
    return 'Incomplete';
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Full Compliance Scorecard</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Executive heatmap showing AI Act Annex compliance status
          </p>
        </div>
        <button
          onClick={() => onExport && onExport('scorecard')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          📥 Export PDF
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Annex IV */}
        <div className={`border-2 rounded-lg p-6 ${
          getScoreColor(annexIVScore) === 'green' ? 'border-green-500 bg-green-50' :
          getScoreColor(annexIVScore) === 'amber' ? 'border-amber-500 bg-amber-50' :
          'border-red-500 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">Annex IV</h3>
            <div className={`w-4 h-4 rounded-full ${
              getScoreColor(annexIVScore) === 'green' ? 'bg-green-500' :
              getScoreColor(annexIVScore) === 'amber' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></div>
          </div>
          <div className="text-4xl font-bold text-neutral-900 mb-2">{annexIVScore}%</div>
          <div className="text-sm text-neutral-600 mb-4">{getScoreLabel(annexIVScore)}</div>
          <div className="text-xs text-neutral-700">
            <div className="font-semibold mb-2">Technical Documentation:</div>
            <div className="space-y-1">
              <div>• Inputs: {documentationBundle?.inputs?.length > 0 ? '✓' : '✗'}</div>
              <div>• Outputs: {documentationBundle?.outputs?.length > 0 ? '✓' : '✗'}</div>
              <div>• Model Version: {documentationBundle?.modelVersion ? '✓' : '✗'}</div>
              <div>• Oversight Chain: {documentationBundle?.oversightChain?.length > 0 ? '✓' : '✗'}</div>
              <div>• Training Data: {documentationBundle?.training ? '✓' : '✗'}</div>
            </div>
          </div>
        </div>

        {/* Annex VIII */}
        <div className={`border-2 rounded-lg p-6 ${
          getScoreColor(annexVIIIScore) === 'green' ? 'border-green-500 bg-green-50' :
          getScoreColor(annexVIIIScore) === 'amber' ? 'border-amber-500 bg-amber-50' :
          'border-red-500 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">Annex VIII</h3>
            <div className={`w-4 h-4 rounded-full ${
              getScoreColor(annexVIIIScore) === 'green' ? 'bg-green-500' :
              getScoreColor(annexVIIIScore) === 'amber' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></div>
          </div>
          <div className="text-4xl font-bold text-neutral-900 mb-2">{annexVIIIScore}%</div>
          <div className="text-sm text-neutral-600 mb-4">{getScoreLabel(annexVIIIScore)}</div>
          <div className="text-xs text-neutral-700">
            <div className="font-semibold mb-2">Post-Market Monitoring:</div>
            <div className="space-y-1">
              <div>• Log Completeness: {documentationBundle?.logCompleteness?.totalLogs > 0 ? '✓' : '✗'}</div>
              <div>• Attestations: {documentationBundle?.attestations?.length > 0 ? '✓' : '✗'}</div>
              <div>• Monitoring Evidence: {documentationBundle?.monitoring ? '✓' : '✗'}</div>
            </div>
          </div>
        </div>

        {/* Annex XI */}
        <div className={`border-2 rounded-lg p-6 ${
          getScoreColor(annexXIScore) === 'green' ? 'border-green-500 bg-green-50' :
          getScoreColor(annexXIScore) === 'amber' ? 'border-amber-500 bg-amber-50' :
          'border-red-500 bg-red-50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900">Annex XI</h3>
            <div className={`w-4 h-4 rounded-full ${
              getScoreColor(annexXIScore) === 'green' ? 'bg-green-500' :
              getScoreColor(annexXIScore) === 'amber' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></div>
          </div>
          <div className="text-4xl font-bold text-neutral-900 mb-2">{annexXIScore}%</div>
          <div className="text-sm text-neutral-600 mb-4">{getScoreLabel(annexXIScore)}</div>
          <div className="text-xs text-neutral-700">
            <div className="font-semibold mb-2">Quality Management:</div>
            <div className="space-y-1">
              <div>• Consent Basis: {documentationBundle?.consentBasis ? '✓' : '✗'}</div>
              <div>• Policy Compliance: {documentationBundle?.policyCompliance ? '✓' : '✗'}</div>
              <div>• QMS Artefacts: {documentationBundle?.qualityManagement ? '✓' : '✗'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Orbit Logging SDK Explainer

// Orbit Logging SDK Examples Component

// Compliance Workflow Explainer

// Compliance Workflow Component

// Source Logs Used Component
function SourceLogsUsed({ dashboardData }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Source Logs Used</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Ingestion sources confirmed for Annex VIII post-market monitoring evidence
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border-2 rounded-lg p-4 ${
          dashboardData.sourceLogsUsed?.s3 
            ? 'border-green-500 bg-green-50' 
            : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-neutral-900">AWS S3</div>
            {dashboardData.sourceLogsUsed?.s3 ? (
              <span className="text-green-600 font-bold">✓</span>
            ) : (
              <span className="text-neutral-400">○</span>
            )}
          </div>
          <div className="text-xs text-neutral-600">
            {dashboardData.sourceLogsUsed?.s3 ? 'Ingestion complete' : 'Not configured'}
          </div>
        </div>

        <div className={`border-2 rounded-lg p-4 ${
          dashboardData.sourceLogsUsed?.pubsub 
            ? 'border-green-500 bg-green-50' 
            : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-neutral-900">Google Pub/Sub</div>
            {dashboardData.sourceLogsUsed?.pubsub ? (
              <span className="text-green-600 font-bold">✓</span>
            ) : (
              <span className="text-neutral-400">○</span>
            )}
          </div>
          <div className="text-xs text-neutral-600">
            {dashboardData.sourceLogsUsed?.pubsub ? 'Ingestion complete' : 'Not configured'}
          </div>
        </div>

        <div className={`border-2 rounded-lg p-4 ${
          dashboardData.sourceLogsUsed?.onprem 
            ? 'border-green-500 bg-green-50' 
            : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-neutral-900">On-Prem Agent</div>
            {dashboardData.sourceLogsUsed?.onprem ? (
              <span className="text-green-600 font-bold">✓</span>
            ) : (
              <span className="text-neutral-400">○</span>
            )}
          </div>
          <div className="text-xs text-neutral-600">
            {dashboardData.sourceLogsUsed?.onprem ? 'Ingestion complete' : 'Not configured'}
          </div>
        </div>

        <div className={`border-2 rounded-lg p-4 ${
          dashboardData.sourceLogsUsed?.azure 
            ? 'border-green-500 bg-green-50' 
            : 'border-neutral-200 bg-neutral-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-neutral-900">Azure Blob</div>
            {dashboardData.sourceLogsUsed?.azure ? (
              <span className="text-green-600 font-bold">✓</span>
            ) : (
              <span className="text-neutral-400">○</span>
            )}
          </div>
          <div className="text-xs text-neutral-600">
            {dashboardData.sourceLogsUsed?.azure ? 'Ingestion complete' : 'Not configured'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Orbit Logging SDK Explainer

// Orbit Logging SDK Examples Component

// Compliance Workflow Explainer

// Compliance Workflow Component

// Regulatory Version Tracking Component
function RegulatoryVersionTracking({ regulatoryVersions }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Regulatory Version Tracking</h2>
      <p className="text-sm text-neutral-600 mb-4">
        Version tracking protects compliance as regulations and interpretations evolve
      </p>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div className="text-xs text-neutral-500 mb-1">Regulation Version</div>
          <div className="font-semibold text-neutral-900">{regulatoryVersions.regulationVersion}</div>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div className="text-xs text-neutral-500 mb-1">Template Version</div>
          <div className="font-semibold text-neutral-900">{regulatoryVersions.templateVersion}</div>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div className="text-xs text-neutral-500 mb-1">Interpretation Version</div>
          <div className="font-semibold text-neutral-900">{regulatoryVersions.interpretationVersion}</div>
        </div>
        <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
          <div className="text-xs text-neutral-500 mb-1">Orbit Version</div>
          <div className="font-semibold text-neutral-900">{regulatoryVersions.orbitVersion}</div>
        </div>
      </div>
      <div className="mt-4 text-xs text-neutral-500">
        These versions are included in all documentation bundles to ensure regulatory traceability and protect against future changes.
      </div>
    </div>
  );
}

// Export Lineage to PDF function
function exportLineageToPDF(lineage, addNotification) {
  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (addNotification) addNotification('Please allow popups to export PDF', 'warning');
      return;
    }

    const nodes = lineage?.nodes || [];
    const edges = lineage?.edges || [];

    // Build HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Lineage Visualisation - ${new Date().toLocaleDateString()}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
            body { margin: 0; }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #1f2937;
          }
          h1 {
            color: #111827;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          .metadata {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .lineage-diagram {
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          .node {
            display: inline-block;
            margin: 10px;
            padding: 15px 20px;
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            min-width: 150px;
            text-align: center;
          }
          .node.user { border-color: #8b5cf6; }
          .node.process { border-color: #3b82f6; }
          .node.data { border-color: #10b981; }
          .node.model { border-color: #f59e0b; }
          .node.decision { border-color: #ef4444; }
          .arrow {
            display: inline-block;
            margin: 0 10px;
            font-size: 24px;
            color: #3b82f6;
          }
          .edge-details {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .edge-item {
            padding: 10px;
            margin: 5px 0;
            background: white;
            border-left: 3px solid #3b82f6;
            padding-left: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f3f4f6;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <h1>Data Lineage Visualisation Report</h1>
        
        <div class="metadata">
          <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
          <strong>Total Nodes:</strong> ${nodes.length}<br>
          <strong>Total Edges:</strong> ${edges.length}<br>
          <strong>Reconstructed At:</strong> ${lineage?.reconstructedAt ? new Date(lineage.reconstructedAt).toLocaleString() : 'N/A'}
        </div>

        <div class="lineage-diagram">
          <h2>Lineage Flow</h2>
          <div style="text-align: center; padding: 20px;">
    `;

    // Add nodes and edges in sequence
    nodes.forEach((node, idx) => {
      if (idx > 0) {
        htmlContent += `<span class="arrow">→</span>`;
      }
      htmlContent += `
        <div class="node ${node.type}">
          <strong>${node.label}</strong><br>
          <small>${node.type}</small>${node.version ? `<br><small>${node.version}</small>` : ''}
        </div>
      `;
    });

    htmlContent += `
          </div>
        </div>

        <div class="edge-details">
          <h2>Lineage Details</h2>
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
    `;

    edges.forEach(edge => {
      htmlContent += `
        <tr>
          <td>${edge.from}</td>
          <td>${edge.to}</td>
          <td>${edge.type}</td>
          <td>${edge.evidence || 'Automated reconstruction'}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          Generated by Orbit AI Act Technical Documentation System
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      if (addNotification) addNotification('PDF export opened in print dialog', 'success');
    }, 250);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    if (addNotification) addNotification('Error generating PDF: ' + error.message, 'error');
  }
}

// Annex IV Bundle Example Component
function AnnexIVBundleExample() {
  const [expanded, setExpanded] = useState(false);

  const exampleBundle = {
    metadata: {
      version: '1.0',
      generatedAt: '2024-11-17T10:30:00Z',
      regulationVersion: 'EU AI Act 2024/1689',
      templateVersion: '1.2.0',
    },
    modelInformation: {
      name: 'Credit Risk Assessment Model v2.3',
      purpose: 'Automated credit decision support for loan applications',
      type: 'High-risk AI system',
      classification: 'Annex III - Creditworthiness assessment',
    },
    technicalSpecifications: {
      architecture: 'Gradient Boosting Machine (XGBoost)',
      inputFeatures: [
        'Applicant income (last 12 months)',
        'Credit history score (0-850)',
        'Debt-to-income ratio',
        'Employment status and duration',
        'Previous loan repayment history',
        'KYC verification status',
        'Address verification status',
      ],
      outputClasses: ['APPROVED', 'REJECTED', 'MANUAL_REVIEW'],
      performanceMetrics: {
        accuracy: '0.87',
        precision: '0.89',
        recall: '0.85',
        f1Score: '0.87',
        aucRoc: '0.92',
      },
      trainingData: {
        size: '2.3M records',
        period: '2020-01-01 to 2023-12-31',
        sources: ['Internal loan applications', 'External credit bureau data'],
        preprocessing: 'Normalization, feature engineering, outlier removal',
      },
    },
    humanOversight: {
      reviewProcess: 'All REJECTED decisions require manual review by credit analyst',
      escalationRules: 'Decisions with confidence < 0.7 escalate to senior analyst',
      interventionLog: '12% of decisions manually reviewed in last quarter',
      oversightChain: [
        'Automated decision → Confidence threshold check',
        'Low confidence → Escalation to analyst',
        'Analyst review → Final decision',
        'Decision logged → Audit trail created',
      ],
    },
    monitoringAndMaintenance: {
      monitoringFrequency: 'Daily performance monitoring',
      driftDetection: 'Weekly data drift checks, monthly model drift assessment',
      retrainingSchedule: 'Quarterly retraining with latest 12 months data',
      lastRetraining: '2024-10-15',
      nextScheduledRetraining: '2025-01-15',
      alertThresholds: {
        accuracyDrop: '> 5% decrease triggers investigation',
        dataDrift: '> 10% feature distribution change triggers review',
        predictionDrift: '> 15% output distribution change triggers review',
      },
    },
    riskAssessment: {
      identifiedRisks: [
        'Potential bias in training data towards certain demographic groups',
        'Model performance degrades for applicants with limited credit history',
        'External economic factors may impact model accuracy',
      ],
      mitigationMeasures: [
        'Regular bias audits and fairness testing',
        'Human oversight for edge cases',
        'Continuous monitoring and alerting',
        'Regular retraining with updated data',
      ],
      residualRisks: 'Low - mitigated through oversight and monitoring',
    },
    compliance: {
      annexIV: 'Complete - All technical documentation provided',
      annexVIII: 'Complete - Post-market monitoring evidence included',
      annexXI: 'Complete - Quality management system artefacts documented',
      dataProtection: 'GDPR compliant - Data minimization and purpose limitation applied',
      consentBasis: 'Legitimate interest for credit assessment (GDPR Art. 6(1)(f))',
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Annex IV Bundle Example</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Realistic example of a complete Annex IV technical documentation bundle
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {expanded ? '▼ Collapse' : '▶ Expand Example'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-6 mt-6">
          {/* Model Information */}
          <div className="border border-neutral-200 rounded-lg p-5 bg-blue-50">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">Model Information</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-neutral-600">Name</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.modelInformation.name}</div>
              </div>
              <div>
                <div className="text-neutral-600">Purpose</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.modelInformation.purpose}</div>
              </div>
              <div>
                <div className="text-neutral-600">Type</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.modelInformation.type}</div>
              </div>
              <div>
                <div className="text-neutral-600">Classification</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.modelInformation.classification}</div>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="border border-neutral-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">Technical Specifications</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2">Architecture</div>
                <div className="text-sm text-neutral-900">{exampleBundle.technicalSpecifications.architecture}</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2">Input Features ({exampleBundle.technicalSpecifications.inputFeatures.length})</div>
                <ul className="text-sm text-neutral-900 list-disc list-inside space-y-1">
                  {exampleBundle.technicalSpecifications.inputFeatures.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2">Output Classes</div>
                <div className="flex gap-2">
                  {exampleBundle.technicalSpecifications.outputClasses.map((cls, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2">Performance Metrics</div>
                <div className="grid grid-cols-5 gap-3 text-sm">
                  {Object.entries(exampleBundle.technicalSpecifications.performanceMetrics).map(([key, value]) => (
                    <div key={key} className="bg-neutral-50 rounded p-2">
                      <div className="text-neutral-600 text-xs">{key}</div>
                      <div className="font-bold text-neutral-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2">Training Data</div>
                <div className="text-sm text-neutral-900 space-y-1">
                  <div>• Size: {exampleBundle.technicalSpecifications.trainingData.size}</div>
                  <div>• Period: {exampleBundle.technicalSpecifications.trainingData.period}</div>
                  <div>• Sources: {exampleBundle.technicalSpecifications.trainingData.sources.join(', ')}</div>
                  <div>• Preprocessing: {exampleBundle.technicalSpecifications.trainingData.preprocessing}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Human Oversight */}
          <div className="border border-neutral-200 rounded-lg p-5 bg-green-50">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">Human Oversight</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-semibold text-neutral-700">Review Process</div>
                <div className="text-neutral-900">{exampleBundle.humanOversight.reviewProcess}</div>
              </div>
              <div>
                <div className="font-semibold text-neutral-700">Escalation Rules</div>
                <div className="text-neutral-900">{exampleBundle.humanOversight.escalationRules}</div>
              </div>
              <div>
                <div className="font-semibold text-neutral-700">Intervention Rate</div>
                <div className="text-neutral-900">{exampleBundle.humanOversight.interventionLog}</div>
              </div>
              <div>
                <div className="font-semibold text-neutral-700 mb-2">Oversight Chain</div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-900">
                  {exampleBundle.humanOversight.oversightChain.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Monitoring and Maintenance */}
          <div className="border border-neutral-200 rounded-lg p-5">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">Monitoring & Maintenance</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-neutral-600">Monitoring Frequency</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.monitoringAndMaintenance.monitoringFrequency}</div>
              </div>
              <div>
                <div className="text-neutral-600">Drift Detection</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.monitoringAndMaintenance.driftDetection}</div>
              </div>
              <div>
                <div className="text-neutral-600">Retraining Schedule</div>
                <div className="font-semibold text-neutral-900">{exampleBundle.monitoringAndMaintenance.retrainingSchedule}</div>
              </div>
              <div>
                <div className="text-neutral-600">Last Retraining</div>
                <div className="font-semibold text-neutral-900">{new Date(exampleBundle.monitoringAndMaintenance.lastRetraining).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-neutral-600">Next Scheduled</div>
                <div className="font-semibold text-neutral-900">{new Date(exampleBundle.monitoringAndMaintenance.nextScheduledRetraining).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-semibold text-neutral-700 mb-2">Alert Thresholds</div>
              <div className="space-y-1 text-sm text-neutral-900">
                {Object.entries(exampleBundle.monitoringAndMaintenance.alertThresholds).map(([key, value]) => (
                  <div key={key}>• {key.replace(/([A-Z])/g, ' $1').trim()}: {value}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="border border-neutral-200 rounded-lg p-5 bg-amber-50">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">Risk Assessment</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-semibold text-neutral-700 mb-2">Identified Risks</div>
                <ul className="list-disc list-inside space-y-1 text-neutral-900">
                  {exampleBundle.riskAssessment.identifiedRisks.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-neutral-700 mb-2">Mitigation Measures</div>
                <ul className="list-disc list-inside space-y-1 text-neutral-900">
                  {exampleBundle.riskAssessment.mitigationMeasures.map((measure, idx) => (
                    <li key={idx}>{measure}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-semibold text-neutral-700">Residual Risk</div>
                <div className="text-neutral-900">{exampleBundle.riskAssessment.residualRisks}</div>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="border border-neutral-200 rounded-lg p-5 bg-green-50">
            <h3 className="text-lg font-bold text-neutral-900 mb-3">Compliance Status</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {Object.entries(exampleBundle.compliance).map(([key, value]) => (
                <div key={key}>
                  <div className="text-neutral-600">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="font-semibold text-neutral-900">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Model Risk Team View Explainer
function ModelRiskTeamViewExplainer() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Model Risk Team View</h2>
      <p className="text-neutral-700 mb-6">
        Specialised dashboard for Model Risk teams, focusing on model performance, drift detection, and risk metrics. 
        This view provides the metrics and insights needed for ongoing model governance and risk management.
      </p>
    </div>
  );
}

// Model Risk Team View Component
function ModelRiskTeamView({ dashboardData, documentationBundle }) {
  // Mock data for model risk metrics
  const modelRiskData = {
    modelDrift: {
      current: 0.12,
      threshold: 0.15,
      status: 'normal', // normal, warning, critical
      trend: 'stable', // increasing, stable, decreasing
      lastChecked: '2024-11-17T09:00:00Z',
    },
    dataDrift: {
      current: 0.08,
      threshold: 0.10,
      status: 'normal',
      trend: 'stable',
      lastChecked: '2024-11-17T09:00:00Z',
    },
    modelVersionCount: 12,
    retrainingFrequency: {
      schedule: 'Quarterly',
      lastRetraining: '2024-10-15',
      nextScheduled: '2025-01-15',
      daysUntilNext: 59,
    },
    performanceMetrics: {
      accuracy: 0.87,
      precision: 0.89,
      recall: 0.85,
      f1Score: 0.87,
    },
    alerts: [
      { type: 'data_drift', severity: 'low', message: 'Minor feature distribution shift detected in income feature', date: '2024-11-15' },
      { type: 'performance', severity: 'medium', message: 'Accuracy decreased by 2% in last week', date: '2024-11-14' },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'green';
      case 'warning': return 'amber';
      case 'critical': return 'red';
      default: return 'neutral';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'blue';
      case 'medium': return 'amber';
      case 'high': return 'red';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-neutral-600">Model Drift</div>
            <div className={`w-3 h-3 rounded-full bg-${getStatusColor(modelRiskData.modelDrift.status)}-500`}></div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">
            {(modelRiskData.modelDrift.current * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-neutral-500">
            Threshold: {(modelRiskData.modelDrift.threshold * 100).toFixed(0)}% • {modelRiskData.modelDrift.trend}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-neutral-600">Data Drift</div>
            <div className={`w-3 h-3 rounded-full bg-${getStatusColor(modelRiskData.dataDrift.status)}-500`}></div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">
            {(modelRiskData.dataDrift.current * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-neutral-500">
            Threshold: {(modelRiskData.dataDrift.threshold * 100).toFixed(0)}% • {modelRiskData.dataDrift.trend}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm text-neutral-600 mb-2">Model Versions</div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">
            {modelRiskData.modelVersionCount}
          </div>
          <div className="text-xs text-neutral-500">
            Active versions tracked
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm text-neutral-600 mb-2">Retraining Frequency</div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">
            {modelRiskData.retrainingFrequency.schedule}
          </div>
          <div className="text-xs text-neutral-500">
            Next: {new Date(modelRiskData.retrainingFrequency.nextScheduled).toLocaleDateString()} ({modelRiskData.retrainingFrequency.daysUntilNext} days)
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Performance Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {Object.entries(modelRiskData.performanceMetrics).map(([key, value]) => (
            <div key={key} className="bg-neutral-50 rounded-lg p-4">
              <div className="text-sm text-neutral-600 mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="text-2xl font-bold text-neutral-900">{(value * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Drift Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Model Drift Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Current Drift</span>
              <span className="font-semibold text-neutral-900">{(modelRiskData.modelDrift.current * 100).toFixed(2)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className={`bg-${getStatusColor(modelRiskData.modelDrift.status)}-500 h-2 rounded-full`}
                style={{ width: `${Math.min((modelRiskData.modelDrift.current / modelRiskData.modelDrift.threshold) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>0%</span>
              <span>Threshold: {(modelRiskData.modelDrift.threshold * 100).toFixed(0)}%</span>
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              Last checked: {new Date(modelRiskData.modelDrift.lastChecked).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Data Drift Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Current Drift</span>
              <span className="font-semibold text-neutral-900">{(modelRiskData.dataDrift.current * 100).toFixed(2)}%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className={`bg-${getStatusColor(modelRiskData.dataDrift.status)}-500 h-2 rounded-full`}
                style={{ width: `${Math.min((modelRiskData.dataDrift.current / modelRiskData.dataDrift.threshold) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>0%</span>
              <span>Threshold: {(modelRiskData.dataDrift.threshold * 100).toFixed(0)}%</span>
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              Last checked: {new Date(modelRiskData.dataDrift.lastChecked).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {modelRiskData.alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {modelRiskData.alerts.map((alert, idx) => (
              <div key={idx} className={`border-l-4 border-${getSeverityColor(alert.severity)}-500 bg-${getSeverityColor(alert.severity)}-50 rounded p-4`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-neutral-900">{alert.message}</div>
                    <div className="text-sm text-neutral-600 mt-1">
                      {alert.type.replace(/_/g, ' ')} • {new Date(alert.date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold bg-${getSeverityColor(alert.severity)}-200 text-${getSeverityColor(alert.severity)}-900`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retraining Schedule */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Retraining Schedule</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="text-sm text-neutral-600 mb-1">Schedule</div>
            <div className="font-semibold text-neutral-900">{modelRiskData.retrainingFrequency.schedule}</div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="text-sm text-neutral-600 mb-1">Last Retraining</div>
            <div className="font-semibold text-neutral-900">{new Date(modelRiskData.retrainingFrequency.lastRetraining).toLocaleDateString()}</div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="text-sm text-neutral-600 mb-1">Next Scheduled</div>
            <div className="font-semibold text-neutral-900">{new Date(modelRiskData.retrainingFrequency.nextScheduled).toLocaleDateString()}</div>
            <div className="text-xs text-neutral-500 mt-1">{modelRiskData.retrainingFrequency.daysUntilNext} days remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Orbit Logging SDK Explainer

// Orbit Logging SDK Examples Component

// Compliance Workflow Explainer

// Compliance Workflow Component

// Why KYC Needs Orbit Explainer
function WhyKYCNeedsOrbitExplainer() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Demo Instructions */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-300 p-4 md:p-6 shadow-lg">
        <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-3">How to Use This Demo</h2>
        <p className="text-sm md:text-base text-neutral-700 mb-4">
          This demo uses <span className="font-semibold text-blue-900">KYC and Identity Verification as an example high-risk AI system</span>.
          See how Orbit helps AI providers achieve EU AI Act compliance through automated documentation generation. Follow these steps:
        </p>
        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
            <div className="text-sm md:text-base text-neutral-800">
              <strong>Read this page</strong> to understand why KYC providers need Orbit for AI Act compliance
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <div className="text-sm md:text-base text-neutral-800">
              <strong>Explore the tabs</strong> above to see how Orbit logging SDK works and how data flows
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
            <div className="text-sm md:text-base text-neutral-800">
              <strong>Try the interactive demo</strong> by going to the{' '}
              <button
                onClick={() => {
                  const dashboardTab = document.querySelector('[data-tab="dashboard"]');
                  if (dashboardTab) dashboardTab.click();
                  setTimeout(() => {
                    document.getElementById('compliance-actions')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                Compliance Dashboard
              </button>
              {' '}tab and using the "Reconstruct Lineage" and "Generate Bundle" buttons
            </div>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-3">
          <p className="text-xs md:text-sm text-neutral-600">
            <strong>Note:</strong> This is a demonstration environment with sample data. In production, Orbit processes real logs from your KYC systems.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-4 md:p-6 lg:p-8">
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-3 md:mb-4">Orbit and KYC Use Case</h2>
        <p className="text-sm md:text-base text-neutral-700 mb-4 md:mb-6">
          KYC (Know Your Customer) and Identity Verification providers operate high-risk AI systems that are subject to 
          the EU AI Act. These systems make critical decisions about customer identity, fraud risk, and compliance status. 
          Orbit provides the audit trail infrastructure needed for AI Act compliance.
        </p>
        
        {/* Who Uses Orbit in KYC Organisations */}
        <div className="bg-white rounded-lg border border-amber-200 p-4 md:p-5 mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-2 md:mb-3">Who Orbit is for inside KYC companies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">CTO / VP Engineering</div>
                <div className="text-xs text-neutral-600">wants low friction instrumentation</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">Head of Data Science</div>
                <div className="text-xs text-neutral-600">needs reproducible lineage</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">Head of Compliance</div>
                <div className="text-xs text-neutral-600">needs Annex IV-ready packs</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
              <div>
                <div className="font-semibold text-neutral-900 text-sm">PM for Identity Verification</div>
                <div className="text-xs text-neutral-600">needs RFP support</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-lg border border-amber-200 p-3 md:p-4">
            <div className="font-semibold text-sm md:text-base text-neutral-900 mb-1 md:mb-2">High-Risk AI Systems</div>
            <div className="text-xs md:text-sm text-neutral-700">
              KYC systems are classified as high-risk under the AI Act because they make decisions affecting fundamental rights, 
              including access to financial services and identity verification.
            </div>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-3 md:p-4">
            <div className="font-semibold text-sm md:text-base text-neutral-900 mb-1 md:mb-2">Regulatory Requirements</div>
            <div className="text-xs md:text-sm text-neutral-700">
              KYC providers must demonstrate compliance with Annex IV technical documentation requirements, including 
              complete audit trails of all AI decisions, model versions, and human oversight.
            </div>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-3 md:p-4">
            <div className="font-semibold text-sm md:text-base text-neutral-900 mb-1 md:mb-2">Customer Demands</div>
            <div className="text-xs md:text-sm text-neutral-700">
              Financial institutions and regulated entities require proof of AI Act compliance from their KYC vendors. 
              Without proper logging, you cannot generate the required documentation.
            </div>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-3 md:p-4">
            <div className="font-semibold text-sm md:text-base text-neutral-900 mb-1 md:mb-2">Competitive Advantage</div>
            <div className="text-xs md:text-sm text-neutral-700">
              Orbit enables KYC providers to differentiate by offering regulator-ready compliance documentation, 
              reducing customer onboarding friction and audit burden.
            </div>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
        <div className="font-semibold text-sm md:text-base text-blue-900 mb-1 md:mb-2">The Problem</div>
        <div className="text-xs md:text-sm text-blue-800">
          Most KYC providers don't have the logging infrastructure needed for AI Act compliance. They log basic events 
          but lack the structured, Annex IV-ready audit trail that Orbit provides. Without Orbit, generating compliance 
          documentation requires manual work and may be incomplete.
        </div>
      </div>

      {/* Trigger Scenarios */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-2 md:mb-3">Common Trigger Scenarios</h3>
        <p className="text-xs md:text-sm text-neutral-700 mb-3 md:mb-4 font-medium">When do KYC vendors realise they need Orbit?</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
            <div className="text-xs md:text-sm text-neutral-800">A bank asks for Annex IV compliance evidence during procurement</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
            <div className="text-xs md:text-sm text-neutral-800">A customer's internal audit demands execution-level logs</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
            <div className="text-xs md:text-sm text-neutral-800">Risk committee requests full lineage + oversight documentation</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
            <div className="text-xs md:text-sm text-neutral-800">Enterprise clients delay onboarding due to missing compliance documents</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
            <div className="text-xs md:text-sm text-neutral-800">Expansion into EU triggers legal review for AI Act readiness</div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5">•</div>
            <div className="text-xs md:text-sm text-neutral-800">ISO 42001 (AI Management Standard) requests detailed audit trails</div>
          </div>
        </div>
        <div className="mt-3 md:mt-4 text-xs md:text-sm font-semibold text-purple-900">Orbit solves all of these immediately.</div>
      </div>

      {/* Why Not Build This Yourself */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-5 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-2 md:mb-3">Why Not Build This Yourself?</h3>
        <p className="text-xs md:text-sm text-neutral-700 mb-3 md:mb-4">Building AI Act-ready logging internally typically takes:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
          <div>
            <div className="font-semibold text-neutral-900 mb-2 text-xs md:text-sm">KYC teams that attempt internal AI Act readiness typically face:</div>
            <div className="space-y-2 text-xs md:text-sm text-neutral-700">
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>2–6 months engineer time to design logging schema</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Legal/compliance rewrites from each new Annex revision</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>No hash-chain integrity</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>No lineage visualisation</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>Documentation bundle creation still manual</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">✗</span>
                <span>No consistency across models or teams</span>
              </div>
            </div>
          </div>
          <div>
            <div className="font-semibold text-neutral-900 mb-2 text-xs md:text-sm">Orbit gives you:</div>
            <div className="space-y-2 text-xs md:text-sm text-neutral-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Standardised logs</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Standardised Annex outputs</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Zero engineering maintenance</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Independent integrity layer</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Automated documentation engine</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-xs md:text-sm font-semibold text-red-900">Orbit replaces all of this with a single SDK and automated documentation engine.</div>
      </div>

      {/* Orbit in KYC Architecture Diagram */}
      <div className="bg-white rounded-lg border-2 border-neutral-300 p-4 md:p-6 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-3 md:mb-4">Orbit in a KYC Architecture</h3>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 lg:gap-4 py-3 md:py-4">
          <div className="bg-blue-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 border border-blue-300">
            <div className="font-semibold text-blue-900 text-xs md:text-sm">User Input</div>
          </div>
          <div className="text-lg md:text-xl lg:text-2xl text-neutral-400">→</div>
          <div className="bg-purple-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 border border-purple-300">
            <div className="font-semibold text-purple-900 text-xs md:text-sm">KYC Model</div>
          </div>
          <div className="text-lg md:text-xl lg:text-2xl text-neutral-400">→</div>
          <div className="bg-green-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 border border-green-300">
            <div className="font-semibold text-green-900 text-xs md:text-sm">Orbit Logging SDK</div>
          </div>
          <div className="text-lg md:text-xl lg:text-2xl text-neutral-400">→</div>
          <div className="bg-amber-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 border border-amber-300">
            <div className="font-semibold text-amber-900 text-xs md:text-sm">Orbit Integrity Service</div>
          </div>
          <div className="text-lg md:text-xl lg:text-2xl text-neutral-400">→</div>
          <div className="bg-emerald-100 rounded-lg px-3 md:px-4 py-1.5 md:py-2 border border-emerald-300">
            <div className="font-semibold text-emerald-900 text-xs md:text-sm">Compliance Bundles</div>
          </div>
        </div>
        <p className="text-xs text-neutral-600 text-center mt-2 md:mt-3">
          Orbit integrates seamlessly into your existing KYC pipeline without requiring changes to your ML stack.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-neutral-900 mb-3 md:mb-4">Call to Action</h3>
        <p className="text-sm md:text-base text-neutral-800 mb-3 md:mb-4 font-medium">
          If you are a KYC or identity verification vendor, Orbit unlocks two things immediately:
        </p>
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0 mt-0.5">✓</div>
            <div>
              <div className="font-semibold text-sm md:text-base text-neutral-900">You become AI Act compliant without changing your ML stack.</div>
              <div className="text-xs md:text-sm text-neutral-700 mt-1">
                Orbit integrates with your existing infrastructure. Add Orbit logging to your models without modifying 
                your ML pipeline or retraining models.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0 mt-0.5">✓</div>
            <div>
              <div className="font-semibold text-sm md:text-base text-neutral-900">You gain a competitive edge in enterprise RFPs today — long before enforcement hits.</div>
              <div className="text-xs md:text-sm text-neutral-700 mt-1">
                Stand out in enterprise sales cycles by offering regulator-ready compliance documentation. Win deals 
                by demonstrating AI Act readiness while competitors are still scrambling.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Annex IV Requirements Mapping Component
function AnnexIVRequirementsMapping() {
  const [expandedRequirements, setExpandedRequirements] = useState({});

  const toggleRequirement = (idx) => {
    setExpandedRequirements(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const annexIVRequirements = [
    {
      annexRef: 'Annex IV.1',
      requirement: '1. General description of the AI system',
      orbitLogs: ['ModelCard.json', 'SystemArchitecture.md'],
      description: 'Model card and system architecture documentation generated from Orbit logs',
      example: 'orbit.log_model_card() generates complete system description'
    },
    {
      annexRef: 'Annex IV.2',
      requirement: '2. Detailed description of the elements of the AI system',
      orbitLogs: ['ModelExecutionTrace.md', 'InputFeatures.json', 'OutputDecisions.json'],
      description: 'Complete trace of model execution with inputs, outputs, and intermediate steps',
      example: 'orbit.log_inference() captures all required elements'
    },
    {
      annexRef: 'Annex IV.3',
      requirement: '3. Description of the data used for training',
      orbitLogs: ['TrainingDataSummary.pdf', 'DataLineage.json'],
      description: 'Training data summary including size, period, sources, and preprocessing',
      example: 'orbit.log_training() documents training data requirements'
    },
    {
      annexRef: 'Annex IV.4',
      requirement: '4. Description of the data used for validation and testing',
      orbitLogs: ['ValidationDataSummary.pdf', 'TestResults.json'],
      description: 'Validation and testing data documentation with performance metrics',
      example: 'orbit.log_validation() captures validation dataset details'
    },
    {
      annexRef: 'Annex IV.5',
      requirement: '5. Description of the AI system architecture',
      orbitLogs: ['ModelArchitecture.md', 'ModelVersion.json'],
      description: 'Model architecture and version information from deployment logs',
      example: 'orbit.log_deployment() records architecture and version details'
    },
    {
      annexRef: 'Annex IV.6',
      requirement: '6. Description of the development process',
      orbitLogs: ['DevelopmentLogs.json', 'VersionHistory.json'],
      description: 'Complete development history including model iterations and changes',
      example: 'orbit.log_version_change() tracks development process'
    },
    {
      annexRef: 'Annex IV.7',
      requirement: '7. Description of the validation and testing procedures',
      orbitLogs: ['TestPlan.pdf', 'ValidationResults.json', 'PerformanceMetrics.json'],
      description: 'Testing procedures and results documented in Orbit logs',
      example: 'orbit.log_test() records validation procedures'
    },
    {
      annexRef: 'Annex IV.8',
      requirement: '8. Description of the human oversight measures',
      orbitLogs: ['HumanOversightEvents.json', 'ReviewActions.json', 'EscalationLogs.json'],
      description: 'All human oversight events including reviews, escalations, and interventions',
      example: 'orbit.log_oversight() captures human oversight chain'
    },
    {
      annexRef: 'Annex IV.9',
      requirement: '9. Description of the risk management measures',
      orbitLogs: ['RiskAssessments.json', 'MitigationActions.json', 'ErrorLogs.json'],
      description: 'Risk management measures and mitigation actions from Orbit logs',
      example: 'orbit.log_risk() documents risk management'
    },
    {
      annexRef: 'Annex IV.10',
      requirement: '10. Description of the monitoring and post-market surveillance',
      orbitLogs: ['PostMarketMonitoring.json', 'DriftDetection.json', 'PerformanceMonitoring.json'],
      description: 'Post-market monitoring and surveillance data from continuous logging',
      example: 'orbit.log_monitoring() enables Annex VIII compliance'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-3 md:mb-4">Annex IV Requirements Mapped to Orbit Logs</h2>
      <p className="text-xs md:text-sm text-neutral-600 mb-4 md:mb-6">
        Every Annex IV requirement is automatically satisfied by Orbit's structured logging. Below is the complete mapping 
        of Annex IV requirements to actual Orbit log types and generated documentation.
      </p>
      <div className="space-y-3">
        {annexIVRequirements.map((req, idx) => {
          const isExpanded = expandedRequirements[idx] === true; // Default to collapsed
          return (
            <div key={idx} className="border border-neutral-200 rounded-lg bg-neutral-50 overflow-hidden">
              <button
                onClick={() => toggleRequirement(idx)}
                className="w-full flex items-start gap-2 md:gap-3 p-3 md:p-4 hover:bg-neutral-100 transition-colors text-left"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <span className="text-xs font-mono bg-blue-100 text-blue-800 px-1.5 md:px-2 py-0.5 rounded flex-shrink-0">{req.annexRef}</span>
                    <div className="font-semibold text-xs md:text-sm text-neutral-900 break-words">{req.requirement}</div>
                  </div>
                  {isExpanded && (
                    <>
                      <div className="text-xs md:text-sm text-neutral-700 mb-2 md:mb-3">{req.description}</div>
                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2">
                        {req.orbitLogs.map((log, logIdx) => (
                          <span key={logIdx} className="px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono break-all">
                            {log}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-neutral-600 bg-white rounded p-2 border border-neutral-200">
                        <strong>Example:</strong> {req.example}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-shrink-0 text-neutral-400 text-sm md:text-base">
                  {isExpanded ? '▼' : '▶'}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 md:mt-6 bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
        <div className="font-semibold text-sm md:text-base text-green-900 mb-1 md:mb-2">Complete Coverage</div>
        <div className="text-xs md:text-sm text-green-800">
          Orbit's logging schema covers all 10 Annex IV requirements. When you generate a documentation bundle, 
          Orbit automatically assembles all required documentation from your ingested logs, ensuring complete compliance 
          without manual documentation work.
        </div>
      </div>
    </div>
  );
}

// Security & Architecture Explainer
function SecurityArchitectureExplainer() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-4">Security & Architecture</h2>
      <p className="text-neutral-700 mb-6">
        Orbit provides enterprise-grade security, cryptographic integrity, and architectural guarantees 
        for AI system audit trail infrastructure. AI Act compliance is the first killer use case.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-semibold text-blue-900 mb-2">Positioning</div>
        <div className="text-sm text-blue-800">
          Orbit is AI System Audit Trail Infrastructure — with AI Act compliance as the first killer use case. 
          This enables observability, traceability, lineage, integrity, monitoring, and documentation.
        </div>
      </div>
    </div>
  );
}

// Security & Architecture Component
function SecurityArchitecture() {
  const [expandedSection, setExpandedSection] = useState('hash-chain');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Hash Chain Specification</h2>
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="font-semibold text-neutral-900 mb-2">Algorithm</h3>
          <p className="text-sm text-neutral-700 mb-3">
            SHA-256 for event hashing, HMAC-SHA256 for cryptographic signatures
          </p>
          <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm text-neutral-100">
            <div>eventHash = SHA256(canonicalJSON(event) + signature)</div>
            <div className="mt-2">previousEventHash → eventHash → nextEventHash</div>
            <div className="mt-2">blockIndex = sequential counter per user/org</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Minimum Viable Log Set</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Explicitly defined minimum log requirements for Annex IV compliance. Every extra log type is additive.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">1</div>
            <div>
              <div className="font-semibold text-neutral-900">Input Features</div>
              <div className="text-sm text-neutral-600">All input features used in model inference</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">2</div>
            <div>
              <div className="font-semibold text-neutral-900">Model Version</div>
              <div className="text-sm text-neutral-600">Exact model version identifier</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">3</div>
            <div>
              <div className="font-semibold text-neutral-900">Output Decision</div>
              <div className="text-sm text-neutral-600">Model output/decision</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">4</div>
            <div>
              <div className="font-semibold text-neutral-900">Timestamp</div>
              <div className="text-sm text-neutral-600">ISO 8601 timestamp of model execution</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">5</div>
            <div>
              <div className="font-semibold text-neutral-900">Score / Confidence</div>
              <div className="text-sm text-neutral-600">Model confidence score or risk score</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">6</div>
            <div>
              <div className="font-semibold text-neutral-900">Human Oversight Events</div>
              <div className="text-sm text-neutral-600">Review actions, escalations, manual interventions</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">7</div>
            <div>
              <div className="font-semibold text-neutral-900">Error Logs</div>
              <div className="text-sm text-neutral-600">Model errors, exceptions, fallback decisions</div>
            </div>
          </div>
          <div className="flex items-start gap-3 border-l-4 border-green-500 bg-green-50 p-4 rounded">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">8</div>
            <div>
              <div className="font-semibold text-neutral-900">Training Data Summary</div>
              <div className="text-sm text-neutral-600">Data size, period, sources, preprocessing steps</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
