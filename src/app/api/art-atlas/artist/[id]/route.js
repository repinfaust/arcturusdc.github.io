import { NextResponse } from 'next/server';
import { ARTIST_LOOKUP } from '@/lib/art-atlas/data';
import { buildArtistMuseum } from '@/lib/art-atlas/wiki';

export const revalidate = 86400;

export async function GET(_request, { params }) {
  const wikidataId = params?.id || '';
  if (!ARTIST_LOOKUP[wikidataId]) {
    return NextResponse.json({ error: 'Unknown Art Atlas artist.' }, { status: 404 });
  }

  let payload;
  try {
    payload = await buildArtistMuseum(wikidataId);
  } catch (error) {
    // Upstream (Wikidata/Commons) failed: say so and keep it out of every cache, so a
    // transient error never becomes a day-long empty gallery.
    console.warn(`[Art Atlas] Artist museum source unavailable for ${wikidataId}.`, error?.message || error);
    return NextResponse.json(
      { error: 'Art sources are temporarily unavailable. Please try again shortly.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (!payload) {
    return NextResponse.json({ error: 'Artist museum unavailable.' }, { status: 404 });
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
