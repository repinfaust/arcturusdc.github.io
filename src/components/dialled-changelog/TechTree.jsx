'use client';

// Dialled MTB tech tree — React port of dialled_tech_tree.html.
// Behaviour parity with the source artefact: hover traces the dependency
// chain, click selects + opens the detail panel, lane filters dim, the canvas
// scrolls both axes. Extensions per build spec: keyboard operability (§9),
// per-node release history + lightbox in the panel (§7), recency marker (§10).
// Visual contract is LOCKED (§2) — styling lives in techtree.module.css only.

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import styles from './techtree.module.css';

const COL_W = 262, ROW_H = 90, NODE_W = 206, NODE_H = 72, PAD_X = 124, PAD_Y = 50;

const STATUS_CLASS = {
  shipped: styles.sShipped,
  progress: styles.sProgress,
  next: styles.sNext,
  open: '',
  validate: styles.sValidate,
  locked: styles.sLocked,
  avoid: styles.sAvoid,
  kill: styles.sKill,
};
const PILL_CLASS = {
  shipped: styles.pillShipped,
  progress: styles.pillProgress,
  next: styles.pillNext,
  open: styles.pillOpen,
  validate: styles.pillValidate,
  locked: styles.pillLocked,
  avoid: styles.pillAvoid,
  kill: styles.pillKill,
};
const LANE_CLASS = { core: styles.laneCore, setup: styles.laneSetup, labs: styles.laneLabs };
const BAND_CLASS = { core: styles.laneBandCore, setup: styles.laneBandSetup, labs: styles.laneBandLabs };
const BAND_LABEL_CLASS = { core: styles.laneLabelCore, setup: styles.laneLabelSetup, labs: styles.laneLabelLabs };
const CAT_CLASS = { utility: styles.catUtility, safety: styles.catSafety, provenance: styles.catProvenance };
const CHIP_CLASS = {
  shipped: styles.lcShipped,
  progress: styles.lcProgress,
  next: styles.lcNext,
  open: styles.lcOpen,
  validate: styles.lcValidate,
  locked: styles.lcLocked,
  avoid: styles.lcAvoid,
};
const PLATFORM_LABEL = { ios: 'iOS', android: 'Android', backend: 'Backend', web: 'Web' };
// Source artefact quirk, reproduced deliberately: the legend says "Locked"
// while the node pill for the same state says "Phase 2".
const LEGEND_LABEL_OVERRIDE = { locked: 'Locked' };

