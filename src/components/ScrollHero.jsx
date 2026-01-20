"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Full-bleed image that reveals as you scroll */
export default function ScrollHero() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      aria-label="Network hero"
      className={[
        "relative z-10 ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen",
        "h-[70vh] md:h-[85vh] lg:h-[92vh]",
        ready ? "opacity-100" : "opacity-0",
        "transition-opacity duration-500",
      ].join(" ")}
    >
      <Image
        src="/img/network-hero-2560.png" // public/img/network-hero-2560.png
        alt="Abstract network"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/25" />
    </section>
  );
}
