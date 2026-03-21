import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { buildPolicyBundle, buildSeedDataset, classifyPromptLocal, riskLabelForTier } from '@/lib/sorr/controlui';

const SESSION_COOKIE_NAME = '__session';
const COLLECTIONS = {
  users: 'sorr_control_users',
  requests: 'sorr_control_requests',
  policyBundles: 'sorr_control_policyBundles',
  auditLog: 'sorr_control_auditLog',
};

function toIso(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  return null;
}

function normalizeDoc(doc) {
  const data = doc.data() || {};
  const out = { id: doc.id, ...data };
  if (data.createdAt) out.createdAt = toIso(data.createdAt);
  if (data.updatedAt) out.updatedAt = toIso(data.updatedAt);
  return out;
}

function computeKpis(requests) {
  const pending = requests.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const highRisk = requests.filter((r) => Number(r.tier) >= 3).length;
  const avgRisk =
    requests.length > 0
      ? Number((requests.reduce((sum, r) => sum + Number(r.tier || 0), 0) / (requests.length * 4)).toFixed(2))
      : 0;

  return {
    pendingApprovals: 42,
    pendingActual: pending,
    highRiskEscalations: highRisk,
    throughput24h: 128,
    avgRiskScore: avgRisk,
    safetyGates: 'ONLINE',
  };
}

export async function verifySorrSession(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return { authenticated: false, error: 'No session cookie found. Please sign in.' };
  }

  try {
    const { auth } = getFirebaseAdmin();
    const claims = await auth.verifySessionCookie(sessionCookie, true);
    return {
      authenticated: true,
      user: {
        uid: claims.uid,
        email: claims.email || 'unknown@unknown',
      },
    };
  } catch {
    return { authenticated: false, error: 'Invalid or expired session. Please sign in again.' };
  }
}

export async function getSorrDb() {
  const { db, FieldValue } = getFirebaseAdmin();
  return { db, FieldValue };
}

export async function ensureSeedData(db) {
  const requestSnapshot = await db.collection(COLLECTIONS.requests).limit(1).get();
  if (!requestSnapshot.empty) return;

  const seed = buildSeedDataset();
  const batch = db.batch();

  for (const request of seed.requests) {
    const requestRef = db.collection(COLLECTIONS.requests).doc(request.id);
    batch.set(requestRef, {
      ...request,
      createdAt: new Date(request.createdAt),
      updatedAt: new Date(request.updatedAt),
    });

    const policyRef = db.collection(COLLECTIONS.policyBundles).doc(request.id);
    const baseClassification = classifyPromptLocal(request.prompt);
    const policy = buildPolicyBundle(request.id, {
      ...baseClassification,
      tier: request.tier,
      route: request.route,
      riskLabel: riskLabelForTier(request.tier),
      matchedUseCase: {
        id: request.useCaseId,
        name: request.useCaseName,
        summary: baseClassification.matchedUseCase?.summary || request.useCaseName,
      },
      confidence: request.confidence,
      blocked: false,
    });
    batch.set(policyRef, policy);
  }

  for (const event of seed.auditLog) {
    const auditRef = db.collection(COLLECTIONS.auditLog).doc(event.id);
    batch.set(auditRef, {
      ...event,
      createdAt: new Date(event.createdAt),
    });
  }

  await batch.commit();
}

export async function upsertSorrUser(db, user) {
  if (!user?.uid) return;
  const now = new Date();
  const ref = db.collection(COLLECTIONS.users).doc(user.uid);
  const existing = await ref.get();
  const existingData = existing.exists ? existing.data() || {} : {};

  await ref.set(
    {
      uid: user.uid,
      email: user.email || existingData.email || null,
      displayName: existingData.displayName || null,
      assignedRoles: Array.isArray(existingData.assignedRoles) ? existingData.assignedRoles : ['support_lead'],
      updatedAt: now,
      createdAt: existingData.createdAt || now,
    },
    { merge: true }
  );
}

export async function getDashboardPayload(db) {
  const [requestsSnap, auditSnap] = await Promise.all([
    db.collection(COLLECTIONS.requests).orderBy('createdAt', 'desc').limit(200).get(),
    db.collection(COLLECTIONS.auditLog).orderBy('createdAt', 'desc').limit(300).get(),
  ]);

  const requests = requestsSnap.docs.map(normalizeDoc);
  const auditLog = auditSnap.docs.map(normalizeDoc);
  const kpis = computeKpis(requests);

  return {
    kpis,
    requests,
    auditLog,
  };
}

export { COLLECTIONS };
