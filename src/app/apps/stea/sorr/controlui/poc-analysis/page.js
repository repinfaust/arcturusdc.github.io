import ProductPocShell from '../_components/ProductPocShell';
import PocDocAssistant from '../_components/PocDocAssistant';

export default function SorrControlPocAnalysisPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/poc-analysis"
      title="POC Analysis"
      subtitle="Review the SoRR POC document set and ask grounded questions across specs, strategy notes, and business case material."
    >
      <PocDocAssistant
        title="POC Analysis Workspace"
        subtitle="Document upload is intentionally disabled for this POC. Source documents are controlled centrally and linked below."
      />
    </ProductPocShell>
  );
}
