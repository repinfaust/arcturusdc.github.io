"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import apps from "@/data/apps.json";

export const metadata = { title: "Apps — Arcturus Digital Consultancy" };

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) setInView(true);
        // If you want it to collapse when leaving view, comment the next line and add an else to set false.
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.25, ...(options || {}) }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [options]);

  return { ref, inView };
}

type AppItem = {
  id: string;
  name: string;
  strap?: string;
  summary?: string;
  desc?: string;
  link?: string;
  icon?: string;
  bg?: string;
};

function AppCard({ app }: { app: AppItem }) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  // We’ll reveal the long text on: inView OR hover OR focus-within.
  // Hover/focus handled with group classes; inView handled by data attribute.
  const [isPointerOver, setIsPointerOver] = useState(false);

  return (
    <a
      ref={ref}
      key={app.id}
      href={href}
      data-inview={inView ? "true" : "false"}
      className="group relative rounded-2xl border bg-white p-5 shadow-sm transition
                 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800
                 overflow-hidden"
      onMouseEnter={() => setIsPointerOver(true)}
      onMouseLeave={() => setIsPointerOver(false)}
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
              // Using <img> here is fine for static assets; change to <Image> if you prefer optimisation.
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

        {/* Expandable container */}
        <div
          // We drive expansion three ways:
          // 1) data-inview=true (from IntersectionObserver)
          // 2) .group:hover (pointer hover)
          // 3) .group:focus-within (keyboard)
          className={`
            relative transition-[max-height] duration-500 ease-out
            overflow-hidden
            max-h-0
            group-hover:max-h-64 group-focus-within:max-h-64
            data-[inview=true]:max-h-64
          `}
        >
          {/* Fade-in content with slight delay for polish */}
          <div
            className={`
              opacity-0 translate-y-1
              transition-opacity duration-500 ease-out
              transition-transform duration-500 ease-out
              delay-150
              group-hover:opacity-100 group-hover:translate-y-0
              group-focus-within:opacity-100 group-focus-within:translate-y-0
              ${inView || isPointerOver ? "opacity-100 translate-y-0" : ""}
            `}
          >
            {/* Summary / description */}
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
        {(apps as AppItem[]).map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </main>
  );
}
