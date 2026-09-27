# Returno Companion overview and legal pages

Created 2026-09-27 at David's request, following the Sidestand overview and
standalone HTML policy pattern. Scope is public website content only: no new
authentication, collection, analytics, payment flow or app behaviour.

## Routes and assets

- `/apps/returno-companion`: overview, features, FAQ and policy links.
- `/apps/returno-companion/privacy-policy`: standalone HTML privacy notice.
- `/apps/returno-companion/terms-of-use`: standalone HTML terms.
- `/apps/returno-companion/delete-account`: standalone HTML instructions and
  email request route for both account deletion and records-only deletion.
- App catalogue entry is development/not live; no public store availability
  is claimed. Support contact is `info@returno.health`.
- Existing Returno brand exports and three app screenshots are copied into
  `public/img/returno-companion`. David confirmed that screenshot records are
  mock data and authorised their public use. No synthetic UI or testimonials.
- Legal pages are script-free, use a local shared stylesheet and system fonts,
  and follow Sidestand's noindex response/header pattern.

## Product evidence

Copy checked against `/Users/davidloake/dev/returno` SoRR (AI_CONSTRAINTS,
DECISIONS and CURRENT), especially D-DATA-007, D-AI-001, D-PROD-012 and
D-PROD-026, plus the implemented Settings deletion actions. It reflects:

- Google sign-in, local SQLite records and owner-only Firestore mirroring;
  London database/Functions does not mean all providers are UK-only.
- Optional, reviewed AI input and optional reviewed Unsplash search phrases.
- Native-off optional Firebase Analytics; no health payloads or advertising ID.
- Fourteen-day trial, one-time lifetime purchase, no subscription, retained
  read/delete access after expiry; no unimplemented export promise.
- Distinct record/account deletion; no promise that deleting Firebase records
  automatically deletes RevenueCat or store transaction information.
- Age 16+ per David's explicit Play Console audience decision.

## Publication review gates

These pages are concrete drafts for review, not evidence that outstanding
product/privacy release gates have been resolved. Before production publication:

1. Confirm the operator's legal identity/contact details and applicable lawful
   bases, particularly the special-category condition for health information.
   D-DATA-007 removed separate cloud-health consent; the copy deliberately does
   not invent a consent checkbox or claim that sign-in is explicit health-data
   consent. A privacy notice alone does not resolve this question.
2. Qualify the RevenueCat customer/alias deletion and retention process, and
   purchase restoration after account deletion, as required by D-PROD-026.
   Current pages accurately disclose that automatic account deletion does not
   cover these records, but do not invent a retention duration or promise an
   unimplemented API deletion flow.
3. Confirm provider log/analytics retention settings and international-transfer
   arrangements for the actual accounts; add concrete periods where established.
   OpenAI API documentation checked 2026-09-27 supports the stated standard
   abuse-monitoring period and exceptions, not a zero-retention claim.
4. Review the terms and privacy notice for release. The overview remains in
   testing until public distribution is approved. Publishing pages is separate
   from submitting the app or completing Play Data Safety.

## Verification

- Scoped ESLint using the installed `next/core-web-vitals` configuration:
  four JavaScript files, zero errors/warnings. No repository ESLint config was
  added (the root currently has none).
- Next dev server: all four routes returned HTTP 200 with one H1 each; legal
  routes returned `text/html`/`noindex` and zero scripts. Eight referenced local
  or optimised image/style assets returned 200.
- Browser: desktop gallery at 1280px, mobile overview and all three policies
  at 390px; overview/privacy had no horizontal overflow. Policy navigation
  and Premium FAQ expansion worked. No captured browser errors.
- The initial production build failed in Tailwind's extractor. Resolved on
  2026-09-27 at David's request: the content glob incorrectly scanned the
  self-contained PMR export and its roughly 14 MB embedded-data line. A clean
  uninstrumented baseline failed; the same clean build passed after excluding
  that single export from Tailwind's inputs. See `planning/FINDINGS.md`.
- `npm run build` on Node 20.19.5 now passes, including the postbuild leak check.
  The production server on port 3027 serves all four Returno routes and their
  CSS/images. All three legal HTML sources are present in the function traces.
  PMR's URL still returns the original unchanged HTML and noindex header.
- `git diff --check` passed. Existing unrelated site changes, including
  functions and planning/DECISIONS.md, were preserved outside this checkpoint.
