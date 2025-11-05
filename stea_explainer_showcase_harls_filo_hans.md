# STEa — Plan • Build • Test (Closed‑Loop)

**Harls (discovery & planning)**, **Filo (board & delivery)**, and **Hans (testing & validation)** combine into a single closed‑loop product system. Under the hood, an **MCP server** connects to your favourite LLM so a single prompt can seed epics, features, and cards — and then generate test cases that flow to Hans. Tester feedback and failures automatically create/update cards in Filo. No context switching. Full traceability.

---

## 1) Executive Summary (the 30‑second version)
- **One prompt → full backlog**: Seed Epics → Features → Cards directly into Filo via MCP+LLM.
- **Discovery when needed**: Harls captures manual research, JTBD, problem statements, workshop notes.
- **Click “Send to Hans” on a Card**: Acceptance Criteria & User Flows become test cases in Hans.
- **Closed loop**: Hans results (fail/feedback) spawn linked bugs or updates back in Filo automatically.
- **Source of truth**: Trace Epic → Feature → Card → Test → Bug → Fix with zero copy/paste.

**Outcome:** Faster delivery, higher quality, and complete context at every step.

---

## 2) Who It’s For
- **Founders / Solo builders** who want an AI‑accelerated backlog and lightweight QA.
- **Product & Engineering teams** who are tired of Jira + TestRail + Slack glue.
- **Agencies** who need repeatable discovery → delivery → UAT workflow per client.

---

## 3) The Loop at a Glance
```
Harls (Discovery) → Filo (Cards) → Hans (Tests) → Filo (Bugs/Fixes)
            ↑                                      ↓
        MCP + LLM  ←—————— Context & Prompts ——————
```

**Key ideas**
- **Single context**: The same Card holds the User Story, Acceptance Criteria, and User Flows used to generate tests.
- **Zero friction**: “Send to Hans” turns Card details into runnable test cases.
- **Autolinks**: Test runs link back to the source Card/Epic/Feature; bug cards link back to failing steps.

---

## 4) How the Pieces Fit
### Harls — discovery & planning
- Capture: problem framing, JTBD, workshop notes, screenshots, and decisions.
- Output: clearly structured **Discovery Notes** that become context for MCP prompts.

### Filo — board & delivery
- Hierarchy: **Epic → Feature → Card (story)**
- Each Card contains **User Story**, **Acceptance Criteria**, **User Flows**, **Attachments**, **Comments**.
- Action: **Send to Hans** → converts the Card’s A/C + flows into structured test cases.

### Hans — testing & validation
- Ingest: test cases from Filo.
- Run: mark **Pass/Fail/Skip**, add **evidence** (notes, screenshots, logs), capture **device/env**.
- Output:
  - **Pass** → status and evidence pushed back to Card.
  - **Fail** → auto‑create **Bug Card** in Filo with failing step, repro, env, attachments.
  - **Feedback** (even if Pass) → optional enhancement card to Filo.

---

## 5) End‑to‑End Example (5‑minute demo script)
1. In **Harls**, paste a short problem brief (e.g., “Onboarding v2 for SyncFit”).
2. Click **“Generate Backlog”** → MCP sends the brief + any constraints to the LLM.
3. **Filo** is populated with 1–3 Epics, 5–10 Features, and Cards with US/A/C/Flows.
4. Open a Card → review **Acceptance Criteria** and **User Flows**.
5. Click **“Send to Hans”** → Hans receives structured test cases.
6. In **Hans**, run tests on device/sim; attach a screenshot; mark one step **Fail**.
7. Hans auto‑creates a **Bug Card** in Filo with links to the failing step & evidence.
8. In **Filo**, assign bug to dev, implement fix, mark Ready for Retest.
9. Hans re‑runs linked test cases → turn Green; Card auto‑updates.

---

## 6) Data Model & Traceability
**Core objects**
- **Epic** { id, title, intent, success metrics }
- **Feature** { id, epicId, title, scope, dependencies }
- **Card** { id, featureId, userStory, acceptanceCriteria[], userFlows[], attachments[], comments[] }
- **TestCase** { id, sourceCardId, steps[], expected, env } (in Hans)
- **TestRun** { id, testCaseId, status, evidence[], device, timestamp }
- **BugCard** { id, sourceTestRunId, reproSteps, attachments[], status }

**Trace chains**
- Epic → Feature → Card → **TestCase(s)** → **TestRun(s)** → **BugCard(s)** → Fix → Retest → Pass

---

## 7) Architecture (MCP + LLM + Apps)
```
[Harls]         [Filo]                    [Hans]
  |               |                         |
  |  discovery    |  cards (US/A/C/flows)   | tests, runs, evidence
  |               |                         |
  └───────► [MCP Server] ◄──────────────────┘
                 |
                 ▼
              [LLM]
```
- **MCP Server** exposes ops like `createEpic`, `createFeature`, `createCard`, `sendToHans`, `createBugFromFail`.
- **LLM** transforms discovery context → structured artifacts (epics/features/cards/tests) using STEa templates.
- **Auth/Permissions** handled by the front‑end apps; MCP respects scoped tokens.

