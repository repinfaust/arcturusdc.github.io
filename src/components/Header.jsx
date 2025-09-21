"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Apps", href: "/apps" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

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

  const contracted = scrolled && !hovered; // shrink when scrolled, expand on hover

  return (
    <div
      className={[
        "sticky top-3 z-50 mx-auto transition-all duration-500",
        contracted ? "max-w-3xl hover:max-w-7xl" : "max-w-7xl",
        "px-3 sm:px-4",
      ].join(" ")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <nav
        aria-label="Primary"
        className={[
          "flex h-16 sm:h-18 items-center",
          "rounded-full border border-white/10",
          "px-4 sm:px-6 lg:px-8",
          "bg-neutral-900/70 backdrop-blur-md",
          scrolled
            ? "shadow-[0_6px_24px_-8px_rgba(0,0,0,0.35)]"
            : "shadow-none",
          "transition-shadow",
        ].join(" ")}
      >
        {/* LEFT: Brand (logo + name) */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-1 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          data-analytics="link"
          data-name="Nav: Brand"
          data-component="Header"
          data-location="nav"
        >
          <Image
            src="/img/logo-mark.png"
            alt="Arcturus Digital Consulting"
            width={28}
            height={28}
            className="rounded-full"
            priority
          />
          {/* Stack full + short names in the same space; fade between them */}
          <span className="relative block h-6 sm:h-7">
            {/* Full brand (expanded) */}
            <span
              className={[
                "absolute inset-0 flex items-center whitespace-nowrap",
                "text-white font-semibold tracking-tight",
                "text-base sm:text-lg",
                contracted ? "opacity-0 pointer-events-none" : "opacity-100",
                "transition-opacity duration-150",
              ].join(" ")}
            >
              Arcturus Digital Consulting
            </span>

            {/* Short brand (contracted) */}
            <span
              className={[
                "absolute inset-0 flex items-center whitespace-nowrap",
                "text-white font-semibold tracking-tight",
                "text-base sm:text-lg",
                contracted ? "opacity-100" : "opacity-0 pointer-events-none",
                "transition-opacity duration-150",
              ].join(" ")}
            >
              ArcturusDC
            </span>
          </span>
        </Link>

        {/* MIDDLE: spacer prevents any overlap with nav */}
        <div className="flex-1" />

        {/* RIGHT: Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {LINKS.map(({ label, href }) => {
            const active =
              href === "/" ? pathname === "/" : pathname?.startsWith(href);
            return (
              <li key={href}>
                <NavLink
                  href={href}
                  active={active}
                  data-analytics="link"
                  data-name={`Nav: ${label}`}
                  data-component="Header"
                  data-location="nav"
                >
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* RIGHT: Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex items-center justify-center rounded-full p-2 -ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          aria-label="Open menu"
          data-analytics="button"
          data-name="Nav: Open menu"
          data-component="Header"
          data-location="nav"
          data-variant="icon"
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
            data-analytics="button"
            data-name="Nav: Close overlay"
            data-component="Header"
            data-location="drawer"
            data-variant="overlay"
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
                data-analytics="link"
                data-name="Nav: Brand (drawer)"
                data-component="Header"
                data-location="drawer"
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
                data-analytics="button"
                data-name="Nav: Close menu"
                data-component="Header"
                data-location="drawer"
                data-variant="icon"
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
                      data-analytics="link"
                      data-name={`Nav: ${label}`}
                      data-component="Header"
                      data-location="drawer"
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

function NavLink({ href, active, children, ...dataAttrs }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative inline-flex items-center rounded-full px-3 py-2 text-sm font-medium transition",
        active ? "text-white" : "text-white/85 hover:text-white",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
      ].join(" ")}
      {...dataAttrs} // ← passes data-analytics/data-name/etc
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
