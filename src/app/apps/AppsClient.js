"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

function useMeasuredMaxHeight(deps = []) {
  const ref = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => setMaxH(el.scrollHeight);
    set();

    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
  }, deps);

  return { ref, maxH };
}

function AppCard({ app }) {
  const [expanded, setExpanded] = useState(false);
  const { ref: expandRef, maxH } = useMeasuredMaxHeight([expanded, app.summary, app.desc]);

  const toggle = () => setExpanded((v) => !v);

  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  return (
    <div
      onClick={toggle}
      role="button"
      tabIndex={0}
      className="relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
      aria-expanded={expanded}
      aria-controls={`summary-${app.id}`}
    >
      {app.bg && (
        <>
          <Image
            src={app.bg}
            alt=""
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="absolute inset-0 object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-white/10 pointer-events-none" />
        </>
      )}

      <div className="relative">
        {/* Logo + name */}
        <div className="flex items-center gap-4 mb-3">
          <a
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-4"
          >
            <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-black/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {app.icon ? (
                <img src={app.icon} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full bg-neutral-200 block" />
              )}
            </span>
            <span className="font-semibold text-lg">{app.name}</span>
          </a>
        </div>

        {strap && <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>}

        {/* Expandable section */}
        <div
          id={`summary-${app.id}`}
          className="relative overflow-hidden transition-[max-height] duration-300 ease-out"
          style={{ maxHeight: expanded ? maxH : 0 }}
        >
          <div
            ref={expandRef}
            className={`pt-1 transition-opacity duration-300 ${
              expanded ? "opacity-100" : "opacity-0"
            }`}
          >
            {summary && <p className="text-sm text-neutral-800">{summary}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppsClient({ apps }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
