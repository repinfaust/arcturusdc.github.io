"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithApps() {
  const rootRef = useRef(null);
  const bgRef   = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current, bg = bgRef.current, card = cardRef.current;
    if (!root || !bg || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mqSmall = window.matchMedia("(max-width: 640px)");

    let raf = 0;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const getVH = () => (window.visualViewport?.height ?? window.innerHeight ?? 1);

    const ensureMobileHeight = () => {
      if (!mqSmall.matches) { root.style.height = ""; return; }
      const vh = getVH();
      const cardH = card.offsetHeight || 0;
      const needed = Math.max(vh * 0.9, cardH + 96);
      root.style.height = `${Math.ceil(needed)}px`;
    };

    const setInitial = () => {
      if (reduce) {
        bg.style.opacity = "1"; bg.style.transform = "none";
        card.style.opacity = "1"; card.style.transform = "translate(-50%, -50%)";
      } else {
        bg.style.opacity = "0"; card.style.opacity = "0";
      }
    };

    const tick = () => {
      raf = 0;

      const rect = root.getBoundingClientRect();
      const vh = getVH();
      const isSmall = mqSmall.matches;

      const startY = vh * (isSmall ? 1.02 : 0.95);
      const endY   = vh * (isSmall ? 0.55 : 0.40);
      const p = clamp01((startY - rect.top) / (startY - endY || 1));

      if (!reduce) {
        bg.style.opacity = String(p);
        bg.style.transform = `translate3d(0, ${Math.round(-60 * p)}px, 0)`;
      } else { bg.style.opacity = "1"; bg.style.transform = "none"; }

      if (reduce) { card.style.opacity = "1"; card.style.transform = "translate(-50%, -50%)"; return; }

      const startTopPct = isSmall ? 80 : 70;
      const endTopPct   = isSmall ? 54 : 42;
      const topPct = startTopPct - (startTopPct - endTopPct) * p;

      card.style.top = `${topPct}%`;
      card.style.opacity = String(p);
      card.style.transform = `translate(-50%, -50%) scale(${0.985 + 0.015 * p})`;
    };

    const onScrollResize = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const ro = new ResizeObserver(() => { ensureMobileHeight(); if (!raf) raf = requestAnimationFrame(tick); });

    setInitial(); ensureMobileHeight(); tick();

    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onScrollResize, { passive: true });
    mqSmall.addEventListener?.("change", onScrollResize);
    ro.observe(card);

    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      window.visualViewport?.removeEventListener("resize", onScrollResize);
      mqSmall.removeEventListener?.("change", onScrollResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="Apps hero"
      className="relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] mt-12 sm:mt-16 mb-20 sm:h-[82vh]"
    >
      <div ref={bgRef} className="absolute inset-0">
        <Image
          src="/img/network-orange-hero-2560.png"
          alt="Abstract network (orange)"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/6 to-black/25" />
      </div>

      <div
        ref={cardRef}
        className="absolute left-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px] rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10"
        style={{ top: "84%", transform: "translate(-50%, -50%)" }}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-neutral-900 mb-4">
          Apps
        </h2>
        <p className="text-neutral-700 max-w-prose">
          Every app is built with a clear purpose: to solve one problem well. The portfolio includes ADHD motivation,
          shared-care family organisation, and fitness planning — each designed to meet a need in a way that’s simple,
          compliant, and privacy-first.
        </p>

        {/* CENTRED chips */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="badge">App Store &amp; Google Play</span>
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
