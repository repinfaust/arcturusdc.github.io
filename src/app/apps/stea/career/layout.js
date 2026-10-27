import CareerOpsShell from './_components/CareerOpsShell';
import { enforceGate } from '@/lib/serverGate';

// Server-side gate (D-SITE-064): signed in, checked before anything renders.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Career Ops | STEa Studio',
  description: 'Honest job-search triage — find roles that genuinely fit, skip the ones that don\'t, and skip the application grind.',
};

export default async function CareerOpsLayout({ children }) {
  await enforceGate('/apps/stea/career');
  return (
    <CareerOpsShell
      activeTab="/apps/stea/career"
      title="Career Ops"
      subtitle="Honest job-search triage — find roles that genuinely fit, get a straight assessment, and skip the application grind."
    >
      {children}
    </CareerOpsShell>
  );
}
