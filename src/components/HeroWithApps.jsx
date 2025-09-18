"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithApps() {
  const rootRef = useRef(null);
  const bgRef   = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const bg   = bgRef.current;
    const card = cardRef.current;
    if (!root || !bg || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // initial states
    bg.style.opacity = reduce ? "1" : "0";
    card.style.opacity = reduce ? "1" : "0";

    let raf = 0;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const update = () => {
      raf = 0;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // progress from entering → near-centred
      const start = vh * 0.95;
      const end   = vh * 0.40;
      const p = clamp01((start - rect.top) / (start - end || 1));

      if (!reduce) {
        // BG parallax + fade
        const y = Math.round(-60 * p);
        bg.style.opacity = String(p);
        bg.style.transform = `translate3d(0, ${y}px, 0)`;

        // Card float (70% → 45%), fade + tiny scale
        const topPct = 70 - 25 * p;
        card.style.top = `${topPct}%`;
        card.style.opacity = String(p);
        const sc = 0.98 + 0.02 * p;
        card.style.transform = `translate(-50%, -50%) scale(${sc})`;
      } else {
        bg.style.opacity = "1";
        card.style.top = "50%";
        card.style.opacity = "1";
        card.style.transform = "translate(-50%, -50%)";
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const heroH = "h-[72vh] md:h-[82vh]";
  const topMargin = "mt-12 sm:mt-16";

  return (
    <section
      ref={rootRef}
      aria-label="Apps hero"
      className={[
        "relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]",
        heroH,
        topMargin,
        "mb-20",
      ].join(" ")}
    >
      {/* Background */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform will-change-opacity">
        <Image
          src="/img/network-orange-hero-2560.png"
          alt="Abstract network (orange)"
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
        <h2 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-6 lg:mb-8">
          Apps
        </h2>

        <p className="text-neutral-700 max-w-prose">
          Policies, platforms, and specifics for each app — kept compliant and privacy-first.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
          <span className="badge">App Store & Google Play</span>
          <span className="badge">UK based</span>
          <span className="badge">Privacy-first</span>
        </div>

        <a
          href="/apps"
          className="mt-6 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium shadow hover:bg-red-700"
        >
          Browse apps →
        </a>
      </div>
    </section>
  );
}
