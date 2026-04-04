import apps from "@/data/apps.json";
import AppsClient from "./AppsClient";

export const metadata = { title: "Apps — Arcturus Digital Consulting" };

export default function AppsPage() {
  return (
    <main className="relative min-h-screen bg-apps-atmosphere">
      <div className="apps-network-texture" aria-hidden />
      <section className="relative z-10 border-b border-black/[0.04] bg-apps-hero-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#1a1a1a]">
            Apps
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-[#555] max-w-2xl leading-relaxed">
            Practical apps built to solve specific problems clearly.
            <span className="block mt-2">
              Designed to be useful, easy to understand, and privacy-conscious
              from the start.
            </span>
          </p>
        </div>
      </section>

      <section className="relative z-10 pb-12 sm:pb-16 lg:pb-20">
        <AppsClient apps={apps} />
      </section>
    </main>
  );
}
