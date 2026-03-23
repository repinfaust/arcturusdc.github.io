'use client';

import { useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const MAGIC_LINK_EMAIL_KEY = 'paygo_magic_email';
const ALLOWED_DOMAIN = 'ensek.co.uk';
const ALLOWED_EMAILS = new Set(['repinfaust@gmail.com']);

function isAllowedEmail(value) {
  if (!value) return false;
  const clean = String(value).trim().toLowerCase();
  return clean.endsWith(`@${ALLOWED_DOMAIN}`) || ALLOWED_EMAILS.has(clean);
}

export default function PaygoMagicLinkGate({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => undefined);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      setSessionReady(false);

      if (!firebaseUser) return;
      const userEmail = String(firebaseUser.email || '').toLowerCase();
      if (!isAllowedEmail(userEmail)) {
        await signOut(auth).catch(() => undefined);
        setError(`Access is restricted to @${ALLOWED_DOMAIN} email addresses and approved accounts.`);
        return;
      }

      try {
        const idToken = await firebaseUser.getIdToken();
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          throw new Error(`Failed to establish session (${response.status})`);
        }

        setSessionReady(true);
      } catch {
        setError('Could not establish secure session. Please try again.');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const cachedEmail = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
    const promptedEmail = window.prompt('Confirm your work email to complete sign-in');
    const emailForLink = cachedEmail || promptedEmail || '';
    const normalizedEmail = emailForLink.trim().toLowerCase();

    if (!isAllowedEmail(normalizedEmail)) {
      setError(`Use an @${ALLOWED_DOMAIN} email address or an approved account.`);
      return;
    }

    signInWithEmailLink(auth, normalizedEmail, window.location.href)
      .then(() => {
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch((err) => setError(err?.message || 'Magic link sign-in failed.'));
  }, []);

  async function sendMagicLink() {
    const clean = email.trim().toLowerCase();
    if (!isAllowedEmail(clean)) {
      setError(`Only @${ALLOWED_DOMAIN} addresses and approved accounts are allowed.`);
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');

    try {
      await sendSignInLinkToEmail(auth, clean, {
        url: window.location.href.split('#')[0],
        handleCodeInApp: true,
      });
      window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, clean);
      setNotice(`Magic link sent to ${clean}. Check your junk/spam folder if it does not appear.`);
    } catch (err) {
      setError(err?.message || 'Failed to send sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) {
    return <div style={{ color: '#f8fafc', textAlign: 'center' }}>Checking access...</div>;
  }

  if (!user || !sessionReady) {
    return (
      <div
        style={{
          width: 'min(540px, 92vw)',
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.35)',
          background: 'linear-gradient(170deg,#ffffff,#f8fafc)',
          boxShadow: '0 28px 70px rgba(15, 23, 42, 0.2)',
          padding: '28px 24px',
        }}
      >
        <h1 style={{ margin: 0, color: '#0f172a', fontSize: 30, lineHeight: '34px', fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 800 }}>
          PAYGO Access Required
        </h1>
        <p style={{ marginTop: 10, marginBottom: 0, color: '#334155', fontSize: 14, lineHeight: '20px' }}>
          This web mirror is restricted. Request a magic link using your work email.
        </p>
        <p style={{ marginTop: 4, marginBottom: 0, color: '#475569', fontSize: 13 }}>Allowed domain: @{ALLOWED_DOMAIN}</p>
        <p style={{ marginTop: 4, marginBottom: 0, color: '#475569', fontSize: 13 }}>If the link does not arrive quickly, check your junk/spam folder.</p>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`name@${ALLOWED_DOMAIN}`}
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              padding: '10px 12px',
              color: '#0f172a',
              outline: 'none',
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={busy || !email}
            style={{
              border: 'none',
              borderRadius: 12,
              background: 'linear-gradient(135deg,#0f172a,#1e293b)',
              color: '#fff',
              padding: '0 14px',
              fontWeight: 700,
              opacity: busy || !email ? 0.65 : 1,
              cursor: busy || !email ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Sending...' : 'Send Link'}
          </button>
        </div>

        {error ? <div style={{ marginTop: 10, color: '#991b1b', fontSize: 13 }}>{error}</div> : null}
        {notice ? <div style={{ marginTop: 10, color: '#166534', fontSize: 13 }}>{notice}</div> : null}
      </div>
    );
  }

  return children;
}
