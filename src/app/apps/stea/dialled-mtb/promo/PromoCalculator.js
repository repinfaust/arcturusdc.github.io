'use client';

import { useMemo, useState } from 'react';

const DEFAULT_MODEL = {
  monthlyList: 4.99,
  annualIntro: 29.99,
  annualRenewalPrice: 39.99,
  storeFee: 15,
  taxShare: 0,
  monthlyDiscount: 25,
  promoMonths: 3,
  annualDiscount: 0,
  affiliateRate: 10,
  affiliateMonths: 12,
  members: 30,
  annualShare: 40,
  horizon: 12,
  monthlyChurn: 8,
  annualRenewalRate: 60,
};

const percent = (value) => Math.min(100, Math.max(0, Number(value) || 0));
const positive = (value) => Math.max(0, Number(value) || 0);
const whole = (value, minimum = 0) => Math.max(minimum, Math.round(Number(value) || 0));
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

function NumberField({ assumption = false, label, max, min = 0, onChange, step = 1, suffix, value }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] ${assumption ? 'text-amber-300' : 'text-[#8A939D]'}`}>{label}</span>
      <span className={`flex items-center rounded-lg border bg-[#0D1013] px-3 py-2.5 ${assumption ? 'border-amber-400/25' : 'border-white/10'} focus-within:border-[#F72585]/70 focus-within:ring-2 focus-within:ring-[#F72585]/15`}>
        <input
          type="number"
          className="min-w-0 flex-1 bg-transparent font-mono text-sm font-bold tabular-nums text-[#F4F6F8] outline-none"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.value === '' ? 0 : Number(event.target.value))}
        />
        {suffix && <span className="pl-2 font-mono text-[11px] text-[#68717A]">{suffix}</span>}
      </span>
    </label>
  );
}

