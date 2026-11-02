'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { KNOWN_ARTWORKS } from '@/lib/art-atlas/data';
import styles from './art-atlas.module.css';

// Render modals straight to <body> so no transformed/filtered ancestor can become
// the containing block for our position:fixed overlays (which was pushing the
// lightbox and bio card off-screen and causing the page to scroll).
function BodyPortal({ children }) {
  const [host, setHost] = useState(null);
  useEffect(() => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    setHost(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  if (!host) return null;
  return createPortal(children, host);
}

const YEAR_MIN = 500;
const YEAR_MAX = 2026;
const WORLD_START = 280;
const WORLD_WIDTH = 4240;

const ZOOM_MIN = 0.26;
const ZOOM_MAX = 2.6;
// Below this zoom we show the constellation (dots); above it portraits resolve in.
const PORTRAIT_ZOOM = 0.62;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function yearToX(year) {
  return WORLD_START + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * WORLD_WIDTH;
}

function artistAnchorYear(artist) {
  const birth = artist.birth || YEAR_MIN;
  const death = artist.death || YEAR_MAX;
  // Anchor the node at the artist's creative midpoint so the timeline reads chronologically.
  return birth + (death - birth) * 0.45;
}

/**
 * Lay out every artist node across the whole timeline and relax overlaps.
 *
 * Each node gets a base x from its anchor year and a base y from a vertical lane
 * (alternating above/below the rail per period so clusters read as constellations).
 * A few iterations of pairwise repulsion then push apart any nodes that collide,
 * so portraits never stack regardless of how densely artists cluster in time.
 *
 * `spread` scales the collision radius: when zoomed out nodes draw tight (a single
 * glowing constellation); as you zoom in they ease apart and stop touching.
 */
function layoutNodes(periods, spread) {
  const RAIL_Y = 590;
  const nodes = [];

  periods.forEach((period, periodIndex) => {
    const above = periodIndex % 2 === 0;
    const laneBase = above ? RAIL_Y - 150 : RAIL_Y + 150;
    period.artists.forEach((artist, artistIndex) => {
      const baseX = yearToX(artistAnchorYear(artist));
      // Stagger lanes within a period so same-year artists start separated.
      const laneOffset = (artistIndex - (period.artists.length - 1) / 2) * 64;
      const baseY = laneBase + (above ? -1 : 1) * Math.abs(laneOffset) * 0.4 + laneOffset * 0.25;
      nodes.push({
        artist,
        period,
        homeX: baseX,
        homeY: baseY,
        x: baseX,
        y: baseY,
      });
    });
  });

  // Collision radius grows as you zoom in so nodes separate; tighter when zoomed out.
  const radius = lerp(44, 124, clamp(spread, 0, 1));
  const minDist = radius * 2;
  const iterations = 60;

  for (let pass = 0; pass < iterations; pass += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        if (dist === 0) {
          dx = (Math.random() - 0.5) * 0.01;
          dy = (Math.random() - 0.5) * 0.01;
          dist = Math.hypot(dx, dy) || 0.0001;
        }
        if (dist < minDist) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
    // Gentle pull back toward the chronological home so x stays year-true.
    for (const node of nodes) {
      node.x = lerp(node.x, node.homeX, 0.06);
      node.y = lerp(node.y, node.homeY, 0.03);
    }
  }

  return nodes;
}

function yearsLabel(years) {
  return `${years[0]} - ${years[1]}`;
}

function artistDates(artist) {
  return `${artist.birth || ''} - ${artist.death || 'present'}`;
}

// Public portfolio route: read-only, no sign-in and no user data (D-SITE-078).
export default function ArtAtlasClient() {
  return <ArtAtlasExperience />;
}

function ArtAtlasExperience() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(0.34);
  const [pan, setPan] = useState({ x: 0, y: 16 });
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState('timeline');
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  // Smooth zoom: wheel sets a target, an rAF loop eases the live value toward it.
  const targetZoomRef = useRef(0.34);
  const zoomRafRef = useRef(0);
  const focusRafRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        setLoading(true);
        const response = await fetch('/api/art-atlas/catalog', { signal: controller.signal });
        if (!response.ok) throw new Error(`Art Atlas catalogue failed (${response.status})`);
        const payload = await response.json();
        setCatalog(payload);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError('The Art Atlas source catalogue could not be loaded.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
    return () => controller.abort();
  }, []);

  const periods = catalog?.periods || [];
  const filteredPeriods = useMemo(() => {
    const search = query.trim().toLowerCase();
    return periods
      .filter((period) => periodFilter === 'all' || period.id === periodFilter)
      .map((period) => ({
        ...period,
        artists: period.artists.filter((artist) => {
          if (!search) return true;
          return `${artist.name} ${artist.searchAliases?.join(' ') || ''} ${period.name}`.toLowerCase().includes(search);
        }),
      }))
      .filter((period) => period.artists.length > 0 || !search);
  }, [periodFilter, periods, query]);

  const totals = useMemo(() => {
    const artistCount = periods.reduce((sum, period) => sum + period.artists.length, 0);
    return { periods: periods.length, artists: artistCount };
  }, [periods]);

  // Quantise zoom so the (cheap but non-trivial) relaxation only recomputes on
  // meaningful steps, not every eased frame. Nodes spread as you zoom in.
  const spread = clamp((zoom - ZOOM_MIN) / (1.4 - ZOOM_MIN), 0, 1);
  const spreadStep = Math.round(spread * 10) / 10;
  const laidOutNodes = useMemo(
    () => layoutNodes(filteredPeriods, spreadStep),
    [filteredPeriods, spreadStep]
  );

  // Constellation → portrait crossfade. Dots dominate when zoomed out.
  const portraitReveal = clamp((zoom - PORTRAIT_ZOOM) / 0.4, 0, 1);

  // Counter-scale node/label content against the world scale so zooming SPREADS the
  // timeline (more space between artists) without ballooning portraits and text.
  // Above zoom 1 we fully cancel the world scale; at/below 1 we leave content at its
  // natural size so the constellation reads small when zoomed out.
  const invZoom = zoom > 1 ? 1 / zoom : 1;

  useEffect(() => {
    const renderTimelineState = () => JSON.stringify({
      mode: 'art-atlas-timeline',
      sourceMode: catalog?.sourceMode || null,
      periods: filteredPeriods.length,
      artists: filteredPeriods.reduce((sum, period) => sum + period.artists.length, 0),
      selectedArtist: selectedArtist?.name || null,
      filter: { period: periodFilter, query },
      zoom: Number(zoom.toFixed(2)),
      pan: { x: Math.round(pan.x), y: Math.round(pan.y) },
    });
    const advanceTime = () => {};

    window.render_game_to_text = renderTimelineState;
    window.advanceTime = advanceTime;
    window.__ART_ATLAS_STATE__ = renderTimelineState();

    return () => {
      if (window.render_game_to_text === renderTimelineState) delete window.render_game_to_text;
      if (window.advanceTime === advanceTime) delete window.advanceTime;
      delete window.__ART_ATLAS_STATE__;
    };
  }, [catalog?.sourceMode, filteredPeriods, pan.x, pan.y, periodFilter, query, selectedArtist?.name, zoom]);

  // Every zoom input (mouse wheel, trackpad pinch, Safari gesture, touch pinch) sets a
  // target; one rAF loop eases the live zoom toward it.
  const zoomBy = useCallback((factor) => {
    targetZoomRef.current = clamp(targetZoomRef.current * factor, ZOOM_MIN, ZOOM_MAX);

    if (zoomRafRef.current) return;
    const tick = () => {
      setZoom((current) => {
        const target = targetZoomRef.current;
        const next = lerp(current, target, 0.18);
        if (Math.abs(next - target) < 0.001) {
          zoomRafRef.current = 0;
          return target;
        }
        zoomRafRef.current = window.requestAnimationFrame(tick);
        return next;
      });
    };
    zoomRafRef.current = window.requestAnimationFrame(tick);
  }, []);

  // Native, non-passive listeners. React attaches onWheel as passive, so its
  // preventDefault was ignored and a trackpad pinch (ctrl+wheel) zoomed the whole
  // browser page instead of the atlas. Safari reports trackpad pinch as gesture* events.
  const stageRef = useRef(null);
  const stageReady = !loading && !error && view === 'timeline';
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    let gestureScale = 1;
    const onWheel = (event) => {
      event.preventDefault();
      if (event.ctrlKey) {
        // Trackpad pinch: small continuous deltas, so follow them proportionally.
        zoomBy(Math.exp(-event.deltaY * 0.012));
        return;
      }
      // Mouse wheel / two-finger scroll: gentle step, normalised across devices.
      const intensity = clamp(Math.abs(event.deltaY) / 100, 0.2, 1.6);
      zoomBy(event.deltaY > 0 ? 1 - 0.08 * intensity : 1 + 0.08 * intensity);
    };
    const onGestureStart = (event) => {
      event.preventDefault();
      gestureScale = event.scale || 1;
    };
    const onGestureChange = (event) => {
      event.preventDefault();
      const scale = event.scale || 1;
      zoomBy(scale / gestureScale);
      gestureScale = scale;
    };
    const onGestureEnd = (event) => event.preventDefault();
    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('gesturestart', onGestureStart, { passive: false });
    stage.addEventListener('gesturechange', onGestureChange, { passive: false });
    stage.addEventListener('gestureend', onGestureEnd, { passive: false });
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('gesturestart', onGestureStart);
      stage.removeEventListener('gesturechange', onGestureChange);
      stage.removeEventListener('gestureend', onGestureEnd);
    };
  }, [stageReady, zoomBy]);

  useEffect(() => () => {
    if (zoomRafRef.current) window.cancelAnimationFrame(zoomRafRef.current);
  }, []);

  // Glide the timeline so a chosen artist node sits centred (just above middle, clear
  // of the bio card) before its placard opens. Eases pan and a comfortable zoom.
  const centerOnNode = useCallback((node) => {
    if (!node) return;
    // World centre of the .space layer (width 4800, rail at y 590).
    const SPACE_CX = 2400;
    const SPACE_CY = 590;
    const targetZoom = clamp(Math.max(zoom, 0.85), ZOOM_MIN, ZOOM_MAX);
    // Lift the node above centre so the card (lower-centre) doesn't cover it.
    const yBias = 150;
    const startZoom = zoom;
    const startPan = { x: pan.x, y: pan.y };
    const start = performance.now();
    const duration = 520;

    if (focusRafRef.current) window.cancelAnimationFrame(focusRafRef.current);
    targetZoomRef.current = targetZoom;

    const animate = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const z = lerp(startZoom, targetZoom, ease);
      // pan that centres (nx,ny) at the viewport middle for zoom z.
      const goalPanX = -(node.x - SPACE_CX) * z;
      const goalPanY = -(node.y - SPACE_CY) * z + yBias;
      setZoom(z);
      setPan({ x: lerp(startPan.x, goalPanX, ease), y: lerp(startPan.y, goalPanY, ease) });
      if (t < 1) {
        focusRafRef.current = window.requestAnimationFrame(animate);
      } else {
        focusRafRef.current = 0;
      }
    };
    focusRafRef.current = window.requestAnimationFrame(animate);
  }, [pan.x, pan.y, zoom]);

  useEffect(() => () => {
    if (focusRafRef.current) window.cancelAnimationFrame(focusRafRef.current);
  }, []);

  // Touchscreen pinch: two active pointers zoom by the change in their distance.
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(0);
  const pinchDistance = () => {
    const [a, b] = [...pointersRef.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (pointersRef.current.size === 2) {
      pinchRef.current = pinchDistance();
      setDragging(false);
      return;
    }
    if (pointersRef.current.size > 2) return;
    setDragging(true);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, [pan.x, pan.y]);

  const handlePointerMove = useCallback((event) => {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pointersRef.current.size === 2 && pinchRef.current > 0) {
      const distance = pinchDistance();
      if (distance > 0) zoomBy(distance / pinchRef.current);
      pinchRef.current = distance;
      return;
    }
    if (!dragging) return;
    const nextX = dragRef.current.panX + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.panY + event.clientY - dragRef.current.y;
    setPan({ x: nextX, y: nextY });
  }, [dragging, zoomBy]);

  const endDrag = useCallback((event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = 0;
    setDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }, []);

  const enterGallery = useCallback((artist) => {
    setSelectedArtist(artist);
    setView('gallery');
  }, []);

  if (view === 'gallery' && selectedArtist) {
    return (
      <GalleryView
        artist={selectedArtist}
        onBack={() => {
          setView('timeline');
          setSelectedArtist(null);
        }}
        onRandom={() => {
          const all = periods.flatMap((period) => period.artists);
          if (all.length === 0) return;
          const others = all.filter((a) => a.wikidataId !== selectedArtist.wikidataId);
          const pool = others.length > 0 ? others : all;
          setSelectedArtist(pool[Math.floor(Math.random() * pool.length)]);
        }}
      />
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.topbar}>
        <div className={styles.brand}>
          <h1>The Atlas of Art</h1>
          <p>{totals.periods || 15} periods · {totals.artists || 45} artists · Wikimedia source records</p>
        </div>

        <div className={styles.tools}>
          <TimelineSearch
            nodes={laidOutNodes}
            onPick={(node) => {
              centerOnNode(node);
              window.setTimeout(() => setSelectedArtist(node.artist), 360);
            }}
          />
          <button
            className={styles.toolButton}
            type="button"
            onClick={() => setFilterOpen((open) => !open)}
            aria-expanded={filterOpen}
          >
            <span className={styles.materialSymbol} aria-hidden>filter_alt</span> Filter
          </button>
          <div className={styles.segment} aria-label="Timeline direction">
            <button className={styles.segmentButton} type="button" title="River direction">A</button>
            <button className={`${styles.segmentButton} ${styles.segmentActive}`} type="button" title="Cosmos direction">B</button>
            <button className={styles.segmentButton} type="button" title="Floor-map direction">C</button>
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className={styles.filterPanel}>
          <input
            className={styles.filterInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search artist or period"
          />
          <div className={styles.periodList}>
            <button
              className={`${styles.periodOption} ${periodFilter === 'all' ? styles.periodOptionActive : ''}`}
              type="button"
              onClick={() => setPeriodFilter('all')}
            >
              All periods
            </button>
            {periods.map((period) => (
              <button
                key={period.id}
                className={`${styles.periodOption} ${periodFilter === period.id ? styles.periodOptionActive : ''}`}
                type="button"
                onClick={() => setPeriodFilter(period.id)}
              >
                {period.name} · {yearsLabel(period.years)}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <div className={styles.loading}>Preparing atlas records</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <section
          ref={stageRef}
          className={`${styles.atlasStage} ${dragging ? styles.atlasStageDragging : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-label="Cosmos timeline of art history"
        >
          <div
            className={styles.space}
            style={{
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              '--inv-zoom': invZoom,
            }}
          >
            <div className={styles.rail} />
            {[500, 700, 900, 1100, 1300, 1450, 1600, 1750, 1875, 1935, 1975, 2026].map((year) => (
              <div key={year} className={styles.tick} style={{ left: yearToX(year) }}>
                <span>{year}</span>
              </div>
            ))}

            <ConstellationLines nodes={laidOutNodes} reveal={portraitReveal} />

            {filteredPeriods.map((period, index) => {
              const periodNodes = laidOutNodes.filter((node) => node.period.id === period.id);
              if (periodNodes.length === 0) return null;
              const cx = periodNodes.reduce((sum, node) => sum + node.x, 0) / periodNodes.length;
              const above = index % 2 === 0;
              const labelY = above
                ? Math.min(...periodNodes.map((node) => node.y)) - 78
                : Math.max(...periodNodes.map((node) => node.y)) + 64;
              return (
                <div
                  key={period.id}
                  className={styles.clusterLabel}
                  style={{ left: cx, top: labelY, '--period-color': period.color, '--inv-zoom': invZoom }}
                >
                  <strong>{period.name}</strong>
                  <span>{yearsLabel(period.years)}</span>
                </div>
              );
            })}

            {laidOutNodes.map((node) => {
              const { artist, period } = node;
              return (
                <button
                  key={artist.wikidataId}
                  className={styles.artistNode}
                  type="button"
                  style={{
                    left: node.x,
                    top: node.y,
                    '--period-color': period.color,
                    '--portrait-reveal': portraitReveal,
                    '--inv-zoom': invZoom,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    centerOnNode(node);
                    // Let the glide play briefly, then reveal the card over the centred node.
                    window.setTimeout(() => setSelectedArtist(artist), 360);
                  }}
                >
                  <span className={styles.nodeStar} aria-hidden />
                  <span className={styles.portraitShell}>
                    {artist.portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={artist.portrait} alt="" loading="lazy" />
                    ) : (
                      <span className={styles.nodeFallback}>{artist.name.charAt(0)}</span>
                    )}
                  </span>
                  <span className={styles.nodeLabel}>
                    <strong>{artist.name}</strong>
                    <span className={styles.artistDateLabel}>{artistDates(artist)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className={styles.bottomBar}>
        <p className={styles.footerNote}>Constellation · source-attributed art history atlas</p>
        <div className={styles.sourceLinks}>
          <a href={catalog?.attribution?.wikipedia || 'https://www.wikipedia.org/'}>Wikipedia</a>
          <a href={catalog?.attribution?.wikidata || 'https://www.wikidata.org/'}>Wikidata</a>
          <a href={catalog?.attribution?.commons || 'https://commons.wikimedia.org/'}>Wikimedia Commons</a>
        </div>
      </div>

      {selectedArtist && view === 'timeline' && (
        <BodyPortal>
          <ArtistPlacard
            artist={selectedArtist}
            onClose={() => setSelectedArtist(null)}
            onEnter={() => enterGallery(selectedArtist)}
          />
        </BodyPortal>
      )}
    </main>
  );
}

function TimelineSearch({ nodes, onPick }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  // Map each known artwork title to its artist node (if that artist is on the timeline).
  const artworkByArtist = useMemo(() => {
    const map = new Map();
    KNOWN_ARTWORKS.forEach(([title, wikidataId]) => {
      const list = map.get(wikidataId) || [];
      list.push(title);
      map.set(wikidataId, list);
    });
    return map;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    nodes.forEach((node) => {
      const { artist } = node;
      const nameHit = `${artist.name} ${artist.searchAliases?.join(' ') || ''}`.toLowerCase().includes(q);
      const works = artworkByArtist.get(artist.wikidataId) || [];
      const workHit = works.find((title) => title.toLowerCase().includes(q));
      if (nameHit) {
        out.push({ node, label: artist.name, sub: artist.periodName });
      } else if (workHit) {
        out.push({ node, label: workHit, sub: `${artist.name} · ${artist.periodName}` });
      }
    });
    return out.slice(0, 8);
  }, [query, nodes, artworkByArtist]);

  useEffect(() => {
    setActive(0);
    setOpen(query.trim().length > 0);
  }, [query]);

  useEffect(() => {
    const onDocClick = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (result) => {
    if (!result) return;
    onPick(result.node);
    setQuery('');
    setOpen(false);
  };

  const onKeyDown = (event) => {
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pick(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.searchWrap} ref={wrapRef}>
      <span className={styles.materialSymbol} aria-hidden>search</span>
      <input
        className={styles.searchInput}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(query.trim().length > 0)}
        placeholder="Search artist or artwork"
        aria-label="Search artist or artwork"
      />
      {open && results.length > 0 && (
        <ul className={styles.searchResults} role="listbox">
          {results.map((result, index) => (
            <li key={`${result.node.artist.wikidataId}-${result.label}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={`${styles.searchResult} ${index === active ? styles.searchResultActive : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(result)}
              >
                <strong>{result.label}</strong>
                <span>{result.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && results.length === 0 && (
        <ul className={styles.searchResults}>
          <li><span className={styles.searchEmpty}>No matches on the timeline</span></li>
        </ul>
      )}
    </div>
  );
}

function ConstellationLines({ nodes, reveal }) {
  // Draw a connecting line between consecutive artists of each period so clusters
  // read as constellations. Lines fade out as portraits resolve in on zoom.
  const segments = useMemo(() => {
    const byPeriod = new Map();
    nodes.forEach((node) => {
      const list = byPeriod.get(node.period.id) || [];
      list.push(node);
      byPeriod.set(node.period.id, list);
    });
    const lines = [];
    byPeriod.forEach((list, periodId) => {
      const ordered = [...list].sort((a, b) => a.homeX - b.homeX);
      for (let i = 0; i < ordered.length - 1; i += 1) {
        lines.push({
          key: `${periodId}-${i}`,
          x1: ordered[i].x,
          y1: ordered[i].y,
          x2: ordered[i + 1].x,
          y2: ordered[i + 1].y,
          color: ordered[i].period.color,
        });
      }
    });
    return lines;
  }, [nodes]);

  return (
    <svg className={styles.constellationLayer} style={{ opacity: 0.85 - reveal * 0.55 }} aria-hidden>
      {segments.map((segment) => (
        <line
          key={segment.key}
          x1={segment.x1}
          y1={segment.y1}
          x2={segment.x2}
          y2={segment.y2}
          stroke={segment.color}
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      ))}
    </svg>
  );
}

function ArtistPlacard({ artist, onClose, onEnter }) {
  // Two-stage entrance: the card eases in first, then its contents stagger in.
  // `mounted` flips on the next frame so the CSS opening transition actually runs;
  // `contentIn` follows shortly after so text reveals once the card has settled.
  const [mounted, setMounted] = useState(false);
  const [contentIn, setContentIn] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const contentTimer = setTimeout(() => setContentIn(true), 220);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(contentTimer);
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const contentClass = `${styles.placardContent} ${contentIn ? styles.placardContentIn : ''}`;

  return (
    <div
      className={`${styles.modalScrim} ${mounted ? styles.modalScrimIn : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="artist-placard-title"
      onClick={onClose}
    >
      <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close artist card">
        <span className={styles.materialSymbol} aria-hidden>close</span>
      </button>
      <article
        className={`${styles.placard} ${mounted ? styles.placardIn : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.placardBody}>
          <div className={`${contentClass} ${styles.placardPortraitWrap}`} style={{ '--stagger': 0 }}>
            {artist.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.placardPortrait} src={artist.portrait} alt="" />
            ) : (
              <div className={styles.placardPortrait} aria-hidden />
            )}
          </div>
          <div>
            <p className={contentClass} style={{ '--stagger': 1 }}>
              <span className={styles.placardKicker}>{artist.periodName}</span>
            </p>
            <h2 id="artist-placard-title" className={contentClass} style={{ '--stagger': 2 }}>{artist.name}</h2>
            <div className={`${styles.lifeDates} ${contentClass}`} style={{ '--stagger': 3 }}>{artistDates(artist)}</div>
            <div className={`${styles.rule} ${contentClass}`} style={{ '--stagger': 4 }} />
            <p className={`${styles.placardSummary} ${contentClass}`} style={{ '--stagger': 5 }}>{artist.summary}</p>
          </div>
        </div>
        <footer className={`${styles.placardFooter} ${contentClass}`} style={{ '--stagger': 6 }}>
          <div>
            <p className={styles.metaLine}>Wikimedia records on view</p>
            <a href={artist.wikipediaUrl}>Wikipedia source</a>
          </div>
          <button className={styles.placardButton} type="button" onClick={onEnter}>
            Enter the gallery
          </button>
        </footer>
      </article>
    </div>
  );
}

function GalleryView({ artist, onBack, onRandom }) {
  const [museum, setMuseum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entered, setEntered] = useState(false);
  const [inspectedWork, setInspectedWork] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMuseum() {
      try {
        setLoading(true);
        const response = await fetch(`/api/art-atlas/artist/${artist.wikidataId}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Artist museum failed (${response.status})`);
        const payload = await response.json();
        setMuseum(payload);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError('This gallery could not load its Wikimedia records.');
        }
      } finally {
        setLoading(false);
      }
    }
    loadMuseum();
    return () => controller.abort();
  }, [artist.wikidataId]);

  // Reset per-gallery state when the artist changes (e.g. "surprise me").
  useEffect(() => {
    setEntered(false);
    setInspectedWork(null);
    setExitOpen(false);
  }, [artist.wikidataId]);

  return (
    <main className={styles.galleryShell}>
      <div className={styles.galleryHud}>
        <button className={styles.galleryBack} type="button" onClick={onBack}>
          <span className={styles.materialSymbol} aria-hidden>arrow_back</span> Timeline
        </button>
        <div className={styles.galleryTitle}>
          <h1>{artist.name}</h1>
          <p className={styles.metaLine}>{artistDates(artist)}</p>
        </div>
      </div>

      {loading && <div className={styles.loading}>Hanging Wikimedia records</div>}
      {error && <div className={styles.error}>{error}</div>}
      {museum && (
        <>
          <GalleryCanvas
            museum={museum}
            entered={entered}
            inspecting={Boolean(inspectedWork) || exitOpen}
            onInspect={setInspectedWork}
            onExit={() => setExitOpen(true)}
          />
          {entered && (
            <div className={styles.galleryHelp}>
              WASD / arrows to walk · drag to look · click a work to inspect · click the doors to leave
            </div>
          )}
          {!entered && (
            <button className={styles.galleryIntro} type="button" onClick={() => setEntered(true)}>
              <span>
                <p className={styles.placardKicker}>{museum.artist.periodName}</p>
                <h2>{museum.artist.name}</h2>
                <p>Click to enter</p>
              </span>
            </button>
          )}
          {museum.works.length === 0 && (
            <div className={styles.error}>No Wikimedia image-backed works were returned for this artist.</div>
          )}
        </>
      )}

      {inspectedWork && (
        <BodyPortal>
          <InspectLightbox work={inspectedWork} onClose={() => setInspectedWork(null)} />
        </BodyPortal>
      )}

      {exitOpen && (
        <BodyPortal>
          <ExitChoice
            onClose={() => setExitOpen(false)}
            onTimeline={onBack}
            onRandom={onRandom}
          />
        </BodyPortal>
      )}
    </main>
  );
}

function ExitChoice({ onClose, onTimeline, onRandom }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className={`${styles.modalScrim} ${mounted ? styles.modalScrimIn : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Leave the gallery"
      onClick={onClose}
    >
      <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Stay in the gallery">
        <span className={styles.materialSymbol} aria-hidden>close</span>
      </button>
      <article
        className={`${styles.exitCard} ${mounted ? styles.placardIn : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.placardKicker}>Leaving the gallery</p>
        <h2>Where to next?</h2>
        <p className={styles.exitLede}>Step back out to the constellation, or let the atlas pick another artist for you.</p>
        <div className={styles.exitActions}>
          <button type="button" className={styles.exitButtonPrimary} onClick={onTimeline}>
            Back to the timeline
          </button>
          <button type="button" className={styles.exitButtonGhost} onClick={onRandom}>
            Surprise me — random gallery
          </button>
        </div>
      </article>
    </div>
  );
}

function undatedSourceLabel(work) {
  return work?.sourceType === 'commons'
    ? 'Undated in the Commons file record'
    : 'Undated in the returned Wikidata record';
}

// In-place deep look at a work: wheel/pinch to zoom about the pointer, drag to pan,
// double-click to toggle. Starts at 1920px and, once zoomed past 1.5x, swaps to the
// largest size Wikimedia renders (3840px) when the original is bigger than that
// (D-SITE-078). Only one large image is ever held, and only while inspecting.
const ZOOM_DETAIL_WIDTH = 3840;
const INSPECT_MAX_ZOOM = 8;

function ZoomableArtwork({ work }) {
  const figureRef = useRef(null);
  const viewRef = useRef({ scale: 1, x: 0, y: 0 });
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(0);
  const dragRef = useRef(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [src, setSrc] = useState(`${work.image}&w=1920`);
  const [detail, setDetail] = useState('standard');
  const canUpgrade = !work.imagePixels || work.imagePixels.width > 1920;

  const apply = useCallback((next) => {
    const scale = clamp(next.scale, 1, INSPECT_MAX_ZOOM);
    const figure = figureRef.current;
    // Keep the image from being dragged away entirely: pan limited to its zoomed overhang.
    const limitX = figure ? (figure.clientWidth * (scale - 1)) / 2 : 0;
    const limitY = figure ? (figure.clientHeight * (scale - 1)) / 2 : 0;
    const view = scale === 1
      ? { scale: 1, x: 0, y: 0 }
      : { scale, x: clamp(next.x, -limitX, limitX), y: clamp(next.y, -limitY, limitY) };
    viewRef.current = view;
    setView(view);
  }, []);

  // Zoom keeping the point under (clientX, clientY) fixed on screen.
  const zoomAt = useCallback((factor, clientX, clientY) => {
    const figure = figureRef.current;
    if (!figure) return;
    const rect = figure.getBoundingClientRect();
    const px = clientX - (rect.left + rect.width / 2);
    const py = clientY - (rect.top + rect.height / 2);
    const current = viewRef.current;
    const scale = clamp(current.scale * factor, 1, INSPECT_MAX_ZOOM);
    const ratio = scale / current.scale;
    apply({ scale, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio });
  }, [apply]);

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      const factor = event.ctrlKey ? Math.exp(-event.deltaY * 0.012) : Math.exp(-event.deltaY * 0.0022);
      zoomAt(factor, event.clientX, event.clientY);
    };
    let gestureScale = 1;
    const onGestureStart = (event) => {
      event.preventDefault();
      gestureScale = event.scale || 1;
    };
    const onGestureChange = (event) => {
      event.preventDefault();
      zoomAt((event.scale || 1) / gestureScale, event.clientX, event.clientY);
      gestureScale = event.scale || 1;
    };
    figure.addEventListener('wheel', onWheel, { passive: false });
    figure.addEventListener('gesturestart', onGestureStart, { passive: false });
    figure.addEventListener('gesturechange', onGestureChange, { passive: false });
    return () => {
      figure.removeEventListener('wheel', onWheel);
      figure.removeEventListener('gesturestart', onGestureStart);
      figure.removeEventListener('gesturechange', onGestureChange);
    };
  }, [zoomAt]);

  // Fetch the larger rendering only once the visitor actually zooms in. The trigger and
  // the load are separate effects so further zooming can't cancel an in-flight load.
  useEffect(() => {
    if (canUpgrade && detail === 'standard' && view.scale >= 1.5) setDetail('loading');
  }, [canUpgrade, detail, view.scale]);

  useEffect(() => {
    if (detail !== 'loading') return undefined;
    const large = `${work.image}&w=${ZOOM_DETAIL_WIDTH}`;
    const img = new Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      setSrc(large);
      setDetail('high');
    };
    img.onerror = () => {
      if (!cancelled) setDetail('standard-only');
    };
    img.src = large;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [detail, work.image]);

  const onPointerDown = (event) => {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = Math.hypot(a.x - b.x, a.y - b.y);
      dragRef.current = null;
    } else {
      dragRef.current = { x: event.clientX, y: event.clientY, ox: viewRef.current.x, oy: viewRef.current.y };
    }
  };
  const onPointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 2 && pinchRef.current > 0) {
      const [a, b] = [...pointersRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(distance / pinchRef.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchRef.current = distance;
      return;
    }
    const drag = dragRef.current;
    if (!drag || viewRef.current.scale === 1) return;
    apply({ scale: viewRef.current.scale, x: drag.ox + event.clientX - drag.x, y: drag.oy + event.clientY - drag.y });
  };
  const onPointerUp = (event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = 0;
    dragRef.current = null;
  };
  const onDoubleClick = (event) => {
    if (viewRef.current.scale > 1) apply({ scale: 1, x: 0, y: 0 });
    else zoomAt(2.5, event.clientX, event.clientY);
  };
  const zoomCentre = (factor) => {
    const rect = figureRef.current?.getBoundingClientRect();
    if (rect) zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const detailLabel = {
    standard: canUpgrade ? '1920 px · zoom for more detail' : 'Full resolution',
    loading: `Loading ${ZOOM_DETAIL_WIDTH} px detail…`,
    high: `${ZOOM_DETAIL_WIDTH} px detail`,
    'standard-only': '1920 px (larger size unavailable)',
  }[detail];

  return (
    <figure
      ref={figureRef}
      className={`${styles.inspectFigure} ${view.scale > 1 ? styles.inspectFigureZoomed : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.inspectImage}
        src={src}
        alt={work.title}
        draggable={false}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      />
      <div className={styles.inspectZoomBar} onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => zoomCentre(1 / 1.6)} aria-label="Zoom out">−</button>
        <span>{Math.round(view.scale * 100)}%</span>
        <button type="button" onClick={() => zoomCentre(1.6)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => apply({ scale: 1, x: 0, y: 0 })} aria-label="Reset zoom">Fit</button>
        <em>{detailLabel}</em>
      </div>
    </figure>
  );
}

function InspectLightbox({ work, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className={`${styles.inspectScrim} ${mounted ? styles.inspectScrimIn : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${work.title} — inspect`}
      onClick={onClose}
    >
      <button className={styles.inspectClose} type="button" onClick={onClose} aria-label="Close inspect view">
        <span className={styles.materialSymbol} aria-hidden>close</span>
      </button>
      <div
        className={`${styles.inspectStage} ${mounted ? styles.inspectStageIn : ''}`}
        onClick={(event) => event.stopPropagation()}
      >
        <ZoomableArtwork work={work} />
        <aside className={styles.inspectCopy}>
          <p className={styles.inspectYear}>{work.year ? work.year : undatedSourceLabel(work)}</p>
          <h2>{work.title}</h2>
          {work.story && <p className={styles.inspectStory}>{work.story}</p>}
          {work.fact && <p className={styles.inspectFact}>{work.fact}</p>}
          <div className={styles.inspectActions}>
            <a href={work.sourceUrl} target="_blank" rel="noreferrer">Source record</a>
            {work.imageSource && <a href={work.imageSource} target="_blank" rel="noreferrer">Image file</a>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function GalleryCanvas({ museum, entered, inspecting, onInspect, onExit }) {
  const canvasRef = useRef(null);
  const enteredRef = useRef(entered);
  const inspectRef = useRef(onInspect);
  const inspectingRef = useRef(inspecting);
  const exitRef = useRef(onExit);

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  useEffect(() => {
    inspectRef.current = onInspect;
  }, [onInspect]);

  useEffect(() => {
    inspectingRef.current = inspecting;
  }, [inspecting]);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const works = museum.works || [];
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    // 1.5x is visually indistinguishable here and saves ~44% of the framebuffer on retina.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    // Warm contemporary gallery: cream plaster, warm-grey dado, light oak herringbone,
    // cove-lit coffered skylight, black track spots, oak frames with white mats.
    scene.background = new THREE.Color(0xe4dacd);
    scene.fog = new THREE.Fog(0xe4dacd, 24, 60);
    // One small prefiltered room environment gives gilt frames, glazing and marble
    // believable reflections for a few MB of GPU memory (D-SITE-078).
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnvironment, 0.04);
    roomEnvironment.dispose();
    pmrem.dispose();
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.42;

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 100);
    // Start just inside the room, facing down the corridor so the doors are behind you.
    camera.position.set(0, 1.72, 2.4);
    camera.rotation.order = 'YXZ';

    // Hang every work at its real size (Wikidata dimensions, true image proportions),
    // alternating walls, spaced by actual frame widths rather than a fixed step.
    const WALL_GAP = 1.05;
    const hung = works.map((work, index) => {
      const size = physicalSize(work);
      // Slim oak frame with a white mat for every work (warm contemporary hang).
      const longEdge = Math.max(size.width, size.height);
      const frameWidth = clamp(0.03 + 0.012 * longEdge, 0.035, 0.06);
      const matPad = size.matted ? 0.07 + 0.22 * longEdge : clamp(0.05 + 0.06 * longEdge, 0.07, 0.18);
      const outerW = size.width + 2 * (matPad + frameWidth);
      const outerH = size.height + 2 * (matPad + frameWidth);
      return { work, index, side: index % 2 === 0 ? -1 : 1, ...size, frameWidth, matPad, outerW, outerH };
    });
    // Right wall starts half a step later so the two walls stagger.
    const wallCursor = { '-1': 1.9, '1': 1.25 };
    hung.forEach((item) => {
      item.z = wallCursor[item.side] - item.outerW / 2;
      // Museum hang: centres near 1.55 m, never dropping onto the dado.
      item.y = Math.max(1.6, 1.08 + item.outerH / 2);
      wallCursor[item.side] -= item.outerW + WALL_GAP;
    });
    const lastPaintingZ = hung.length
      ? Math.min(...hung.map((item) => item.z - item.outerW / 2))
      : 1.0;
    // Back wall sits just past the last work — corridor length follows content.
    const backWallZ = lastPaintingZ - 1.8;
    const corridorLength = 3 - backWallZ;
    const centerZ = (3 + backWallZ) / 2;
    const paintingMeshes = [];
    const keys = new Set();
    const pointer = { down: false, x: 0, y: 0, moved: 0 };
    const cameraState = { yaw: 0, pitch: 0 };
    // When a painting is inspected we ease the camera to face it straight-on, then
    // ease back to exactly where the visitor was standing once the lightbox closes.
    const viewTransition = {
      active: false, // currently easing toward a pose
      saved: null, // the pose to return to on close
      target: null, // the pose we're easing toward
    };
    let wasInspecting = false;
    let frameId = 0;
    let previousTime = performance.now();
    let lastInspected = null;

    // Bright, even daylight: a strong cool sky from the glazed roof plus soft ambient.
    // The per-painting spots then add a gentle accent rather than carrying the whole room.
    // The environment map now supplies soft fill, so the flat lights are reduced.
    scene.add(new THREE.AmbientLight(0xffead2, 0.18));
    const skyFill = new THREE.HemisphereLight(0xfff0dc, 0xb88a55, 0.55);
    scene.add(skyFill);
    // Broad overhead daylight pouring through the skylight, lightly shadowing.
    const daylight = new THREE.DirectionalLight(0xfff3e2, 0.5);
    daylight.position.set(0.5, 9, centerZ + 3);
    daylight.target.position.set(0, 1, centerZ);
    daylight.castShadow = true;
    daylight.shadow.mapSize.set(1024, 1024);
    daylight.shadow.camera.near = 1;
    daylight.shadow.camera.far = 40;
    daylight.shadow.camera.left = -6;
    daylight.shadow.camera.right = 6;
    daylight.shadow.camera.top = 6;
    daylight.shadow.camera.bottom = -6;
    daylight.shadow.bias = -0.0006;
    scene.add(daylight);
    scene.add(daylight.target);

    // Procedural materials — generated on canvases so the room reads as real wood,
    // painted plaster and veined marble rather than flat blocks of colour.
    const disposableTextures = [];
    const registerTexture = (texture) => {
      if (texture) disposableTextures.push(texture);
      return texture;
    };

    // Light oak parquet floor (herringbone planks + grain).
    const floorTex = registerTexture(makeParquetTexture());
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    // Larger planks: a fine repeat shimmered at a distance.
    // ~0.7 m planks: each tile spans 2.05 m across and 2.05 m along the corridor.
    floorTex.repeat.set(4, Math.max(3, Math.round(corridorLength / 2.05)));
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 4;
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.5,
      metalness: 0.05,
    });

    // Muted blue-grey gallery walls with a faint damask/plaster grain.
    const wallTex = registerTexture(makeWallTexture());
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(2, 2);
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.95,
    });

    // Pale cream ceiling/cove.
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9cdbf,
      roughness: 0.95,
    });

    // Warm-grey painted dado with a lighter moulded rail.
    const dadoMaterial = new THREE.MeshStandardMaterial({ color: 0x9b9188, roughness: 0.82 });
    const mouldingMaterial = new THREE.MeshStandardMaterial({ color: 0xb2a99f, roughness: 0.7 });
    // Matte black for track rails and spot heads.
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x141312,
      roughness: 0.45,
      metalness: 0.3,
    });
    const ledMaterial = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
    // Warm oak bench with grain.
    const benchTex = registerTexture(makeOakTexture());
    benchTex.wrapS = benchTex.wrapT = THREE.RepeatWrapping;
    benchTex.repeat.set(3, 1);
    const benchMaterial = new THREE.MeshStandardMaterial({
      map: benchTex,
      roughness: 0.45,
      metalness: 0.04,
    });

    // Floor + structure.
    addBox(scene, [8.2, 0.08, corridorLength], [0, -0.04, centerZ], floorMaterial);
    addBox(scene, [0.14, 4.2, corridorLength], [-4.1, 2.05, centerZ], wallMaterial);
    addBox(scene, [0.14, 4.2, corridorLength], [4.1, 2.05, centerZ], wallMaterial);
    addBox(scene, [8.2, 4.2, 0.14], [0, 2.05, backWallZ], wallMaterial);
    // Pale cove/ceiling either side of the skylight.
    addBox(scene, [3.0, 0.1, corridorLength], [-2.6, 4.15, centerZ], ceilingMaterial);
    addBox(scene, [3.0, 0.1, corridorLength], [2.6, 4.15, centerZ], ceilingMaterial);

    // Marble dado band along the base of each wall.
    const dadoHeight = 0.92;
    addBox(scene, [0.16, dadoHeight, corridorLength], [-4.04, dadoHeight / 2, centerZ], dadoMaterial);
    addBox(scene, [0.16, dadoHeight, corridorLength], [4.04, dadoHeight / 2, centerZ], dadoMaterial);
    addBox(scene, [8.2, dadoHeight, 0.16], [0, dadoHeight / 2, backWallZ + 0.05], dadoMaterial);
    // Moulded dado rail (stepped) and skirting.
    [-1, 1].forEach((side) => {
      addBox(scene, [0.2, 0.05, corridorLength], [side * 4.0, dadoHeight, centerZ], mouldingMaterial);
      addBox(scene, [0.18, 0.03, corridorLength], [side * 4.01, dadoHeight + 0.04, centerZ], mouldingMaterial);
      addBox(scene, [0.19, 0.1, corridorLength], [side * 4.0, 0.05, centerZ], mouldingMaterial);
      // Cornice where wall meets ceiling, with a concealed warm LED strip beneath it.
      addBox(scene, [0.24, 0.12, corridorLength], [side * 3.98, 3.98, centerZ], mouldingMaterial);
      const led = addBox(scene, [0.02, 0.02, corridorLength], [side * 3.87, 3.91, centerZ], ledMaterial);
      led.castShadow = false;
      led.userData.skipRaycast = true;
    });
    addBox(scene, [8.2, 0.05, 0.2], [0, dadoHeight, backWallZ + 0.06], mouldingMaterial);
    addBox(scene, [8.2, 0.1, 0.19], [0, 0.05, backWallZ + 0.06], mouldingMaterial);
    addBox(scene, [8.2, 0.12, 0.24], [0, 3.98, backWallZ + 0.08], mouldingMaterial);

    // Oak benches down the centre.
    const cushionMaterial = new THREE.MeshStandardMaterial({ color: 0xbdb2a5, roughness: 0.97 });
    addBox(scene, [0.92, 0.32, 2.1], [0, 0.16, centerZ + 1.4], benchMaterial);
    addBox(scene, [1.0, 0.13, 2.2], [0, 0.385, centerZ + 1.4], cushionMaterial);

    // ---- Entrance wall behind the visitor, with elegant oak double doors. ----
    const frontWallZ = 3.0;
    const doorWidth = 1.05; // each leaf
    const doorHeight = 2.7;
    const doorGap = doorWidth * 2;
    // Wall in the same blue-grey as the other three, with a doorway gap in the middle.
    const sidePanelWidth = (8.2 - doorGap) / 2;
    addBox(scene, [sidePanelWidth, 4.2, 0.14], [-(doorGap / 2 + sidePanelWidth / 2), 2.05, frontWallZ], wallMaterial);
    addBox(scene, [sidePanelWidth, 4.2, 0.14], [doorGap / 2 + sidePanelWidth / 2, 2.05, frontWallZ], wallMaterial);
    // Lintel above the doorway.
    addBox(scene, [doorGap + 0.4, 4.2 - doorHeight - 0.2, 0.14], [0, doorHeight + 0.2 + (4.2 - doorHeight - 0.2) / 2, frontWallZ], wallMaterial);
    // Dado continues across the side panels.
    addBox(scene, [sidePanelWidth, dadoHeight, 0.16], [-(doorGap / 2 + sidePanelWidth / 2), dadoHeight / 2, frontWallZ - 0.05], dadoMaterial);
    addBox(scene, [sidePanelWidth, dadoHeight, 0.16], [doorGap / 2 + sidePanelWidth / 2, dadoHeight / 2, frontWallZ - 0.05], dadoMaterial);

    // Oak door frame surround.
    const doorFrameMat = new THREE.MeshStandardMaterial({ map: benchTex, roughness: 0.4, metalness: 0.05 });
    addBox(scene, [0.18, doorHeight + 0.3, 0.2], [-(doorGap / 2 + 0.09), (doorHeight + 0.3) / 2, frontWallZ - 0.04], doorFrameMat);
    addBox(scene, [0.18, doorHeight + 0.3, 0.2], [doorGap / 2 + 0.09, (doorHeight + 0.3) / 2, frontWallZ - 0.04], doorFrameMat);
    addBox(scene, [doorGap + 0.36, 0.2, 0.2], [0, doorHeight + 0.2, frontWallZ - 0.04], doorFrameMat);

    const exitMeshes = [];
    // Two oak-panelled door leaves.
    [-1, 1].forEach((side) => {
      const leaf = new THREE.Group();
      leaf.position.set(side * doorWidth / 2, doorHeight / 2, frontWallZ - 0.12);
      // Door slab.
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth - 0.04, doorHeight - 0.04, 0.08),
        new THREE.MeshStandardMaterial({ map: benchTex, roughness: 0.42, metalness: 0.06 })
      );
      slab.userData.exit = true;
      slab.castShadow = true;
      leaf.add(slab);
      // Recessed raised panels (two per leaf) for the panelled look.
      const panelMat = new THREE.MeshStandardMaterial({ color: 0x5b4226, roughness: 0.5 });
      [0.62, -0.62].forEach((py) => {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth - 0.34, doorHeight / 2 - 0.34), panelMat);
        panel.position.set(0, py, 0.045);
        panel.userData.exit = true;
        leaf.add(panel);
      });
      // Brass handle near the central meeting stiles.
      const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xc9a84a, roughness: 0.25, metalness: 0.85 })
      );
      handle.position.set(-side * (doorWidth / 2 - 0.16), 0, 0.07);
      handle.userData.exit = true;
      leaf.add(handle);
      leaf.traverse((obj) => { if (obj.isMesh) exitMeshes.push(obj); });
      scene.add(leaf);
    });

    // "EXIT" placard above the doors.
    const exitSignTexture = makeExitSignTexture();
    const exitSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.34),
      new THREE.MeshBasicMaterial({ map: exitSignTexture, transparent: true })
    );
    exitSign.position.set(0, doorHeight + 0.55, frontWallZ - 0.06);
    scene.add(exitSign);

    const wallTitleTexture = makeWallTextTexture(museum.artist);
    const wallTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.82),
      new THREE.MeshBasicMaterial({ map: wallTitleTexture, transparent: true })
    );
    wallTitle.position.set(0, 2.34, backWallZ + 0.08);
    scene.add(wallTitle);

    // Recessed, evenly glowing ceiling light box inside a stepped coffer.
    const skylight = addBox(
      scene,
      [2.2, 0.04, corridorLength - 1.4],
      [0, 4.42, centerZ],
      // Not tone-mapped: the light box should read as a glowing source, not grey paint.
      new THREE.MeshBasicMaterial({ color: 0xfff6e6, toneMapped: false })
    );
    skylight.userData.skipRaycast = true;
    skylight.castShadow = false;
    const cofferMaterial = new THREE.MeshStandardMaterial({ color: 0xf2ebe1, roughness: 0.9 });
    [-1, 1].forEach((side) => {
      const fascia = addBox(scene, [0.04, 0.32, corridorLength - 1.4], [side * 1.12, 4.28, centerZ], cofferMaterial);
      fascia.castShadow = false;
    });
    [-1, 1].forEach((end) => {
      const fascia = addBox(scene, [2.24, 0.32, 0.04], [0, 4.28, centerZ + end * (corridorLength - 1.4) / 2], cofferMaterial);
      fascia.castShadow = false;
    });

    // Continuous black track rails along each side of the coffer.
    addBox(scene, [0.05, 0.04, corridorLength - 1], [-1.45, 4.08, centerZ], trimMaterial);
    addBox(scene, [0.05, 0.04, corridorLength - 1], [1.45, 4.08, centerZ], trimMaterial);
    // Warm wash grazing the upper walls from the cornice LEDs.
    const washTexture = registerTexture(makeEdgeShadeTexture());
    const washMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd9a8,
      alphaMap: washTexture,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    [-1, 1].forEach((side) => {
      const wash = new THREE.Mesh(new THREE.PlaneGeometry(corridorLength, 0.9), washMaterial);
      wash.position.set(side * 4.026, 3.45, centerZ);
      wash.rotation.set(Math.PI, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      wash.userData.skipRaycast = true;
      scene.add(wash);
    });

    // ---- Works ---------------------------------------------------------------
    // Shared materials and textures: per-work cost is geometry plus one image texture.
    const oakFrameMaterial = new THREE.MeshStandardMaterial({ color: 0xb27b45, roughness: 0.55, metalness: 0.02 });
    const oakFrameEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0x8c5b30, roughness: 0.6 });
    const matBoardMaterial = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.96 });
    const glazingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.1,
      envMapIntensity: 1.4,
    });
    // Warm scallop of light on the wall above each work: one shared texture, additive,
    // so every painting reads as lit without a real light per work.
    const lightPoolTexture = registerTexture(makeLightPoolTexture());
    const lightPoolMaterial = new THREE.MeshBasicMaterial({
      map: lightPoolTexture,
      color: 0xffe2b8,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // Soft contact shading where walls meet floor and ceiling (cheap baked "AO").
    const edgeShadeTexture = registerTexture(makeEdgeShadeTexture());
    const edgeShadeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      alphaMap: edgeShadeTexture,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    [-1, 1].forEach((side) => {
      const floorShade = new THREE.Mesh(new THREE.PlaneGeometry(corridorLength, 0.34), edgeShadeMaterial);
      floorShade.position.set(side * 3.955, 0.17, centerZ);
      floorShade.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      floorShade.userData.skipRaycast = true;
      scene.add(floorShade);
      const ceilingShade = new THREE.Mesh(new THREE.PlaneGeometry(corridorLength, 0.5), edgeShadeMaterial);
      ceilingShade.position.set(side * 4.025, 3.8, centerZ);
      ceilingShade.rotation.set(Math.PI, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      ceilingShade.userData.skipRaycast = true;
      scene.add(ceilingShade);
    });

    const spotStemGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8);
    const spotBodyGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.18, 16);
    const spotLensGeometry = new THREE.CircleGeometry(0.038, 16);

    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy?.() || 1, 8);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    let disposed = false;
    const prepareTexture = (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      return texture;
    };
    const showTexture = (item, texture) => {
      item.material.map = texture;
      item.material.color.set(0xffffff);
      item.material.needsUpdate = true;
    };

    hung.forEach((item) => {
      const { work, side, width, height, frameWidth, matPad, matted, outerW, outerH } = item;
      const group = new THREE.Group();
      // Group origin sits on the wall face; local +z points into the room.
      group.position.set(side * 4.028, item.y, item.z);
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

      const pool = new THREE.Mesh(new THREE.PlaneGeometry(outerW + 1.3, outerH + 1.5), lightPoolMaterial);
      pool.position.set(0, 0.22, 0.004);
      pool.userData.skipRaycast = true;
      group.add(pool);

      const innerW = width + 2 * matPad;
      const innerH = height + 2 * matPad;
      // Oak box frame: a deeper outer band with a darker inner sight edge, then the mat.
      addFrameRing(group, innerW, innerH, frameWidth, 0.05, 0.025, oakFrameMaterial);
      addFrameRing(group, innerW, innerH, 0.008, 0.042, 0.021, oakFrameEdgeMaterial);
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), matBoardMaterial);
      mat.position.z = 0.03;
      mat.userData.skipRaycast = true;
      group.add(mat);

      const material = new THREE.MeshStandardMaterial({ color: 0x8b7e68, roughness: 0.62, metalness: 0 });
      const image = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
      image.position.z = 0.032;
      image.userData.work = work;
      image.userData.clickable = true;
      group.add(image);
      paintingMeshes.push(image);

      if (matted) {
        // Works on paper are glazed; oil paintings are not.
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerH), glazingMaterial);
        glass.position.z = 0.04;
        glass.userData.skipRaycast = true;
        group.add(glass);
      }

      // Museum wall label beside the work.
      const labelTexture = registerTexture(makeWallLabelTexture(work, museum.artist));
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.12),
        new THREE.MeshStandardMaterial({ map: labelTexture, roughness: 0.9 })
      );
      label.position.set(outerW / 2 + 0.3, Math.min(0, 1.42 - item.y), 0.006);
      label.userData.skipRaycast = true;
      group.add(label);

      // Black cylindrical track spot aimed at the work.
      const head = new THREE.Group();
      head.position.set(side * 1.45, 3.98, item.z);
      const stem = new THREE.Mesh(spotStemGeometry, trimMaterial);
      stem.position.y = 0.05;
      head.add(stem);
      const body = new THREE.Mesh(spotBodyGeometry, trimMaterial);
      body.rotation.x = Math.PI / 2;
      const aim = new THREE.Group();
      aim.add(body);
      const lens = new THREE.Mesh(spotLensGeometry, ledMaterial);
      lens.position.z = 0.095;
      aim.add(lens);
      head.add(aim);
      scene.add(head);
      aim.lookAt(side * 4, item.y, item.z);
      head.traverse((obj) => { obj.userData.skipRaycast = true; });

      Object.assign(item, { material, mesh: image, low: null, high: null, highLoading: false });
      // Every work starts with a 500px preview; nearby works upgrade (see updateDetail).
      textureLoader.load(
        `${work.image}&w=500`,
        (texture) => {
          if (disposed) {
            texture.dispose();
            return;
          }
          item.low = prepareTexture(texture);
          if (!item.high) showTexture(item, item.low);
        },
        undefined,
        () => {
          material.color.set(0x9b8a6b);
        }
      );

      scene.add(group);
    });

    // Detail budget: only the few works nearest the visitor (plus the one being
    // inspected) hold a 1280px texture; the rest keep their preview. GPU texture
    // memory therefore stays roughly constant however many works hang (D-SITE-078).
    const HIGH_DETAIL_COUNT = 4;
    const HIGH_DETAIL_RANGE = 7;
    let highLoadsInFlight = 0;
    const distanceTo = (item) => Math.hypot(camera.position.x - item.side * 4, camera.position.z - item.z);
    function updateDetail() {
      const ranked = [...hung].sort((a, b) => distanceTo(a) - distanceTo(b));
      const wanted = new Set(
        ranked.slice(0, HIGH_DETAIL_COUNT).filter((item) => distanceTo(item) < HIGH_DETAIL_RANGE)
      );
      const inspected = hung.find((item) => item.work === lastInspected);
      if (inspected && inspectingRef.current) wanted.add(inspected);

      hung.forEach((item) => {
        if (!wanted.has(item) && item.high) {
          if (item.low) showTexture(item, item.low);
          item.high.dispose();
          item.high = null;
        }
      });
      wanted.forEach((item) => {
        if (item.high || item.highLoading || highLoadsInFlight >= 2) return;
        item.highLoading = true;
        highLoadsInFlight += 1;
        textureLoader.load(
          `${item.work.image}&w=1280`,
          (texture) => {
            highLoadsInFlight -= 1;
            item.highLoading = false;
            if (disposed) {
              texture.dispose();
              return;
            }
            item.high = prepareTexture(texture);
            showTexture(item, item.high);
          },
          undefined,
          () => {
            highLoadsInFlight -= 1;
            item.highLoading = false;
          }
        );
      });
    }

    // A fixed pool of four real spotlights follows the visitor to the nearest works.
    // The light count never changes, so shaders never recompile and the per-pixel
    // lighting cost is flat regardless of how many works hang.
    const spotPool = Array.from({ length: 4 }, () => {
      const spot = new THREE.SpotLight(0xfff0d6, 0, 8, Math.PI / 7, 0.55, 1.2);
      spot.userData = { item: null, level: 0 };
      scene.add(spot);
      scene.add(spot.target);
      return spot;
    });
    const SPOT_INTENSITY = 7;
    function assignSpots() {
      const nearest = [...hung].sort((a, b) => distanceTo(a) - distanceTo(b)).slice(0, spotPool.length);
      const free = spotPool.filter((spot) => !nearest.includes(spot.userData.item));
      nearest.forEach((item) => {
        if (spotPool.some((spot) => spot.userData.item === item)) return;
        const spot = free.shift();
        if (!spot) return;
        spot.userData.item = item;
        spot.userData.level = 0; // fade in rather than pop
        spot.position.set(item.side * 1.45, 3.92, item.z + 0.15);
        spot.target.position.set(item.side * 4, item.y, item.z);
      });
    }
    let detailClock = 0;
    function updateGalleryLighting(dt) {
      detailClock += dt;
      if (detailClock > 0.3) {
        detailClock = 0;
        assignSpots();
        updateDetail();
      }
      spotPool.forEach((spot) => {
        spot.userData.level = Math.min(1, spot.userData.level + dt * 3);
        spot.intensity = spot.userData.item ? SPOT_INTENSITY * spot.userData.level : 0;
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      keys.add(event.key.toLowerCase());
    };
    const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
    const onPointerDown = (event) => {
      pointer.down = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.moved = 0;
    };
    const onPointerMove = (event) => {
      // No look-around while a painting is being inspected (the view is framed for you).
      if (!pointer.down || !enteredRef.current || inspectingRef.current) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.moved += Math.abs(dx) + Math.abs(dy);
      cameraState.yaw -= dx * 0.0032;
      cameraState.pitch = clamp(cameraState.pitch - dy * 0.0024, -0.52, 0.42);
    };
    const onPointerUp = () => {
      pointer.down = false;
    };
    const onClick = (event) => {
      if (!enteredRef.current || pointer.moved > 8) return;
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Clicking the exit doors offers the visitor a way out.
      const exitHit = raycaster.intersectObjects(exitMeshes, false)[0];
      if (exitHit) {
        exitRef.current?.();
        return;
      }

      const hit = raycaster.intersectObjects(paintingMeshes, false)[0];
      if (hit?.object?.userData?.work) {
        lastInspected = hit.object.userData.work;
        // Snapshot the current standing pose, then frame the clicked painting
        // straight-on so the blurred backdrop behind the lightbox reads cleanly.
        const paintingPos = new THREE.Vector3();
        hit.object.getWorldPosition(paintingPos);
        const side = paintingPos.x < 0 ? -1 : 1;
        viewTransition.saved = {
          x: camera.position.x,
          z: camera.position.z,
          yaw: cameraState.yaw,
          pitch: cameraState.pitch,
        };
        viewTransition.target = {
          x: side * 1.7,
          z: clamp(paintingPos.z, backWallZ + 2.4, 2.5),
          yaw: side < 0 ? Math.PI / 2 : -Math.PI / 2,
          pitch: 0,
        };
        viewTransition.active = true;
        inspectRef.current?.(hit.object.userData.work);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('click', onClick);

    function easeAngle(current, target, t) {
      // Shortest-path angular ease so yaw doesn't spin the long way round.
      let delta = target - current;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      return current + delta * t;
    }

    function step(dt) {
      const isInspecting = inspectingRef.current;

      // Detect the close edge: was inspecting, now not — ease back to the saved pose.
      if (wasInspecting && !isInspecting && viewTransition.saved) {
        viewTransition.target = viewTransition.saved;
        viewTransition.saved = null;
        viewTransition.active = true;
      }
      wasInspecting = isInspecting;

      if (viewTransition.active && viewTransition.target) {
        // Frame-rate-independent ease toward the target pose.
        const t = 1 - Math.pow(0.0001, dt);
        const tgt = viewTransition.target;
        camera.position.x = lerp(camera.position.x, tgt.x, t);
        camera.position.z = lerp(camera.position.z, tgt.z, t);
        cameraState.yaw = easeAngle(cameraState.yaw, tgt.yaw, t);
        cameraState.pitch = lerp(cameraState.pitch, tgt.pitch, t);
        const done =
          Math.abs(camera.position.x - tgt.x) < 0.01 &&
          Math.abs(camera.position.z - tgt.z) < 0.01 &&
          Math.abs(cameraState.pitch - tgt.pitch) < 0.01;
        // Once we've settled on a return (not inspecting), stop transitioning so the
        // visitor regains free control exactly where they left off.
        if (done && !isInspecting) {
          viewTransition.active = false;
          viewTransition.target = null;
        }
      } else if (enteredRef.current && !isInspecting) {
        // Free walk — only when not inspecting.
        const forwardIntent = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
        const strafeIntent = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
        const speed = 3.2 * dt;
        camera.position.z -= forwardIntent * speed;
        camera.position.x += strafeIntent * speed;
        camera.position.x = clamp(camera.position.x, -2.9, 2.9);
        camera.position.z = clamp(camera.position.z, backWallZ + 2.4, 2.5);
      }

      camera.rotation.y = cameraState.yaw;
      camera.rotation.x = cameraState.pitch;
      updateGalleryLighting(dt);
      renderer.render(scene, camera);
    }

    const renderState = () => JSON.stringify({
      mode: 'art-atlas-gallery',
      artist: museum.artist.name,
      coordinateSystem: 'Three.js world coordinates; x left/right, y height, z corridor depth; movement follows gallery axes; yaw changes look direction only.',
      movementMode: 'gallery-axis',
      entered: enteredRef.current,
      camera: {
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2)),
        yaw: Number(cameraState.yaw.toFixed(2)),
      },
      bounds: {
        backWallZ: Number(backWallZ.toFixed(2)),
        lastPaintingZ: Number(lastPaintingZ.toFixed(2)),
        corridorLength: Number(corridorLength.toFixed(2)),
      },
      worksVisible: works.length,
      lastInspected: lastInspected?.title || null,
    });

    const advanceTime = (ms) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) step(1 / 60);
    };

    const publishTestHooks = () => {
      window.render_game_to_text = renderState;
      window.advanceTime = advanceTime;
      window.__ART_ATLAS_STATE__ = renderState();
    };

    function animate(time) {
      const dt = clamp((time - previousTime) / 1000, 0.001, 0.05);
      previousTime = time;
      step(dt);
      publishTestHooks();
      frameId = window.requestAnimationFrame(animate);
    }

    publishTestHooks();
    animate(previousTime);

    return () => {
      disposed = true;
      hung.forEach((item) => {
        item.low?.dispose();
        item.high?.dispose();
      });
      envTarget.dispose();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('click', onClick);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      wallTitleTexture.dispose();
      exitSignTexture.dispose();
      disposableTextures.forEach((texture) => texture.dispose());
      if (window.render_game_to_text === renderState) delete window.render_game_to_text;
      if (window.advanceTime === advanceTime) delete window.advanceTime;
      delete window.__ART_ATLAS_STATE__;
    };
  }, [museum]);

  return <canvas ref={canvasRef} className={styles.galleryCanvas} aria-label={`${museum.artist.name} 3D gallery`} />;
}

