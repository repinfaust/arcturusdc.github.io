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
