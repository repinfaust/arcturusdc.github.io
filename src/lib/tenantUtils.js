import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Create a new tenant/workspace
 */
export async function createTenant({ name, plan = 'team', ownerEmail }) {
  try {
    const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

    // Check for duplicate workspace name for this owner
    const tenantsRef = collection(db, 'tenants');
    const duplicateQuery = query(
      tenantsRef,
      where('ownerEmail', '==', ownerEmail),
      where('name', '==', name)
    );
    const duplicateSnapshot = await getDocs(duplicateQuery);

    if (!duplicateSnapshot.empty) {
      throw new Error(`You already have a workspace named "${name}". Please choose a different name.`);
    }

    const tenantData = {
      name,
      plan, // 'solo', 'team', 'agency'
      createdAt: serverTimestamp(),
      ownerEmail,
      settings: {
        customBranding: {},
        features: {},
      },
    };

    const tenantRef = await addDoc(collection(db, 'tenants'), tenantData);

    // Don't add super admins as members - they manage but don't access customer data
    if (!SUPER_ADMINS.includes(ownerEmail)) {
      await addTenantMember({
        tenantId: tenantRef.id,
        userEmail: ownerEmail,
        role: 'admin',
        invitedBy: ownerEmail,
      });
    }

    return { id: tenantRef.id, ...tenantData };
  } catch (error) {
    console.error('Error creating tenant:', error);
    if (error.code === 'failed-precondition' || error.message?.includes('ns binding')) {
      throw new Error('Database connection error. Please refresh the page and try again.');
    }
    throw error;
  }
}

/**
 * Add a user to a tenant
 */
export async function addTenantMember({ tenantId, userEmail, role = 'member', invitedBy }) {
  try {
    const membershipId = `${userEmail}_${tenantId}`;

    const memberData = {
      tenantId,
      userEmail: userEmail.toLowerCase(),
      uid: null, // Will be set on first login
      role, // 'admin' | 'member' | 'tester'
      invitedAt: serverTimestamp(),
      invitedBy,
      status: 'active',
    };

    await setDoc(doc(db, 'tenant_members', membershipId), memberData);

    return { id: membershipId, ...memberData };
  } catch (error) {
    console.error('Error adding tenant member:', error);
    if (error.code === 'failed-precondition' || error.message?.includes('ns binding')) {
      throw new Error('Database connection error. Please refresh the page and try again.');
    }
    throw error;
  }
}

/**
 * Remove a user from a tenant
 */
export async function removeTenantMember(tenantId, userEmail) {
  const membershipId = `${userEmail}_${tenantId}`;
  await deleteDoc(doc(db, 'tenant_members', membershipId));
}

/**
 * Update a user's role in a tenant
 */
export async function updateMemberRole(tenantId, userEmail, newRole) {
  const membershipId = `${userEmail}_${tenantId}`;
  await updateDoc(doc(db, 'tenant_members', membershipId), {
    role: newRole,
  });
}

/**
 * Get all members of a tenant
 */
export async function getTenantMembers(tenantId) {
  try {
    const membersRef = collection(db, 'tenant_members');
    const q = query(membersRef, where('tenantId', '==', tenantId));
    const snapshot = await getDocs(q);

    const members = [];
    snapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });

    return members;
  } catch (error) {
    console.error('Error fetching tenant members:', error);
    // Return empty array instead of throwing to prevent UI crashes
    if (error.code === 'failed-precondition' || error.message?.includes('ns binding')) {
      console.error('Firestore initialization error. Try refreshing the page.');
    }
    throw error;
  }
}

/**
 * Get all tenants (admin only)
 */
export async function getAllTenants() {
  try {
    const tenantsRef = collection(db, 'tenants');
    const snapshot = await getDocs(tenantsRef);

    const tenants = [];
    snapshot.forEach((doc) => {
      tenants.push({ id: doc.id, ...doc.data() });
    });

    return tenants;
  } catch (error) {
    console.error('Error fetching all tenants:', error);
    if (error.code === 'failed-precondition' || error.message?.includes('ns binding')) {
      console.error('Firestore initialization error. Try refreshing the page.');
    }
    throw error;
  }
}

/**
 * Update tenant details
 */
export async function updateTenant(tenantId, updates) {
  await updateDoc(doc(db, 'tenants', tenantId), updates);
}

/**
 * Delete a tenant and all its members
 */
export async function deleteTenant(tenantId) {
  // Delete all members
  const members = await getTenantMembers(tenantId);
  for (const member of members) {
    await deleteDoc(doc(db, 'tenant_members', member.id));
  }

  // Delete tenant
  await deleteDoc(doc(db, 'tenants', tenantId));
}

/**
 * Check if user has access to a tenant
 */
export async function checkTenantAccess(userEmail, tenantId) {
  const membershipId = `${userEmail}_${tenantId}`;
  const memberDoc = await getDoc(doc(db, 'tenant_members', membershipId));

  if (!memberDoc.exists()) {
    return { hasAccess: false, role: null };
  }

  const data = memberDoc.data();
  return {
    hasAccess: data.status === 'active',
    role: data.role,
  };
}
