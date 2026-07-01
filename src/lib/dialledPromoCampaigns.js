export const PROMO_STATUSES = ['draft', 'active', 'paused', 'ended'];
export const PROMO_ELIGIBILITY = 'new_subscribers';
export const AFFILIATE_COMMISSION_PERCENT = 10;
export const AFFILIATE_COMMISSION_MONTHS = 12;
export const AFFILIATE_COMMISSION_BASIS = 'estimated_proceeds';

const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;

export function normalizePromoCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function normalizeAffiliateId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function cleanString(value, maxLength = 500) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanNullableString(value, maxLength = 500) {
  const cleaned = cleanString(value, maxLength);
  return cleaned || null;
}

function cleanHttpsUrl(value) {
  const cleaned = cleanNullableString(value, 1000);
  if (!cleaned) return null;
  try {
    const url = new URL(cleaned);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function cleanInteger(value, min, max, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export function normalizeStoreConfig(value = {}) {
  const ios = value?.ios || {};
  const android = value?.android || {};
  return {
    ios: {
      monthlyOfferCode: cleanNullableString(ios.monthlyOfferCode, 64),
      monthlyRedemptionUrl: cleanHttpsUrl(ios.monthlyRedemptionUrl),
      annualOfferCode: cleanNullableString(ios.annualOfferCode, 64),
      annualRedemptionUrl: cleanHttpsUrl(ios.annualRedemptionUrl),
    },
    android: {
      monthlyOptionId: cleanNullableString(android.monthlyOptionId, 160),
      annualOptionId: cleanNullableString(android.annualOptionId, 160),
    },
  };
}

export function deriveStoreReadiness(plans, storeConfig) {
  const monthly = Boolean(plans?.monthly);
  const annual = Boolean(plans?.annual);
  const ios = storeConfig?.ios || {};
  const android = storeConfig?.android || {};

  const iosMissing = [];
  const androidMissing = [];
  if (monthly) {
    if (!ios.monthlyOfferCode) iosMissing.push('monthly offer code');
    if (!ios.monthlyRedemptionUrl) iosMissing.push('monthly redemption URL');
    if (!android.monthlyOptionId) androidMissing.push('monthly option ID');
  }
  if (annual) {
    if (!ios.annualOfferCode) iosMissing.push('annual offer code');
    if (!ios.annualRedemptionUrl) iosMissing.push('annual redemption URL');
    if (!android.annualOptionId) androidMissing.push('annual option ID');
  }

  return {
    ios: { ready: iosMissing.length === 0, missing: iosMissing },
    android: { ready: androidMissing.length === 0, missing: androidMissing },
    ready: (monthly || annual) && iosMissing.length === 0 && androidMissing.length === 0,
  };
}

export function parseCampaignInput(input = {}, existing = null) {
  const code = normalizePromoCode(input.code ?? existing?.code);
  const affiliateName = cleanString(input.affiliateName ?? existing?.affiliateName, 120);
  const affiliateId = normalizeAffiliateId(input.affiliateId ?? existing?.affiliateId ?? affiliateName);
  const plans = {
    monthly: Boolean(input.plans?.monthly ?? existing?.plans?.monthly),
    annual: Boolean(input.plans?.annual ?? existing?.plans?.annual),
  };
  const storeConfig = normalizeStoreConfig(input.storeConfig ?? existing?.storeConfig);
  const status = cleanString(input.status ?? existing?.status ?? 'draft', 20).toLowerCase();
  const startsAt = cleanNullableString(input.startsAt, 40) ?? existing?.startsAt ?? null;
  const endsAt = input.endsAt === null
    ? null
    : cleanNullableString(input.endsAt, 40) ?? existing?.endsAt ?? null;

  const rawMaxRiders = Object.prototype.hasOwnProperty.call(input, 'maxRiders')
    ? input.maxRiders
    : existing?.maxRiders;

  const campaign = {
    code,
    affiliateName,
    affiliateId,
    status,
    eligibility: PROMO_ELIGIBILITY,
    plans,
    discountPercent: cleanInteger(input.discountPercent ?? existing?.discountPercent, 1, 80),
    discountPeriods: cleanInteger(input.discountPeriods ?? existing?.discountPeriods, 1, 24),
    maxRiders: cleanInteger(rawMaxRiders, 1, 99999, null),
    startsAt,
    endsAt,
    notes: cleanString(input.notes ?? existing?.notes, 1000),
    commissionPercent: AFFILIATE_COMMISSION_PERCENT,
    commissionMonths: AFFILIATE_COMMISSION_MONTHS,
    commissionBasis: AFFILIATE_COMMISSION_BASIS,
    storeConfig,
  };

  const errors = [];
  if (!CODE_PATTERN.test(code)) errors.push('Code must be 4–32 letters, numbers or hyphens.');
  if (affiliateName.length < 2) errors.push('Affiliate/community name is required.');
  if (!affiliateId) errors.push('Affiliate identifier is required.');
  if (!PROMO_STATUSES.includes(status)) errors.push('Invalid campaign status.');
  if (!plans.monthly && !plans.annual) errors.push('Select monthly, annual or both.');
  if (!campaign.discountPercent) errors.push('Discount must be a whole percentage from 1 to 80.');
  if (!campaign.discountPeriods) errors.push('Discount period must be between 1 and 24 billing periods.');
  if (rawMaxRiders !== '' && rawMaxRiders !== null && rawMaxRiders !== undefined && campaign.maxRiders === null) {
    errors.push('Rider cap must be a whole number from 1 to 99,999, or left blank.');
  }

  const inputStoreConfig = input.storeConfig ?? existing?.storeConfig ?? {};
  for (const [label, value] of [
    ['Monthly App Store redemption URL', inputStoreConfig?.ios?.monthlyRedemptionUrl],
    ['Annual App Store redemption URL', inputStoreConfig?.ios?.annualRedemptionUrl],
  ]) {
    if (cleanNullableString(value, 1000) && !cleanHttpsUrl(value)) {
      errors.push(`${label} must be a valid HTTPS URL.`);
    }
  }

  const startDate = startsAt ? new Date(startsAt) : new Date();
  const endDate = endsAt ? new Date(endsAt) : null;
  if (Number.isNaN(startDate.getTime())) errors.push('Start date must be a valid date.');
  if (endDate && Number.isNaN(endDate.getTime())) errors.push('End date must be a valid date.');
  if (endDate && !Number.isNaN(startDate.getTime()) && endDate <= startDate) {
    errors.push('End date must be after the start date.');
  }

  const readiness = deriveStoreReadiness(plans, storeConfig);
  if (status === 'active' && !readiness.ready) {
    errors.push('Campaign cannot be activated until iOS and Android mappings are ready.');
  }

  return {
    campaign: {
      ...campaign,
      startsAt: Number.isNaN(startDate.getTime()) ? null : startDate,
      endsAt: endDate && !Number.isNaN(endDate.getTime()) ? endDate : null,
      storeReadiness: readiness,
    },
    errors,
  };
}

export function serializeCampaignDoc(doc) {
  const data = typeof doc.data === 'function' ? doc.data() || {} : doc || {};
  const toIso = (value) => {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const storeConfig = normalizeStoreConfig(data.storeConfig);

  return {
    id: doc.id || data.code,
    code: data.code || doc.id || '',
    affiliateName: data.affiliateName || '',
    affiliateId: data.affiliateId || '',
    status: data.status || 'draft',
    eligibility: data.eligibility || PROMO_ELIGIBILITY,
    plans: { monthly: Boolean(data.plans?.monthly), annual: Boolean(data.plans?.annual) },
    discountPercent: Number(data.discountPercent || 0),
    discountPeriods: Number(data.discountPeriods || 0),
    maxRiders: Number.isFinite(data.maxRiders) ? data.maxRiders : null,
    claimedRiderCount: Number(data.claimedRiderCount || 0),
    confirmedRiderCount: Number(data.confirmedRiderCount || 0),
    grossRevenueUsd: Number(data.grossRevenueUsd || 0),
    estimatedProceedsUsd: Number(data.estimatedProceedsUsd || 0),
    affiliateCommissionUsd: Number(data.affiliateCommissionUsd || 0),
    grossRevenueGbp: Number(data.grossRevenueGbp || 0),
    estimatedProceedsGbp: Number(data.estimatedProceedsGbp || 0),
    affiliateCommissionGbp: Number(data.affiliateCommissionGbp || 0),
    revenueEventCount: Number(data.revenueEventCount || 0),
    startsAt: toIso(data.startsAt),
    endsAt: toIso(data.endsAt),
    notes: data.notes || '',
    commissionPercent: Number(data.commissionPercent ?? AFFILIATE_COMMISSION_PERCENT),
    commissionMonths: Number(data.commissionMonths ?? AFFILIATE_COMMISSION_MONTHS),
    commissionBasis: data.commissionBasis || AFFILIATE_COMMISSION_BASIS,
    storeConfig,
    storeReadiness: deriveStoreReadiness(data.plans, storeConfig),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: data.createdBy || null,
    updatedBy: data.updatedBy || null,
  };
}
