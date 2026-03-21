import { Inter, Manrope } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-controlui-body' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-controlui-display' });

export default function SorrControlUiLayout({ children }) {
  return (
    <div className={`${inter.variable} ${manrope.variable} min-h-screen bg-[radial-gradient(circle_at_20%_0%,#d6e6ff_0,#f8f9ff_38%,#f8f9ff_100%)] px-4 py-6 [font-family:var(--font-controlui-body)] md:px-8`}>
      {children}
    </div>
  );
}
