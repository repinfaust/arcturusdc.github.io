import ProductPocShell from '../sorr/controlui/_components/ProductPocShell';

export const metadata = {
  title: 'Career Ops | David Loake',
  description: 'AI-powered job search pipeline for Senior/Lead/Principal PM roles.',
};

export default function CareerOpsLayout({ children }) {
  return (
    <ProductPocShell
      activeTab="/apps/stea/career"
      title="Career Ops"
      subtitle="AI-powered PM job search pipeline. High-fit only."
    >
      {children}
    </ProductPocShell>
  );
}
