import ChangelogShell from '@/components/dialled-changelog/ChangelogShell';
import TechTree from '@/components/dialled-changelog/TechTree';
import { buildPublicView } from '@/lib/dialled-changelog/views';

export const metadata = {
  title: 'Dialled MTB — Product Tech Tree & Changelog',
  description:
    'The living Dialled MTB product map: what has shipped, what is being built, and where the product is heading.',
};

export default function ChangelogPage() {
  const view = buildPublicView();
  return (
    <main>
      <ChangelogShell
        docTitle="Product Tech Tree"
        docSub="Changelog · Arcturus Digital Consulting"
        latest={view.latest}
      >
        <TechTree view={view} basePath="/apps/dialled-mtb/changelog" />
      </ChangelogShell>
    </main>
  );
}
