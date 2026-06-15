'use client';

/* =============================================================================
   FIGHT OR FLIGHT — Quest Map  (/stea/fof, behind STEA auth)
   A quest map, not a project dashboard. Every element exists to motivate Felix.
   Reward-first, unlock-based. No streaks, no deadlines, no guilt, no timestamps.
   Edit content in ./questConfig.js — that file is the whole write surface.
   ----------------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { game, zones, gallery, canon, reference } from './questConfig';

/* ---------- little decorative sprite (uses Felix's real game art) ---------- */
function Sprite({ src, alt, size = 28, className = '' }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

const ZONE_THEME = {
  cleared: {
    card: 'bg-gradient-to-br from-amber-300 to-orange-400 border-amber-500 text-amber-950 shadow-lg',
    chip: 'bg-amber-950/20 text-amber-950',
    stamp: '★ CLEARED',
  },
  active: {
    card: 'bg-gradient-to-br from-sky-400 to-indigo-500 border-sky-300 text-white shadow-xl ring-4 ring-yellow-300',
    chip: 'bg-white/25 text-white',
    stamp: '▶ WE ARE HERE',
  },
  locked: {
    card: 'bg-slate-200/70 border-slate-300 text-slate-500',
    chip: 'bg-slate-300 text-slate-600',
    stamp: '🔒 LOCKED',
  },
};

export default function FightOrFlightQuestMap() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [openZone, setOpenZone] = useState(null);
  const [showReference, setShowReference] = useState(false);

  /* ---------- auth (same gate as the other STEA pages) ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        const next = encodeURIComponent('/apps/stea/fof');
        router.replace(`/apps/stea?next=${next}`);
      }
    });
    return () => unsub();
  }, [router]);

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-900 text-sky-200">
        Loading the map…
      </main>
    );
  }
  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-900 text-sky-200">
        Taking you to sign in…
      </main>
    );
  }

  const activeZone = zones.find((z) => z.state === 'active') || zones[0];

  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        background:
          'radial-gradient(1200px 600px at 50% -10%, #fde68a 0%, #fb923c 35%, #4f46e5 100%)',
      }}
    >
      {/* thin top bar — the only "app" chrome, kept minimal */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-white/80">
        <Link href="/apps/stea" className="hover:text-white">← STEA</Link>
        <button onClick={() => signOut(auth)} className="hover:text-white">Sign out</button>
      </div>

      {/* ============================ HERO BANNER ============================ */}
      <section className="mx-auto max-w-5xl px-4 pb-6 pt-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/fof/logo.jpg"
          alt="Fight or Flight"
          className="mx-auto w-full max-w-2xl rounded-2xl border-4 border-white/80 shadow-2xl"
        />
        <p className="mt-4 text-lg font-bold text-white drop-shadow">
          {game.tagline}
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-extrabold text-indigo-700 shadow-lg">
          <Sprite src="/fof/sprites/hero_fly1.png" alt="" size={22} />
          WE ARE HERE: {activeZone.name}
        </div>

        {/* play access — Unity has no in-browser play, so we link out */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {game.playableDemo && (
            <Link
              href={game.playableDemo.href}
              className="rounded-xl bg-emerald-500 px-5 py-3 text-base font-extrabold text-white shadow-lg ring-2 ring-white/60 transition hover:bg-emerald-600"
            >
              🎮 {game.playableDemo.label}
            </Link>
          )}
          {game.builds.length > 0
            ? game.builds.map((b) => (
                <a
                  key={b.href}
                  href={b.href}
                  className="rounded-xl bg-white px-5 py-3 text-base font-extrabold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
                >
                  ⬇ {b.label}
                </a>
              ))
            : (
              <span className="rounded-xl bg-white/30 px-4 py-3 text-sm font-bold text-white">
                Unity build links coming soon
              </span>
            )}
        </div>
        {game.playableDemo?.note && (
          <p className="mt-2 text-xs font-semibold text-white/80">{game.playableDemo.note}</p>
        )}
      </section>

      {/* ============================ THE QUEST MAP ========================= */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="mb-4 text-center text-3xl font-black text-white drop-shadow-lg">
          The Quest Map
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((zone) => {
            const theme = ZONE_THEME[zone.state] || ZONE_THEME.locked;
            const isOpen = openZone === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => setOpenZone(isOpen ? null : zone.id)}
                className={`flex flex-col rounded-2xl border-4 p-4 text-left transition ${theme.card} ${
                  zone.state === 'locked' ? 'cursor-default' : 'hover:-translate-y-1'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide opacity-70">
                    Zone {zone.id}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${theme.chip}`}>
                    {theme.stamp}
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-black leading-tight">{zone.name}</h3>
                <p className="text-xs font-bold opacity-70">{zone.themedAs}</p>

                {isOpen && zone.state !== 'locked' && (
                  <div className="mt-3 rounded-xl bg-white/20 p-3 text-sm font-semibold">
                    <p className="opacity-90">🎯 {zone.goal}</p>
                    {zone.learned && (
                      <p className="mt-2 opacity-90">💡 What we learned: {zone.learned}</p>
                    )}
                  </div>
                )}
                {!isOpen && zone.state !== 'locked' && (
                  <p className="mt-3 text-xs font-bold opacity-70">Tap to open →</p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================= FELIX'S GALLERY ========================= */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl bg-white/95 p-6 shadow-2xl sm:p-8">
          <h2 className="text-center text-3xl font-black text-indigo-700">
            Felix&apos;s Gallery
          </h2>
          <p className="mt-1 text-center text-sm font-bold text-slate-500">
            You drew it → here it is in the game.
          </p>

          <div className="mt-6 space-y-6">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 items-center gap-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto_1fr]"
              >
                {/* sketch side */}
                <div className="text-center">
                  {item.sketch ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.sketch} alt={`${item.title} sketch`} className="mx-auto max-h-56 rounded-xl" />
                  ) : (
                    <div className="mx-auto grid h-40 place-items-center rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-400">
                      ✏️ Felix&apos;s drawing
                      <span className="text-xs font-semibold">(scan it in here)</span>
                    </div>
                  )}
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">You drew this</p>
                </div>

                {/* arrow */}
                <div className="text-center text-3xl font-black text-orange-400 sm:px-2">→</div>

                {/* in-game side */}
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.inGame} alt={`${item.title} in game`} className="mx-auto max-h-56 rounded-xl shadow-md" />
                  <p className="mt-2 text-xs font-black uppercase tracking-wide text-emerald-500">In the game</p>
                </div>

                <div className="sm:col-span-3">
                  <p className="text-center text-base font-extrabold text-slate-800">{item.title}</p>
                  {item.note && <p className="text-center text-sm font-semibold text-slate-500">{item.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================== CANON ============================== */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="mb-5 text-center text-3xl font-black text-white drop-shadow-lg">
          Official Game Canon
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Heroes */}
          <div className="rounded-3xl bg-emerald-50 p-6 shadow-xl ring-2 ring-emerald-200">
            <h3 className="flex items-center gap-2 text-xl font-black text-emerald-700">
              <Sprite src="/fof/sprites/hero_idle.png" alt="" size={26} /> Heroes
            </h3>
            <ul className="mt-3 space-y-2">
              {canon.heroes.map((h) => (
                <li key={h.name} className="rounded-xl bg-white p-3">
                  <p className="font-extrabold text-slate-800">{h.name}</p>
                  <p className="text-sm font-semibold text-slate-500">{h.power}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-500">{h.unlock}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Villains */}
          <div className="rounded-3xl bg-rose-50 p-6 shadow-xl ring-2 ring-rose-200">
            <h3 className="flex items-center gap-2 text-xl font-black text-rose-700">
              <Sprite src="/fof/sprites/lightning_bolt.png" alt="" size={22} /> Villains
            </h3>
            <ul className="mt-3 space-y-2">
              {canon.villains.map((v) => (
                <li key={v.name} className="rounded-xl bg-white p-3">
                  <p className="font-extrabold text-slate-800">{v.name}</p>
                  <p className="text-sm font-semibold text-slate-500">{v.power}</p>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-xl bg-rose-900 p-3 text-rose-50">
              <p className="text-xs font-black uppercase tracking-wide text-rose-300">👑 Big Boss</p>
              <p className="font-extrabold">{canon.bigBoss.name}</p>
              <p className="text-sm font-semibold text-rose-200">{canon.bigBoss.detail}</p>
            </div>
          </div>
        </div>

        {/* Invented powers */}
        <div className="mt-5 rounded-3xl bg-amber-50 p-6 shadow-xl ring-2 ring-amber-200">
          <h3 className="flex items-center gap-2 text-xl font-black text-amber-700">
            <Sprite src="/fof/sprites/power_orb.png" alt="" size={24} /> Invented Powers
          </h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {canon.inventedPowers.map((p) => (
              <li key={p.name} className="rounded-xl bg-white p-3">
                <p className="font-extrabold text-slate-800">{p.name}</p>
                <p className="text-sm font-semibold text-slate-500">{p.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================ REFERENCE =========================== */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <button
          onClick={() => setShowReference((s) => !s)}
          className="w-full rounded-2xl bg-white/80 px-5 py-3 text-left text-sm font-extrabold text-slate-600 shadow transition hover:bg-white"
        >
          {showReference ? '▼' : '▶'} Reference — design decisions & build notes (Dad)
        </button>

        {showReference && (
          <div className="mt-3 space-y-4 rounded-2xl bg-white/95 p-6 text-sm shadow-xl">
            <div>
              <h4 className="font-black text-slate-700">Decisions</h4>
              <ul className="mt-1 space-y-1">
                {reference.decisions.map((d) => (
                  <li key={d.label} className="text-slate-600">
                    <span className="font-bold text-slate-800">{d.label}:</span> {d.value}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-700">Asset library</h4>
              <ul className="mt-1 space-y-1">
                {reference.assetLibrary.map((a) => (
                  <li key={a.label} className="text-slate-600">
                    <span className="font-bold text-slate-800">{a.label}:</span>{' '}
                    <code className="rounded bg-slate-100 px-1">{a.value}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-700">Build notes</h4>
              <ul className="mt-1 list-inside list-disc space-y-1 text-slate-600">
                {reference.buildNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs font-bold text-white/70">
          Arcturus Digital Consulting · Junior Creative Assistant: Felix · Lead Designer &amp; Snack Provider: Dad
        </p>
      </section>
    </main>
  );
}
