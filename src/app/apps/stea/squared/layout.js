import { Archivo, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import SquaredShell from './_components/SquaredShell';

// Squared type system (planning/design/career-ops-forces): Archivo condensed
// black for headlines, IBM Plex Sans for UI, IBM Plex Mono for data.
const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-sq-display', display: 'swap' });
const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sq-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sq-mono', display: 'swap' });

export const metadata = {
  title: 'Squared | STEa Studio',
  description: 'Honest job-search triage for people leaving the Armed Forces — roles that genuinely fit, a straight assessment, and your service in words an employer understands.',
};

export default function SquaredLayout({ children }) {
  return (
    <div className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <SquaredShell>{children}</SquaredShell>
    </div>
  );
}
