// Force HTTPS and 'www' canonical host, skip API routes
import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = req.nextUrl;
  const host = url.host;

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

  const protectedPaths = ['/apps/stea/automatedtestsdashboard', '/apps/stea/board'];
  const isProtected = protectedPaths.some((path) => url.pathname.startsWith(path));
  const sessionCookie = req.cookies.get('__session');

  if (isProtected && !sessionCookie) {
    const redirectUrl = new URL('/apps/stea', req.url);
    redirectUrl.searchParams.set('next', url.pathname + url.search);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// ✅ Updated matcher — exclude API, _next assets, and static files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
