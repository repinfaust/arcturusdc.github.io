"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C49YV15ZT6";

export default function RouteAnalytics() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const page_location = typeof window !== "undefined" ? window.location.href : "";
    const page_path = pathname + (search?.toString() ? `?${search.toString()}` : "");

    (window.adc?.gtag || window.gtag || function(){})("event", "page_view", {
      page_location,
      page_path,
      send_to: GA_ID,
    });
  }, [pathname, search]);

  return null;
}
