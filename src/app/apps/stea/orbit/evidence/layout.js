import { enforceGate } from '@/lib/serverGate';

// Server-side gate (D-SITE-064): the Orbit owner only; anyone else gets a 404 (the page re-checks too), checked before anything renders.
export const dynamic = 'force-dynamic';

export default async function GateLayout({ children }) {
  await enforceGate('/apps/stea/orbit/evidence');
  return children;
}
