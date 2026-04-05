import Image from "next/image";
import { useEffect, useState } from "react";
import AppCardProduct from "./AppCardProduct";
import appsData from "@/data/apps.json";

const fire = (...args) => (window.adc?.gtag || window.gtag || function(){})?.(...args);

export default function HeroWithApps() {
  const [sentImpression, setSentImpression] = useState(false);

  const liveApps = appsData.filter(app => app.status === 'live');

  useEffect(() => {
    if (sentImpression) return;
    const el = document.getElementById("apps");
    if (!el) return;

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (!sentImpression && e.isIntersecting && e.intersectionRatio >= 0.5) {
            setSentImpression(true);
            fire("event", "adc_section_view", {
              section_id: "apps-hero",
              component_name: "HeroWithApps",
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
      id="apps"
      aria-label="Apps"
      className="
        relative
        w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]
        py-16 sm:py-24 mb-16 sm:mb-24
      "
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/img/network-orange-hero-2560.png"
          alt="Abstract network (orange)"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/6 to-black/25" />
      </div>

      <div className="mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-[1200px]">
        {/* Main Intro Card */}
        <div
          className={[
            "relative",
            "rounded-3xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-2xl",
            "px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10",
          ].join(" ")}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] leading-tight font-extrabold text-neutral-900 mb-4">
            Apps
          </h2>

          <p className="text-neutral-700 max-w-prose text-lg leading-relaxed">
            Every app is built with a clear purpose: to solve one problem well. The portfolio includes
            ADHD motivation, shared-care family organisation, and fitness planning — each designed to
            meet a need in a way that’s simple, compliant, and privacy-first.
          </p>

          <a
            href="/apps"
            className="mt-6 inline-flex items-center rounded-xl bg-red-600 px-6 py-3 text-white font-semibold shadow-lg hover:bg-red-700 transition-colors"
            data-analytics="button"
            data-name="Apps hero: Browse apps"
            data-component="HeroWithApps"
            data-location="hero"
          >
            Browse apps →
          </a>

          <div className="mt-8 badges !justify-start">
            <span className="badge">Real needs solved</span>
            <span className="badge">No feature bloat</span>
            <span className="badge">App-store ready</span>
          </div>
        </div>

        {/* Live Now Section */}
        {liveApps.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <div className="mb-8 max-w-2xl">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Live now
              </h3>
              <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed">
                Available to use today.
              </p>
            </div>
            <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {liveApps.map((app) => (
                <AppCardProduct key={app.id} app={app} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
