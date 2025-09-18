import './globals.css';

export const metadata = {
  title: 'Arcturus Digital Consulting',
  description: 'Pragmatic product and app development that actually ships.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body className="bg-paper text-ink bg-starburst">
        <div className="max-w-[1120px] mx-auto px-5">
          {children}
        </div>
      </body>
    </html>
  );
}
