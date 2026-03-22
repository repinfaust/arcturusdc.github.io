# SoRR Control Product POC Build Spec

## Purpose
Update the current SoRR Control proof of concept on the Arcturus site so it reflects the correct product model:

- **Claude remains the primary thinking surface** for normal product work.
- **SoRR Control is not the front door for end users.**
- **SoRR Control becomes the governed broker** for enterprise data access, approved agents, Cowork/workspace launches, recurring reports, and shareable organisational outputs.
- The existing UI work is retained but repositioned as an **admin / approver / audit console** rather than the user entry point.

This POC should show the intended operating model clearly enough for internal discussion with product, security, and leadership.

---

## Core product model

### User experience principle
Users should not start in a governance workflow.

They should:
1. use Claude normally for general thinking,
2. hit SoRR only when the task needs governed capability,
3. be guided into the correct lane automatically.

### Architectural principle
SoRR governs the boundary where AI starts to interact with:
- company data,
- approved analysis agents,
- persistent workspaces,
- recurring/auto-updating outputs,
- and formal organisational artefacts.

### Positioning statement
**SoRR Control is the mandatory broker for governed AI work, not the universal AI front end.**

---

## What this POC is and is not

### This POC should demonstrate
- the correct **reasoning vs governed action** split,
- product-relevant governed use cases,
- seamless Claude-to-SoRR handoff,
- approvals and audit for governed work,
- admin visibility into policy routing.

### This POC should not try to demonstrate
- full backend integration,
- real Claude interception,
- real MCP implementation,
- real dataset access,
- real Cowork integration,
- real enterprise authentication beyond what already exists in the site.

This is still a site POC, not the working platform.

---

## Audience
Primary:
- internal product stakeholders,
- security / infosec stakeholders,
- platform / architecture stakeholders,
- leadership evaluating rollout shape.

Secondary:
- future enterprise prospects,
- internal collaborators reviewing the concept.

---

## Key shift from the current POC

### Current problem
The existing POC exposes governance mechanics as the user front door:
- Request Engine
- Classify Request
- Policy Decision
- Governed Workspace

This makes the product feel like a compliance form rather than a natural extension of Claude.

### Required correction
Reframe the current POC into **two distinct layers**:

#### 1. User-facing concept layer
Shows:
- normal Claude usage,
- automatic escalation into SoRR when needed,
- simple product-language outcomes.

#### 2. SoRR admin/control layer
Shows:
- approvals queue,
- audit trail,
- classification logs,
- policy records,
- governed workspace controls.

The site should present the product as:
**Claude first, SoRR when required.**

---

## Product use cases for this POC
Do not use incident-management or infra-first examples.
Use product-facing examples.

### UC-01 Ad-hoc product analysis
Example prompt:
> Analyse churn across our last three customer cohorts.

Trigger:
- requires access to approved internal dataset.

Likely route:
- immediate if approved dataset + approved user role.

### UC-02 Cross-source insight generation
Example prompt:
> Combine feature adoption data with support feedback themes and summarise likely drivers.

Trigger:
- multiple internal sources,
- possible client-sensitive data,
- more complex reasoning.

Likely route:
- approval or controlled agent depending on policy.

### UC-03 Agent-assisted analysis
Example prompt:
> Run the pricing review agent against this quarter’s usage data.

Trigger:
- approved internal agent,
- approved dataset,
- reusable analysis logic.

Likely route:
- immediate if agent and data permissions already approved.

### UC-04 Persistent workspace / Cowork-style flow
Example prompt:
> Create a workspace that tracks onboarding drop-off weekly and updates the report.

Trigger:
- persistence,
- auto-refresh,
- recurring organisational output.

Likely route:
- open governed workspace.

### UC-05 Shareable strategic output
Example prompt:
> Turn this analysis into a product update for leadership.

Trigger:
- output becomes a formal business artefact,
- may need review before distribution.

Likely route:
- approval required.

---

## Policy boundary model to reflect in the POC
The POC should visually and conceptually communicate the following logic.

