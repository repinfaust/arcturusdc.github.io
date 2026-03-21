import ProductPocShell from '../_components/ProductPocShell';

export default function SorrControlImplementationPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/implementation"
      title="Implementation"
      subtitle="How governance is enforced in practice: architecture-level capability boundaries plus org-level Claude system-prompt handoff instructions."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Mechanism 1
          </div>
          <div style={{ marginTop: 5, color: '#10294D', fontWeight: 700 }}>Architectural enforcement</div>
          <div style={{ marginTop: 6, color: '#4C5D74', fontSize: 14 }}>
            Governed connectors, agents, and controlled workspace capabilities are not provisioned in raw Claude. Users cannot bypass governance because the capabilities do not exist outside SoRR.
          </div>
        </div>
        <div style={{ background: '#E6FCF3', borderRadius: 14, padding: 14 }}>
          <div style={{ color: '#006C50', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Mechanism 2
          </div>
          <div style={{ marginTop: 5, color: '#10294D', fontWeight: 700 }}>System-prompt interception</div>
          <div style={{ marginTop: 6, color: '#4C5D74', fontSize: 14 }}>
            An org-level Claude system prompt detects governed intent in plain language and returns a standard SoRR redirect message rather than attempting governed fulfilment in raw Claude.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Admin Setup Sequence
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          {[
            '1. Disable governed capabilities in raw Claude (no ungoverned connectors/agents/workspace creation).',
            '2. Apply organisation-level system prompt with governed-task detection and standard redirect output.',
            '3. Route governed tasks into SoRR Control as the only approved broker surface.',
          ].map((line) => (
            <div key={line} style={{ background: '#FFFFFF', borderRadius: 10, padding: 10, color: '#4C5D74', fontSize: 14 }}>{line}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#0F172A', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#53FDC7', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
          System Prompt Template (Excerpt)
        </div>
        <pre style={{ marginTop: 8, marginBottom: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0', fontSize: 12, lineHeight: '18px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
{`If user request involves internal datasets, approved agents, governed tools,
recurring workspace/reporting, or formal organisational outputs:
- do not fulfil directly in raw Claude
- return standard redirect:
  "This task needs a governed workflow. Open SoRR Control..."`}
        </pre>
      </div>

      <div style={{ marginTop: 12, background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Coverage by State
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
          {[
            'A Continue: no action needed',
            'B Approved capability: architectural + prompt guidance',
            'C Approval required: prompt redirect + SoRR workflow',
            'D Governed workspace: architectural + prompt guidance',
            'E Blocked: fail-closed route in SoRR',
          ].map((line) => (
            <div key={line} style={{ background: '#FFFFFF', borderRadius: 10, padding: 9, color: '#4C5D74', fontSize: 13 }}>{line}</div>
          ))}
        </div>
      </div>
    </ProductPocShell>
  );
}
