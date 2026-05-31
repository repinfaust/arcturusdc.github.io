import CareerOpsShell from './_components/CareerOpsShell';

export const metadata = {
  title: 'Career Ops | STEa Studio',
  description: 'AI-powered job search pipeline — analyse roles, score fit, tailor your CV.',
};

export default function CareerOpsLayout({ children }) {
  return (
    <CareerOpsShell
      activeTab="/apps/stea/career"
      title="Career Ops"
      subtitle="AI-powered job search pipeline — analyse any role, score your fit, tailor your CV."
    >
      {children}
    </CareerOpsShell>
  );
}
