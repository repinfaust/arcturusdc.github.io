import Image from "next/image";
import Hero from "@/components/Hero";
import HeroWithCapabilities from "@/components/HeroWithCapabilities";
import HeroWithApps from "@/components/HeroWithApps";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description:
    "Apps and digital products that solve real problems — privacy-first and compliant from day one.",
};

export default function Home() {
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

      {/* HERO */}
      <Hero />

      {/* --- separation + in-page anchor target for the Capabilities button --- */}
      {/* This invisible anchor lets #capabilities scroll to a sensible spot even with sticky headers */}
      <div id="capabilities" className="relative h-0 -mt-16 sm:-mt-20" aria-hidden="true" />
      {/* Visual breathing room between hero and the next full-bleed section */}
      <div className="h-10 sm:h-16" />

      {/* CAPABILITIES */}
      <HeroWithCapabilities />

      {/* Space before the apps section so cards don't kiss each other on mobile */}
      <div className="h-10 sm:h-16" />

      {/* APPS */}
      <HeroWithApps />
    </main>
  );
}
