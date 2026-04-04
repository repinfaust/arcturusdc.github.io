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
      ? "border-neutral-900/12 bg-white shadow-md hover:shadow-lg hover:border-neutral-900/18"
      : tier === "soon"
        ? "border-black/10 bg-white shadow-sm hover:shadow-md"
        : "border-black/[0.06] bg-white/95 shadow-sm hover:shadow-md hover:bg-white";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-200 ease-out ${cardClass} ${
        tier === "live"
          ? "min-h-[280px] sm:min-h-[300px] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          : "min-h-[260px] hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      } ${tier === "dev" ? "ring-1 ring-black/[0.03]" : ""}`}
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
            className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/92 to-white pointer-events-none"
            aria-hidden
          />
        </>
      ) : null}

      <div className="relative flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`relative flex h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white transition-transform duration-200 motion-reduce:group-hover:translate-y-0 group-hover:-translate-y-px ${
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
                  ? "text-lg sm:text-xl text-neutral-900"
                  : tier === "soon"
                    ? "text-base sm:text-lg text-neutral-900"
                    : "text-base sm:text-lg text-neutral-800"
              }`}
            >
              <Link
                href={href}
                className="underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2 rounded-sm"
              >
                {app.name}
              </Link>
            </h3>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wider ${
              tier === "live"
                ? "border-neutral-900/15 bg-neutral-900/[0.04] text-neutral-800"
                : tier === "soon"
                  ? "border-black/10 bg-neutral-50 text-neutral-600"
                  : "border-black/[0.06] bg-neutral-50/80 text-neutral-500"
            }`}
          >
            {label}
          </span>
        </div>

        {strap ? (
          <p
            className={`mt-4 flex-1 text-sm sm:text-[0.9375rem] leading-relaxed ${
              tier === "dev" ? "text-neutral-600" : "text-neutral-700"
            }`}
          >
            {strap}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-5 pt-1">
          <Link
            href={href}
            className={`inline-flex items-center text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 focus-visible:ring-offset-2 rounded-sm ${
              tier === "live"
                ? "text-neutral-900 underline-offset-4 hover:underline"
                : "text-neutral-700 underline-offset-4 hover:underline hover:text-neutral-900"
            }`}
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

        return (
          <section key={status} aria-labelledby={`apps-section-${status}`}>
            <div className="mb-6 sm:mb-8 max-w-2xl">
              <h2
                id={`apps-section-${status}`}
                className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-neutral-600 leading-relaxed">
                {intro}
              </p>
            </div>
            <div className={cols}>
              {list.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
