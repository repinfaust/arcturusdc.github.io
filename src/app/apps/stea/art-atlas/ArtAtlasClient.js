'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTenant } from '@/contexts/TenantContext';
import styles from './art-atlas.module.css';

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

export default function ArtAtlasClient() {
  return (
    <SteaAccessGate>
      <ArtAtlasExperience />
    </SteaAccessGate>
  );
}

function SteaAccessGate({ children }) {
  const { availableTenants, loading: tenantLoading, error: tenantError, isSuperAdmin } = useTenant();
  const hasSteaAccess = isSuperAdmin || availableTenants.length > 0;

  if (tenantLoading) {
    return (
      <main className={styles.accessShell}>
        <section className={styles.accessPanel}>
          <p className={styles.placardKicker}>STEa Access</p>
          <h1>Checking access</h1>
          <p>Confirming your STEa membership before opening Art Atlas.</p>
        </section>
      </main>
    );
  }

  if (!hasSteaAccess) {
    return (
      <main className={styles.accessShell}>
        <section className={styles.accessPanel}>
          <p className={styles.placardKicker}>STEa Access Required</p>
          <h1>Art Atlas</h1>
          <p>
            This page is available to any signed-in STEa member, independent of the selected workspace.
            {tenantError ? ` Access lookup returned: ${tenantError}` : ' Sign in with an authorised account to continue.'}
          </p>
          <a className={styles.accessButton} href="/apps/stea?next=/apps/stea/art-atlas">
            Open STEa sign-in
          </a>
        </section>
      </main>
    );
  }

  return children;
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

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    // Gentle, frame-rate-independent step; normalise across mouse-wheel vs trackpad deltas.
    const intensity = clamp(Math.abs(event.deltaY) / 100, 0.2, 1.6);
    const factor = event.deltaY > 0 ? 1 - 0.08 * intensity : 1 + 0.08 * intensity;
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

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return;
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
    if (!dragging) return;
    const nextX = dragRef.current.panX + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.panY + event.clientY - dragRef.current.y;
    setPan({ x: nextX, y: nextY });
  }, [dragging]);

  const endDrag = useCallback((event) => {
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
          className={`${styles.atlasStage} ${dragging ? styles.atlasStageDragging : ''}`}
          onWheel={handleWheel}
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
        <ArtistPlacard
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
          onEnter={() => enterGallery(selectedArtist)}
        />
      )}
    </main>
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

function GalleryView({ artist, onBack }) {
  const [museum, setMuseum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entered, setEntered] = useState(false);
  const [inspectedWork, setInspectedWork] = useState(null);

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
            inspecting={Boolean(inspectedWork)}
            onInspect={setInspectedWork}
          />
          {entered && (
            <div className={styles.galleryHelp}>
              WASD / arrows to walk · drag to look · click a work to inspect
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
        <InspectLightbox work={inspectedWork} onClose={() => setInspectedWork(null)} />
      )}
    </main>
  );
}

