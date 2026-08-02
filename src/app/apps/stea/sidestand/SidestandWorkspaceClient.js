'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import TenantSwitcher from '@/components/TenantSwitcher';
import { useTenant } from '@/contexts/TenantContext';
import { auth } from '@/lib/firebase';

const tools = [
  { code: '01', title: 'Rider analytics', href: '/apps/stea/sidestand/dashboard', description: 'Firestore product health, activation, maintenance behaviour, rider distribution and GA4 events.', status: 'LIVE DATA' },
  { code: '02', title: 'Promo campaigns', href: '/apps/stea/sidestand/promo', description: 'Plan native store offers, model proceeds and track the configuration required before a code goes live.', status: 'CONFIG MODE' },
];

function workspaceAllowed(tenant) {
  return ['sidestand', 'arcturusdc'].includes(String(tenant?.name || '').trim().toLowerCase());
}
export default function SidestandWorkspaceClient() {
  const router = useRouter();
  const { currentTenant, loading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth) { setReady(true); return undefined; }
    return onAuthStateChanged(auth, (next) => { setUser(next); setReady(true); if (!next) router.replace('/apps/stea?next=/apps/stea/sidestand'); });
  }, [router]);

  if (!ready || loading) return <div className="sidestand-shell flex min-h-[70vh] items-center justify-center"><p className="sidestand-mono text-[10px] uppercase tracking-[.14em]">Checking workspace access…</p></div>;
  if (!user || !workspaceAllowed(currentTenant) || !(isSuperAdmin || isWorkspaceAdmin)) return <main className="sidestand-shell px-5 py-14"><div className="sidestand-panel sidestand-status-rail mx-auto max-w-2xl p-6"><h1 className="text-2xl font-black uppercase">Workspace admin required</h1><p className="mt-2 text-sm font-semibold text-[#4a4a46]">Select Sidestand or ArcturusDC.</p><div className="mt-5"><TenantSwitcher /></div></div></main>;

  return <main className="sidestand-shell px-5 py-10 sm:px-8"><div className="mx-auto max-w-6xl">
    <header className="sidestand-rule flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-3"><img src="/img/sidestand-logo-glyph.svg" alt="" className="h-10 w-10" /><div><p className="sidestand-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a85]">STEa / Team workspace</p><h1 className="mt-1 text-4xl font-black uppercase tracking-[-.02em]">Sidestand</h1></div></div><p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[#4a4a46]">Product operations for the ADV maintenance ledger. Data remains in the Sidestand Firebase project; this workspace is an authenticated read/control surface.</p></div><TenantSwitcher /></header>
    <section className="mt-7 grid gap-3 md:grid-cols-2">{tools.map((tool) => <Link key={tool.href} href={tool.href} className="sidestand-panel sidestand-quiet-rail group block p-5 transition hover:border-[#131313]"><div className="flex items-start justify-between gap-4"><span className="sidestand-mono text-[10px] font-semibold tracking-[.16em] text-[#ff4d00]">{tool.code} ▸</span><span className="sidestand-mono border border-[#131313] px-2 py-1 text-[9px] font-semibold tracking-[.12em]">{tool.status}</span></div><h2 className="mt-8 text-2xl font-black uppercase tracking-[-.01em] group-hover:text-[#c63c00]">{tool.title}</h2><p className="mt-2 text-sm font-semibold leading-6 text-[#4a4a46]">{tool.description}</p></Link>)}</section>
    <div className="sidestand-mono mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-medium uppercase tracking-[.1em] text-[#6b6b67]"><span>FIRESTORE: SIDESTAND-B19E7</span><span>▪</span><span>ACCESS: WORKSPACE ADMIN</span><span>▪</span><Link href="/apps/stea" className="underline underline-offset-4">STEa index</Link></div>
  </div></main>;
}
