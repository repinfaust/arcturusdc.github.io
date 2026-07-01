'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';

import TenantSwitcher from '@/components/TenantSwitcher';
import { useTenant } from '@/contexts/TenantContext';
import { auth, firebaseInitError } from '@/lib/firebase';

const ALLOWED_WORKSPACES = ['dialled mtb', 'arcturusdc'];
const EMPTY_FORM = {
  code: '',
  affiliateName: '',
  plans: { monthly: true, annual: true },
  discountPercent: '15',
  discountPeriods: '3',
  maxRiders: '100',
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: '',
  notes: '',
  storeConfig: {
    ios: {
      monthlyOfferCode: '',
      monthlyRedemptionUrl: '',
      annualOfferCode: '',
      annualRedemptionUrl: '',
    },
    android: { monthlyOptionId: '', annualOptionId: '' },
  },
};

const inputClass = 'w-full rounded-lg border border-white/10 bg-[#15191D] px-3 py-2.5 text-sm text-[#F4F6F8] outline-none transition placeholder:text-[#68717A] focus:border-[#F72585]/70 focus:ring-2 focus:ring-[#F72585]/15';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A939D]';

const RUNBOOK_STEPS = [
  {
    owner: 'Both',
    title: 'Agree the partner terms',
    items: [
      'Choose the affiliate name and one memorable public code riders will type in the app.',
      'Agree monthly, annual, or both; the rider discount; billing periods; start/end dates; and an optional rider cap.',
      'Confirm the locked affiliate deal: 10% of estimated proceeds for 12 months. Payout is handled manually outside this tool.',
    ],
    ready: 'You can explain the offer in one sentence without promising a currency price.',
  },
  {
    owner: 'Workbench',
    title: 'Create the draft campaign',
    items: [
      'Complete Terms and store mapping, generate or enter the public code, then select Create draft campaign.',
      'The public code becomes the permanent campaign ID. Check its spelling before saving.',
      'Do not share the code yet. Draft is the safe state while the two stores are configured.',
    ],
    ready: 'The campaign appears in the ledger with Draft status.',
  },
  {
    owner: 'App Store',
    title: 'Create Apple offer codes',
    items: [
      'In App Store Connect, open Dialled MTB → Subscriptions → the subscription group → the monthly or annual subscription.',
      'Under Subscription Prices, create an Offer Code with the agreed eligibility, discount type, duration, territories, and redemption limit.',
      'Create a distinct internal custom code (for example SNOWDON26M or SNOWDON26A) and copy its redemption URL. Repeat for every enabled plan; Apple does not reuse one custom code across two offers.',
    ],
    ready: 'You have an Apple code and redemption URL for every selected plan. Allow up to one hour before testing.',
    href: 'https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes/',
    linkLabel: 'Apple offer-code guide',
  },
  {
    owner: 'Google Play',
    title: 'Create Google subscription offers',
    items: [
      'In Play Console, open Monetize → Products → Subscriptions, choose the subscription and base plan, then select Add offer.',
      'Use Developer determined eligibility, add the agreed pricing phases, and add the tag rc-ignore-offer so RevenueCat cannot apply the partner discount automatically.',
      'Activate the offer. Record the RevenueCat option ID as base-plan-id:offer-id and repeat for every enabled plan.',
    ],
    ready: 'Every selected plan has an active option ID. Do not use Play promo codes; subscription promo codes are free-trial-only.',
    href: 'https://www.revenuecat.com/docs/subscription-guidance/subscription-offers/google-play-offers',
    linkLabel: 'RevenueCat Google-offer guide',
  },
  {
    owner: 'Workbench',
    title: 'Map both stores and activate',
    items: [
      'Select Edit mappings on the draft and paste each Apple code, Apple redemption URL, and Google option ID into its matching plan.',
      'Save the campaign and confirm both readiness indicators are green. RevenueCat remains the entitlement layer; this tool does not create a separate RevenueCat coupon.',
      'Select Activate only after both stores are complete. The server rejects activation if any required mapping is missing.',
    ],
    ready: 'Campaign status is Active and both store rails say Ready.',
  },
  {
    owner: 'Both',
    title: 'Run the two-store test',
    items: [
      'Use a signed-in free test rider who is not Premium and has never claimed another partner code.',
      'On iOS, test with an Apple sandbox code/TestFlight. On Android, use a Play licence tester on the internal track.',
      'In sandbox, confirm the entitlement and webhook audit without changing production totals. Then run one tightly capped production smoke purchase to prove the offer identifier converts in the campaign ledger.',
    ],
    ready: 'Sandbox entitlement/webhook checks pass, then a controlled production purchase converts correctly on iOS and Android.',
  },
  {
    owner: 'Partner',
    title: 'Share the public code',
    items: [
      'Give the partner only the public Dialled code and the agreed wording. Hidden Apple codes and Google option IDs stay internal.',
      'Tell riders to sign in, open Premium, choose monthly or annual, enter the code, and confirm the final terms shown by their app store.',
      'Pause the campaign immediately if the store price, duration, eligibility, or mapping is wrong. End it when the partnership finishes; do not delete its history.',
    ],
    ready: 'The partner has approved copy, dates, code, and a named Dialled contact.',
  },
  {
    owner: 'Monthly',
    title: 'Report, reconcile, and pay',
    items: [
      'Use this ledger for live claims, paid conversions, estimated proceeds, and accrued commission; use the existing Looker Studio affiliate view for campaign reporting.',
      'Call claims “validated riders,” not downloads. A code entered after installation does not prove which partner caused the download.',
      'Reconcile the 10% accrued commission against RevenueCat-estimated proceeds, include refund reversals, and record the actual payout in the finance process.',
    ],
    ready: 'Partner report and manual payout are complete, with refunds and the 12-month commission window accounted for.',
  },
];

