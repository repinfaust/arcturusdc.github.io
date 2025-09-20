"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithApps() {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current, bg = bgRef.current, card = cardRef.current;
    if (!root || !bg || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bg.style.opacity = reduce ? "1" : "0";
    card.style.opacity = reduce ? "1" : "0";

    let raf = 0;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const getVH = () => window.visualViewport?.height ?? window.innerHeight ?? 1;

    const tick = () => {
      raf = 0;

      const rect = root.getBoundingClientRect();
      const vh = getVH();
      const isSmall = matchMedia("(max-width: 640px)").matches;

      const startY = vh * (isSmall ? 1.02 : 0.95);
      const endY   = vh * (isSmall ? 0.52 : 0.40);
      const p = clamp01((startY - rect.top) / (startY - endY || 1));

      if (!reduce) {
        bg.style.opacity = String(p);
        bg.style.transform = `translate3d(0, ${Math.round(-60 * p)}px, 0)`;

        const startTopPct = isSmall ? 84 : 70;
        const endTopPct   = isSmall ? 47 : 42;
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

    const onScrollResize = () => { if (!raf) raf = requestAnimationFrame(tick); };

    tick();
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onScrollResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      window.visualViewport?.removeEventListener("resize", onScrollResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const heroH = "h-[88vh] md:h-[82vh]";
  const topMargin = "mt-12 sm:mt-16";

  return (
    <section
      ref={rootRef}
      aria-label="Apps hero"
      className={`relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] ${heroH} ${topMargin} mb-20`}
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
        style={{ top: "84%", transform: "translate(-50%, -50%)" }}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-4">
          Apps
        </h2>

        <p className="text-neutral-700 max-w-prose">
          Every app is built with a clear purpose: to solve one problem well. The
          portfolio includes ADHD motivation, shared-care family organisation,
          and fitness planning — each designed to meet a need in a way that’s
          simple, compliant, and privacy-first.
        </p>

        {/* CTA stays left */}
        <a
          href="/apps"
          className="mt-6 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium shadow hover:bg-red-700"
        >
          Browse apps →
        </a>

        {/* Centred chips — warm variant */}
        <div className="meta--warm mt-4 w-full flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
          <span className="chip"><span className="chip-dot" />App Store &amp; Google Play</span>
          <span className="chip"><span className="chip-dot" />UK based</span>
          <span className="chip"><span className="chip-dot" />Privacy-first</span>
        </div>
      </div>
    </section>
  );
}
