'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import TenantSwitcher from '@/components/TenantSwitcher';
import { useTenant } from '@/contexts/TenantContext';
import { auth } from '@/lib/firebase';

const pounds = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

function workspaceAllowed(tenant) {
  return ['sidestand', 'arcturusdc'].includes(String(tenant?.name || '').trim().toLowerCase());
}
function Field({ label, value, onChange, suffix }) {
  return <label className="block"><span className="sidestand-mono mb-1.5 block text-[9px] font-semibold uppercase tracking-[.1em] text-[#6b6b67]">{label}</span><span className="flex border border-[#c9c8c3] bg-[#fbfbf9] px-3 py-2.5 focus-within:border-[#131313]"><input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} className="sidestand-mono min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />{suffix ? <span className="sidestand-mono text-[10px] text-[#8a8a85]">{suffix}</span> : null}</span></label>;
}

function Step({ number, owner, title, children, ready }) {
  return <article className="sidestand-panel sidestand-quiet-rail p-5"><div className="flex items-start justify-between gap-4"><span className="sidestand-mono text-[10px] font-semibold tracking-[.15em] text-[#ff4d00]">{String(number).padStart(2, '0')} ▸</span><span className="sidestand-mono border border-[#131313] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.1em]">{owner}</span></div><h2 className="mt-5 text-lg font-black uppercase">{title}</h2><div className="mt-3 text-sm font-semibold leading-6 text-[#4a4a46]">{children}</div><p className="sidestand-mono mt-4 border-t border-[#c9c8c3] pt-3 text-[9px] uppercase leading-5 text-[#6b6b67]"><strong className="text-[#131313]">Ready when:</strong> {ready}</p></article>;
}

