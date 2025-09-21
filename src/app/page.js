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

      {/* CAPABILITIES */}
      <HeroWithCapabilities />

      {/* APPS */}
      <HeroWithApps />
    </main>
  );
}
