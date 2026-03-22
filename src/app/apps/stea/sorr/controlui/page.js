import ProductPocShell from './_components/ProductPocShell';
import PocDocAssistant from './_components/PocDocAssistant';

export const metadata = {
  title: 'SoRR Control UI',
  description: 'SoRR governed orchestration POC for STEa.',
};

export default function SorrControlUiOverviewPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui"
      title="Use Claude normally. Move to SoRR only when needed."
      subtitle="Use the OpenAI panel below to summarise the docs/deck and quickly understand what SoRR Control is, why it exists, and when it should be used."
    >
      <div style={{ background: '#EFF4FF', borderRadius: 16, padding: 16, color: '#4C5D74', fontSize: 15, lineHeight: '24px', border: '1px solid #D6E0F4' }}>
        Claude stays your thinking interface. SoRR activates only for governed work: company data, approved tools, persistent workspaces, or formal outputs.
      </div>

      <PocDocAssistant
        compact
        title="Start Here: Ask OpenAI"
        subtitle="Shortcut: summarise the POC docs/deck to discover SoRR Control."
      />

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'linear-gradient(145deg, #F5F1EA 0%, #EFE7DA 100%)', borderRadius: 16, padding: 16, border: '1px solid #E5D7BE' }}>
          <div style={{ color: '#6A450D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Without SoRR
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Think and explore ideas',
              'Draft from pasted content',
              'Public information tasks',
            ].map((line) => (
              <div key={line} style={{ background: 'rgba(255,255,255,0.72)', borderRadius: 12, padding: 10, color: '#5F4B2B', fontSize: 14, border: '1px solid #E5D7BE' }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #EAF8F2 0%, #DEF2E9 100%)', borderRadius: 16, padding: 16, border: '1px solid #BFE7D6' }}>
          <div style={{ color: '#0F6E56', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            With SoRR
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Access approved company datasets',
              'Run approved analysis agents',
              'Generate shareable, auditable outputs',
              'Use governed workspaces when required',
            ].map((line) => (
              <div key={line} style={{ background: 'rgba(255,255,255,0.72)', borderRadius: 12, padding: 10, color: '#0C6650', fontSize: 14, border: '1px solid #BFE7D6' }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'linear-gradient(145deg, #EAF0FF 0%, #DEE7FF 100%)', borderRadius: 16, padding: 16, border: '1px solid #C5D3FA' }}>
          <div style={{ color: '#1D3C8A', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            When does work move into SoRR?
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'Company data (not pasted manually)',
              'Approved agents or tools',
              'Outputs that will be shared or stored',
              'Ongoing governed workspace work',
            ].map((line) => (
              <div key={line} style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 12, padding: 10, color: '#1E3A8A', fontSize: 14, border: '1px solid #C5D3FA' }}>
                {line}
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(145deg, #F2EBFF 0%, #E9E2FF 100%)', borderRadius: 16, padding: 16, border: '1px solid #D0C3F7' }}>
          <div style={{ color: '#4A2B90', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            What happens next?
          </div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              'SoRR applies access + policy controls',
              'Work continues in approved lane',
              'Auto-approve, approval, or governed workspace',
              'Blocked only when no approved enterprise path exists',
            ].map((line) => (
              <div key={line} style={{ background: 'rgba(255,255,255,0.75)', borderRadius: 12, padding: 10, color: '#5530A5', fontSize: 14, border: '1px solid #D0C3F7' }}>
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
          Claude for thinking. SoRR for governed execution and auditable outcomes.
        </div>

        <img
          src="/img/sorr/sorr-closed-loop.svg"
          alt="Closed loop graphic showing Claude for general thinking and SoRR execution paths for auto-approval, human approval, and governed workspace outcomes."
          style={{ width: '100%', display: 'block', marginTop: 12, borderRadius: 12 }}
        />
      </div>

    </ProductPocShell>
  );
}
