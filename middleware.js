// Force HTTPS and 'www' canonical host.
import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = req.nextUrl;
  const host = url.host;

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)'],
};
