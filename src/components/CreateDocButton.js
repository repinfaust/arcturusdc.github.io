'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

/**
 * Button component to create Ruby documents from Filo items
 *
 * @param {string} sourceType - 'epic' | 'feature' | 'card'
 * @param {string} sourceId - The Firestore document ID
 * @param {string} templateId - 'prs' | 'buildSpec' | 'testPlan' | 'releaseNotes'
 * @param {string} label - Button label
 * @param {string} tenantId - Current tenant ID
 */
export default function CreateDocButton({ sourceType, sourceId, templateId, label, tenantId, className = '' }) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateDoc = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to create documents');
      return;
    }

    setCreating(true);

    try {
      // Get Firebase ID token
      const idToken = await auth.currentUser.getIdToken();

      // Call API to create document
      const response = await fetch('/api/ruby/create-from-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType,
          sourceId,
          templateId,
          tenantId,
          idToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create document');
      }

      // Navigate to the new document in Ruby
      router.push(data.docUrl);

    } catch (error) {
      console.error('Error creating document:', error);
      alert(`Failed to create document: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateDoc}
      disabled={creating}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition ${
        creating
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300'
      } ${className}`}
      title={`Create ${label} in Ruby`}
    >
      {creating ? (
        <>
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Creating...
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
