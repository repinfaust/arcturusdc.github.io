import { NextResponse } from 'next/server';

import { getDialledMtbAdmin } from '@/lib/dialledMtbAdmin';
import {
  normalizePromoCode,
  parseCampaignInput,
  serializeCampaignDoc,
} from '@/lib/dialledPromoCampaigns';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_WORKSPACES = ['Dialled MTB', 'ArcturusDC'];
const ADMIN_ROLES = new Set(['super_admin', 'admin']);

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

async function requirePromoAdmin(request, tenantId) {
  const access = await verifySteaWorkspaceAccess(request, {
    tenantId,
    allowedWorkspaceNames: ALLOWED_WORKSPACES,
  });
  if (!access.ok) return access;
  if (!ADMIN_ROLES.has(access.user.role)) {
    return { ok: false, status: 403, error: 'Workspace admin access is required.' };
  }
  return access;
}

function campaignWriteData(campaign, actorEmail) {
  return {
    code: campaign.code,
    affiliateName: campaign.affiliateName,
    affiliateId: campaign.affiliateId,
    status: campaign.status,
    eligibility: campaign.eligibility,
    plans: campaign.plans,
    discountPercent: campaign.discountPercent,
    discountPeriods: campaign.discountPeriods,
    maxRiders: campaign.maxRiders,
    startsAt: campaign.startsAt,
    endsAt: campaign.endsAt,
    notes: campaign.notes,
    commissionPercent: campaign.commissionPercent,
    commissionMonths: campaign.commissionMonths,
    commissionBasis: campaign.commissionBasis,
    storeConfig: campaign.storeConfig,
    updatedBy: actorEmail,
  };
}

export async function GET(request) {
  const url = new URL(request.url);
  const access = await requirePromoAdmin(request, url.searchParams.get('tenantId') || '');
  if (!access.ok) return json({ error: access.error }, access.status);

  try {
    const { db } = getDialledMtbAdmin();
    const snapshot = await db.collection('promoCampaigns').orderBy('createdAt', 'desc').limit(200).get();
    return json({
      campaigns: snapshot.docs.map(serializeCampaignDoc),
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[dialled-promo] list failed', error);
    return json({ error: error?.message || 'Could not load promo campaigns.' }, 500);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const access = await requirePromoAdmin(request, body?.tenantId);
  if (!access.ok) return json({ error: access.error }, access.status);

  const parsed = parseCampaignInput(body?.campaign);
  if (parsed.errors.length) return json({ error: parsed.errors.join(' '), fields: parsed.errors }, 400);

  try {
    const { db, FieldValue } = getDialledMtbAdmin();
    const ref = db.collection('promoCampaigns').doc(parsed.campaign.code);
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) throw Object.assign(new Error('That promo code already exists.'), { status: 409 });
      transaction.create(ref, {
        ...campaignWriteData(parsed.campaign, access.user.email),
        claimedRiderCount: 0,
        confirmedRiderCount: 0,
        grossRevenueUsd: 0,
        estimatedProceedsUsd: 0,
        affiliateCommissionUsd: 0,
        grossRevenueGbp: 0,
        estimatedProceedsGbp: 0,
        affiliateCommissionGbp: 0,
        revenueEventCount: 0,
        createdBy: access.user.email,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    const saved = await ref.get();
    return json({ campaign: serializeCampaignDoc(saved) }, 201);
  } catch (error) {
    console.error('[dialled-promo] create failed', error);
    return json({ error: error?.message || 'Could not create promo campaign.' }, error?.status || 500);
  }
}

export async function PATCH(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const access = await requirePromoAdmin(request, body?.tenantId);
  if (!access.ok) return json({ error: access.error }, access.status);

  const id = normalizePromoCode(body?.id);
  if (!id) return json({ error: 'Campaign code is required.' }, 400);

  try {
    const { db, FieldValue } = getDialledMtbAdmin();
    const ref = db.collection('promoCampaigns').doc(id);
    const current = await ref.get();
    if (!current.exists) return json({ error: 'Promo campaign not found.' }, 404);

    const currentData = serializeCampaignDoc(current);
    const parsed = parseCampaignInput({ ...body?.campaign, code: id }, currentData);
    if (parsed.campaign.code !== id) return json({ error: 'Promo codes cannot be renamed.' }, 400);
    if (parsed.errors.length) return json({ error: parsed.errors.join(' '), fields: parsed.errors }, 400);

    await ref.set({
      ...campaignWriteData(parsed.campaign, access.user.email),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    const saved = await ref.get();
    return json({ campaign: serializeCampaignDoc(saved) });
  } catch (error) {
    console.error('[dialled-promo] update failed', error);
    return json({ error: error?.message || 'Could not update promo campaign.' }, 500);
  }
}
