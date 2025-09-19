import Image from "next/image";
import apps from "@/data/apps.json";

export const metadata = { title: "Apps — Arcturus Digital Consultancy" };

export default function AppsIndex() {
  return (
    <main className="py-10">
      <h1 className="text-4xl font-extrabold mb-4">Apps</h1>
      <p className="text-neutral-700 max-w-3xl">
        Policies, platforms, and specifics for each app — kept compliant and privacy-first.
        <br className="hidden sm:block" />
        <span className="sm:ml-1">
          Our portfolio focuses on solving real problems in clear niches, without adding tech for the sake of it.
        </span>
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const href = app.link || `/apps/${app.id}`;
          const strap = app.strap || app.desc || "";
          const summary = app.summary || app.desc || "";

          return (
            <a
              key={app.id}
              href={href}
              className="relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              {/* Optional background */}
              {app.bg && (
                <>
                  <Image
                    src={app.bg}
                    alt=""
                    fill
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    className="absolute inset-0 object-cover opacity-25"
                    priority={false}
                  />
                  {/* soft overlay for text legibility */}
                  <div className="absolute inset-0 pointer-events-none bg-white/60" />
                </>
              )}

              {/* Foreground content */}
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden">
                    {app.icon ? (
                      <img
                        src={app.icon}
                        alt={`${app.name} logo`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-200" />
                    )}
                  </div>
                  <div className="font-semibold text-lg">{app.name}</div>
                </div>

                {/* Strap / tagline */}
                {strap && (
                  <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>
                )}

                {/* Summary */}
                {summary && (
                  <p className="text-sm text-neutral-700">{summary}</p>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
