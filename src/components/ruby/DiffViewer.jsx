'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore';
import { compareDocuments } from '@/lib/ruby-diff';
import { tiptapToHTML } from '@/lib/ruby-exports';

export default function DiffViewer({ docId, tenantId, onClose }) {
  const [versions, setVersions] = useState([]);
  const [selectedOldVersion, setSelectedOldVersion] = useState(null);
  const [selectedNewVersion, setSelectedNewVersion] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDoc, setCurrentDoc] = useState(null);

  // Load current document
  useEffect(() => {
    if (!docId) return;

    const loadCurrentDoc = async () => {
      try {
        const docRef = doc(db, 'stea_docs', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentDoc({ id: docSnap.id, ...data });
        }
      } catch (error) {
        console.error('Error loading document:', error);
      }
    };

    loadCurrentDoc();
  }, [docId]);

  // Load versions
  useEffect(() => {
    if (!docId || !tenantId) return;

    const loadVersions = async () => {
      setLoading(true);
      try {
        const versionsRef = collection(db, 'stea_doc_versions');
        const q = query(
          versionsRef,
          where('docId', '==', docId),
          where('tenantId', '==', tenantId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const loadedVersions = [];
        snapshot.forEach((doc) => {
          loadedVersions.push({ id: doc.id, ...doc.data() });
        });

        // Add current document as latest version
        if (currentDoc) {
          loadedVersions.unshift({
            id: 'current',
            docId: currentDoc.id,
            content: currentDoc.content,
            title: currentDoc.title,
            createdAt: currentDoc.updatedAt || currentDoc.createdAt,
            createdBy: currentDoc.updatedBy || currentDoc.createdBy,
            version: loadedVersions.length + 1,
            isCurrent: true,
          });
        }

        setVersions(loadedVersions);

        // Auto-select latest two versions
        if (loadedVersions.length >= 2) {
          setSelectedNewVersion(loadedVersions[0]);
          setSelectedOldVersion(loadedVersions[1]);
        } else if (loadedVersions.length === 1) {
          setSelectedNewVersion(loadedVersions[0]);
        }
      } catch (error) {
        console.error('Error loading versions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [docId, tenantId, currentDoc]);

  // Compute diff when versions change
  useEffect(() => {
    if (!selectedOldVersion || !selectedNewVersion) {
      setDiffResult(null);
      return;
    }

    try {
      const oldContent = selectedOldVersion.content || { type: 'doc', content: [] };
      const newContent = selectedNewVersion.content || { type: 'doc', content: [] };
      const result = compareDocuments(oldContent, newContent);
      setDiffResult(result);
    } catch (error) {
      console.error('Error computing diff:', error);
      setDiffResult(null);
    }
  }, [selectedOldVersion, selectedNewVersion]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-neutral-600">Loading versions...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Compare Versions</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Version Selectors */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Old Version
            </label>
            <select
              value={selectedOldVersion?.id || ''}
              onChange={(e) => {
                const version = versions.find(v => v.id === e.target.value);
                setSelectedOldVersion(version);
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">Select version...</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version || '?'} - {formatDate(version.createdAt)} by {version.createdBy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              New Version
            </label>
            <select
              value={selectedNewVersion?.id || ''}
              onChange={(e) => {
                const version = versions.find(v => v.id === e.target.value);
                setSelectedNewVersion(version);
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">Select version...</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.version || '?'} - {formatDate(version.createdAt)} by {version.createdBy}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        {diffResult && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">{diffResult.summary}</p>
                <p className="mt-1 text-xs text-neutral-600">
                  {diffResult.stats.insertions} additions, {diffResult.stats.deletions} deletions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diff View */}
      <div className="flex flex-1 overflow-hidden">
        {selectedOldVersion && selectedNewVersion && diffResult ? (
          <div className="grid grid-cols-2 gap-0 overflow-auto">
            {/* Old Version */}
            <div className="border-r border-neutral-200 bg-red-50/30">
              <div className="sticky top-0 z-10 border-b border-neutral-200 bg-red-100 px-4 py-2">
                <h3 className="text-sm font-semibold text-red-900">
                  Old Version (v{selectedOldVersion.version || '?'})
                </h3>
                <p className="text-xs text-red-700">
                  {formatDate(selectedOldVersion.createdAt)} by {selectedOldVersion.createdBy}
                </p>
              </div>
              <div className="p-4">
                <DiffContent content={selectedOldVersion.content} diff={diffResult.diff} side="old" />
              </div>
            </div>

            {/* New Version */}
            <div className="bg-green-50/30">
              <div className="sticky top-0 z-10 border-b border-neutral-200 bg-green-100 px-4 py-2">
                <h3 className="text-sm font-semibold text-green-900">
                  New Version (v{selectedNewVersion.version || '?'})
                </h3>
                <p className="text-xs text-green-700">
                  {formatDate(selectedNewVersion.createdAt)} by {selectedNewVersion.createdBy}
                </p>
              </div>
              <div className="p-4">
                <DiffContent content={selectedNewVersion.content} diff={diffResult.diff} side="new" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-neutral-500">
              <p className="mb-2 text-lg">Select two versions to compare</p>
              <p className="text-sm">
                {versions.length === 0
                  ? 'No version history found. Versions are created when documents are saved.'
                  : 'Choose an old and new version from the dropdowns above.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiffContent({ content, diff, side }) {
  if (!content) return <div className="text-neutral-500 p-4">No content</div>;

  // Convert TipTap to text lines for diff display
  const text = tiptapToText(content);
  const lines = text.split('\n');

  // Build a map of which lines are changed
  const changedLines = new Set();
  diff.forEach((item) => {
    const lineNum = Math.floor(item.lineNumber);
    if (side === 'old' && item.type === 'delete') {
      changedLines.add(lineNum);
    } else if (side === 'new' && item.type === 'insert') {
      changedLines.add(lineNum);
    }
  });

  return (
    <div className="font-mono text-sm">
      {lines.map((line, index) => {
        const lineNum = index + 1;
        const isChanged = changedLines.has(lineNum);

        if (isChanged) {
          const bgColor = side === 'old' ? 'bg-red-100' : 'bg-green-100';
          const textColor = side === 'old' ? 'text-red-900' : 'text-green-900';
          const borderColor = side === 'old' ? 'border-red-500' : 'border-green-500';
          
          return (
            <div
              key={index}
              className={`${bgColor} ${textColor} border-l-4 ${borderColor} px-3 py-1 my-0.5`}
            >
              <span className="text-neutral-500 mr-2 select-none">{lineNum}</span>
              {line || <span className="text-neutral-400 italic">(empty line)</span>}
            </div>
          );
        }

        // Show context lines (unchanged) - limit to 3 lines before/after changes
        const hasNearbyChange = Array.from(changedLines).some(changedLine => 
          Math.abs(changedLine - lineNum) <= 3
        );

        if (hasNearbyChange || changedLines.size === 0) {
          return (
            <div key={index} className="px-3 py-1 my-0.5 text-neutral-700 bg-white">
              <span className="text-neutral-400 mr-2 select-none">{lineNum}</span>
              {line}
            </div>
          );
        }

        return null; // Skip lines far from changes
      })}
    </div>
  );
}

function tiptapToText(tiptapJSON) {
  if (!tiptapJSON || !tiptapJSON.content) return '';

  function extractText(node) {
    if (!node) return '';
    
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('');
    }
    
    return '';
  }

  return tiptapJSON.content.map(extractText).join('\n');
}