function undatedSourceLabel(work) {
  return work?.sourceType === 'commons'
    ? 'Undated in the Commons file record'
    : 'Undated in the returned Wikidata record';
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
        <figure className={styles.inspectFigure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.inspectImage} src={work.image} alt={work.title} />
        </figure>
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

function GalleryCanvas({ museum, entered, inspecting, onInspect }) {
  const canvasRef = useRef(null);
  const enteredRef = useRef(entered);
  const inspectRef = useRef(onInspect);
  const inspectingRef = useRef(inspecting);

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
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const works = museum.works || [];
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    // Bright, soft daylight room (National Gallery / Tate Britain), not a dark void.
    scene.background = new THREE.Color(0xb9bcc0);
    scene.fog = new THREE.Fog(0xb9bcc0, 22, 60);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 100);
    camera.position.set(0, 1.72, 4.8);
    camera.rotation.order = 'YXZ';

    // Paintings alternate walls, so each wall only holds half the works — spacing is
    // per-side. Tighter spacing keeps the room intimate rather than a long tunnel.
    const paintingSpacing = 2.35;
    const firstPaintingZ = 1.0;
    const perSideCount = Math.ceil(works.length / 2);
    const lastPaintingZ = works.length > 0 ? firstPaintingZ - (perSideCount - 1) * paintingSpacing : firstPaintingZ;
    // Back wall sits just past the last painting — corridor length follows content,
    // no fixed minimum that leaves an empty void at the end.
    const backWallZ = lastPaintingZ - 3.2;
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
    scene.add(new THREE.AmbientLight(0xeef0f2, 0.62));
    const skyFill = new THREE.HemisphereLight(0xf2f4f7, 0xb9a884, 0.95);
    scene.add(skyFill);
    // Broad overhead daylight pouring through the skylight, lightly shadowing.
    const daylight = new THREE.DirectionalLight(0xf3f1ec, 0.55);
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
    floorTex.repeat.set(Math.max(2, Math.round(corridorLength / 2)), Math.max(3, Math.round(corridorLength / 1.6)));
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
      color: 0xe9e6dd,
      roughness: 0.95,
    });

    // Dark green-grey veined marble dado running along the wall base.
    const dadoTex = registerTexture(makeMarbleTexture());
    dadoTex.wrapS = dadoTex.wrapT = THREE.RepeatWrapping;
    dadoTex.repeat.set(Math.max(2, Math.round(corridorLength / 3)), 1);
    const dadoMaterial = new THREE.MeshStandardMaterial({
      map: dadoTex,
      roughness: 0.3,
      metalness: 0.18,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x161617,
      roughness: 0.45,
    });
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
    addBox(scene, [3.2, 0.1, corridorLength], [-2.55, 4.1, centerZ], ceilingMaterial);
    addBox(scene, [3.2, 0.1, corridorLength], [2.55, 4.1, centerZ], ceilingMaterial);

    // Marble dado band along the base of each wall.
    const dadoHeight = 0.62;
    addBox(scene, [0.16, dadoHeight, corridorLength], [-4.04, dadoHeight / 2, centerZ], dadoMaterial);
    addBox(scene, [0.16, dadoHeight, corridorLength], [4.04, dadoHeight / 2, centerZ], dadoMaterial);
    addBox(scene, [8.2, dadoHeight, 0.16], [0, dadoHeight / 2, backWallZ + 0.05], dadoMaterial);
    // Thin dark cap line on top of the dado.
    addBox(scene, [0.18, 0.03, corridorLength], [-4.02, dadoHeight, centerZ], trimMaterial);
    addBox(scene, [0.18, 0.03, corridorLength], [4.02, dadoHeight, centerZ], trimMaterial);
    addBox(scene, [8.2, 0.03, 0.18], [0, dadoHeight, backWallZ + 0.05], trimMaterial);

    // Oak benches down the centre.
    addBox(scene, [1.1, 0.12, 2.4], [0, 0.46, centerZ + 1.4], benchMaterial);
    addBox(scene, [0.9, 0.46, 0.16], [0, 0.23, centerZ + 0.3], benchMaterial);
    addBox(scene, [0.9, 0.46, 0.16], [0, 0.23, centerZ + 2.5], benchMaterial);

    const wallTitleTexture = makeWallTextTexture(museum.artist);
    const wallTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.82),
      new THREE.MeshBasicMaterial({ map: wallTitleTexture, transparent: true })
    );
    wallTitle.position.set(0, 2.34, backWallZ + 0.08);
    scene.add(wallTitle);

    // Bright glazed skylight panel running the length of the roof.
    const skylight = addBox(
      scene,
      [2.4, 0.04, corridorLength - 1.4],
      [0, 4.14, centerZ],
      new THREE.MeshBasicMaterial({ color: 0xf7f6f2 })
    );
    skylight.userData.skipRaycast = true;
    // Faint mullion bars across the glazing for the gridded-roof look.
    for (let z = centerZ - (corridorLength - 1.4) / 2 + 0.6; z < centerZ + (corridorLength - 1.4) / 2; z += 1.1) {
      const bar = addBox(scene, [2.4, 0.05, 0.04], [0, 4.16, z], ceilingMaterial);
      bar.userData.skipRaycast = true;
    }

    // Continuous track-lighting rails along each side of the skylight.
    addBox(scene, [0.06, 0.06, corridorLength - 1], [-1.3, 4.0, centerZ], trimMaterial);
    addBox(scene, [0.06, 0.06, corridorLength - 1], [1.3, 4.0, centerZ], trimMaterial);

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    works.forEach((work, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      // Step per wall: paintings on the same side are one spacing apart; opposite
      // walls are staggered by half a step so the room doesn't read as rigid rows.
      const sideIndex = Math.floor(index / 2);
      const stagger = side > 0 ? paintingSpacing * 0.5 : 0;
      const z = firstPaintingZ - sideIndex * paintingSpacing - stagger;
      const width = index % 3 === 0 ? 1.65 : 1.34;
      const height = index % 3 === 0 ? 1.16 : 1.42;
      const group = new THREE.Group();
      group.position.set(side * 3.96, 1.88, z);
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

      // Restrained aged-gold frame with a cream mount inside it.
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.3, height + 0.3, 0.12),
        new THREE.MeshStandardMaterial({ color: 0x9c7a3c, roughness: 0.44, metalness: 0.45 })
      );
      group.add(frame);
      const mount = new THREE.Mesh(
        new THREE.PlaneGeometry(width + 0.12, height + 0.12),
        new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.9 })
      );
      mount.position.z = 0.061;
      mount.userData.skipRaycast = true;
      group.add(mount);

      const mat = new THREE.MeshStandardMaterial({ color: 0xe9dfca, roughness: 0.52, emissive: 0x000000 });
      const image = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
      image.position.z = 0.065;
      image.userData.work = work;
      image.userData.clickable = true;
      group.add(image);
      paintingMeshes.push(image);

      const glazing = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.08,
          metalness: 0,
          transparent: true,
          opacity: 0.08,
        })
      );
      glazing.position.z = 0.071;
      glazing.userData.skipRaycast = true;
      group.add(glazing);

      // A soft warm accent spot per painting — gentle in the already-bright daylight
      // room, just enough to lift each canvas off the coloured wall.
      const spot = new THREE.SpotLight(0xfff2da, 3.6, 7.5, Math.PI / 6.5, 0.6, 1.2);
      spot.position.set(side * 2.6, 3.5, z);
      spot.target.position.set(side * 3.95, 1.84, z);
      scene.add(spot);
      scene.add(spot.target);
      // Visible track-light fixture above the painting.
      addBox(scene, [0.14, 0.1, 0.14], [side * 1.3, 3.96, z], trimMaterial);

      loader.load(
        work.image,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy?.() || 1, 8);
          mat.map = texture;
          // Faint self-illumination so canvases stay legible between spotlight pools.
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveMap = texture;
          mat.emissiveIntensity = 0.16;
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          mat.color.set(0x9b8a6b);
        }
      );

      scene.add(group);
    });

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
          z: clamp(paintingPos.z, backWallZ + 2.4, 4.8),
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
        camera.position.z = clamp(camera.position.z, backWallZ + 2.4, 4.8);
      }

      camera.rotation.y = cameraState.yaw;
      camera.rotation.x = cameraState.pitch;
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
      disposableTextures.forEach((texture) => texture.dispose());
      if (window.render_game_to_text === renderState) delete window.render_game_to_text;
      if (window.advanceTime === advanceTime) delete window.advanceTime;
      delete window.__ART_ATLAS_STATE__;
    };
  }, [museum]);

  return <canvas ref={canvasRef} className={styles.galleryCanvas} aria-label={`${museum.artist.name} 3D gallery`} />;
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

