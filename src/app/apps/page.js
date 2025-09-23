import Image from "next/image";
import apps from "@/data/apps.json";
import AppsClient from "./AppsClient";

export const metadata = { title: "Apps — Arcturus Digital Consulting" };

export default function AppsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative">
        <Image
          src="/img/all_apps_hero_background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl font-extrabold mb-4 text-white drop-shadow-lg">
            Apps
          </h1>
          <p className="text-white/90 max-w-[60ch] drop-shadow">
            Policies, platforms, and specifics for each app — kept compliant and
            privacy-first. Our portfolio focuses on solving real problems in
            clear niches, without adding tech for the sake of it.
          </p>
        </div>
      </section>

      {/* Cards (centered) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="w-full max-w-5xl">
          <AppsClient apps={apps} />
        </div>
      </section>
    </main>
  );
}
