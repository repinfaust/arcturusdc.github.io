'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function HansLanding() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent('/apps/stea/hans');
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!authReady) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Checking your STEa access…
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border bg-white/70 p-6 text-center text-sm text-neutral-600">
          Redirecting you to the STEa home to sign in…
        </div>
      </main>
    );
  }

  return (
    <main className="pb-10 max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="card p-6 flex items-start gap-4 mt-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-blue-50 to-indigo-100">
          <span className="text-3xl">🧪</span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Hans Testing Suite</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Manage test cases, coordinate user testing sessions, and track quality across all apps
          </p>
        </div>
      </div>

      {/* App Testing Portals */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4 px-2">App Testing Portals</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tou.me Portal */}
          <Link
            href="/apps/stea/hans/toume"
            className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/img/tou.me_logo.jpeg"
                  width={48}
                  height={48}
                  alt="Tou.me"
                  className="rounded-xl border border-black/10"
                />
                <div>
                  <h3 className="font-bold text-neutral-900">Tou.me Testing Portal</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    MVP 1.3 test cases and user testing coordination
                  </p>
                </div>
              </div>
              <span className="text-neutral-400 group-hover:text-neutral-700 transition-colors">
                →
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-red-700 border border-red-200">
                🔴 <span className="font-medium">8 Critical</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-orange-700 border border-orange-200">
                🟠 <span className="font-medium">5 High</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-yellow-700 border border-yellow-200">
                🟡 <span className="font-medium">7 Medium</span>
              </span>
            </div>
          </Link>

          {/* Coming Soon - Other Apps */}
          <div className="card p-6 opacity-60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="font-bold text-neutral-700">Other Apps</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Testing portals for additional products coming soon
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-400">
              Available once connected to Filo board
            </div>
          </div>
        </div>
      </section>

      {/* Filo-Connected Test Cases */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-700 mb-4 px-2">Test Cases from Filo Board</h2>
        <div className="card p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">No Test Cases Yet</h3>
          <p className="text-sm text-neutral-600 max-w-md mx-auto mb-4">
            Test cases sent from the Filo board will appear here. Use the "Send to Hans" button on any card to create structured test cases.
          </p>
          <Link
            href="/apps/stea/board"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Open Filo Board →
          </Link>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="mt-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900">20</div>
            <div className="text-xs text-neutral-600 mt-1">Total Test Cases</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">85%</div>
            <div className="text-xs text-neutral-600 mt-1">Pass Rate</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-xs text-neutral-600 mt-1">Active Testers</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-neutral-500">
        <p>
          Hans is part of the STEa Studio toolkit.{' '}
          <Link href="/apps/stea" className="text-neutral-700 hover:underline">
            Back to STEa Home
          </Link>
        </p>
      </div>
    </main>
  );
}
