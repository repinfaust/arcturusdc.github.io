'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, doc, getDoc, getDocs, orderBy } from 'firebase/firestore';
import CodeSampleTabs from './CodeSampleTabs';
import EndpointCard from './EndpointCard';

export default function APIDocViewer({ specId, tenantId }) {
  const [spec, setSpec] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [filteredEndpoints, setFilteredEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);

  // UI State
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);
  const [allTags, setAllTags] = useState([]);

  // Load spec metadata
  useEffect(() => {
    if (!specId || !tenantId) return;

    const loadSpec = async () => {
      try {
        const specDoc = await getDoc(doc(db, 'stea_api_specs', specId));
        if (specDoc.exists()) {
          setSpec({ id: specDoc.id, ...specDoc.data() });
        } else {
          setError('API specification not found');
        }
      } catch (err) {
        console.error('Error loading spec:', err);
        setError('Failed to load API specification');
      }
    };

    loadSpec();
  }, [specId, tenantId]);

  // Load endpoints
  useEffect(() => {
    if (!specId) return;

    const loadEndpoints = async () => {
      try {
        setLoading(true);
        const endpointsRef = collection(db, 'stea_api_endpoints');
        const q = query(
          endpointsRef,
          where('specId', '==', specId),
          orderBy('path', 'asc')
        );

        const snapshot = await getDocs(q);
        const loadedEndpoints = [];
        const tags = new Set();

        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          loadedEndpoints.push(data);
          (data.tags || []).forEach(tag => tags.add(tag));
        });

        setEndpoints(loadedEndpoints);
        setAllTags(Array.from(tags).sort());
        setLoading(false);
      } catch (err) {
        console.error('Error loading endpoints:', err);
        setError('Failed to load API endpoints');
        setLoading(false);
      }
    };

    loadEndpoints();
  }, [specId]);

  // Filter endpoints
  useEffect(() => {
    let filtered = [...endpoints];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ep =>
        ep.path.toLowerCase().includes(query) ||
        ep.summary.toLowerCase().includes(query) ||
        ep.description?.toLowerCase().includes(query)
      );
    }

    // Method filter
    if (selectedMethod !== 'all') {
      filtered = filtered.filter(ep => ep.method === selectedMethod);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(ep =>
        ep.tags.some(tag => selectedTags.includes(tag))
      );
    }

    setFilteredEndpoints(filtered);
  }, [endpoints, searchQuery, selectedMethod, selectedTags]);

  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Method badge color
  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-100 text-blue-800',
      POST: 'bg-green-100 text-green-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800',
      PATCH: 'bg-purple-100 text-purple-800',
      OPTIONS: 'bg-gray-100 text-gray-800',
      HEAD: 'bg-gray-100 text-gray-800',
    };
    return colors[method] || 'bg-gray-100 text-gray-800';
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{spec?.name}</h2>
            {spec?.description && (
              <p className="mt-2 text-gray-600">{spec.description}</p>
            )}
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                v{spec?.version}
              </span>
              <span className="text-gray-500">
                OpenAPI {spec?.openApiVersion}
              </span>
              <span className="text-gray-500">
                {endpoints.length} endpoints
              </span>
            </div>
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
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Method Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Method:</span>
            {['all', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(method => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                  selectedMethod === method
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Tags:</span>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedTags.includes(tag)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {filteredEndpoints.length} of {endpoints.length} endpoints
          </p>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No endpoints match your filters</p>
          </div>
        ) : (
          filteredEndpoints.map(endpoint => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              expanded={expandedEndpoint === endpoint.id}
              onToggle={() => setExpandedEndpoint(
                expandedEndpoint === endpoint.id ? null : endpoint.id
              )}
              getMethodColor={getMethodColor}
            />
          ))
        )}
      </div>
    </div>
  );
}
