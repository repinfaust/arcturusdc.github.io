import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Mirrors the membership logic in steaAccessServer.js, but for the STEa
// Companion desktop app, which authenticates with a bearer Firebase ID token
// in the Authorization header rather than a __session cookie. The tenant
// access rules are identical (AC14): super-admin bypass, otherwise an active
// tenant_members/{email}_{tenantId} membership is required.

const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function getBearerToken(request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

/**
 * Verify the caller's Firebase ID token. Does NOT check tenant membership —
 * use requireTenantAccess for routes that touch tenant-scoped data.
 * @returns {Promise<{ok:true, user:{uid,email}}|{ok:false,status:number,error:string}>}
 */
export async function verifyCompanionUser(request) {
  const token = getBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  try {
    const { auth } = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(token, true);
    const email = normalizeEmail(decoded.email);
    if (!email) {
      return { ok: false, status: 403, error: 'Signed-in account has no email.' };
    }
    return { ok: true, user: { uid: decoded.uid, email } };
  } catch (error) {
    console.warn('[companion-auth] token verification failed', {
      code: error?.code,
      message: error?.message,
    });
    return { ok: false, status: 401, error: 'Invalid or expired token.' };
  }
}

/**
 * Verify the user AND confirm they have active access to the given tenant.
 * Super-admins bypass the membership check. This is the gate every
 * tenant-scoped read or write must pass (AC14).
 * @returns {Promise<{ok:true, user:{uid,email,role,tenantId}}|{ok:false,status,error}>}
 */
export async function requireTenantAccess(request, tenantId) {
  const userResult = await verifyCompanionUser(request);
  if (!userResult.ok) return userResult;

  const { uid, email } = userResult.user;

  if (SUPER_ADMINS.includes(email)) {
    return { ok: true, user: { uid, email, role: 'super_admin', tenantId: tenantId || null } };
  }

  if (!tenantId || typeof tenantId !== 'string') {
    return { ok: false, status: 403, error: 'Workspace access required.' };
  }

  const { db } = getFirebaseAdmin();
  const membershipId = `${email}_${tenantId}`;
  const membership = await db.collection('tenant_members').doc(membershipId).get();

  if (!membership.exists) {
    return { ok: false, status: 403, error: 'Workspace access required.' };
  }

  const data = membership.data() || {};
  if (data.status !== 'active') {
    return { ok: false, status: 403, error: 'Workspace access is not active.' };
  }

  return {
    ok: true,
    user: { uid, email, role: data.role || 'member', tenantId },
  };
}

/**
 * List the tenants (workspaces) the user has active access to. Super-admins
 * get every tenant. Returns [{id, name, ...}].
 */
export async function listAccessibleTenants(user) {
  const { db } = getFirebaseAdmin();

  if (user.role === 'super_admin' || SUPER_ADMINS.includes(user.email)) {
    const snap = await db.collection('tenants').get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Membership docs use `userEmail` (lower-cased) and id `${userEmail}_${tenantId}`
  // — see addTenantMemberAdmin in tenantUtils-admin.js.
  const memberSnap = await db
    .collection('tenant_members')
    .where('userEmail', '==', user.email)
    .where('status', '==', 'active')
    .get();

  const tenantIds = memberSnap.docs
    .map((d) => d.data()?.tenantId)
    .filter((id) => typeof id === 'string');

  if (tenantIds.length === 0) return [];

  const tenantDocs = await Promise.all(
    tenantIds.map((id) => db.collection('tenants').doc(id).get())
  );
  return tenantDocs
    .filter((d) => d.exists)
    .map((d) => ({ id: d.id, ...d.data() }));
}
