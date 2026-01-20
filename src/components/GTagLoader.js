"use client";

import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // e.g. G-XXXXXX

export default function GTagLoader() {
  if (!GA_ID) return null;

  return (
    <>
      {/* Data layer + gtag stub */}
      <Script id="ga4-datalayer" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }
          window.gtag = gtag;

          // Start with analytics denied – consent manager will flip this
          gtag('consent', 'default', { analytics_storage: 'denied' });

          // Optional: user property scaffolding (no PII)
          gtag('set', 'user_properties', { analytics_consent: 'false' });
        `}
      </Script>

      {/* GA library */}
      <Script
        id="ga4-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />

      {/* Config (won’t drop cookies until consent is granted) */}
      <Script id="ga4-config" strategy="afterInteractive">
        {`
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
