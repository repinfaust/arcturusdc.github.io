"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed hero bg + a floating Capabilities card
 * - Hero image: full width, fixed height (vh)
 * - Card: absolute, bottom-anchored, auto height, centered, fades/raises in
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
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // hero height (tweak as you like)
  const heroH = "h-[70vh] md:h-[80vh] lg:h-[88vh]";

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={["relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen", heroH].join(" ")}
    >
      {/* Background image */}
      <div className="absolute inset-0">
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

      {/* Floating card — bottom anchored, auto height, centred */}
      <div
        className={[
          "absolute left-1/2 -translate-x-1/2",
          "bottom-6 sm:bottom-8 lg:bottom-10",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          // entrance
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          "transition-all duration-600 ease-out",
        ].join(" ")}
      >
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
