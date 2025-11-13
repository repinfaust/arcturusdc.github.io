'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';
import SteaAppsDropdown from '@/components/SteaAppsDropdown';
import TemplateBrowser from '@/components/ruby/TemplateBrowser';

export default function TemplatesPage() {
  const router = useRouter();
  const { currentTenant, availableTenants, loading: tenantLoading } = useTenant();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (!firebaseUser) {
        router.replace('/apps/stea?next=/apps/stea/ruby/templates');
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

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedTemplate(null);
  };

  const handleUseTemplate = () => {
    // Navigate to create doc page with template pre-selected
    // For now, just show an alert
    alert(`Template "${selectedTemplate.name}" selected. Integration with doc creation coming soon!`);
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
              <button
                onClick={() => router.push('/apps/stea/ruby')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Document Templates
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
        {/* Instructions Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How to Use Templates
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Templates help you create consistent documentation quickly. You can use built-in templates or create custom ones for your team.
          </p>
          <div className="bg-white rounded border border-blue-200 p-3">
            <p className="text-xs text-gray-800 mb-2">
              <strong>Via Claude Code (MCP):</strong>
            </p>
            <code className="text-xs text-gray-800">
              Use stea.listTemplates to see all available templates<br />
              Use stea.generateDoc with templateType to create a doc from a template<br />
              Use stea.createTemplate to create a custom template
            </code>
          </div>
        </div>

        {/* Template Browser */}
        <TemplateBrowser
          tenantId={currentTenant.id}
          onSelectTemplate={handleSelectTemplate}
        />

        {/* Template Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleClosePreview}
              />
              <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-xl">
                {/* Modal Header */}
                <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                    <p className="text-sm text-indigo-100 mt-1">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <button
                    onClick={handleClosePreview}
                    className="text-white hover:text-indigo-100 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {/* Template Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Category</h3>
                      <span className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                        {selectedTemplate.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Type</h3>
                      <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                        {selectedTemplate.type}
                      </span>
                    </div>
                  </div>

                  {/* Variables */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Template Variables ({selectedTemplate.variables?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {selectedTemplate.variables && selectedTemplate.variables.length > 0 ? (
                        selectedTemplate.variables.map((variable, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3 border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <code className="text-sm font-mono text-indigo-600">
                                  {`{{${variable.name}}}`}
                                </code>
                                <p className="text-sm text-gray-600 mt-1">
                                  {variable.description}
                                </p>
                              </div>
                              {variable.required && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No variables defined</p>
                      )}
                    </div>
                  </div>

                  {/* Template Preview */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Template Content</h3>
                    <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {selectedTemplate.template || 'No template content available'}
                      </pre>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    {selectedTemplate.isBuiltIn && (
                      <div>
                        <span className="font-semibold">Source:</span> Built-in
                      </div>
                    )}
                    {selectedTemplate.version && (
                      <div>
                        <span className="font-semibold">Version:</span> {selectedTemplate.version}
                      </div>
                    )}
                    {selectedTemplate.createdBy && (
                      <div>
                        <span className="font-semibold">Created by:</span> {selectedTemplate.createdBy}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
                  <button
                    onClick={handleClosePreview}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleUseTemplate}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
