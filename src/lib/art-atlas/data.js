export const ART_ATLAS_VERSION = '2026-06-18-cosmos-v4-bacon';

export const ART_PERIODS = [
  {
    id: 'medieval-gothic',
    name: 'Medieval & Gothic',
    years: [500, 1400],
    color: '#d6b26f',
    orbit: -260,
    artists: [
      artist('Cimabue', 'Cimabue', 'Q15790', 1240, 1302, -54, -74),
      artist('Giotto', 'Giotto', 'Q7814', 1276, 1337, 38, -52),
      artist('Duccio', 'Duccio', 'Q15792', 1255, 1319, 14, 72),
    ],
  },
  {
    id: 'early-renaissance',
    name: 'Early Renaissance',
    years: [1400, 1490],
    color: '#c79f58',
    orbit: -132,
    artists: [
      artist('Fra Angelico', 'Fra Angelico', 'Q5664', 1390, 1455, -68, -34),
      artist('Masaccio', 'Masaccio', 'Q5811', 1401, 1428, 34, -62),
      artist('Sandro Botticelli', 'Sandro Botticelli', 'Q5669', 1445, 1510, 24, 68),
    ],
  },
  {
    id: 'high-renaissance',
    name: 'High Renaissance',
    years: [1490, 1527],
    color: '#bda46f',
    orbit: 18,
    artists: [
      artist('Leonardo da Vinci', 'Leonardo da Vinci', 'Q762', 1452, 1519, -72, -82),
      artist('Michelangelo', 'Michelangelo', 'Q5592', 1475, 1564, -12, 54),
      artist('Raphael', 'Raphael', 'Q5597', 1483, 1520, 66, -18),
    ],
  },
  {
    id: 'northern-renaissance',
    name: 'Northern Renaissance',
    years: [1430, 1580],
    color: '#8ea98b',
    orbit: -48,
    artists: [
      artist('Jan van Eyck', 'Jan van Eyck', 'Q102272', 1390, 1441, -78, -26),
      artist('Albrecht Durer', 'Albrecht Dürer', 'Q5580', 1471, 1528, 20, -76),
      artist('Hieronymus Bosch', 'Hieronymus Bosch', 'Q130531', 1450, 1516, 62, 52),
    ],
  },
  {
    id: 'baroque',
    name: 'Baroque',
    years: [1600, 1750],
    color: '#b66a58',
    orbit: 112,
    artists: [
      artist('Caravaggio', 'Caravaggio', 'Q42207', 1571, 1610, -64, -54),
      artist('Peter Paul Rubens', 'Peter Paul Rubens', 'Q5599', 1577, 1640, 28, -82),
      artist('Rembrandt', 'Rembrandt', 'Q5598', 1606, 1669, 58, 42),
    ],
  },
  {
    id: 'rococo',
    name: 'Rococo',
    years: [1715, 1780],
    color: '#c98e96',
    orbit: -176,
    artists: [
      artist('Antoine Watteau', 'Antoine Watteau', 'Q183221', 1684, 1721, -70, -40),
      artist('Jean-Honore Fragonard', 'Jean-Honoré Fragonard', 'Q127171', 1732, 1806, 42, -70),
      artist('Elisabeth Vigee Le Brun', 'Élisabeth Vigée Le Brun', 'Q213163', 1755, 1842, 54, 48),
    ],
  },
  {
    id: 'neoclassicism',
    name: 'Neoclassicism',
    years: [1760, 1830],
    color: '#d4c3a0',
    orbit: 216,
    artists: [
      artist('Jacques-Louis David', 'Jacques-Louis David', 'Q83155', 1748, 1825, -74, -26),
      artist('Angelica Kauffman', 'Angelica Kauffman', 'Q123098', 1741, 1807, 22, -72),
      artist('Jean-Auguste-Dominique Ingres', 'Jean-Auguste-Dominique Ingres', 'Q23380', 1780, 1867, 66, 38),
    ],
  },
  {
    id: 'romanticism',
    name: 'Romanticism',
    years: [1780, 1850],
    color: '#777fa7',
    orbit: -64,
    artists: [
      artist('Francisco Goya', 'Francisco Goya', 'Q5432', 1746, 1828, -82, -38),
      artist('J. M. W. Turner', 'J. M. W. Turner', 'Q159758', 1775, 1851, 18, -82),
      artist('Caspar David Friedrich', 'Caspar David Friedrich', 'Q104884', 1774, 1840, 70, 50),
    ],
  },
  {
    id: 'realism',
    name: 'Realism',
    years: [1840, 1880],
    color: '#798b71',
    orbit: 154,
    artists: [
      artist('Gustave Courbet', 'Gustave Courbet', 'Q34618', 1819, 1877, -62, -60),
      artist('Jean-Francois Millet', 'Jean-François Millet', 'Q148458', 1814, 1875, 38, -36),
      artist('Winslow Homer', 'Winslow Homer', 'Q344838', 1836, 1910, 52, 66),
    ],
  },
  {
    id: 'impressionism',
    name: 'Impressionism',
    years: [1860, 1895],
    color: '#7ca0bd',
    orbit: -138,
    artists: [
      artist('Claude Monet', 'Claude Monet', 'Q296', 1840, 1926, -78, -34),
      artist('Edgar Degas', 'Edgar Degas', 'Q46373', 1834, 1917, 24, -72),
      artist('Mary Cassatt', 'Mary Cassatt', 'Q173223', 1844, 1926, 66, 46),
    ],
  },
  {
    id: 'post-impressionism',
    name: 'Post-Impressionism',
    years: [1885, 1910],
    color: '#b7a061',
    orbit: 64,
    artists: [
      artist('Vincent van Gogh', 'Vincent van Gogh', 'Q5582', 1853, 1890, -66, -54),
      artist('Paul Cezanne', 'Paul Cézanne', 'Q35548', 1839, 1906, 22, -74),
      artist('Paul Gauguin', 'Paul Gauguin', 'Q37693', 1848, 1903, 66, 44),
    ],
  },
  {
    id: 'expressionism-cubism',
    name: 'Expressionism & Cubism',
    years: [1905, 1935],
    color: '#b06154',
    orbit: 182,
    artists: [
      artist('Pablo Picasso', 'Pablo Picasso', 'Q5593', 1881, 1973, -72, -36),
      artist('Wassily Kandinsky', 'Wassily Kandinsky', 'Q61064', 1866, 1944, 18, -78),
      artist('Franz Marc', 'Franz Marc', 'Q44054', 1880, 1916, 70, 48),
    ],
  },
  {
    id: 'surrealism',
    name: 'Surrealism',
    years: [1920, 1955],
    color: '#a04f7f',
    orbit: -88,
    artists: [
      artist('Salvador Dali', 'Salvador Dalí', 'Q5577', 1904, 1989, -78, -44),
      artist('Frida Kahlo', 'Frida Kahlo', 'Q5588', 1907, 1954, 18, -78),
      artist('Rene Magritte', 'René Magritte', 'Q7836', 1898, 1967, 68, 48),
    ],
  },
  {
    id: 'abstract-expressionism',
    name: 'Abstract Expressionism',
    years: [1943, 1965],
    color: '#7975a6',
    orbit: 118,
    artists: [
      artist('Jackson Pollock', 'Jackson Pollock', 'Q37571', 1912, 1956, -70, -42),
      artist('Mark Rothko', 'Mark Rothko', 'Q160149', 1903, 1970, 22, -76),
      artist('Willem de Kooning', 'Willem de Kooning', 'Q132305', 1904, 1997, 64, 48),
    ],
  },
  {
    id: 'pop-contemporary',
    name: 'Pop & Contemporary',
    years: [1955, 2026],
    color: '#8fbd9b',
    orbit: -34,
    artists: [
      artist('Francis Bacon', 'Francis Bacon', 'Q154340', 1909, 1992, -82, -30),
      artist('Andy Warhol', 'Andy Warhol', 'Q5603', 1928, 1987, -40, -68),
      artist('Yayoi Kusama', 'Yayoi Kusama', 'Q231121', 1929, null, 32, -78),
      artist('David Hockney', 'David Hockney', 'Q159907', 1937, 2026, 74, 44),
    ],
  },
];

