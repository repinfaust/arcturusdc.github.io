// Timeline view (Phase 2) — chronological lens on the same public release
// data the tree reads. No schema change; adding a release MDX file populates
// both views automatically.
import Link from 'next/link';

import ChangelogShell from '@/components/dialled-changelog/ChangelogShell';
import Timeline from '@/components/dialled-changelog/Timeline';
import styles from '@/components/dialled-changelog/techtree.module.css';
import { buildTimeline } from '@/lib/dialled-changelog/views';

export const metadata = {
  title: 'Dialled MTB — Release Timeline',
  description: 'Every Dialled MTB release in order: features, improvements and fixes across iOS and Android.',
};

export default function TimelinePage() {
  const { months, latest } = buildTimeline();

  return (
    <main>
      <ChangelogShell docTitle="Release Timeline" docSub="Changelog · Arcturus Digital Consulting" latest={latest}>
        <div className={styles.tlNav}>
          <Link href="/apps/dialled-mtb/changelog" className={styles.detailLink}>
            Tech tree view
          </Link>
        </div>
        {months.length === 0 ? (
          <div className={styles.detailTxt}>Nothing logged yet — watch this space.</div>
        ) : (
          <Timeline months={months} basePath="/apps/dialled-mtb/changelog" />
        )}
      </ChangelogShell>
    </main>
  );
}
