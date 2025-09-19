"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Apps", href: "/apps" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);

  // controls the one-time letter drop after you first scroll, when you next hover to expand
  const [shouldDrop, setShouldDrop] = useState(false);
  const [playDropNow, setPlayDropNow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 8;
      // when you enter "scrolled" mode for the first time, queue the drop for the next hover
      if (s && !scrolled) setShouldDrop(true);
      setScrolled(s);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrolled]);

  // lock scroll when mobile menu open
  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", open);
  }, [open]);

  // contract when scrolled and NOT hovered
  const contracted = scrolled && !hovered;

  // when you hover in the scrolled state, play the drop once
  const onMouseEnter = () => {
    setHovered(true);
    if (scrolled && shouldDrop) {
      // trigger stagger animation once
      setPlayDropNow(true);
      setShouldDrop(false);
      // clear the flag after the animation window
      setTimeout(() => setPlayDropNow(false), 900);
    }
  };

  return (
    <div
      className={[
        "sticky top-3 z-50 mx-auto transition-all duration-500",
        contracted ? "max-w-3xl" : "max-w-7xl",
        "px-3 sm:px-4",
      ].join(" ")}
      onMouseEnter={onMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <nav
        aria-label="Primary"
        className={[
          "flex h-16 sm:h-18 items-center justify-between",
          "rounded-full border border-white/10",
          "px-4 sm:px-6 lg:px-8",
          "bg-neutral-900/70 backdrop-blur-md",
          scrolled
            ? "shadow-[0_6px_24px_-8px_rgba(0,0,0,0.35)]"
            : "shadow-none",
          "transition-shadow",
        ].join(" ")}
      >
        {/* Brand (logo + name) */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-1 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Image
            src="/img/logo-mark.png"
            alt="Arcturus Digital Consultancy"
            width={28}
            height={28}
            className="rounded-full"
            priority
          />

          {/* Full brand (shows at top, and when expanded on hover) */}
          <span
            className={[
              "hidden sm:block text-white text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap overflow-hidden",
              contracted ? "opacity-0 pointer-events-none" : "opacity-100",
              "transition-opacity duration-200",
            ].join(" ")}
          >
            <BrandLetters play={playDropNow} />
          </span>

          {/* Short brand for contracted state so it fits */}
          <span
            className={[
              "sm:hidden text-white text-base font-semibold tracking-tight",
              contracted ? "opacity-100" : "opacity-0 pointer-events-none",
              "transition-opacity duration-200",
            ].join(" ")}
          >
            ArcturusDC
          </span>
          <span
            className={[
              "hidden sm:block text-white text-base font-semibold tracking-tight",
              contracted ? "opacity-100" : "opacity-0 pointer-events-none",
              "transition-opacity duration-200",
            ].join(" ")}
          >
            ArcturusDC
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {LINKS.map(({ label, href }) => {
            const active =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <li key={href}>
                <NavLink href={href} active={active}>
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
          className="md:hidden inline-flex items-center justify-center rounded-full p-2 -mr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm bg-neutral-950 border-l border-white/10 p-6 flex flex-col"
          >
            <div className="flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2"
              >
                <Image
                  src="/img/logo-mark.png"
                  alt="Arcturus Digital Consultancy"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-white text-lg font-semibold tracking-tight">
                  Arcturus Digital Consultancy
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 -mr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
            </div>

            <ul className="mt-8 space-y-1">
              {LINKS.map(({ label, href }) => {
                const active =
                  href === "/" ? pathname === "/" : pathname?.startsWith(href);
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
              © {new Date().getFullYear()} Arcturus Digital Consultancy
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition",
        active ? "text-white" : "text-white/85 hover:text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
      ].join(" ")}
    >
      <span className="relative">
        {children}
        <span
          className={[
            "absolute left-0 right-0 -bottom-1 h-[2px] rounded",
            "bg-white/85",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            "transition-opacity duration-200",
          ].join(" ")}
        />
      </span>
    </Link>
  );
}

/**
 * Full brand with staggered "fall in" when play=true.
 * At rest (top of page), it renders static (no animation).
 */
function BrandLetters({ play }) {
  const text = "Arcturus Digital Consultancy";
  const chars = text.split("");

  return (
    <span className="inline-flex gap-0.5">
      {chars.map((char, i) => (
        <span
          key={`${char}-${i}`}
          className={[
            "inline-block will-change-transform will-change-opacity",
            play ? "translate-y-full opacity-0 animate-none" : "translate-y-0 opacity-100",
            // when play toggles from true -> false, we transition into place
            play ? "" : "transition-all duration-500 ease-out",
          ].join(" ")}
          style={play ? { transitionDelay: `${i * 30}ms` } : { transitionDelay: "0ms" }}
          // when play was true, we immediately force a reflow via CSS transition:
          // The parent toggles play to true then back to false after ~900ms,
          // causing these to transition from translate-y-full to 0 with a stagger.
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
