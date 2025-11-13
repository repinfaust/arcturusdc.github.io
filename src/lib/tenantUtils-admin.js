/**
 * Server-side tenant utilities using Firebase Admin SDK
 * For use in API routes
 */

import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

/**
 * Create a new tenant/workspace (server-side)
 */
export async function createTenantAdmin({ name, plan = 'team', ownerEmail }) {
  try {
    const SUPER_ADMINS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

    const tenantData = {
      name,
      plan, // 'solo-monthly', 'solo-yearly', 'team-monthly', etc.
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ownerEmail: ownerEmail.toLowerCase(),
      settings: {
        customBranding: {},
        features: {},
      },
    };

    const tenantRef = await adminDb.collection('tenants').add(tenantData);

    // Don't add super admins as members - they manage but don't access customer data
    if (!SUPER_ADMINS.includes(ownerEmail.toLowerCase())) {
      await addTenantMemberAdmin({
        tenantId: tenantRef.id,
        userEmail: ownerEmail,
        role: 'admin',
        invitedBy: ownerEmail,
      });
    }

    return { id: tenantRef.id, ...tenantData };
  } catch (error) {
    console.error('Error creating tenant:', error);
    throw error;
  }
}

/**
 * Add a user to a tenant (server-side)
 */
export async function addTenantMemberAdmin({ tenantId, userEmail, role = 'member', invitedBy }) {
  try {
    const membershipId = `${userEmail.toLowerCase()}_${tenantId}`;

    const memberData = {
      tenantId,
      userEmail: userEmail.toLowerCase(),
      uid: null, // Will be set on first login
      role, // 'admin' | 'member' | 'tester'
      invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      invitedBy: invitedBy.toLowerCase(),
      status: 'active',
    };

    await adminDb.collection('tenant_members').doc(membershipId).set(memberData);

    return { id: membershipId, ...memberData };
  } catch (error) {
    console.error('Error adding tenant member:', error);
    throw error;
  }
}

