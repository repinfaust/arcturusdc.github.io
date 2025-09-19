import apps from "@/data/apps.json";
import AppsClient from "./AppsClient";

export const metadata = { title: "Apps — Arcturus Digital Consultancy" };

export default function AppsPage() {
  return (
    <main className="py-10">
      <h1 className="text-4xl font-extrabold mb-4">Apps</h1>
      <p className="text-neutral-700 max-w-3xl">
        Policies, platforms, and specifics for each app — kept compliant and privacy-first.
        <br className="hidden sm:block" />
        <span className="sm:ml-1">
          Our portfolio focuses on solving real problems in clear niches, without adding tech for the sake of it.
        </span>
      </p>

      <AppsClient apps={apps} />
    </main>
  );
}
