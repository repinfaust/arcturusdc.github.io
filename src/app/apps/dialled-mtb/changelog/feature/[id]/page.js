// Per-feature permalink (§8) — a node's full public release history. Also the
// non-spatial, mobile-friendly reading path for the tree (§9).
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

import ChangelogShell from '@/components/dialled-changelog/ChangelogShell';
import styles from '@/components/dialled-changelog/techtree.module.css';
import { buildPublicView, getPublicFeature } from '@/lib/dialled-changelog/views';

const PLATFORM_LABEL = { ios: 'iOS', android: 'Android', backend: 'Backend', web: 'Web' };

export function generateStaticParams() {
  return buildPublicView().features.map((f) => ({ id: f.id }));
}

export function generateMetadata({ params }) {
  const feature = getPublicFeature(params.id);
  if (!feature) return { title: 'Feature not found — Dialled MTB' };
  return {
    title: `${feature.title} — Dialled MTB Changelog`,
    description: feature.publicSummary,
  };
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

export default function FeaturePage({ params }) {
  const feature = getPublicFeature(params.id);
  if (!feature) notFound();

  const view = buildPublicView();
  const labels = view.labels;

  return (
    <main>
      <ChangelogShell docTitle="Feature" docSub="Dialled MTB changelog · Arcturus Digital Consulting" latest={null}>
        <Link href="/apps/dialled-mtb/changelog" className={styles.articleBack}>
          Back to the tech tree
        </Link>
        <div className={styles.detailEyebrow} style={{ color: `var(--${feature.lane})` }}>
          {labels.lane[feature.lane]} lane
        </div>
        <div className={styles.detailTitle} style={{ fontSize: 20 }}>{feature.title}</div>
        <div className={styles.detailTags}>
          <span className={styles.dtag}>{feature.statusLabel}</span>
          {feature.phase ? <span className={styles.dtag}>{feature.phase}</span> : null}
          {feature.cats.map((c) => (
            <span key={c} className={styles.dtag}>{labels.cat[c]}</span>
          ))}
        </div>
        <div className={styles.detailTxt} style={{ fontSize: 12.5, maxWidth: 640, marginBottom: 24 }}>
          {feature.publicSummary}
        </div>

        <div className={styles.detailLab}>Release history</div>
        {feature.releases.length === 0 ? (
          <div className={styles.detailTxt}>Nothing shipped against this yet — watch this space.</div>
        ) : (
          <div className={styles.relList} style={{ maxWidth: 640 }}>
            {feature.releases.map((r) => (
              <div key={r.id} className={styles.relRow}>
                <div className={styles.relMeta}>
                  <span className={styles.relDate}>{formatDate(r.date)}</span>
                  {r.version ? <span className={styles.relVersion}>v{r.version}</span> : null}
                  {r.platform.map((p) => (
                    <span key={p} className={styles.platPill}>{PLATFORM_LABEL[p]}</span>
                  ))}
                  <span className={styles.relType}>{r.type}</span>
                </div>
                <Link href={`/apps/dialled-mtb/changelog/release/${r.id}`} className={styles.relTitle} style={{ textDecoration: 'none', display: 'inline-block' }}>
                  {r.title}
                </Link>
                {r.notes ? (
                  <div className={styles.relNotes}>
                    <ReactMarkdown>{r.notes}</ReactMarkdown>
                  </div>
                ) : null}
                {r.media.length > 0 ? (
                  <div className={styles.articleMedia}>
                    {r.media.map((m) => (
                      <figure key={m.src}>
                        <Image src={m.src} alt={m.alt} width={1200} height={750} style={{ width: '100%', height: 'auto' }} />
                        {m.caption ? <figcaption>{m.caption}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </ChangelogShell>
    </main>
  );
}