function scoreClass(metric, v) {
  // commercial & strategic: higher = better. build & ops: higher = heavier.
  const heavy = metric === 'd' || metric === 'o';
  if (heavy) return v >= 8 ? styles.svHeavy : v >= 6 ? styles.svMid : styles.svGood;
  return v >= 8 ? styles.svGood : v >= 6 ? styles.svMid : styles.svHeavy;
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

export default function TechTree({ view, basePath }) {
  const { features, laneRows, variant, legendStatuses, labels } = view;

  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [lane, setLane] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  const byId = useMemo(() => Object.fromEntries(features.map((f) => [f.id, f])), [features]);
  const unlocks = useMemo(() => {
    const map = {};
    features.forEach((f) => { map[f.id] = features.filter((m) => m.deps.includes(f.id)).map((m) => m.id); });
    return map;
  }, [features]);

  const edges = useMemo(() => {
    const out = [];
    features.forEach((n) => {
      n.deps.forEach((depId) => {
        const d = byId[depId];
        if (!d) return;
        const x1 = PAD_X + d.col * COL_W + NODE_W, y1 = PAD_Y + d.row * ROW_H + NODE_H / 2;
        const x2 = PAD_X + n.col * COL_W, y2 = PAD_Y + n.row * ROW_H + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        out.push({ from: depId, to: n.id, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` });
      });
    });
    return out;
  }, [features, byId]);

  const maxCol = Math.max(...features.map((f) => f.col));
  const maxRow = Math.max(...features.map((f) => f.row));
  const CANVAS_W = PAD_X + maxCol * COL_W + NODE_W + 56;
  const CANVAS_H = PAD_Y + maxRow * ROW_H + NODE_H + 50;

  // chain = ancestors + descendants of the active node (selection wins over hover)
  const chain = useMemo(() => {
    const id = selected || hovered;
    if (!id || !byId[id]) return null;
    const set = new Set([id]);
    const up = (x) => byId[x].deps.forEach((d) => { if (byId[d] && !set.has(d)) { set.add(d); up(d); } });
    const down = (x) => (unlocks[x] || []).forEach((u) => { if (!set.has(u)) { set.add(u); down(u); } });
    up(id); down(id);
    return set;
  }, [selected, hovered, byId, unlocks]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (lightbox) setLightbox(null);
      else if (selected) setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox, selected]);

  const nodeStateClass = (n) => {
    if (chain) return chain.has(n.id) ? styles.nodeLit : styles.nodeDim;
    if (lane !== 'all' && n.lane !== lane) return styles.nodeDim;
    return '';
  };
  const edgeStateClass = (e) => {
    if (chain) return chain.has(e.from) && chain.has(e.to) ? styles.edgeLit : styles.edgeDim;
    if (lane !== 'all' && (byId[e.from].lane !== lane || byId[e.to].lane !== lane)) return styles.edgeDim;
    return '';
  };

  const sel = selected ? byId[selected] : null;

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.filters} role="group" aria-label="Filter by lane">
          {['all', 'core', 'setup', 'labs'].map((l) => (
            <button
              key={l}
              type="button"
              data-lane={l}
              className={`${styles.filter} ${lane === l ? styles.filterActive : ''}`}
              aria-pressed={lane === l}
              onClick={() => { setLane(l); setSelected(null); }}
            >
              {l === 'all' ? 'All' : labels.lane[l]}
            </button>
          ))}
        </div>
        <div className={styles.legend}>
          {legendStatuses.map((s) => (
            <div key={s} className={styles.legendItem}>
              <span className={`${styles.lchip} ${CHIP_CLASS[s]}`} />
              {LEGEND_LABEL_OVERRIDE[s] || labels.status[s]}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.hint}>
        Tap a node for detail · hover to trace its dependency path · scroll to explore · left → right is now → far horizon
      </div>

      <div className={styles.treeWrap}>
        <div
          className={styles.treeCanvas}
          style={{ width: CANVAS_W, height: CANVAS_H }}
          onClick={() => setSelected(null)}
          role="application"
          aria-label="Dialled MTB product tech tree"
        >
          <svg
            className={styles.edges}
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            aria-hidden="true"
          >
            {edges.map((e) => (
              <path key={`${e.from}-${e.to}`} d={e.d} className={`${styles.edge} ${edgeStateClass(e)}`} />
            ))}
          </svg>

          {Object.entries(laneRows).map(([l, [r0, r1]]) => {
            const top = PAD_Y + r0 * ROW_H - 16;
            const h = (r1 - r0) * ROW_H + NODE_H + 32;
            return (
              <div key={l} aria-hidden="true">
                <div className={`${styles.laneBand} ${BAND_CLASS[l]}`} style={{ top, height: h, width: CANVAS_W }} />
                <div className={`${styles.laneLabel} ${BAND_LABEL_CLASS[l]}`} style={{ top: top + 14, height: h - 28 }}>
                  {labels.lane[l]}
                </div>
              </div>
            );
          })}

          {features.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`${styles.node} ${LANE_CLASS[n.lane]} ${STATUS_CLASS[n.status]} ${nodeStateClass(n)} ${selected === n.id ? styles.nodeSel : ''}`}
              style={{ left: PAD_X + n.col * COL_W, top: PAD_Y + n.row * ROW_H, width: NODE_W, minHeight: NODE_H }}
              aria-pressed={selected === n.id}
              aria-label={`${n.title}, ${n.statusLabel}`}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => { e.stopPropagation(); setSelected(n.id); }}
            >
              <span className={styles.nodeTop}>
                <span className={styles.nodeTitle}>{n.title}</span>
                <span className={`${styles.pill} ${PILL_CLASS[n.status]}`}>{n.statusLabel}</span>
              </span>
              <span className={styles.nodeMeta}>
                {n.cats.map((c) => (
                  <span key={c} className={`${styles.catDot} ${CAT_CLASS[c]}`} />
                ))}
                {n.isNew ? <span className={styles.newDot} title="Recently shipped" /> : null}
                {n.phase ? <span className={styles.nodePhase}>{n.phase}</span> : null}
              </span>
            </button>
          ))}

          {sel ? (
            <div className={styles.detail} role="dialog" aria-label={`${sel.title} detail`}>
              <button
                type="button"
                className={styles.detailClose}
                aria-label="Close detail panel"
                onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              >
                ✕
              </button>
              <div>
                <div className={styles.detailEyebrow} style={{ color: `var(--${sel.lane})` }}>
                  {labels.lane[sel.lane]} lane
                </div>
                <div className={styles.detailTitle}>{sel.title}</div>
                <div className={styles.detailTags}>
                  <span className={styles.dtag}>{sel.statusLabel}</span>
                  {sel.phase ? <span className={styles.dtag}>{sel.phase}</span> : null}
                  {sel.cats.map((c) => (
                    <span key={c} className={styles.dtag}>{labels.cat[c]}</span>
                  ))}
                </div>

                {variant === 'internal' && sel.desc ? (
                  <div className={styles.detailSec}>
                    <div className={styles.detailLab}>What it is</div>
                    <div className={styles.detailTxt}>{sel.desc}</div>
                  </div>
                ) : null}
                {variant === 'public' && sel.publicSummary ? (
                  <div className={styles.detailSec}>
                    <div className={styles.detailLab}>What it is</div>
                    <div className={styles.detailTxt}>{sel.publicSummary}</div>
                  </div>
                ) : null}
                {variant === 'internal' && sel.why ? (
                  <div className={styles.detailSec}>
                    <div className={styles.detailLab}>Why / strategic note</div>
                    <div className={styles.detailTxt}>{sel.why}</div>
                  </div>
                ) : null}

                {variant === 'internal' && sel.scores ? (
                  <div className={styles.detailSec}>
                    <div className={styles.detailLab}>Assessment (1–10)</div>
                    <div className={styles.scores}>
                      {[['c', 'Commercial'], ['d', 'Build'], ['o', 'Ops'], ['s', 'Strategic']].map(([k, label]) => (
                        <div key={k} className={styles.scoreItem}>
                          <div className={`${styles.scoreValue} ${scoreClass(k, sel.scores[k])}`}>{sel.scores[k]}</div>
                          <div className={styles.scoreLabel}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.scoreNote}>
                      Commercial &amp; Strategic: higher is better. Build &amp; Ops: higher is heavier. Carried from Roadmap v1.2.
                    </div>
                  </div>
                ) : null}

                {sel.releases.length > 0 ? (
                  <div className={styles.detailSec}>
                    <div className={styles.detailLab}>Release history</div>
                    <div className={styles.relList}>
                      {sel.releases.map((r) => (
                        <div key={r.id} className={styles.relRow}>
                          <div className={styles.relMeta}>
                            <span className={styles.relDate}>{formatDate(r.date)}</span>
                            {r.version ? <span className={styles.relVersion}>v{r.version}</span> : null}
                            {r.platform.map((p) => (
                              <span key={p} className={styles.platPill}>{PLATFORM_LABEL[p]}</span>
                            ))}
                            <span className={styles.relType}>{r.type}</span>
                          </div>
                          <div className={styles.relTitle}>{r.title}</div>
                          {r.notes ? (
                            <div className={styles.relNotes}>
                              <ReactMarkdown>{r.notes}</ReactMarkdown>
                            </div>
                          ) : null}
                          {r.media.length > 0 ? (
                            <div className={styles.relThumbs}>
                              {r.media.map((m) => (
                                <button
                                  key={m.src}
                                  type="button"
                                  className={styles.relThumb}
                                  style={{ width: 72, height: 46, position: 'relative' }}
                                  aria-label={`View screenshot: ${m.alt}`}
                                  onClick={(e) => { e.stopPropagation(); setLightbox(m); }}
                                >
                                  <Image src={m.src} alt={m.alt} fill sizes="72px" style={{ objectFit: 'cover' }} />
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className={styles.detailSec}>
                  <div className={styles.detailLab}>Depends on</div>
                  {sel.deps.length ? (
                    sel.deps.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={styles.detailLink}
                        onClick={(e) => { e.stopPropagation(); setSelected(d); }}
                      >
                        {byId[d].title}
                      </button>
                    ))
                  ) : (
                    <div className={styles.detailTxt}>— root node</div>
                  )}
                </div>
                <div className={styles.detailSec}>
                  <div className={styles.detailLab}>Unlocks</div>
                  {(unlocks[sel.id] || []).length ? (
                    unlocks[sel.id].map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={styles.detailLink}
                        onClick={(e) => { e.stopPropagation(); setSelected(u); }}
                      >
                        {byId[u].title}
                      </button>
                    ))
                  ) : (
                    <div className={styles.detailTxt}>— leaf / terminal</div>
                  )}
                </div>

                {variant === 'public' ? (
                  <div className={styles.detailSec}>
                    <Link
                      href={`${basePath}/feature/${sel.id}`}
                      className={styles.detailLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Full release history
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {lightbox ? (
        <div className={styles.lightbox} onClick={() => setLightbox(null)} role="dialog" aria-label="Screenshot viewer">
          <figure className={styles.lightboxFigure} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              aria-label="Close screenshot viewer"
              onClick={() => setLightbox(null)}
            >
              ✕ close
            </button>
            <Image
              src={lightbox.src}
              alt={lightbox.alt}
              width={1600}
              height={1000}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh' }}
            />
            {lightbox.caption ? <figcaption className={styles.lightboxCaption}>{lightbox.caption}</figcaption> : null}
          </figure>
        </div>
      ) : null}
    </>
  );
}