export const ARTIST_LOOKUP = Object.fromEntries(
  ART_PERIODS.flatMap((period) =>
    period.artists.map((artistItem) => [
      artistItem.wikidataId,
      {
        ...artistItem,
        periodId: period.id,
        periodName: period.name,
        periodYears: period.years,
        periodColor: period.color,
      },
    ])
  )
);

// Famous-artwork → artist index so a search for a painting title (not just an
// artist name) jumps to the right artist. Curated; not exhaustive.
export const KNOWN_ARTWORKS = [
  ['Mona Lisa', 'Q762'],
  ['The Last Supper', 'Q762'],
  ['Vitruvian Man', 'Q762'],
  ['The Creation of Adam', 'Q5592'],
  ['David', 'Q5592'],
  ['Sistine Chapel ceiling', 'Q5592'],
  ['The School of Athens', 'Q5597'],
  ['The Birth of Venus', 'Q5669'],
  ['Primavera', 'Q5669'],
  ['The Garden of Earthly Delights', 'Q130531'],
  ['The Haywain Triptych', 'Q130531'],
  ['The Arnolfini Portrait', 'Q102272'],
  ['Ghent Altarpiece', 'Q102272'],
  ['The Calling of Saint Matthew', 'Q42207'],
  ['The Night Watch', 'Q5598'],
  ['The Third of May 1808', 'Q5432'],
  ['Saturn Devouring His Son', 'Q5432'],
  ['The Fighting Temeraire', 'Q159758'],
  ['Wanderer above the Sea of Fog', 'Q104884'],
  ['Impression, Sunrise', 'Q296'],
  ['Water Lilies', 'Q296'],
  ['The Ballet Class', 'Q46373'],
  ['Starry Night', 'Q5582'],
  ['The Starry Night', 'Q5582'],
  ['Sunflowers', 'Q5582'],
  ['The Card Players', 'Q35548'],
  ['Mont Sainte-Victoire', 'Q35548'],
  ['Les Demoiselles d’Avignon', 'Q5593'],
  ['Guernica', 'Q5593'],
  ['The Persistence of Memory', 'Q5577'],
  ['The Two Fridas', 'Q5588'],
  ['The Broken Column', 'Q5588'],
  ['The Treachery of Images', 'Q7836'],
  ['The Son of Man', 'Q7836'],
  ['Campbell’s Soup Cans', 'Q5603'],
  ['Marilyn Diptych', 'Q5603'],
  ['Three Studies for Figures at the Base of a Crucifixion', 'Q154340'],
  ['Three Studies for a Portrait of Lucian Freud', 'Q154340'],
  ['Study for a Pope', 'Q154340'],
  ['A Bigger Splash', 'Q159907'],
];

function artist(slug, name, wikidataId, birth, death, dx, dy) {
  const aliases = {
    Q130531: ['Hieronymous Bosch', 'Jheronimus Bosch'],
  };

  // Some artists need a disambiguated Wikipedia title that differs from the clean
  // display name (e.g. Francis Bacon, the painter, vs the philosopher).
  const titleOverrides = {
    Q154340: 'Francis Bacon (artist)',
  };
  const wikipediaTitle = titleOverrides[wikidataId] || name;

  return {
    slug,
    name,
    wikidataId,
    wikipediaTitle,
    birth,
    death,
    offset: { x: dx, y: dy },
    searchAliases: aliases[wikidataId] || [],
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaTitle.replaceAll(' ', '_'))}`,
    wikidataUrl: `https://www.wikidata.org/wiki/${wikidataId}`,
  };
}
