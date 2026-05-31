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

### Phase 1b — Per-person workspace for Terrie (early access)
ISOLATION DECISION (2026-05-31): Career Ops data keys on tenant ONLY
(`tenants/{tid}/career_ops*`), so workspace members SHARE a career dataset —
wrong for private career data. Chosen: **A now, B later**.
- A (now): one **solo workspace per person**. Hard isolation, zero code.
- B (later, when multi-user product): re-key career data by uid
  (`career_ops_users/{uid}`) so one workspace holds many isolated users.
Setup is done via the existing super-admin UI at `/apps/stea/admin`:
- [ ] Create solo workspace "Terrie Goulbourne — Career Ops" (plan: solo-*), ownerEmail = his real email
- [ ] Ensure he's a member (non-super-admin owners auto-add; else Add Member, role admin)
- [ ] Terrie logs in (same email) → Config → enters HIS real profile/evidence → runs analysis
- Note: his workspace reads Firestore (empty) — the Tom Granger YAML is ONLY in David's tenant.
- App scope: all STEa apps visible in his workspace is fine for now (not locked to Career Ops).

### Phase 2 — "It remembers and tailors" ✅ DONE (2026-05-31)
- [x] Persist each analysis (analysed roles saved per tenant; pipeline shows them)
- [x] Real score gauge (was hardcoded 4.2) + clickable rows to re-open analyses
- [x] Markdown rendering + collapsible sections for the long fit narrative
- [x] RAG go/no-go verdict panel under the score

### Phase 2b — "Apply loop: tailored CV library" ✅ DONE (2026-05-31)
- [x] "Proceed to Apply" → role-tailored CV (Anthropic, grounded in evidence, no invented facts)
- [x] Persist tailored CV linked to the role; status → 'Applying'
- [x] CV Tailoring tab = real library (replaced fake mockups)
- [x] PDF export (print-to-PDF, ATS-safe selectable text)

### Phase 3 — "It finds roles for him" (the big one — IN PROGRESS)
Design done 2026-05-31. Most boards block scraping; viable legit free APIs:
- **Reed API** (`REED_API_KEY`, basic auth) — UK-native; keywords/location/salary/contract
- **Adzuna API** (`ADZUNA_APP_ID` + `ADZUNA_APP_KEY`) — aggregates many boards
- LinkedIn/Indeed direct: no usable API → avoid (ToS + blocked)
- [ ] **3a (building):** `search_jobs` action querying Reed + Adzuna, normalise + dedupe; Live Scans
      tab search UI (defaults from profile: target roles / £ floor / location); results list with
      "Analyse" buttons feeding the existing score+persist pipeline
- [ ] 3b: "Analyse top N" batch — open the app to a ranked list of real roles by fit
- [ ] 3c: saved searches that auto-run + notify (counter-screening end-state)

## PARKED — Workspace & multi-user (Option B, revisit when Career Ops is a real product)
Deferred 2026-05-31. Current model: each Career Ops user = their own **solo workspace**
(hard isolation, zero code). Terrie's "Terrie Goulbourne Career Ops" solo workspace created
2026-05-31. The following are NOT needed for early access but will be for a scaled product:
- [ ] **Per-user data within a shared workspace (Option B):** re-key career data from
      `tenants/{tid}/career_ops*` to `tenants/{tid}/career_ops_users/{uid}/*` so one workspace
      can hold many isolated users. Requires migrating existing data + adding uid to every read/write.
- [ ] **App-scoping per workspace:** lock a Career-Ops workspace to only the Career Ops app
      (currently all STEa apps show; fine for now).
- [ ] **Self-serve onboarding/invite:** a Career-Ops-specific signup/invite flow instead of the
      super-admin admin page (so users can be added without David doing it manually).
- [ ] **Billing/plan enforcement:** solo vs team plan limits actually enforced for Career Ops.
- [ ] **Privacy hardening:** confirm Firestore security rules prevent cross-tenant career-data reads
      (admin SDK bypasses rules server-side, but client paths should be locked down).

## Test checklist (Phase 1 validation)
1. Config tab → fill profile → Save Profile
2. Add one Evidence Anchor → Save All
3. Reload → fields persist + red banner gone
4. Pipeline tab → paste a real energy-PO JD → Analyse Role → sensible score returns
