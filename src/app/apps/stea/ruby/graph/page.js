'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import KnowledgeGraph from '@/components/ruby/KnowledgeGraph';
import Link from 'next/link';
import Image from 'next/image';

export default function KnowledgeGraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const initialDocId = searchParams?.get('doc');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authReady || tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/apps/stea');
    return null;
  }

  if (!currentTenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-amber-900">No Workspace Access</h1>
          <p className="text-amber-700">You need to be a member of a workspace to view the knowledge graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/apps/stea/ruby" className="text-neutral-600 hover:text-neutral-900">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="flex items-center gap-2">
                <Image
                  src="/img/acturusdc_stea_logo.png"
                  alt="STEa Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <h1 className="text-xl font-semibold text-neutral-900">Knowledge Graph</h1>
              </div>
            </div>
            <div className="text-sm text-neutral-600">
              Visual map of connections between documents, epics, features, cards, and tests
            </div>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 overflow-hidden">
        <KnowledgeGraph
          tenantId={currentTenant.id}
          projectId={null}
          initialDocId={initialDocId}
        />
      </div>
    </div>
  );
}

