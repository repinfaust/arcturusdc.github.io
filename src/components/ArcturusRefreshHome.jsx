import Image from "next/image";
import Link from "next/link";
import appsData from "@/data/apps.json";

const LIVE_APP_IDS = ["adhd-acclaim", "unload", "toume", "dialled-mtb", "sprocket", "mandrake"];
const DEV_APP_IDS = ["rehabpath", "apex-twin", "assumezero"];
const DISPLAY_OVERRIDES = {
  "apex-twin": { name: "Apex State" },
  assumezero: { name: "Assume Zero" },
  rehabpath: { name: "Rehab Path" },
};

const byId = new Map(appsData.map((app) => [app.id, app]));
const withDisplay = (id, status) => {
  const app = byId.get(id);
  if (!app) return null;
  return {
    ...app,
    ...DISPLAY_OVERRIDES[id],
    status,
  };
};

const liveApps = LIVE_APP_IDS.map((id) => withDisplay(id, "live")).filter(Boolean);
const upcomingApps = DEV_APP_IDS.map((id) => withDisplay(id, "development")).filter(Boolean);

const capabilityRows = [
  {
    k: "01",
    title: "Product systems",
    body: "Focused apps and internal tools shaped around the real constraint, not a generic feature list.",
  },
  {
    k: "02",
    title: "Decision support",
    body: "Interfaces, workflows, and records that make judgment easier when the situation is messy.",
  },
  {
    k: "03",
    title: "Privacy by design",
    body: "Data minimisation, clear consent, readable policies, and auditability considered from the first pass.",
  },
];

const statusLabel = {
  live: "Live",
  comingSoon: "Coming soon",
  development: "In development",
};

function platformLabel(app) {
  if (app.availability?.length) {
    return app.availability
      .map((platform) => (platform === "ios" ? "iOS" : platform.charAt(0).toUpperCase() + platform.slice(1)))
      .join(" / ");
  }

  return app.appStoreUrl ? "iOS" : "Web";
}

