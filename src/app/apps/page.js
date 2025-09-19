"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import apps from "@/data/apps.json";

export const metadata = { title: "Apps — Arcturus Digital Consultancy" };

// Intersection observer hook (no TS syntax)
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

        {/* Expandable area: triggered by in-view OR hover/focus */}
        <div
          className={[
            "relative overflow-hidden transition-[max-height] duration-500 ease-out",
            "max-h-0",
            "group-hover:max-h-64 group-focus-within:max-h-64",
            inView ? "max-h-64" : "",
          ].join(" ")}
        >
          <div
            className={[
              "transition-opacity duration-500 ease-out",
              "transition-transform duration-500 ease-out",
              "delay-150",
              "opacity-0 translate-y-1",
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
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </main>
  );
}
