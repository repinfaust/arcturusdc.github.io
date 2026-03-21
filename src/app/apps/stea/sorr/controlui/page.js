import ProductPocShell from './_components/ProductPocShell';

export const metadata = {
  title: 'SoRR Control UI',
  description: 'SoRR governed orchestration POC for STEa.',
};

export default function SorrControlUiOverviewPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui"
      title="Claude for thinking. SoRR for doing real work with company data."
      subtitle="Use Claude normally. When a task needs access to company data, approved agents, or persistent outputs, SoRR enables it with governance, approvals, and full audit applied automatically."
    >
      <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 16, color: '#4C5D74', fontSize: 15, lineHeight: '24px' }}>
        Claude is where product teams think, explore, and draft. When work needs company data, approved agents, or formal outputs, it moves into SoRR - a governed execution layer that applies permissions, approvals, and audit automatically. Claude remains the interface; SoRR enables it to operate safely in a real business context.
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 16 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Without SoRR
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Think and explore ideas',
              'Draft from pasted content',
              'Work with public information',
              'One-off analysis',
            ].map((line) => (
              <div key={line} style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 16 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            With SoRR
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Access approved company datasets',
              'Run approved analysis agents',
              'Create persistent workspaces (Cowork-style)',
              'Generate shareable, auditable outputs',
              'Apply approvals and policy automatically',
            ].map((line) => (
              <div key={line} style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 16 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            When does work move into SoRR?
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Company data (not pasted manually)',
              'Approved agents or tools',
              'Ongoing or auto-updating work',
              'Outputs that will be shared or stored',
            ].map((line) => (
              <div key={line} style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 16 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            What happens next?
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Claude recognises the need',
              'SoRR applies the right controls',
              'Work continues in the correct lane',
              'Cannot use enterprise tools appears only when no approved path exists',
            ].map((line) => (
              <div key={line} style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, background: '#EFF4FF', borderRadius: 16, padding: 18 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Closed Loop Graphic
        </div>
        <div style={{ marginTop: 5, color: '#4C5D74', fontSize: 14 }}>
          Claude handles general thinking. SoRR enables governed work with company data, agents, and outputs, and returns auditable results.
        </div>

        <img
          src="/img/sorr/sorr-closed-loop.svg"
          alt="Closed loop graphic showing Claude for general thinking and SoRR execution paths for auto-approval, human approval, and governed workspace outcomes."
          style={{ width: '100%', display: 'block', marginTop: 12, borderRadius: 12 }}
        />
      </div>

      <div style={{ marginTop: 14, background: '#EFF4FF', borderRadius: 16, padding: 16 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          One-line Positioning
        </div>
        <div style={{ marginTop: 8, color: '#0B1C30', fontSize: 15, fontWeight: 600 }}>
          SoRR does not replace Claude - it enables it to operate safely inside your business.
        </div>
      </div>

      <div style={{ marginTop: 14, background: '#EFF4FF', borderRadius: 16, padding: 16 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Final Clarity
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
            Claude remains the interface for thinking and exploration.
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
            SoRR handles work that touches company data, approved workflows, or formal outputs.
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 10, color: '#4C5D74', fontSize: 14 }}>
            This keeps everyday use simple while ensuring governed work is secure, auditable, and controlled.
          </div>
        </div>
      </div>
    </ProductPocShell>
  );
}