function AppLogo({ app, large = false }) {
  const isWideLogo = app.id === "dialled-mtb";
  const size = isWideLogo
    ? large
      ? "h-24 w-48 sm:h-28 sm:w-56"
      : "h-14 w-28"
    : large
      ? "h-24 w-24 sm:h-28 sm:w-28"
      : "h-16 w-16";
  const isSvg = app.icon?.endsWith(".svg");

  if (!app.icon) {
    return (
      <span
        className={`${size} grid place-items-center border border-[#1c1c1a]/30 bg-[#ece6d8] text-2xl font-black text-[#1c1c1a]`}
        aria-hidden="true"
      >
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
        className={`h-full w-full ${isSvg || isWideLogo ? "object-contain p-2" : "object-cover"}`}
      />
    </span>
  );
}

function StatusDot({ live }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${live ? "bg-[#2f9d55]" : "bg-[#f0452f]"}`}
      aria-hidden="true"
    />
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
                  <Image
                    src="/assets/badges/download-on-the-app-store.svg"
                    alt="Download on the App Store"
                    width={120}
                    height={40}
                    className="h-9 w-auto invert"
                  />
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
                  <Image
                    src="/assets/badges/google-play-badge.png"
                    alt="Get it on Google Play"
                    width={135}
                    height={40}
                    className="h-9 w-auto"
                  />
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
              {statusLabel[app.status] || "In development"}
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
      className="group flex min-h-[180px] flex-col justify-between border border-[#1c1c1a] bg-[#ece6d8] p-5 transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
    >
      <div className="flex items-start justify-between gap-4">
        <AppLogo app={app} />
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[#f0452f] group-hover:text-[#ff765f]">
          {statusLabel[app.status] || "In development"}
        </span>
      </div>
      <div>
        <h3 className="text-2xl font-black tracking-tight">{app.name}</h3>
        <p className="mt-2 text-sm leading-6 opacity-70">{app.desc || app.strap}</p>
      </div>
    </Link>
  );
}

export default function ArcturusRefreshHome() {
  return (
    <div className="w-screen -ml-[calc(50vw-50%)] bg-[#ece6d8] text-[#1c1c1a]">
      <section className="relative isolate min-h-[66vh] overflow-hidden border-b-2 border-[#1c1c1a] px-5 py-10 sm:px-8 lg:px-10">
        <Image
          src="/img/arcturus-logo-transparent.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none -z-10 object-contain object-center opacity-[0.13]"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(28,28,26,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(28,28,26,0.07)_1px,transparent_1px)] bg-[size:72px_72px]" />

        <div className="mx-auto flex min-h-[56vh] max-w-7xl flex-col justify-between gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1c1c1a]/50 pb-4 font-mono text-xs uppercase tracking-[0.14em]">
            <span>Arcturus Digital Consulting</span>
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-[1.45fr_0.55fr]">
            <div>
              <p className="mb-5 max-w-xl font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
                /Product, platforms and decision-support systems
              </p>
              <h1 className="max-w-6xl text-[clamp(3.2rem,7vw,6.8rem)] font-black uppercase leading-[0.88] tracking-tight">
                Better decisions in the real world<span className="text-[#f0452f]">.</span>
              </h1>
            </div>

            <div className="border-l-2 border-[#f0452f] pl-5">
              <p className="text-lg leading-8 text-[#1c1c1a]/75">
                I design and build software for places where regulation, operational constraints,
                and imperfect information are part of the job.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/apps"
                  className="border border-[#1c1c1a] bg-[#1c1c1a] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-[#ece6d8] transition-colors hover:bg-[#f0452f]"
                >
                  View work
                </Link>
                <Link
                  href="/capabilities"
                  className="border border-[#1c1c1a] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
                >
                  Capabilities
                </Link>
              </div>
            </div>
          </div>

          <div className="grid border border-[#1c1c1a] bg-[#e3dcc9]/80 sm:grid-cols-2">
            {[
              ["Live apps", String(liveApps.length).padStart(2, "0")],
              ["Catalogue", String(liveApps.length + upcomingApps.length).padStart(2, "0")],
            ].map(([label, value], index) => (
              <div
                key={label}
                className={`p-4 font-mono uppercase tracking-[0.12em] ${index ? "border-t border-[#1c1c1a] sm:border-l sm:border-t-0" : ""}`}
              >
                <div className="text-[0.65rem] text-[#1c1c1a]/50">/{label}</div>
                <div className="mt-2 text-2xl text-[#1c1c1a]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#1c1c1a]">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-[#1c1c1a] bg-[#1c1c1a] p-6 text-[#ece6d8] sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">/Capabilities</p>
            <h2 className="text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl">
              Useful over theatrical<span className="text-[#f0452f]">.</span>
            </h2>
          </div>
          <div className="divide-y divide-[#1c1c1a]">
            {capabilityRows.map((item) => (
              <article key={item.k} className="grid gap-5 p-6 sm:grid-cols-[5rem_1fr] sm:p-8">
                <div className="font-mono text-3xl text-[#f0452f]">{item.k}</div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{item.title}</h3>
                  <p className="mt-2 max-w-2xl text-base leading-7 text-[#1c1c1a]/70">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="apps" className="border-b-2 border-[#1c1c1a]">
        <div className="flex flex-col justify-between gap-5 border-b-2 border-[#1c1c1a] p-6 sm:p-8 lg:flex-row lg:items-end lg:p-10">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
              /Apps · actual product identities
            </p>
            <h2 className="text-6xl font-black leading-[0.85] tracking-tight sm:text-8xl">
              Apps<span className="text-[#f0452f]">.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#1c1c1a]/70">
            Focused products with clear identities, live routes, readable policies, and product pages
            that make the job of each app obvious.
          </p>
        </div>

        {liveApps.map((app, index) => (
          <AppFeature key={app.id} app={app} index={index} />
        ))}
      </section>

      <section className="border-b-2 border-[#1c1c1a] bg-[#e3dcc9] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
              /Platform
            </p>
            <div className="flex items-center gap-5">
              <span className="relative block h-20 w-20 overflow-hidden border border-[#1c1c1a] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img/stea-logo.png" alt="STEa logo" loading="eager" className="h-full w-full object-cover" />
              </span>
              <h2 className="text-6xl font-black tracking-tight sm:text-8xl">
                STEa<span className="text-[#f0452f]">.</span>
              </h2>
            </div>
          </div>
          <div className="border-l-2 border-[#f0452f] pl-5">
            <p className="max-w-2xl text-lg leading-8 text-[#1c1c1a]/75">
              A platform layer for structured operations, product work, and traceable decisions.
              It sits separately from the consumer app catalogue because the job it does is different.
            </p>
            <Link
              href="/apps/stea"
              className="mt-6 inline-flex border border-[#1c1c1a] px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] transition-colors hover:bg-[#1c1c1a] hover:text-[#ece6d8]"
            >
              Platform brief
            </Link>
          </div>
        </div>
      </section>

      {upcomingApps.length ? (
        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[#f0452f]">
                /In progress
              </p>
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Next units.</h2>
            </div>
            <Link
              href="/apps"
              className="font-mono text-xs uppercase tracking-[0.12em] text-[#1c1c1a] underline decoration-[#f0452f] underline-offset-4"
            >
              Browse full catalogue
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingApps.slice(0, 8).map((app) => (
              <AppTile key={app.id} app={app} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
