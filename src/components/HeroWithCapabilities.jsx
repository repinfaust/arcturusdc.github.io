"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed hero with scroll-linked motion:
 *  - Parallax bg (subtle upward drift)
 *  - Card floats up + fades in as section scrolls into view
 *  - Card is bottom-anchored, auto-height, centred
 */
export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const cardRef = useRef(null);

  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // honour OS setting
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(!!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return; // render static

    const el = rootRef.current;
    const bg = bgRef.current;
    const card = cardRef.current;
    if (!el || !bg || !card) return;

    let rafId = 0;

    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // progress: 0 when section top is just below viewport,
      // 1 when the section is mostly in view (tune these)
      const start = vh * 0.85; // start anim just before it hits viewport
      const end = vh * 0.25;   // finish when top hits 25% of viewport
      const p = clamp01((start - rect.top) / (start - end || 1));

      // bg parallax (subtle)
      const bgY = -20 * p; // px up
      bg.style.transform = `translate3d(0, ${bgY}px, 0)`;

      // card rise + fade
      const ty = 24 * (1 - p); // from 24px down to 0
      const op = p;
      const sc = 0.98 + 0.02 * p; // tiny scale-in
      card.style.transform = `translate3d(-50%, ${ty}px, 0) scale(${sc})`;
      card.style.opacity = op.toString();

      rafId = 0; // mark done
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    };

    // initial styles
    cardRef.current.style.opacity = "0";
    cardRef.current.style.transform =
      "translate3d(-50%, 24px, 0) scale(0.98)";

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // hero height
  const heroH = "h-[70vh] md:h-[80vh] lg:h-[88vh]";

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={["relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen", heroH].join(" ")}
    >
      {/* Background image container (will be transformed) */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/img/network-hero-2560.png"
          alt="Abstract network"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/8 to-black/25" />
      </div>

      {/* Floating card — bottom anchored, auto height */}
      <div
        ref={cardRef}
        className={[
          "absolute left-1/2",
          "bottom-6 sm:bottom-8 lg:bottom-10",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          "will-change-transform will-change-opacity",
        ].join(" ")}
        style={
          reducedMotion
            ? { transform: "translate3d(-50%, 0, 0)", opacity: 1 }
            : undefined
        }
      >
        <h2 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-6 lg:mb-8">
          Capabilities
        </h2>

        <div className="grid gap-6 md:grid-cols-3 text-neutral-700">
          <Block
            code="PS"
            title="Product strategy"
            desc="Find and ship the next most valuable thing."
            href="/product-strategy"
          />
          <Block
            code="AD"
            title="App development"
            desc="Android & iOS with privacy-first design."
          />
          <Block
            code="DA"
            title="Data & analytics"
            desc="From instrumentation to insight, minus the spin."
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
          <span className="badge">Discovery</span>
          <span className="badge">Compliance support</span>
          <span className="badge">Delivery ops</span>
        </div>
      </div>
    </section>
  );
}

function Block({ code, title, desc, href }) {
  return (
    <div>
      <div className="text-xs font-semibold text-neutral-500 mb-1">{code}</div>
      <h3 className="font-semibold text-neutral-900 text-lg">{title}</h3>
      <p className="text-sm text-neutral-600">{desc}</p>
      {href ? (
        <a href={href} className="mt-3 inline-block text-sm text-red-700 hover:underline">
          Learn more
        </a>
      ) : null}
    </div>
  );
}
