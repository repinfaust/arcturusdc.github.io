// Server component: dark shell + header chrome shared by all changelog routes.
// Header markup/styling ported from dialled_tech_tree.html; the public routes
// swap the internal doc-sub line for public-safe copy and the latest-release
// banner (§10).
import Image from 'next/image';

import styles from './techtree.module.css';

function formatDaysAgo(daysAgo) {
  if (daysAgo <= 0) return 'today';
  if (daysAgo === 1) return 'yesterday';
  return `${daysAgo} days ago`;
}

export default function ChangelogShell({ docTitle, docSub, latest, children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <div className={styles.wordmark}>
            <Image src="/img/dialled-changelog-logo.png" alt="Dialled MTB logo" width={40} height={40} />
            <div className={styles.wordmarkText}>DIALLED</div>
          </div>
          <div className={styles.headerMeta}>
            <div className={styles.docTitle}>{docTitle}</div>
            <div className={styles.docSub}>{docSub}</div>
            {latest ? (
              <div className={styles.latest}>
                Latest: <b>{latest.version ? `v${latest.version}` : latest.title}</b> — {formatDaysAgo(latest.daysAgo)}
              </div>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
