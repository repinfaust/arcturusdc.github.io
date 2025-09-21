"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

/* ---------------------------------------
   GA helper (safe no-op if GA not ready)
--------------------------------------- */
const fire = (...args) => (window.adc?.gtag || window.gtag || function(){})?.(...args);

/* ---------------------------------------
   FLIP: smoothly animate column reflow
--------------------------------------- */
function useFlip(containerRef) {
  const prevRects = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(container.querySelectorAll("[data-flip-item]"));

    // collect current rects
    const currRects = new Map();
    for (const el of items) currRects.set(el.dataset.key, el.getBoundingClientRect());

    // animate from previous -> current
    for (const el of items) {
      const key = el.dataset.key;
      const prev = prevRects.current.get(key);
      const curr = currRects.get(key);
      if (!prev || !curr) continue;

      const dx = prev.left - curr.left;
      const dy = prev.top - curr.top;
      if (dx || dy) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.willChange = "transform";

        requestAnimationFrame(() => {
          el.style.transition = "transform 320ms cubic-bezier(.2,.6,.2,1)";
          el.style.transform = "translate(0,0)";
          const clear = () => {
            el.style.transition = "";
            el.style.transform = "";
            el.style.willChange = "";
            el.removeEventListener("transitionend", clear);
          };
          el.addEventListener("transitionend", clear);
        });
      }
    }

    prevRects.current = currRects;
  });
}

/* ---------------------------------------
   Measure inner content height (expand)
--------------------------------------- */
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
    window.addEventListener("resize", set, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, maxH };
}

/* ---------------------------------------
   App card
--------------------------------------- */
function AppCard({ app, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const { ref: expandRef, maxH } = useMeasuredMaxHeight([expanded, app.summary, app.desc]);
  const cardRootRef = useRef(null);
  const viewedRef = useRef(false);

  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  // Impression: fire once when card is ≥60% visible
  useEffect(() => {
    const el = cardRootRef.current;
    if (!el || viewedRef.current) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!viewedRef.current && entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            viewedRef.current = true;
            fire("event", "adc_card_view", {
              item_id: app.id,
              item_name: app.name,
              component_name: "AppsGrid",
              location: "apps-grid",
            });
            io.disconnect();
          }
        }
      },
      { threshold: [0.6] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [app.id, app.name]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    fire("event", "adc_card_toggle", {
      item_id: app.id,
      item_name: app.name,
      expanded: String(next),
      component_name: "AppsGrid",
      location: "apps-grid",
    });
    onToggle?.();
  };

  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  // Platforms -> chips (supports apps.platforms OR boolean android/ios)
  const platforms =
    Array.isArray(app.platforms) && app.platforms.length
      ? app.platforms
      : [
          app.android ? "Android" : null,
          app.ios ? "iOS" : null,
        ].filter(Boolean);

  return (
    <div
      ref={cardRootRef}
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className={[
        "group relative rounded-2xl border bg-white p-5",
        "shadow-sm hover:shadow-lg transition",
        "hover:border-black/15 border-black/10",
        "overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800",
      ].join(" ")}
      aria-expanded={expanded}
      aria-controls={`summary-${app.id}`}
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
            className="absolute inset-0 object-cover opacity-40 transition-opacity duration-300"
            priority={false}
          />
          <div className="absolute inset-0 pointer-events-none bg-white/10" />
        </>
      )}

      <div className="relative">
        {/* Header: logo + name is the link; clicking it should NOT toggle */}
        <div className="flex items-center gap-4 mb-3">
          <a
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-4"
            aria-label={app.name}
            data-analytics="link"
            data-name={`Apps card: ${app.name}`}
            data-component="AppsGrid"
            data-location="apps-grid"
          >
            <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 block border border-black/10 bg-white">
              {app.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={app.icon} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <span className="w-full h-full bg-neutral-200 block" />
              )}
            </span>
            <span className="font-semibold text-lg underline-offset-4 group-hover:underline">
              {app.name}
            </span>
          </a>
        </div>

        {/* Strap / tagline (always visible) */}
        {strap && <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>}

        {/* Platform chips (optional) */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {platforms.map((p) => (
              <span key={p} className="badge">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Expandable summary */}
        <div
          id={`summary-${app.id}`}
          className="relative overflow-hidden transition-[max-height] duration-300 ease-out"
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
            {summary && <p className="text-sm text-neutral-800">{summary}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------
   Client: masonry (CSS columns) + FLIP
--------------------------------------- */
export default function AppsClient({ apps }) {
  const colRef = useRef(null);
  useFlip(colRef); // animate reflow when a card expands

  const handleToggle = () => {
    // Trigger reflow; FLIP runs in layout effect on next paint
  };

  return (
    <div
      ref={colRef}
      className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]"
    >
      {apps.map((app) => (
        <div
          key={app.id}
          data-flip-item
          data-key={app.id}
          className="mb-6 break-inside-avoid will-change-transform"
        >
          <AppCard app={app} onToggle={handleToggle} />
        </div>
      ))}
    </div>
  );
}
