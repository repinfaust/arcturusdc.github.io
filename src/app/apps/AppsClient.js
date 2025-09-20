"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* Measure inner content height for smooth expand */
function useMeasuredMaxHeight(deps = []) {
  const ref = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const set = () => setMaxH(el.scrollHeight);
    set();

    // keep in sync if fonts load / viewport changes
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, maxH };
}

function AppCard({ app }) {
  const [expanded, setExpanded] = useState(false);
  const { ref: expandRef, maxH } = useMeasuredMaxHeight([expanded, app.summary, app.desc]);

  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  const toggle = () => setExpanded((v) => !v);

  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className="group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
      aria-expanded={expanded}
      aria-controls={`summary-${app.id}`}
    >
      {/* Background image (stronger) */}
      {app.bg && (
        <>
          <Image
            src={app.bg}
            alt=""
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="absolute inset-0 object-cover opacity-45 transition-opacity duration-300"
            priority={false}
          />
          <div className="absolute inset-0 pointer-events-none bg-white/10" />
        </>
      )}

      {/* Foreground content */}
      <div className="relative">
        {/* Header: logo + name is the link; clicking it should NOT toggle */}
        <div className="flex items-center gap-4 mb-3">
          <a
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-4"
            aria-label={app.name}
          >
            <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 block">
              {app.icon ? (
                <img
                  src={app.icon}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="w-full h-full bg-neutral-200 block" />
              )}
            </span>
            <span className="font-semibold text-lg underline-offset-4 hover:underline">
              {app.name}
            </span>
          </a>
        </div>

        {/* Strap / tagline (always visible) */}
        {strap && <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>}

        {/* Expandable summary */}
        <div
          id={`summary-${app.id}`}
          className="relative overflow-hidden transition-[max-height] duration-400 ease-out"
          style={{ maxHeight: expanded ? maxH : 0 }}
        >
          <div
            ref={expandRef}
            className={[
              "pt-1",
              "transition-opacity duration-300 ease-out",
              expanded ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {summary && <p className="text-sm text-neutral-700">{summary}</p>}
          </div>
        </div>
      </div>
    </div>
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
