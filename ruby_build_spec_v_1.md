# Ruby — Build Spec (v1)

**Goal:** Elevate Ruby into an industry‑leading **Product Intelligence** layer for STEa with deep integrations, smart authoring (TipTap), robust governance, and cross‑app traceability.

**Author:** Product Management  
**Date:** 2025‑11‑12  
**Apps impacted:** Ruby, Harls, Filo, Hans, MCP Server, GitHub/Figma bridges

---

## 0. Definitions & Abbreviations
- **STEa** — Harls (discovery), Filo (delivery), Hans (testing), Ruby (docs), MCP Server (automation).
- **PRS** — Product Requirement Spec.  
- **Build Spec** — Technical design & implementation plan.  
- **DocLink** — Bi‑directional link object between Ruby docs and STEa artefacts.  
- **TipTap** — Rich‑text editor framework used in Ruby.  
- **DoR/DoD** — Definition of Ready / Definition of Done.

---

## 1. Outcomes & Non‑Goals
**Outcomes**
1) Ruby becomes the single source of **product intelligence** with living docs connected to discovery, delivery, testing, code, and design.  
2) Docs are **generated, reviewed, and published** with minimal friction (Prompt→Doc, Reviewer Mode, Release Notes).  
3) **Traceability** is first‑class: Epic/Feature/Card/Test/Commit/Design ↔ Doc.  
4) TipTap‑powered authoring feels premium: drag‑and‑drop, uploads, slash‑commands, templates, comments.

**Non‑Goals**
- Replace GitHub or Figma UIs.  
- Build a general purpose wiki for external use (v1 scopes to STEa projects).

---

## 2. Prioritised Improvements & Value
Scoring uses **Value (1‑5)**, **Effort (S/M/L)**, **Priority**: **Now / Next / Later**.

| ID | Improvement | Value | Effort | Priority | Notes |
|----|-------------|:-----:|:------:|:-------:|-------|
| R1 | **TipTap Pro Authoring**: drag‑and‑drop upload, image/file attachments, slash menu, tables, callouts, code blocks, markdown paste, task lists. | 5 | M | **Now** | Core authoring quality. Includes upload service + virus scan.
| R2 | **Doc Uploads & Asset Store**: upload PDFs/PNGs/ZIPs; thumbnails; versioning; per‑doc asset library. | 5 | M | **Now** | Required for spec packs, design packs.
| R3 | **DocLink Graph**: bi‑directional links between Ruby docs and Filo Epics/Features/Cards, Hans TestCases/TestRuns, Harls notes, GitHub commits/PRs, Figma components. | 5 | L | **Now** | Cornerstone of traceability; queryable.
| R4 | **Prompt→Doc (MCP)**: PRS, Build Spec, Release Notes generators using workspace templates. | 4 | M | **Now** | Speeds authoring; uses Harls/Filo context.
| R5 | **Reviewer Mode**: run checklists (Accessibility, GDPR, Security, Design parity). Inline annotations + status. | 4 | M | **Next** | Quality gate before release.
| R6 | **Release Notes Automation**: pull GitHub merges + Hans results; assemble changelog with links. | 4 | M | **Next** | Public/internal output.
| R7 | **API & Component Docs**: import OpenAPI; sync Figma components (names, variants, tokens). | 4 | L | **Next** | Unified reference.
| R8 | **Doc Templates Library**: PRS, Tech Design, ADR, Test Plan, Launch Plan; workspace‑scoped. | 3 | S | **Now** | Baseline consistency.
| R9 | **Cross‑App Create‑Doc CTAs**: buttons in Filo Epics/Features/Cards and Harls to create a linked Ruby doc. | 5 | S | **Now** | Friction removal; ensures adoption.
| R10 | **Knowledge Graph View**: visual map of Docs ↔ Epics/Tests/Commits/Components. | 3 | M | **Later** | Adds discovery; not critical path.
| R11 | **Spec Diff & Explain**: compare doc versions; natural‑language summary of changes. | 3 | M | **Later** | Great for reviews; not day‑one.
| R12 | **Exports**: Markdown/PDF/HTML; signed share links; watermarking. | 4 | S | **Next** | Publishing compliance.
| R13 | **Access Controls & Audit**: granular roles; immutable review audits; evidence retention policy. | 5 | M | **Now** | Governance.

---

## 3. Functional Requirements

### 3.1 TipTap Authoring (R1, R2)
- **Blocks/Marks**: paragraph, headings, bold/italic/underline, code span, links, lists, blockquote, callouts.
- **Extensions**: table (resizable), code block with syntax highlight, task list with assignees, image, attachment, emoji, horizontal rule, markdown‑paste, slash‑menu, mentions (`@Epic‑123`, `@FEAT‑22`, `@CARD‑909`).
- **Drag & Drop**: files/images into editor → automatic upload with progress, insert as block.
- **Uploads**: to `/assets/{projectId}/{docId}/{assetId}` with metadata `{name, mime, size, sha256, virusScan, createdBy}`.
- **Paste‑as‑Markdown**: preserve structure from Google Docs/MD.
- **Link autocompletion**: `[[search]]` for Ruby docs; `#FILO‑123` for Filo; `HANS‑T‑55` for tests.

