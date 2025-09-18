"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed hero with background image.
 * Capabilities card is an overlay that matches the hero’s width & height.
 * Clear fade/slide-in on first scroll into view.
 */
export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      {
        // trigger only once it’s properly in view
        root: null,
        threshold: 0.35,
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const heroH = "h-[70vh] md:h-[80vh] lg:h-[88vh]"; // tweak to taste

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={[
        "relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen",
        heroH,
      ].join(" ")}
    >
      {/* Background image fills the hero */}
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

      {/* Overlay card fills the hero (same width & height) */}
      <div
        className={[
          "absolute inset-0",
          // visual
          "rounded-3xl border border-black/10",
          "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
          "shadow-2xl overflow-hidden",
          // entrance animation
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          "transition-all duration-600 ease-out will-change-transform will-change-opacity",
          // spacing for content
          "flex flex-col",
        ].join(" ")}
      >
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

        <div className="px-6 sm:px-8 lg:px-12 pb-6">
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="badge">Discovery</span>
            <span className="badge">Compliance support</span>
            <span className="badge">Delivery ops</span>
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
        <a href={href} className="mt-3 inline-block text-sm text-red-700 hover:underline">
          Learn more
        </a>
      ) : null}
    </div>
  );
}
