"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Scroll-linked hero:
 *  - Adds top margin so it never overlaps the intro.
 *  - BG image fades + parallax on scroll.
 *  - Card moves from lower area up towards centre while fading in.
 */
export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgWrapRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const bg   = bgWrapRef.current;
    const card = cardRef.current;
    if (!root || !bg || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // initial visual states
    bg.style.opacity = reduce ? "1" : "0";
    bg.style.transform = "translate3d(0, 0, 0)";
    // card will be positioned with 'top' + translate(-50%, -50%)
    card.style.opacity = reduce ? "1" : "0";

    let raf = 0;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const update = () => {
      raf = 0;

      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // Progress mapping:
      // p = 0 when hero top is near bottom of viewport (just entering)
      // p = 1 when hero top reaches about 40% of viewport height
      const start = vh * 0.95;
      const end   = vh * 0.40;
      const p = clamp01((start - rect.top) / (start - end || 1));

      if (!reduce) {
        // BG fade + parallax (clear effect; dial numbers later)
        bg.style.opacity = String(p);
        const parallaxY = Math.round(-60 * p); // move up to -60px
        bg.style.transform = `translate3d(0, ${parallaxY}px, 0)`;

        // Card: move from 70% (lower) up to ~45% (near centre) and fade in
        const topPct = 70 - 25 * p; // 70% → 45%
        card.style.top = `${topPct}%`;
        card.style.opacity = String(p);
        const scale = 0.98 + 0.02 * p;
        card.style.transform = `translate(-50%, -50%) scale(${scale})`;
      } else {
        // reduced motion: static centred-ish
        bg.style.opacity = "1";
        card.style.top = "50%";
        card.style.opacity = "1";
        card.style.transform = "translate(-50%, -50%)";
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hero height + top margin so it never collides with intro
  const heroH = "h-[75vh] md:h-[85vh]";
  const topMargin = "mt-12 sm:mt-16"; // <- gives visual separation from the intro

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={[
        "relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]",
        heroH,
        topMargin,
        "mb-20", // spacing to next section
      ].join(" ")}
    >
      {/* Background (parallax + fade target) */}
      <div ref={bgWrapRef} className="absolute inset-0 will-change-transform will-change-opacity">
        <Image
          src="/img/network-hero-2560.png"
          alt="Abstract network"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/6 to-black/25" />
      </div>

      {/* Floating card – positioned by 'top' so we can animate it into centre */}
      <div
        ref={cardRef}
        className={[
          "absolute left-1/2",
          // 'top' is set dynamically in JS to move from 70% → 45%
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          "will-change-transform will-change-opacity",
        ].join(" ")}
        style={{
          // initial top for no-JS/first paint; JS will override
          top: "70%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-6 lg:mb-8">
          Capabilities
        </h2>

        <div className="grid gap-6 md:grid-cols-3 text-neutral-700">
          <Block code="PS" title="Product strategy" desc="Find and ship the next most valuable thing." href="/product-strategy" />
          <Block code="AD" title="App development" desc="Android & iOS with privacy-first design." />
          <Block code="DA" title="Data & analytics" desc="From instrumentation to insight, minus the spin." />
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
