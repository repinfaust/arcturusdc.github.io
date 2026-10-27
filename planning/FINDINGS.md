# Findings

---

## 2026-02-07 — Added Next.js page update guidance
**What happened:** Documented Next.js App Router page update rules.  
**Root cause:** Needed explicit rules for updating pages and assets.  
**Fix / workaround:** Added guidance to `README.md` and `planning/PROJECT_CONTEXT.md`.  
**Promote to global?** yes — `~/.dev-knowledge/web/nextjs-app-router-page-updates.md`

---

## 2026-05-19 — STEa admin tools are no longer purely static
**What happened:** The Dialled MTB workspace's User Feedback tool requires server-side Firebase Admin reads and Storage signed URLs under `/apps/stea/dialled-mtb`.  
**Root cause:** Dialled MTB mobile feedback is intentionally write-only from the client, so an internal admin surface cannot safely use client Firestore reads or loosen Firebase rules.  
**Fix / workaround:** Keep public site static by default, but document narrow STEa internal-tool backend exceptions and require existing STEa session + workspace access checks.  
**Promote to global?** no

---

## 2026-09-27 — Tailwind must not scan the self-contained PMR export
**What happened:** A clean production build failed with `RangeError: Maximum call
stack size exceeded` inside Tailwind's default extractor while compiling
`globals.css`. Development and standalone CSS compilation could pass, so they
did not demonstrate production build health.

**Root cause:** The broad `public/**/*.html` content glob included the
self-contained PMR concept export from D-SITE-029. Its embedded media/bundle
includes a roughly 14 MB line and is not source for the host site's Tailwind CSS.
An uninstrumented, cache-free baseline build reproduced the failure. Excluding
only this file made the otherwise unchanged cache-free production build pass.

**Fix:** Added `!./public/apps/pmr/concept.html` to Tailwind's content inputs.
The export already supplies its own styles and remains byte-for-byte unchanged;
the public URL, static serving and noindex headers are preserved. All application
source and the two game HTML inputs remain scanned. No stack-limit increase,
error suppression, dependency upgrade or export rewrite was needed.

**Verification:** `npm run build` on Node 20.19.5 passed, including the postbuild
leak check (zero matches across 17 forbidden strings). The production server
served all four Returno routes and their CSS/images; the three legal HTML files
were included in their function traces. The PMR rewrite served identical bytes
to the source with its existing noindex header.

**Promote to global?** no — repository content-glob boundary.

---

## 2026-10-27 — Orbit: any signed-in user could delete any user's ledger events (D-SITE-046)
**What happened:**
- `POST /api/orbit/reset` checked only that a session existed.
- `verifySession` accepts any account that can sign in to STEa.
- So any such account could delete events, alerts, consent state and snapshots for any `userId`,
  and the demo orgs.

**Root cause:** "signed in" was treated as "authorised". There was no owner or role check on a
destructive route.

**Fix / workaround:**
- The route is owner-only (`isOrbitOwner`: verified owner email), and is tested.
- **Then closed in D-SITE-050:** `GET /api/orbit/events`, `/alerts` and `/consent` let any
  signed-in user read any `userId`'s records. This is the same root cause, on reads. Non-owners
  now read only the shared sandbox user, and `/snapshots` is covered too.

**Promote to global?** yes — "a session check is not an authorisation check; every destructive
route needs an owner/role check and a test that a non-owner gets 403 with nothing changed".

---

## 2026-10-27 — Orbit: org API keys readable by any signed-in user, stored in plaintext, compared non-constant-time (D-SITE-047)
**What happened:**
- **K3:** `GET /api/orbit/orgs` returned every org's `apiKey` to any signed-in user. The POC page
  relied on that to send the key.
- **K1:** keys were stored in plaintext.
- **K2:** keys were compared with `!==`, in three copies.
- **K5:** an update returned the existing key.
- **K4:** the demo credentials are hard-coded.

**Root cause:** a proof-of-concept credential model ("For demo/PoC… In production, these would be
truly random and stored securely") reached a deployed route, and nothing tested what a response
may carry.

**Fix / workaround:**
- Keys are stored as sha256 hashes and compared with `timingSafeEqual` on the digests.
- They're shown once, on creation, and responses go through `publicOrgView`.
- There's one `authenticateOrg`.
- `scripts/orbit/hash-org-keys.mjs` migrates stored keys.
- Tests assert that no response carries a key, hash or secret.

**Promote to global?** yes — "API keys: store a hash, compare digests in constant time, show once;
test that no response body contains a credential".

---

## 2026-10-27 — Root `middleware.js` silently ignored: the app is under `src/` (D-SITE-061)
**What happened:**
- Every "protected" STEa page returns 200 signed out.
- No CSP or security headers from the middleware reach production.
- The built middleware manifest is empty.

**Root cause:**
- Next.js loads middleware from `src/middleware.js` when the app is in `src/app`, and ignores the
  root file without any warning.
- Nothing ever checked the built manifest or a signed-out response.
- Also, the middleware imports `firebase-admin`, which can't run in Edge middleware. So simply
  moving the file would fail.

**Fix / workaround:**
- Fixed in D-SITE-064: server layouts gate each route, and the edge `src/middleware.js` handles the
  cookie-presence redirect, the host and the headers. The CSP is report-only until checked.
- Data stays protected by the API routes' own session checks and by Firestore rules.
- The Orbit evidence page gates itself server-side.

**Promote to global?** yes — "with a `src/` app, middleware must be `src/middleware.js`; after
adding middleware, check `.next/server/middleware-manifest.json` is non-empty and that a signed-out
request to a protected path is redirected".

---

## YYYY-MM-DD — <Finding title>
**What happened:**  
**Root cause:**  
**Fix / workaround:**  
**Promote to global?** yes/no

---
