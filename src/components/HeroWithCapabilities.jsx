"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgRef   = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current, bg = bgRef.current, card = cardRef.current;
    if (!root || !bg || !card) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = mqReduce.matches;

    // initialise
    bg.style.opacity = reduce ? "1" : "0";
    card.style.opacity = reduce ? "1" : "0";

    let raf = 0;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const tick = () => {
      raf = 0;

      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const isSmall = window.matchMedia("(max-width: 640px)").matches;

      // Fade window: start when the hero top nears the bottom of the screen,
      // end when it's roughly mid-screen. Slightly earlier on mobile.
      const start = vh * (isSmall ? 0.92 : 0.95);
      const end   = vh * (isSmall ? 0.50 : 0.40);
      const p = clamp01((start - rect.top) / (start - end || 1));

      if (!reduce) {
        // Parallax bg
        bg.style.opacity = String(p);
        bg.style.transform = `translate3d(0, ${Math.round(-60 * p)}px, 0)`;

        // Card vertical path: start lower, end at visual centre
        const startTopPct = isSmall ? 78 : 70; // where it starts
        const endTopPct   = isSmall ? 50 : 45; // finish at true centre on mobile
        const topPct = startTopPct - (startTopPct - endTopPct) * p;

        card.style.top = `${topPct}%`;
        card.style.opacity = String(p);
        card.style.transform = `translate(-50%, -50%) scale(${0.98 + 0.02 * p})`;
      } else {
        bg.style.opacity = "1";
        card.style.top = "50%";
        card.style.opacity = "1";
        card.style.transform = "translate(-50%, -50%)";
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Same heights as before; mobile gets slightly taller hero to give the card room
  const heroH = "h-[72vh] md:h-[82vh]";
  const topMargin = "mt-12 sm:mt-16";

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={`relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] ${heroH} ${topMargin} mb-20`}
    >
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform will-change-opacity">
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

      {/* Floating card */}
      <div
        ref={cardRef}
        className={[
          "absolute left-1/2",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          "will-change-transform will-change-opacity",
        ].join(" ")}
        style={{ top: "70%", transform: "translate(-50%, -50%)" }}
      >
        <h3 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-4">
          Capabilities
        </h3>

        <div className="grid gap-6 md:grid-cols-3 text-neutral-700">
          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">PS</div>
            <h4 className="font-semibold text-neutral-900 text-lg">Product strategy</h4>
            <p className="text-sm text-neutral-600">Find and ship the next most valuable thing.</p>
            <a href="/product-strategy" className="mt-3 inline-block text-sm text-red-700 hover:underline">
              Learn more
            </a>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border px-2 py-1">Discovery</span>
              <span className="rounded-full border px-2 py-1">Compliance support</span>
              <span className="rounded-full border px-2 py-1">Delivery ops</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">AD</div>
            <h4 className="font-semibold text-neutral-900 text-lg">App development</h4>
            <p className="text-sm text-neutral-600">Android & iOS with privacy-first design.</p>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">DA</div>
            <h4 className="font-semibold text-neutral-900 text-lg">Data & analytics</h4>
            <p className="text-sm text-neutral-600">From instrumentation to insight, minus the spin.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
