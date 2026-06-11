import Link from 'next/link';

import ChangelogShell from '@/components/dialled-changelog/ChangelogShell';
import TechTree from '@/components/dialled-changelog/TechTree';
import styles from '@/components/dialled-changelog/techtree.module.css';
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
        <div className={styles.tlNav}>
          <Link href="/apps/dialled-mtb/changelog/timeline" className={styles.detailLink}>
            Timeline view
          </Link>
        </div>
        <TechTree view={view} basePath="/apps/dialled-mtb/changelog" />
      </ChangelogShell>
    </main>
  );
}