// Herringbone oak parquet — the characteristic National Gallery / Tate floor.
function makeParquetTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b9893f';
  ctx.fillRect(0, 0, size, size);

  const plankL = 120;
  const plankW = 30;
  const tones = ['#c89a52', '#bd8c45', '#b07e3a', '#c79248', '#a9763a'];
  let t = 0;
  // Lay planks at +/-45° in a herringbone weave.
  for (let row = -1; row < size / plankW + 2; row += 1) {
    for (let col = -1; col < size / plankW + 2; col += 1) {
      const angle = (row + col) % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
      const cx = col * plankW * 1.4;
      const cy = row * plankW * 1.4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.fillStyle = tones[t % tones.length];
      t += 1;
      ctx.fillRect(-plankL / 2, -plankW / 2, plankL, plankW);
      // Grain streaks.
      ctx.strokeStyle = 'rgba(80, 52, 24, 0.22)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g += 1) {
        const gy = -plankW / 2 + (g + 1) * (plankW / 5);
        ctx.beginPath();
        ctx.moveTo(-plankL / 2, gy + Math.sin(g) * 1.5);
        ctx.lineTo(plankL / 2, gy - Math.sin(g) * 1.5);
        ctx.stroke();
      }
      // Plank edge.
      ctx.strokeStyle = 'rgba(60, 40, 18, 0.5)';
      ctx.strokeRect(-plankL / 2, -plankW / 2, plankL, plankW);
      ctx.restore();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Blue-grey painted wall with a faint damask weave and plaster mottle.
function makeWallTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6f7e88';
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
  // Very faint damask diamond lattice.
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = -size; x < size * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Dark green-grey veined marble for the dado.
function makeMarbleTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#2c3833');
  grad.addColorStop(0.5, '#384541');
  grad.addColorStop(1, '#2a352f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // Veins.
  for (let i = 0; i < 26; i += 1) {
    ctx.strokeStyle = `rgba(${190 + Math.random() * 40},${200 + Math.random() * 30},${195 + Math.random() * 30},${0.08 + Math.random() * 0.12})`;
    ctx.lineWidth = Math.random() * 1.6 + 0.3;
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 6; s += 1) {
      x += (Math.random() - 0.5) * 140;
      y += (Math.random() - 0.5) * 140;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
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
  context.fillStyle = 'rgba(30, 25, 18, 0.62)';
  context.font = '24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  context.textAlign = 'center';
  context.fillText('WELCOME TO', 512, 96);
  context.fillStyle = 'rgba(20, 18, 16, 0.92)';
  context.font = '68px Georgia, Times New Roman, serif';
  context.fillText(artist.name.toUpperCase(), 512, 166);
  context.fillStyle = 'rgba(72, 55, 32, 0.74)';
  context.font = '27px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  context.fillText(`${artist.birth || ''} - ${artist.death || 'present'}`, 512, 220);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
