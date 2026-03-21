import ProductPocShell from './_components/ProductPocShell';

export const metadata = {
  title: 'SoRR Control UI',
  description: 'SoRR governed orchestration POC for STEa.',
};

export default function SorrControlUiOverviewPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui"
      title="Claude For Thinking. SoRR For Governed Work."
      subtitle="Product teams use Claude normally. SoRR appears automatically only when tasks require approved company data, approved agents/tools, recurring workspaces, or formal organisational outputs."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 18 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Operating Model
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {[
              '1. User asks Claude for analysis or drafting.',
              '2. Boundary check detects whether governed capability is needed.',
              '3. Claude either continues directly or hands off to SoRR.',
              '4. SoRR routes to fast lane, approval, or governed workspace.',
              '5. Admin console retains full approvals and audit visibility.',
            ].map((line) => (
              <div key={line} style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74', fontSize: 14 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 18 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Lane Decision Flow
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#0B1C30', fontWeight: 600 }}>Claude Query</div>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74' }}>Boundary Check: data, agent, workspace, formal output?</div>
            <div style={{ background: '#DDF9EE', borderRadius: 12, padding: 11, color: '#006C50', fontWeight: 600 }}>Continue In Claude (No governed trigger)</div>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74' }}>OR SoRR Route:</div>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74' }}>Fast Lane | Approval Required | Governed Workspace | Blocked</div>
          </div>
        </div>
      </div>
    </ProductPocShell>
  );
}
