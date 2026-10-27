import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sessionFromCookie } from '@/lib/orbit/serverSession';
import { readEvidenceChain } from '@/lib/orbit/evidenceStore';
import { loadTimeline } from '@/lib/orbit/evidenceTimeline';
import { ANCHOR_COLLECTION } from '@/lib/orbit/anchors';
import EvidenceTimeline from './EvidenceTimeline';

// Owner only (D-SITE-059). The middleware redirects anyone else; this page re-checks on the
// server and returns a 404, so the route doesn't confirm it exists.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Orbit evidence chain - STEa',
  robots: { index: false, follow: false },
};

export default async function OrbitEvidencePage() {
  const { auth, db } = getFirebaseAdmin();
  const session = await sessionFromCookie(cookies().get('__session')?.value, auth);
  const timeline = await loadTimeline({
    session,
    readChain: (orgId) => readEvidenceChain(db, orgId),
    readAnchors: async (orgId) => (await db.collection(ANCHOR_COLLECTION).where('orgId', '==', orgId).get()).docs.map((d) => d.data()),
  });
  if (timeline.status !== 'ok') notFound();
  return <EvidenceTimeline orgId={timeline.orgId} rows={timeline.rows} head={timeline.head} anchors={timeline.anchors} />;
}
