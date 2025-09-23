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
      {/* HERO */}
      <Hero />

      {/* CAPABILITIES */}
      <HeroWithCapabilities />

      {/* APPS */}
      <HeroWithApps />
    </main>
  );
}
