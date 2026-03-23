import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const SESSION_COOKIE_NAME = '__session';
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

async function verifySession(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return false;

  try {
    const { auth } = getFirebaseAdmin();
    await auth.verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request, { params }) {
  const isAuthenticated = await verifySession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

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
    const bytes = await fs.readFile(absolutePath);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': resolveContentType(absolutePath),
        'Cache-Control': 'private, max-age=600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }
}