function workspaceAllowed(tenant) {
  return ALLOWED_WORKSPACES.includes(String(tenant?.name || '').trim().toLowerCase());
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

function dollars(value) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function campaignToForm(campaign) {
  return {
    code: campaign.code,
    affiliateName: campaign.affiliateName,
    plans: campaign.plans,
    discountPercent: String(campaign.discountPercent),
    discountPeriods: String(campaign.discountPeriods),
    maxRiders: campaign.maxRiders ? String(campaign.maxRiders) : '',
    startsAt: dateOnly(campaign.startsAt),
    endsAt: dateOnly(campaign.endsAt),
    notes: campaign.notes || '',
    storeConfig: {
      ios: {
        monthlyOfferCode: campaign.storeConfig?.ios?.monthlyOfferCode || '',
        monthlyRedemptionUrl: campaign.storeConfig?.ios?.monthlyRedemptionUrl || '',
        annualOfferCode: campaign.storeConfig?.ios?.annualOfferCode || '',
        annualRedemptionUrl: campaign.storeConfig?.ios?.annualRedemptionUrl || '',
      },
      android: {
        monthlyOptionId: campaign.storeConfig?.android?.monthlyOptionId || '',
        annualOptionId: campaign.storeConfig?.android?.annualOptionId || '',
      },
    },
  };
}

function readinessLabel(readiness) {
  if (readiness?.ready) return 'Ready';
  const count = readiness?.missing?.length || 0;
  return `${count} mapping${count === 1 ? '' : 's'} missing`;
}

function StoreReadinessRail({ readiness }) {
  const stores = [
    { key: 'ios', label: 'App Store', detail: readinessLabel(readiness?.ios) },
    { key: 'android', label: 'Google Play', detail: readinessLabel(readiness?.android) },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10">
      {stores.map((store, index) => {
        const ready = Boolean(readiness?.[store.key]?.ready);
        return (
          <div key={store.key} className={`flex items-center gap-2.5 bg-[#15191D] px-3 py-2.5 ${index ? 'border-l border-white/10' : ''}`}>
            <span className={`h-2 w-2 rounded-full ${ready ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div>
              <p className="text-xs font-semibold text-[#E8EBEE]">{store.label}</p>
              <p className="text-[10px] text-[#7E8790]">{store.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ active, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        active
          ? 'border-[#F72585]/60 bg-[#F72585]/10 text-[#FF6EAF]'
          : 'border-white/10 bg-[#15191D] text-[#7E8790] hover:border-white/20 hover:text-[#D7DCE0]'
      }`}
    >
      {children}
    </button>
  );
}

function CampaignRunbook() {
  return (
    <details id="launch-guide" open className="group mt-7 overflow-hidden rounded-xl border border-white/10 bg-[#12161A]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 outline-none transition hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F72585]/60 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F72585]">Partner launch guide</p>
          <h2 className="mt-1 text-xl font-black">Eight checkpoints from agreement to payout</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#8A939D]">Follow in order for every campaign. Store discounts are created in Apple and Google first, then mapped here.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#8A939D] group-open:text-[#FF6EAF]">
          <span className="group-open:hidden">Open guide</span>
          <span className="hidden group-open:inline">Hide guide</span>
        </span>
      </summary>

      <div className="border-t border-white/10 px-5 py-6 sm:px-6">
        <div className="grid gap-3 border-b border-white/10 pb-5 sm:grid-cols-3">
          {[
            ['1 public code', 'What riders type'],
            ['2 store systems', 'Where discounts are created'],
            ['0 guessed prices', 'The store always confirms the charge'],
          ].map(([value, label]) => (
            <div key={value} className="rounded-lg border border-white/10 bg-[#0D1013] px-4 py-3">
              <p className="font-mono text-sm font-black text-[#F4F6F8]">{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#68717A]">{label}</p>
            </div>
          ))}
        </div>

        <ol className="mt-5 grid gap-4 lg:grid-cols-2">
          {RUNBOOK_STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border border-white/10 bg-[#0D1013] p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#F72585]/35 bg-[#F72585]/10 font-mono text-xs font-black text-[#FF6EAF]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-[#F4F6F8]">{step.title}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#7E8790]">{step.owner}</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs leading-5 text-[#A8B0B8]">
                    {step.items.map((item) => (
                      <li key={item} className="grid grid-cols-[12px_1fr] gap-2">
                        <span aria-hidden="true" className="mt-[8px] h-1 w-1 rounded-full bg-[#F72585]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {step.href && (
                    <a href={step.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-bold text-[#FF6EAF] underline decoration-[#F72585]/35 underline-offset-4 transition hover:text-white">
                      {step.linkLabel} ↗
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">Checkpoint</p>
                <p className="mt-1 text-xs leading-5 text-[#8A939D]">{step.ready}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-amber-200">Release gate</p>
            <p className="mt-1 text-xs leading-5 text-[#B9A98C]">The promo entry flow must be live in the current iOS and Android store builds before a partner receives a code.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a href="https://appstoreconnect.apple.com/" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#D7DCE0] transition hover:border-[#F72585]/40 hover:text-white">App Store Connect ↗</a>
            <a href="https://play.google.com/console/" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#D7DCE0] transition hover:border-[#F72585]/40 hover:text-white">Play Console ↗</a>
            <a href="https://app.revenuecat.com/" target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#D7DCE0] transition hover:border-[#F72585]/40 hover:text-white">RevenueCat ↗</a>
          </div>
        </div>
      </div>
    </details>
  );
}

export default function DialledPromoCampaignClient() {
  const router = useRouter();
  const { currentTenant, loading: tenantLoading, isSuperAdmin, isWorkspaceAdmin } = useTenant();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const canAdmin = Boolean(isSuperAdmin || isWorkspaceAdmin);
  const hasWorkspace = workspaceAllowed(currentTenant);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setError(
        firebaseInitError
          ? 'Promo administration is unavailable because Firebase client configuration is invalid in this environment.'
          : 'Promo administration is unavailable in this environment.',
      );
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) router.replace('/apps/stea?next=/apps/stea/dialled-mtb/promo');
    });
    return unsubscribe;
  }, [router]);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    if (!user) throw new Error('Sign in again to continue.');
    const token = await user.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }, [user]);

  const loadCampaigns = useCallback(async () => {
    if (!user || !currentTenant?.id || !hasWorkspace || !canAdmin) return;
    setLoading(true);
    setError('');
    try {
      const response = await authenticatedFetch(`/api/stea/dialled-mtb/promo?tenantId=${encodeURIComponent(currentTenant.id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not load campaigns.');
      setCampaigns(payload.campaigns || []);
    } catch (loadError) {
      setError(loadError.message || 'Could not load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, canAdmin, currentTenant?.id, hasWorkspace, user]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const totals = useMemo(() => campaigns.reduce((summary, campaign) => ({
    active: summary.active + (campaign.status === 'active' ? 1 : 0),
    claims: summary.claims + campaign.claimedRiderCount,
    conversions: summary.conversions + campaign.confirmedRiderCount,
    commission: summary.commission + campaign.affiliateCommissionUsd,
  }), { active: 0, claims: 0, conversions: 0, commission: 0 }), [campaigns]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateStore(platform, field, value) {
    setForm((current) => ({
      ...current,
      storeConfig: {
        ...current.storeConfig,
        [platform]: { ...current.storeConfig[platform], [field]: value },
      },
    }));
  }

  function generateCode() {
    const stem = form.affiliateName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 18) || 'RIDE';
    const year = String(new Date().getFullYear()).slice(-2);
    updateField('code', `${stem}${year}`);
  }

  function resetForm() {
    setForm({
      ...EMPTY_FORM,
      plans: { ...EMPTY_FORM.plans },
      storeConfig: {
        ios: { ...EMPTY_FORM.storeConfig.ios },
        android: { ...EMPTY_FORM.storeConfig.android },
      },
    });
    setEditingId(null);
    setError('');
  }

  async function saveCampaign(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const campaign = {
        ...form,
        status: editingId ? campaigns.find((item) => item.id === editingId)?.status || 'draft' : 'draft',
        discountPercent: Number(form.discountPercent),
        discountPeriods: Number(form.discountPeriods),
        maxRiders: form.maxRiders ? Number(form.maxRiders) : null,
        startsAt: form.startsAt ? `${form.startsAt}T00:00:00.000Z` : null,
        endsAt: form.endsAt ? `${form.endsAt}T23:59:59.999Z` : null,
      };
      const response = await authenticatedFetch('/api/stea/dialled-mtb/promo', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({ tenantId: currentTenant.id, id: editingId, campaign }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not save campaign.');
      setNotice(editingId ? `${campaign.code} updated.` : `${campaign.code} created as a draft.`);
      resetForm();
      await loadCampaigns();
    } catch (saveError) {
      setError(saveError.message || 'Could not save campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(campaign, status) {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await authenticatedFetch('/api/stea/dialled-mtb/promo', {
        method: 'PATCH',
        body: JSON.stringify({
          tenantId: currentTenant.id,
          id: campaign.id,
          campaign: { ...campaign, status },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not update campaign.');
      setNotice(`${campaign.code} is now ${status}.`);
      await loadCampaigns();
    } catch (statusError) {
      setError(statusError.message || 'Could not update campaign.');
    } finally {
      setSaving(false);
    }
  }

  function editCampaign(campaign) {
    setEditingId(campaign.id);
    setForm(campaignToForm(campaign));
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!authReady || tenantLoading) {
    return <div className="flex min-h-[65vh] items-center justify-center bg-[#0D1013] text-sm text-[#8A939D]">Checking workspace access…</div>;
  }

  if (!auth) {
    return (
      <main className="min-h-[70vh] bg-[#0D1013] px-5 py-14 text-[#F4F6F8]">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-400/20 bg-[#12161A] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F72585]">Promo administration</p>
          <h1 className="mt-3 text-2xl font-black">Firebase configuration required</h1>
          <p className="mt-3 text-sm leading-6 text-[#C9A7B6]">{error}</p>
          <Link href="/apps/stea" className="mt-6 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-[#E8EBEE] hover:border-[#F72585]/50">Back to STEa</Link>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (!hasWorkspace || !canAdmin) {
    return (
      <main className="min-h-[70vh] bg-[#0D1013] px-5 py-14 text-[#F4F6F8]">
        <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#12161A] p-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#F72585]">Promo administration</p>
          <h1 className="mt-3 text-2xl font-black">Workspace admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-[#8A939D]">Select the Dialled MTB or ArcturusDC workspace with an admin account.</p>
          <div className="mt-6"><TenantSwitcher /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1013] px-4 py-8 text-[#F4F6F8] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[#7E8790]">
              <Link href="/apps/stea/dialled-mtb" className="transition hover:text-[#F72585]">Dialled MTB</Link>
              <span>/</span>
              <span className="text-[#F72585]">Promo campaigns</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Community offer workbench</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8A939D]">Create a readable partner code, map both stores, then activate only when the purchase path is complete.</p>
          </div>
          <div className="flex items-center gap-3"><TenantSwitcher /></div>
        </header>

        <section className="grid grid-cols-2 gap-px overflow-hidden border-b border-white/10 bg-white/10 sm:grid-cols-4">
          {[
            ['Active', totals.active],
            ['Validated riders', totals.claims],
            ['Paid conversions', totals.conversions],
            ['Commission accrued', dollars(totals.commission)],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#0D1013] px-4 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#68717A]">{label}</p>
              <p className="mt-2 font-mono text-xl font-bold text-[#F4F6F8]">{value}</p>
            </div>
          ))}
        </section>

        {(error || notice) && (
          <div className={`mt-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-400/25 bg-red-400/10 text-red-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>
            {error || notice}
          </div>
        )}

        <CampaignRunbook />

        <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.3fr)]">
          <form onSubmit={saveCampaign} className="h-fit rounded-xl border border-white/10 bg-[#12161A] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F72585]">{editingId ? 'Edit campaign' : 'New campaign'}</p>
                <h2 className="mt-2 text-xl font-black">Terms and store mapping</h2>
              </div>
              {editingId && <button type="button" onClick={resetForm} className="text-xs font-semibold text-[#8A939D] hover:text-white">Cancel edit</button>}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label><span className={labelClass}>Affiliate / community</span><input className={inputClass} value={form.affiliateName} onChange={(event) => updateField('affiliateName', event.target.value)} placeholder="Snowdon MTB Group" required /></label>
              <label>
                <span className={labelClass}>Public code</span>
                <div className="flex gap-2">
                  <input className={inputClass} value={form.code} onChange={(event) => updateField('code', event.target.value.toUpperCase())} placeholder="SNOWDON26" disabled={Boolean(editingId)} required />
                  {!editingId && <button type="button" onClick={generateCode} className="rounded-lg border border-white/10 px-3 text-xs font-bold text-[#D7DCE0] hover:border-[#F72585]/40 hover:text-[#FF6EAF]">Generate</button>}
                </div>
              </label>
            </div>

            <div className="mt-5">
              <span className={labelClass}>Eligible plans</span>
              <div className="flex gap-2">
                <Toggle active={form.plans.monthly} onClick={() => updateField('plans', { ...form.plans, monthly: !form.plans.monthly })}>Monthly</Toggle>
                <Toggle active={form.plans.annual} onClick={() => updateField('plans', { ...form.plans, annual: !form.plans.annual })}>Annual</Toggle>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label><span className={labelClass}>Rider discount</span><div className="relative"><input className={inputClass} type="number" min="1" max="80" value={form.discountPercent} onChange={(event) => updateField('discountPercent', event.target.value)} /><span className="absolute right-3 top-2.5 text-sm text-[#68717A]">%</span></div></label>
              <label><span className={labelClass}>Billing periods</span><input className={inputClass} type="number" min="1" max="24" value={form.discountPeriods} onChange={(event) => updateField('discountPeriods', event.target.value)} /></label>
              <label><span className={labelClass}>Rider cap</span><input className={inputClass} type="number" min="1" max="99999" value={form.maxRiders} onChange={(event) => updateField('maxRiders', event.target.value)} placeholder="No cap" /></label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label><span className={labelClass}>Starts</span><input className={inputClass} type="date" value={form.startsAt} onChange={(event) => updateField('startsAt', event.target.value)} /></label>
              <label><span className={labelClass}>Ends (optional)</span><input className={inputClass} type="date" value={form.endsAt} onChange={(event) => updateField('endsAt', event.target.value)} /></label>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm font-bold">App Store mapping</p>
              <p className="mt-1 text-xs leading-5 text-[#7E8790]">The public code maps to plan-specific Apple offer codes and redemption URLs.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {form.plans.monthly && <><label><span className={labelClass}>Monthly Apple code</span><input className={inputClass} value={form.storeConfig.ios.monthlyOfferCode} onChange={(event) => updateStore('ios', 'monthlyOfferCode', event.target.value.toUpperCase())} /></label><label><span className={labelClass}>Monthly redemption URL</span><input className={inputClass} value={form.storeConfig.ios.monthlyRedemptionUrl} onChange={(event) => updateStore('ios', 'monthlyRedemptionUrl', event.target.value)} placeholder="https://apps.apple.com/redeem…" /></label></>}
                {form.plans.annual && <><label><span className={labelClass}>Annual Apple code</span><input className={inputClass} value={form.storeConfig.ios.annualOfferCode} onChange={(event) => updateStore('ios', 'annualOfferCode', event.target.value.toUpperCase())} /></label><label><span className={labelClass}>Annual redemption URL</span><input className={inputClass} value={form.storeConfig.ios.annualRedemptionUrl} onChange={(event) => updateStore('ios', 'annualRedemptionUrl', event.target.value)} placeholder="https://apps.apple.com/redeem…" /></label></>}
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-sm font-bold">Google Play mapping</p>
              <p className="mt-1 text-xs leading-5 text-[#7E8790]">Use RevenueCat's full subscription option ID: base-plan-id:offer-id.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {form.plans.monthly && <label><span className={labelClass}>Monthly option ID</span><input className={inputClass} value={form.storeConfig.android.monthlyOptionId} onChange={(event) => updateStore('android', 'monthlyOptionId', event.target.value)} /></label>}
                {form.plans.annual && <label><span className={labelClass}>Annual option ID</span><input className={inputClass} value={form.storeConfig.android.annualOptionId} onChange={(event) => updateStore('android', 'annualOptionId', event.target.value)} /></label>}
              </div>
            </div>

            <label className="mt-5 block"><span className={labelClass}>Internal notes</span><textarea className={`${inputClass} min-h-20 resize-y`} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Partner contact, event, or agreed terms." /></label>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#0D1013] px-4 py-3">
              <div><p className="text-xs font-bold text-[#D7DCE0]">Affiliate terms</p><p className="mt-1 text-xs text-[#7E8790]">10% of estimated proceeds · first 12 months · refunds reverse accrual</p></div>
              <span className="rounded-full bg-[#F72585]/10 px-2.5 py-1 text-xs font-bold text-[#FF6EAF]">Locked</span>
            </div>

            <button type="submit" disabled={saving} className="mt-5 w-full rounded-lg bg-[#F72585] px-4 py-3 text-sm font-black text-white transition hover:bg-[#D91D72] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving…' : editingId ? 'Save campaign' : 'Create draft campaign'}
            </button>
          </form>

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#68717A]">Campaign ledger</p><h2 className="mt-1 text-xl font-black">{campaigns.length} campaign{campaigns.length === 1 ? '' : 's'}</h2></div>
              <button type="button" onClick={loadCampaigns} disabled={loading} className="text-xs font-bold text-[#8A939D] hover:text-white">{loading ? 'Refreshing…' : 'Refresh'}</button>
            </div>
            <div className="space-y-4">
              {!loading && campaigns.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-[#7E8790]">No campaigns yet. Create the first community offer as a draft.</div>}
              {campaigns.map((campaign) => (
                <article key={campaign.id} className="rounded-xl border border-white/10 bg-[#12161A] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-lg font-black text-[#F4F6F8]">{campaign.code}</code>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${campaign.status === 'active' ? 'bg-emerald-400/10 text-emerald-300' : campaign.status === 'ended' ? 'bg-white/5 text-[#68717A]' : 'bg-amber-400/10 text-amber-300'}`}>{campaign.status}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#D7DCE0]">{campaign.affiliateName}</p>
                      <p className="mt-1 text-xs text-[#7E8790]">{campaign.discountPercent}% off for {campaign.discountPeriods} billing period{campaign.discountPeriods === 1 ? '' : 's'} · {campaign.plans.monthly ? 'Monthly' : ''}{campaign.plans.monthly && campaign.plans.annual ? ' + ' : ''}{campaign.plans.annual ? 'Annual' : ''}</p>
                    </div>
                    <button type="button" onClick={() => editCampaign(campaign)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#D7DCE0] hover:border-[#F72585]/40 hover:text-[#FF6EAF]">Edit mappings</button>
                  </div>

                  <div className="mt-4"><StoreReadinessRail readiness={campaign.storeReadiness} /></div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-y border-white/10 py-4 sm:grid-cols-4">
                    {[
                      ['Claims', `${campaign.claimedRiderCount}${campaign.maxRiders ? ` / ${campaign.maxRiders}` : ''}`],
                      ['Conversions', campaign.confirmedRiderCount],
                      ['Proceeds', dollars(campaign.estimatedProceedsUsd)],
                      ['Commission', dollars(campaign.affiliateCommissionUsd)],
                    ].map(([label, value]) => <div key={label}><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#68717A]">{label}</p><p className="mt-1 font-mono text-sm font-bold text-[#E8EBEE]">{value}</p></div>)}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-[#68717A]">{dateOnly(campaign.startsAt)} → {dateOnly(campaign.endsAt) || 'No end date'}</p>
                    <div className="flex gap-2">
                      {campaign.status !== 'active' && campaign.status !== 'ended' && <button type="button" disabled={saving || !campaign.storeReadiness.ready} onClick={() => changeStatus(campaign, 'active')} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-[#07110C] disabled:cursor-not-allowed disabled:opacity-35">Activate</button>}
                      {campaign.status === 'active' && <button type="button" disabled={saving} onClick={() => changeStatus(campaign, 'paused')} className="rounded-lg border border-amber-400/30 px-3 py-2 text-xs font-black text-amber-200">Pause</button>}
                      {campaign.status !== 'ended' && <button type="button" disabled={saving} onClick={() => changeStatus(campaign, 'ended')} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#8A939D] hover:text-white">End</button>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
