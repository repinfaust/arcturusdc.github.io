'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import styles from './wc26.module.css';
import {
  buildMatch,
  priceAll,
  devigMultiplicative,
  ev,
  kelly,
  recommend,
  topRecommendation,
  gradeHistory,
  DEFAULTS,
} from './lib/engine';
import seedRatings from './data/ratings.json';
import seedResults from './data/results.json';
import seedFixtures from './data/fixtures.json';

const LS_RATINGS = 'stea:wc26:ratings:v1';
const LS_BETS = 'stea:wc26:bets:v1';
const LS_BASE = 'stea:wc26:baseGoals:v1';
const ARCTURUSDC_TENANT_ID = 'FqhckqMaorJMAQ6B29mP';

const pct = (p) => `${(p * 100).toFixed(1)}%`;
const dec = (o) => (o === Infinity || !isFinite(o) ? '—' : o.toFixed(2));
const signed = (n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;

/* localStorage helpers (SSR-safe — only touched in effects/handlers) */
function loadJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

export default function WC26Client() {
  return (
    <Wc26AccessGate>
      <WC26Experience />
    </Wc26AccessGate>
  );
}

function Wc26AccessGate({ children }) {
  const { availableTenants, loading: tenantLoading, error: tenantError, isSuperAdmin } = useTenant();
  const hasArcturusAccess = isSuperAdmin || availableTenants.some((tenant) => {
    const tenantId = tenant.id || tenant.tenantId;
    const tenantName = typeof tenant.name === 'string' ? tenant.name.trim().toLowerCase() : '';
    return tenantId === ARCTURUSDC_TENANT_ID || tenantName === 'arcturusdc';
  });

  if (tenantLoading) {
    return (
      <div className={styles.shell}>
        <main className={styles.accessPanel}>
          <p className={styles.kicker}>STEa Access</p>
          <h1 className={styles.accessTitle}>Checking workspace access</h1>
          <p>Confirming ArcturusDC workspace membership before opening WC26.</p>
        </main>
      </div>
    );
  }

  if (!hasArcturusAccess) {
    return (
      <div className={styles.shell}>
        <main className={styles.accessPanel}>
          <p className={styles.kicker}>ArcturusDC Workspace Required</p>
          <h1 className={styles.accessTitle}>WC26 xG Value Engine</h1>
          <p>
            This tool is available to members of the ArcturusDC workspace.
            {tenantError ? ` Access lookup returned: ${tenantError}` : ' Switch workspace or ask an admin to add your account.'}
          </p>
          <a className={styles.accessButton} href="/apps/stea?next=/wc26">
            Open STEa workspace
          </a>
        </main>
      </div>
    );
  }

  return children;
}

function WC26Experience() {
  /* --- shared model state --- */
  const [ratings, setRatings] = useState(seedRatings);
  const [baseGoals, setBaseGoals] = useState(DEFAULTS.baseGoals);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRatings(loadJSON(LS_RATINGS, seedRatings));
    setBaseGoals(loadJSON(LS_BASE, DEFAULTS.baseGoals));
    setHydrated(true);
  }, []);

  const opts = useMemo(() => ({ baseGoals }), [baseGoals]);

  return (
    <div className={styles.shell}>
      <div className={styles.inner}>
        <Header />
        <BaseGoalsControl baseGoals={baseGoals} setBaseGoals={(v) => { setBaseGoals(v); saveJSON(LS_BASE, v); }} />
        <Recommendation ratings={ratings} opts={opts} />
        <MatchPricer ratings={ratings} opts={opts} />
        <ValueCalculator ratings={ratings} opts={opts} hydrated={hydrated} />
        <TrackRecord ratings={ratings} opts={opts} />
        <RatingsEditor
          ratings={ratings}
          setRatings={(r) => { setRatings(r); saveJSON(LS_RATINGS, r); }}
          resetRatings={() => { setRatings(seedRatings); saveJSON(LS_RATINGS, seedRatings); }}
        />
        <Footer />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- header */
function Header() {
  return (
    <header className={styles.header}>
      <p className={styles.kicker}>STEa · Modelling</p>
      <h1 className={styles.title}>WC26 xG Value Engine</h1>
      <p className={styles.lede}>
        A deterministic Dixon-Coles / expected-goals pricer for the 2026 World Cup. Every market is
        summed off one scoreline grid, so the prices can never contradict each other.{' '}
        <strong>No LLM ever touches the prediction path</strong> — the maths picks; you bring the
        odds.
      </p>
    </header>
  );
}

/* ----------------------------------------------------------- base goals */
function BaseGoalsControl({ baseGoals, setBaseGoals }) {
  return (
    <section className={`${styles.card} ${styles.baseCard}`}>
      <div>
        <span className={styles.cardLabel}>base goals</span>
        <strong className={styles.baseVal}>{baseGoals.toFixed(2)}</strong>
        <span className={styles.baseHint}>≈ {(baseGoals * 2).toFixed(2)} goals/game</span>
      </div>
      <input
        type="range"
        min="1.15"
        max="1.40"
        step="0.01"
        value={baseGoals}
        onChange={(e) => setBaseGoals(parseFloat(e.target.value))}
        className={styles.slider}
        aria-label="Base goals calibration"
      />
      <p className={styles.note}>
        Default <b>1.25</b> = the historical WC group-stage rate (~2.5 goals/game). Nudge to{' '}
        <b>1.30–1.35</b> for open knockout ties. This is the one calibration knob — extremes are not
        free accuracy.
      </p>
    </section>
  );
}

/* -------------------------------------------------------- recommendation */
function tagClass(flag) {
  if (!flag) return '';
  if (flag.startsWith('LONGSHOT')) return styles.tagLongshot;
  if (flag.startsWith('DANGER')) return styles.tagDanger;
  return styles.tagNeutral;
}

function Recommendation({ ratings, opts }) {
  const top = useMemo(() => topRecommendation(seedFixtures, ratings, opts), [ratings, opts]);
  const ranked = useMemo(() => recommend(seedFixtures, ratings, opts), [ratings, opts]);

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Bet of the day</h2>
      {!top ? (
        <p className={styles.empty}>
          No value bet clears the edge thresholds on the current fixtures. (Edit{' '}
          <code>data/fixtures.json</code> with the odds you can see.)
        </p>
      ) : (
        <div className={styles.hero}>
          <div className={styles.heroLine}>
            <span className={styles.heroMatch}>{top.match}</span>
            <span className={styles.heroSel}>{top.selection}</span>
            <span className={styles.heroOdds}>@ {dec(top.offered)}</span>
          </div>
          <div className={styles.heroStats}>
            <span>Model fair <b>{dec(top.fairOdds)}</b></span>
            <span className={styles.edgePos}>edge {signed(top.edge)}</span>
            <span>stake <b>{top.stakeUnits}u</b> <em>(¼-Kelly, 100u bank)</em></span>
          </div>
          {top.smallMarket && (
            <p className={styles.heroFlag}>Small market — books shade these least.</p>
          )}
          {top.flag && <p className={`${styles.heroFlag} ${tagClass(top.flag)}`}>{top.flag}</p>}
        </div>
      )}

      {ranked.length > 0 && (
        <>
          <h3 className={styles.h3}>Ranked value board</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Match</th><th>Market</th><th>Selection</th>
                  <th className={styles.num}>Offered</th><th className={styles.num}>Fair</th>
                  <th className={styles.num}>Edge</th><th className={styles.num}>Stake</th><th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={i}>
                    <td>{r.match}</td><td className={styles.muted}>{r.group}</td><td>{r.selection}</td>
                    <td className={styles.num}>{dec(r.offered)}</td>
                    <td className={styles.num}>{dec(r.fairOdds)}</td>
                    <td className={`${styles.num} ${styles.edgePos}`}>{signed(r.edge)}</td>
                    <td className={styles.num}>{r.stakeUnits}u</td>
                    <td>{r.flag && <span className={`${styles.tag} ${tagClass(r.flag)}`}>{r.flag}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ match pricer */
const MARKET_ORDER = [
  '1X2', 'Double Chance', 'Totals', 'Team Totals', 'BTTS', 'Asian Handicap', 'Correct Score',
];

function MatchPricer({ ratings, opts }) {
  const teams = useMemo(() => Object.keys(ratings).sort(), [ratings]);
  const [home, setHome] = useState('Brazil');
  const [away, setAway] = useState('Morocco');
  const [hostVenue, setHostVenue] = useState(false);

  const priced = useMemo(() => {
    const h = ratings[home], a = ratings[away];
    if (!h || !a) return null;
    const m = buildMatch(h, a, { ...opts, neutral: !hostVenue, homeAdv: 1.25 });
    return { m, all: priceAll(m) };
  }, [ratings, home, away, hostVenue, opts]);

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Match pricer</h2>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Home</span>
          <select value={home} onChange={(e) => setHome(e.target.value)}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <span className={styles.vs}>v</span>
        <label className={styles.field}>
          <span>Away</span>
          <select value={away} onChange={(e) => setAway(e.target.value)}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={hostVenue} onChange={(e) => setHostVenue(e.target.checked)} />
          <span>Host venue (home adv. ×1.25)</span>
        </label>
      </div>

      {priced && (
        <>
          <p className={styles.xgLine}>
            xG line: <b>{priced.m.lamHome.toFixed(2)}</b> – <b>{priced.m.lamAway.toFixed(2)}</b>{' '}
            <span className={styles.muted}>(expected total {priced.m.expTotal.toFixed(2)})</span>
          </p>
          <div className={styles.marketGrid}>
            {MARKET_ORDER.map((group) => (
              <div key={group} className={styles.marketBlock}>
                <h4 className={styles.h4}>{group}</h4>
                <ul className={styles.priceList}>
                  {Object.entries(priced.all[group]).map(([sel, [p, fairOdds]]) => (
                    <li key={sel}>
                      <span className={styles.sel}>{sel}</span>
                      <span className={styles.muted}>{pct(p)}</span>
                      <span className={styles.fairOdds}>{dec(fairOdds)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------- value calculator */
function ValueCalculator({ ratings, opts, hydrated }) {
  const teams = useMemo(() => Object.keys(ratings).sort(), [ratings]);
  const [home, setHome] = useState('Brazil');
  const [away, setAway] = useState('Morocco');
  const [hostVenue, setHostVenue] = useState(false);
  const [bookOdds, setBookOdds] = useState({}); // selection -> string
  const [bets, setBets] = useState([]);

  useEffect(() => { if (hydrated) setBets(loadJSON(LS_BETS, [])); }, [hydrated]);

  const priced = useMemo(() => {
    const h = ratings[home], a = ratings[away];
    if (!h || !a) return null;
    const m = buildMatch(h, a, { ...opts, neutral: !hostVenue, homeAdv: 1.25 });
    return priceAll(m);
  }, [ratings, home, away, hostVenue, opts]);

  // flat list of {group, sel, p} for the calculator rows
  const rows = useMemo(() => {
    if (!priced) return [];
    const r = [];
    for (const group of MARKET_ORDER) {
      for (const [sel, [p]] of Object.entries(priced[group])) r.push({ group, sel, p });
    }
    return r;
  }, [priced]);

  // 1X2 devig display (the book's no-vig opinion)
  const devig = useMemo(() => {
    const o = ['Home', 'Draw', 'Away'].map((k) => parseFloat(bookOdds[k]));
    if (o.some((v) => !v || v <= 1)) return null;
    const noVig = devigMultiplicative(o);
    const overround = o.reduce((s, v) => s + 1 / v, 0);
    return { noVig, overround };
  }, [bookOdds]);

  function logBet(group, sel, offered, modelP) {
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      match: `${home} v ${away}`,
      market: group,
      selection: sel,
      oddsTaken: offered,
      closingOdds: null,
      stake: +(kelly(modelP, offered) * 100).toFixed(2),
      result: 'pending',
    };
    const next = [entry, ...bets];
    setBets(next); saveJSON(LS_BETS, next);
  }

  function updateBet(id, patch) {
    const next = bets.map((b) => (b.id === id ? { ...b, ...patch } : b));
    setBets(next); saveJSON(LS_BETS, next);
  }
  function removeBet(id) {
    const next = bets.filter((b) => b.id !== id);
    setBets(next); saveJSON(LS_BETS, next);
  }

  const clv = (b) =>
    b.closingOdds && b.oddsTaken ? b.oddsTaken / b.closingOdds - 1 : null;
  const settled = bets.filter((b) => clv(b) !== null);
  const avgClv = settled.length
    ? settled.reduce((s, b) => s + clv(b), 0) / settled.length
    : null;
  const beatClose = settled.length
    ? settled.filter((b) => clv(b) > 0).length / settled.length
    : null;

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Value calculator</h2>
      <p className={styles.note}>
        Price a match, then type the book odds you can see. Green = model thinks it's +EV. Devig
        shows the book&apos;s true (no-vig) opinion next to the model&apos;s.
      </p>

      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Home</span>
          <select value={home} onChange={(e) => { setHome(e.target.value); setBookOdds({}); }}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <span className={styles.vs}>v</span>
        <label className={styles.field}>
          <span>Away</span>
          <select value={away} onChange={(e) => { setAway(e.target.value); setBookOdds({}); }}>
            {teams.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={hostVenue} onChange={(e) => setHostVenue(e.target.checked)} />
          <span>Host venue</span>
        </label>
      </div>

      {devig && (
        <p className={styles.devig}>
          Book overround <b>{(devig.overround * 100).toFixed(1)}%</b> · no-vig 1X2{' '}
          <b>{devig.noVig.map((p) => pct(p)).join(' / ')}</b>
        </p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Market</th><th>Selection</th>
              <th className={styles.num}>Model</th><th className={styles.num}>Fair</th>
              <th>Your odds</th><th className={styles.num}>EV</th>
              <th className={styles.num}>Stake</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ group, sel, p }) => {
              const offered = parseFloat(bookOdds[sel]);
              const valid = offered && offered > 1;
              const e = valid ? ev(p, offered) : null;
              const stake = valid ? +(kelly(p, offered) * 100).toFixed(2) : null;
              return (
                <tr key={`${group}-${sel}`}>
                  <td className={styles.muted}>{group}</td>
                  <td>{sel}</td>
                  <td className={styles.num}>{pct(p)}</td>
                  <td className={styles.num}>{dec(1 / p)}</td>
                  <td>
                    <input
                      className={styles.oddsInput}
                      type="number" step="0.01" min="1.01" placeholder="—"
                      value={bookOdds[sel] ?? ''}
                      onChange={(ev2) => setBookOdds({ ...bookOdds, [sel]: ev2.target.value })}
                    />
                  </td>
                  <td className={`${styles.num} ${valid ? (e > 0 ? styles.edgePos : styles.edgeNeg) : ''}`}>
                    {valid ? signed(e) : '—'}
                  </td>
                  <td className={styles.num}>{valid && stake > 0 ? `${stake}u` : '—'}</td>
                  <td>
                    {valid && e > 0 && (
                      <button className={styles.logBtn} onClick={() => logBet(group, sel, offered, p)}>
                        Log
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* user bet log — the real scorecard */}
      <h3 className={styles.h3}>Your bet log <span className={styles.muted}>· CLV is the real scorecard</span></h3>
      {settled.length > 0 && (
        <div className={styles.clvTiles}>
          <div className={styles.tile}>
            <span className={styles.tileNum} style={{ color: avgClv >= 0 ? 'var(--wc-pos)' : 'var(--wc-neg)' }}>
              {signed(avgClv)}
            </span>
            <span className={styles.tileLabel}>avg CLV</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileNum}>{(beatClose * 100).toFixed(0)}%</span>
            <span className={styles.tileLabel}>beat the close</span>
          </div>
          <div className={styles.tile}>
            <span className={styles.tileNum}>{settled.length}/{bets.length}</span>
            <span className={styles.tileLabel}>settled / logged</span>
          </div>
        </div>
      )}
      {bets.length === 0 ? (
        <p className={styles.empty}>No bets logged yet. Click <b>Log</b> on a +EV row above, then add the closing odds later.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th><th>Match</th><th>Selection</th>
                <th className={styles.num}>Taken</th><th>Closing</th>
                <th className={styles.num}>CLV</th><th>Result</th><th></th>
              </tr>
            </thead>
            <tbody>
              {bets.map((b) => {
                const c = clv(b);
                return (
                  <tr key={b.id}>
                    <td className={styles.muted}>{b.date}</td>
                    <td>{b.match}</td>
                    <td>{b.selection}</td>
                    <td className={styles.num}>{dec(b.oddsTaken)}</td>
                    <td>
                      <input
                        className={styles.oddsInput} type="number" step="0.01" min="1.01" placeholder="—"
                        value={b.closingOdds ?? ''}
                        onChange={(e) => updateBet(b.id, { closingOdds: parseFloat(e.target.value) || null })}
                      />
                    </td>
                    <td className={`${styles.num} ${c == null ? '' : c >= 0 ? styles.edgePos : styles.edgeNeg}`}>
                      {c == null ? '—' : signed(c)}
                    </td>
                    <td>
                      <select value={b.result} onChange={(e) => updateBet(b.id, { result: e.target.value })}>
                        <option value="pending">pending</option>
                        <option value="won">won</option>
                        <option value="lost">lost</option>
                        <option value="void">void</option>
                      </select>
                    </td>
                    <td><button className={styles.delBtn} onClick={() => removeBet(b.id)}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.note}>
        Over ~48 games, win/loss is noise. If your average CLV is positive you have an edge — even on
        a losing run. If it isn&apos;t, no hot streak is real.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ track record */
function TrackRecord({ ratings, opts }) {
  const graded = useMemo(() => gradeHistory(seedResults, ratings, opts), [ratings, opts]);
  const s = graded.summary;

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Model track record</h2>
      <p className={styles.note}>
        Blind model prediction vs actual result on completed games. This is <b>prediction quality,
        not profit</b> — a 55% favourite hit rate is roughly what the market itself produces.
      </p>
      <div className={styles.clvTiles}>
        <Tile num={pct(s.acc1x2)} label="1X2 strike rate" />
        <Tile num={s.brier1x2.toFixed(3)} label="Brier (uniform = 0.667)" />
        <Tile num={pct(s.accOU)} label="O/U strike rate" />
        <Tile num={String(s.games)} label="games graded" />
      </div>

      <div className={styles.callout}>
        The model&apos;s wrong calls cluster on <b>draws</b> (group stage is draw-heavy). Equal-rated
        sides (e.g. Canada/Qatar) make a symmetric match where the 1X2 pick is an arbitrary tie-break
        — don&apos;t over-read the exact %. <b>Brier and O/U are the more stable metrics.</b> Note the
        seed-rating gap: Canada is a host and won 6-0 yet is rated equal to Qatar — bump improving
        teams in the editor below, or use the host-venue toggle.
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Match</th><th>Model pick</th><th className={styles.num}>Conf.</th>
              <th>Actual</th><th className={styles.num}>1X2</th><th className={styles.num}>O/U</th>
            </tr>
          </thead>
          <tbody>
            {graded.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.match}</td>
                <td>{r.pick}</td>
                <td className={styles.num}>{pct(r.pickProb)}</td>
                <td className={styles.muted}>{r.actual}</td>
                <td className={`${styles.num} ${r.correct ? styles.edgePos : styles.edgeNeg}`}>{r.correct ? '✓' : '✗'}</td>
                <td className={`${styles.num} ${r.ouCorrect ? styles.edgePos : styles.edgeNeg}`}>{r.ouCorrect ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Tile({ num, label }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileNum}>{num}</span>
      <span className={styles.tileLabel}>{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------ ratings editor */
function RatingsEditor({ ratings, setRatings, resetRatings }) {
  const teams = useMemo(() => Object.keys(ratings).sort(), [ratings]);

  function edit(team, key, value) {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return;
    setRatings({ ...ratings, [team]: { ...ratings[team], [key]: n } });
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(ratings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ratings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.h2}>Team ratings <span className={styles.muted}>· the one input that matters</span></h2>
      <p className={styles.note}>
        These are <b>coarse seed priors</b> (tier-based, not measured). The single highest-leverage
        thing you can do is replace them with rolling xG from FBref / Understat / FotMob — recent
        xG-for and xG-against per game, normalised so 1.00 = tournament average. Edits persist in this
        browser; export to commit improved ratings back to the repo.
      </p>
      <div className={styles.editorActions}>
        <button className={styles.ghostBtn} onClick={resetRatings}>Reset to defaults</button>
        <button className={styles.ghostBtn} onClick={exportJSON}>Export JSON</button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Team</th><th>Tier</th><th className={styles.num}>Attack (atk)</th><th className={styles.num}>Defence (dfn)</th></tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t}>
                <td>{t}</td>
                <td className={styles.muted}>{ratings[t].tier ?? '—'}</td>
                <td className={styles.num}>
                  <input className={styles.ratingInput} type="number" step="0.01" min="0.1"
                    value={ratings[t].atk} onChange={(e) => edit(t, 'atk', e.target.value)} />
                </td>
                <td className={styles.num}>
                  <input className={styles.ratingInput} type="number" step="0.01" min="0.1"
                    value={ratings[t].dfn} onChange={(e) => edit(t, 'dfn', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ footer */
function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        <b>Responsible gambling.</b> This is a Poisson grid with opinions — <b>not financial
        advice</b>. Stake only what you&apos;d happily lose; size with the built-in ¼-Kelly. 18+.
        GamCare: <a href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer">gamcare.org.uk</a>{' '}
        · GambleAware: <a href="https://www.gambleaware.org" target="_blank" rel="noreferrer">gambleaware.org</a>.
      </p>
      <p className={styles.muted}>
        Reality check: 64 games, most still to come. Even a genuine 4% edge can&apos;t prove itself
        before the final — variance dominates a sample this small. A modelling challenge, not income.
        No LLM in the prediction path; all numbers come from the verified Dixon-Coles engine.
      </p>
    </footer>
  );
}
