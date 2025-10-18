# STEa Dashboard Authentication and Firestore Permissions --- Summary

## 🧩 Current Setup

### Project

-   **Framework:** Next.js (App Router, JavaScript)
-   **Hosting:** Vercel (custom domain: https://www.arcturusdc.com)
-   **Authentication:** Firebase Web SDK (`getAuth`,
    `GoogleAuthProvider`)
-   **Database:** Firestore (Firebase client SDK in browser)
-   **Rules:** Require `request.auth != null` for reads/writes on most
    collections (e.g. `stea_cards`, `automated_test_runs`, etc.)
-   **Middleware:** Handles HTTPS canonicalization and skips `/api`
    routes.\
    No current authentication enforcement for
    `/apps/stea/automatedtestsdashboard`.

### Observed Problems

1.  **Dashboard access not protected:**\
    `/apps/stea/automatedtestsdashboard` is publicly accessible despite
    Firebase login flow on `/apps/stea/page.js`.

2.  **Firestore PERMISSION_DENIED (500 error):**\
    API routes (`/api/run-tests`) use **Firebase Web SDK**, which
    requires a logged-in user.\
    Since Vercel serverless functions run without a user session,
    Firestore denies the writes.

3.  **Auth token not visible to middleware:**\
    Firebase Auth stores credentials in client-side storage
    (LocalStorage/IndexedDB).\
    Middleware only sees HTTP cookies, not browser auth state.

------------------------------------------------------------------------

## ⚙️ Current Flow (Simplified)

  ------------------------------------------------------------------------------------
  Step          Component                              Description
  ------------- -------------------------------------- -------------------------------
  1️⃣            `/apps/stea/page.js`                   User signs in via Google;
                                                       Firebase creates a client
                                                       session.

  2️⃣            Middleware                             Checks for redirects but not
                                                       authentication.

  3️⃣            `/apps/stea/automatedtestsdashboard`   Accessible by anyone.

  4️⃣            `/api/run-tests`                       Runs server-side with no auth
                                                       context → Firestore rules block
                                                       write.
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

## 💡 Proposed Fix

### 1. Server-Side Auth (Firebase Admin)

-   Create `src/lib/firebaseAdmin.js` with **Firebase Admin SDK**.\
    Uses `FIREBASE_SERVICE_ACCOUNT_KEY_JSON` env var.\
    Admin SDK bypasses Firestore security rules for server writes.

### 2. Secure Session Cookie

-   Add `/api/auth/login`:
    -   Exchanges Firebase **ID token** for a secure, HTTP-only
        `__session` cookie.
    -   Cookie lasts \~7 days.
-   Add `/api/auth/logout` to clear the cookie.

### 3. Update Client Login Flow

-   After `signInWithPopup(auth, googleProvider)`, get `idToken` and
    call `/api/auth/login`.
-   Redirect user to `/apps/stea/board` (or `next` URL).
-   The cookie enables middleware and API authentication.

### 4. Middleware Protection

-   Update `middleware.js` to:
    -   Skip `/api/*` routes.
    -   Check for `__session` cookie on:
        -   `/apps/stea/automatedtestsdashboard`
        -   `/apps/stea/board`
    -   Redirect to `/apps/stea` (login) if cookie missing.

### 5. Firestore Rules Update

If you keep using Admin SDK for tests: - No rules change needed (Admin
bypasses them).\
If you want client-side reads:

``` firestore
match /test_runs/{doc} { allow read: if request.auth != null; }
match /test_progress/{doc} { allow read: if request.auth != null; }
match /test_results/{doc} { allow read: if request.auth != null; }
```

------------------------------------------------------------------------

## ✅ Expected Result After Fix

-   `/apps/stea/automatedtestsdashboard` and `/apps/stea/board`
    accessible **only after Google login**.
-   Middleware recognizes the `__session` cookie.
-   API routes write to Firestore via Admin SDK without
    `PERMISSION_DENIED`.
-   Firestore rules remain secure for client reads.

------------------------------------------------------------------------

## 🔑 Key Env Variables

  -----------------------------------------------------------------------------
  Variable                              Description
  ------------------------------------- ---------------------------------------
  `NEXT_PUBLIC_FIREBASE_API_KEY`        Firebase Web SDK key

  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`     Firebase project ID

  `FIREBASE_SERVICE_ACCOUNT_KEY_JSON`   Full service account JSON for Admin SDK
  -----------------------------------------------------------------------------

------------------------------------------------------------------------

## 🧭 Summary

**Root cause:** Middleware and Firestore server functions lacked auth
context.\
**Solution:** Add a secure cookie-based session (`__session`) and use
Firebase Admin SDK for all server routes.

This ensures protected dashboard access and unblocked Firestore writes.
