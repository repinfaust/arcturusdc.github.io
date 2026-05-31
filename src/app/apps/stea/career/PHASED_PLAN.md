# Career Ops — Phased Plan & Status

_Last updated: 2026-05-31 (David + Claude session)_

Value-staged plan for the STEa Career Ops app (`/apps/stea/career`). Each phase
delivers something usable when a real candidate logs in. Earlier broader spec:
`Career_Ops_Adaptation_Build_Spec_David_Loake.md` (repo root).

## Context

- **Mission:** help strong candidates get through AI first-pass screening (ATS /
  embedding scorers / LLM sorters). First real user: **Terrie** (ex-ENSEK Product
  Owner, energy/billing), anonymised in demo data as **"Tom Granger"**.
- **Architecture:** multi-tenant. Workspace == tenant. Career config lives at
  Firestore `tenants/{tenantId}/career_ops/config`. Per-workspace isolation is real.
- **Tenancy plan:** ArcturusDC (`FqhckqMaorJMAQ6B29mP`) is David's admin/master
  workspace, used for David's own validation with Tom Granger seed data. A separate
  **"Career Ops" workspace** will be created and Terrie added as a member there, so
  he uploads his real data without seeing David's other work. (Note: David's email
  `repinfaust@gmail.com` is a SUPER_ADMIN and is intentionally NOT added as a tenant
  member by `createTenantAdmin`.)

## What actually works (verified by code, 2026-05-31)

- **Analyse Role** → Anthropic (claude-3-5-sonnet-latest via `ANTHROPIC_API_KEY`,
  override `CAREER_ANTHROPIC_MODEL`). Two-step: extract JD → evaluate vs profile.
  Renders fit score + evaluation in the Pipeline tab. Gated on `has_config`.
- **Config save/load** (profile, evidence anchors, scoring weights) → Firestore.
  Fixed 2026-05-31: page<->API field-name mismatch (`*_obj`) and object-vs-string
  prompt injection.
- Icon font (Material Symbols) now loaded in root layout.

## Known broken / not wired (honest)

- **Live Scans tab** — no real job scraper. Idle/empty UI only.
- **CV Tailoring tab** — empty states; not wired to a real tailor call yet.
- **History tab** — navbar link 404s; analyses are not persisted.
- All fake/demo data has been stripped (no Nebula/Vercel/Stripe etc.).

## Phases

### Phase 1 — "Terrie can analyse a real job ad" (IN PROGRESS)
Goal: working Analyse Role end-to-end for a logged-in user.
- [x] Fix the 500 (firebaseAdmin import)
- [x] Strip all fake data; fix target-roles input; load icon font
- [x] Fix config persistence (page<->API contract + object handling)
- [ ] **David validates:** seed Tom Granger profile+evidence in ArcturusDC tenant
      (type into Config form → Save), confirm banner clears + Analyse Role unlocks
      + a real energy-PO JD returns a sensible score.
- [ ] Seed text for Tom Granger evidence anchors: provided in session.

### Phase 1b — Career Ops workspace + Terrie (NEXT SESSION)
- [ ] Create a "Career Ops" workspace (tenant)
- [ ] Add Terrie as a member (`tenant_members`)
- [ ] Terrie logs in, uploads his real data, runs his first analysis

### Phase 2 — "It remembers and tailors"
- [ ] Persist each analysis (History tab; fix the 404 route)
- [ ] Wire CV Tailoring to a real Anthropic call using the evidence library
- [ ] Cover-note drafter wired to real output

### Phase 3 — "It finds roles for him"
- [ ] Live Scans / discovery wired to a real source, or a batch "paste many JDs" flow
- [ ] The counter-AI-screening surface: surfacing good-fit roles, not just scoring found ones

## Test checklist (Phase 1 validation)
1. Config tab → fill profile → Save Profile
2. Add one Evidence Anchor → Save All
3. Reload → fields persist + red banner gone
4. Pipeline tab → paste a real energy-PO JD → Analyse Role → sensible score returns
