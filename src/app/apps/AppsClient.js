"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";

/* GA helper (no-op if GA missing) */
const fire = (...args) => (window.adc?.gtag || window.gtag || function(){})?.(...args);

/* FLIP to smooth reflow inside CSS columns */
function useFlip(containerRef) {
  const prevRects = useRef(new Map());

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll("[data-flip-item]"));

    const currRects = new Map();
    for (const el of items) currRects.set(el.dataset.key, el.getBoundingClientRect());

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
          el.style.transition = "transform 300ms cubic-bezier(.2,.6,.2,1)";
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

/* measure max height for expand/collapse */
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

function AppCard({ app, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const { ref: expandRef, maxH } = useMeasuredMaxHeight([expanded, app.summary, app.desc]);
  const cardRootRef = useRef(null);
  const viewedRef = useRef(false);

  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  // impression once per card
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

  // platforms -> chips (supports apps.platforms OR booleans)
  const platforms =
    Array.isArray(app.platforms) && app.platforms.length
      ? app.platforms
      : [app.android ? "Android" : null, app.ios ? "iOS" : null].filter(Boolean);

  return (
    <div
      ref={cardRootRef}
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={onKeyDown}
      className="group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-lg hover:border-black/15 border-black/10 transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
      aria-expanded={expanded}
      aria-controls={`summary-${app.id}`}
      data-analytics="card"
      data-name={`Apps card: ${app.name}`}
      data-component="AppsGrid"
      data-location="apps-grid"
    >
      {/* background */}
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
        {/* header (clicking the link shouldn’t toggle) */}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {app.icon ? (
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

        {/* strapline */}
        {strap && <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>}

        {/* optional platform chips */}
        {Array.isArray(app.platforms) && app.platforms.length ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {app.platforms.map((p) => (
              <span key={p} className="badge">{p}</span>
            ))}
          </div>
        ) : null}

        {/* expandable blurb */}
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

/* Masonry via CSS columns: guarantees 3-up on desktop AND independent card heights */
export default function AppsClient({ apps }) {
  const colRef = useRef(null);
  useFlip(colRef);

  const handleToggle = () => {
    /* FLIP runs next paint */
  };

  return (
    <div
      ref={colRef}
      className="
        columns-1
        md:columns-3     /* force three columns at laptop widths */
        2xl:columns-4
        gap-6 [column-fill:_balance]
      "
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
