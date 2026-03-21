import Link from 'next/link';
import ProductPocShell from '../_components/ProductPocShell';

const LINKS = [
  {
    title: 'Requests / Classification Log',
    body: 'Internal operations view of routing records, confidence, and use-case matching.',
    href: '/apps/stea/sorr/controlui/request',
  },
  {
    title: 'Approvals Queue',
    body: 'Reviewer lane for release/hold decisions on governed requests.',
    href: '/apps/stea/sorr/controlui/approvals',
  },
  {
    title: 'Audit Trail',
    body: 'Immutable transition history across request, classify, decision, and execution.',
    href: '/apps/stea/sorr/controlui/audit',
  },
  {
    title: 'Security Policy',
    body: 'Policy-boundary and control interpretation for admin and infosec audiences.',
    href: '/apps/stea/sorr/controlui/classification',
  },
  {
    title: 'Resource Hub / Governed Workspace',
    body: 'Controlled execution environment after policy routing determines workspace lane.',
    href: '/apps/stea/sorr/controlui/workspace',
  },
];

export default function SorrControlAdminPreviewPage() {
  return (
    <ProductPocShell
      activeTab="/apps/stea/sorr/controlui/admin-preview"
      title="Admin / Control Layer"
      subtitle="Existing governance screens are retained and repositioned as internal control surfaces, not the primary product entry point."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        {LINKS.map((item) => (
          <Link key={item.title} href={item.href} style={{ textDecoration: 'none', background: '#EFF4FF', borderRadius: 14, padding: 14 }}>
            <div style={{ color: '#10294D', fontWeight: 700 }}>{item.title}</div>
            <div style={{ marginTop: 5, color: '#4C5D74', fontSize: 14 }}>{item.body}</div>
          </Link>
        ))}
      </div>
    </ProductPocShell>
  );
}
