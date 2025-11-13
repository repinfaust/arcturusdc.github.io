'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, or } from 'firebase/firestore';

export default function TemplateBrowser({ tenantId, onSelectTemplate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load templates (built-in + tenant custom)
  useEffect(() => {
    if (!tenantId) return;

    // Query built-in templates (tenantId is null)
    const builtInQuery = query(
      collection(db, 'stea_doc_templates'),
      where('isBuiltIn', '==', true)
    );

    // Query custom templates for this tenant
    const customQuery = query(
      collection(db, 'stea_doc_templates'),
      where('tenantId', '==', tenantId)
    );

    // Subscribe to both queries
    const unsubscribeBuiltIn = onSnapshot(builtInQuery, (snapshot) => {
      const builtInTemplates = [];
      snapshot.forEach((doc) => {
        builtInTemplates.push({
          id: doc.id,
          ...doc.data(),
          source: 'built-in'
        });
      });

      // Also get custom templates
      const unsubscribeCustom = onSnapshot(customQuery, (customSnapshot) => {
        const customTemplates = [];
        customSnapshot.forEach((doc) => {
          customTemplates.push({
            id: doc.id,
            ...doc.data(),
            source: 'custom'
          });
        });

        // Combine and set
        const allTemplates = [...builtInTemplates, ...customTemplates];
        setTemplates(allTemplates);
        setLoading(false);
      });

      return () => {
        unsubscribeCustom();
      };
    });

    return () => {
      unsubscribeBuiltIn();
    };
  }, [tenantId]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Category filter
    if (selectedCategory !== 'all' && template.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Get unique categories
  const categories = ['all', ...new Set(templates.map(t => t.category))];

  // Category display names
  const categoryNames = {
    all: 'All Templates',
    prs: 'Product Requirements',
    buildspec: 'Build Spec',
    releasenotes: 'Release Notes',
    techdesign: 'Technical Design',
    adr: 'Architecture Decision',
    testplan: 'Test Plan',
    launchplan: 'Launch Plan',
  };

  // Category colors
  const categoryColors = {
    prs: 'bg-blue-100 text-blue-800',
    buildspec: 'bg-purple-100 text-purple-800',
    releasenotes: 'bg-green-100 text-green-800',
    techdesign: 'bg-indigo-100 text-indigo-800',
    adr: 'bg-yellow-100 text-yellow-800',
    testplan: 'bg-red-100 text-red-800',
    launchplan: 'bg-pink-100 text-pink-800',
  };

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Templates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a template to create a new document
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryNames[category] || category}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          <span>{filteredTemplates.length} templates</span>
          <span>•</span>
          <span>{templates.filter(t => t.isBuiltIn).length} built-in</span>
          <span>•</span>
          <span>{templates.filter(t => !t.isBuiltIn).length} custom</span>
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className="p-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No templates found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Try adjusting your search or category filter
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-indigo-300 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    categoryColors[template.category] || 'bg-gray-100 text-gray-800'
                  }`}>
                    {categoryNames[template.category] || template.category}
                  </span>
                  {template.isBuiltIn && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Built-in
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.variables?.length || 0} variables</span>
                  {template.version && <span>v{template.version}</span>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        categoryColors[template.category] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {categoryNames[template.category] || template.category}
                      </span>
                      {template.isBuiltIn && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Built-in
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 ml-4">
                    <span>{template.variables?.length || 0} variables</span>
                    {template.version && <span>v{template.version}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
