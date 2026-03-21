import { Inter, Manrope } from 'next/font/google';
import SorrRouteAuthGate from './_components/SorrRouteAuthGate';

const inter = Inter({ subsets: ['latin'], variable: '--font-controlui-body' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-controlui-display' });

export default function SorrControlUiLayout({ children }) {
  return (
    <div
      className={`${inter.variable} ${manrope.variable} min-h-screen px-4 py-6 [font-family:var(--font-controlui-body)] md:px-8`}
      style={{
        backgroundColor: '#0A1220',
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0), radial-gradient(circle at 25% -10%, rgba(35,76,132,0.35), transparent 40%)',
        backgroundSize: '22px 22px, auto',
      }}
    >
      <SorrRouteAuthGate>{children}</SorrRouteAuthGate>
    </div>
  );
}
