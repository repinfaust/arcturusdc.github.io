'use client';

// Dialled MTB changelog — Timeline view (Phase 2). A second lens on the same
// release data: reverse-chronological, grouped by month, mobile-native.
// Visual vocabulary is the locked tech-tree set — lane colours on the entry
// spine, the rel* metadata rows, dtag pills, and the same minimal lightbox.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

import styles from './techtree.module.css';

const PLATFORM_LABEL = { ios: 'iOS', android: 'Android', backend: 'Backend', web: 'Web' };

function formatDate(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

export default function Timeline({ months, basePath }) {
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && lightbox) setLightbox(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox]);

  return (
    <div className={styles.timeline}>
      {months.map((month) => (
        <div key={month.key}>
          <div className={styles.tlMonth}>{month.label}</div>
          {month.entries.map((r) => (
            <div
              key={r.id}
              className={styles.tlEntry}
              style={r.features.length ? { borderLeftColor: `var(--${r.features[0].lane})` } : undefined}
            >
              <div className={styles.relMeta}>
                <span className={styles.relDate}>{formatDate(r.date)}</span>
                {r.version ? <span className={styles.relVersion}>v{r.version}</span> : null}
                {r.platform.map((p) => (
                  <span key={p} className={styles.platPill}>{PLATFORM_LABEL[p]}</span>
                ))}
                <span className={styles.relType}>{r.type}</span>
              </div>
              <Link
                href={`${basePath}/release/${r.id}`}
                className={styles.relTitle}
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                {r.title}
              </Link>
              {r.notes ? (
                <div className={styles.relNotes}>
                  <ReactMarkdown>{r.notes}</ReactMarkdown>
                </div>
              ) : null}
              {r.media.length > 0 ? (
                <div className={styles.relThumbs}>
                  {r.media.map((m) => (
                    <button
                      key={m.src}
                      type="button"
                      className={styles.relThumb}
                      style={{ width: 72, height: 46, position: 'relative' }}
                      aria-label={`View screenshot: ${m.alt}`}
                      onClick={() => setLightbox(m)}
                    >
                      <Image src={m.src} alt={m.alt} fill sizes="72px" style={{ objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              ) : null}
              {r.features.length > 0 ? (
                <div className={styles.tlFeatures}>
                  {r.features.map((f) => (
                    <Link key={f.id} href={`${basePath}/feature/${f.id}`} className={styles.detailLink}>
                      {f.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}

      {lightbox ? (
        <div className={styles.lightbox} onClick={() => setLightbox(null)} role="dialog" aria-label="Screenshot viewer">
          <figure className={styles.lightboxFigure} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              aria-label="Close screenshot viewer"
              onClick={() => setLightbox(null)}
            >
              ✕ close
            </button>
            <Image
              src={lightbox.src}
              alt={lightbox.alt}
              width={1600}
              height={1000}
              style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '80vh' }}
            />
            {lightbox.caption ? <figcaption className={styles.lightboxCaption}>{lightbox.caption}</figcaption> : null}
          </figure>
        </div>
      ) : null}
    </div>
  );
}
