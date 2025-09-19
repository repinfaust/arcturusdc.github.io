import Link from "next/link";
import Image from "next/image";
import HeroWithCapabilities from "@/components/HeroWithCapabilities";
import HeroWithApps from "@/components/HeroWithApps";

export const metadata = {
  title: "Arcturus Digital Consultancy",
  description:
    "Apps and digital products that solve real problems — privacy-first and compliant from day one.",
};

export default function Home() {
  // Pick one if you want to swap later:
  // const HEADLINE = "Apps that solve real problems.";
  // const HEADLINE = "Focused apps, built for people.";
  const HEADLINE = "Practical software for real needs.";

  const BLURB =
    "Arcturus Digital Consultancy builds apps and digital products that focus on real-world problems — not technology for its own sake. From ADHD support to family organisation and fitness planning, every product is designed around a clear need, with privacy and compliance built in from the start.";

  return (
    <main className="relative">
      {/* Mobile brand strip (between pill and hero) */}
      <div className="sm:hidden mx-auto max-w-6xl px-4 mt-2 mb-1 flex items-center gap-2">
        <Image
          src="/img/logo-mark.svg"
          alt="Arcturus Digital Consultancy"
          width={36}
          height={36}
          className="rounded-full"
          priority
        />
        <span className="text-neutral-900 text-base font-semibold">
          Arcturus Digital Consultancy
        </span>
      </div>

      {/* Top intro */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:pt-14">
        <div className="grid lg:grid-cols-1 gap-6">
          <div className="rounded-2xl bg-white border border-neutral-200/70 p-8 shadow-sm">
            <p className="text-xs font-semibold text-red-600 mb-3">
              Product & Apps
            </p>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900">
              {HEADLINE}
            </h1>

            <p className="mt-3 text-neutral-700 max-w-prose">{BLURB}</p>

            <div className="mt-5 flex gap-3">
              <Link
                href="/apps"
                className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-white font-medium shadow hover:bg-red-700"
              >
                Explore apps
              </Link>
              <Link
                href="/capabilities" // 👈 updated link
                className="inline-flex items-center rounded-xl border border-neutral-300 px-4 py-2 text-neutral-800 hover:bg-neutral-50"
              >
                Capabilities
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-neutral-700">
                UK Ltd
              </span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-neutral-700">
                App Store &amp; Google Play compliant
              </span>
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-neutral-700">
                UK based
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities hero */}
      <HeroWithCapabilities />

      {/* Apps hero (orange image) */}
      <HeroWithApps />
    </main>
  );
}
