// Force HTTPS and 'www' canonical host, skip API routes
import { NextResponse } from 'next/server';

export function middleware(req) {
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
    '/apps/stea/automatedtestsdashboard',
    '/apps/stea/board',
    '/apps/stea/filo',
    '/apps/stea/toume',
    '/stea/automatedtestsdashboard',
    '/stea/board',
    '/stea/filo',
    '/stea/toume',
  ];

  // True if request path exactly matches or is a child of a protected path
  const isProtected = protectedPaths.some(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`)
  );

  // Check for Firebase session cookie (__session)
  const sessionCookie = req.cookies.get('__session')?.value || '';

  if (isProtected && !sessionCookie) {
    // Redirect unauthenticated users to /apps/stea (login)
    const redirectUrl = new URL('/apps/stea', req.url);
    redirectUrl.searchParams.set('next', url.pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  /* ---------------- Default ---------------- */
  return NextResponse.next();
}

/* ---------------- Matcher ---------------- */
// Exclude API routes, Next.js assets, and static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
