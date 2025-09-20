// src/app/layout.js
import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";
import RouteAnalytics from "@/components/RouteAnalytics"; // 👈 new import

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

        {/* Global analytics hook (fires on route changes) */}
        <RouteAnalytics />

        {/* Page content */}
        <main>{children}</main>

        {/* Footer at the very bottom */}
        <Footer />
      </body>
    </html>
  );
}
