const ALLOWED_IMAGE_HOSTS = new Set([
  'commons.wikimedia.org',
  'upload.wikimedia.org',
]);

const IMAGE_HEADERS = {
  Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'User-Agent': 'ArtAtlasPrototype/1.0 (https://www.arcturusdc.com)',
};

const COMMONS_TEXTURE_WIDTH = '1400';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 604800;

export async function GET(request) {
  const target = parseAllowedImageUrl(new URL(request.url).searchParams.get('url'));

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

function parseAllowedImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return null;
    if (!ALLOWED_IMAGE_HOSTS.has(url.hostname)) return null;
    if (url.hostname === 'commons.wikimedia.org' && url.pathname.includes('/wiki/Special:FilePath/') && !url.searchParams.has('width')) {
      url.searchParams.set('width', COMMONS_TEXTURE_WIDTH);
    }
    return url;
  } catch {
    return null;
  }
}
