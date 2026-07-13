# Decisions

## Ruby build spec decisions
- Ruby is positioned as the product intelligence layer across STEa apps (Ruby, Harls, Filo, Hans).
- TipTap is the authoring core with uploads, slash commands, and rich block support.
- DocLink graph is the primary traceability model between docs and artifacts.
- Prompt-to-doc uses MCP templates for PRS, build spec, and release notes.
- Reviewer Mode and release notes automation are planned as quality gates.
- Delivery is phased with stage gates (architecture, security/privacy, UAT, release).

## Sources
- /Users/davidloake/Library/Mobile Documents/com~apple~CloudDocs/dev-backup/arcturusdc.github.io/ruby_build_spec_v_1.md

## 2026-02-07 — Page update rules
- This repo uses Next.js App Router (`src/app/`) for page routes.
- App cards are driven by `src/data/apps.json`.
- Static assets are served from `public/` via absolute paths.

## 2026-02-21 — Sprocket page structure
- Added Sprocket as a first-class app route under `src/app/apps/sprocket/`.
- Policy links for Sprocket use HTML routes (`/apps/sprocket/privacy-policy`, `/apps/sprocket/terms-of-use`) to meet accessibility and store-readability requirements.
- Sprocket card metadata is kept in `src/data/apps.json`; hero and branding assets live under `public/img/`.

## 2026-06-21 — Sprocket current portfolio positioning
- Sprocket is positioned from the live App Store listing (`https://apps.apple.com/us/app/sprocket-calm-phone-helper/id6759454436`) as `Sprocket: Calm Phone Helper`, not the earlier narrow message/letter helper.
- Public app and portfolio copy should describe the broader current scope: voice/text assistance, plain-language reminders, memory/notes, step-by-step phone help, confusing-message explanations, read-aloud replies, and calm/privacy-first interaction patterns.
- This is copy/positioning only; no site auth, infrastructure, analytics, or data handling changes are introduced.

## 2026-03-12 — Orbit GrapheneOS POC v2 route
- Added a new App Router path at `/apps/stea/orbit-grapheneos/poc` as a separate POC surface, leaving existing Orbit routes unchanged.
- Implemented the v2 two-tier UX in the new page: public demo tier (seeded demo dataset + demo banner) and magic-link sign-in tier for posting real device events.
- Kept implementation frontend-first (no new backend or infrastructure) to preserve project constraints; authenticated-tier event history is scoped per signed-in user in local storage for POC behaviour.

## 2026-03-12 — Orbit Charity POC v2 route
- Added a new App Router path at `/apps/stea/orbit-charity/poc` with a charity-specific POC based on the v2 build spec.
- Implemented seeded multi-role identity demo data for OII `oii_mc_demo_001` including the 17-block Margaret narrative, CRITICAL cross-domain alerts, and ICO-focused audit views.
- Reused the same two-tier model pattern (public demo + magic-link sign-in tier) and kept it frontend-first for POC delivery without introducing new backend infrastructure.

## 2026-03-12 — Charity style guide alignment + Graphene explainers
- Updated `/apps/stea/orbit-charity/poc` to use the charity style guide direction (warm light surfaces, Source Sans/Code typography mapping, NHS-adjacent trust-blue + sage palette, critical purple alert hierarchy) rather than the prior dark Graphene-derived presentation.
- Added explainer cards/instructions to `/apps/stea/orbit-grapheneos/poc` Overview and Org Sandbox so users can quickly understand what the demo shows and how to drive the sandbox flow.

## 2026-03-21 — SoRR Control UI POC override and route shape
- User explicitly approved a SoRR override to allow backend work (Firestore + Claude proxy) for this POC, despite baseline repo constraints that usually keep POCs frontend-first.
- Implemented SoRR Control under `/apps/stea/sorr/controlui` with multi-page module routes (overview, request engine, classification, approvals, audit trail, governed workspace).
- Kept magic-link authentication pattern aligned with existing Orbit POCs and made the entry visible from `/apps/stea`.

## 2026-03-21 — SoRR product-model reset (Claude-first, SoRR-as-broker)
- Repositioned `/apps/stea/sorr/controlui` as a product concept layer: Claude-first workflow with contextual SoRR handoff, product-governed use cases, and admin-console preview.
- Retained existing governance/admin screens under dedicated subroutes (`/overview`, `/request`, `/approvals`, `/audit`, `/classification`, `/workspace`) as internal control surfaces rather than universal front door UX.
- Removed the mixed front-door governance flow component to reduce ambiguity between product UX and backend/infosec operations views.

## 2026-05-19 — Dialled MTB workspace feedback triage
- Added `/apps/stea/dialled-mtb` as the Dialled MTB workspace's internal User Feedback tool for manually triaging friendlies feedback.
- Dialled MTB is the STEa workspace/tenant. User Feedback is the app/tool inside that workspace.
- Access remains governed by the existing STEa Google/Firebase session and tenant membership/admin framework; no new auth model is introduced. Users may select the Dialled MTB workspace for product access, or ArcturusDC for internal admin access.
- The server reads the existing Dialled MTB `feedback` collection and `feedbackScreenshots/{uid}/{feedbackId}.jpg` Storage paths with Firebase Admin, preserving the mobile app's write-only client rules.
- Triage is manual only for now: status, priority, and internal notes are admin-managed fields on the existing feedback document.
- The admin portal uses the Dialled MTB anthracite + magenta brand system from the app's public policy/style pages.

