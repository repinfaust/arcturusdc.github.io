import ProductPocShell from '../_components/ProductPocShell';

const CASES = [
  {
    id: 'UC-01',
    prompt: 'Analyse churn across our last three customer cohorts.',
    trigger: 'Needs approved internal dataset.',
    route: 'Likely immediate if role + data permission already approved.',
    value: 'Shows governed data access without user-facing compliance friction.',
  },
  {
    id: 'UC-02',
    prompt: 'Combine feature adoption data with support feedback themes and summarise likely drivers.',
    trigger: 'Cross-source analysis with potentially sensitive internal signals.',
    route: 'Likely approval or controlled agent route.',
    value: 'Demonstrates SoRR routing for higher-complexity product analysis.',
  },
  {
    id: 'UC-03',
    prompt: 'Run the pricing review agent against this quarter’s usage data.',
    trigger: 'Approved internal agent + approved dataset.',
    route: 'Likely immediate when agent/data permissions are satisfied.',
    value: 'Shows policy-brokered agent execution instead of direct unrestricted tool use.',
  },
  {
    id: 'UC-04',
    prompt: 'Create a workspace that tracks onboarding drop-off weekly and updates the report.',
    trigger: 'Persistence, recurring updates, and organisational reporting.',
    route: 'Open governed workspace.',
    value: 'Makes clear that persistent/recurring work enters controlled workspace mode.',
  },
  {
    id: 'UC-05',
    prompt: 'Turn this analysis into a product update for leadership.',
    trigger: 'Formal organisational artefact for wider circulation.',
    route: 'Approval required.',
    value: 'Shows review gate before broad distribution of sensitive strategic output.',
  },
];

export default function SorrControlUseCasesPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/use-cases"
      title="Product-Governed Use Cases"
      subtitle="Examples focus on product workflows, not incident or infra-first scenarios."
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {CASES.map((item) => (
          <div key={item.id} style={{ background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
            <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{item.id}</div>
            <div style={{ marginTop: 5, color: '#0B1C30', fontWeight: 600, fontSize: 15 }}>{item.prompt}</div>
            <div style={{ marginTop: 5, color: '#4C5D74', fontSize: 14 }}><strong>Trigger:</strong> {item.trigger}</div>
            <div style={{ marginTop: 2, color: '#4C5D74', fontSize: 14 }}><strong>Likely Route:</strong> {item.route}</div>
            <div style={{ marginTop: 2, color: '#4C5D74', fontSize: 14 }}><strong>Why SoRR matters:</strong> {item.value}</div>
          </div>
        ))}
      </div>
    </ProductPocShell>
  );
}
