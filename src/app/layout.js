// src/app/layout.js
export const dynamic = "force-dynamic";

import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";
import ConsentManager from "@/components/ConsentManager";
import AnalyticsBridge from "@/components/AnalyticsBridge";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C49YV15ZT6";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
  icons: {
    icon: '/img/logo-mark.png',
    shortcut: '/img/logo-mark.png',
    apple: '/img/logo-mark.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        {/* ----- Google Analytics (load once) ----- */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-bootstrap" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            window.adc = window.adc || {};
            window.adc.gtag = gtag;

            // Deny analytics until consent granted
            gtag('consent', 'default', { analytics_storage: 'denied' });

            // Init; disable auto page_view (we send manually)
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
          `}
        </Script>
        {/* -------------------------------------- */}

        <Header />
        <HeaderSpacer />

        {/* Centralised page_view + click tracking */}
        <AnalyticsBridge />

        {/* Consent banner (updates GA + nudges first page_view on accept) */}
        <ConsentManager />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}
