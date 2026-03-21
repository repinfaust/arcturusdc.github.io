import ProductPocShell from '../_components/ProductPocShell';

export default function SorrControlImplementationPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/implementation"
      title="Implementation"
      subtitle="How governance is enforced: architectural controls first, system-prompt interception second, with explicit user redirect behaviour and coverage mapping by state."
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Mechanism 1
          </div>
          <div style={{ marginTop: 5, color: '#10294D', fontWeight: 700 }}>Architectural enforcement</div>
          <div style={{ marginTop: 6, color: '#4C5D74', fontSize: 14 }}>
            Governed connectors, MCP tools, agents, Skills, and Cowork workspaces are not provisioned in raw Claude. Users cannot invoke them because the capabilities do not exist there.
          </div>
          <div style={{ marginTop: 8, background: '#FFFFFF', borderRadius: 999, display: 'inline-block', padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#10294D' }}>
            100% coverage - no bypass path
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
          <div style={{ marginTop: 8, background: '#FFFFFF', borderRadius: 999, display: 'inline-block', padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#006C50' }}>
            Catches plain-language governed requests
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Admin Setup Sequence
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          {[
            '1. Disable governed capabilities in raw Claude (no Skills, ungoverned MCP, or open workspace creation).',
            '2. Set org-level system prompt that detects governed intent and returns a standard SoRR redirect.',
            '3. Keep SoRR Control as the only governed fulfilment surface for enterprise actions.',
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
  "This task needs a governed workflow. Open SoRR Control..."

For all other requests: respond normally.`}
        </pre>
      </div>

      <div style={{ marginTop: 12, background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          What the user sees
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 10 }}>
            <div style={{ color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>State C - Approval required</div>
            <div style={{ marginTop: 6, color: '#334155', fontSize: 13, lineHeight: '20px' }}>
              This task needs a governed workflow. Open SoRR Control to classify and route your request in seconds.
            </div>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 10 }}>
            <div style={{ color: '#94A3B8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>State D - Governed workspace</div>
            <div style={{ marginTop: 6, color: '#334155', fontSize: 13, lineHeight: '20px' }}>
              This task needs a governed workflow. Open SoRR Control to route into approved workspace execution.
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Coverage by State
        </div>
        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
          {[
            'A Continue: no action needed',
            'B Approved capability: architectural enforcement (100%)',
            'C Approval required: system prompt interception + SoRR workflow',
            'D Workspace: architectural enforcement + system prompt guidance',
            'E Blocked: system prompt + fail-closed SoRR block',
          ].map((line) => (
            <div key={line} style={{ background: '#FFFFFF', borderRadius: 10, padding: 9, color: '#4C5D74', fontSize: 13 }}>{line}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#F0FAF7', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#0F6E56', fontWeight: 700, fontSize: 14 }}>Why architectural enforcement is primary</div>
        <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
          System prompts are high-accuracy, but architectural controls are absolute. If the tool does not exist in raw Claude, it cannot be invoked regardless of phrasing.
        </div>
      </div>

      <div style={{ marginTop: 10, background: '#FFF7ED', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#92400E', fontWeight: 700, fontSize: 14 }}>Important: redirect, do not refuse</div>
        <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
          The system should steer users to SoRR Control with a clear next step. Refusal-only responses drive workaround behaviour and reduce governed-surface adoption.
        </div>
      </div>
    </ProductPocShell>
  );
}
