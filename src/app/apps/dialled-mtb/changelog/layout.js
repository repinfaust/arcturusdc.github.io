// Changelog segment layout: loads Space Mono via next/font (weights 400/700
// only, per the locked design contract §2.1) and exposes it as a CSS variable
// consumed inside the scoped tech-tree styles.
import { Space_Mono } from 'next/font/google';

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
});

export default function ChangelogLayout({ children }) {
  return <div className={spaceMono.variable}>{children}</div>;
}
