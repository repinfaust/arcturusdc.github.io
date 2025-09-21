"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const fire = (...args) => (window.adc?.gtag || window.gtag || function(){})?.(...args);

export default function HeroWithCapabilities() {
  const [sentImpression, setSentImpression] = useState(false);

  useEffect(() => {
    if (sentImpression) return;
    const el = document.getElementById("capabilities");
    if (!el) return;

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!sentImpression && e.isIntersecting && e.intersectionRatio >= 0.5) {
            setSentImpression(true);
            fire("event", "adc_section_view", {
              section_id: "capabilities-hero",
              component_name: "HeroWithCapabilities",
              location: "hero",
            });
          }
        });
      },
      { threshold: [0.5] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sentImpression]);

  return (
    <section
      id="capabilities"
      aria-label="Capabilities"
      className="
        relative
        w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]
        py-16 sm:py-24 mb-16 sm:mb-24
      "
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
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

      {/* Card (normal flow) */}
      <div
        className={[
          "relative mx-auto",
          "w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]",
          "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
          "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
        ].join(" ")}
      >
        <h3 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-4">
          Capabilities
        </h3>

        <div className="grid gap-8 md:grid-cols-3 text-neutral-700">
          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">PS</div>
            <h4 className="font-semibold text-neutral-900 text-lg">Product strategy</h4>
            <p className="text-sm text-neutral-600">
              Helping organisations cut through noise to find and deliver the next most valuable
              outcome. The emphasis is on solving genuine problems in the simplest, most effective way.
            </p>
            <a
              href="/capabilities"
              className="mt-3 inline-block text-sm text-red-700 hover:underline"
              data-analytics="link"
              data-name="Capabilities hero: Learn more"
              data-component="HeroWithCapabilities"
              data-location="hero"
            >
              Learn more
            </a>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">AD</div>
            <h4 className="font-semibold text-neutral-900 text-lg">App development</h4>
            <p className="text-sm text-neutral-600">
              Design and build of Android and iOS apps with privacy-first principles. Each app is
              focused on a niche where existing tools are either too generic or too complex,
              ensuring usability and compliance without unnecessary features.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-500 mb-1">DA</div>
            <h4 className="font-semibold text-neutral-900 text-lg">Data &amp; analytics</h4>
            <p className="text-sm text-neutral-600">
              From setup to insight, data is handled with clarity and purpose. No spin, no vanity
              metrics — just reliable instrumentation and reporting that support decision-making and
              improvement.
            </p>
          </div>
        </div>

        <div className="mt-6 badges">
          <span className="badge">Discovery</span>
          <span className="badge">Compliance support</span>
          <span className="badge">Delivery ops</span>
        </div>
      </div>
    </section>
  );
}
