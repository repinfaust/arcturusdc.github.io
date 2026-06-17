'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTenant } from '@/contexts/TenantContext';
import styles from './art-atlas.module.css';

const YEAR_MIN = 500;
const YEAR_MAX = 2026;
const WORLD_START = 280;
const WORLD_WIDTH = 4240;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function yearToX(year) {
  return WORLD_START + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * WORLD_WIDTH;
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
  const [zoom, setZoom] = useState(0.3);
  const [pan, setPan] = useState({ x: 0, y: 16 });
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState('timeline');
  const dragRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

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
    const factor = event.deltaY > 0 ? 0.88 : 1.14;
    setZoom((current) => clamp(current * factor, 0.22, 2.35));
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
            }}
          >
            <div className={styles.rail} />
            {[500, 700, 900, 1100, 1300, 1450, 1600, 1750, 1875, 1935, 1975, 2026].map((year) => (
              <div key={year} className={styles.tick} style={{ left: yearToX(year) }}>
                <span>{year}</span>
              </div>
            ))}

            {filteredPeriods.map((period, index) => {
              const centerYear = (period.years[0] + period.years[1]) / 2;
              const left = yearToX(centerYear);
              const top = 590 + period.orbit;
              return (
                <div
                  key={period.id}
                  className={styles.cluster}
                  style={{
                    left,
                    top,
                    '--period-color': period.color,
                    '--line-angle': `${index % 2 === 0 ? -13 : 17}deg`,
                  }}
                >
                  <div className={styles.clusterLabel}>
                    <strong>{period.name}</strong>
                    <span>{yearsLabel(period.years)}</span>
                  </div>
                  {period.artists.map((artist) => (
                    <button
                      key={artist.wikidataId}
                      className={styles.artistNode}
                      type="button"
                      style={{
                        left: 130 + artist.offset.x,
                        top: 96 + artist.offset.y,
                        '--period-color': period.color,
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedArtist(artist);
                      }}
                    >
                      <span className={styles.portraitShell}>
                        {artist.portrait ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={artist.portrait} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.nodeFallback}>{artist.name.charAt(0)}</span>
                        )}
                      </span>
                      <strong>{artist.name}</strong>
                      <span className={styles.artistDateLabel}>{artistDates(artist)}</span>
                    </button>
                  ))}
                </div>
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

function ArtistPlacard({ artist, onClose, onEnter }) {
  return (
    <div className={styles.modalScrim} role="dialog" aria-modal="true" aria-labelledby="artist-placard-title">
      <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close artist card">
        <span className={styles.materialSymbol} aria-hidden>close</span>
      </button>
      <article className={styles.placard}>
        <div className={styles.placardBody}>
          {artist.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.placardPortrait} src={artist.portrait} alt="" />
          ) : (
            <div className={styles.placardPortrait} aria-hidden />
          )}
          <div>
            <p className={styles.placardKicker}>{artist.periodName}</p>
            <h2 id="artist-placard-title">{artist.name}</h2>
            <div className={styles.lifeDates}>{artistDates(artist)}</div>
            <div className={styles.rule} />
            <p className={styles.placardSummary}>{artist.summary}</p>
          </div>
        </div>
        <footer className={styles.placardFooter}>
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
          <GalleryCanvas museum={museum} entered={entered} onInspect={setInspectedWork} />
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
        <aside className={styles.inspectPanel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.inspectImage} src={inspectedWork.image} alt="" />
          <div className={styles.inspectCopy}>
            <h2>{inspectedWork.title}</h2>
            <p>{inspectedWork.year ? inspectedWork.year : 'Undated in the returned Wikidata record'}</p>
            <p>{inspectedWork.story}</p>
            <p>{inspectedWork.fact}</p>
            <div className={styles.inspectActions}>
              <a href={inspectedWork.sourceUrl}>Source record</a>
              {inspectedWork.imageSource && <a href={inspectedWork.imageSource}>Image file</a>}
              <button className={styles.galleryBack} type="button" onClick={() => setInspectedWork(null)}>
                Close
              </button>
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}

function GalleryCanvas({ museum, entered, onInspect }) {
  const canvasRef = useRef(null);
  const enteredRef = useRef(entered);
  const inspectRef = useRef(onInspect);

  useEffect(() => {
    enteredRef.current = entered;
  }, [entered]);

  useEffect(() => {
    inspectRef.current = onInspect;
  }, [onInspect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const works = museum.works || [];
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070604);
    scene.fog = new THREE.Fog(0x070604, 12, 42);

    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 100);
    camera.position.set(0, 1.72, 4.8);
    camera.rotation.order = 'YXZ';

    const corridorLength = Math.max(28, works.length * 3.2 + 8);
    const centerZ = 3 - corridorLength / 2;
    const paintingMeshes = [];
    const keys = new Set();
    const pointer = { down: false, x: 0, y: 0, moved: 0 };
    const cameraState = { yaw: 0, pitch: 0 };
    let frameId = 0;
    let previousTime = performance.now();
    let lastInspected = null;

    scene.add(new THREE.AmbientLight(0xf2dfbd, 0.82));

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x120d08,
      roughness: 0.24,
      metalness: 0.18,
    });
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d0c6,
      roughness: 0.64,
    });
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x7b674c,
      roughness: 0.72,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x050403,
      roughness: 0.42,
    });
    const benchMaterial = new THREE.MeshStandardMaterial({
      color: 0x5e4528,
      roughness: 0.34,
      metalness: 0.05,
    });

    addBox(scene, [8.2, 0.08, corridorLength], [0, -0.04, centerZ], floorMaterial);
    addBox(scene, [0.14, 4.2, corridorLength], [-4.1, 2.05, centerZ], wallMaterial);
    addBox(scene, [0.14, 4.2, corridorLength], [4.1, 2.05, centerZ], wallMaterial);
    addBox(scene, [8.2, 4.2, 0.14], [0, 2.05, 3 - corridorLength], wallMaterial);
    addBox(scene, [3.2, 0.1, corridorLength], [-2.55, 4.1, centerZ], ceilingMaterial);
    addBox(scene, [3.2, 0.1, corridorLength], [2.55, 4.1, centerZ], ceilingMaterial);
    addBox(scene, [8.3, 0.12, 0.12], [0, 0.08, centerZ + corridorLength / 2 - 0.4], trimMaterial);
    addBox(scene, [0.16, 0.18, corridorLength], [-4.02, 0.18, centerZ], trimMaterial);
    addBox(scene, [0.16, 0.18, corridorLength], [4.02, 0.18, centerZ], trimMaterial);
    addBox(scene, [1.08, 0.18, 3.25], [0, 0.42, centerZ + 2.2], benchMaterial);
    addBox(scene, [0.58, 0.42, 2.08], [0, 0.18, centerZ + 2.2], trimMaterial);

    const wallTitleTexture = makeWallTextTexture(museum.artist);
    const wallTitle = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.82),
      new THREE.MeshBasicMaterial({ map: wallTitleTexture, transparent: true })
    );
    wallTitle.position.set(0, 2.34, 3 - corridorLength + 0.08);
    scene.add(wallTitle);

    const skylight = addBox(
      scene,
      [1.5, 0.04, corridorLength - 2],
      [0, 4.12, centerZ],
      new THREE.MeshBasicMaterial({ color: 0xf3eee5 })
    );
    skylight.userData.skipRaycast = true;

    for (let i = 0; i < Math.max(works.length, 8); i += 1) {
      const z = 1.2 - i * 3.05;
      const x = i % 2 === 0 ? -3.98 : 3.98;
      const light = new THREE.SpotLight(0xfff0d0, 2.4, 8.6, Math.PI / 5, 0.42, 1.2);
      light.position.set(x > 0 ? 2.5 : -2.5, 3.6, z + 0.2);
      light.target.position.set(x, 1.92, z);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      scene.add(light);
      scene.add(light.target);
      addBox(scene, [0.12, 0.12, 1.2], [x > 0 ? 3.55 : -3.55, 3.58, z + 0.2], trimMaterial);
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    works.forEach((work, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const z = 1.2 - index * 3.05;
      const width = index % 3 === 0 ? 1.65 : 1.34;
      const height = index % 3 === 0 ? 1.16 : 1.42;
      const group = new THREE.Group();
      group.position.set(side * 3.96, 1.88, z);
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.28, height + 0.28, 0.11),
        new THREE.MeshStandardMaterial({ color: 0x6f5328, roughness: 0.38, metalness: 0.28 })
      );
      group.add(frame);

      const mat = new THREE.MeshStandardMaterial({ color: 0xe9dfca, roughness: 0.48 });
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
          opacity: 0.1,
        })
      );
      glazing.position.z = 0.071;
      glazing.userData.skipRaycast = true;
      group.add(glazing);

      loader.load(
        work.image,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          mat.map = texture;
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
      if (!pointer.down || !enteredRef.current) return;
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

    function step(dt) {
      if (enteredRef.current) {
        const forwardIntent = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
        const strafeIntent = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
        const forward = new THREE.Vector3(Math.sin(cameraState.yaw), 0, -Math.cos(cameraState.yaw));
        const right = new THREE.Vector3(Math.cos(cameraState.yaw), 0, Math.sin(cameraState.yaw));
        const speed = 3.2 * dt;
        camera.position.addScaledVector(forward, forwardIntent * speed);
        camera.position.addScaledVector(right, strafeIntent * speed);
        camera.position.x = clamp(camera.position.x, -2.9, 2.9);
        camera.position.z = clamp(camera.position.z, 3 - corridorLength + 2.4, 4.8);
      }
      camera.rotation.y = cameraState.yaw;
      camera.rotation.x = cameraState.pitch;
      renderer.render(scene, camera);
    }

    const renderState = () => JSON.stringify({
      mode: 'art-atlas-gallery',
      artist: museum.artist.name,
      coordinateSystem: 'Three.js world coordinates; x left/right, y height, z corridor depth; camera faces negative z at entry.',
      entered: enteredRef.current,
      camera: {
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2)),
        yaw: Number(cameraState.yaw.toFixed(2)),
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
