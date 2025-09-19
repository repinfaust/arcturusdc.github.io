"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current,
      bg = bgRef.current,
      card = cardRef.current;
    if (!root || !bg || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmallMQ = window.matchMedia("(max-width: 640px)");

    const setInitial = () => {
      const isSmall = isSmallMQ.matches;
      // For mobile: no parallax on the card; just fade bg in
      if (isSmall || reduce) {
        bg.style.opacity = "1";
        card.style.opacity = "1";
        card.style.transform = "none";
        card.style.top = ""; // let CSS control
        return;
      }
      // desktop/tablet initial
      bg.style.opacity = reduce ? "1" : "0";
      card.style.opacity = reduce ? "1" : "0";
    };

    let raf = 0;
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const getVH = () => window.visualViewport?.height ?? window.innerHeight ?? 1;

    const tick = () => {
      raf = 0;

      const rect = root.getBoundingClientRect();
      const vh = getVH();
      const isSmall = isSmallMQ.matches;

      const startY = vh * (isSmall ? 1.02 : 0.95);
      const endY = vh * (isSmall ? 0.52 : 0.4);
      const p = clamp01((startY - rect.top) / (startY - endY || 1));

      // Always fade/shift the background a touch (ok on mobile)
      if (!reduce) {
        bg.style.opacity = String(p);
        bg.style.transform = `translate3d(0, ${Math.round(-60 * p)}px, 0)`;
      } else {
        bg.style.opacity = "1";
        bg.style.transform = "none";
      }

      // Card parallax only on sm+; mobile stays in normal flow
      if (!reduce && !isSmall) {
        const startTopPct = 70;
        const endTopPct = 42;
        const topPct = startTopPct - (startTopPct - endTopPct) * p;

        card.style.top = `${topPct}%`;
        card.style.opacity = String(p);
        card.style.transform = `translate(-50%, -50%) scale(${0.98 + 0.02 * p})`;
      } else {
        card.style.opacity = "1";
        card.style.transform = "none";
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => {
      setInitial();
      if (!raf) raf = requestAnimationFrame(tick);
    };

    setInitial();
    tick();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    isSmallMQ.addEventListener?.("change", onResize);
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      isSmallMQ.removeEventListener?.("change", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Mobile: let the section height grow with content.
  // Desktop/tablet: fixed hero height with parallax.
  const sectionClasses = [
    "relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]",
    "mt-12 sm:mt-16 mb-20",
    "h-auto sm:h-[82vh]",                 // 👈 auto on mobile, fixed on sm+
    "pt-[44vh] sm:pt-0",                  // 👈 space on mobile so card starts over bg
  ].join(" ");

  return (
    <section ref={rootRef} aria-label="Network hero with capabilities" className={sectionClasses}>
      {/* Background: fixed height on mobile, fills on sm+ */}
      <div ref={bgRef} className="absolute left-0 right-0 top-0 h-[44vh] sm:h-full will-change-transform will-change-opacity">
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

      {/* Card: in-flow on mobile, absolute on sm+ */}
      <div
        ref={cardRef}
        className={[
          // positioning
          "relative sm:absolute sm:left-1/2",
          // width
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px] mx-auto",
          // visuals
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          // padding
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          // perf
          "will-change-transform will-change-opacity",
          // slight lift on mobile to overlap the bg nicely
          "-mt-[22vh] sm:mt-0", // 👈 pulls card up over the mobile bg area
        ].join(" ")}
        // no inline top/transform; JS sets those only on sm+
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
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border px-2 py-1">Discovery</span>
              <span className="rounded-full border px-2 py-1">Compliance support</span>
              <span className="rounded-full border px-2 py-1">Delivery ops</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">AD</div>
            <h4 className="font-semibold text-neutral-900 text-lg">App development</h4>
            <p className="text-sm text-neutral-600">
              Design and build of Android and iOS apps with privacy-first principles.
              Each app is focused on a niche where existing tools are either too generic
              or too complex, ensuring usability and compliance without unnecessary features.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">DA</div>
            <h4 className="font-semibold text-neutral-900 text-lg">Data &amp; analytics</h4>
            <p className="text-sm text-neutral-600">
              From setup to insight, data is handled with clarity and purpose. No spin,
              no vanity metrics — just reliable instrumentation and reporting that support
              decision-making and improvement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
