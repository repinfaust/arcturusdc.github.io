"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

function useInView(options) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setInView(true);
        } else {
          setInView(false); // collapse when leaving view
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.25, ...(options || {}) }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [options]);

  return { ref, inView };
}

function AppCard({ app }) {
  const { ref, inView } = useInView();
  const [pointerOver, setPointerOver] = useState(false);

  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  return (
    <a
      ref={ref}
      href={href}
      className="group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
      onMouseEnter={() => setPointerOver(true)}
      onMouseLeave={() => setPointerOver(false)}
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
          <div className="absolute inset-0 pointer-events-none bg-white/60" />
        </>
      )}

      {/* Foreground content */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
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

        {/* Strap / tagline (always visible) */}
        {strap && (
          <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>
        )}

        {/* Expandable area: opens in-view OR on hover/focus; collapses when out-of-view and not hovered/focused */}
        <div
          className={[
            "relative overflow-hidden transition-[max-height] duration-500 ease-out",
            // collapsed by default
            "max-h-0",
            // interactive overrides
            "group-hover:max-h-64 group-focus-within:max-h-64",
            // in-view expands (and will shrink again when out-of-view due to hook)
            inView ? "max-h-64" : "",
          ].join(" ")}
        >
          <div
            className={[
              "transition-opacity duration-500 ease-out",
              "transition-transform duration-500 ease-out",
              "delay-150",
              "opacity-0 translate-y-1",
              // show when either in view or pointer is over (keeps fade synced with height)
              (inView || pointerOver) ? "opacity-100 translate-y-0" : "",
              "group-hover:opacity-100 group-hover:translate-y-0",
              "group-focus-within:opacity-100 group-focus-within:translate-y-0",
            ].join(" ")}
          >
            {summary && <p className="text-sm text-neutral-700">{summary}</p>}
          </div>
        </div>
      </div>
    </a>
  );
}

export default function AppsClient({ apps }) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