### Direct Claude allowed
- ideation,
- explanation,
- summarising user-pasted content,
- drafting from user-supplied context,
- public information tasks,
- lightweight thinking with no governed tools.

### SoRR required when any of the following occur
- access to non-pasted internal or client data,
- use of approved agents,
- use of approved connectors/tools,
- creation of persistent workspaces,
- recurring or auto-updating reports,
- formal organisational outputs,
- outputs intended for wider sharing,
- policy-gated analysis flows.

### User-facing explanation style
Do **not** foreground tier codes or policy jargon.
Translate them into plain task language, for example:
- "Using approved product data"
- "This task needs reviewer approval"
- "Open approved workspace"
- "This request cannot use enterprise tools yet"

---

## Information architecture for the site POC

### Recommended structure
Keep the existing SoRR pages, but reposition them.

#### Public / product-facing POC pages
1. **Overview / How it works**
2. **Claude handoff states**
3. **Example governed use cases**
4. **Admin console preview**

#### Admin / console pages
1. Requests / Classification log
2. Approvals queue
3. Audit trail
4. Security policy / policy boundary
5. Resource hub / governed workspace

---

## Required page changes

### 1. Main overview page
**Replace the current Request Engine front door as the main hero concept.**

The page should communicate:
- people work in Claude as normal,
- SoRR only appears when enterprise data, agents, workspaces, or formal outputs are involved,
- governance is automatic and contextual.

#### Hero message direction
Suggested headline options:
- **Use Claude normally. Govern enterprise work automatically.**
- **Claude for thinking. SoRR for governed work.**
- **Automatic control when AI touches company data and outputs.**

Suggested subcopy:
- Product teams stay in Claude for everyday work.
- When a task needs approved data, agents, recurring workspaces, or reviewable outputs, SoRR routes it into the correct lane automatically.

#### Visual direction
Show a simple flow:
- Claude query
- boundary check
- one of:
  - continue in Claude,
  - use approved tool/agent,
  - approval required,
  - open governed workspace.

This should feel like a smooth product decision flow, not a security dashboard.

---

### 2. User handoff / intervention states page
Create or update a page showing the **actual user experience** when SoRR is triggered from Claude.

#### State A: Continue normally
Example message:
> No additional controls needed. Continue in Claude.

#### State B: Approved capability available
Example message:
> This task can use approved product data and analysis tools.
> Continue with Product Insight Agent.

#### State C: Approval required
Example message:
> This task needs approval before accessing company data.
> Approval request created.

#### State D: Governed workspace required
Example message:
> This task is better handled in an approved workspace.
> Open workspace.

#### State E: Unmatched / blocked
Example message:
> I couldn’t match this request to an approved workflow for enterprise tools.

Design note:
These should look like contextual Claude-side panels/cards, not full-page enterprise forms.

---

### 3. Overview of product use cases
Create a page or section summarising the product-oriented governed use cases.

Each use case card should include:
- natural language prompt example,
- trigger reason,
- likely route,
- why SoRR matters.

Use the five product use cases defined above.

---

### 4. Reposition existing admin pages
The current screens are useful but belong in an **admin / operations / approver** context.

#### Requests / classification page
Keep, but frame as:
- classification history,
- policy routing records,
- confidence log,
- internal operations view.

#### Approvals queue
Keep as-is conceptually.
This is one of the strongest existing views.

#### Audit trail
Keep as-is conceptually.
This is useful and credible.

#### Security policy page
Keep, but rename or rewrite copy to make it clear this is an internal control/admin view.

#### Governed workspace / resource hub
Keep, but make sure it is framed as a **controlled execution space after routing**, not a primary user entry point.

---

## Copy and terminology changes
The current POC copy is too governance-forward for product users.

### Remove or minimise from user-facing views
- Request Engine
- Classify Request
- Policy Decision
- Rules of Engagement
- Route blocked
- T4 Critical
- Confidence score
- Classification jargon