// Real-world hanging size in metres. Wikidata dimensions set the scale; the image's own
// pixel proportions set the shape (so a texture is never stretched even when the
// recorded size includes a frame or differs slightly). Fitted to the wall height.
function physicalSize(work) {
  const cm = work.dimensionsCm;
  const px = work.imagePixels;
  const aspect = px?.width && px?.height ? px.width / px.height : cm?.width && cm?.height ? cm.width / cm.height : 1.25;
  let height;
  if (cm?.width && cm?.height) {
    // Preserve the recorded surface area with the image's aspect ratio.
    height = Math.sqrt(((cm.width / 100) * (cm.height / 100)) / aspect);
  } else {
    // Unknown size: a modest easel-painting scale.
    height = Math.min(0.9, 1.5 / aspect);
  }
  let width = height * aspect;
  const fit = Math.min(1, 2.5 / height, 3.4 / width);
  width *= fit;
  height *= fit;
  // Very small prints stay at least 30 cm on the long edge so they can be found.
  const longEdge = Math.max(width, height);
  const realLongEdge = cm?.width && cm?.height ? Math.max(cm.width, cm.height) / 100 : null;
  if (longEdge < 0.3) {
    width *= 0.3 / longEdge;
    height *= 0.3 / longEdge;
  }
  // Works under ~60 cm with a recorded size hang matted and glazed, like works on paper.
  return { width, height, matted: realLongEdge !== null && realLongEdge < 0.6 };
}

