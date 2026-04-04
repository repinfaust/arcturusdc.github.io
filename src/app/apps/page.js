import apps from "@/data/apps.json";
import AppsClient from "./AppsClient";

export const metadata = { title: "Apps — Arcturus Digital Consulting" };

export default function AppsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 bg-starburst">
      <section className="relative border-b border-black/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900">
            Apps
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-neutral-600 max-w-2xl leading-relaxed">
            Practical apps built to solve specific problems clearly.
            <span className="block mt-2">
              Designed to be useful, easy to understand, and privacy-conscious
              from the start.
            </span>
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AppsClient apps={apps} />
        </div>
      </section>
    </main>
  );
}