function Metric({ label, note, tone = 'neutral', value }) {
  const tones = {
    neutral: 'text-[#F4F6F8]',
    magenta: 'text-[#FF6EAF]',
    good: 'text-emerald-300',
  };
  return (
    <div className="rounded-lg border border-white/10 bg-[#0D1013] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#68717A]">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-black tabular-nums ${tones[tone]}`}>{value}</p>
      {note && <p className="mt-1.5 text-[11px] leading-4 text-[#7E8790]">{note}</p>}
    </div>
  );
}

export default function PromoCalculator() {
  const [model, setModel] = useState(DEFAULT_MODEL);

  function update(name, value) {
    setModel((current) => ({ ...current, [name]: value }));
  }

  const result = useMemo(() => {
    const horizon = whole(model.horizon, 1);
    const promoMonths = whole(model.promoMonths);
    const affiliateMonths = whole(model.affiliateMonths);
    const cohort = whole(model.members);
    const monthlyList = positive(model.monthlyList);
    const annualIntro = positive(model.annualIntro);
    const annualRenewalPrice = positive(model.annualRenewalPrice);
    const storeFactor = Math.max(0, 1 - percent(model.storeFee) / 100 - percent(model.taxShare) / 100);
    const affiliateRate = percent(model.affiliateRate) / 100;
    const monthlySurvival = 1 - percent(model.monthlyChurn) / 100;
    const annualRenewal = percent(model.annualRenewalRate) / 100;

    let monthlyProceeds = 0;
    let monthlyAffiliate = 0;
    let monthlyBaseline = 0;
    let expectedActiveMonths = 0;
    for (let month = 1; month <= horizon; month += 1) {
      const present = Math.pow(monthlySurvival, month - 1);
      const price = month <= promoMonths
        ? monthlyList * (1 - percent(model.monthlyDiscount) / 100)
        : monthlyList;
      const proceeds = price * storeFactor * present;
      expectedActiveMonths += present;
      monthlyProceeds += proceeds;
      monthlyBaseline += monthlyList * storeFactor * present;
      if (month <= affiliateMonths) monthlyAffiliate += proceeds * affiliateRate;
    }

    let annualProceeds = 0;
    let annualAffiliate = 0;
    let annualBaseline = 0;
    const annualCycles = Math.max(1, Math.ceil(horizon / 12));
    for (let cycle = 0; cycle < annualCycles; cycle += 1) {
      const present = Math.pow(annualRenewal, cycle);
      const baselinePrice = cycle === 0 ? annualIntro : annualRenewalPrice;
      const price = cycle === 0
        ? annualIntro * (1 - percent(model.annualDiscount) / 100)
        : annualRenewalPrice;
      const proceeds = price * storeFactor * present;
      annualProceeds += proceeds;
      annualBaseline += baselinePrice * storeFactor * present;
      if (cycle * 12 < affiliateMonths) annualAffiliate += proceeds * affiliateRate;
    }

    const annualMembers = Math.min(cohort, Math.round(cohort * percent(model.annualShare) / 100));
    const monthlyMembers = cohort - annualMembers;
    const monthlyBusiness = monthlyProceeds - monthlyAffiliate;
    const annualBusiness = annualProceeds - annualAffiliate;
    const totalBusiness = monthlyMembers * monthlyBusiness + annualMembers * annualBusiness;
    const totalAffiliate = monthlyMembers * monthlyAffiliate + annualMembers * annualAffiliate;
    const baseline = monthlyMembers * monthlyBaseline + annualMembers * annualBaseline;
    const survivors = monthlyMembers * Math.pow(monthlySurvival, promoMonths) + annualMembers;

    return {
      annualAffiliate,
      annualBusiness,
      annualMembers,
      bountyPerSignup: cohort ? totalAffiliate / cohort : 0,
      bountyPerSurvivor: survivors ? totalAffiliate / survivors : 0,
      channelCost: baseline - totalBusiness,
      expectedActiveMonths,
      horizon,
      monthlyAffiliate,
      monthlyBusiness,
      monthlyMembers,
      storeFactor,
      totalAffiliate,
      totalBusiness,
    };
  }, [model]);

  return (
    <details id="campaign-calculator" className="group mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#12161A]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 outline-none transition hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F72585]/60 sm:px-6 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F72585]">Campaign economics</p>
          <h2 className="mt-1 text-xl font-black">Promo &amp; affiliate calculator</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#8A939D]">Model discount, retention, payout, and channel cost. Inputs stay in this browser session and are never saved.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#8A939D] group-open:text-[#FF6EAF]">
          <span className="group-open:hidden">Open calculator</span>
          <span className="hidden group-open:inline">Hide calculator</span>
        </span>
      </summary>

      <div className="border-t border-white/10 px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#B9A98C]"><strong className="text-amber-200">Scenario only.</strong> Amber fields are assumptions, not measured performance. Live campaigns remain locked to 10% commission for 12 months.</p>
          <button type="button" onClick={() => setModel(DEFAULT_MODEL)} className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-[#D7DCE0] transition hover:border-[#F72585]/40 hover:text-white">Reset defaults</button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#15191D] p-4 sm:p-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8A939D]">Price and offer</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              <NumberField label="Monthly list" value={model.monthlyList} onChange={(value) => update('monthlyList', value)} suffix="£" step={0.01} />
              <NumberField label="Annual intro · year 1" value={model.annualIntro} onChange={(value) => update('annualIntro', value)} suffix="£" step={0.01} />
              <NumberField label="Annual renewal" value={model.annualRenewalPrice} onChange={(value) => update('annualRenewalPrice', value)} suffix="£" step={0.01} />
              <NumberField label="Store fee" value={model.storeFee} onChange={(value) => update('storeFee', value)} suffix="%" max={100} />
              <NumberField assumption label="Tax share estimate" value={model.taxShare} onChange={(value) => update('taxShare', value)} suffix="%" max={100} step={0.1} />
              <NumberField label="Monthly discount" value={model.monthlyDiscount} onChange={(value) => update('monthlyDiscount', value)} suffix="%" max={100} />
              <NumberField label="Promo duration" value={model.promoMonths} onChange={(value) => update('promoMonths', value)} suffix="mo" />
              <NumberField label="Annual extra discount" value={model.annualDiscount} onChange={(value) => update('annualDiscount', value)} suffix="%" max={100} />
              <NumberField assumption label="Affiliate rate" value={model.affiliateRate} onChange={(value) => update('affiliateRate', value)} suffix="%" max={100} />
              <NumberField assumption label="Affiliate window" value={model.affiliateMonths} onChange={(value) => update('affiliateMonths', value)} suffix="mo" />
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#15191D] p-4 sm:p-5">
            <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8A939D]">Cohort and retention</h3>
            <p className="mt-1 text-[11px] text-amber-300">Amber values are planning assumptions until real cohort data replaces them.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              <NumberField assumption label="Expected members" value={model.members} onChange={(value) => update('members', value)} />
              <NumberField assumption label="Annual mix" value={model.annualShare} onChange={(value) => update('annualShare', value)} suffix="%" max={100} />
              <NumberField assumption label="Horizon" value={model.horizon} onChange={(value) => update('horizon', value)} suffix="mo" min={1} />
              <NumberField assumption label="Monthly churn" value={model.monthlyChurn} onChange={(value) => update('monthlyChurn', value)} suffix="%/mo" max={100} step={0.1} />
              <NumberField assumption label="Annual renewal" value={model.annualRenewalRate} onChange={(value) => update('annualRenewalRate', value)} suffix="%" max={100} step={0.1} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
              {[
                ['Monthly', result.monthlyMembers],
                ['Annual', result.annualMembers],
                ['Avg active', `${result.expectedActiveMonths.toFixed(1)} mo`],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#0D1013] px-3 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#68717A]">{label}</p>
                  <p className="mt-1 font-mono text-sm font-black tabular-nums text-[#E8EBEE]">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#68717A]">Per member · expected over {result.horizon} months</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Monthly · business net" value={gbp.format(result.monthlyBusiness)} note={`Club earns ${gbp.format(result.monthlyAffiliate)}`} tone="magenta" />
            <Metric label="Annual · business net" value={gbp.format(result.annualBusiness)} note={`Club earns ${gbp.format(result.annualAffiliate)}`} tone="magenta" />
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#68717A]">Campaign total · {result.monthlyMembers} monthly + {result.annualMembers} annual</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Metric label="Net to business" value={gbp.format(result.totalBusiness)} tone="good" />
            <Metric label="Total club payout" value={gbp.format(result.totalAffiliate)} tone="magenta" />
            <Metric label="Channel cost" value={gbp.format(result.channelCost)} note="Discount + affiliate cost versus the same retained cohort at list price" />
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#68717A]">Equivalent one-off bounty</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Metric label="Per signup" value={gbp.format(result.bountyPerSignup)} note="Paid on every member, including early churners" />
            <Metric label="Per promo survivor" value={gbp.format(result.bountyPerSurvivor)} note="Paid only after a member clears the promo period" tone="good" />
          </div>
        </section>

        <div className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-[#7E8790]">
          Figures are survival-weighted: churned monthly members stop contributing revenue and commission. Estimated proceeds use price × (1 − store fee − tax share); actual RevenueCat transaction estimates and refund events remain authoritative.
        </div>
      </div>
    </details>
  );
}
