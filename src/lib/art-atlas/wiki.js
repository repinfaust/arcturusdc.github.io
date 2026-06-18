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

const COMMONS_CATEGORY_FALLBACKS_BY_ARTIST = {
  Q7836: ['Category:La Trahison des images', 'Category:Le Thérapeute'],
  Q160149: ['Category:Rothko Chapel'],
  Q132305: ['Category:Paintings by Willem de Kooning', 'Category:Sculptures by Willem de Kooning'],
  Q5603: ["Category:Campbell's Soup Cans", 'Category:BMW M1 Art Car by Andy Warhol'],
  Q231121: ['Category:Artworks by Yayoi Kusama'],
  Q154340: ['Category:Works by Francis Bacon (artist)'],
};

const FEATURED_WORKS_BY_ARTIST = {
  Q154340: [
    commonsWork({
      id: 'commons-bacon-study-pope-vi',
      title: 'Study for a Pope VI',
      year: '1961',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Francis%20Bacon%2C%20%22Estudo%20para%20um%20Papa%20VI%22%2C%20Capturing%20The%20Moment%2C%20Tate%20Modern%2002.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Francis_Bacon,_%22Estudo_para_um_Papa_VI%22,_Capturing_The_Moment,_Tate_Modern_02.jpg',
    }),
    commonsWork({
      id: 'commons-bacon-three-studies-lucian-freud',
      title: 'Three Studies for a Portrait of Lucian Freud',
      year: '1964',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Francis%20Bacon%2C%20%22Tr%C3%AAs%20Estudos%20para%20o%20Retrato%20de%20Lucien%20Freud%22%2C%20Capturing%20The%20Moment%2C%20Tate%20Modern%2001.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Francis_Bacon,_%22Tr%C3%AAs_Estudos_para_o_Retrato_de_Lucien_Freud%22,_Capturing_The_Moment,_Tate_Modern_01.jpg',
    }),
    commonsWork({
      id: 'commons-bacon-painted-screen-a',
      title: 'Painted Screen (early work)',
      year: '1929',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Francis%20bacon%2C%20paravento%20dipinto%2C%201929%20ca.%2001.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Francis_bacon,_paravento_dipinto,_1929_ca._01.jpg',
    }),
    commonsWork({
      id: 'commons-bacon-painted-screen-b',
      title: 'Painted Screen, detail (early work)',
      year: '1929',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Francis%20bacon%2C%20paravento%20dipinto%2C%201929%20ca.%2002.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Francis_bacon,_paravento_dipinto,_1929_ca._02.jpg',
    }),
  ],
  Q5588: [
    commonsWork({
      id: 'commons-frida-kahlo-broken-column',
      title: 'The Broken Column',
      year: '1944',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/La%20Columna%20Rota%2C%20Frida%20Kahlo%2C%20Museo%20Dolores%20Olmedo.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:La_Columna_Rota,_Frida_Kahlo,_Museo_Dolores_Olmedo.jpg',
    }),
    commonsWork({
      id: 'commons-frida-kahlo-self-portrait-small-monkey',
      title: 'Self-Portrait with Small Monkey',
      year: '1945',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Autorretrato%20con%20Changuito%2C%20Frida%2C%20Museo%20Dolores%20Olmedo.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Autorretrato_con_Changuito,_Frida,_Museo_Dolores_Olmedo.jpg',
    }),
    commonsWork({
      id: 'commons-frida-kahlo-a-few-small-nips',
      title: 'A Few Small Nips',
      year: '1935',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Unos%20cuantos%20piquetitos%2C%20Frida%2C%20Museo%20Dolores%20Olmedo.webp',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Unos_cuantos_piquetitos,_Frida,_Museo_Dolores_Olmedo.webp',
    }),
    commonsWork({
      id: 'commons-frida-kahlo-urban-landscape',
      title: 'Urban Landscape',
      year: '1925',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Frida%20Kahlo%2C%20Paisaje%20urbano%2C%201925.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Frida_Kahlo,_Paisaje_urbano,_1925.jpg',
    }),
    commonsWork({
      id: 'commons-frida-kahlo-tree-of-hope',
      title: 'Tree of Hope, Remain Strong',
      year: '1946',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Arbol%20de%20la%20Esperanza%2C%20Mantente%20Firme%20%28Tree%20of%20Hope%2C%20Remain%20Strong%29%20by%20Frida%20Kahlo%2C%20created%20in%201946.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Arbol_de_la_Esperanza,_Mantente_Firme_(Tree_of_Hope,_Remain_Strong)_by_Frida_Kahlo,_created_in_1946.jpg',
    }),
  ],
  Q37571: [
    commonsWork({
      id: 'commons-jackson-pollock-peddler',
      title: 'Peddler',
      year: '1935',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Peddler%20by%20Jackson%20Pollock.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Peddler_by_Jackson_Pollock.jpg',
    }),
    commonsWork({
      id: 'commons-jackson-pollock-circle',
      title: 'Circle',
      year: '1941',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Circle%20by%20Jackson%20Pollock.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Circle_by_Jackson_Pollock.jpg',
    }),
  ],
  Q159907: [
    commonsWork({
      id: 'commons-hockney-bmw-art-car',
      title: 'BMW 850 CSi Art Car',
      year: '1995',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/BMW%20Art%20Car%20no.%2014%2C%20850CSi%20David%20Hockney%20%281995%29.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:BMW_Art_Car_no._14,_850CSi_David_Hockney_(1995).jpg',
    }),
    commonsWork({
      id: 'commons-hockney-bmw-art-car-detail',
      title: 'BMW 850 CSi Art Car, door detail',
      year: '1995',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/1995%20BMW%20850%20CSi%20by%20David%20Hockney%20-%20door%20closeup.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:1995_BMW_850_CSi_by_David_Hockney_-_door_closeup.jpg',
    }),
    commonsWork({
      id: 'commons-hockney-queen-elizabeth-window',
      title: 'Queen Elizabeth II Window',
      year: '',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/View%20of%20a%20stained%20glass%20window%20in%20Westminster%20Abbey%20-%20geograph.org.uk%20-%206879744.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:View_of_a_stained_glass_window_in_Westminster_Abbey_-_geograph.org.uk_-_6879744.jpg',
    }),
    commonsWork({
      id: 'commons-hockney-queen-elizabeth-window-view',
      title: 'Queen Elizabeth II Window, Westminster Abbey',
      year: '',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Westminster%20Abbey%20-%2051370500850.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Westminster_Abbey_-_51370500850.jpg',
    }),
  ],
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
    // Reject caches from an older schema so enriched work descriptions take effect.
    if (data.version !== ART_ATLAS_VERSION) return null;
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
  const [wikidataWorks, commonsFallbackWorks] = await Promise.all([
    fetchWikidataWorks(wikidataId),
    fetchCommonsFallbackWorks(wikidataId),
  ]);
  const mergedWorks = mergeArtistWorks(wikidataId, [...wikidataWorks, ...commonsFallbackWorks]);
  // Pull a real gallery-label description for each work from its linked Wikipedia
  // article, so the inspect card reads like a museum wall text rather than a
  // generic "this work has a record" placeholder.
  const works = await Promise.all(mergedWorks.map((work) => enrichWorkDescription(work, artist)));

  return {
    version: ART_ATLAS_VERSION,
    sourceMode: 'wikidata-live',
    generatedAt: new Date().toISOString(),
    artist,
    works,
    attribution: {
      text: 'Work titles, years, and image URLs come from Wikidata claims and Wikimedia Commons file/category records.',
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

function wikipediaTitleFromUrl(url) {
  if (!url) return null;
  const match = /https?:\/\/en\.wikipedia\.org\/wiki\/([^?#]+)/.exec(url);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (error) {
    return match[1];
  }
}

// Replace the placeholder `story` with the artwork's own Wikipedia lead paragraph
// (a few sentences), the way a gallery prints a wall label beside the piece.
async function enrichWorkDescription(work, artist) {
  const title = wikipediaTitleFromUrl(work.sourceUrl);
  if (!title) return work;

  const summary = await fetchWikipediaSummary(title);
  const extract = wallLabelExtract(summary?.extract || '');
  if (!extract) return work;

  // Prefer the article's display title, but strip a trailing disambiguation
  // parenthetical (e.g. "(J. M. W. Turner)", "(painting)") for a clean wall label.
  const normalized = summary?.titles?.normalized || work.title;
  const cleanTitle = normalized.replace(/\s*\([^)]*\)\s*$/, '').trim() || work.title;

  return {
    ...work,
    title: cleanTitle,
    story: extract,
    fact: work.year ? `${artist.name} · ${work.year}` : artist.name,
  };
}

// A touch longer than the artist blurb — up to ~4 sentences — for a label feel.
function wallLabelExtract(text) {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return '';
  const sentences = compact.split(/(?<=\.)\s+/).slice(0, 4).join(' ');
  return sentences;
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
    ORDER BY DESC(BOUND(?article)) ?workLabel
    LIMIT 96
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
      data.results.bindings.map((binding) => {
        const year = formatWikidataYear(binding.inception?.value);
        return {
          id: binding.work.value.split('/').pop(),
          title: binding.workLabel.value,
          year,
          image: proxiedImageUrl(binding.image.value),
          imageSource: normalizeImageUrl(binding.image.value),
          sourceUrl: binding.article?.value || binding.work.value,
          wikidataUrl: binding.work.value,
          sourceType: 'wikidata',
          story: binding.article?.value
            ? 'This work has a linked Wikipedia article and a Wikimedia image record.'
            : 'This work is listed on Wikidata with a Wikimedia Commons image claim.',
          fact: year
            ? `Wikidata records the work date as ${year}.`
            : 'Wikidata has not supplied a precise date for this image-backed record.',
        };
      })
    );
  } catch (error) {
    return [];
  }
}

async function fetchCommonsFallbackWorks(wikidataId) {
  const categories = COMMONS_CATEGORY_FALLBACKS_BY_ARTIST[wikidataId] || [];
  if (categories.length === 0) return [];

  const results = await Promise.all(
    categories.map(async (category) => {
      const url = new URL('https://commons.wikimedia.org/w/api.php');
      url.searchParams.set('action', 'query');
      url.searchParams.set('generator', 'categorymembers');
      url.searchParams.set('gcmtitle', category);
      url.searchParams.set('gcmnamespace', '6');
      url.searchParams.set('gcmlimit', '24');
      url.searchParams.set('prop', 'imageinfo');
      url.searchParams.set('iiprop', 'url|mime|extmetadata');
      url.searchParams.set('format', 'json');

      try {
        const response = await fetch(url, {
          headers: WIKI_HEADERS,
          next: { revalidate: 60 * 60 * 24 * 7 },
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Object.values(data?.query?.pages || {})
          .map((page) => commonsCategoryWork(page, category))
          .filter(Boolean);
      } catch {
        return [];
      }
    })
  );

  return dedupeWorks(results.flat());
}

function formatWikidataYear(value) {
  const match = String(value || '').match(/^[+-]?\d{1,4}/);
  if (!match) return '';
  const raw = match[0].replace(/^\+/, '');
  if (raw.startsWith('-')) return raw;
  return raw.padStart(4, '0');
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
    sourceType: 'wikidata',
    story: 'This work is included from a Wikidata work record with a Wikimedia Commons image file.',
    fact: year
      ? `Wikidata records the work date as ${year}.`
      : 'Wikidata has not supplied a precise date for this image-backed record.',
  };
}

function commonsWork({ id, title, year, image, sourceUrl, category }) {
  const imageSource = normalizeImageUrl(image);
  return {
    id,
    title,
    year,
    image: proxiedImageUrl(imageSource),
    imageSource,
    sourceUrl,
    wikidataUrl: sourceUrl,
    sourceType: 'commons',
    story: 'This source-backed work is included from a Wikimedia Commons file record where Wikidata does not expose a creator-image work entry.',
    fact: year
      ? `Wikimedia Commons records the source date as ${year}.`
      : category
        ? `Wikimedia Commons source category: ${category.replace(/^Category:/, '')}.`
      : 'Wikimedia Commons has not supplied a precise source date for this file record.',
  };
}

function commonsCategoryWork(page, category) {
  const imageInfo = page?.imageinfo?.[0];
  if (!imageInfo?.url || !imageInfo?.mime?.startsWith('image/')) return null;

  const rawTitle = cleanCommonsText(imageInfo.extmetadata?.ObjectName?.value) || commonsTitleFromPage(page.title);
  const title = simplifyCommonsTitle(rawTitle);
  if (!isUsableCommonsTitle(title)) return null;

  return commonsWork({
    id: `commons-${page.pageid}`,
    title,
    year: formatCommonsYear(title),
    image: commonsSpecialFilePath(page.title),
    sourceUrl: imageInfo.descriptionurl || commonsFilePageUrl(page.title),
    category,
  });
}

function cleanCommonsText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/title QS:.+$/i, '')
    .replace(/label QS:.+$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function commonsTitleFromPage(title) {
  return String(title || '')
    .replace(/^File:/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/_/g, ' ');
}

function simplifyCommonsTitle(title) {
  return title
    .replace(/\s+-\s+geograph\.org\.uk.*$/i, '')
    .replace(/\s+\([0-9]+\)$/g, '')
    .replace(/\s+\([0-9a-f-]{8,}\)$/gi, '')
    .trim();
}

function isUsableCommonsTitle(title) {
  if (!title || /^Q\d+$/.test(title)) return false;
  if (/^ame\d+/i.test(title)) return false;
  return !/\b(signature|sign|admin|welcome house|gravestone|grave|poster|cartel|dall-?e|stable diffusion|ai art|pater sparrow|tmoca 19|rsawarhol|plaque|statue|obelisk|museum|museo|exhibition|exposition|udstilling|tentoonstelling|special edition|national gallery|bestanddeelnr)\b/i.test(title);
}

function formatCommonsYear(value) {
  const match = String(value || '').match(/\b(1[4-9]\d{2}|20\d{2})\b/);
  return match ? match[1] : '';
}

function commonsFilePageUrl(title) {
  return `https://commons.wikimedia.org/wiki/${encodeURI(String(title || '').replaceAll(' ', '_'))}`;
}

function commonsSpecialFilePath(title) {
  const fileName = String(title || '').replace(/^File:/, '');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`;
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
  const seenTitles = new Set();
  return works.filter((work) => {
    if (/^Q\d+$/.test(work.title || '')) return false;
    const titleKey = normalizeWorkTitle(work.title);
    if (work.sourceType === 'commons' && seenTitles.has(titleKey)) return false;
    const key = work.id || `${work.title}-${work.imageSource || work.image}`;
    if (seen.has(key)) return false;
    seen.add(key);
    seenTitles.add(titleKey);
    return Boolean(work.image && work.title);
  });
}

function normalizeWorkTitle(title) {
  return String(title || '')
    .replace(/\s+by\s+[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/i, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}
