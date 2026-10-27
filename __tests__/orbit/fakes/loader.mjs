// Loads the real route files under node --test (D-SITE-050). Swaps Next, Firebase Admin and the
// Firestore helpers for fakes in this folder; maps `@/` to src/; adds `.js` to extensionless paths.
import { register } from 'node:module';
register('./hooks.mjs', import.meta.url);
