"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/* ---------- Small modal with focus trap ---------- */
function Modal({ isOpen, onClose, app }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // focus trap-ish
    const prev = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !app) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`app-title-${app.id}`}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* bg image, stronger but softened */}
        {app.bg && (
          <>
            <Image
              src={app.bg}
              alt=""
              fill
              sizes="100vw"
              className="absolute inset-0 object-cover opacity-30"
              priority={false}
            />
            <div className="absolute inset-0 bg-white/80" />
          </>
        )}

        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
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
            <h2
              id={`app-title-${app.id}`}
              className="text-xl font-semibold text-neutral-900"
            >
              {app.name}
            </h2>
          </div>

          {app.strap && (
            <p className="text-sm text-neutral-700 italic mb-3">{app.strap}</p>
          )}

          <p className="text-neutral-800 leading-relaxed">
            {app.summary || app.desc || ""}
          </p>

          <div className="mt-6 flex items-center gap-3">
            {app.link && (
              <a
                href={app.link}
                className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium shadow hover:bg-red-700"
              >
                Visit app →
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-xl border border-neutral-300 px-4 py-2 text-neutral-800 hover:bg-neutral-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- App card (fixed height; opens modal) ---------- */
function AppCard({ app, onOpen }) {
  const href = app.link || `/apps/${app.id}`;
  const strap = app.strap || app.desc || "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(app)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onOpen(app);
        }
      }}
      className="group relative rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800 min-h-[220px]"
      aria-label={`Open details for ${app.name}`}
    >
      {/* stronger bg image */}
      {app.bg && (
        <>
          <Image
            src={app.bg}
            alt=""
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="absolute inset-0 object-cover opacity-35 transition-opacity duration-300 group-hover:opacity-45"
            priority={false}
          />
          <div className="absolute inset-0 pointer-events-none bg-white/35" />
        </>
      )}

      {/* content */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-3">
          {/* name/logo is navigational; stop propagation so it doesn’t open modal */}
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
          <p className="text-sm text-neutral-800/90 italic">
            {strap}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Grid + modal controller ---------- */
export default function AppsClient({ apps }) {
  const [openApp, setOpenApp] = useState(null);

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} onOpen={setOpenApp} />
        ))}
      </div>

      <Modal
        isOpen={!!openApp}
        app={openApp}
        onClose={() => setOpenApp(null)}
      />
    </>
  );
}
