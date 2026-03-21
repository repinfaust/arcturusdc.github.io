import ProductPocShell from '../_components/ProductPocShell';

const STATES = [
  {
    title: 'State A: Continue Normally',
    body: 'No additional controls needed. Continue in Claude.',
    tone: '#DDF9EE',
    text: '#006C50',
  },
  {
    title: 'State B: Approved Capability Available',
    body: 'This task can use approved product data and analysis tools. Continue in the governed SoRR workspace (via API execution).',
    tone: '#EFF4FF',
    text: '#10294D',
  },
  {
    title: 'State C: Approval Required',
    body: 'This task needs approval before accessing company data. Approval request created. If approved, execution continues in the governed SoRR workspace (via API execution).',
    tone: '#FFEFE3',
    text: '#9A3D08',
  },
  {
    title: 'State D: Governed Workspace Required',
    body: 'This task is better handled in an approved workspace. Open workspace.',
    tone: '#EFF4FF',
    text: '#10294D',
  },
  {
    title: 'State E: Unmatched / Blocked',
    body: 'I could not match this request to an approved workflow for enterprise tools.',
    tone: '#FFDCD7',
    text: '#8A1C17',
  },
];

export default function SorrControlHandoffPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/handoff"
      title="Claude Handoff States"
      subtitle="User-facing intervention moments presented in plain product language, not policy jargon."
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {STATES.map((state) => (
          <div key={state.title} style={{ background: state.tone, borderRadius: 14, padding: 14 }}>
            <div style={{ color: state.text, fontWeight: 700 }}>{state.title}</div>
            <div style={{ marginTop: 4, color: '#4C5D74', fontSize: 14 }}>{state.body}</div>
          </div>
        ))}
      </div>
    </ProductPocShell>
  );
}
