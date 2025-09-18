"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed hero with fade-in on scroll.
 * Capabilities card is overlaid and sized to match the hero.
 * One composed section = exact alignment.
 */
export default function HeroWithCapabilities() {
  // control fade-in as user scrolls the block into view
  const rootRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Trigger once it’s ~15% in view
        if (entry.isIntersecting || entry.intersectionRatio > 0.15) {
          setInView(true);
          io.disconnect();
        }
      },
      { root: null, threshold: [0, 0.15, 0.3, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Shared hero height – the card uses the same height via h-full
  // Adjust these to taste
  const heroH = "h-[70vh] md:h-[80vh] lg:h-[88vh]";

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={[
        // full-bleed
        "relative z-10 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen",
        heroH,
        // fade/transform in
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        "transition-all duration-700 ease-out",
      ].join(" ")}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/img/network-hero-2560.png"
          alt="Abstract network"
          fill
          priority
          sizes="100vw"
          className="object-cover will-change-transform"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/8 to-black/20" />
      </div>

      {/* Overlay card — exact same height & aligned to the hero */}
      <div className="relative h-full flex items-end">
        {/* container controls width; card matches the hero height with h-full */}
        <div className="w-full">
          <div className="mx-auto max-w-[1200px] px-4">
            <div
              className={[
                "h-full", // match hero height
                "rounded-t-3xl rounded-b-3xl",
                "border border-black/10",
                "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
                "shadow-2xl",
                "overflow-hidden",
                // a soft entrance for the card after bg is in view
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                "transition-all duration-700 delay-75",
                "flex flex-col",
              ].join(" ")}
            >
              {/* Capabilities content */}
              <div className="p-6 sm:p-8 lg:p-12 grow">
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
              </div>

              {/* tags / footer strip (optional) */}
              <div className="px-6 sm:px-8 lg:px-12 pb-6">
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  <span className="badge">Discovery</span>
                  <span className="badge">Compliance support</span>
                  <span className="badge">Delivery ops</span>
                </div>
              </div>
            </div>
          </div>
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
        <a
          href={href}
          className="mt-3 inline-block text-sm text-red-700 hover:underline"
        >
          Learn more
        </a>
      ) : null}
    </div>
  );
}
