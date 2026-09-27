'use client';

import { auth } from '@/lib/firebase';

// The Squared API requires a signed-in workspace member (D-SITE-033). Send the
// Firebase ID token as well as the __session cookie, which lapses after 12h.
async function apiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = await auth?.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// POST an action to the Squared API. Returns { res, data } so callers can
// check res.ok / the 402 limit response themselves.
export async function squaredApi(tenantId, action, payload = {}) {
  const res = await fetch('/api/stea/squared', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ action, tenantId, ...payload }),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { res, data };
}

export async function squaredCheckout(tenantId) {
  const res = await fetch('/api/stea/squared/checkout', {
    method: 'POST',
    headers: await apiHeaders(),
    body: JSON.stringify({ tenantId }),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { res, data };
}
