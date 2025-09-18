"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/**
 * Full-bleed hero with:
 *  - IntersectionObserver to fade/slide the card in
 *  - rAF + scroll to parallax the background
 *  - Console log once so you can confirm the client code is running
 */
export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgRef   = useRef(null);
  const cardRef = useRef(null);

  // 1) Confirm JS is running on the client
  useEffect(() => {
    // You should see this in DevTools -> Console exactly once
    // If you don't, the component isn't mounting as a client component
    console.log("[HeroWithCapabilities] mounted");
  }, []);

  // 2) Fade/slide in the card when the section intersects
  useEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    if (!root || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Set initial state (hidden) – very obvious
    if (!reduce) {
      card.style.opacity = "0";
      card.style.transform = "translate3d(-50%, 40px, 0)"; // 40px so it’s visible
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // visible state
          card.style.transition = "opacity 700ms ease-out, transform 700ms ease-out";
          card.style.opacity = "1";
          card.style.transform = "translate3d(-50%, 0px, 0)";
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    io.observe(root);
    return () => io.disconnect();
  }, []);

  // 3) Parallax the background on scroll
  useEffect(() => {
    const root = rootRef.current;
    const bg   = bgRef.current;
    if (!root || !bg) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // static if user prefers reduced motion

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = root.getBoundingClientRect();
        const vh = window.innerHeight || 1;

        // progress 0..1 as the block moves through viewport
        const start = vh;       // start when section bottom hits bottom of viewport
        const end   = -rect.height; // end when it's fully past top
        const t = Math.max(0, Math.min(1, (start - rect.top) / (start - end || 1)));

        // move bg up to 30px across the scroll
        const y = -30 * t;
        bg.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };

    onScroll(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const heroH = "h-[70vh] md:h-[80vh] lg:h-[88vh]";

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={`relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen ${heroH}`}
    >
      {/* Background image wrapper (parallax transform applied here) */}
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

      {/* Floating capabilities card – bottom anchored, auto height */}
      <div
        ref={cardRef}
        className={[
          "absolute left-1/2 -translate-x-1/2",
          "bottom-6 sm:bottom-8 lg:bottom-10",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          "will-change-transform will-change-opacity",
        ].join(" ")}
      >
        <h2 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-6 lg:mb-8">
          Capabilities
        </h2>

        <div className="grid gap-6 md:grid-cols-3 text-neutral-700">
          <Cap code="PS" title="Product strategy"
               desc="Find and ship the next most valuable thing."
               href="/product-strategy" />
          <Cap code="AD" title="App development"
               desc="Android & iOS with privacy-first design." />
          <Cap code="DA" title="Data & analytics"
               desc="From instrumentation to insight, minus the spin." />
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

function Cap({ code, title, desc, href }) {
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