export default function SidestandPromoClient() {
  const router = useRouter();
  const { currentTenant, loading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [model, setModel] = useState({ monthly: 0, annual: 0, discount: 0, riders: 0, storeFee: 15, affiliate: 0 });

  useEffect(() => {
    if (!auth) { setAuthReady(true); return undefined; }
    return onAuthStateChanged(auth, (next) => { setUser(next); setAuthReady(true); if (!next) router.replace('/apps/stea?next=/apps/stea/sidestand/promo'); });
  }, [router]);

  const estimate = useMemo(() => {
    const discountFactor = Math.max(0, 1 - model.discount / 100);
    const storeFactor = Math.max(0, 1 - model.storeFee / 100);
    const affiliateFactor = Math.max(0, model.affiliate / 100);
    const monthlyProceeds = model.monthly * discountFactor * storeFactor;
    const annualProceeds = model.annual * discountFactor * storeFactor;
    return {
      monthlyNet: monthlyProceeds * (1 - affiliateFactor),
      annualNet: annualProceeds * (1 - affiliateFactor),
      cohortMonthly: monthlyProceeds * model.riders,
      cohortAnnual: annualProceeds * model.riders,
    };
  }, [model]);

  if (!authReady || loading) return <div className="sidestand-shell flex min-h-[70vh] items-center justify-center"><p className="sidestand-mono text-[10px] uppercase tracking-[.14em]">Checking workspace access…</p></div>;
  if (!user || !workspaceAllowed(currentTenant) || !(isSuperAdmin || isWorkspaceAdmin)) return <main className="sidestand-shell px-5 py-14"><div className="sidestand-panel sidestand-status-rail mx-auto max-w-2xl p-6"><h1 className="text-2xl font-black uppercase">Workspace admin required</h1><p className="mt-2 text-sm font-semibold text-[#4a4a46]">Select Sidestand or ArcturusDC.</p><div className="mt-5"><TenantSwitcher /></div></div></main>;

  return <main className="sidestand-shell px-4 py-8 sm:px-7"><div className="mx-auto max-w-[1180px]">
    <header className="sidestand-rule flex flex-col gap-5 pb-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-3"><img src="/img/sidestand-logo-glyph.svg" alt="" className="h-9 w-9" /><p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#6b6b67]"><Link href="/apps/stea/sidestand" className="hover:text-[#c63c00]">Sidestand</Link> / Promo campaigns</p></div><h1 className="mt-4 text-4xl font-black uppercase tracking-[-.03em]">Offer roadbook</h1><p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#4a4a46]">Native store offers with RevenueCat remaining the entitlement layer. No separate coupon system is invented here.</p></div><TenantSwitcher /></header>

    <div className="sidestand-panel sidestand-status-rail mt-5 p-5"><p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.14em] text-[#ff4d00]">Configuration mode — not live redemption</p><h2 className="mt-2 text-xl font-black uppercase">The app is not promo-ready yet</h2><p className="mt-2 text-sm font-semibold leading-6 text-[#4a4a46]">Sidestand has RevenueCat purchases and the `premium` entitlement, but no promo-code entry flow, no campaign collection, and no RevenueCat webhook projection into Firestore. This page therefore plans the native offers and economics without pretending it can activate or measure a code.</p></div>

    <section className="mt-5 grid gap-3 sm:grid-cols-3"><div className="sidestand-panel p-4"><p className="sidestand-mono text-[8px] uppercase tracking-[.12em] text-[#8a8a85]">Entitlement</p><p className="sidestand-mono mt-2 text-xs font-semibold">premium</p></div><div className="sidestand-panel p-4"><p className="sidestand-mono text-[8px] uppercase tracking-[.12em] text-[#8a8a85]">Monthly product</p><p className="sidestand-mono mt-2 break-all text-xs font-semibold">com.sidestand.premium.monthly</p></div><div className="sidestand-panel p-4"><p className="sidestand-mono text-[8px] uppercase tracking-[.12em] text-[#8a8a85]">Annual product</p><p className="sidestand-mono mt-2 break-all text-xs font-semibold">com.sidestand.premium.annual</p></div></section>

    <section className="mt-5 grid gap-3 lg:grid-cols-2">
      <Step number={1} owner="SIDESTAND" title="Approve the campaign contract" ready="The discount, eligibility, duration, cap, partner attribution and any commission rule are explicit—not inherited from Dialled MTB."><p>Set the public code and campaign dates. Decide whether this is customer discount only or also an affiliate deal. Sidestand currently has no approved commission percentage, so this page does not prefill one.</p></Step>
      <Step number={2} owner="APP STORE" title="Create Apple offer codes" ready="Each enabled plan has its own tested Apple custom code and redemption URL."><p>In App Store Connect, create an Offer Code under each Sidestand subscription. Keep Apple’s hidden code separate from the public partner code used in Sidestand.</p></Step>
      <Step number={3} owner="GOOGLE PLAY" title="Create developer offers" ready="Each enabled base plan has an active `base-plan-id:offer-id` mapping."><p>Use developer-determined eligibility and the RevenueCat `rc-ignore-offer` tag so the offer is selected deliberately. Google subscription promo codes are not the equivalent of Apple’s paid offer codes.</p></Step>
      <Step number={4} owner="APP + BACKEND" title="Build redemption and attribution" ready="A free signed-in test rider can enter a code, receive the correct native offer on both platforms, and a validated claim is written server-side."><p>This is the missing product work: code validation, one-claim policy, store mapping, iOS/Android test paths, webhook audit and refund-aware RevenueCat proceeds. It requires a separate Sidestand-repo plan under its SoRR.</p></Step>
      <Step number={5} owner="BOTH STORES" title="Run the two-platform proof" ready="Sandbox entitlement and webhook checks pass, then one tightly capped production smoke purchase converts correctly on iOS and Android."><p>Use an Apple sandbox/TestFlight account and a Play licence tester. Never infer platform parity from one successful store.</p></Step>
      <Step number={6} owner="FINANCE" title="Reconcile real proceeds" ready="Refunds, store fees, tax treatment and any approved partner payment match RevenueCat’s authoritative transactions."><p>Dashboard estimates are planning aids. The payout record must use real transaction estimates and refund events, not projected list price.</p></Step>
    </section>

    <section className="sidestand-panel mt-5 p-5 sm:p-6"><header className="sidestand-rule pb-3"><p className="sidestand-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#ff4d00]">Scenario only</p><h2 className="mt-1 text-xl font-black uppercase">Campaign economics</h2><p className="mt-2 text-xs font-semibold text-[#6b6b67]">Prices deliberately start at zero. Enter the live store prices; inputs stay in this browser and are not saved.</p></header><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Field label="Monthly price" value={model.monthly} suffix="GBP" onChange={(value) => setModel({ ...model, monthly: value })} /><Field label="Annual price" value={model.annual} suffix="GBP" onChange={(value) => setModel({ ...model, annual: value })} /><Field label="Discount" value={model.discount} suffix="%" onChange={(value) => setModel({ ...model, discount: value })} /><Field label="Expected riders" value={model.riders} onChange={(value) => setModel({ ...model, riders: value })} /><Field label="Store fee" value={model.storeFee} suffix="%" onChange={(value) => setModel({ ...model, storeFee: value })} /><Field label="Affiliate rate" value={model.affiliate} suffix="%" onChange={(value) => setModel({ ...model, affiliate: value })} /></div><div className="mt-5 grid gap-px border border-[#c9c8c3] bg-[#c9c8c3] sm:grid-cols-2 lg:grid-cols-4">{[['Monthly net / rider', estimate.monthlyNet], ['Annual net / rider', estimate.annualNet], ['Monthly cohort proceeds', estimate.cohortMonthly], ['Annual cohort proceeds', estimate.cohortAnnual]].map(([label, value]) => <div key={label} className="bg-[#fbfbf9] p-4"><p className="sidestand-mono text-[8px] uppercase tracking-[.1em] text-[#6b6b67]">{label}</p><p className="mt-2 text-2xl font-black">{pounds.format(value)}</p></div>)}</div></section>

    <div className="sidestand-mono mt-5 border-t-2 border-[#131313] pt-4 text-[9px] uppercase leading-5 text-[#6b6b67]">RevenueCat access needed for the live phase: a Sidestand secret API key scoped for read-only project/customer/transaction reconciliation, plus a signed webhook secret. Do not paste either into the browser or commit them to git.</div>
  </div></main>;
}
