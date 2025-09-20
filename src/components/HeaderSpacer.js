"use client";

import { usePathname } from "next/navigation";

export default function HeaderSpacer() {
  const pathname = usePathname();

  // Home page is the only one that gets the big space
  const isHome = pathname === "/";

  // Tight everywhere else (and you can add extra rules if needed)
  const tight =
    !isHome ||
    pathname.startsWith("/apps/") ||
    pathname === "/contact";

  const cls = tight ? "h-6 md:h-8" : "h-20 md:h-24"; // small vs large

  return <div className={cls} aria-hidden="true" />;
}
