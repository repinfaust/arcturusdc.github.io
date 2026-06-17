import { NextResponse } from 'next/server';
import { ARTIST_LOOKUP } from '@/lib/art-atlas/data';
import { buildArtistMuseum } from '@/lib/art-atlas/wiki';

export const revalidate = 86400;

export async function GET(_request, { params }) {
  const wikidataId = params?.id || '';
  if (!ARTIST_LOOKUP[wikidataId]) {
    return NextResponse.json({ error: 'Unknown Art Atlas artist.' }, { status: 404 });
  }

  const payload = await buildArtistMuseum(wikidataId);
  if (!payload) {
    return NextResponse.json({ error: 'Artist museum unavailable.' }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
