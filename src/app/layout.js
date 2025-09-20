// src/app/layout.js
export const dynamic = "force-dynamic";

import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";
import RouteAnalytics from "@/components/RouteAnalytics";
import ConsentManager from "@/components/ConsentManager";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C49YV15ZT6";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        {/* ----- Google Analytics (load once) ----- */}
        {/* 1) Load the GA library */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        {/* 2) Bootstrap gtag and a safe wrapper; default consent = denied */}
        <Script id="ga-bootstrap" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            // expose a safe alias used by our components
            window.adc = window.adc || {};
            window.adc.gtag = gtag;

            // Default to denied until user consents
            gtag('consent', 'default', { analytics_storage: 'denied' });

            // Init + config; don't auto-send page_view (we send it ourselves)
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
          `}
        </Script>
        {/* -------------------------------------- */}

        {/* Floating header */}
        <Header />
        <HeaderSpacer />

        {/* Pageview on route changes (only fires if consent is granted) */}
        <RouteAnalytics />

        {/* Consent banner + preferences; also nudges a page_view on accept */}
        <ConsentManager />

        {/* Page content */}
        <main>{children}</main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
