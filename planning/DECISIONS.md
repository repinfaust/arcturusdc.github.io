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
