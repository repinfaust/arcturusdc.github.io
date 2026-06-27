#!/usr/bin/env node
/**
 * Set the `superadmin: true` custom claim on the STEa admin accounts.
 * The hardened firestore.rules use this claim as the primary super-admin check
 * (the email comparison is a transitional fallback to be removed once this runs).
 *
 *   GOOGLE_CLOUD_PROJECT=stea-775cd node scripts/set-superadmin-claim.js
 *
 * Uses Application Default Credentials (gcloud auth application-default login).
 * Admins must sign out / refresh their ID token after this runs for the claim to take effect.
 */
const admin = require('firebase-admin');
admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'stea-775cd' });

const ADMIN_EMAILS = ['repinfaust@gmail.com', 'daryn.shaxted@gmail.com'];

(async () => {
  for (const email of ADMIN_EMAILS) {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), superadmin: true });
    console.log(`✅ superadmin claim set on ${email} (${user.uid})`);
  }
  console.log('\nDone. Admins must refresh their session (sign out/in) for the claim to apply.');
})().catch((e) => { console.error(e); process.exit(1); });
