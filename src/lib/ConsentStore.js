// src/lib/consentStore.js
const COOKIE_NAME = "adc_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function readConsentFromCookie() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!m) return null;
  try { return JSON.parse(decodeURIComponent(m[1])); } catch { return null; }
}

export function writeConsentCookie(value) {
  if (typeof document === "undefined") return;
  const payload = encodeURIComponent(JSON.stringify(value));
  // NOTE: no HttpOnly (client JS must read it). Keep it Secure + SameSite=Lax.
  document.cookie = `${COOKIE_NAME}=${payload}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax; Secure; Domain=.arcturusdc.com`;
}

export function readConsent() {
  // Prefer cookie; fall back to localStorage
  const fromCookie = readConsentFromCookie();
  if (fromCookie) return fromCookie;
  try { return JSON.parse(localStorage.getItem(COOKIE_NAME) || "null"); } catch { return null; }
}

export function writeConsent(value) {
  writeConsentCookie(value);
  try { localStorage.setItem(COOKIE_NAME, JSON.stringify(value)); } catch {}
}
