import Link from "next/link";
import Image from "next/image";
import HeroWithCapabilities from "@/components/HeroWithCapabilities";
import HeroWithApps from "@/components/HeroWithApps";
import MetaChips from "@/components/MetaChips";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description:
    "Apps and digital products that solve real problems — privacy-first and compliant from day one.",
};

export default function Home() {
  const HEADLINE = "Practical software for real needs.";

  const BLURB =
    "Arcturus Digital Consulting builds apps and digital products that focus on real-world problems — not technology for its own sake. From ADHD support to family organisation and fitness planning, every product is designed around a clear need, with privacy and compliance built in from the start.";

  return (
    <main className="relative">
      {/* Brand strip */}
      <div className="mx-auto max-w-6xl px-4 mt-2 mb-1 flex items-center gap-2">
        <Image
          src="/img/logo-mark.png"
          alt="Arcturus Digital Consulting"
          width={36}
          height={36}
          className="rounded-full"
          priority
        />
        <span className="text-neutral-900 text-base font-semibold">
          Arcturus Digital Consulting
        </span>
      </div>

      {/* Top intro */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:pt-14">
        <div className="grid lg:grid-cols-1 gap-6">
          <div className="rounded-2xl bg-white border border-neutral-200/70 p-8 shadow-sm">
            <p className="text-xs font-semibold text-red-600 mb-3">
              Product &amp; Apps
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
                href="/capabilities"
                className="inline-flex items-center rounded-xl border border-neutral-300 px-4 py-2 text-neutral-800 hover:bg-neutral-50"
              >
                Capabilities
              </Link>
            </div>

            {/* 🔁 Consistent, non-clickable chips */}
            <div className="mt-6">
              <MetaChips
                items={[
                  "UK Ltd",
                  "App Store & Google Play compliant",
                  "UK based",
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <HeroWithCapabilities />
      <HeroWithApps />
    </main>
  );
}
