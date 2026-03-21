'use client';

import { useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  setPersistence,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const MAGIC_LINK_EMAIL_KEY = 'sorr_controlui_magic_email';

export default function SorrRouteAuthGate({ children }) {
  const [authReady, setAuthReady] = useState(false);
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

      if (!firebaseUser) return;
      try {
        const idToken = await firebaseUser.getIdToken();
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch {
        setError('Could not establish secure session.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    const cachedEmail = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
    const emailForLink = cachedEmail || window.prompt('Confirm your email to complete sign-in');
    if (!emailForLink) return;

    signInWithEmailLink(auth, emailForLink, window.location.href)
      .then(() => {
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch((err) => setError(err?.message || 'Magic link sign-in failed.'));
  }, []);

  async function sendMagicLink() {
    const clean = email.trim();
    if (!clean) return;
    setBusy(true);
    setError('');
    try {
      await sendSignInLinkToEmail(auth, clean, { url: window.location.href.split('#')[0], handleCodeInApp: true });
      window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, clean);
      setNotice(`Magic link sent to ${clean}`);
    } catch (err) {
      setError(err?.message || 'Failed to send sign-in link.');
    } finally {
      setBusy(false);
    }
  }

  if (!authReady) {
    return <div style={{ color: '#fff' }}>Checking authentication...</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 640, margin: '52px auto', background: '#FFFFFF', borderRadius: 20, padding: 24 }}>
        <h1 style={{ margin: 0, color: '#001432', fontSize: 34, lineHeight: '36px', fontFamily: 'var(--font-controlui-display)' }}>
          SoRR Control Access Required
        </h1>
        <p style={{ marginTop: 8, color: '#4C5D74', fontSize: 14 }}>
          This area is restricted. Use your authorised magic link to continue.
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            style={{ flex: 1, border: 'none', borderRadius: 12, background: '#EFF4FF', padding: '10px 12px', color: '#0B1C30', outline: 'none' }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={busy || !email}
            style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#10294D,#001432)', color: '#fff', padding: '0 14px', fontWeight: 700, opacity: busy || !email ? 0.65 : 1 }}
          >
            {busy ? 'Sending...' : 'Send Link'}
          </button>
        </div>
        {error ? <div style={{ marginTop: 8, color: '#8A1C17', fontSize: 13 }}>{error}</div> : null}
        {notice ? <div style={{ marginTop: 8, color: '#006C50', fontSize: 13 }}>{notice}</div> : null}
      </div>
    );
  }

  return children;
}
