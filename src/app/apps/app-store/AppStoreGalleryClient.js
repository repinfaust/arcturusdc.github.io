'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import styles from './app-store.module.css';

const CATEGORY_OPTIONS = [
  'All Apps',
  'Health & Wellbeing',
  'Family & Relationships',
  'Sports & Performance',
  'Productivity',
  'Tools & Systems',
  'In Development',
];

const APP_ORDER = [
  'adhd-acclaim',
  'unload',
  'toume',
  'dialled-mtb',
  'sprocket',
  'mandrake',
  'rehabpath',
  'apex-state',
  'assumezero',
  'syncfit',
];

const STATUS_LABEL = {
  live: 'Live',
  development: 'In development',
  comingSoon: 'Coming soon',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function platformLabel(app) {
  if (app.availability?.length) {
    return app.availability.map((platform) => (platform === 'ios' ? 'iOS' : platform.charAt(0).toUpperCase() + platform.slice(1))).join(' / ');
  }
  if (app.appStoreUrl) return 'iOS';
  if (app.googlePlayUrl) return 'Android';
  return app.status === 'development' ? 'Prototype' : 'Web';
}

function normalizeApps(apps) {
  const byId = new Map(apps.map((app) => [app.id, app]));
  const ordered = APP_ORDER.map((id) => byId.get(id)).filter(Boolean);
  apps.forEach((app) => {
    if (!APP_ORDER.includes(app.id)) ordered.push(app);
  });

  return ordered.map((app, index) => ({
    ...app,
    order: index,
    category: app.status === 'development' && !app.category ? 'In Development' : app.category || 'Tools & Systems',
    caseFileUrl: app.caseFileUrl || app.link || `/apps/${app.id}`,
    features: app.features || [app.desc || app.strap || 'Focused product experience'],
    live: app.live ?? app.status === 'live',
    platformLabel: platformLabel(app),
  }));
}

export default function AppStoreGalleryClient({ apps }) {
  const catalogue = useMemo(() => normalizeApps(apps), [apps]);
  const [mounted, setMounted] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All Apps');
  const [hoveredApp, setHoveredApp] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const updateMode = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setFallback(reduced || window.innerWidth < 861);
      setMounted(true);
    };
    updateMode();
    window.addEventListener('resize', updateMode);
    return () => window.removeEventListener('resize', updateMode);
  }, []);

  const filteredCatalogue = useMemo(() => {
    if (activeCategory === 'All Apps') return catalogue;
    if (activeCategory === 'In Development') return catalogue.filter((app) => app.status === 'development');
    return catalogue.filter((app) => app.category === activeCategory);
  }, [activeCategory, catalogue]);

  const moveSelection = (direction) => {
    const visible = filteredCatalogue.length ? filteredCatalogue : catalogue;
    const current = selectedApp || hoveredApp || visible[0];
    const currentIndex = Math.max(0, visible.findIndex((app) => app.id === current?.id));
    const next = visible[(currentIndex + direction + visible.length) % visible.length];
    setSelectedApp(next);
    window.__APP_STORE_FOCUS__?.(next.id);
  };

  if (mounted && fallback) {
    return (
      <main className={styles.fallback}>
        <header className={styles.fallbackHeader}>
          <div>
            <Link className={styles.backLink} href="/apps">Back to Apps</Link>
            <h1>Apps<span className={styles.redDot}>.</span></h1>
            <p>ArcturusDC App Store · Products that work</p>
          </div>
        </header>
        <section className={styles.fallbackGrid}>
          {catalogue.map((app) => (
            <Link key={app.id} className={styles.fallbackCard} href={app.caseFileUrl}>
              {app.icon ? <img src={app.icon} alt="" /> : null}
              <h2>{app.name}<span className={styles.redDot}>.</span></h2>
              <p>{app.strap || app.desc}</p>
              <p>{STATUS_LABEL[app.status] || app.status} · {app.platformLabel}</p>
            </Link>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.storeShell}>
      <AppStoreScene
        apps={catalogue}
        activeCategory={activeCategory}
        onHover={setHoveredApp}
        onSelect={setSelectedApp}
        onPosition={setPosition}
      />
      <div className={styles.grain} />

      <header className={styles.topLeft}>
        <Link className={styles.backLink} href="/apps">Back to Apps</Link>
        <div className={styles.heroTitle}>
          <h1>Apps</h1>
          <p>Step into the ArcturusDC App Store.</p>
        </div>
      </header>

      <div className={styles.topRight}>
        <h2>ArcturusDC</h2>
        <p>Products that work</p>
      </div>

      <aside className={styles.browsePanel}>
        <p className={styles.panelKicker}>Browse <span className={styles.redDot}>•</span></p>
        <div className={styles.categoryList}>
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category}
              type="button"
              className={`${styles.categoryButton} ${activeCategory === category ? styles.categoryActive : ''}`}
              onClick={() => {
                setActiveCategory(category);
                setSelectedApp(null);
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </aside>

      <aside className={styles.aboutPanel}>
        <p className={styles.panelKicker}>{hoveredApp ? 'Exhibit' : 'About'} <span className={styles.redDot}>•</span></p>
        {hoveredApp ? (
          <>
            <p><strong>{hoveredApp.name}</strong><br />{hoveredApp.desc || hoveredApp.strap}</p>
            <button className={styles.detailLink} type="button" onClick={() => setSelectedApp(hoveredApp)}>
              View details
            </button>
          </>
        ) : (
          <>
            <p>Built with clarity. Designed for real-world use. Every app solves a real problem I&apos;ve lived.</p>
            <Link className={styles.detailLink} href="/capabilities">View capabilities</Link>
          </>
        )}
      </aside>

      <div className={styles.walkControl} aria-label="Walk through the store controls">
        <button className={styles.walkButton} type="button" onClick={() => moveSelection(-1)} aria-label="Previous app">←</button>
        <div className={styles.walkLabel}>Walk through<br />the store</div>
        <button className={styles.walkButton} type="button" onClick={() => moveSelection(1)} aria-label="Next app">→</button>
      </div>

      <div className={styles.miniMap}>
        <p className={styles.miniLabel}>Gallery position</p>
        <div className={styles.miniTrack}>
          <span className={styles.miniDot} style={{ left: `${position * 100}%` }} />
        </div>
      </div>

      <p className={styles.hintStrip}>
        Desktop: WASD / arrow keys to walk · click-drag to look · click an exhibit · Esc resets focus
      </p>

      {selectedApp && <AppDetail app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </main>
  );
}

function AppDetail({ app, onClose }) {
  return (
    <aside className={styles.detailPanel} role="dialog" aria-modal="true" aria-labelledby="app-store-detail-title">
      <div className={styles.detailHeader}>
        <h2 id="app-store-detail-title">{app.name}<span className={styles.redDot}>.</span></h2>
        <button className={styles.closeButton} type="button" onClick={onClose} aria-label="Close app detail">×</button>
      </div>
      {app.icon ? <img className={styles.detailIcon} src={app.icon} alt="" /> : null}
      <p>{app.summary || app.strap || app.desc}</p>
      <div className={styles.detailMeta}>
        <span>{app.category}</span>
        <span>{STATUS_LABEL[app.status] || app.status} · {app.platformLabel}</span>
      </div>
      <ul className={styles.featureList}>
        {app.features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
      <div className={styles.detailActions}>
        {app.appStoreUrl ? <a className={styles.detailLink} href={app.appStoreUrl} target="_blank" rel="noopener noreferrer">App Store</a> : null}
        {app.googlePlayUrl ? <a className={styles.detailLink} href={app.googlePlayUrl} target="_blank" rel="noopener noreferrer">Google Play</a> : null}
        {app.caseFileUrl ? <Link className={styles.detailLink} href={app.caseFileUrl}>Case file</Link> : null}
      </div>
    </aside>
  );
}

function AppStoreScene({ apps, activeCategory, onHover, onSelect, onPosition }) {
  const canvasRef = useRef(null);
  const appsRef = useRef(apps);
  const categoryRef = useRef(activeCategory);
  const hoverRef = useRef(onHover);
  const selectRef = useRef(onSelect);
  const positionRef = useRef(onPosition);

  useEffect(() => { appsRef.current = apps; }, [apps]);
  useEffect(() => { categoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { hoverRef.current = onHover; }, [onHover]);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { positionRef.current = onPosition; }, [onPosition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    // National Gallery / Tate Britain daylight room — matches the Art Atlas galleries.
    scene.background = new THREE.Color(0xb9bcc0);
    scene.fog = new THREE.Fog(0xb9bcc0, 22, 60);

    const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 100);
    camera.position.set(0, 1.78, 1.6);
    camera.rotation.order = 'YXZ';
    const cameraState = { yaw: 0, pitch: 0 };

    const posterSpacing = 4.35;
    const pairCount = Math.max(1, Math.ceil(apps.length / 2));
    const lastPosterZ = 2 - (pairCount - 1) * posterSpacing - (apps.length % 2 === 0 ? 1.05 : 0);
    const farZ = lastPosterZ - 5.15;
    const corridorLength = 3 - farZ;
    const centerZ = 3 - corridorLength / 2;
    const posterMeshes = [];
    const keys = new Set();
    const pointer = { down: false, x: 0, y: 0, moved: 0 };
    let frameId = 0;
    let previousTime = performance.now();
    let lastHovered = null;
    let lastSelected = null;

    // Oak parquet floor (matches Art Atlas).
    const floorTexture = makeParquetTexture();
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(Math.max(2, Math.round(corridorLength / 2)), Math.max(3, Math.round(corridorLength / 1.6)));
    floorTexture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 4;
    floorTexture.colorSpace = THREE.SRGBColorSpace;

    // Blue-grey painted walls with faint damask/plaster grain.
    const wallTexture = makeWallTexture();
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 2);
    wallTexture.colorSpace = THREE.SRGBColorSpace;

    // Veined marble dado.
    const dadoTexture = makeMarbleTexture();
    dadoTexture.wrapS = THREE.RepeatWrapping;
    dadoTexture.wrapT = THREE.RepeatWrapping;
    dadoTexture.repeat.set(Math.max(2, Math.round(corridorLength / 3)), 1);
    dadoTexture.colorSpace = THREE.SRGBColorSpace;

    const frameTexture = makeOakTexture();
    frameTexture.wrapS = THREE.RepeatWrapping;
    frameTexture.wrapT = THREE.RepeatWrapping;
    frameTexture.colorSpace = THREE.SRGBColorSpace;

    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.5, metalness: 0.05 });
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.95 });
    const backWallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.95 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xe9e6dd, roughness: 0.95 });
    const dadoMaterial = new THREE.MeshStandardMaterial({ map: dadoTexture, roughness: 0.3, metalness: 0.18 });
    // Restrained aged-gold frame.
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x9c7a3c, roughness: 0.44, metalness: 0.45 });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      depthWrite: false,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x161617, roughness: 0.45 });

    // Bright, even daylight (matches Art Atlas): soft ambient + warm sky + overhead.
    scene.add(new THREE.AmbientLight(0xeef0f2, 0.62));
    scene.add(new THREE.HemisphereLight(0xf2f4f7, 0xb9a884, 0.95));
    const keyLight = new THREE.DirectionalLight(0xf3f1ec, 0.55);
    keyLight.position.set(0.5, 9, centerZ + 3);
    keyLight.target.position.set(0, 1, centerZ);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0006;
    scene.add(keyLight);
    scene.add(keyLight.target);

    addBox(scene, [8.7, 0.08, corridorLength], [0, -0.04, centerZ], floorMaterial, { receiveShadow: true });
    addBox(scene, [0.14, 4.45, corridorLength], [-4.28, 2.12, centerZ], wallMaterial);
    addBox(scene, [0.14, 4.45, corridorLength], [4.28, 2.12, centerZ], wallMaterial);
    addBox(scene, [8.7, 4.45, 0.14], [0, 2.12, farZ], backWallMaterial);
    addBox(scene, [3.35, 0.1, corridorLength], [-2.65, 4.25, centerZ], ceilingMaterial);
    addBox(scene, [3.35, 0.1, corridorLength], [2.65, 4.25, centerZ], ceilingMaterial);
    // Glazed skylight strip.
    addBox(scene, [2.4, 0.04, corridorLength - 1.5], [0, 4.3, centerZ + 0.1], new THREE.MeshBasicMaterial({ color: 0xf7f6f2 }), { castShadow: false, receiveShadow: false });

    // Marble dado band along the base of each wall.
    const dadoHeight = 0.62;
    addBox(scene, [0.16, dadoHeight, corridorLength], [-4.22, dadoHeight / 2, centerZ], dadoMaterial, { receiveShadow: true });
    addBox(scene, [0.16, dadoHeight, corridorLength], [4.22, dadoHeight / 2, centerZ], dadoMaterial, { receiveShadow: true });
    addBox(scene, [8.7, dadoHeight, 0.16], [0, dadoHeight / 2, farZ + 0.05], dadoMaterial, { receiveShadow: true });
    // Dark cap line on top of the dado.
    addBox(scene, [0.18, 0.03, corridorLength], [-4.2, dadoHeight, centerZ], trimMaterial);
    addBox(scene, [0.18, 0.03, corridorLength], [4.2, dadoHeight, centerZ], trimMaterial);
    addBox(scene, [8.7, 0.03, 0.18], [0, dadoHeight, farZ + 0.05], trimMaterial);
    // Skylight track rails.
    addBox(scene, [0.06, 0.06, corridorLength - 2], [-1.3, 4.0, centerZ], trimMaterial, { castShadow: true, receiveShadow: false });
    addBox(scene, [0.06, 0.06, corridorLength - 2], [1.3, 4.0, centerZ], trimMaterial, { castShadow: true, receiveShadow: false });

    addEndWall(scene, farZ + 0.08);

    apps.forEach((app, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const pairIndex = Math.floor(index / 2);
      const z = 2 - pairIndex * posterSpacing - (side > 0 ? 1.05 : 0);
      const group = new THREE.Group();
      group.position.set(side * 4.16, 2.04, z);
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 2.36, 0.14),
        frameMaterial
      );
      frame.castShadow = true;
      frame.receiveShadow = true;
      group.add(frame);

      const mat = new THREE.MeshStandardMaterial({ color: 0xede5d3, roughness: 0.58 });
      const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 2.08), mat);
      poster.position.z = 0.078;
      poster.receiveShadow = true;
      poster.userData.app = app;
      poster.userData.baseOpacity = 1;
      group.add(poster);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 2.08), glassMaterial);
      glass.position.z = 0.083;
      glass.renderOrder = 2;
      group.add(glass);
      posterMeshes.push(poster);
      scene.add(group);

      makePosterTexture(app).then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        mat.map = texture;
        mat.needsUpdate = true;
      });

      const spot = new THREE.SpotLight(0xffefd5, 2.8, 7, Math.PI / 5.8, 0.44, 1.2);
      spot.position.set(side * 2.65, 3.74, z + 0.14);
      spot.target.position.set(side * 4.16, 1.86, z);
      spot.castShadow = true;
      spot.shadow.mapSize.set(512, 512);
      scene.add(spot);
      scene.add(spot.target);
      addBox(scene, [0.12, 0.12, 1.0], [side * 3.62, 3.72, z + 0.1], trimMaterial);
    });

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        cameraState.yaw = 0;
        cameraState.pitch = 0;
        return;
      }
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
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObjects(posterMeshes, false)[0];
      const app = hit?.object?.userData?.app || null;
      if (app?.id !== lastHovered?.id) {
        lastHovered = app;
        hoverRef.current?.(app);
      }

      if (!pointer.down) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.moved += Math.abs(dx) + Math.abs(dy);
      cameraState.yaw -= dx * 0.003;
      cameraState.pitch = clamp(cameraState.pitch - dy * 0.0022, -0.38, 0.34);
    };
    const onPointerUp = () => { pointer.down = false; };
    const onClick = (event) => {
      if (pointer.moved > 8) return;
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObjects(posterMeshes, false)[0];
      if (hit?.object?.userData?.app) {
        lastSelected = hit.object.userData.app;
        selectRef.current?.(lastSelected);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('click', onClick);

    window.__APP_STORE_FOCUS__ = (id) => {
      const index = appsRef.current.findIndex((app) => app.id === id);
      if (index >= 0) {
        const pairIndex = Math.floor(index / 2);
        camera.position.z = clamp(1.6 - pairIndex * posterSpacing, farZ + 2.2, 2.2);
      }
    };

    const renderState = () => JSON.stringify({
      mode: 'arcturusdc-app-store-gallery',
      activeCategory: categoryRef.current,
      camera: {
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2)),
        yaw: Number(cameraState.yaw.toFixed(2)),
      },
      appsVisible: appsRef.current.length,
      hovered: lastHovered?.id || null,
      selected: lastSelected?.id || null,
      coordinateSystem: 'Three.js world coordinates; x left/right, y height, z corridor depth; entry faces negative z.',
    });

    const advanceTime = (ms) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) step(1 / 60);
    };

    const publishHooks = () => {
      window.render_game_to_text = renderState;
      window.advanceTime = advanceTime;
      window.__APP_STORE_STATE__ = renderState();
    };

    function step(dt) {
      const forwardIntent = (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0);
      const strafeIntent = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
      // Gallery-axis movement (matches Art Atlas guardrails): WASD moves along the
      // corridor/world axes regardless of look direction, so you never drift or
      // wander off into a wall. Yaw/pitch only change where you're looking.
      const speed = 3.4 * dt;
      camera.position.z -= forwardIntent * speed;
      camera.position.x += strafeIntent * speed;
      camera.position.x = clamp(camera.position.x, -2.65, 2.65);
      camera.position.z = clamp(camera.position.z, farZ + 2.1, 2.2);
      camera.rotation.y = cameraState.yaw;
      camera.rotation.x = cameraState.pitch;

      const category = categoryRef.current;
      posterMeshes.forEach((mesh) => {
        const app = mesh.userData.app;
        const matches = category === 'All Apps' || (category === 'In Development' ? app.status === 'development' : app.category === category);
        mesh.material.opacity = matches ? 1 : 0.28;
        mesh.material.transparent = !matches;
      });

      const range = 2.2 - (farZ + 2.1);
      const progress = clamp((2.2 - camera.position.z) / range, 0, 1);
      positionRef.current?.(progress);
      renderer.render(scene, camera);
    }

    function animate(time) {
      const dt = clamp((time - previousTime) / 1000, 0.001, 0.05);
      previousTime = time;
      step(dt);
      publishHooks();
      frameId = window.requestAnimationFrame(animate);
    }

    publishHooks();
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
      if (window.render_game_to_text === renderState) delete window.render_game_to_text;
      if (window.advanceTime === advanceTime) delete window.advanceTime;
      if (window.__APP_STORE_FOCUS__) delete window.__APP_STORE_FOCUS__;
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
    };
  }, [apps]);

  return <canvas ref={canvasRef} className={styles.storeCanvas} aria-label="ArcturusDC App Store 3D gallery" />;
}

