"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const cx = (...classes: (string | false)[]) => classes.filter(Boolean).join(" ");

export default function Hero() {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setFadeIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      aria-label="Hero"
      className={cx(
        // match HeroWithCapabilities outer width/bleed & vertical spacing
        "relative w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]",
        "mt-6 sm:mt-10 mb-10 sm:mb-16",
        // optional fixed height similar to the capabilities hero on larger screens
        "sm:h-[70vh]"
      )}
    >
      {/* Background: pulsating Arcturus GIF + soft gradient */}
      <div
        className={cx(
          "absolute inset-0",
          "transition-opacity duration-700",
          fadeIn ? "opacity-100" : "opacity-0"
        )}
      >
        <Image
          src="/img/pulsating_arcturus.gif"
          alt="Pulsating Arcturus background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/6 to-black/25" />
      </div>

      {/* Card: mirror sizing from HeroWithCapabilities */}
      <div
        className={cx(
          "absolute left-1/2",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          "transition-opacity duration-700",
          fadeIn ? "opacity-100" : "opacity-0"
        )}
        style={{ top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <div className="mb-2 text-xs font-semibold text-brand/80">Product &amp; Apps</div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
          Software that ships.
        </h1>

        <p className="mt-3 max-w-2xl text-muted">
          Pragmatic product, apps, and privacy-first delivery for regulated environments.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap">
          <a
            href="/apps"
            className="btn-primary"
            data-analytics="button"
            data-name="Hero: Explore apps"
            data-component="Hero"
            data-location="hero"
            data-variant="primary"
          >
            Explore apps
          </a>
          <a
            href="#capabilities"
            className="btn-secondary"
            data-analytics="button"
            data-name="Hero: Capabilities"
            data-component="Hero"
            data-location="hero"
            data-variant="secondary"
          >
            Capabilities
          </a>
        </div>

        {/* badges row – consistent with HeroWithCapabilities */}
        <div className="mt-4 badges">
          <span className="badge">UK Ltd</span>
          <span className="badge">App Store &amp; Google Play compliant</span>
          <span className="badge">UK based</span>
        </div>
      </div>
    </section>
  );
}
