// INTERNAL route (§8.1) — the full tree: all nodes including Avoid/Kill, the
// `why` reasoning, scores, and internal releases. Gated by an environment
// variable that is NOT set on the production deployment: without it this route
// renders a 404 and none of the internal data is ever serialised into a
// response. To use locally: DIALLED_INTERNAL_TREE=1 npm run dev
import { notFound } from 'next/navigation';

import ChangelogShell from '@/components/dialled-changelog/ChangelogShell';
import TechTree from '@/components/dialled-changelog/TechTree';
import styles from '@/components/dialled-changelog/techtree.module.css';

export const metadata = {
  title: 'Dialled MTB — Internal Tech Tree',
  robots: { index: false, follow: false },
};

export default async function InternalChangelogPage() {
  if (process.env.DIALLED_INTERNAL_TREE !== '1') {
    notFound();
  }
  // Imported lazily so the internal dataset is only touched when the gate is open.
  const { buildInternalView } = await import('@/lib/dialled-changelog/views');
  const view = buildInternalView();

  return (
    <main>
      <ChangelogShell
        docTitle="Product Tech Tree"
        docSub="Internal · June 2026 · Arcturus Digital Consulting"
        latest={view.latest}
      >
        {/* THE THREE BETS — internal strategy framing, verbatim from the artefact */}
        <div className={styles.bets}>
          <div className={`${styles.bet} ${styles.betCore}`}>
            <div className={styles.betEyebrow}>Direction 01 · Double down</div>
            <div className={styles.betTitle}>Strengthen the core</div>
            <div className={styles.betBody}>
              Harden the deterministic maintenance loop and the things that make it trustworthy: reliable counters,
              sane defaults, a universal mileage source, unit preferences.
            </div>
            <div className={styles.betRead}>
              <b>Read:</b> not really a &quot;choice&quot; — it&apos;s the floor. Fund it regardless of where the bigger bet lands.
            </div>
          </div>
          <div className={`${styles.bet} ${styles.betSetup}`}>
            <div className={styles.betEyebrow}>Direction 02 · Deepen</div>
            <div className={styles.betTitle}>Build out setup</div>
            <div className={styles.betBody}>
              The second pillar, where the current build energy already sits: tyre configuration, confidence state,
              advisor write-back, and the gated gravel question.
            </div>
            <div className={styles.betRead}>
              <b>Read:</b> finish the chain already in flight before opening new fronts. Highest momentum, lowest risk.
            </div>
          </div>
          <div className={`${styles.bet} ${styles.betLabs}`}>
            <div className={styles.betEyebrow}>Direction 03 · Expand</div>
            <div className={styles.betTitle}>The Labs route</div>
            <div className={styles.betBody}>
              NFC tagging and mechanic features. Quick bike-switch as the opener; verified servicing as the one node
              with a genuine moat. Heavier, longer horizon.
            </div>
            <div className={styles.betRead}>
              <b>Read:</b> the real strategic bet. Sequenced — prove NFC, then chase provenance.
            </div>
          </div>
        </div>

        <TechTree view={view} basePath="/apps/dialled-mtb/changelog" />

        <div className={styles.readNote}>
          <div className={styles.readNoteLabel}>The honest second opinion</div>
          <b>Core</b> isn&apos;t a direction, it&apos;s the floor — the deterministic reminder loop must stay boring and
          reliable whatever else happens. <b>Setup</b> is where the energy already is; finish the chain in flight
          (tyre config → confidence chips → write-back) before opening anything new. <b>Labs</b> is the genuine
          strategic bet, and <b>Verified Mechanical Servicing</b> is the single node here with a moat — network
          effects, B2B revenue, switching costs. But it&apos;s gated behind NFC Quick Switch shipping cleanly and a
          workshop pilot, so the order is fixed: prove NFC first, then chase provenance. Everything in the right-hand{' '}
          <b>Avoid</b> column pulls against the protected core (social, identity, gatekeeping) — they&apos;re drawn in
          to be visibly parked, not picked.
        </div>

        <hr className={styles.rule} />
        <div className={styles.footer}>
          <div>
            Dialled MTB — Internal working document
            <br />
            Arcturus Digital Consulting · Not for distribution
          </div>
          <div style={{ textAlign: 'right' }}>
            June 2026
            <br />
            v1.0 · companion to Roadmap v1.2
          </div>
        </div>
      </ChangelogShell>
    </main>
  );
}