---

## 8) Interop Flows
### A) Card → Hans
1. User clicks **Send to Hans**.
2. Filo posts `{ cardId, AC[], flows[], envHints }` to MCP.
3. MCP normalizes → **TestCase JSON** for Hans.
4. Hans creates TestCase(s). Links back to `cardId`.

### B) Hans → Filo (on Fail or Feedback)
1. Tester marks Fail or adds Feedback.
2. Hans posts to MCP with `{ testRunId, failStep, repro, evidence[] }`.
3. MCP creates `BugCard` (or `FeedbackCard`) in Filo, linking `testRunId` + source `cardId`.

---

## 9) Prompt Templates (ready to ship)
### 9.1 Backlog Seeding (Harls → MCP → Filo)
**System**: “You are a product work‑planner. Output JSON with Epics, Features, and Cards with `userStory`, `acceptanceCriteria[]`, and `userFlows[]`.”
**User** (template):
```
Project: <name>
Audience: <who>
Goal: <what success looks like>
Constraints: <devices, compliance, deadlines>
Must‑have areas: <list>
Out of scope: <list>
Quality bar: <perf, accessibility, intl>
Output size: ~2 Epics, ~5 Features, ~15–25 Cards
```

### 9.2 “Send to Hans” Test Generation
**System**: “You are a test designer. Convert A/C and User Flows into stepwise TestCase JSON.”
**User** (template):
```
CardId: <id>
AcceptanceCriteria: [ ... ]
UserFlows: [ ... ]
Environments: [ iOS 17, Android 14, Web ]
EvidenceRequired: [ screenshot-on-fail, console-log ]
```

### 9.3 Bug Creation from Fail
**System**: “You are a QA triager. Create a minimal, reproducible BugCard with links.”
**User** (template):
```
TestRunId: <id>
FailingStep: <index + text>
Repro: <numbered steps>
Expected vs Actual: <brief>
Attachments: [ ... ]
Severity: <P1..P4>
```

---

## 10) Dashboards & Signals
- **Filo**: Delivery status by Epic/Feature; cycle time; WIP; bug burn‑down.
- **Hans**: Pass/Fail over time; flaky steps; environment heatmap; evidence coverage.
- **Harls**: Discovery coverage; assumptions vs outcomes; decision log.
- **Cross‑cutting**: Traceability matrix (Cards ↔ TestCases ↔ Bugs), release readiness.

---

## 11) Security & Governance
- Google Sign‑In and role‑based scopes across Harls/Filo/Hans.
- Immutable test evidence & audit trails on critical actions.
- PII minimization; attachment scanning; export controls per project/client.

---

## 12) Pricing Sketch (illustrative)
- **Solo**: £12/mo — 1 project, 2 seats, light automations.
- **Team**: £29/mo/seat — unlimited projects, MCP access, Slack/Email alerts.
- **Agency**: £49/mo/seat — client spaces, templates, custom exports.

---

## 13) Risks & Mitigations
- **Hallucinated backlog** → *Mitigation*: constrain with Harls prompts + validation checklist; small batch generation.
- **Over‑automation** → *Mitigation*: manual review gates for A/C and high‑risk flows.
- **Trace drift** (lost links) → *Mitigation*: strong IDs; bi‑directional linking; guardrails in MCP.
- **Tester friction** → *Mitigation*: mobile‑friendly Hans UI; offline notes; quick evidence capture.

---

## 14) Roadmap Highlights
- **Today**: Send‑to‑Hans; auto‑bug creation; dashboards; CSV/JSON export.
- **Next**: Flaky‑test detector; AC coverage scoring; priority heat‑map.
- **Later**: CI hooks (Maestro/Espresso/XCUITest); GitHub/GitLab issue sync; release gates.

---

## 15) One‑Pager Website Copy (drop‑in)
**Headline**: Plan. Build. Test. In one loop.
**Subhead**: Harls, Filo, and Hans keep strategy, delivery, and QA in the same orbit.
**CTA**: Get your first backlog from one prompt →
**Bullets**:
- One prompt → a working backlog
- Send any Card to testing in a click
- Failing steps become Bug Cards automatically
- Full traceability from idea to fix

---

## 16) FAQ (short)
- **Do I need the AI?** No. You can plan manually in Harls and still get the closed loop.
- **Can we import from Jira?** Yes, via MCP ops or CSV. Cards retain links when migrated into Filo.
- **How do testers see A/C?** Hans shows the Card’s A/C & flows side‑by‑side with test steps.
- **What about client projects?** Use separate spaces; exports include audit trails.

---

## 17) Call to Action
**Try the loop:** draft a brief in Harls → generate backlog → Send one Card to Hans → mark a Fail → watch the Bug Card appear back in Filo. That’s STEa.

