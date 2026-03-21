import ProductPocShell from '../_components/ProductPocShell';

export default function SorrControlFulfilmentLoopPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/fulfilment-loop"
      title="Fulfilment Loop"
      subtitle="How SoRR executes governed requests end-to-end and closes the response/audit loop without re-enabling governed operations inside raw Claude chat."
    >
      <div style={{ background: '#EFF6FF', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#1E40AF', fontWeight: 700, fontSize: 14 }}>Key principle</div>
        <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
          Claude is not re-enabled in the original redirected chat. SoRR becomes the governed fulfilment surface: it assembles the prompt server-side, calls Claude API, and returns the response inside SoRR with full audit linkage.
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#F0FAF7', borderRadius: 14, padding: 12 }}>
          <div style={{ color: '#0F6E56', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Path A</div>
          <div style={{ marginTop: 4, color: '#10294D', fontWeight: 700 }}>Auto-approve</div>
          <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
            Match use case, pass permission checks, assemble governed prompt, call Claude API, store response, then render with audit.
          </div>
        </div>
        <div style={{ background: '#EFF6FF', borderRadius: 14, padding: 12 }}>
          <div style={{ color: '#1E40AF', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Path B</div>
          <div style={{ marginTop: 4, color: '#10294D', fontWeight: 700 }}>Human approval</div>
          <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
            Approval-required request, approver action, Firestore status change, backend trigger, governed API call, then notification and audit.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 10, background: '#F5F3FF', borderRadius: 14, padding: 12 }}>
        <div style={{ color: '#6B21A8', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Path C</div>
        <div style={{ marginTop: 4, color: '#10294D', fontWeight: 700 }}>Governed workspace</div>
        <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
          SoRR opens a controlled workspace with policy context attached. Multi-turn governed work continues there; formal outputs still route through approval controls before distribution.
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#0F172A', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#53FDC7', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
          Firestore Trigger Model (Path B)
        </div>
        <pre style={{ marginTop: 8, marginBottom: 0, whiteSpace: 'pre-wrap', color: '#E2E8F0', fontSize: 12, lineHeight: '18px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
{`onApprovalWrite(approvalId, newData) {
  if (newData.status !== "approved") return;
  request = getRequest(newData.requestId);
  bundle = getBundle(request.resolvedPolicyBundleId);
  response = callClaudeAPI(buildGovernedPrompt(request, bundle));
  saveResponse(request.id, response);
  updateRequestStatus(request.id, "complete");
  notifyUser(request.userId);
  appendAuditLog(request.id, "execution_complete");
}`}
        </pre>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ background: '#EFF4FF', borderRadius: 12, padding: 10 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13 }}>Claude</div>
          <div style={{ marginTop: 4, color: '#64748B', fontSize: 12 }}>General reasoning and drafting.</div>
        </div>
        <div style={{ background: '#F0FAF7', borderRadius: 12, padding: 10 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13 }}>SoRR Control</div>
          <div style={{ marginTop: 4, color: '#64748B', fontSize: 12 }}>Governed execution + audit trail.</div>
        </div>
        <div style={{ background: '#F5F3FF', borderRadius: 12, padding: 10 }}>
          <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13 }}>Governed Workspace</div>
          <div style={{ marginTop: 4, color: '#64748B', fontSize: 12 }}>Persistent controlled multi-turn work.</div>
        </div>
      </div>

      <div style={{ marginTop: 12, background: '#FFF7ED', borderRadius: 14, padding: 14 }}>
        <div style={{ color: '#92400E', fontWeight: 700, fontSize: 14 }}>Security note</div>
        <div style={{ marginTop: 6, color: '#475569', fontSize: 13, lineHeight: '20px' }}>
          API keys remain server-side only (functions/cloud run). Client pages never hold Anthropic credentials.
        </div>
      </div>
    </ProductPocShell>
  );
}
