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
};

const FEATURED_WORKS_BY_ARTIST = {
  // Bacon's major paintings are still in copyright and not freely licensed on
  // Commons; the only genuine artwork images available are these two views of his
  // 1929 painted screen. (The Tate "Capturing the Moment" photos turned out to be
  // shots of the wall labels, not the paintings, so they are deliberately excluded.)
  Q154340: [
    commonsWork({
      id: 'commons-bacon-painted-screen-a',
      title: 'Painted Screen',
      year: '1929',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Francis%20bacon%2C%20paravento%20dipinto%2C%201929%20ca.%2001.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Francis_bacon,_paravento_dipinto,_1929_ca._01.jpg',
      story: 'A rare survival from Bacon\'s earliest period, when — before turning to painting full time — he worked as a furniture and interior designer in London. This folding screen shows the flattened, Cubist-influenced forms of his late-1920s output, years before the visceral, screaming figures that would make his name. His mature masterpieces remain in copyright and are not freely reproducible here.',
      fact: 'Francis Bacon · painted folding screen · early work',
    }),
    commonsWork({
      id: 'commons-bacon-painted-screen-b',
      title: 'Painted Screen (reverse)',
      year: '1929',
      image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Francis%20bacon%2C%20paravento%20dipinto%2C%201929%20ca.%2002.jpg',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Francis_bacon,_paravento_dipinto,_1929_ca._02.jpg',
      story: 'The reverse of Bacon\'s circa-1929 painted screen, from his brief career as a designer. The geometric, decorative abstraction here stands in striking contrast to the raw, anguished figures of his mature work — a glimpse of the artist before he found his subject.',
      fact: 'Francis Bacon · painted folding screen · early work',
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
  // Pieter Bruegel the Elder: pinned key works, IDs/files/articles taken from Wikidata (2026-11-02).
  Q43270: [
    featuredWork({
      id: 'Q533619',
      title: "Netherlandish Proverbs",
      year: '1559',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20%28der%20%C3%84ltere%29%20%28ca.%201525%20-%201569%29%20-%20Die%20niederl%C3%A4ndischen%20Sprichw%C3%B6rter%20-%201720%20-%20Gem%C3%A4ldegalerie.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Netherlandish_Proverbs",
    }),
    featuredWork({
      id: 'Q500985',
      title: "The Hunters in the Snow",
      year: '1565',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20the%20Elder%20-%20Hunters%20in%20the%20Snow%20%28Winter%29%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Hunters_in_the_Snow",
    }),
    featuredWork({
      id: 'Q15293656',
      title: "The Tower of Babel",
      year: '1563',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20d.%20%C3%84.%2C%20Kunsthistorisches%20Museum%20Wien%2C%20Gem%C3%A4ldegalerie%20-%20Turmbau%20zu%20Babel%20-%20GG%201026%20-%20Kunsthistorisches%20Museum.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Tower_of_Babel_(Bruegels)",
    }),
    featuredWork({
      id: 'Q603751',
      title: "The Peasant Wedding",
      year: '1568',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20the%20Elder%20-%20Peasant%20Wedding%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Peasant_Wedding",
    }),
    featuredWork({
      id: 'Q644856',
      title: "The Triumph of Death",
      year: '1560',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Triumph%20of%20Death%20by%20Pieter%20Bruegel%20the%20Elder.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Triumph_of_Death",
    }),
    featuredWork({
      id: 'Q697332',
      title: "Children's Games",
      year: '1560',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20the%20Elder%20-%20Children%E2%80%99s%20Games%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Children%27s_Games_(Bruegel)",
    }),
    featuredWork({
      id: 'Q689236',
      title: "The Fight Between Carnival and Lent",
      year: '1559',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20d.%20%C3%84.%20066.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Fight_Between_Carnival_and_Lent",
    }),
    featuredWork({
      id: 'Q776175',
      title: "The Harvesters",
      year: '1565',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20the%20Elder-%20The%20Harvesters%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Harvesters_(painting)",
    }),
    featuredWork({
      id: 'Q1192570',
      title: "The Blind Leading the Blind",
      year: '1568',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Bruegel%2C%20Pieter%20%28I%29%20-%20Blind%20leading%20the%20blind%20Google%20Art%20Project.jpeg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Parable_of_the_Blind",
    }),
    featuredWork({
      id: 'Q80869',
      title: "Dull Gret",
      year: '1561',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Dulle%20Griet%2C%20by%20Pieter%20Brueghel%20%28I%29.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Dull_Gret",
    }),
    featuredWork({
      id: 'Q594406',
      title: "The Fall of the Rebel Angels",
      year: '1562',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20the%20Elder%20-%20The%20Fall%20of%20the%20Rebel%20Angels%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Fall_of_the_Rebel_Angels",
    }),
    featuredWork({
      id: 'Q95562',
      title: "The Peasant Dance",
      year: '1568',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pieter%20Bruegel%20The%20Peasant%20Dance.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Peasant_Dance",
    }),
  ],
  // Albrecht Dürer: pinned key works, IDs/files/articles taken from Wikidata (2026-11-02).
  Q5580: [
    featuredWork({
      id: 'Q2546309',
      title: "Self-Portrait with Fur-Trimmed Robe",
      year: '1500',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/D%C3%BCrer%20Alte%20Pinakothek.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Self-Portrait_(D%C3%BCrer,_Munich)",
    }),
    featuredWork({
      id: 'Q699388',
      title: "Young Hare",
      year: '1502',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20Hare%2C%201502%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Young_Hare",
    }),
    featuredWork({
      id: 'Q1362177',
      title: "Melencolia I",
      year: '1514',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20Melencolia%20I%20-%20Google%20Art%20Project%20%28427760%29.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Melencolia_I",
    }),
    featuredWork({
      id: 'Q1755464',
      title: "Knight, Death, and the Devil",
      year: '1513',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%2C%20Knight%2C%20Death%20and%20Devil%2C%201513%2C%20NGA%206637.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Knight,_Death_and_the_Devil",
    }),
    featuredWork({
      id: 'Q351300',
      title: "Adam and Eve",
      year: '1507',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20Adam%20and%20Eve%20%28Prado%29%202.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Adam_and_Eve_(D%C3%BCrer)",
    }),
    featuredWork({
      id: 'Q748518',
      title: "The Rhinoceros",
      year: '1512',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%2C%20The%20Rhinoceros%2C%201515%2C%20NGA%2047903.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/D%C3%BCrer%27s_Rhinoceros",
    }),
    featuredWork({
      id: 'Q829270',
      title: "The Four Apostles",
      year: '1526',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20The%20Four%20Apostles%2C%20Saints%20John%2C%20Peter%2C%20Mark%20and%20Paul.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/The_Four_Apostles",
    }),
    featuredWork({
      id: 'Q699552',
      title: "Praying Hands",
      year: '1500',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20Praying%20Hands%2C%201508%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Praying_Hands_(D%C3%BCrer)",
    }),
    featuredWork({
      id: 'Q254794',
      title: "Great Piece of Turf",
      year: '1503',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20The%20Large%20Piece%20of%20Turf%2C%201503%20-%20Google%20Art%20Project.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Great_Piece_of_Turf",
    }),
    featuredWork({
      id: 'Q1170194',
      title: "Feast of the Rosary",
      year: '1506',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20Das%20Rosenkranzfest%20%281506%29.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Feast_of_the_Rosary",
    }),
    featuredWork({
      id: 'Q1198912',
      title: "St. Jerome in His Study",
      year: '1514',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Albrecht%20D%C3%BCrer%20-%20St.%20Jerome%20in%20His%20Study%20-%201989.232%20-%20Cleveland%20Museum%20of%20Art.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Saint_Jerome_in_His_Study_(D%C3%BCrer)",
    }),
    featuredWork({
      id: 'Q2388965',
      title: "Self-Portrait",
      year: '1498',
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Selbstportr%C3%A4t%2C%20by%20Albrecht%20D%C3%BCrer%2C%20from%20Prado%20in%20Google%20Earth.jpg",
      sourceUrl: "https://en.wikipedia.org/wiki/Self-Portrait_(D%C3%BCrer,_Madrid)",
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
  // Check candidates against Commons before taking the gallery's 12, so a deleted
  // file never takes a wall slot, then attach real-world sizes (D-SITE-078).
  const candidates = mergeArtistWorks(wikidataId, [...wikidataWorks, ...commonsFallbackWorks], 40);
  const mergedWorks = await withWorkDimensions(
    (await withVerifiedImages(candidates)).slice(0, ARTIST_WORK_LIMIT)
  );
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
    // A failed query is not an empty gallery: throw so the route answers 503 uncached
    // instead of caching a wall of nothing for a day.
    if (!response.ok) throw new Error(`Wikidata works query failed (${response.status})`);
    const data = await response.json();
    return dedupeWorks(
      data.results.bindings
        // P18 can be an "unknown value" blank node rather than a Commons file.
        .filter((binding) => binding.image?.type === 'uri' && /commons\.wikimedia\.org/.test(binding.image.value))
        .map((binding) => {
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
    throw new Error(`Wikidata works unavailable for ${wikidataId}: ${error?.message || error}`);
  }
}

// Real-world size (Wikidata P2048 height, P2049 width) so the gallery can hang each
// work at true scale. Units vary per record (cm, mm, m, inch), so the unit is read
// with each value and converted; implausible or missing sizes are left out and the
// client falls back to the image's own aspect ratio (D-SITE-078).
const LENGTH_UNIT_TO_CM = {
  Q174728: 1, // centimetre
  Q174789: 0.1, // millimetre
  Q11573: 100, // metre
  Q218593: 2.54, // inch
};

async function withWorkDimensions(works) {
  const ids = works.map((work) => work.id).filter((id) => /^Q\d+$/.test(id || ''));
  if (!ids.length) return works;
  const query = `
    SELECT ?work ?prop ?amount ?unit WHERE {
      VALUES ?work { ${ids.map((id) => `wd:${id}`).join(' ')} }
      VALUES (?prop ?p ?psv) { ("height" p:P2048 psv:P2048) ("width" p:P2049 psv:P2049) }
      ?work ?p ?statement.
      ?statement ?psv ?value.
      ?value wikibase:quantityAmount ?amount; wikibase:quantityUnit ?unit.
    }
  `;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;

  let bindings = [];
  try {
    const response = await fetch(url, {
      headers: SPARQL_HEADERS,
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return works;
    bindings = (await response.json()).results.bindings;
  } catch (error) {
    return works;
  }

  const sizes = new Map();
  for (const binding of bindings) {
    const id = binding.work.value.split('/').pop();
    const factor = LENGTH_UNIT_TO_CM[binding.unit.value.split('/').pop()];
    const cm = Number(binding.amount.value) * factor;
    if (!factor || !Number.isFinite(cm) || cm < 1 || cm > 1500) continue;
    const entry = sizes.get(id) || {};
    // First value wins: some records also list a framed or alternative size.
    if (entry[binding.prop.value] === undefined) entry[binding.prop.value] = Math.round(cm * 10) / 10;
    sizes.set(id, entry);
  }

  return works.map((work) => {
    const size = sizes.get(work.id);
    if (!size?.height || !size?.width) return work;
    return { ...work, dimensionsCm: { height: size.height, width: size.width } };
  });
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

function commonsWork({ id, title, year, image, sourceUrl, category, story, fact }) {
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
    // A hand-written wall label when supplied (e.g. copyright-limited modern works
    // that have no freely-licensed Wikipedia article to draw from).
    story: story || 'This source-backed work is included from a Wikimedia Commons file record where Wikidata does not expose a creator-image work entry.',
    fact: fact || (year
      ? `Wikimedia Commons records the source date as ${year}.`
      : category
        ? `Wikimedia Commons source category: ${category.replace(/^Category:/, '')}.`
      : 'Wikimedia Commons has not supplied a precise source date for this file record.'),
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

const ARTIST_WORK_LIMIT = 12;

function mergeArtistWorks(wikidataId, works, limit = ARTIST_WORK_LIMIT) {
  return dedupeWorks([
    ...(FEATURED_WORKS_BY_ARTIST[wikidataId] || []),
    ...works.map(withProxiedWorkImage),
  ]).slice(0, limit);
}

function commonsFileName(imageSource) {
  try {
    const url = new URL(imageSource);
    const marker = '/Special:FilePath/';
    const raw = url.pathname.includes(marker)
      ? url.pathname.slice(url.pathname.indexOf(marker) + marker.length)
      : url.pathname.split('/').pop();
    return decodeURIComponent(raw).replace(/_/g, ' ');
  } catch {
    return '';
  }
}

// One Commons API call per gallery: drops works whose file has been deleted (Wikidata
// P18 claims can outlive the file) and records the original pixel size so the client
// can keep true proportions when Wikidata has no physical dimensions.
async function withVerifiedImages(works) {
  const named = works.map((work) => ({ work, file: commonsFileName(work.imageSource) }));
  const titles = [...new Set(named.map((item) => item.file).filter(Boolean))].slice(0, 50);
  if (!titles.length) return works;

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', titles.map((title) => `File:${title}`).join('|'));
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'size');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');

  const response = await fetch(url, { headers: WIKI_HEADERS, next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) throw new Error(`Commons image check failed (${response.status})`);
  const data = await response.json();

  const renamed = new Map((data?.query?.normalized || []).map((entry) => [entry.from, entry.to]));
  const pages = new Map((data?.query?.pages || []).map((page) => [page.title, page]));

  return named
    .map(({ work, file }) => {
      if (!file) return work;
      const requested = `File:${file}`;
      const page = pages.get(renamed.get(requested) || requested);
      if (!page || page.missing || !page.imageinfo?.[0]) return null;
      const { width, height } = page.imageinfo[0];
      return width && height ? { ...work, imagePixels: { width, height } } : work;
    })
    .filter(Boolean);
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
