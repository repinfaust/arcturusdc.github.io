"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroWithCapabilities() {
  const rootRef = useRef(null);
  const bgRef   = useRef(null);
  const cardRef = useRef(null);

  // --- fade+slide-in on intersection
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      card.style.opacity = "1";
      card.style.transform = "translate3d(-50%, 0, 0)";
      return;
    }

    // Initial hidden state
    card.style.opacity = "0";
    card.style.transform = "translate3d(-50%, 64px, 0)";

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      requestAnimationFrame(() => {
        void card.offsetHeight; // flush layout
        card.style.transition = "opacity 700ms ease-out, transform 700ms cubic-bezier(.2,.8,.2,1)";
        card.style.opacity = "1";
        card.style.transform = "translate3d(-50%, 0, 0)";
      });

      io.disconnect();
    }, { threshold: 0.3 });

    io.observe(card);
    return () => io.disconnect();
  }, []);

  // --- background parallax
  useEffect(() => {
    const root = rootRef.current;
    const bg   = bgRef.current;
    if (!root || !bg) return;

    const onScroll = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      const start = vh;
      const end   = -rect.height;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end || 1)));

      const y = -40 * progress; // dial value for subtle parallax
      bg.style.transform = `translate3d(0, ${y}px, 0)`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroH = "h-[75vh] md:h-[85vh]";

  return (
    <section
      ref={rootRef}
      aria-label="Network hero with capabilities"
      className={`relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen ${heroH} mb-24`} 
      // 👆 `mb-24` ensures it doesn’t collide with next section
    >
      {/* Background image with parallax */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <Image
          src="/img/network-hero-2560.png"
          alt="Abstract network"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/25" />
      </div>

      {/* Floating Capabilities card */}
      <div
        ref={cardRef}
        className={[
          "absolute left-1/2 -translate-x-1/2",
          "bottom-8 sm:bottom-10 lg:bottom-14",
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
          <Block code="PS" title="Product strategy" desc="Find and ship the next most valuable thing." href="/product-strategy" />
          <Block code="AD" title="App development" desc="Android & iOS with privacy-first design." />
          <Block code="DA" title="Data & analytics" desc="From instrumentation to insight, minus the spin." />
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
