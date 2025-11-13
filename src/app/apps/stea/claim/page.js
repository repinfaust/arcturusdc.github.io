'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

export default function ClaimWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [pendingWorkspace, setPendingWorkspace] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing claim token. Please check your email for the complete link.');
      return;
    }

    // Check if pending workspace exists
    const checkPendingWorkspace = async () => {
      try {
        const response = await fetch(`/api/claim-workspace?token=${token}`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setPendingWorkspace(data);
        } else if (response.status === 404) {
          setError('Invalid or expired claim token. Please contact support.');
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to load workspace details.');
        }
      } catch (err) {
        console.error('Error checking pending workspace:', err);
        setError('Failed to load workspace details. Please try again.');
      }
    };

    checkPendingWorkspace();
  }, [token]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google sign-in failed', err);
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !token) return;

    setError('');
    setClaiming(true);

    try {
      const response = await fetch('/api/claim-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.expectedEmail) {
          setError(data.message || `Please sign in with ${data.expectedEmail} (the email you used at checkout).`);
          // Sign out so they can sign in with the correct account
          await signOut(auth);
          setUser(null);
        } else {
          setError(data.error || 'Failed to claim workspace. Please try again.');
        }
        return;
      }

      // Success!
      setSuccess(true);
      
      // Redirect to workspace after a moment
      setTimeout(() => {
        router.push('/apps/stea');
      }, 2000);
    } catch (err) {
      console.error('Error claiming workspace:', err);
      setError('Failed to claim workspace. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-2xl font-semibold text-red-900 mb-4">Invalid Claim Link</h1>
          <p className="text-red-700 mb-6">{error || 'Missing claim token. Please check your email for the complete link.'}</p>
          <Link href="/apps/stea/explore" className="text-red-600 hover:underline">
            Return to STEa
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="text-2xl font-semibold text-green-900 mb-4">Workspace Claimed!</h1>
          <p className="text-green-700 mb-6">
            Your workspace <strong>{pendingWorkspace?.workspaceName}</strong> has been successfully set up.
            Redirecting you to STEa...
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mb-4 text-lg text-neutral-600">Loading...</div>
        </div>
      </div>
    );
  }

  const expectedEmail = pendingWorkspace?.googleEmail;
  const emailMatches = user && expectedEmail && user.email?.toLowerCase() === expectedEmail.toLowerCase();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16 bg-starburst">
      <div className="w-full max-w-lg rounded-3xl border border-neutral-200 bg-white/90 p-8 shadow-xl shadow-neutral-800/10 backdrop-blur">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/img/acturusdc_stea_logo.png"
              alt="STEa Logo"
              width={48}
              height={48}
              className="object-contain"
            />
            <h1 className="text-3xl font-semibold text-neutral-900">Complete Your Setup</h1>
          </div>
          
          {pendingWorkspace && (
            <div className="mb-4">
              <p className="text-lg text-neutral-700 mb-2">
                Workspace: <strong>{pendingWorkspace.workspaceName}</strong>
              </p>
              <p className="text-sm text-neutral-600">
                Sign in with Google to claim your workspace
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!user ? (
          <div>
            <p className="text-sm text-neutral-600 mb-4 text-center">
              {expectedEmail && (
                <>
                  Please sign in with <strong>{expectedEmail}</strong> (the email you used at checkout).
                </>
              )}
            </p>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-neutral-900">
                G
              </span>
              {signingIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>
        ) : (
          <div>
            {emailMatches ? (
              <div>
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  ✓ Signed in as {user.email}
                </div>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {claiming ? 'Claiming workspace...' : 'Claim Workspace'}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  ⚠️ You're signed in as {user.email}, but this workspace requires {expectedEmail}
                </div>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    setUser(null);
                    setError('');
                  }}
                  className="w-full rounded-full border border-neutral-200 px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Sign Out & Use Correct Account
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-neutral-500">
          <Link href="/apps/stea/explore" className="hover:underline">
            Return to STEa
          </Link>
        </div>
      </div>
    </div>
  );
}

