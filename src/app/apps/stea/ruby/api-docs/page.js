'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  collection, query, where, onSnapshot, orderBy
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';
import APIDocViewer from '@/components/ruby/APIDocViewer';
import FigmaComponentBrowser from '@/components/ruby/FigmaComponentBrowser';

export default function APIDocsPage() {
  const router = useRouter();
  const { currentTenant, availableTenants, loading: tenantLoading } = useTenant();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data
  const [apiSpecs, setApiSpecs] = useState([]);
  const [figmaFiles, setFigmaFiles] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('api'); // 'api' or 'figma'
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'viewer'

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        router.replace('/apps/stea?next=/apps/stea/ruby/api-docs');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Authorization check
  useEffect(() => {
    if (!tenantLoading && !authLoading && availableTenants.length === 0) {
      router.replace('/apps/stea?error=no_workspace');
    }
  }, [availableTenants, tenantLoading, authLoading, router]);

  // Load API specs
  useEffect(() => {
    if (!currentTenant?.id) return;

    const specsRef = collection(db, 'stea_api_specs');
    const q = query(
      specsRef,
      where('tenantId', '==', currentTenant.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedSpecs = [];
        snapshot.forEach((doc) => {
          loadedSpecs.push({ id: doc.id, ...doc.data() });
        });
        setApiSpecs(loadedSpecs);
      },
      (error) => {
        console.error('Error loading API specs:', error);
      }
    );

    return () => unsubscribe();
  }, [currentTenant]);

  // Load Figma files
  useEffect(() => {
    if (!currentTenant?.id) return;

    const filesRef = collection(db, 'stea_figma_files');
    const q = query(
      filesRef,
      where('tenantId', '==', currentTenant.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedFiles = [];
        snapshot.forEach((doc) => {
          loadedFiles.push({ id: doc.id, ...doc.data() });
        });
        setFigmaFiles(loadedFiles);
      },
      (error) => {
        console.error('Error loading Figma files:', error);
      }
    );

    return () => unsubscribe();
  }, [currentTenant]);

  const viewSpec = (spec) => {
    setSelectedSpec(spec);
    setView('viewer');
  };

  const viewFile = (file) => {
    setSelectedFile(file);
    setView('viewer');
  };

  const backToList = () => {
    setView('list');
    setSelectedSpec(null);
    setSelectedFile(null);
  };

  if (authLoading || tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !currentTenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                📚 Ruby - API & Component Docs
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <SteaAppsDropdown />
              <TenantSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'list' ? (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <div className="flex space-x-1 px-6">
                  <button
                    onClick={() => setActiveTab('api')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'api'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🔌 API Documentation ({apiSpecs.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('figma')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'figma'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🎨 Figma Components ({figmaFiles.length})
                  </button>
                </div>
              </div>
            </div>

            {/* API Specs List */}
            {activeTab === 'api' && (
              <div className="space-y-4">
                {/* Import Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    💡 How to Import API Documentation
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Use Claude Code to import OpenAPI specs via the MCP server:
                  </p>
                  <div className="bg-white rounded border border-blue-200 p-3">
                    <code className="text-xs text-gray-800">
                      Use stea.importOpenAPI with:<br />
                      - name: "My API"<br />
                      - specUrl: "https://api.example.com/openapi.json"
                    </code>
                  </div>
                </div>

                {/* Specs Grid */}
                {apiSpecs.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No API Documentation Yet</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Import your first OpenAPI spec using Claude Code
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apiSpecs.map(spec => (
                      <button
                        key={spec.id}
                        onClick={() => viewSpec(spec)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{spec.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            spec.parseStatus === 'success'
                              ? 'bg-green-100 text-green-800'
                              : spec.parseStatus === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {spec.parseStatus}
                          </span>
                        </div>
                        {spec.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {spec.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>v{spec.version}</span>
                          <span>{spec.endpointCount} endpoints</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Figma Files List */}
            {activeTab === 'figma' && (
              <div className="space-y-4">
                {/* Sync Instructions */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">
                    💡 How to Sync Figma Components
                  </h3>
                  <p className="text-sm text-purple-800 mb-3">
                    Use Claude Code to sync Figma files via the MCP server:
                  </p>
                  <div className="bg-white rounded border border-purple-200 p-3">
                    <code className="text-xs text-gray-800">
                      Use stea.syncFigmaComponents with:<br />
                      - figmaFileId: "abc123xyz"<br />
                      - figmaAccessToken: "&lt;your token&gt;"<br />
                      - name: "Design System"
                    </code>
                  </div>
                </div>

                {/* Files Grid */}
                {figmaFiles.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No Figma Components Yet</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Sync your first Figma file using Claude Code
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {figmaFiles.map(file => (
                      <button
                        key={file.id}
                        onClick={() => viewFile(file)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-left"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            file.syncStatus === 'success'
                              ? 'bg-green-100 text-green-800'
                              : file.syncStatus === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {file.syncStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>v{file.version}</span>
                          <span>{file.componentCount} components</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={backToList}
              className="mb-6 flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to list
            </button>

            {/* Viewer */}
            {selectedSpec && (
              <APIDocViewer specId={selectedSpec.id} tenantId={currentTenant.id} />
            )}
            {selectedFile && (
              <FigmaComponentBrowser fileId={selectedFile.id} tenantId={currentTenant.id} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
