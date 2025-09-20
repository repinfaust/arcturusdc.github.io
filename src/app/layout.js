// src/app/layout.js (very top, before the default export)
export const dynamic = 'force-dynamic';

// src/app/layout.js
import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";
import RouteAnalytics from "@/components/RouteAnalytics";
import ConsentManager from "@/components/ConsentManager";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        {/* Floating header */}
        <Header />
        <HeaderSpacer />

        {/* Analytics hook (fires page_view on route change) */}
        <RouteAnalytics />

        {/* Consent manager (banner + preferences) */}
        <ConsentManager />

        {/* Page content */}
        <main>{children}</main>

        {/* Footer at bottom */}
        <Footer />
      </body>
    </html>
  );
}
