// Force HTTPS and 'www' canonical host, skip API routes
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function middleware(req) {
  const url = req.nextUrl;
  const host = url.host;

  /* ---------------- HTTPS & Canonical ---------------- */
  // Skip API routes entirely (they must not be redirected)
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Force HTTPS
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  // Canonical host: www.arcturusdc.com
  const canonical = 'www.arcturusdc.com';
  if (host === 'arcturusdc.com') {
    url.host = canonical;
    return NextResponse.redirect(url, 308);
  }

  // Trim multiple slashes and trailing index.html
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.replace(/\/index\.html$/, '/');
    return NextResponse.redirect(url, 308);
  }

  /* ---------------- Protected Routes ---------------- */
  // Add any page or subtree that requires Google/Firebase auth (include /apps and vanity /stea paths)
  const protectedPaths = [
    '/apps/stea/admin',
    '/apps/stea/automatedtestsdashboard',
    '/apps/stea/autoproduct',
    '/apps/stea/filo',
    '/apps/stea/hans',
    '/apps/stea/harls',
    '/apps/stea/orbit/poc',
    '/apps/stea/orbit/AI-Act-Technical-DocumentationBundle',
    '/apps/stea/toume',
    '/stea/admin',
    '/stea/automatedtestsdashboard',
    '/stea/autoproduct',
    '/stea/filo',
    '/stea/hans',
    '/stea/harls',
    '/stea/orbit/poc',
    '/stea/orbit/AI-Act-Technical-DocumentationBundle',
    '/stea/toume',
  ];

  // True if request path exactly matches or is a child of a protected path
  const isProtected = protectedPaths.some(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`)
  );

  // Check for Firebase session cookie (__session) and verify it
  if (isProtected) {
    const sessionCookie = req.cookies.get('__session')?.value || '';

    if (!sessionCookie) {
      // No session cookie - redirect to login
      const redirectUrl = new URL('/apps/stea', req.url);
      redirectUrl.searchParams.set('next', url.pathname + url.search);
      return NextResponse.redirect(redirectUrl);
    }

    // Verify the session cookie with Firebase Admin
    try {
      const { auth } = getFirebaseAdmin();
      await auth.verifySessionCookie(sessionCookie, true); // checkRevoked = true
      // Session is valid, continue
    } catch (error) {
      // Invalid or expired session - redirect to login
      console.error('[Middleware] Session verification failed:', error.code || error.message);
      const redirectUrl = new URL('/apps/stea', req.url);
      redirectUrl.searchParams.set('next', url.pathname + url.search);

      // Clear the invalid session cookie
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete('__session');
      return response;
    }
  }

  /* ---------------- Security Headers ---------------- */
  const response = NextResponse.next();

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://apis.google.com https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.google.com wss://*.firebaseio.com",
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  // Additional security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

/* ---------------- Matcher ---------------- */
// Exclude API routes, Next.js assets, and static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
