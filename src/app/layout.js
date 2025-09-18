import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'Arcturus Digital Consulting',
  description: 'Pragmatic product, apps, and privacy-first delivery for regulated environments.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        <Header />
        <div className="max-w-[1120px] mx-auto px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
