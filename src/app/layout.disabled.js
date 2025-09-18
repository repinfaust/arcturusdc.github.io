import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'Arcturus Digital Consulting',
  description: 'Pragmatic product and app development that actually ships.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        {/* Floating header */}
        <Header />

        {/* Spacer so content doesn't sit under the fixed header */}
        <div className="h-20 md:h-24" />

        {/* Page content container */}
        <div className="mx-auto max-w-[1120px] px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
