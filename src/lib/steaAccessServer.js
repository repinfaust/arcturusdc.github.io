import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SESSION_COOKIE_NAME = '__session';
const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeName(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : '';
}

async function verifyRequiredWorkspace(db, tenantId, requiredWorkspaceName) {
  if (!requiredWorkspaceName) return { ok: true };
  if (!tenantId) return { ok: false, error: `${requiredWorkspaceName} workspace must be selected.` };

  const tenantDoc = await db.collection('tenants').doc(tenantId).get();
  if (!tenantDoc.exists) return { ok: false, error: `${requiredWorkspaceName} workspace was not found.` };

  const tenant = tenantDoc.data() || {};
  if (normalizeName(tenant.name) !== normalizeName(requiredWorkspaceName)) {
    return { ok: false, error: `Select the ${requiredWorkspaceName} workspace to use this tool.` };
  }

  return { ok: true, tenant: { id: tenantDoc.id, ...tenant } };
}

export async function verifySteaWorkspaceAccess(request, { tenantId, requiredWorkspaceName } = {}) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }

  try {
    const { auth, db } = getFirebaseAdmin();
    const claims = await auth.verifySessionCookie(sessionCookie, true);
    const email = normalizeEmail(claims.email);

    if (!email) {
      return { ok: false, status: 403, error: 'Signed-in account has no email.' };
    }

    const workspaceCheck = await verifyRequiredWorkspace(db, tenantId, requiredWorkspaceName);
    if (!workspaceCheck.ok) {
      return { ok: false, status: 403, error: workspaceCheck.error };
    }

    if (SUPER_ADMINS.includes(email)) {
      return {
        ok: true,
        user: { uid: claims.uid, email, role: 'super_admin' },
        tenant: workspaceCheck.tenant || null,
      };
    }

    if (!tenantId || typeof tenantId !== 'string') {
      return { ok: false, status: 403, error: 'Workspace access required.' };
    }

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
      user: {
        uid: claims.uid,
        email,
        role: data.role || 'member',
        tenantId,
      },
      tenant: workspaceCheck.tenant || null,
    };
  } catch (error) {
    console.warn('[stea-access] session verification failed', {
      code: error?.code,
      message: error?.message,
    });
    return { ok: false, status: 401, error: 'Invalid or expired session.' };
  }
}
