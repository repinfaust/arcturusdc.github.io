// TEMP 2026-06-23 (gate removed 2026-08-14): the third and final auth layer for the
// PAYGO mirror. PaygoMagicLinkGate (page.js) and the poc-analysis session guard were
// dropped on 2026-06-23 while Ensek IT investigate a proxy block on
// identitytoolkit.googleapis.com, but this route was missed — so no __session cookie
// existed and every runtime asset 401'd, leaving the embedded app blank.
// Removed here so the mirror loads unauthenticated. See D-SITE-015.
// RESTORE all three layers together when IT confirm the fix: re-add verifySession()
// (session cookie -> auth.verifySessionCookie) and 401 ahead of the file read.
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const RUNTIME_ROOT = path.join(process.cwd(), 'src/app/apps/stea/paygo/_runtime');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function resolveContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || 'application/octet-stream';
}

function getRuntimeFirebaseApiKey() {
  return String(process.env.PAYGO_FIREBASE_API_KEY || '').trim();
}

function escapeForJsStringLiteral(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '')
    .replace(/\n/g, '');
}

export async function GET(request, { params }) {
  const parts = Array.isArray(params?.asset) ? params.asset : [];
  if (parts.length === 0) {
    return NextResponse.json({ error: 'Asset path required' }, { status: 400 });
  }

  const requestedPath = path.join(...parts);
  const absolutePath = path.resolve(RUNTIME_ROOT, requestedPath);

  if (!(absolutePath === RUNTIME_ROOT || absolutePath.startsWith(`${RUNTIME_ROOT}${path.sep}`))) {
    return NextResponse.json({ error: 'Invalid asset path' }, { status: 400 });
  }

  try {
    const contentType = resolveContentType(absolutePath);
    let body = await fs.readFile(absolutePath);

    if (contentType.startsWith('application/javascript')) {
      const apiKey = getRuntimeFirebaseApiKey();
      if (!apiKey) {
        return NextResponse.json(
          { error: 'PAYGO_FIREBASE_API_KEY is not configured for runtime key hydration' },
          { status: 500 }
        );
      }
      const safeApiKey = escapeForJsStringLiteral(apiKey);
      const source = body.toString('utf8');
      const hydrated = source.replace(/__PAYGO_FIREBASE_API_KEY__/g, safeApiKey);
      body = Buffer.from(hydrated, 'utf8');
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
