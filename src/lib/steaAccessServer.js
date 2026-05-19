import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

const SESSION_COOKIE_NAME = '__session';
const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeName(name) {
  return typeof name === 'string' ? name.trim().toLowerCase() : '';
}

function formatWorkspaceList(workspaceNames) {
  if (workspaceNames.length <= 1) return workspaceNames[0] || 'required';
  return `${workspaceNames.slice(0, -1).join(', ')} or ${workspaceNames[workspaceNames.length - 1]}`;
}

async function verifyRequiredWorkspace(db, tenantId, workspaceNames) {
  if (!workspaceNames.length) return { ok: true };

  const workspaceLabel = formatWorkspaceList(workspaceNames);
  if (!tenantId) return { ok: false, error: `${workspaceLabel} workspace must be selected.` };

  const tenantDoc = await db.collection('tenants').doc(tenantId).get();
  if (!tenantDoc.exists) return { ok: false, error: `${workspaceLabel} workspace was not found.` };

  const tenant = tenantDoc.data() || {};
  const allowedNames = new Set(workspaceNames.map(normalizeName));
  if (!allowedNames.has(normalizeName(tenant.name))) {
    return { ok: false, error: `Select the ${workspaceLabel} workspace to use this tool.` };
  }

  return { ok: true, tenant: { id: tenantDoc.id, ...tenant } };
}

export async function verifySteaWorkspaceAccess(request, { tenantId, requiredWorkspaceName, allowedWorkspaceNames } = {}) {
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

    const workspaceNames = Array.isArray(allowedWorkspaceNames)
      ? allowedWorkspaceNames
      : requiredWorkspaceName
        ? [requiredWorkspaceName]
        : [];
    const workspaceCheck = await verifyRequiredWorkspace(db, tenantId, workspaceNames);
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
