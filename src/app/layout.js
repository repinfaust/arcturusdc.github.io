import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer"; // if you created one
import Script from "next/script";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C49YV15ZT6"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C49YV15ZT6');
          `}
        </Script>
      </head>
      <body className="bg-paper text-ink bg-starburst">
        <Header />
        {/* Spacer so content doesn't sit under the fixed header */}
        <div className="h-20 md:h-24" />
        {children}
        <Footer />
      </body>
    </html>
  );
}
