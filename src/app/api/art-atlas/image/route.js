const ALLOWED_IMAGE_HOSTS = new Set([
  'commons.wikimedia.org',
  'upload.wikimedia.org',
  // Wikimedia serves scaled thumbnails from this host; Special:FilePath?width=N
  // redirects here for any original larger than the requested width.
  'thumb.wikimedia.org',
]);

const IMAGE_HEADERS = {
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'User-Agent': 'ArtAtlasPrototype/1.0 (https://www.arcturusdc.com)',
};

// Wikimedia only renders thumbnails at fixed steps and rounds other widths up, so the
// client asks for one of these: 500 preview, 1280 near-wall, 1920 inspect, 3840 zoomed
// inspect (the largest size Wikimedia renders) (D-SITE-078).
const ALLOWED_WIDTHS = new Set(['500', '960', '1280', '1920', '3840']);
const DEFAULT_WIDTH = '1280';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 604800;

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const width = ALLOWED_WIDTHS.has(params.get('w')) ? params.get('w') : DEFAULT_WIDTH;
  const target = sizedCommonsUrl(parseAllowedImageUrl(params.get('url')), width);

  if (!target) {
    return Response.json({ error: 'Unsupported Art Atlas image source.' }, { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetch(target.href, {
      headers: IMAGE_HEADERS,
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (error) {
    console.warn('[Art Atlas] Wikimedia image fetch failed.', error?.message || error);
    return Response.json({ error: 'Art Atlas image fetch failed.' }, { status: 502 });
  }

  const finalUrl = parseAllowedImageUrl(upstream.url);
  if (!finalUrl) {
    return Response.json({ error: 'Art Atlas image redirected to an unsupported host.' }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: 'Art Atlas image unavailable.' }, { status: upstream.status || 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) {
    return Response.json({ error: 'Art Atlas source did not return an image.' }, { status: 415 });
  }

  const headers = new Headers({
    'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000',
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  });

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new Response(upstream.body, { headers });
}

// Always fetch a sized thumbnail, never a full-resolution original (some Commons
// originals are 6000px+, far beyond what a wall texture needs).
function sizedCommonsUrl(url, width) {
  if (!url) return null;
  let fileName = '';
  if (url.hostname === 'commons.wikimedia.org' && url.pathname.includes('/wiki/Special:FilePath/')) {
    fileName = url.pathname.split('/wiki/Special:FilePath/')[1];
  } else if (url.hostname === 'upload.wikimedia.org' && /^\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+$/.test(url.pathname)) {
    fileName = url.pathname.split('/').pop();
  }
  if (!fileName) return url;
  const sized = new URL(`https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}`);
  sized.searchParams.set('width', width);
  return sized;
}

function parseAllowedImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return null;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}
