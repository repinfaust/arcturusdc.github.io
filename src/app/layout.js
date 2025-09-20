import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer"; // <-- add this

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        <Header />
        {/* Route-aware spacer (big on home, tight elsewhere) */}
        <HeaderSpacer />
        {children}
      </body>
    </html>
  );
}
