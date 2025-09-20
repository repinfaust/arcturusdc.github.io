"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* -------------------- Click outside hook -------------------- */
function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onOutside?.();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onOutside, ref]);
}

/* -------------------- Card -------------------- */
function AppCard({ app }) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);
  const popRef = useRef(null);

  // Close with Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside (for the popover)
  useClickOutside(popRef, () => setOpen(false));

  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";
  const summary = app.summary || app.desc || "";

  return (
    <div className="relative">
      {/* Base card — fixed height so the grid never pushes siblings */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={[
          "group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800",
          "min-h-[220px]", // <- keeps the grid stable
          open ? "z-40" : "z-0",
        ].join(" ")}
        aria-expanded={open}
      >
        {/* Stronger background image */}
        {app.bg && (
          <>
            <Image
              src={app.bg}
              alt=""
              fill
              sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              className="absolute inset-0 object-cover opacity-35 transition-opacity duration-300 group-hover:opacity-45"
            />
            <div className="absolute inset-0 pointer-events-none bg-white/35" />
          </>
        )}

        {/* Foreground content */}
        <div className="relative">
          {/* Name/logo is a link – does NOT toggle open */}
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

          {strap && (
            <p className="text-sm text-neutral-800/90 italic">{strap}</p>
          )}

          {/* Mobile inline expand (no popover on small screens) */}
          <div
            className={[
              "sm:hidden overflow-hidden transition-[max-height] duration-300 ease-out",
              open ? "max-h-[800px] mt-2" : "max-h-0",
            ].join(" ")}
          >
            {summary && (
              <p className="text-sm text-neutral-800 mt-2">{summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet popover anchored to the card (no layout shift) */}
      {open && (
        <div
          ref={popRef}
          className={[
            "hidden sm:block",         // only >= sm
            "absolute left-0 right-0", // anchor to card width
            "top-[calc(100%+8px)]",    // below the card with small gap
            "rounded-2xl bg-white shadow-2xl ring-1 ring-black/10",
            "p-5 sm:p-6 lg:p-7",
            "z-50",
          ].join(" ")}
          // allow popover to overflow outside the grid cell
          style={{ pointerEvents: "auto" }}
        >
          {/* Optional softened background motif inside popover */}
          {app.bg && (
            <>
              <Image
                src={app.bg}
                alt=""
                fill
                sizes="100vw"
                className="absolute inset-0 object-cover opacity-10"
              />
              <div className="absolute inset-0 bg-white/80" />
            </>
          )}

          <div className="relative">
            {summary && (
              <p className="text-[15px] leading-relaxed text-neutral-900">
                {summary}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- Grid -------------------- */
export default function AppsClient({ apps }) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 relative overflow-visible">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  );
}
