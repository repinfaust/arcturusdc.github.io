'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useTenant } from '@/contexts/TenantContext';
import TenantSwitcher from '@/components/TenantSwitcher';

const IN_SESSION_DESTINATIONS = [
  {
    label: 'STEa Demo',
    href: '/apps/stea/demo',
    description: 'Interactive showcase of the complete STEa tech stack and closed-loop workflow.',
  },
  {
    label: 'STEa Board',
    href: '/apps/stea/filo',
    note: 'Also available at /stea/filo',
    description: 'Plan, prioritise, and track the STEa backlog.',
  },
  {
    label: 'Automated Tests',
    href: '/apps/stea/automatedtestsdashboard',
    description: 'Trigger Jest suites and review the latest run results.',
  },
  {
    label: 'Hans Testing Suite',
    href: '/apps/stea/hans',
    description: 'Test case management and user testing coordination across all apps.',
  },
  {
    label: 'Filo',
    href: '/apps/stea/harls',
    description: 'Felix Product Lab collaborative whiteboard environment.',
  },
];

function sanitizeNext(raw) {
  if (!raw) return null;
  if (typeof raw !== 'string') return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  if (raw === '/apps/stea' || raw === '/stea') return null;
  return raw;
}

export default function SteaAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get('next') || '';

  const destination = useMemo(() => sanitizeNext(nextParam), [nextParam]);
  const { currentTenant, availableTenants, loading: tenantLoading } = useTenant();

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [sessionSyncing, setSessionSyncing] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const cookieUidRef = useRef(null);

  const ensureSessionCookie = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return;
    if (cookieUidRef.current === firebaseUser.uid) return;

    setSessionSyncing(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error(`Session cookie creation failed (${response.status})`);
      }

      cookieUidRef.current = firebaseUser.uid;
    } finally {
      setSessionSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (!firebaseUser) {
        cookieUidRef.current = null;
        return;
      }

      try {
        await ensureSessionCookie(firebaseUser);
        if (destination) {
          router.replace(destination);
        }
      } catch (err) {
        console.error('Failed to establish STEa session', err);
        setError('We had trouble creating your session. Please try again.');
        try {
          await signOut(auth);
        } catch (logoutErr) {
          console.error('Failed to sign out after session error', logoutErr);
        }
      }
    });

    return () => unsubscribe();
  }, [destination, ensureSessionCookie, router]);

  const handleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in failed', err);
      setError(err?.message || 'Google sign-in failed. Please try again or contact Arcturus.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setError('');
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (cookieErr) {
      console.error('Failed to clear session cookie', cookieErr);
    }

    try {
      await signOut(auth);
      cookieUidRef.current = null;
      router.replace('/apps/stea');
    } catch (err) {
      console.error('Failed to sign out', err);
      setError('Could not sign you out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-2xl border border-neutral-200 bg-white/80 px-6 py-5 text-sm text-neutral-600 shadow-sm">
          Checking STEa access…
        </div>
      </div>
    );
  }

  if (!user) {
    const busy = signingIn || sessionSyncing;

    return (
      <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-10 px-4 py-16 text-center">
        <div className="absolute inset-x-0 top-16 -z-10 mx-auto h-[360px] w-[360px] rounded-full bg-pink-200/40 blur-3xl sm:w-[480px]" />
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">STEa</span>
            Internal studio tooling
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Sign in to continue to the STEa Studio toolkit
          </h1>
          <p className="max-w-xl text-base text-neutral-600">
            Use your authorised Google account to access the internal boards, automations, and planning tools.
          </p>
        </div>

        <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white/90 p-8 shadow-xl shadow-neutral-800/10 backdrop-blur">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 shadow-inner shadow-neutral-900/5">
            <Image src="/img/logo-mark.png" alt="Arcturus mark" width={64} height={64} priority />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-neutral-900">Continue with Google</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Need access?{' '}
            <Link href="/contact" className="text-neutral-900 underline-offset-4 hover:underline">
              Contact Arcturus
            </Link>
            .
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/40 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-900">
              G
            </span>
            {busy ? 'Preparing your workspace…' : 'Sign in with Google'}
          </button>

          <div className="mt-4 text-xs text-neutral-500">
            You may be asked to share your email so we can confirm you belong to the STEa workspace.
          </div>
        </div>

        <div className="text-xs text-neutral-400">
          Having trouble? Clear cookies, reload this page, or email{' '}
          <a href="mailto:hello@arcturusdc.com" className="underline-offset-4 hover:underline">
            hello@arcturusdc.com
          </a>
          .
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-10 px-4 py-16">
      <div className="flex flex-col items-start gap-4 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm shadow-neutral-800/10 backdrop-blur">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">STEa workspace</p>
            <h1 className="mt-1 text-3xl font-semibold text-neutral-900">Welcome back, {user.displayName || user.email || 'teammate'}.</h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-600">
              Choose where you&apos;d like to work today. Your Google session is active and server access has been granted.
            </p>
            {currentTenant && (
              <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                <span>Current workspace:</span>
                <span className="font-semibold text-neutral-900">{currentTenant.name}</span>
                {currentTenant.plan && (
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-medium capitalize text-pink-700">
                    {currentTenant.plan}
                  </span>
                )}
              </div>
            )}
            {!tenantLoading && availableTenants.length === 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                ⚠️ No workspace access. Contact your administrator.
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {availableTenants.length > 0 && <TenantSwitcher />}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        {(sessionSyncing || signingOut) && (
          <div className="text-xs text-neutral-500">
            {sessionSyncing ? 'Refreshing your STEa session…' : 'Ending your session…'}
          </div>
        )}

        {error && (
          <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {IN_SESSION_DESTINATIONS.map((dest) => (
          <Link
            key={dest.href}
            href={dest.href}
            className="group relative flex flex-col gap-3 rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm shadow-neutral-800/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-800/10 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 focus:ring-offset-white"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">{dest.label}</h2>
                {dest.note ? (
                  <div className="text-xs text-neutral-400">{dest.note}</div>
                ) : null}
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 transition group-hover:border-neutral-300 group-hover:text-neutral-900">
                →
              </span>
            </div>
            <p className="text-sm text-neutral-600">{dest.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

