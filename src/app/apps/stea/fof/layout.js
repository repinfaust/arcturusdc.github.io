import { enforceGate } from '@/lib/serverGate';

// Server-side gate (D-SITE-064): signed in, checked before anything renders.
export const dynamic = 'force-dynamic';

export default async function GateLayout({ children }) {
  await enforceGate('/apps/stea/fof');
  return children;
}
