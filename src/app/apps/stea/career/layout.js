import CareerOpsShell from './_components/CareerOpsShell';

export const metadata = {
  title: 'Career Ops | STEa Studio',
  description: 'Honest job-search triage — find roles that genuinely fit, skip the ones that don\'t, and skip the application grind.',
};

export default function CareerOpsLayout({ children }) {
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
