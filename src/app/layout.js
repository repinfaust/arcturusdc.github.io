import "./globals.css";
import Header from "@/components/Header";
import HeaderSpacer from "@/components/HeaderSpacer";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Arcturus Digital Consulting",
  description: "Pragmatic product and app development that actually ships.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        <Header />
        <HeaderSpacer />
        <main>{children}</main>
        <Footer />   {/* will only show after page content */}
      </body>
    </html>
  );
}