**DoD**: Uploads succeed with progress, errors surfaced; files recover on refresh; tables and code blocks render mobile/desktop; keyboard shortcuts parity.

### 3.2 DocLink Graph (R3)
- **Object**: `DocLink { id, from:{type,id}, to:{type,id}, relation, createdAt, createdBy }`
- **Relations**: `documents→epic|feature|card|testcase|testrun|commit|pr|figmaComponent` (bi‑directional index).
- **UI**: side panel showing linked items; quick‑add; hover preview; graph tab (v1 list only).
- **Search/Filters**: by relation, artefact type, text.

**DoD**: Creating a doc from Filo/Harls auto‑creates a DocLink; deleting keeps historic link for audit unless hard‑deleted by admin.

### 3.3 Prompt→Doc (R4)
- **Entry points**: Harls note, Filo Epic/Feature/Card, Ruby New‑Doc modal.
- **Templates**: `PRS`, `BuildSpec`, `ReleaseNotes` (workspace‑scoped YAML + variables).
- **MCP op**: `generateDoc(type, context, sourceId)` returns `{docId, draft=true}`. Context includes Epic/Feature/Card metadata, acceptance criteria, user flows, and constraints.
- **Post‑process**: back‑fill DocLinks; show diff if doc already exists; set status `Draft`.

**DoD**: Generation < 10s; result passes linter (headings present, sections not empty); audit trail stores prompt + template version.

### 3.4 Reviewer Mode (R5)
- **Checklists**: Accessibility (WCAG quick), Security (PII, auth, storage), GDPR, Design parity (Figma tokens), Performance notes.
- **Annotations**: inline comments with severity (Info/Minor/Major/Critical), suggested fix, owner.
- **Status**: `Not Reviewed / In Review / Approved / Changes Requested` with signatures.

**DoD**: Review summary panel; exportable as PDF; all annotations versioned.

### 3.5 Release Notes Automation (R6, R12)
- **Inputs**: GitHub PRs merged between tags; Filo Done cards; Hans passed test runs; known issues from open bugs.
- **Output**: `ReleaseNotes.md` sections: Features, Fixes, Improvements, Known Issues, Links & Evidence.
- **Publish**: copy to project site (Next.js route), PDF export, or share link.

**DoD**: All entries link back to source; build reproducible from tag range.

### 3.6 API & Component Docs (R7)
- **API**: upload OpenAPI JSON/YAML; render as navigable reference; anchor links; code samples (curl/js/ts).
- **Figma**: pull component list, variants, token names; render preview thumbnails; link to frame.

**DoD**: Delta updates reflected within 5 min; broken links flagged.

### 3.7 Cross‑App Create‑Doc CTAs (R9)
- **Filo**: buttons on Epic/Feature/Card: `Create PRS`, `Create Build Spec`, `Create Release Notes` → pre‑filled context → Ruby doc created + DocLink.
- **Harls**: `Create PRS from Brief` on notes/whiteboard selection.
- **Hans**: `Create Test Plan` from test suite (v2, optional).

**DoD**: Users never copy/paste IDs; links appear instantly in both apps.

### 3.8 Access Controls & Audit (R13)
- Roles: `Viewer, Editor, Reviewer, Admin` scoped to workspace/project.  
- Audit: every generation, edit, review, publish recorded with actor/time/template/hash.  
- Retention: evidence (images/logs) tied to releases follow policy (e.g., 12 months).

---

## 4. Data Model

**Collections**
- `documents { id, projectId, title, type, status, tiptapJson, version, createdBy, updatedBy, createdAt, updatedAt }`
- `assets { id, docId, name, mime, size, sha256, url, thumbnailUrl, virusScan, createdAt }`
- `docLinks { id, fromType, fromId, toType, toId, relation, createdAt, createdBy }`
- `reviews { id, docId, checklist, items[], status, reviewerId, signedAt }`
- `publishEvents { id, docId, target, url, commitHash, createdAt }`

**Indexing**
- Compound indexes on `{projectId,type,status}`, `{fromType,fromId}`, `{toType,toId}` for links.

---

## 5. Integrations

### 5.1 MCP Server
- `generateDoc(type, context, sourceId)`
- `reviewDoc(docId, checklistId)`
- `publishReleaseNotes(projectId, tagFrom, tagTo)`

### 5.2 GitHub
- OAuth app; scopes: `repo:read`, `metadata:read`.  
- Webhook: on `push`, `pull_request` merged → update release notes cache.

### 5.3 Figma
- Access via personal/team token; pull components, file thumbnails; cache for 5 min.

### 5.4 Hans
- REST: `GET /testsuites/:id`, `GET /testruns?status=pass&range=tagFrom..tagTo`.

### 5.5 Filo / Harls
- Button handlers call `POST /ruby/docs/generate` with `{type, sourceRef}`; response returns `docId` + `docUrl` for redirect.

---

