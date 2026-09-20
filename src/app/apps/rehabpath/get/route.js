import { NextResponse } from 'next/server';
import apps from '@/data/apps.json';

// Store URLs are read from the app catalogue rather than duplicated here, so a
// listing change cannot leave this redirect pointing at a dead URL (D-SITE-028).
const rehabpath = apps.find((app) => app.id === 'rehabpath');

const IOS_STORE_URL = rehabpath?.appStoreUrl;
const ANDROID_STORE_URL = rehabpath?.googlePlayUrl;
const FALLBACK_URL = '/apps/rehabpath';

export const dynamic = 'force-dynamic';

export function GET(request) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const destination = storeUrlForUserAgent(userAgent);
  const response = NextResponse.redirect(new URL(destination, request.url), 302);

  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Vary', 'User-Agent');

  return response;
}

function storeUrlForUserAgent(userAgent) {
  // A missing catalogue URL falls back to the marketing page, which lists both
  // stores, rather than redirecting to `undefined`.
  if (/android/i.test(userAgent)) {
    return ANDROID_STORE_URL ?? FALLBACK_URL;
  }

  if (/(iphone|ipad|ipod)/i.test(userAgent)) {
    return IOS_STORE_URL ?? FALLBACK_URL;
  }

  return FALLBACK_URL;
}
