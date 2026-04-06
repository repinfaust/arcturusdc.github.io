import CareerOpsShell from './_components/CareerOpsShell';

export const metadata = {
  title: 'Career Ops | STEa Studio',
  description: 'AI-powered PM job search pipeline for Senior/Lead/Principal roles.',
};

export default function CareerOpsLayout({ children }) {
  return (
    <CareerOpsShell
      activeTab="/apps/stea/career"
      title="Career Ops"
      subtitle="AI-powered PM job search pipeline."
    >
      {children}
    </CareerOpsShell>
  );
}
