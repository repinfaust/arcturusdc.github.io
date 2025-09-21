"use client";

import Image from "next/image";

const fire = (...args) => (window.adc?.gtag || window.gtag || function(){})?.(...args);

function AppCard({ app }) {
  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";

  // platforms -> chips (supports apps.platforms OR boolean android/ios)
  const platforms =
    Array.isArray(app.platforms) && app.platforms.length
      ? app.platforms
      : [app.android ? "Android" : null, app.ios ? "iOS" : null].filter(Boolean);

  return (
    <div
      className={[
        "relative rounded-2xl border bg-white p-5",
        "shadow-sm hover:shadow-lg hover:border-black/15 border-black/10",
        "transition overflow-hidden",
      ].join(" ")}
      data-analytics="card"
      data-name={`Apps card: ${app.name}`}
      data-component="AppsGrid"
      data-location="apps-grid"
    >
      {/* Background image */}
      {app.bg && (
        <>
          <Image
            src={app.bg}
            alt=""
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="absolute inset-0 object-cover opacity-40"
            priority={false}
          />
          <div className="absolute inset-0 pointer-events-none bg-white/10" />
        </>
      )}

      <div className="relative">
        {/* Header: logo + name */}
        <div className="flex items-center gap-4 mb-3">
          <a
            href={href}
            className="flex items-center gap-4"
            aria-label={app.name}
            data-analytics="link"
            data-name={`Apps card: ${app.name}`}
            data-component="AppsGrid"
            data-location="apps-grid"
            onClick={() =>
              fire("event", "adc_click", {
                item_id: app.id,
                item_name: app.name,
                component_name: "AppsGrid",
                location: "apps-grid",
              })
            }
          >
            <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 block border border-black/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {app.icon ? (
                <img src={app.icon} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="w-full h-full bg-neutral-200 block" />
              )}
            </span>
            <span className="font-semibold text-lg underline-offset-4 hover:underline">
              {app.name}
            </span>
          </a>
        </div>

        {/* Strap / tagline */}
        {strap && <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>}

        {/* Platform chips (optional) */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <span key={p} className="badge">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AppsClient({ apps }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
