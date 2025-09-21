"use client";

import { useEffect, useState } from "react";

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function Hero() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      aria-label="Intro hero"
      className="
        relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]
        mt-6 sm:mt-10 mb-10 sm:mb-16 sm:h-[70vh]
      "
    >
      {/* Background GIF */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        <img
          src="/img/pulsating_arcturus.gif"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/6 to-black/25" />
      </div>

      {/* Card sized like HeroWithCapabilities */}
      <div
        className={cx(
          "absolute left-1/2",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          "transition-opacity duration-700",
          fadeIn ? "opacity-100" : "opacity-0"
        )}
        style={{ top: "54%", transform: "translate(-50%, -50%)" }}
      >
        <p className="text-xs font-semibold text-red-600 mb-3">Product &amp; Apps</p>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900">
          Practical software for real needs.
        </h1>

        <p className="mt-3 text-neutral-700 max-w-prose">
          Arcturus Digital Consulting builds apps and digital products that focus on real-world problems — not technology for its own sake. From ADHD support to family organisation and fitness planning, every product is designed around a clear need, with privacy and compliance built in from the start.
        </p>

        <div className="mt-5 flex gap-3 flex-wrap">
          <a href="/apps" className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium shadow hover:bg-red-700">
            Explore apps
          </a>
          <a href="/capabilities" className="inline-flex items-center rounded-xl border border-neutral-300 px-4 py-2 text-neutral-800 hover:bg-neutral-50">
            Capabilities
          </a>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="badge">UK Ltd</span>
          <span className="badge">App Store &amp; Google Play compliant</span>
          <span className="badge">UK based</span>
        </div>
      </div>
    </section>
  );
}
