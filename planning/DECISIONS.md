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
