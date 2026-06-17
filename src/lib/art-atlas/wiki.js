import { ARTIST_LOOKUP, ART_PERIODS, ART_ATLAS_VERSION } from './data';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const WIKI_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'ArtAtlasPrototype/1.0 (https://www.arcturusdc.com)',
};

const SPARQL_HEADERS = {
  Accept: 'application/sparql-results+json',
  'User-Agent': 'ArtAtlasPrototype/1.0 (https://www.arcturusdc.com)',
};

export async function readFirebaseCatalog() {
  try {
    const { db } = getFirebaseAdmin();
    const snapshot = await db.collection('art_atlas_catalog').doc('main').get();
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    if (!data?.periods || data.version !== ART_ATLAS_VERSION) return null;
    return {
      ...data,
      sourceMode: 'firebase',
    };
  } catch (error) {
    console.warn('[Art Atlas] Firebase catalogue cache unavailable; using live Wikipedia/Wikidata source records.', error?.message || error);
    return null;
  }
}

export async function readFirebaseArtist(wikidataId) {
  try {
    const { db } = getFirebaseAdmin();
    const snapshot = await db.collection('art_atlas_artists').doc(wikidataId).get();
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    if (!data?.artist || !Array.isArray(data?.works)) return null;
    return {
      ...data,
      works: data.works.map(withProxiedWorkImage),
      sourceMode: 'firebase',
    };
  } catch (error) {
    console.warn(`[Art Atlas] Firebase artist cache unavailable for ${wikidataId}; using live Wikidata source records.`, error?.message || error);
    return null;
  }
}

export async function buildLocalCatalog() {
  const periodResults = await Promise.all(
    ART_PERIODS.map(async (period) => {
      const artists = await Promise.all(
        period.artists.map(async (artist) => enrichArtistSummary(artist, period))
      );
      return { ...period, artists };
    })
  );

  return {
    version: ART_ATLAS_VERSION,
    sourceMode: 'wikipedia-live',
    generatedAt: new Date().toISOString(),
    periods: periodResults,
    attribution: {
      text: 'Artist summaries and thumbnails are fetched from Wikipedia. Artwork images are fetched from Wikidata/Wikimedia Commons on demand.',
      wikipedia: 'https://www.wikipedia.org/',
      wikidata: 'https://www.wikidata.org/',
      commons: 'https://commons.wikimedia.org/',
    },
  };
}

export async function buildArtistMuseum(wikidataId) {
  const baseArtist = ARTIST_LOOKUP[wikidataId];
  if (!baseArtist) return null;

  const cached = await readFirebaseArtist(wikidataId);
  if (cached) return cached;

  const artist = await enrichArtistSummary(baseArtist, {
    id: baseArtist.periodId,
    name: baseArtist.periodName,
    years: baseArtist.periodYears,
    color: baseArtist.periodColor,
  });
  const works = await fetchWikidataWorks(wikidataId);

  return {
    version: ART_ATLAS_VERSION,
    sourceMode: 'wikidata-live',
    generatedAt: new Date().toISOString(),
    artist,
    works,
    attribution: {
      text: 'Work titles, years, and image URLs come from Wikidata claims and Wikimedia Commons file paths.',
      wikidata: artist.wikidataUrl,
      wikipedia: artist.wikipediaUrl,
      commons: 'https://commons.wikimedia.org/',
    },
  };
}

async function enrichArtistSummary(artist, period) {
  const summary = await fetchWikipediaSummary(artist.wikipediaTitle);
  const extract = compactExtract(summary?.extract || '');

  return {
    ...artist,
    periodId: period.id,
    periodName: period.name,
    periodYears: period.years,
    periodColor: period.color,
    summary: extract || `${artist.name} is represented here through Wikipedia and Wikimedia source records.`,
    portrait: normalizeImageUrl(summary?.thumbnail?.source || summary?.originalimage?.source || ''),
    wikipediaUrl: summary?.content_urls?.desktop?.page || artist.wikipediaUrl,
    sourceTitle: summary?.title || artist.wikipediaTitle,
  };
}

async function fetchWikipediaSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const response = await fetch(url, {
      headers: WIKI_HEADERS,
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    return null;
  }
}

async function fetchWikidataWorks(wikidataId) {
  const query = `
    SELECT ?work ?workLabel ?image ?inception ?article WHERE {
      ?work wdt:P170 wd:${wikidataId};
            wdt:P18 ?image.
      OPTIONAL { ?work wdt:P571 ?inception. }
      OPTIONAL {
        ?article schema:about ?work;
                 schema:isPartOf <https://en.wikipedia.org/>.
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 16
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: SPARQL_HEADERS,
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return dedupeWorks(
      data.results.bindings.map((binding) => ({
        id: binding.work.value.split('/').pop(),
        title: binding.workLabel.value,
        year: binding.inception?.value?.slice(0, 4) || '',
        image: proxiedImageUrl(binding.image.value),
        imageSource: normalizeImageUrl(binding.image.value),
        sourceUrl: binding.article?.value || binding.work.value,
        wikidataUrl: binding.work.value,
        story: binding.article?.value
          ? 'This work has a linked Wikipedia article and a Wikimedia image record.'
          : 'This work is listed on Wikidata with a Wikimedia Commons image claim.',
        fact: binding.inception?.value
          ? `Wikidata records the work date as ${binding.inception.value.slice(0, 10)}.`
          : 'Wikidata has not supplied a precise date for this image-backed record.',
      }))
    ).slice(0, 12);
  } catch (error) {
    return [];
  }
}

function compactExtract(text) {
  return text
    .replace(/\s+/g, ' ')
    .split('. ')
    .slice(0, 2)
    .join('. ')
    .replace(/\.$/, '') + (text ? '.' : '');
}

function normalizeImageUrl(url) {
  if (!url) return '';
  return url.replace(/^http:\/\//, 'https://');
}

function proxiedImageUrl(url) {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return '';
  if (normalized.startsWith('/api/art-atlas/image?')) return normalized;
  return `/api/art-atlas/image?url=${encodeURIComponent(normalized)}`;
}

function withProxiedWorkImage(work) {
  const source = normalizeImageUrl(work.imageSource || work.image || '');
  return {
    ...work,
    imageSource: source,
    image: proxiedImageUrl(source),
  };
}

function dedupeWorks(works) {
  const seen = new Set();
  return works.filter((work) => {
    const key = `${work.title}-${work.imageSource || work.image}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(work.image && work.title);
  });
}
