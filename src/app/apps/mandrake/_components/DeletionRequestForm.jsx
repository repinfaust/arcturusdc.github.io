'use client';

import { useRef, useState } from 'react';

export default function DeletionRequestForm() {
  const inFlight = useRef(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const uid = form.elements.uid.value.trim();
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
      setError('Paste the identifier from Settings → Account in Mandrake.');
      return;
    }
    inFlight.current = true;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/mandrake/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store',
        body: JSON.stringify({ uid, website: form.elements.website.value }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('send_failed');
      form.reset();
      setStatus('sent');
    } catch {
      setStatus('idle');
      setError('We couldn’t send your request. Please try again. Your identifier is still in the form.');
    } finally {
      inFlight.current = false;
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="my-6 border border-neutral-300 border-l-4 border-l-neutral-950 bg-neutral-50 p-5">
        <p className="font-bold text-neutral-950">Your deletion request has been sent.</p>
        <p>We’ll review it and aim to complete the deletion within 30 days.</p>
        <p>No email address was requested, so this on-screen message is your confirmation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="my-6 border border-neutral-300 bg-neutral-50 p-5" aria-label="Mandrake deletion request" aria-busy={status === 'sending'}>
      <label htmlFor="mandrake-deletion-uid" className="block font-bold text-neutral-950">App identifier (UID)</label>
      <p id="mandrake-deletion-help" className="text-sm">Copy it from Settings → Account in Mandrake. You don’t need to provide your name or email address.</p>
      <input
        id="mandrake-deletion-uid"
        name="uid"
        type="text"
        required
        maxLength={128}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-describedby={`mandrake-deletion-help${error ? ' mandrake-deletion-error' : ''}`}
        className="block w-full rounded-none border border-neutral-500 bg-white px-3 py-3 font-mono text-base text-neutral-950 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-neutral-950"
        disabled={status === 'sending'}
      />
      <div hidden aria-hidden="true">
        <label htmlFor="mandrake-deletion-website">Leave this field blank</label>
        <input id="mandrake-deletion-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {error ? <p role="alert" id="mandrake-deletion-error" className="font-semibold text-neutral-950">{error}</p> : null}
      <button type="submit" disabled={status === 'sending'} className="mt-4 min-h-11 border-2 border-neutral-950 bg-neutral-950 px-5 py-3 font-bold text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-neutral-950 disabled:opacity-60">
        {status === 'sending' ? 'Sending request…' : 'Request deletion'}
      </button>
      <noscript><p>JavaScript is needed to send this form. You can also delete your data in the app using the steps above.</p></noscript>
    </form>
  );
}
