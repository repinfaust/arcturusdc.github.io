// Per-release permalink (§8) — shareable, SEO-indexable, public releases only.
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

import ChangelogShell from '@/components/dialled-changelog/ChangelogShell';
import styles from '@/components/dialled-changelog/techtree.module.css';
import { publicReleases } from '@/lib/dialled-changelog/releases';
import { buildPublicView, getPublicRelease } from '@/lib/dialled-changelog/views';

const PLATFORM_LABEL = { ios: 'iOS', android: 'Android', backend: 'Backend', web: 'Web' };

export function generateStaticParams() {
  return publicReleases().map((r) => ({ id: r.id }));
}

export function generateMetadata({ params }) {
  const release = getPublicRelease(params.id);
  if (!release) return { title: 'Release not found — Dialled MTB' };
  return {
    title: `${release.title}${release.version ? ` (v${release.version})` : ''} — Dialled MTB Changelog`,
    description: release.notes ? release.notes.slice(0, 160) : `Dialled MTB release: ${release.title}`,
  };
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

export default function ReleasePage({ params }) {
  const release = getPublicRelease(params.id);
  if (!release) notFound();

  const view = buildPublicView();
  const featuresById = Object.fromEntries(view.features.map((f) => [f.id, f]));
  const linkedFeatures = release.featureIds.filter((id) => featuresById[id]);

  return (
    <main>
      <ChangelogShell docTitle="Release" docSub="Dialled MTB changelog · Arcturus Digital Consulting" latest={null}>
        <Link href="/apps/dialled-mtb/changelog" className={styles.articleBack}>
          Back to the tech tree
        </Link>
        <div className={styles.detailEyebrow} style={{ color: 'var(--accent)' }}>
          {formatDate(release.date)}
        </div>
        <div className={styles.detailTitle} style={{ fontSize: 20 }}>{release.title}</div>
        <div className={styles.detailTags}>
          {release.version ? <span className={styles.dtag}>v{release.version}</span> : null}
          <span className={styles.dtag}>{release.type}</span>
          {release.platform.map((p) => (
            <span key={p} className={styles.dtag}>{PLATFORM_LABEL[p]}</span>
          ))}
        </div>

        {release.notes ? (
          <div className={styles.detailTxt} style={{ fontSize: 12.5, maxWidth: 640 }}>
            <ReactMarkdown>{release.notes}</ReactMarkdown>
          </div>
        ) : null}

        {release.media.length > 0 ? (
          <div className={styles.articleMedia}>
            {release.media.map((m) => (
              <figure key={m.src}>
                <Image src={m.src} alt={m.alt} width={1200} height={750} style={{ width: '100%', height: 'auto' }} />
                {m.caption ? <figcaption>{m.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : null}

        {linkedFeatures.length > 0 ? (
          <div className={styles.detailSec} style={{ marginTop: 24 }}>
            <div className={styles.detailLab}>Advances</div>
            {linkedFeatures.map((id) => (
              <Link key={id} href={`/apps/dialled-mtb/changelog/feature/${id}`} className={styles.detailLink}>
                {featuresById[id].title}
              </Link>
            ))}
          </div>
        ) : null}
      </ChangelogShell>
    </main>
  );
}
