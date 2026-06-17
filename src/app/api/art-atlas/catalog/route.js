import { NextResponse } from 'next/server';
import { buildLocalCatalog, readFirebaseCatalog } from '@/lib/art-atlas/wiki';

export const revalidate = 86400;

export async function GET() {
  const cached = await readFirebaseCatalog();
  const payload = cached || await buildLocalCatalog();

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