## 2026-06-05 — STEa Companion: integration approach (Phase 0 / D-COMP-001)
- **Decision:** Build the STEa Companion (macOS Tauri desktop app, per build spec) against a new authenticated **`/api/companion/*` API layer** in this site repo — **Option B from the spec, NOT Option A (the MCP server)**.
- **Why Option A (MCP) was rejected:** `servers/stea-mcp.ts` is stdio-only (no network endpoint) and authenticates with a Firebase **Admin** service-account key on local disk plus a hard-pinned `TENANT_ID`. Shipping it into a distributed desktop app would put a god-mode key on every machine and bypass per-user workspace permissions — a direct violation of spec §11 (respect permissions) and §15 (don't bypass auth). The MCP server stays untouched for Claude Code / Codex.
- **Auth:** Companion uses Firebase Google sign-in; the API layer verifies the user's ID token via `adminAuth.verifyIdToken` and re-checks `tenant_members/{email}_{tenantId}` server-side before any read or write (satisfies AC14). Reuses the existing tenancy model in `firestore.rules`; no new auth model.
- **Data model (additive only — AC15 safe):** new OPTIONAL fields `activityState`, `priorityBand`, `companionOrder`, `lastTouchedAt`, `source` on `stea_epics`/`stea_features`/`stea_cards`; new tenant-scoped collection `stea_jots` for raw captures; new `firestore.rules` block for `stea_jots` mirroring the `stea_cards` tenant guard. No existing field renamed or removed.
- **LLM classification (Phase 3):** Claude API, server-side only, strict JSON schema, server validates before any write; the model never writes to the DB (spec §15, AC8).
- **Repo split:** Companion app lives in a new repo `~/dev/stea-companion`; the API layer, rules change, and shared write/validation helpers live in this site repo.
- **Status:** Phase 0 integration report written (`~/dev/stea-companion/docs/INTEGRATION_REPORT.md`). No UI/Phase-1 code until this decision is approved (spec §17 + SoRR report-first rule).
- **Hand-off flag:** final Tauri `.dmg` build/codesign/notarization requires a human at the Mac (Xcode + codesign); all scaffolding and code can be done headlessly.

## 2026-06-11 — Dialled MTB tech tree changelog v1 (D-SITE-001)
Built per `tech_tree_changelog_v1_build_spec.md`; canonical visual source `dialled_tech_tree.html` (June 2026 v1.0).
- **Routes:** `/apps/dialled-mtb/changelog` (public tree), `/release/[id]` + `/feature/[id]` permalinks, `/internal` (full tree). Root route confirmed by David; renders inside the site's global Header/Footer shell as a dark full-bleed section.
- **Rendering:** the site's root layout forces `dynamic = "force-dynamic"`, so these routes are server-rendered on Vercel rather than statically exported (spec §8 assumed SSG/Firebase). `generateStaticParams` is present; behaviour is identical for visitors. Deliberately did not fight the site-wide rendering mode.
- **Public/internal split (§5):** enforced at the data layer in server-only modules (`src/lib/dialled-changelog/`, `import 'server-only'`). Public view strips internal nodes (`passport`, `antitheft`, `checkpoint`), `desc`/`why`/`scores`, internal releases, edges touching internal nodes, and the Avoid/Kill/Validate status labels, then compacts the sparse col/row grid (public-only transform). Public lifecycle set (David, 2026-06-10): Live/Building/Next/Open + Locked; Validate nodes (`emergency_tag`, `uplift`) therefore do not render publicly.
- **Internal route gating:** env var `DIALLED_INTERNAL_TREE=1` required or the route 404s; var is NOT set on Vercel production. Internal data never enters `.next/static` (client bundle) — verified by leak test.
- **Leak test (§5.5):** `scripts/check-dialled-changelog-leaks.mjs` greps `.next/static` for 17 forbidden strings; wired as `postbuild` so every Vercel build fails on a leak. Rendered-HTML grep also verified clean at review time.
- **Content model (§4):** one MDX file per release in `content/dialled-releases/` (gray-matter frontmatter; 5 required fields; build fails loudly on malformed files; authoring README included). Status is derived: ≥1 public release ⇒ Live; else authored lifecycle fallback. Seeded with two real releases (Imperial Units 2.0.3, Advisor write-back 2.0.6) — these correctly flip those nodes to Live vs the artefact's hand-authored statuses.
- **Dependencies added:** `gray-matter`, `server-only`. Lightbox is a minimal custom implementation (no gallery lib). `react-markdown` (already installed) renders release notes. Space Mono via `next/font/google`, weights 400/700, scoped to the changelog segment.
- **Fidelity notes:** artefact contains 23 nodes (spec says 22) — all 23 ported verbatim. Source CSS cascade lets status border-colour override the lane-coloured left border — reproduced, not "fixed". Legend says "Locked" while node pills say "Phase 2" — reproduced. Detail panel gained max-height/scroll (needed for release history) — flagged as the one styling addition.

## 2026-06-11 — Dialled MTB changelog Timeline view (D-SITE-002)
Phase 2 of D-SITE-001, approved by David 2026-06-11 (month grouping chosen).
- **Route:** `/apps/dialled-mtb/changelog/timeline` — reverse-chronological feed of public releases, grouped by month, mobile-native (no horizontal canvas).
- **Data:** reads the same `content/dialled-releases/*.mdx` via `publicReleases()` — zero schema change, as the D-SITE-001 model intended. One MDX file populates tree + timeline together. Internal releases never render.
- **Visuals:** locked tech-tree vocabulary only — entry spine takes the lane colour of the first feature the release advances; metadata rows/pills/lightbox reuse existing module classes. No new motion.
- **Navigation:** quiet cross-links between tree and timeline views; timeline added to sitemap. Public/internal leak posture unchanged (postbuild leak test covers the new route automatically).
- This closes the scope agreed for the changelog feature; no further phases planned.

## 2026-06-17 — Art Atlas route and source-cache approach
- Added `/apps/stea/art-atlas` as a browser-based interactive art-history atlas and walkable museum prototype.
- User selected timeline direction **B: Cosmos** (constellation-style historical atlas) after the required A/B/C check-in.
- **Data storage decision:** use the existing integrated Firebase/Admin stack as an optional read-through catalogue cache if populated later; do not add Neo Postgres for this route. The app must also ship with a source-attributed local fallback catalogue so it runs without database provisioning.
- **Source constraint:** artist summaries, dates, portraits, and artwork references must be sourced from Wikipedia/Wikidata/Wikimedia Commons. Do not invent artwork facts; source URLs remain visible in the data layer and UI attribution.
- **Auth/privacy:** no new authentication model, no anonymous auth, and no user data collection. The route is read-only from the visitor's perspective.
- **Infrastructure boundary:** no new external infrastructure. Three.js is allowed as an app dependency for the required 3D museum scene.

## 2026-06-20 — Repinfaust single-user web mirror
- Added `/apps/stea/repinfaust` as a single-user web mirror of the existing Repinfaust Android app.
- **Scope:** this is not a new STEa tenant product and not a public app page. It is a private browser surface for David only, matching the source app's single-user model.
- **Auth:** Google sign-in only, hard-gated to verified `repinfaust@gmail.com` in the client; the existing Repinfaust Firebase project also enforces the owner email in Firestore rules and callable Functions. Firebase Auth authorized domains for this project include `www.arcturusdc.com` and `arcturusdc.com` for the web mirror.
- **Data/sync:** the web mirror uses the existing `repinfaust` Firebase project, Firestore collections, and callable Functions in `europe-west2`. Android and web share the same `profile/state`, sessions/messages, contacts, chain map, friction, litmus, comparison, export, and delete state. No separate sync layer or new database is introduced.
- **Infrastructure boundary:** no new backend infrastructure in this site repo. The route uses a named Firebase client app with the existing public Repinfaust Firebase config baked in and optional `NEXT_PUBLIC_REPINFAUST_FIREBASE_*` overrides; it calls the already-deployed Repinfaust Firebase Functions broker.
- **Safety:** Anthropic remains server-side only through the Repinfaust Functions broker. The web client never calls model providers directly.

## 2026-06-20 — WC26 value engine route and adaptive Firebase layer
- Added `/apps/stea/wc26` with short alias `/wc26` as an ArcturusDC-workspace tool for deterministic World Cup 2026 pricing and value checks.
- **Access:** WC26 is available to members of the existing ArcturusDC tenant (`FqhckqMaorJMAQ6B29mP`) and super admins through the existing STEa Google/Firebase session and tenant membership model. No anonymous auth and no new auth model are introduced.
- **Phase 1:** the page ships with committed JSON fallback data and the verified JS port of the Python Dixon-Coles/xG engine. User rating edits and bet/CLV logs remain in `localStorage`.
- **Phase 2 backend exception:** user approved continuing with the existing Firestore + Cloud Functions stack to make the WC26 data adaptive. This uses new tenant-scoped WC26 collections only; it does not add new external infrastructure.
- **Backend boundary:** Cloud Functions may seed/sync teams, fixtures, results, pre-kickoff predictions, and aggregate grading metrics for the ArcturusDC workspace. Client access is read-only for shared model data; workspace members do not write prediction data directly.
- **Safety:** no LLM is allowed in prediction, rating refit, probability, staking, or recommendation paths. If data ingestion is added later, any LLM use must be extractor-only behind deterministic validation before data reaches the engine.
- **Privacy:** backend user bet logging is deferred. Personal bet logs stay local-only unless a separate tenant-scoped data collection decision is recorded.

## 2026-06-21 — WC26 data integrity fix + pinned-source results ingest
- **Incident:** Phase 1 seed `fixtures.json` contained Claude-invented fixtures with fabricated odds; the live page priced them as real, producing fake edges/recommendations. This violates the project's founding rule for a betting model. All fabricated fixtures + unverified sample results were purged from Firestore (`scripts/wc26-purge-fabricated.js`), seed files emptied, and the WC26 Cloud Functions redeployed with empty seed so scheduled jobs cannot resurrect them.
- **HARD RULE (restated):** NO fabricated data, ever. The LLM may never produce a result, fixture, odd, rating, probability, or pick.
- **Results/fixtures = pinned structured source, NO LLM.** Source: `openfootball/worldcup.json` (public domain CC0) at the raw GitHub URL. Verified shape: `{ name, matches:[{team1,team2,date,group,round,score:{ft:[g1,g2]}}] }`; a match with `score.ft` = played (result), without = upcoming (fixture). Parser `src/lib/wc26/ingestResults.js` is pure + tested: schema-validate, alias-reconcile to known teams, REJECT (never invent) bracket placeholders and teams without ratings. Yield as of 2026-06-21: 35 results, 37 fixtures, 32 placeholders rejected, 0 unknown.
- **Why pinned-source not LLM search:** a tested `web_search`-backed GPT extraction returned fabricated `sourceUrl` citations and scores regurgitated from the old sample — confirming open-search ingest launders hallucination. Results are a fetch-one-known-URL problem, not a search problem.
- **Ingest route:** `src/app/api/stea/wc26/ingest` (Next.js, ArcturusDC-gated, reuses Vercel `OPENAI_API_KEY` only for the separate odds path — not for results). `GET`=preview, `POST`=write real results/fixtures + `wc26_meta/ingest` report. Never writes odds. A super-admin "Refresh results & ratings" button on the page calls it then the deterministic `refitWc26RatingsNow`/`syncWc26PredictionsNow`.
- **LLM boundary going forward:** results/fixtures = pinned JSON (done). xG = stable pages (FBref/Understat) or BALLDONTLIE, later. Odds = the ONLY place LLM-scrape-with-validation belongs, with manual-entry fallback; not yet built.
- **Team set corrected to 48** (WC2026 field). Removed stale `Denmark` (did not qualify); added tier-based seed priors for 9 qualified teams missing from the handoff seed (Algeria, Austria, DR Congo, Ghana, Iraq, Jordan, Panama, Paraguay, Uzbekistan). These are coarse model priors, clearly labelled, refinable in the ratings editor — not asserted facts.

## 2026-06-21 — WC26 honest performance layer + odds policy
- **Odds are NOT a model input.** The model (ratings → Dixon-Coles → fair prices) is driven only by results. Odds are used solely to compute *value* (model fair vs book price). Therefore odds are **optional**: full model output (xG, fair odds, predictions, track record) works with zero odds; only the value/recommendation board needs them.
- **Odds acquisition is manual-only, by design.** A super-admin "Enter odds" panel writes to `wc26_fixtures.odds` via `POST /api/stea/wc26/odds`, behind a deterministic gate (known engine market key; decimal > 1.0, < 1000). **No GPT/LLM odds path** — a tested web_search extraction fabricated prices, so automated odds scraping is explicitly rejected. The gate is source-agnostic so a future vetted feed could reuse it.
- **Honest performance — two clearly separated metrics:**
  1. **Forward record** (the only honest scorecard): predictions logged BEFORE kickoff (`wc26_predictions`, `firstLoggedAt`), locked at kickoff, graded only after the real result via `onWc26ResultFinalized`. Starts at zero and grows. The UI shows it first.
  2. **In-sample backtest** (`gradeHistory`): grades the model on completed games using ratings shaped by those same games — flattering and NOT a track record. Demoted in the UI with an explicit "calibration check only" warning.
- **Why this matters:** the previously displayed "55% / 65.7% strike rate" was a real computation but in-sample/self-graded, never a genuine track record. The page must never present a self-graded number as performance.
- **State 2026-06-21:** 37 pre-kickoff predictions logged for upcoming fixtures (0 graded — correct, games unplayed). Forward record populates as games complete.

## 2026-06-21 — WC26 odds via The Odds API; GPT fully removed from WC26
- **Odds source = The Odds API** (the-odds-api.com), sport key `soccer_fifa_world_cup`, free tier 500 req/month. Real structured REST feed for UPCOMING matches — nothing to fabricate. Key stored as `WC26_ODDS_API_KEY` (server env / Vercel; `.env.local` for dev, gitignored). NOT in the repo.
- **Consensus + gate:** `src/lib/wc26/oddsApi.js` takes the median price per market across UK books (robust to a single stale book), maps to engine keys (Home/Draw/Away, Over/Under 2.5), and REJECTS events whose 1X2 overround falls outside ~100–125% (catches suspended/in-play matches that quote nonsense). Route `POST /api/stea/wc26/odds-api` writes accepted consensus odds onto existing fixtures (never creates fixtures). Verified live: 36 written, 1 rejected (in-play), 0 unmatched.
- **GPT is fully removed from WC26.** It served no purpose once results=openfootball and odds=The Odds API. Confirmed zero OpenAI/GPT/web_search references in any WC26 code. Manual odds entry (`/api/stea/wc26/odds`) retained as an optional fallback. The Vercel `OPENAI_API_KEY` remains for OTHER features (SoRR/PAYGO), untouched.
- **Odds are not a model input** (restated): they only compute value. Honest caveat surfaced: against real market odds the coarse tier priors produce implausibly large "edges" (45–74%) — this is rating miscalibration, not free money. The market is closer to right; ratings must be refined (rolling xG / shrinkage as results accrue) before any edge is trustworthy. The page already labels ratings as coarse priors.

## 2026-06-21 — Tiered portfolio and controlled exposure model
- Added a public portfolio layer as a curated lens over existing routes rather than a new auth or data model.
- **Tiers:** public consumer apps, public B2B/product concepts, controlled demos, authenticated workspaces, and private owner-only tools.
- **CV/recruiter links:** `/portfolio/cv` and related public portfolio routes may include non-PII UTM/campaign parameters for attribution, but must not add per-recipient server-side visitor tracking without a separate privacy/SoRR decision.
- **Private boundary:** Repinfaust remains excluded from public/CV portfolio surfaces. Owner-only and workspace tools must stay behind existing Firebase/Google/session-cookie and tenant membership controls; no anonymous auth is introduced.
- **Implementation rule:** portfolio pages may link to authenticated tools, but must label them as controlled or workspace-gated and must not render private workspace data into public pages.

## 2026-06-27 — Firestore rules security hardening (P0/P1 remediation, deployed)

Context: AI-apps security assessment (authorization-first). Full report at `~/dev/AI_SECURITY_ASSESSMENT.md`. All changes deployed live to `stea-775cd` 2026-06-27 and behaviorally verified.

Decisions:
- **P0 — public unauthenticated write removed.** `hans_cases/{caseId}/submissions` had `allow create: if true` (any internet client could write Firestore directly, bypassing the API; storage/cost/poisoning/stored-injection vector — especially serious given the `firestore-send-email` extension on this project and the 2026-05-21 email breach). Now `allow create: if authed()`. If unauthenticated tester submissions are ever required, route them through an authenticated callable, not an open rule.
- **P1 — tenant-isolation escape hatch removed.** The `!('tenantId' in resource.data) || canAccessTenant(...)` idiom (42 occurrences across ~15 collections) let any authenticated user read/write any tenant-less doc, defeating tenant isolation. Removed; tenantId + `canAccessTenant` is now required unconditionally on those collections. Pre-removal data audit (see below) was mandatory.
- **P1 — comments tenant-scoped.** `stea_epics|features|cards/{id}/comments` were `allow read, create, delete: if authed()` (any user could read/delete any tenant's comments). Now gated by the parent board doc's tenant via new `canAccessParentTenant()` helper.
- **P1 — apextwin POC reads locked.** `apextwin_sessions`/`apextwin_events` here (older POC copy) were `allow read: if authed()` (all riders' telemetry exposed to any signed-in user). Now owner-only. NOTE: the live apexstate app uses its own project `apexstate-f9e24`, whose rules were already owner-scoped — only this website POC copy was exposed.
- **Decision — `projects` is membership-primary, tenant-optional.** Unlike the other collections, `projects` access is governed by `inProject()` (owner/member); tenant isolation applies only when a `tenantId` is present. Personal/legacy projects (no tenantId, e.g. the 5 "Felix Product Lab" workspaces owned by non-tenant users) remain accessible to their members. Forcing tenant on `projects` would have locked these real users out.
- **P2 — super-admin via custom claim.** `isSuperAdmin()` now checks `request.auth.token.superadmin == true` first; the hardcoded email comparison is a transitional fallback. Provision the claim via `scripts/set-superadmin-claim.js`, then remove the email branch. Rationale: email can be unverified/mutable depending on provider.

Production data cleanup (pre-deploy, irreversible writes — done with backup + per-doc re-verification):
- Live tenant-less audit (`scripts/audit-tenantless-docs.js`, read-only) found 18 docs that would have become client-inaccessible on deploy.
- 13 = abandoned MCP "cat game" board orphans (`createdBy: mcp:stea`, parent epic `GMr2vQsuFzJX6PNotsvL` already deleted). Backed up to `backups/deleted-orphans-*.json`, then deleted. Restorable from that backup.
- 5 = real "Felix Product Lab" personal projects — kept; protected by the membership-primary `projects` rule (owner read verified live).
- Post-cleanup audit: CLEAN.

Tooling added: `scripts/audit-tenantless-docs.js` (pre-deploy gate; run before any future tightening of tenant rules), `scripts/set-superadmin-claim.js`.

Outstanding: provision the superadmin custom claim on both admin UIDs, then remove the email fallback.

## 2026-06-26 — STEa Clips: agent-native issue capture (Path B, native build)
- **Origin:** Evaluated BuilderIO `agent-native` (https://github.com/BuilderIO/agent-native, MIT). It is built on Drizzle/SQL + Nitro hosting, which conflicts with this platform (Next.js 14 App Router, Firebase/Firestore, GCS, Vercel). Decision: **do not fork the repo.** Reimplement the agent-native **Clips pattern** natively so it reuses existing Firebase auth, the tenant model, GCS storage, the SoRR policy engine, and the existing `stea-mcp` server.
- **Outcome:** record a screen clip + browser console/debug logs + a short text "ask", store it, and let Claude Code consume it via MCP — i.e. record an issue/ask for an agent instead of writing it up by hand.
- **Routes/files:** recorder UI at `/apps/stea/clips` (`src/app/apps/stea/clips/page.js`); upload API at `src/app/api/stea/clips/route.js`; admin/storage helper `src/lib/steaClips.js`; MCP tool spec in `planning/STEA_CLIPS_MCP_SPEC.md`.
- **Storage:** video at GCS `steaClips/{tenantId}/{clipId}.webm`; Firestore collection `steaClips` doc `{ tenantId, uid, email, clipId, title, ask, status:'new', consoleLogs[], durationMs, createdAt }`. Reuses the `firebase-admin/storage` signed-URL pattern from `src/lib/dialledMtbAdmin.js`.
- **SoRR governance (mandatory, fatal):** a clip's `ask` is an instruction surface to an agent, so the upload route runs it through `classifyPromptLocal` (`src/lib/sorr/controlui.js`). Confidence `< 0.75` ⇒ **blocked / fail-closed**, no clip persisted, tier-4 `INCIDENT` audit entry in `sorr_control_auditLog`. No advisory band.
- **Tenant/auth:** page sits behind the existing Firebase auth + `TenantContext` like other `/apps/stea/*` pages; clips are tenant-scoped. No anonymous auth introduced.
- **MCP (follow-up, outside this repo):** `stea_listClips` and `stea_getClip` (returns ask + console logs + short-lived signed video URL) to be added to the `stea-mcp` server. Spec'd here; wiring deferred to that repo.
- **Other agent-native uses noted for STEa (not yet decided):** Harls/Auto Product backlog steps as multi-surface Actions; SoRR as the universal governance layer for every Action's `run()`; WC26 ingest/refit as governed A2A Actions for the STEa Companion (no-fabricated-data enforced at the Action boundary).

## 2026-06-30 — Dialled MTB community promo administration
- Added `/apps/stea/dialled-mtb/promo` as the internal campaign workbench for community/affiliate offers. It extends the existing Dialled MTB STEa workspace and Firebase Admin exception; it does not introduce a new auth model or database.
- Campaign creation and mutation are restricted server-side to STEa super admins or active workspace admins in the Dialled MTB/ArcturusDC workspaces. Mobile clients never write campaign, assignment, or revenue-ledger records directly.
- Commercial rule approved by David: affiliate commission is **10% of RevenueCat-estimated proceeds for the first 12 months**, with refunds reversing accrual. Payment execution remains outside the tool.
- Native discount provisioning remains store-owned. The workbench records and validates App Store redemption mappings and Google Play developer-offer option IDs. It does not pretend that RevenueCat creates native store coupon codes.
- Campaign activation is fail-closed: every enabled monthly/annual plan must have ready iOS and Android mappings. Codes are immutable Firestore document IDs once created; campaigns are paused/ended rather than deleted so referral and payout history remains auditable.
- The existing Dialled MTB RevenueCat webhook and supportUserConfigs → BigQuery pipeline remain authoritative for conversion/revenue reporting. No new infrastructure is added; the existing projection gains allowlisted referral aggregates.

## 2026-07-03 — WC26: accuracy is the objective; two-track forecasts; automation fixes
- **Objective restated by David: accuracy over betting edge.** The headline metric for WC26 is now forecast accuracy (hit rate + Brier) versus the devigged consensus market, per market (1X2, O/U 2.5). The flagged-picks betting ledger (P&L/ROI/CLV) is retained but demoted to secondary.
- **Forward evidence that drove this (38 graded games, ledger through 2026-07-03):** pure-Elo 1X2 was near-market (68.4% vs 69.4% acc; Brier 0.4405 vs 0.4295) but O/U 2.5 was far behind (47.4% vs 63.9%). Betting ledger over 66 flagged picks: −24% ROI, 0% CLV coverage. A blend-weight sweep over the 36 games with stored sharp lambdas showed Brier improving monotonically toward the market on both markets.
- **Two-track prediction logging (server-side).** `functions/wc26/service.js` now logs, per prediction: the pure-Elo track (unchanged `prices`/`xg`), a **blended track** (Elo lambdas blended with the stored sharp-market lambdas: 1X2 at `W_MARKET_1X2=0.5`, totals at `W_MARKET_TOTALS=0.9`), and a **devigged market baseline** snapshot from the consensus odds. All inputs are stored real data; when no sharp line exists the extra tracks are null. This closes the gap where the 50/50 blend existed only in the browser UI while the graded forward record measured pure Elo.
- **Grading + accuracy aggregate.** `gradePrediction` adds per-track accuracy (1X2 argmax hit + Brier, O/U 2.5 hit + Brier); `rebuildAccuracy` aggregates to `wc26_meta/accuracy`, rendered as the page's new headline "Forward accuracy" panel. Pre-2026-07-03 graded games get their blended/market tracks computed **retrospectively from stored pre-kickoff inputs** (prediction `xg` + fixture `marketLambdas`/`odds`, all captured before kickoff), flagged `tracksRetro` and disclosed in the UI. Never fabricated — games without stored pre-kickoff lambdas/odds simply have null tracks.
- **UI blend now per-market** (`WC26Client.js`): result markets price off the 0.5-weighted matrix, goal markets (Totals/Team Totals/BTTS/Correct Score) off the 0.9-weighted matrix, mirroring the server constants.
- **Ops root cause found and fixed:** production Vercel was missing `WC26_ODDS_API_KEY` and `CRON_SECRET` since launch — the odds button 500'd in prod and the hourly closing-line snapshot cron could never authenticate (hence CLV coverage 0). Both set via `vercel env add` on 2026-07-03 + redeploy; verified live.
- **Odds pulls scheduled.** `/api/stea/wc26/odds-api` accepts `Bearer $CRON_SECRET` (same pattern as snapshot-closing); new Firebase scheduled function `pullWc26Odds` drives it every 6 h (~8 Odds API req/day against the 500/month tier). Manual button retained.
- **Ingest hygiene:** ingest (route + `scripts/wc26-live-refresh.js`) now flips a fixture to `status:'final'` when its result lands — previously 38 played games remained "upcoming" on the page with stale June-21 odds attached (found and corrected in data on 2026-07-03). Ingest also records `round`.
- **Rematch guard:** from the QFs/3rd-place game onward two teams can meet twice; the bare `home-v-away` doc id would overwrite the earlier result. Ingest now round-qualifies the id (`{home}-v-{away}-{round-slug}`) when the pairing already has a final result on a different date. No live collision existed as of 2026-07-03 (checked).
- **Removed** the temporary `?debug=1` diagnostic on snapshot-closing (leaked env-var presence publicly; served its purpose).

## 2026-07-04 — WC26: Golden Boot forecast + picks ledger now grades the real board
- **Golden Boot (approved by David).** New `functions/wc26/goldenboot.js`: deterministic scorer standings + seeded Monte Carlo forecast of the top-scorer race. Data: the SAME pinned openfootball source's per-goal records (`goals1`/`goals2`: player, minute, `penalty`/`owngoal` flags — verified complete: every played scoring match has scorer data). Counting follows FIFA rules: own goals excluded, extra-time goals count, shootout pens don't.
- **Bracket simulation:** knockout matches carry `num` (73–104) and `W{num}`/`L{num}` placeholders give the full dependency graph. Advancement resolves ft → et → pen from the source; a shootout whose winner the source hasn't recorded yet is sampled **50/50 per sim** (disclosed modelling assumption, listed live on the page — currently only Australia v Egypt). Match outcomes sample the Dixon-Coles matrix built from sharp-market lambdas blended 90/10 with Elo (where a line exists; pure Elo otherwise). 90-min draws: ET sampled at ⅓ lambda (ET goals count), then 50/50 pens. Team goals allocated to players by observed share shrunk toward an "other players" bucket (K=3). Ties count every tied player as top (assists/minutes tiebreak not modelled). Seeded RNG (mulberry32) — reruns identical until inputs change. 20k sims ≈ 350 ms.
- **Storage/display:** `wc26_meta/goldenboot` (forecast top 30 + diagnostics incl. expected-games-by-team and live assumption list) and `wc26_meta/scorers` (standings top 50). New "Golden Boot race" page panel. No Golden Boot odds market exists on our Odds API tier, so this is presented as a forecast with **no edge/value claims** — consistent with the accuracy-first objective (D 2026-07-03).
- **Schedule:** `refreshWc26GoldenBoot` every 12 h + super-admin `refreshWc26GoldenBootNow` callable.
- **Picks ledger consistency fix.** The flagged-picks ledger had kept grading `engine.recommend` (pure Elo vs vigged odds) while the UI board showed the calibrated scan — e.g. 2026-07-03's "bet of the day" (Argentina O2.5, blended) was never a logged pick, while Australia Home (pure-Elo flag, +20% EV vs blended +6%) was. The calibrated scan (`recommendCalibrated` / `topRecommendationCalibrated`: blended matrices, no-vig comparison, |Δp| ranking, price-magnified filter) **moved into the shared engine** (both copies) and is now used by BOTH the UI board and `predictionPayload` — from today the graded ledger measures exactly the picks the board displayed. Pre-existing logged picks are unaffected (grades are snapshots).

## 2026-07-11 — Dialled MTB rider analytics dashboard (D-SITE-003)
- Added `/apps/stea/dialled-mtb/dashboard`: internal two-tab analytics dashboard (Exec summary; Engagement & onboarding) replacing the hand-built Looker Studio exec view. Server page + client component + Bearer-token API, cloned from the promo workbench pattern; same workspace-admin authz (`verifySteaWorkspaceAccess`, super_admin/admin, Dialled MTB/ArcturusDC workspaces).
- **Primary data source is direct Firestore reads via `getDialledMtbAdmin()`, not BigQuery/GA4.** Verified 2026-07-11: no GA4→BigQuery events export exists in `dialledmtb-ea850` (only `dialled_support_export`), and the app never calls Analytics `setUserId`, so GA4 events cannot be joined to premium status. At ~70 users a full scan gives per-user precision GA4 cannot. Revisit if users exceed ~5–10k.
- Snapshot architecture: `computeDashboardSnapshot()` (`src/lib/dialledDashboard.js`) full-scans users/bikes/rides/maintenanceTasks/stravaConnections/aiInsights/feedback/userFeatureFlags + collection groups `advisorHistory` and `serviceEvents`, writes JSON (~36 KB) to `dashboardSnapshots/{YYYY-MM-DD}` + `/latest` in the dialledmtb project. Daily Vercel cron 05:00 UTC (`vercel.json` crons + shared `CRON_SECRET`, reused from the existing WC26 cron); manual Refresh recomputes on demand. Mobile clients have no rules access to `dashboardSnapshots` (admin SDK only).
- Maintenance metric correction: top-level `maintenanceEntries` is empty in production; completed services live at `bikes/{bikeId}/serviceEvents`. The dashboard unions both. `maintenanceTasks` (auto-generated schedules) only feeds the "tasks due" metric.
- GA4 sessions/event counts fetched aggregate-only via GA4 Data API (`@google-analytics/data`, new dependency) using the existing Dialled MTB service account (granted Viewer on the GA4 property); degrades gracefully to "access pending" if `DIALLED_MTB_GA4_PROPERTY_ID` is unset or access is missing.
- "Ask the data" panel: OpenAI Chat Completions (same pattern as PAYGO doc assistant but **with** the workspace-admin guard) answering questions against the latest snapshot JSON + metric definitions; short client-held history for follow-ups.
- **Finding (open, needs decision): root `middleware.js` has never executed.** Next.js ignores root-level middleware when the app lives under `src/`; `.next/server/middleware-manifest.json` is empty and production serves "protected" pages with 200 and no redirect. Moving it to `src/middleware.js` fails the build because `firebase-admin` cannot bundle for the Edge runtime — the middleware was written for a runtime it can never run on. Data remains protected by per-route server-side authz + client redirects. Not changed in this commit (outside approved scope) — needs a follow-up decision on Edge-safe session verification.

## 2026-07-11 — Dialled MTB dashboard: rider distribution tab
- Added a third dashboard tab, "Rider distribution": bucketed histograms (bikes, rides, maintenance logs, AI conversations per rider — all riders, free+premium combined) plus the existing per-rider detail table (moved here from the Engagement tab, since it belongs with individual-rider data rather than the free/premium comparison).
- `buildSnapshot()` gains a `distributions` section: fixed buckets per metric (chosen from real production distribution — see below) + summary stats (min/median/mean/p90/max). Additive to the snapshot shape; no schema version bump, no other section changed.
- Verified against live data 2026-07-11: usage is extremely concentrated — 68/69 riders have zero logged maintenance, 59/69 have zero rides, 44/69 have zero bikes. The tail is a handful of power users (max 22 rides, 30 AI conversations, 6 maintenance logs on one rider) — almost certainly the friendlies/testers guided through onboarding, consistent with the funnel cliff already documented for D-SITE-003.

## 2026-07-12 — Dashboard trend charts + GA4 default-event filter (D-SITE-004)
Approved by David 2026-07-12. Extends the D-SITE-003 dashboard.
- **Two trend line charts added to the top of the Exec tab** (`TrendChart` SVG component, dataviz-validated palette free=#F72585 / premium=#0284C7 on #12161A):
  - *Registered users — lifetime*: cumulative daily series computed in `buildSnapshot()` from each user's `createdAt`. Accurate for the full lifetime.
  - *Premium vs free*: daily counts read from the day-keyed `dashboardSnapshots/{YYYY-MM-DD}` docs (`fetchSnapshotHistory()`, field-masked `select()` on the three totals). **No fabricated backfill**: Firestore never records when a user became premium, so premium/free history exists only from the first stored snapshot onward and grows one point per day. Extrapolating premium status backwards from current `isPremium` is explicitly forbidden (also stated in METRIC_DEFINITIONS for the Ask panel).
- Trend series are embedded in the snapshot (`snapshot.trends`), so they appear after the next refresh; old snapshots render a "hit Refresh" hint.
- **GA4 auto-collected noise (`screen_view`, `user_engagement`) is filtered out of the Top GA4 events table client-side** — raw counts remain in the stored snapshot so the Ask panel and future analyses keep the full data.

## 2026-07-13 — Bike adoption trend + sortable table columns (D-SITE-005)
Extends the D-SITE-003/D-SITE-004 dashboard.
- **Bike adoption trend chart** added to the Exec tab: cumulative % of registered users with ≥1 bike, computed in `buildSnapshot()` (`snapshot.trends.bikeAdoption.points`) from each user's own `createdAt`/`firstBikeAt`. Accurate for the full lifetime — same category as the registrations trend, not the premium/free trend, since bike creation (unlike premium status) is a fact recorded once and never changes retroactively.
- Free vs premium split for this metric is shown as two current-status stat tiles (`snapshot.trends.bikeAdoption.currentPctByPlan`), computed from today's `isPremium` only. Explicitly **not** a historical series — extrapolating current premium status backwards is forbidden, same rule as D-SITE-004's premium/free trend. UI carries a visible caveat line.
- **Sortable column headers** added to four tables (weekly signup cohorts, recent registrants without a bike, top GA4 events, rider detail): click a header to sort descending, click again to toggle ascending. Client-side only (`useSortableRows`/`SortableTh` in `DialledDashboardClient.js`), no new data source, no schema change.
- No new dependencies, no auth change.

### 2026-07-13 — D-SITE-005 revision: single free-scoped line, drop stat tiles
David: the split into two lines/stat tiles (free-today, premium-today) wasn't what was needed — the requirement is one line only, scoped to users who are free **today**, so that a user who signs up free, adds a bike, then upgrades never causes the line to drop (they're excluded from the line entirely once premium, not folded into a separate premium series).
- `trends.bikeAdoption.points` is now computed from `freeRows` only (today's free users), not all `userRows`. `currentPctByPlan` and the two stat tiles are removed.
- Chart title changed to "% of free users who added at least one bike"; single series named "Free, with a bike".
- METRIC_DEFINITIONS updated to describe the free-only scoping.

### 2026-07-13 — D-SITE-005 revision 2: Exec tab section order corrected
David: bike-adoption chart was placed before the core stat tiles / User funnel section, breaking the intended page order. Moved to sit after the User Funnel `SectionCard` (still under Exec summary, still eyebrow "Onboarding"), so the Exec tab order is now: Registered/Premium-vs-free trend charts → core stat tiles → User funnel → bike-adoption chart. No logic change, JSX reorder only.

## 2026-07-13 — Empty-garage home prompt funnel on Engagement & Onboarding tab (D-SITE-006)
Extends D-SITE-003. The Dialled MTB app added a home-screen modal encouraging free users to add a bike, firing three GA4 events: `empty_garage_prompt_shown`, `empty_garage_prompt_dismissed`, `empty_garage_prompt_cta_tapped`. This decision covers the dashboard-side view only — the modal itself lives in the Dialled MTB app repo, not this one.
- New `EmptyGaragePromptFunnel` component at the top of the Engagement & Onboarding tab, showing shown/dismissed/CTA-tapped counts (lifetime + last 30d) and dismiss/tap rate as % of shown, sourced from `ga4.eventCounts` (same GA4 fetch already used by the Top GA4 Events table — no new GA4 query).
- Added `onboarding.bikesCreatedLast30d` to `buildSnapshot()`: platform-wide count of users whose `firstBikeAt` falls in the last 30 days, shown alongside the funnel as a correlational signal. **Explicitly not per-tapper attribution** — GA4 aggregate events cannot be joined to individual Firestore users in this pipeline (same limitation as the premium/free trend and bike-adoption's free-only scoping), so a rise in this number cannot be causally tied to the prompt without further instrumentation.
- Degrades gracefully: shows a GA4-pending notice if GA4 isn't configured, and a "no events yet" notice if the three event names haven't fired in GA4 yet (e.g. before the app update ships).
- No new dependencies, no schema change, no auth change.
