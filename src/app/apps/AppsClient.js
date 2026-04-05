"use client";

import AppCardProduct from "@/components/AppCardProduct";

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

const PAGE_GUTTER = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default function AppsClient({ apps }) {
  return (
    <div className="space-y-14 sm:space-y-16 lg:space-y-20">
      {SECTIONS.map(({ status, title, intro }) => {
        const list = apps.filter((a) => a.status === status);
        if (!list.length) return null;

        const cols =
          status === "live"
            ? "grid grid-cols-1 items-start gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7"
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
                <AppCardProduct key={app.id} app={app} />
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
