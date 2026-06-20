import { EB_Garamond } from 'next/font/google';
import RepinfaustClient from './RepinfaustClient';
import styles from './repinfaust.module.css';

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--repinfaust-serif',
});

export const metadata = {
  title: 'Repinfaust - STEa',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RepinfaustPage() {
  return (
    <main className={`${styles.route} ${ebGaramond.variable}`}>
      <RepinfaustClient />
    </main>
  );
}
