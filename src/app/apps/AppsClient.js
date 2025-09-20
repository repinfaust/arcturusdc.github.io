"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ---------- small helper to measure content height for smooth expand ---------- */
function useMeasuredMaxHeight(deps = []) {
  const ref = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Set to scrollHeight so the whole thing is visible when expanded
    setMaxH(el.scrollHeight);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, maxH };
}

/* ------------------------------ App Card ------------------------------ */
function AppCard({ app, expanded, onToggle }) {
  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  // measure the expandable area so we can animate to its full height
  const { ref: expandRef, maxH } = useMeasuredMaxHeight([expanded, summary]);

  // click behavior:
  // - if not expanded -> expand, prevent navigation
  // - if already expanded -> allow navigation
  const handleClick = (e) => {
    if (!expanded) {
      e.preventDefault();
      onToggle(app.id);
    }
    // if expanded: fall through (link navigates)
  };

  const handleKeyDown = (e) => {
    // Space/Enter toggle expand
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(expanded ? null : app.id);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800"
      aria-expanded={expanded}
      aria-controls={`summary-${app.id}`}
    >
      {/* Background image (stronger, as requested) */}
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
        {/* Heading row */}
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

        {/* Strap / tagline (always visible, compact height) */}
        {strap && (
          <p className="text-sm text-neutral-700 italic mb-2">{strap}</p>
        )}

        {/* Expandable summary (click to open) */}
        <div
          id={`summary-${app.id}`}
          className="relative overflow-hidden transition-[max-height] duration-400 ease-out"
          style={{ maxHeight: expanded ? maxH : 0 }}
        >
          <div
            ref={expandRef}
            className={[
              "pt-1", // a touch of breathing room when revealed
              "transition-opacity duration-300 ease-out",
              expanded ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {summary && <p className="text-sm text-neutral-700">{summary}</p>}
          </div>
        </div>

        {/* Subtle affordance text (only when collapsed) */}
        {!expanded && (
          <div className="mt-3 text-xs text-neutral-500">
            Click to read more — click again to open.
          </div>
        )}
      </div>
    </a>
  );
}

/* ------------------------------ Grid ------------------------------ */
export default function AppsClient({ apps }) {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (id) => {
    // toggle: close if same id, otherwise open the new one
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          expanded={expandedId === app.id}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
