'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const DEFAULT_REDIRECT = '/apps/stea/board';

function sanitizeNext(raw) {
  if (!raw) return DEFAULT_REDIRECT;
  if (typeof raw !== 'string') return DEFAULT_REDIRECT;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return DEFAULT_REDIRECT;
  if (!raw.startsWith('/') || raw.startsWith('//')) return DEFAULT_REDIRECT;
  if (raw === '/apps/stea' || raw === '/stea') return DEFAULT_REDIRECT;
  return raw;
}

export default function SteaLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get('next') || '';

  const destination = useMemo(() => sanitizeNext(nextParam), [nextParam]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessionSyncing, setSessionSyncing] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  const ensureSessionCookie = useCallback(async (firebaseUser) => {
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
    } finally {
      setSessionSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCheckingAuth(false);

      if (!firebaseUser) {
        return;
      }

      try {
        await ensureSessionCookie(firebaseUser);
        router.replace(destination);
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
          Sign in to continue to the STEa Studio Board
        </h1>
        <p className="max-w-xl text-base text-neutral-600">
          Use your authorised Google account to access the internal boards, automations, and planning tools. You&apos;ll be redirected to the board as soon as your session is confirmed.
        </p>
      </div>

      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white/90 p-8 shadow-xl shadow-neutral-800/10 backdrop-blur">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-neutral-100 shadow-inner shadow-neutral-900/5">
          <Image src="/img/logo-mark.png" alt="Arcturus mark" width={64} height={64} priority />
        </div>
        <h2 className="mt-6 text-2xl font-semibold text-neutral-900">Continue with Google</h2>
        <p className="mt-2 text-sm text-neutral-600">
          We only grant access to approved accounts. Need an invite?{' '}
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
          disabled={busy || checkingAuth}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/40 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-900">
            G
          </span>
          {busy ? 'Preparing your workspace…' : 'Sign in with Google'}
        </button>

        <div className="mt-4 text-xs text-neutral-500">
          You may be asked to grant access to your email address so we can verify you belong to the STEa workspace.
        </div>
      </div>

      <div className="text-xs text-neutral-400">
        Having trouble? Try clearing cookies, then reload this page, or email{' '}
        <a href="mailto:hello@arcturusdc.com" className="underline-offset-4 hover:underline">
          hello@arcturusdc.com
        </a>
        .
      </div>
    </div>
  );
}