// Four boxes forming a rectangular frame ring around an inner opening.
function addFrameRing(group, innerW, innerH, band, depth, z, material) {
  const outerW = innerW + band * 2;
  const pieces = [
    [outerW, band, 0, innerH / 2 + band / 2],
    [outerW, band, 0, -(innerH / 2 + band / 2)],
    [band, innerH, -(innerW / 2 + band / 2), 0],
    [band, innerH, innerW / 2 + band / 2, 0],
  ];
  pieces.forEach(([w, h, x, y]) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.userData.skipRaycast = true;
    group.add(mesh);
  });
}

function makeLightPoolTexture() {
  const canvas = makeCanvas(256);
  const ctx = canvas.getContext('2d');
  // Elliptical scallop: brightest just above centre, fading to nothing at the edge.
  ctx.save();
  ctx.translate(128, 112);
  ctx.scale(1, 1.15);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 120);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(-128, -128, 256, 256);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeEdgeShadeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  // alphaMap reads the green channel: white (opaque shade) at the bottom edge.
  const grad = ctx.createLinearGradient(0, 64, 0, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 64);
  return new THREE.CanvasTexture(canvas);
}

function makeWallLabelTexture(work, artist) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 204;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f6f3ec';
  ctx.fillRect(0, 0, 512, 204);
  ctx.fillStyle = '#5c5246';
  ctx.font = '22px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText((artist?.name || '').toUpperCase(), 28, 48);
  ctx.fillStyle = '#1f1a14';
  ctx.font = 'italic 34px Georgia, Times New Roman, serif';
  const title = String(work.title || '');
  ctx.fillText(title.length > 26 ? `${title.slice(0, 25)}…` : title, 28, 104);
  ctx.fillStyle = '#5c5246';
  ctx.font = '24px Georgia, Times New Roman, serif';
  const size = work.dimensionsCm ? ` · ${work.dimensionsCm.height} × ${work.dimensionsCm.width} cm` : '';
  ctx.fillText(`${work.year || 'Undated'}${size}`, 28, 150);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function addBox(scene, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

// Light oak chevron parquet. Four columns of 45-degree planks alternating direction;
// sizes are chosen so the canvas tiles seamlessly in both directions.
function makeParquetTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const columns = 4;
  const columnWidth = size / columns;
  const plankLength = columnWidth / Math.cos(Math.PI / 4);
  const rows = 12;
  const step = size / rows;
  const plankWidth = step * Math.sin(Math.PI / 4);
  const tones = ['#d8ad75', '#cfa36b', '#c99d64', '#dcb37d', '#c6975e', '#d4a870'];
  ctx.fillStyle = '#cba06a';
  ctx.fillRect(0, 0, size, size);
  for (let c = 0; c < columns; c += 1) {
    const angle = c % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
    ctx.save();
    ctx.beginPath();
    ctx.rect(c * columnWidth, 0, columnWidth, size);
    ctx.clip();
    for (let k = -2; k <= rows + 2; k += 1) {
      ctx.save();
      ctx.translate(c * columnWidth + columnWidth / 2, k * step);
      ctx.rotate(angle);
      ctx.fillStyle = tones[(k * 7 + c * 3 + rows * 4) % tones.length];
      ctx.fillRect(-plankLength / 2, -plankWidth / 2, plankLength, plankWidth);
      // Soft grain along the plank.
      ctx.strokeStyle = 'rgba(120, 80, 40, 0.12)';
      ctx.lineWidth = 1;
      for (let g = 1; g < 4; g += 1) {
        const gy = -plankWidth / 2 + (g * plankWidth) / 4;
        ctx.beginPath();
        ctx.moveTo(-plankLength / 2, gy);
        ctx.bezierCurveTo(-plankLength / 6, gy + 1.5, plankLength / 6, gy - 1.5, plankLength / 2, gy);
        ctx.stroke();
      }
      // Fine joint line.
      ctx.strokeStyle = 'rgba(105, 68, 34, 0.35)';
      ctx.strokeRect(-plankLength / 2, -plankWidth / 2, plankLength, plankWidth);
      ctx.restore();
    }
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Warm cream painted plaster with a soft hand-finished mottle.
function makeWallTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e3d4c1';
  ctx.fillRect(0, 0, size, size);
  // Soft mottle for hand-painted plaster.
  for (let i = 0; i < 1400; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 3 + 0.5;
    const shade = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.025)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Warm oak grain for benches.
function makeOakTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8a6536';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(60, 40, 20, 0.3)';
  ctx.lineWidth = 1.4;
  for (let y = 6; y < size; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin(x / 40 + y) * 3);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeWallTextTexture(artist) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.fillStyle = 'rgba(58, 40, 26, 0.92)';
  context.font = '76px Georgia, Times New Roman, serif';
  context.fillText(artist.name.toUpperCase(), 512, 150);
  context.fillStyle = 'rgba(92, 70, 48, 0.8)';
  context.font = '28px Georgia, Times New Roman, serif';
  context.fillText(`— ${artist.birth || ''} – ${artist.death || 'present'} —`, 512, 210);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeExitSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(232, 226, 216, 0.92)';
  context.font = '40px Georgia, Times New Roman, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('E X I T  ·  T O  T H E  T I M E L I N E', 384, 80);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
