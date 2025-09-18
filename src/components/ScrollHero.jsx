"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Full-width (edge-to-edge) hero image that reveals on scroll.
 * - Parallax-ish effect on desktop (bg fixed feel)
 * - Dark vignette for text/contrast if you ever add headline/copy
 * - Uses full-bleed wrapper to break out of the layout container
 */
export default function ScrollHero() {
  // tiny fade-in as it enters viewport
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const onReady = () => setReady(true);
    // Next/Image fires once loaded; fallback to timer for cached images
    const t = setTimeout(onReady, 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      aria-label="Network hero"
      className={[
        // full-bleed trick: escape the centered container
        "relative ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen",
        // height (adjust to taste)
        "h-[70vh] md:h-[85vh] lg:h-[92vh]",
        // smooth reveal
        ready ? "opacity-100" : "opacity-0",
        "transition-opacity duration-500",
      ].join(" ")}
    >
      {/* image */}
      <Image
        src="/img/network-hero-2560.jpg" // <-- put your exported image here
        alt="Abstract network"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      {/* subtle vignette + grain for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/25" />
    </section>
  );
}
