import apps from "@/data/apps.json";
import AppsClient from "./AppsClient";

export const metadata = { title: "Apps — Arcturus Digital Consulting" };

export default function AppsPage() {
  return (
    <main className="py-12">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold mb-4">Apps</h1>

        <p className="text-neutral-700 max-w-[60ch]">
          Policies, platforms, and specifics for each app — kept compliant and privacy-first.
          Our portfolio focuses on solving real problems in clear niches, without adding tech for the sake of it.
        </p>

        <div className="mt-8">
          <AppsClient apps={apps} />
        </div>
      </section>
    </main>
  );
}
