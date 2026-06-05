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
