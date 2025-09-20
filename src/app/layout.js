import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        <Header />
        <HeaderSpacer /> {/* route-aware spacer */}
        {children}
      </body>
    </html>
  );
}
