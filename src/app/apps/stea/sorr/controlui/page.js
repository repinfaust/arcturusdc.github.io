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
              '1. User starts in Claude (general reasoning/drafting).',
              '2. Governed trigger detected: internal data, agent, workspace, or formal output.',
              '3. SoRR classifies request and resolves policy bundle (use case, tier, rules).',
              '4. Route selected: auto-approve, human approval, or governed workspace.',
              '5. SoRR executes via governed Claude API and returns response + audit log to user.',
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
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74' }}>No governed trigger -> continue in Claude (general path)</div>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74' }}>Governed trigger -> handoff to SoRR boundary + policy checks</div>
            <div style={{ background: '#FFFFFF', borderRadius: 12, padding: 11, color: '#4C5D74' }}>SoRR route -> Auto-approve | Human approval | Governed workspace</div>
            <div style={{ background: '#DDF9EE', borderRadius: 12, padding: 11, color: '#006C50', fontWeight: 600 }}>Fulfil via governed Claude API -> response returned + auditable loop closed</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, background: '#EFF4FF', borderRadius: 16, padding: 18 }}>
        <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Closed Loop Graphic
        </div>
        <div style={{ marginTop: 5, color: '#4C5D74', fontSize: 14 }}>
          Claude handles general thinking. SoRR governs requests that touch enterprise data/tools and closes the loop with audited responses.
        </div>

        <svg viewBox="0 0 760 640" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block', marginTop: 12 }}>
          <defs>
            <marker id="mt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#00D6A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="mn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#10294D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="mo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#FF5B33" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <text x="98" y="209" textAnchor="middle" fontSize="11" fill="#64748B">General use only</text>

          <rect x="282" y="166" width="196" height="56" rx="12" fill="#10294D" />
          <text x="380" y="190" textAnchor="middle" fontSize="14" fontWeight="700" fill="#00D6A3">SoRR Control</text>
          <text x="380" y="208" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)">Classify · resolve · route</text>

          <rect x="152" y="288" width="144" height="52" rx="8" fill="#E1F5EE" stroke="#6ee7b7" strokeWidth="1" />
          <text x="224" y="311" textAnchor="middle" fontSize="12" fontWeight="600" fill="#065f46">Classify request</text>
          <text x="224" y="329" textAnchor="middle" fontSize="10" fill="#0F6E56">3-stage · fail-closed</text>

          <rect x="464" y="288" width="144" height="52" rx="8" fill="#EEF2F7" stroke="#c7d2fe" strokeWidth="1" />
          <text x="536" y="311" textAnchor="middle" fontSize="12" fontWeight="600" fill="#10294D">Policy bundle</text>
          <text x="536" y="329" textAnchor="middle" fontSize="10" fill="#64748B">Use case · tier · rules</text>

          <rect x="48" y="406" width="132" height="52" rx="8" fill="#E1F5EE" stroke="#6ee7b7" strokeWidth="1" />
          <text x="114" y="429" textAnchor="middle" fontSize="12" fontWeight="600" fill="#065f46">Auto-approve</text>
          <text x="114" y="447" textAnchor="middle" fontSize="10" fill="#0F6E56">Matched use case</text>

          <rect x="314" y="406" width="132" height="52" rx="8" fill="#FFF7ED" stroke="#fcd34d" strokeWidth="1" />
          <text x="380" y="429" textAnchor="middle" fontSize="12" fontWeight="600" fill="#92400e">Human approval</text>
          <text x="380" y="447" textAnchor="middle" fontSize="10" fill="#92400e">New or high-risk</text>

          <rect x="580" y="406" width="132" height="52" rx="8" fill="#EDE9FE" stroke="#c4b5fd" strokeWidth="1" />
          <text x="646" y="429" textAnchor="middle" fontSize="12" fontWeight="600" fill="#5b21b6">Gov. workspace</text>
          <text x="646" y="447" textAnchor="middle" fontSize="10" fill="#6b21a8">Cowork + policy</text>

          <rect x="200" y="524" width="360" height="56" rx="12" fill="#10294D" />
          <text x="380" y="549" textAnchor="middle" fontSize="13" fontWeight="700" fill="#00D6A3">Claude API</text>
          <text x="380" y="568" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.5)">Governed prompt · server-side only · audited</text>

          <path d="M 322 65 Q 210 106 174 168" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="7 4" markerEnd="url(#ms)" />
          <path d="M 380 76 L 380 166" fill="none" stroke="#00D6A3" strokeWidth="2" strokeDasharray="7 3" markerEnd="url(#mt)" />
          <path d="M 334 222 Q 305 254 300 288" fill="none" stroke="#00D6A3" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#mt)" />
          <path d="M 436 222 Q 468 254 508 288" fill="none" stroke="#64748B" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />
          <path d="M 196 340 Q 168 374 168 406" fill="none" stroke="#0F6E56" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#mt)" />
          <path d="M 272 332 Q 335 372 352 406" fill="none" stroke="#FF5B33" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#mo)" />
          <path d="M 576 332 Q 618 370 624 406" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />
          <path d="M 148 458 Q 196 492 250 524" fill="none" stroke="#0F6E56" strokeWidth="2" strokeDasharray="6 3" markerEnd="url(#mt)" />
          <path d="M 380 458 L 380 524" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" markerEnd="url(#ms)" />
          <path d="M 614 458 Q 572 492 510 524" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#ms)" />
          <path d="M 558 552 Q 726 510 724 310 Q 722 112 488 60" fill="none" stroke="#10294D" strokeWidth="2" strokeDasharray="8 3" markerEnd="url(#mn)" />
          <path d="M 98 168 Q 78 96 282 44" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" markerEnd="url(#ms)" />
        </svg>

        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 14, color: '#4C5D74', fontSize: 12 }}>
          <span><strong style={{ color: '#00D6A3' }}>—</strong> Governed path (SoRR)</span>
          <span><strong style={{ color: '#94a3b8' }}>—</strong> General path (Claude)</span>
          <span><strong style={{ color: '#FF5B33' }}>—</strong> Approval required</span>
          <span><strong style={{ color: '#8b5cf6' }}>—</strong> Governed workspace</span>
          <span><strong style={{ color: '#10294D' }}>—</strong> Response returned</span>
        </div>
      </div>
    </ProductPocShell>
  );
}
