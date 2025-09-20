"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const bg = bgRef.current;
    const card = cardRef.current;
    if (!root || !bg || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mqSmall = window.matchMedia("(max-width: 640px)");

    let raf = 0;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const getVH = () => window.visualViewport?.height ?? window.innerHeight ?? 1;

    // ensure background tall enough on mobile so the card never spills
    const ensureMobileHeight = () => {
      const isSmall = mqSmall.matches;
      if (!isSmall) {
        root.style.height = "";
        return;
      }
      const vh = getVH();
      const cardH = card.offsetHeight || 0;
      const needed = Math.max(vh * 0.9, cardH + 96);
      root.style.height = `${Math.ceil(needed)}px`;
    };

    const setInitial = () => {
      if (reduce) {
        bg.style.opacity = "1";
        bg.style.transform = "none";
        card.style.opacity = "1";
        card.style.transform = "translate(-50%, -50%)";
        return;
      }
      bg.style.opacity = "0";
      card.style.opacity = "0";
    };

    const tick = () => {
      raf = 0;

      const rect = root.getBoundingClientRect();
      const vh = getVH();
      const isSmall = mqSmall.matches;

      const startY = vh * (isSmall ? 1.02 : 0.95);
      const endY = vh * (isSmall ? 0.55 : 0.40);
      const p = clamp01((startY - rect.top) / (startY - endY || 1));

      if (!reduce) {
        bg.style.opacity = String(p);
        bg.style.transform = `translate3d(0, ${Math.round(-60 * p)}px, 0)`;
      } else {
        bg.style.opacity = "1";
        bg.style.transform = "none";
      }

      if (reduce) {
        card.style.opacity = "1";
        card.style.transform = "translate(-50%, -50%)";
        return;
      }

      if (isSmall) {
        const startTopPct = 80;
        const endTopPct = 54;
        const topPct = startTopPct - (startTopPct - endTopPct) * p;

        card.style.top = `${topPct}%`;
        card.style.opacity = String(p);
        card.style.transform = `translate(-50%, -50%) scale(${0.985 + 0.015 * p})`;
      } else {
        const startTopPct = 70;
        const endTopPct = 42;
        const topPct = startTopPct - (startTopPct - endTopPct) * p;

        card.style.top = `${topPct}%`;
        card.style.opacity = String(p);
        card.style.transform = `translate(-50%, -50%) scale(${0.98 + 0.02 * p})`;
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => {
      ensureMobileHeight();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(() => {
      ensureMobileHeight();
      if (!raf) raf = requestAnimationFrame(tick);
    });

    setInitial();
    ensureMobileHeight();
    tick();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    mqSmall.addEventListener?.("change", onResize);
    ro.observe(card);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      mqSmall.removeEventListener?.("change", onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={[
        "relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]",
        "mt-12 sm:mt-16 mb-20",
        "sm:h-[82vh]",
      ].join(" ")}
    >
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
        <h3 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-4">
          Capabilities
        </h3>

        <div className="grid gap-6 md:grid-cols-3 text-neutral-700">
          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">PS</div>
            <h4 className="font-semibold text-neutral-900 text-lg">Product strategy</h4>
            <p className="text-sm text-neutral-600">
              Helping organisations cut through noise to find and deliver the next
              most valuable outcome. The emphasis is on solving genuine problems in
              the simplest, most effective way.
            </p>
            <a href="/capabilities" className="mt-3 inline-block text-sm text-red-700 hover:underline">
              Learn more
            </a>

            {/* centred on small, left on md+ */}
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs sm:text-sm">
              <span className="badge">Discovery</span>
              <span className="badge">Compliance support</span>
              <span className="badge">Delivery ops</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">AD</div>
            <h4 classNa
