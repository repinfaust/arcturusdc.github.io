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

const FEATURED_WORKS_BY_ARTIST = {
  Q130531: [
    featuredWork({
      id: 'Q321303',
      title: 'The Garden of Earthly Delights',
      year: '1490',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/The%20Garden%20of%20Earthly%20Delights%20by%20Bosch%20High%20Resolution%202.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Garden_of_Earthly_Delights',
    }),
    featuredWork({
      id: 'Q2213811',
      title: 'The Haywain Triptych',
      year: '1510',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Jheronimus%20Bosch%20-%20De%20hooiwagen%20%28c.1516%2C%20Prado%29.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Haywain_Triptych',
    }),
    featuredWork({
      id: 'Q1217288',
      title: 'Triptych of the Temptation of St. Anthony',
      year: '1501',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Temptation%20of%20Saint%20Anthony.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/Triptych_of_the_Temptation_of_St._Anthony',
    }),
    featuredWork({
      id: 'Q1387483',
      title: 'The Last Judgment',
      year: '1506',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Last%20judgement%20Bosch.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Last_Judgment_(Bosch,_Vienna)',
    }),
    featuredWork({
      id: 'Q405814',
      title: 'Ship of Fools',
      year: '1500',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Jheronimus%20Bosch%20011.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/Ship_of_Fools_(painting)',
    }),
    featuredWork({
      id: 'Q2203011',
      title: 'Death and the Miser',
      year: '1500',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Jheronimus%20Bosch%20050.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/Death_and_the_Miser',
    }),
    featuredWork({
      id: 'Q2304870',
      title: 'The Seven Deadly Sins and the Four Last Things',
      year: '1500',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Hieronymus%20Bosch-%20The%20Seven%20Deadly%20Sins%20and%20the%20Four%20Last%20Things.JPG',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Seven_Deadly_Sins_and_the_Four_Last_Things',
    }),
    featuredWork({
      id: 'Q2276130',
      title: 'Adoration of the Magi',
      year: '1494',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Hieronymus%20Bosch%20-%20Triptych%20of%20the%20Adoration%20of%20the%20Magi%20-%20WGA2606.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/Adoration_of_the_Magi_(Bosch,_Madrid)',
    }),
    featuredWork({
      id: 'Q2270768',
      title: 'Cutting the Stone',
      year: '1503',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Cutting%20the%20Stone%20%28Bosch%29.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/Cutting_the_Stone',
    }),
    featuredWork({
      id: 'Q2400652',
      title: 'The Wayfarer',
      year: '1500',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Jheronimus%20Bosch%20-%20The%20Pedlar%20-%20Google%20Art%20Project.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/The_Wayfarer_(painting)',
    }),
    featuredWork({
      id: 'Q2390197',
      title: 'St. John the Evangelist on Patmos',
      year: '1489',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Johannes%20op%20Patmos%20Saint%20John%20on%20Patmos%20Berlin%2C%20Staatlichen%20Museen%20zu%20Berlin%2C%20Gemaldegalerie%20HR.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/St._John_the_Evangelist_on_Patmos',
    }),
    featuredWork({
      id: 'Q1968805',
      title: 'The Tree-Man',
      year: '1510',
      image: 'http://commons.wikimedia.org/wiki/Special:FilePath/Hieronymus%20Bosch%20-%20The%20Tree-Man%2C%20c.%201505%20-%20Google%20Art%20Project.jpg',
      sourceUrl: 'https://www.wikidata.org/wiki/Q1968805',
    }),
  ],
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
      works: mergeArtistWorks(wikidataId, data.works),
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
  const works = mergeArtistWorks(wikidataId, await fetchWikidataWorks(wikidataId));

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
    LIMIT 24
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
    );
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

function featuredWork({ id, title, year, image, sourceUrl }) {
  const imageSource = normalizeImageUrl(image);
  return {
    id,
    title,
    year,
    image: proxiedImageUrl(imageSource),
    imageSource,
    sourceUrl,
    wikidataUrl: `https://www.wikidata.org/wiki/${id}`,
    story: 'This work is included from a Wikidata work record with a Wikimedia Commons image file.',
    fact: year
      ? `Wikidata records the work date as ${year}.`
      : 'Wikidata has not supplied a precise date for this image-backed record.',
  };
}

function mergeArtistWorks(wikidataId, works) {
  return dedupeWorks([
    ...(FEATURED_WORKS_BY_ARTIST[wikidataId] || []),
    ...works.map(withProxiedWorkImage),
  ]).slice(0, 12);
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