### Replace with
- Use approved product data
- Continue with approved analysis
- This task needs approval
- Open approved workspace
- This task can’t use enterprise tools yet
- Review required before sharing

### Keep technical language only in admin views
- use case IDs,
- classification confidence,
- route state,
- policy bundle metadata,
- risk tier labels.

---

## UX requirements

### User-facing requirements
- The first thing a product user sees should not be a governance form.
- The concept should begin with Claude, not SoRR.
- SoRR should appear as a smart intervention only when needed.
- User-facing language should be task-first and plain English.
- The control burden should feel low.

### Admin-facing requirements
- Preserve the stronger backend credibility already represented by:
  - approvals,
  - audit,
  - classification,
  - policy records,
  - governed execution surfaces.

### Design requirements
- Maintain visual consistency with the current Arcturus / ENSEK-themed design language.
- Keep the polished enterprise aesthetic already established.
- Use cards, route states, flow diagrams, and example prompts.
- Avoid making the public-facing product view feel like ServiceNow.

---

## Suggested page set for the updated site POC

### Page 1: Overview
Purpose:
Explain the product model clearly.

Sections:
- headline + subcopy,
- simple flow diagram,
- why the current problem exists,
- how SoRR solves it without replacing Claude,
- 3–4 concise benefit cards.

### Page 2: Handoff states
Purpose:
Show how SoRR appears inside normal Claude-led work.

Sections:
- continue normally,
- approved tool/agent,
- approval required,
- governed workspace,
- blocked/unmatched.

### Page 3: Product use cases
Purpose:
Ground the product in realistic product-team examples.

Sections:
- five use case cards,
- prompt example,
- trigger,
- route,
- outcome.

### Page 4: Admin console preview
Purpose:
Show the operational/control credibility without making it the front door.

Sections:
- approvals,
- audit,
- classification log,
- policy registry,
- governed workspace control.

---

## POC content examples to include

### Example prompt 1
> Analyse churn across our last three customer cohorts.

Outcome:
- approved dataset available,
- continue with approved analysis.

### Example prompt 2
> Combine client usage data and support themes into a monthly summary.

Outcome:
- governed data access required,
- approval or approved agent.

### Example prompt 3
> Create a workspace that keeps this product KPI summary updated every week.

Outcome:
- open governed workspace.

### Example prompt 4
> Turn this insight into a product update for leadership.

Outcome:
- review/approval before shareable output.

### Example prompt 5
> Use this pasted workshop transcript to draft options.

Outcome:
- continue directly in Claude.

---

## Functional expectations for the site POC
This is still a front-end/site proof of concept, but the behaviour shown should be internally coherent.

### Must demonstrate
- different routes based on task type,
- a clear reasoning vs governed action split,
- that SoRR is triggered automatically when needed,
- that approvals and audit are part of the control layer,
- that the admin console is separate from the normal user journey.

### Can be mocked
- Claude handoff,
- approval creation,
- dataset access checks,
- workspace launch,
- agent invocation,
- route outcomes.

---

## Out of scope for this update
- real enterprise SSO redesign,
- real MCP implementation,
- live Claude integration,
- real approval engine,
- real dataset connectors,
- full role-based access model,
- full policy authoring UI,
- full enterprise backend.

---

## Deliverables
Update the current POC on the site with:
1. revised overview/front page,
2. user-handoff concept screens,
3. product use case examples,
4. repositioned admin console pages,
5. revised terminology/copy throughout.

Optional additional deliverable:
- one simplified architecture diagram showing:
  - Claude,
  - SoRR broker,
  - approved agents/data/workspaces,
  - admin console.

---

## Success criteria
The updated POC succeeds if a product stakeholder can immediately understand:
- they still use Claude normally,
- SoRR only appears when enterprise data, approved agents, persistent workspaces, or formal outputs are involved,
- the current control plane remains strong,
- and the product is not “a governance portal,” but a governed extension to Claude-led work.

The updated POC fails if the first impression is still:
- form submission,
- compliance workflow first,
- or a replacement for Claude.

