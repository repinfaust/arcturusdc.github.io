// Session cookies are created by a Route Handler. Crossing this auth boundary
// needs a document request, not an RSC payload cached before the cookie existed.
const HANDOFF_RETRY_WINDOW_MS = 30_000;

export function sanitizeSteaNext(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return null;
  const url = new URL(raw, 'https://stea.invalid');
  if (url.origin !== 'https://stea.invalid') return null;
  if (['/apps/stea', '/stea'].includes(url.pathname.replace(/\/+$/, ''))) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function handoffSteaSession(destination, { location, storage, now = Date.now() }) {
  const safeDestination = sanitizeSteaNext(destination);
  if (!safeDestination) throw new Error('Invalid STEa destination');

  // If a successful login immediately bounces back, keep the error visible
  // rather than minting cookies and reloading indefinitely. No token is stored.
  const key = `stea:session-handoff:${safeDestination}`;
  const previous = Number(storage.getItem(key));
  if (previous > 0 && now >= previous && now - previous < HANDOFF_RETRY_WINDOW_MS) {
    return false;
  }
  storage.setItem(key, String(now));
  location.replace(safeDestination);
  return true;
}

export function resetSteaSessionHandoff(destination, storage) {
  const safeDestination = sanitizeSteaNext(destination);
  if (safeDestination) storage.removeItem(`stea:session-handoff:${safeDestination}`);
}
