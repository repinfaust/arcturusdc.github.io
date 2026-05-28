"use client";

import Image from "next/image";
import Link from "next/link";

const LIVE_IDS = ["adhd-acclaim", "unload", "toume", "dialled-mtb", "sprocket", "mandrake"];
const DEV_IDS  = ["rehabpath", "apex-state", "assumezero"];

const STATUS_LABEL = { live: "Live", comingSoon: "Coming soon", development: "In development" };

function platformLabel(app) {
  if (app.availability?.length) {
    return app.availability
      .map((p) => (p === "ios" ? "iOS" : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(" / ");
  }
  return app.appStoreUrl ? "iOS" : "Web";
}

function StatusDot({ live }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${live ? "bg-[#2f9d55]" : "bg-[#f0452f]"}`}
      aria-hidden="true"
    />
  );
}

function AppLogo({ app, large = false }) {
  const isWide = app.id === "dialled-mtb";
  const isSvg  = app.icon?.endsWith(".svg");
  const size   = isWide
    ? large ? "h-24 w-48 sm:h-28 sm:w-56" : "h-14 w-28"
    : large ? "h-24 w-24 sm:h-28 sm:w-28" : "h-16 w-16";

  if (!app.icon) {
    return (
      <span className={`${size} grid place-items-center border border-[#1c1c1a]/30 bg-[#ece6d8] text-2xl font-black text-[#1c1c1a]`}>
        {app.name.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className={`${size} relative block overflow-hidden border border-[#1c1c1a]/15 bg-white`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={app.icon}
        alt={`${app.name} logo`}
        loading="eager"
        className={`h-full w-full ${isSvg || isWide ? "object-contain p-2" : "object-cover"}`}
      />
    </span>
  );
}

function AppFeature({ app, index }) {
  const hasStoreLinks = Boolean(app.appStoreUrl || app.googlePlayUrl);
  return (
    <article className="grid border-b border-[#1c1c1a] bg-[#ece6d8] lg:grid-cols-[0.72fr_1.28fr_0.75fr]">
      <Link
        href={app.link || `/apps/${app.id}`}
        className="group relative min-h-[240px] overflow-hidden border-b border-[#1c1c1a] bg-[#1c1c1a] lg:border-b-0 lg:border-r"
        aria-label={`Open ${app.name}`}
      >
        {app.bg ? (
          <Image
            src={app.bg}
            alt=""
            fill
            sizes="(min-width: 1024px) 28vw, 100vw"
            className="object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(28,28,26,0.15),rgba(28,28,26,0.58))]" />
        <div className="absolute inset-0 grid place-items-center p-8">
          <AppLogo app={app} large />
        </div>
        <div className="absolute left-4 top-4 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/85">
          /SN {String(index + 1).padStart(3, "0")}
        </div>
      </Link>

      <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
            /Consumer app
          </p>
          <h3 className="max-w-3xl text-5xl font-black leading-[0.9] tracking-tight text-[#1c1c1a] sm:text-6xl">
            {app.name}<span className="text-[#f0452f]">.</span>
          </h3>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#1c1c1a]/70 sm:text-lg">
            {app.strap || app.summary || app.desc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {hasStoreLinks ? (
            <div className="flex flex-wrap items-center gap-3">
              {app.appStoreUrl ? (
                <Link
                  href={app.appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex border border-[#1c1c1a] bg-[#1c1c1a] px-3 py-2 text-white transition-colors hover:bg-[#f0452f]"
                  aria-label={`Download ${app.name} on the App Store`}
                >
                  <Image src="/assets/badges/download-on-the-app-store.svg" alt="Download on the App Store" width={120} height={40} className="h-9 w-auto invert" />
                </Link>
              ) : null}
              {app.googlePlayUrl ? (
                <Link
                  href={app.googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex border border-[#1c1c1a] bg-[#1c1c1a] px-3 py-2 transition-colors hover:bg-[#f0452f]"
                  aria-label={`Get ${app.name} on Google Play`}
                >
                  <Image src="/assets/badges/google-play-badge.png" alt="Get it on Google Play" width={135} height={40} className="h-9 w-auto" />
                </Link>
              ) : null}
            </div>
          ) : null}
          <Link
            href={app.link || `/apps/${app.id}`}
            className="inline-flex border border-[#1c1c1a] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[#1c1c1a] transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
          >
            Case file
          </Link>
        </div>
      </div>

      <aside className="border-t border-[#1c1c1a]/50 bg-[#e3dcc9] p-6 font-mono text-xs uppercase tracking-[0.12em] text-[#1c1c1a] lg:border-l lg:border-t-0">
        <div className="mb-5 text-[#f0452f]">/Spec</div>
        <dl className="space-y-3">
          <div className="flex justify-between gap-4 border-b border-dashed border-[#1c1c1a]/25 pb-3">
            <dt className="text-[#1c1c1a]/45">Status</dt>
            <dd className="flex items-center gap-2 text-right">
              <StatusDot live={app.status === "live"} />
              {STATUS_LABEL[app.status] || "In development"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-dashed border-[#1c1c1a]/25 pb-3">
            <dt className="text-[#1c1c1a]/45">Platform</dt>
            <dd className="text-right">{platformLabel(app)}</dd>
          </div>
        </dl>
      </aside>
    </article>
  );
}

function AppTile({ app }) {
  return (
    <Link
      href={app.link || `/apps/${app.id}`}
      className="group flex min-h-[200px] flex-col justify-between border border-[#1c1c1a] bg-[#ece6d8] p-5 transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
    >
      <div className="flex items-start justify-between gap-4">
        <AppLogo app={app} />
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[#f0452f] group-hover:text-[#ff8060]">
          {STATUS_LABEL[app.status] || "In development"}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-black tracking-tight">{app.name}</h3>
        <p className="mt-2 text-sm leading-6 opacity-70">{app.desc || app.strap}</p>
      </div>
    </Link>
  );
}

export default function AppsClient({ apps }) {
  const byId = new Map(apps.map((a) => [a.id, a]));
  const liveApps = LIVE_IDS.map((id) => byId.get(id)).filter(Boolean);
  const devApps  = DEV_IDS.map((id) => byId.get(id)).filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b-2 border-[#1c1c1a] px-6 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(28,28,26,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(28,28,26,0.07)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
                /Apps · actual product identities
              </p>
              <h1 className="text-[clamp(4rem,10vw,8rem)] font-black leading-[0.88] tracking-tight">
                Apps<span className="text-[#f0452f]">.</span>
              </h1>
            </div>
            <p className="max-w-lg text-base leading-7 text-[#1c1c1a]/70 lg:text-lg lg:pb-2">
              Focused products with clear identities, live routes, readable policies, and
              product pages that make the job of each app obvious.
            </p>
          </div>

          <div className="mt-10 grid border border-[#1c1c1a] bg-[#e3dcc9]/80 sm:grid-cols-3">
            {[
              ["Live", String(liveApps.length).padStart(2, "0")],
              ["In development", String(devApps.length).padStart(2, "0")],
              ["Total", String(liveApps.length + devApps.length).padStart(2, "0")],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={`p-4 font-mono uppercase tracking-[0.12em] ${i ? "border-t border-[#1c1c1a] sm:border-l sm:border-t-0" : ""}`}
              >
                <div className="text-[0.65rem] text-[#1c1c1a]/50">/{label}</div>
                <div className="mt-2 text-2xl text-[#1c1c1a]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live apps */}
      <section className="border-b-2 border-[#1c1c1a]">
        <div className="flex flex-col justify-between gap-4 border-b border-[#1c1c1a] px-6 py-6 sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">/Available now</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Live apps<span className="text-[#f0452f]">.</span></h2>
          </div>
          <p className="text-sm text-[#1c1c1a]/60 sm:text-right sm:max-w-xs">Available on the App Store and Google Play today.</p>
        </div>
        {liveApps.map((app, i) => (
          <AppFeature key={app.id} app={app} index={i} />
        ))}
      </section>

      {/* Development apps */}
      {devApps.length ? (
        <section className="px-6 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">/In progress</p>
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Next units<span className="text-[#f0452f]">.</span></h2>
              </div>
              <p className="text-sm text-[#1c1c1a]/60 sm:max-w-xs sm:text-right">
                Earlier-stage concepts and products still taking shape.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {devApps.map((app) => (
                <AppTile key={app.id} app={app} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