## 6. Technical Design
- **Frontend**: Next.js App Router; TipTap with custom extensions (DocLink, Mention, AssetBlock, ReviewerAnnotation).  
- **Storage**: Firestore for metadata + TipTap JSON; Cloud Storage for assets; signed URLs; AV scan via Cloud Run microservice.  
- **Search**: Firestore text + optional Algolia for full‑text across docs/assets/links.  
- **Security**: Google Sign‑In; role‑based checks on server actions; attachment MIME allowlist; size limits with chunked uploads.  
- **Performance**: optimistic UI for links and uploads; background thumbnailer; CDN for assets.

---

## 7. UX Notes
- New‑Doc modal with **type** presets and template preview.  
- Editor top bar: breadcrumbs (Project / Doc), status lozenge (Draft/Approved/Published), **Review** button, **Publish** menu.  
- Right panel tabs: **Links • Outline • Activity • Assets**.  
- Slash menu curated for spec authoring; `@mention` STEa artefacts; `[[` to reference Ruby docs.

---

## 8. Delivery Plan (Agile‑leaning, stage‑gated)

### Phase 1 — Foundations (2–3 sprints)
- R1, R2, R8, R9, R13
- Minimal DocLink list UI; uploads; TipTap core; create‑doc CTAs in Filo/Harls.

### Phase 2 — Intelligence (2–3 sprints)
- R3, R4, R6, R12
- Prompt→Doc, Release Notes automation, exports, improved Link panel.

### Phase 3 — Quality (2 sprints)
- R5, R7
- Reviewer Mode + API/Component docs.

### Phase 4 — Visualisation (1–2 sprints)
- R10 (graph view), R11 (diff/explain).

**Gateways (waterfall‑style):**  
G1 Architecture sign‑off → G2 Security/Privacy review → G3 UAT (Hans) → G4 Release.

---

## 9. Definition of Ready (DoR)
- Template for the doc type exists and is approved.  
- Source artefact (Epic/Feature/Card/Brief) has ID and minimum context.
- Roles defined for review (Reviewer assigned).  
- Acceptance tests written for feature.

## 10. Definition of Done (DoD)
- Feature implemented with tests; reviewer checklist passing; links created and visible; accessibility audited; documentation updated; analytics events emitted.

---

## 11. Acceptance Criteria (samples)
- **Uploads**: A user can drag a PDF into the editor → sees progress → block appears with filename, size, and download.  
- **DocLink**: Creating a PRS from a Filo Epic generates a Ruby doc and displays a link on both artefacts within 2s.  
- **Prompt→Doc**: Generating a Build Spec from a Card produces a Draft with all required sections (Overview, Architecture, Data Model, Risks, Open Questions).  
- **Reviewer Mode**: Running GDPR checklist on a PRS adds annotations and produces a summary with pass/fail counts.  
- **Release Notes**: Publishing between tags `v1.3..v1.4` outputs a Markdown file with features/fixes/tests and links.

---

## 12. Analytics & Telemetry
- Events: `doc_created`, `doc_generated`, `doc_review_started`, `doc_published`, `asset_uploaded`, `link_created`.  
- Funnels: create‑doc CTA conversion; reviewer completion rate; time‑to‑publish.  
- Error logging: upload failures, MCP timeouts.

---

## 13. Risks & Mitigations
- **MCP hallucinations** → constrain templates + small batches; human review required for publish.  
- **Link rot** → background validators; broken‑link report.  
- **Large assets** → size limits + chunking + CDN; pre‑signed URLs; AV scanning.  
- **Permissions creep** → role matrix + least privilege + audited actions.

---

## 14. Open Questions
- Should API docs be public per project by default? (Default: private; toggle per doc.)  
- Do we need workspace‑wide mandatory review policies before publish?  
- Where to surface Knowledge Graph—Ruby only, or global STEa header?

---

## 15. Rollout & Comms
- Pilot with STEa internal projects (SyncFit, AssumeZero).  
- Create example library docs and demo videos.  
- Add “What’s New” page driven by Release Notes automation.

---

**Appendix A — TipTap Extensions to Implement**
- StarterKit, Link, Image, Table, TaskList/Item, CodeBlockLowlight, Placeholder, Mention, SlashCommand, Highlight, HorizontalRule, History, Search/Replace, Custom: DocLink, AssetBlock, ReviewerAnnotation.

**Appendix B — API Surface (Draft)**
- `POST /ruby/docs/generate`  
- `POST /ruby/docs`  
- `GET /ruby/docs/:id`  
- `POST /ruby/docs/:id/review`  
- `POST /ruby/docs/:id/publish`  
- `POST /ruby/assets`  
- `POST /ruby/doclinks`

**Appendix C — Example Template (YAML header)**
```yaml
name: PRS
sections:
  - title: Executive Summary
  - title: Goals & Non‑Goals
  - title: Requirements (Functional/Non‑functional)
  - title: Architecture & Data Model
  - title: Risks & Mitigations
  - title: Test Strategy & Acceptance Criteria
  - title: Rollout & Comms
  - title: Appendix (Glossary, References)
```

---

**Ruby — Product Intelligence that writes itself.**

