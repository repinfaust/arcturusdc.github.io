import { NextResponse } from 'next/server';

const IOS_STORE_URL = 'https://apps.apple.com/us/app/dialled-mtb/id6760664613';
const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.arcturusdc.dialledmtb';
const FALLBACK_URL = '/apps/dialled-mtb';

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
  if (/android/i.test(userAgent)) {
    return ANDROID_STORE_URL;
  }

  if (/(iphone|ipad|ipod)/i.test(userAgent)) {
    return IOS_STORE_URL;
  }

  return FALLBACK_URL;
}
