// Edge middleware (D-SITE-064). Edge-safe: no Admin SDK. It does three things:
//   - the canonical host;
//   - a cookie-presence check on the gated routes, so a signed-out request gets a clean redirect
//     before anything renders (option (a) of D-SITE-061). It does not verify the cookie: the
//     server layouts do that (src/lib/serverGate.js, option (c)), and they are the real gate;
//   - the security headers.
// It replaces the root middleware.js, which Next.js never loaded with the app in src/ (D-SITE-061).
import { NextResponse } from 'next/server';
import { PROTECTED_ROUTES, SIGN_IN_PATH } from './lib/protectedRoutes';

const CANONICAL_HOST = 'www.arcturusdc.com';

// Enforced since David's signed-in pass through the STEa apps came back clean (D-SITE-067); it ran
// report-only before that (D-SITE-064). To go back, rename the header to
// Content-Security-Policy-Report-Only.
// cdn.tldraw.com: Harls' whiteboard fonts and translations, from David's pass (D-SITE-065).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://apis.google.com https://accounts.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.tldraw.com",
  "connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://*.google.com https://*.cloudfunctions.net https://www.google-analytics.com https://*.google-analytics.com https://cdn.tldraw.com",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export function middleware(req) {
  const url = req.nextUrl;

  if (url.host === 'arcturusdc.com') {
    url.host = CANONICAL_HOST;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  // /stea/... is a rewrite of /apps/stea/... (next.config.js), so gate both spellings.
  const path = url.pathname.startsWith('/stea/') ? `/apps${url.pathname}` : url.pathname;
  const rule = PROTECTED_ROUTES.find((r) => path === r.base || path.startsWith(`${r.base}/`));
  if (rule && !req.cookies.get('__session')?.value) {
    const to = new URL(SIGN_IN_PATH, req.url);
    to.searchParams.set('next', rule.base);
    return NextResponse.redirect(to, 307);
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', CSP);
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
