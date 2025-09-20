"use client";

import { usePathname } from "next/navigation";

export default function HeaderSpacer() {
  const pathname = usePathname();

  // Big brand spacing ONLY on the homepage
  const isHome = pathname === "/";

  // Make contact extra-tight; apps tight; everything else tight
  const isContact = pathname === "/contact";
  const isApps = pathname.startsWith("/apps/");

  const cls = isHome ? "h-20 md:h-24" : isContact ? "h-2 md:h-3" : isApps ? "h-6 md:h-8" : "h-6 md:h-8";

  return <div className={cls} aria-hidden="true" />;
}
