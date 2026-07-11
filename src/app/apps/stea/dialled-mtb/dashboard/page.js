import DialledDashboardClient from './DialledDashboardClient';

export const metadata = {
  title: 'Analytics — Dialled MTB',
  robots: { index: false, follow: false },
};

export default function DialledDashboardPage() {
  return <DialledDashboardClient />;
}
