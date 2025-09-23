"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

/* measure inner content for a smooth max-height animation */
function useMeasuredMaxHeight(deps = []) {
  const ref = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setMaxH(el.scrollHeight);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
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

  const toggle = () => setExpanded(v => !v);

  return (
    <div className="mb-6 break-inside-avoid">
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), toggle())}
        className="relative rounded-2xl border border-black/10 bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 min-h-[200px]" // 👈 equal height in resting state
        aria-expanded={expanded}
        aria-controls={`summary-${app.id}`}
      >
        {/* Background image */}
        {app.bg && (
          <>
            <Image
              src={app.bg}
              alt=""
              fill
              sizes="(min-width:1280px) 25vw, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              className="absolute inset-0 object-cover opacity-40"
              priority={false}
            />
            <div className="absolute inset-0 bg-white/10 pointer-events-none" />
          </>
        )}

        <div className="relative">
          {/* Header: logo + name link (doesn't toggle) */}
          <div className="flex items-center gap-4 mb-3">
            <a
              href={href}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-4"
              aria-label={app.name}
            >
              <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-black/10 bg-white">
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

          {/* Strapline */}
          {strap && <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>}

          {/* Expandable summary (only this card grows) */}
          <div
            id={`summary-${app.id}`}
            className="relative overflow-hidden transition-[max-height] duration-300 ease-out"
            style={{ maxHeight: expanded ? maxH : 0 }}
          >
            <div
              ref={expandRef}
              className={`pt-1 transition-opacity duration-300 ${expanded ? "opacity-100" : "opacity-0"}`}
            >
              {summary && <p className="text-sm text-neutral-800">{summary}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Masonry via CSS columns — CENTERED at all widths */
export default function AppsClient({ apps }) {
  return (
    <div className="mx-auto w-full max-w-5xl columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance]">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
