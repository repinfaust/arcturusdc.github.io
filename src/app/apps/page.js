import apps from "@/data/apps.json";
import AppsClient from "./AppsClient";

export const metadata = { title: "Apps — Arcturus Digital Consulting" };

export default function AppsPage() {
  return (
    <div className="w-screen -ml-[calc(50vw-50%)] bg-[#ece6d8] text-[#1c1c1a]">
      <AppsClient apps={apps} />
    </div>
  );
}
