"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Apps", href: "/apps" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

// split a string into characters (keeps spaces)
function useChars(text) {
  return useMemo(() => text.split(""), [text]);
}

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock scroll when mobile menu open
  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", open);
  }, [open]);

  const compact = scrolled; // single source of truth

  return (
    <div className="sticky top-3 z-50 px-3 sm:px-4">
      {/* This flex wrapper ensures easy centring of the pill */}
      <div className="mx-auto flex w-full max-w-7xl justify-center">
        <nav
          aria-label="Primary"
          className={[
            // layout + centring
            "relative flex items-center",
            "w-full md:w-auto",
            // width behaviour (contracts and centres on desktop)
            compact ? "md:max-w-[920px]" : "md:max-w-[1120px]",
            // spacing
            compact ? "gap-3 px-4 sm:px-6 lg:px-7 h-14" : "gap-4 px-5 sm:px-7 lg:px-8 h-16",
            // visuals
            "rounded-full border border-white/10 bg-neutral-900/70 backdrop-blur-md",
            compact
              ? "shadow-[0_6px_24px_-8px_rgba(0,0,0,0.35)]"
              : "shadow-none",
            // animation
            "transition-all duration-300",
          ].join(" ")}
        >
          {/* Brand (with falling letters on contract) */}
          <Brand compact={compact} />

          {/* Desktop nav */}
          <ul className={["hidden md:flex items-center", compact ? "gap-2" : "gap-3"].join(" ")}>
            {LINKS.map(({ label, href }) => {
              const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
              return (
                <li key={href}>
                  <NavLink href={href} active={active} compact={compact}>
                    {label}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {/* Mobile button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="md:hidden ml-auto inline-flex items-center justify-center rounded-full p-2 -mr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                className="text-white/90"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-neutral-950 border-l border-white/10 p-6 pt-14 flex flex-col"
          >
            {/* Close button only — no duplicate header */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6l-12 12"
                  stroke="currentColor"
                  className="text-white/90"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <ul className="space-y-1">
              {LINKS.map(({ label, href }) => {
                const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "block rounded-xl px-3 py-3 text-base",
                        active
                          ? "text-white bg-white/5"
                          : "text-white/85 hover:text-white hover:bg-white/5",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                        "transition",
                      ].join(" ")}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-auto pt-6 text-white/60 text-xs">
              © {new Date().getFullYear()} Arcturus Digital Consulting
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Brand with staggered "letters fall in" on contract */
function Brand({ compact }) {
  const letters = useChars("Arcturus Digital");
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-full px-1 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-neutral-900 font-bold">
        A
      </span>
      <span
        aria-label="Arcturus Digital"
        className={[
          "inline-flex overflow-hidden",
          compact ? "translate-y-0" : "translate-y-0",
          // keep overall block stable while letters animate
          "transition-transform",
        ].join(" ")}
      >
        {letters.map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            className={[
              "inline-block",
              compact ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              "transition-all duration-300",
            ].join(" ")}
            style={{
              transitionDelay: `${Math.min(i * 30, 360)}ms`,
              letterSpacing: compact ? "0.01em" : "0.02em",
              marginRight: ch === " " ? "0.3ch" : undefined,
              // slight size easing to feel 'snappy'
              transformOrigin: "bottom",
            }}
          >
            <span className={compact ? "text-white" : "text-white"}>{ch}</span>
          </span>
        ))}
      </span>
    </Link>
  );
}

function NavLink({ href, active, compact, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative inline-flex items-center rounded-full",
        compact ? "px-3 py-2 text-[13.5px]" : "px-3.5 py-2.5 text-sm",
        active ? "text-white" : "text-white/85 hover:text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        "transition-all duration-200",
      ].join(" ")}
    >
      <span className="relative">
        {children}
        <span
          className={[
            "absolute left-0 right-0 -bottom-1 h-[2px] rounded bg-white/85",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200",
          ].join(" ")}
        />
      </span>
    </Link>
  );
}