function addBox(scene, size, position, material, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = options.castShadow ?? false;
  mesh.receiveShadow = options.receiveShadow ?? true;
  scene.add(mesh);
  return mesh;
}

function addEndWall(scene, z) {
  const texture = new THREE.CanvasTexture(drawEndWallCanvas());
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 3.26),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  mesh.position.set(0, 2.32, z);
  mesh.renderOrder = 3;
  scene.add(mesh);

  loadImage('/img/arcturus-logo-transparent.png').then((logo) => {
    texture.image = drawEndWallCanvas(logo);
    texture.needsUpdate = true;
  }).catch(() => {});
}

function drawEndWallCanvas(logo) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 820;
  const ctx = canvas.getContext('2d');

  if (logo) {
    ctx.save();
    ctx.globalAlpha = 0.27;
    const fit = containRect(logo.width, logo.height, 1160, 1160);
    ctx.drawImage(logo, 220 + fit.x, -165 + fit.y, fit.width, fit.height);
    ctx.restore();
    drawFallbackStar(ctx, 800, 405, 430, 0.16);
  } else {
    drawFallbackStar(ctx, 800, 390, 470, 0.18);
  }

  ctx.fillStyle = 'rgba(28,28,26,0.46)';
  ctx.font = '700 28px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME TO', 800, 338);
  ctx.fillStyle = '#1c1c1a';
  ctx.font = '700 92px Arial';
  ctx.letterSpacing = '8px';
  ctx.fillText('ARCTURUSDC', 800, 452);
  ctx.fillStyle = '#1c1c1a';
  ctx.font = '700 30px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.fillText('APP STORE', 800, 520);
  ctx.fillStyle = '#f0452f';
  ctx.beginPath();
  ctx.arc(1076, 430, 8, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

async function makePosterTexture(app) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1320;
  const ctx = canvas.getContext('2d');
  drawPoster(ctx, app);

  const [iconResult, appStoreResult, googlePlayResult] = await Promise.allSettled([
    app.icon ? loadImage(app.icon) : Promise.resolve(null),
    app.appStoreUrl ? loadImage('/assets/badges/download-on-the-app-store.svg') : Promise.resolve(null),
    app.googlePlayUrl ? loadImage('/assets/badges/google-play-badge.png') : Promise.resolve(null),
  ]);

  drawPoster(ctx, app, {
    icon: iconResult.status === 'fulfilled' ? iconResult.value : null,
    appStoreBadge: appStoreResult.status === 'fulfilled' ? appStoreResult.value : null,
    googlePlayBadge: googlePlayResult.status === 'fulfilled' ? googlePlayResult.value : null,
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

function drawPoster(ctx, app, assets = {}) {
  const image = assets.icon;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#efe7d8';
  ctx.fillRect(0, 0, 900, 1320);
  drawPaperGrain(ctx, 900, 1320, 720);

  const vignette = ctx.createRadialGradient(450, 560, 120, 450, 560, 720);
  vignette.addColorStop(0, 'rgba(255,255,255,0.22)');
  vignette.addColorStop(1, 'rgba(112,84,48,0.1)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 900, 1320);

  ctx.strokeStyle = 'rgba(28,28,26,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, 808, 1228);
  ctx.strokeStyle = 'rgba(255,255,255,0.48)';
  ctx.strokeRect(58, 58, 784, 1204);

  ctx.fillStyle = '#1c1c1a';
  ctx.font = '900 86px Arial';
  wrapText(ctx, `${app.name}.`, 88, 160, 690, 82);

  ctx.fillStyle = 'rgba(28,28,26,0.72)';
  ctx.font = '30px Arial';
  wrapText(ctx, app.strap || app.desc || '', 88, 315, 650, 44, 3);

  ctx.fillStyle = 'rgba(28,28,26,0.52)';
  ctx.font = '24px monospace';
  ctx.fillText(`/${app.status === 'live' ? 'live' : 'in development'}`, 88, 460);
  ctx.fillText(`/${app.platformLabel.toLowerCase()}`, 88, 498);

  ctx.fillStyle = 'rgba(244,240,232,0.86)';
  roundRect(ctx, 260, 560, 380, 380, 24);
  ctx.fill();

  if (image) {
    const fit = containRect(image.naturalWidth || image.width, image.naturalHeight || image.height, 300, 300);
    ctx.drawImage(image, 300 + fit.x, 600 + fit.y, fit.width, fit.height);
  } else {
    ctx.fillStyle = '#1c1c1a';
    ctx.font = '900 120px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(app.name.charAt(0), 450, 790);
    ctx.textAlign = 'left';
  }

  const badgeY = 1110;
  let badgeX = 84;
  if (app.appStoreUrl) {
    if (assets.appStoreBadge) {
      drawStoreBadgeImage(ctx, assets.appStoreBadge, badgeX, badgeY, 218, 74);
    } else {
      drawBadge(ctx, badgeX, badgeY, 'Download on the', 'App Store');
    }
    badgeX += 250;
  }
  if (app.googlePlayUrl) {
    if (assets.googlePlayBadge) {
      drawStoreBadgeImage(ctx, assets.googlePlayBadge, badgeX, badgeY, 238, 74);
    } else {
      drawBadge(ctx, badgeX, badgeY, 'Get it on', 'Google Play');
    }
  }

  ctx.fillStyle = '#f0452f';
  ctx.beginPath();
  ctx.arc(760, 164, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawBadge(ctx, x, y, top, bottom) {
  ctx.fillStyle = '#090908';
  roundRect(ctx, x, y, 218, 74, 8);
  ctx.fill();
  ctx.fillStyle = '#f8f4ee';
  ctx.font = '16px Arial';
  ctx.fillText(top, x + 48, y + 28);
  ctx.font = '700 25px Arial';
  ctx.fillText(bottom, x + 48, y + 55);
  ctx.fillStyle = '#f0452f';
  ctx.beginPath();
  ctx.arc(x + 28, y + 37, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawStoreBadgeImage(ctx, image, x, y, width, height) {
  ctx.save();
  ctx.fillStyle = '#090908';
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.clip();
  const fit = containRect(image.naturalWidth || image.width, image.naturalHeight || image.height, width - 4, height - 4);
  ctx.drawImage(image, x + 2 + fit.x, y + 2 + fit.y, fit.width, fit.height);
  ctx.restore();
}

function drawPaperGrain(ctx, width, height, count) {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const shade = i % 2 === 0 ? '255,255,255' : '72,54,34';
    ctx.fillStyle = `rgba(${shade},${0.018 + Math.random() * 0.025})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  ctx.restore();
}

function drawFallbackStar(ctx, cx, cy, radius, alpha = 0.13) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f0452f';
  ctx.beginPath();
  for (let i = 0; i < 32; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 32;
    const spike = i % 4 === 0 ? radius : i % 2 === 0 ? radius * 0.23 : radius * 0.42;
    const x = cx + Math.cos(angle) * spike;
    const y = cy + Math.sin(angle) * spike;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---- Procedural materials shared with the Art Atlas galleries ----

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

// Herringbone oak parquet.
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
      ctx.strokeStyle = 'rgba(80, 52, 24, 0.22)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g += 1) {
        const gy = -plankW / 2 + (g + 1) * (plankW / 5);
        ctx.beginPath();
        ctx.moveTo(-plankL / 2, gy + Math.sin(g) * 1.5);
        ctx.lineTo(plankL / 2, gy - Math.sin(g) * 1.5);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(60, 40, 18, 0.5)';
      ctx.strokeRect(-plankL / 2, -plankW / 2, plankL, plankW);
      ctx.restore();
    }
  }
  return new THREE.CanvasTexture(canvas);
}

// Blue-grey painted wall with faint damask weave and plaster mottle.
function makeWallTexture() {
  const size = 512;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6f7e88';
  ctx.fillRect(0, 0, size, size);
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
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  const stepW = 64;
  for (let x = -size; x < size * 2; x += stepW) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + size, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
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
  return new THREE.CanvasTexture(canvas);
}

// Warm oak grain for frames.
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
  return new THREE.CanvasTexture(canvas);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = words[i];
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function containRect(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return { x: (maxWidth - width) / 2, y: (maxHeight - height) / 2, width, height };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
