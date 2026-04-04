"use client";

import Image from "next/image";
import Link from "next/link";

const SECTIONS = [
  { status: "live", title: "Live now", intro: "Available to use today." },
  {
    status: "comingSoon",
    title: "Coming soon",
    intro: "In active development — follow along for updates.",
  },
  {
    status: "development",
    title: "In development",
    intro: "Earlier-stage concepts and products still taking shape.",
  },
];

const STATUS_LABEL = {
  live: "Live",
  comingSoon: "Coming soon",
  development: "In development",
};

const PAGE_GUTTER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

function defaultCta(status) {
  switch (status) {
    case "live":
      return "View app";
    case "comingSoon":
      return "Learn more";
    case "development":
      return "Explore concept";
    default:
      return "View details";
  }
}

function AppCard({ app }) {
  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const status = app.status || "development";
  const label = STATUS_LABEL[status] || STATUS_LABEL.development;
  const cta = app.ctaLabel || defaultCta(status);

  const tier =
    status === "live"
      ? "live"
      : status === "comingSoon"
        ? "soon"
        : "dev";

  const cardClass =
    tier === "live"
      ? "border border-black/[0.04] bg-white shadow-apps-card-live hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] hover:border-black/[0.07]"
      : "border border-black/[0.04] bg-white shadow-apps-card hover:shadow-[0_10px_28px_rgba(0,0,0,0.055)] hover:border-black/[0.06]";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out ${cardClass} ${
        tier === "live"
          ? "min-h-[280px] sm:min-h-[300px] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : "min-h-[260px] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      }`}
    >
      {app.bg ? (
        <>
          <Image
            src={app.bg}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`absolute inset-0 object-cover pointer-events-none transition-opacity duration-200 ${
              tier === "live" ? "opacity-[0.14]" : "opacity-[0.1]"
            } group-hover:opacity-[0.18]`}
            priority={false}
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/[0.92] via-white/[0.96] to-white pointer-events-none"
            aria-hidden
          />
        </>
      ) : null}

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-white transition-[transform,box-shadow] duration-200 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:shadow-sm group-hover:-translate-y-px group-hover:shadow-[0_0_0_3px_rgba(240,69,47,0.12)] ${
                tier === "live" ? "shadow-sm" : ""
              }`}
            >
              {app.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.icon}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="block h-full w-full bg-neutral-100" />
              )}
            </span>
            <h3
              className={`min-w-0 font-semibold leading-snug ${
                tier === "live"
                  ? "text-lg sm:text-xl text-[#1a1a1a]"
                  : tier === "soon"
                    ? "text-base sm:text-lg text-[#1a1a1a]"
                    : "text-base sm:text-lg text-[#1a1a1a]"
              }`}
            >
              <Link
                href={href}
                className="underline-offset-4 hover:underline hover:text-brand decoration-brand/0 hover:decoration-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 rounded-sm"
              >
                {app.name}
              </Link>
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider ${
              tier === "live"
                ? "border-black/[0.08] bg-white/80 text-[#555]"
                : tier === "soon"
                  ? "border-black/[0.06] bg-white/90 text-[#555]"
                  : "border-black/[0.05] bg-white/80 text-[#666]"
            }`}
          >
            {label}
          </span>
        </div>

        {strap ? (
          <p className="mt-4 flex-1 text-sm sm:text-[0.9375rem] leading-relaxed text-[#555]">
            {strap}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-5 pt-1 border-t border-black/[0.04]">
          <Link
            href={href}
            className="inline-flex items-center text-sm font-medium text-[#1a1a1a] underline-offset-4 decoration-brand/70 hover:underline hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 rounded-sm"
          >
            {cta}
            <span className="ml-1 transition-transform duration-200 motion-reduce:group-hover:translate-x-0 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function AppsClient({ apps }) {
  return (
    <div className="space-y-14 sm:space-y-16 lg:space-y-20">
      {SECTIONS.map(({ status, title, intro }) => {
        const list = apps.filter((a) => a.status === status);
        if (!list.length) return null;

        const cols =
          status === "live"
            ? "grid grid-cols-1 gap-6 sm:gap-7 sm:grid-cols-2 lg:grid-cols-3"
            : status === "comingSoon"
              ? "grid grid-cols-1 gap-6 sm:gap-7 sm:grid-cols-2"
              : "grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3";

        const body = (
          <>
            <div className="mb-6 sm:mb-8 max-w-2xl">
              <h2
                id={`apps-section-${status}`}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#555] leading-relaxed">
                {intro}
              </p>
            </div>
            <div className={cols}>
              {list.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </>
        );

        if (status === "live") {
          return (
            <section
              key={status}
              aria-labelledby={`apps-section-${status}`}
              className="relative left-1/2 w-screen -translate-x-1/2 bg-apps-live-band py-14 sm:py-16 lg:py-20"
            >
              <div className={PAGE_GUTTER}>{body}</div>
            </section>
          );
        }

        return (
          <section
            key={status}
            aria-labelledby={`apps-section-${status}`}
            className={PAGE_GUTTER}
          >
            {body}
          </section>
        );
      })}
    </div>
  );
}
