'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, getDoc, getDocs, orderBy } from 'firebase/firestore';
import ComponentCard from './ComponentCard';
import DesignTokensPanel from './DesignTokensPanel';

export default function FigmaComponentBrowser({ fileId, tenantId }) {
  const [file, setFile] = useState(null);
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // UI State
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [showTokensPanel, setShowTokensPanel] = useState(false);

  // Load file metadata
  useEffect(() => {
    if (!fileId || !tenantId) return;

    const loadFile = async () => {
      try {
        const fileDoc = await getDoc(doc(db, 'stea_figma_files', fileId));
        if (fileDoc.exists()) {
          setFile({ id: fileDoc.id, ...fileDoc.data() });
        } else {
          setError('Figma file not found');
        }
      } catch (err) {
        console.error('Error loading Figma file:', err);
        setError('Failed to load Figma file');
      }
    };

    loadFile();
  }, [fileId, tenantId]);

  // Load components
  useEffect(() => {
    if (!fileId) return;

    const loadComponents = async () => {
      try {
        setLoading(true);
        const componentsRef = collection(db, 'stea_figma_components');
        const q = query(
          componentsRef,
          where('fileId', '==', fileId)
        );

        const snapshot = await getDocs(q);
        const loadedComponents = [];

        snapshot.forEach((doc) => {
          loadedComponents.push({ id: doc.id, ...doc.data() });
        });

        // Sort by name
        loadedComponents.sort((a, b) => a.name.localeCompare(b.name));

        setComponents(loadedComponents);
        setLoading(false);
      } catch (err) {
        console.error('Error loading components:', err);
        setError('Failed to load Figma components');
        setLoading(false);
      }
    };

    loadComponents();
  }, [fileId]);

  // Filter components
  useEffect(() => {
    let filtered = [...components];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp =>
        comp.name.toLowerCase().includes(query) ||
        comp.description?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(comp => comp.type === selectedType);
    }

    setFilteredComponents(filtered);
  }, [components, searchQuery, selectedType]);

  const openInFigma = (component) => {
    if (component.figmaUrl) {
      window.open(component.figmaUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">{file?.name}</h2>
              {file?.url && (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700"
                  title="Open in Figma"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z" />
                  </svg>
                </a>
              )}
            </div>
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                v{file?.version}
              </span>
              <span className="text-gray-500">
                {components.length} components
              </span>
              {file?.lastSyncedAt && (
                <span className="text-gray-500">
                  Synced {new Date(file.lastSyncedAt.seconds * 1000).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Grid view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Type:</span>
            {['all', 'COMPONENT', 'COMPONENT_SET'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? 'All' : type === 'COMPONENT' ? 'Component' : 'Component Set'}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredComponents.length} of {components.length} components
          </p>
        </div>
      </div>

      {/* Components Grid/List */}
      {filteredComponents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-500">No components match your filters</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
        }>
          {filteredComponents.map(component => (
            <ComponentCard
              key={component.id}
              component={component}
              viewMode={viewMode}
              onSelect={() => setSelectedComponent(component)}
              onOpenInFigma={() => openInFigma(component)}
              onShowTokens={() => {
                setSelectedComponent(component);
                setShowTokensPanel(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Design Tokens Panel (Slide-over) */}
      {showTokensPanel && selectedComponent && (
        <DesignTokensPanel
          component={selectedComponent}
          onClose={() => {
            setShowTokensPanel(false);
            setSelectedComponent(null);
          }}
        />
      )}
    </div>
  );
}
