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

        <svg viewBox="0 0 760 640" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block', marginTop: 12 }}>
          <defs>
            <marker id="mt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#00D6A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="mn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#10294D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="ms" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          <rect x="295" y="20" width="170" height="56" rx="12" fill="#10294D" />
          <text x="380" y="44" textAnchor="middle" fontSize="13" fontWeight="600" fill="#fff">User / Product team</text>
          <text x="380" y="63" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)">PM · support · analyst</text>

          <rect x="22" y="168" width="152" height="52" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
          <text x="98" y="191" textAnchor="middle" fontSize="13" fontWeight="600" fill="#10294D">Claude</text>
          <text x="98" y="209" textAnchor="middle" fontSize="11" fill="#64748B">General thinking</text>

          <rect x="268" y="162" width="224" height="64" rx="12" fill="#10294D" />
          <text x="380" y="188" textAnchor="middle" fontSize="14" fontWeight="700" fill="#00D6A3">SoRR Execution Layer</text>
          <text x="380" y="207" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)">Access · control · audit</text>

          <rect x="152" y="288" width="144" height="52" rx="8" fill="#E1F5EE" stroke="#6ee7b7" strokeWidth="1" />
          <text x="224" y="311" textAnchor="middle" fontSize="12" fontWeight="600" fill="#065f46">Review access</text>
          <text x="224" y="329" textAnchor="middle" fontSize="10" fill="#0F6E56">3-stage, fail-closed</text>

          <rect x="464" y="288" width="144" height="52" rx="8" fill="#EEF2F7" stroke="#c7d2fe" strokeWidth="1" />
          <text x="536" y="311" textAnchor="middle" fontSize="12" fontWeight="600" fill="#10294D">What happens next</text>
          <text x="536" y="329" textAnchor="middle" fontSize="10" fill="#64748B">lane + controls</text>

          <rect x="48" y="406" width="132" height="52" rx="8" fill="#E1F5EE" stroke="#6ee7b7" strokeWidth="1" />
          <text x="114" y="429" textAnchor="middle" fontSize="12" fontWeight="600" fill="#065f46">Auto-approve</text>
          <text x="114" y="447" textAnchor="middle" fontSize="10" fill="#0F6E56">matched flow</text>

          <rect x="314" y="406" width="132" height="52" rx="8" fill="#FFF7ED" stroke="#fcd34d" strokeWidth="1" />
          <text x="380" y="429" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e">Human approval</text>
          <text x="380" y="447" textAnchor="middle" fontSize="10" fill="#92400e">higher risk</text>

          <rect x="580" y="406" width="132" height="52" rx="8" fill="#EDE9FE" stroke="#c4b5fd" strokeWidth="1" />
          <text x="646" y="429" textAnchor="middle" fontSize="12" fontWeight="600" fill="#5b21b6">Governed workspace</text>
          <text x="646" y="447" textAnchor="middle" fontSize="10" fill="#6b21a8">persistent work</text>

          <rect x="200" y="524" width="360" height="56" rx="12" fill="#10294D" />
          <text x="380" y="549" textAnchor="middle" fontSize="13" fontWeight="700" fill="#00D6A3">AI Execution (via Claude)</text>
          <text x="380" y="568" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)">governed prompt, server-side, audited</text>

          <path d="M 322 65 Q 210 106 174 168" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="7 4" markerEnd="url(#ms)" />
          <path d="M 380 76 L 380 162" fill="none" stroke="#00D6A3" strokeWidth="2" strokeDasharray="7 3" markerEnd="url(#mt)" />
          <path d="M 334 226 Q 305 254 300 288" fill="none" stroke="#00D6A3" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#mt)" />
          <path d="M 436 226 Q 468 254 508 288" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />
          <path d="M 196 340 Q 168 374 168 406" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#mt)" />
          <path d="M 272 332 Q 335 372 352 406" fill="none" stroke="#FF5B33" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />
          <path d="M 576 332 Q 618 370 624 406" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />
          <path d="M 148 458 Q 196 492 250 524" fill="none" stroke="#0F6E56" strokeWidth="2" strokeDasharray="6 3" markerEnd="url(#mt)" />
          <path d="M 380 458 L 380 524" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" markerEnd="url(#ms)" />
          <path d="M 614 458 Q 572 492 510 524" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />

          <path d="M 236 580 Q 130 560 98 220" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="7 4" markerEnd="url(#ms)" />
          <text x="120" y="520" fontSize="10" fill="#64748B">summary / insight</text>

          <path d="M 524 580 Q 680 560 666 466" fill="none" stroke="#10294D" strokeWidth="2" strokeDasharray="8 3" markerEnd="url(#mn)" />
          <text x="620" y="545" fontSize="10" fill="#10294D">report / workspace / artefact</text>
        </svg>

        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 14, color: '#4C5D74', fontSize: 12 }}>
          <span><strong style={{ color: '#00D6A3' }}>—</strong> governed path (SoRR)</span>
          <span><strong style={{ color: '#94a3b8' }}>—</strong> general path (Claude)</span>
          <span><strong style={{ color: '#FF5B33' }}>—</strong> approval path</span>
          <span><strong style={{ color: '#8b5cf6' }}>—</strong> governed workspace path</span>
          <span><strong style={{ color: '#10294D' }}>—</strong> auditable return outcomes</span>
        </div>
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
