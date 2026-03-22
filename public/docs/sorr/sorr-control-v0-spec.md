# SoRR Control — v0 Build Spec

**Version:** 0.1.0  
**Status:** Draft  
**Date:** 2026-03-21

---

## What v0 is

A working request router with policy resolution. Users type what they need. The system classifies it, resolves the governing policy bundle, and routes to one of three mock execution paths. Everything is logged.

v0 does not: call real MCP tools, send real approvals, or open real Cowork workspaces. All three routes are mocked with realistic UI state so the flow can be tested and demoed end to end.

---

## Scope boundary

**In v0:**
- Auth (Firebase Auth, email/password or Google SSO)
- Role assignment (manual, via Firestore admin doc)
- Request input and submission
- Three-stage classifier (deterministic → semantic → Claude fallback)
- Policy bundle resolution
- Three mock routes: immediate answer / approval required / governed workspace
- Decision screen showing use case, risk tier, route, permitted actions
- Append-only audit log (Firestore)
- Five use cases, three risk tiers

**Not in v0:**
- Real MCP tool calls
- Real approval queue with notifications
- Real Cowork workspace launch
- Agent invocation
- Admin UI for editing use cases
- Telemetry or BigQuery

---

## Use cases (v0 stub set)

All five are defined as JSON documents. Markdown source lives in `/sorr/use-cases/`. Compiled JSON lives in `/runtime/use-cases/`.

### UC-01 — Incident customer update

```json
{
  "id": "incident_customer_update",
  "name": "Incident customer update",
  "description": "Review a service incident and prepare an internal or customer-safe update.",
  "keywords": ["incident", "sev", "sev1", "sev2", "sev3", "outage", "customer update", "status update", "service impact"],
  "allowed_roles": ["support_lead", "product_manager", "incident_manager"],
  "risk_tier": 3,
  "default_route": "governed_workspace",
  "allowed_tools": ["servicenow_read_incident", "kb_search", "draft_status_update"],
  "disallowed_actions": ["send_external_email", "change_incident_priority"],
  "requires_approval": true,
  "approval_policy_id": "external_comms_review",
  "status": "active"
}
```

### UC-02 — Internal decision brief

```json
{
  "id": "internal_decision_brief",
  "name": "Internal decision brief",
  "description": "Prepare a structured internal brief to support a decision, approval, or escalation.",
  "keywords": ["brief", "decision", "approval", "escalation", "recommendation", "options paper", "internal"],
  "allowed_roles": ["product_manager", "senior_analyst", "operations_manager"],
  "risk_tier": 2,
  "default_route": "immediate_answer",
  "allowed_tools": ["kb_search", "artifact_create_internal_brief"],
  "disallowed_actions": ["send_external_email", "system_write"],
  "requires_approval": false,
  "status": "active"
}
```

### UC-03 — Billing dispute investigation

```json
{
  "id": "billing_dispute_investigation",
  "name": "Billing dispute investigation",
  "description": "Investigate a customer billing discrepancy using account and metering records.",
  "keywords": ["billing", "dispute", "overcharge", "meter", "invoice", "account", "payment", "charge"],
  "allowed_roles": ["support_lead", "billing_analyst", "operations_manager"],
  "risk_tier": 3,
  "default_route": "governed_workspace",
  "allowed_tools": ["billing_read_account", "metering_read_records", "kb_search"],
  "disallowed_actions": ["billing_write", "issue_refund", "send_external_email"],
  "requires_approval": true,
  "approval_policy_id": "financial_record_access",
  "status": "active"
}
```

### UC-04 — Regulatory response draft

```json
{
  "id": "regulatory_response_draft",
  "name": "Regulatory response draft",
  "description": "Draft a response to a regulator, ombudsman, or formal complaint.",
  "keywords": ["regulator", "ofgem", "ombudsman", "complaint", "formal response", "legal", "regulatory"],
  "allowed_roles": ["legal_delegate", "compliance_manager", "senior_operations"],
  "risk_tier": 4,
  "default_route": "approval_required",
  "allowed_tools": ["kb_search", "case_read_complaint"],
  "disallowed_actions": ["send_external_email", "submit_to_regulator", "system_write"],
  "requires_approval": true,
  "approval_policy_id": "regulatory_output_review",
  "status": "active"
}
```

### UC-05 — Workflow routing query

```json
{
  "id": "workflow_routing_query",
  "name": "Workflow routing query",
  "description": "Identify the correct process, team, or workspace for a business situation.",
  "keywords": ["where do i", "who handles", "what's the process", "which team", "how do i escalate", "correct workflow"],
  "allowed_roles": ["all"],
  "risk_tier": 1,
  "default_route": "immediate_answer",
  "allowed_tools": ["kb_search"],
  "disallowed_actions": [],
  "requires_approval": false,
  "status": "active"
}
```

---

## Risk tiers (v0 set)

### Tier 1 — Low / informational

```json
{
  "id": 1,
  "name": "Low / informational",
  "description": "No sensitive data access. Output stays in conversation. No business action triggered.",
  "requires_human_review": false,
  "requires_named_approver": false,
  "allows_autonomous_execution": true,
  "allowed_output_scopes": ["conversation", "internal_draft"],
  "blocked_actions": []
}
```

### Tier 2 — Internal operational

```json
{
  "id": 2,
  "name": "Internal operational",
  "description": "Accesses internal systems or data. Output is internal only. No customer-facing impact.",
  "requires_human_review": false,
  "requires_named_approver": false,
  "allows_autonomous_execution": true,
  "allowed_output_scopes": ["internal_draft", "internal_workspace"],
  "blocked_actions": ["external_send", "system_write"]
}
```

### Tier 3 — External or sensitive operational

```json
{
  "id": 3,
  "name": "External or sensitive operational",
  "description": "May affect customers, involve financial records, or produce external-facing output.",
  "requires_human_review": true,
  "requires_named_approver": true,
  "allows_autonomous_execution": false,
  "allowed_output_scopes": ["internal_draft"],
  "blocked_actions": ["external_send", "system_of_record_write"]
}
```

### Tier 4 — Regulated / legal

```json
{
  "id": 4,
  "name": "Regulated / legal",
  "description": "Involves regulatory, legal, or compliance obligation. Requires named approver before any output leaves the system.",
  "requires_human_review": true,
  "requires_named_approver": true,
  "allows_autonomous_execution": false,
  "allowed_output_scopes": ["internal_draft_only"],
  "blocked_actions": ["external_send", "system_of_record_write", "submit_to_regulator"]
}
```

---

## Firestore collections

### `users/{userId}`

```
{
  uid: string,
  email: string,
  displayName: string,
  orgId: string,
  roles: string[],          // ["product_manager", "support_lead"]
  createdAt: timestamp,
  lastActiveAt: timestamp
}
```

### `orgs/{orgId}`

```
{
  id: string,
  name: string,
  adminUserIds: string[],
  activePolicySnapshotId: string,
  createdAt: timestamp
}
```

### `requests/{requestId}`

```
{
  id: string,               // req_YYYYMMDD_XXXXX
  userId: string,
  orgId: string,
  rawRequest: string,
  status: enum [
    "classifying",
    "classified",
    "approval_required",
    "approved",
    "rejected",
    "executing",
    "complete",
    "blocked",
    "failed"
  ],
  classification: {
    useCaseId: string | null,
    confidence: number,
    riskTier: number,
    classifierStage: "deterministic" | "semantic" | "claude_fallback" | "unmatched",
    matchedKeywords: string[],
    claudeReasoning: string | null
  },
  resolvedPolicyBundleId: string | null,
  route: "immediate_answer" | "approval_required" | "governed_workspace" | "blocked",
  routeDetail: {
    workspaceRef: string | null,
    agentRef: string | null,
    approvalId: string | null,
    immediateResponse: string | null
  },
  approvalState: "not_required" | "pending" | "approved" | "rejected" | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### `policyBundles/{bundleId}`

```
{
  id: string,
  useCaseId: string,
  riskTier: number,
  allowedTools: string[],
  disallowedActions: string[],
  maxAutonomy: string,
  requiresHumanReview: boolean,
  approvalPolicyId: string | null,
  promptPackRefs: string[],
  resourceRefs: string[],
  snapshotVersion: string,
  generatedAt: timestamp
}
```

### `approvals/{approvalId}`

```
{
  id: string,
  requestId: string,
  userId: string,
  orgId: string,
  approvalPolicyId: string,
  requiredApproverRoles: string[],
  approvalMode: "one_of" | "all_of",
  status: "pending" | "approved" | "rejected",
  approverUserId: string | null,
  approverNote: string | null,
  createdAt: timestamp,
  resolvedAt: timestamp | null,
  slaMinutes: number
}
```

### `auditLog/{entryId}`

Append-only. Never updated, never deleted.

```
{
  id: string,
  requestId: string,
  userId: string,
  orgId: string,
  eventType: enum [
    "request_created",
    "classification_complete",
    "policy_bundle_resolved",
    "route_decided",
    "approval_created",
    "approval_resolved",
    "execution_started",
    "execution_complete",
    "request_blocked",
    "request_failed"
  ],
  eventData: object,        // structured payload per event type
  timestamp: timestamp
}
```

### `useCases/{useCaseId}` (runtime cache)

Compiled JSON from markdown source. Treated as read-only by the application.

### `riskTiers/{tierId}` (runtime cache)

Compiled JSON.

---

## API endpoints

All endpoints require Firebase Auth bearer token. All mutating endpoints write an audit log entry.

```
POST   /api/requests              Create request, begin classification
GET    /api/requests/:id          Get request status and result
GET    /api/requests              List requests for authenticated user (paginated)

POST   /api/classify              Internal: classify a request (called by create flow)
POST   /api/bundles/resolve       Internal: generate policy bundle for use case + tier

GET    /api/approvals/:id         Get approval status
POST   /api/approvals/:id/resolve Approver approves or rejects (role-gated)

GET    /api/usecases              List active use cases for org
GET    /api/usecases/:id          Get single use case
GET    /api/risktiers             List risk tiers

GET    /api/audit                 Admin: list audit log entries (paginated, role-gated)
```

---

## Classifier logic

Three-stage. Fail-closed. Returns a classification object.

### Stage 1 — Deterministic keyword match

Check raw request text against each use case's `keywords` array (case-insensitive substring match). Returns the first use case where two or more keywords match. Confidence = 0.9 if 3+ keywords match, 0.75 if exactly 2 match.

If zero or one keyword match across all use cases → proceed to Stage 2.

```typescript
function deterministicClassify(rawRequest: string, useCases: UseCase[]): ClassificationResult | null {
  const lower = rawRequest.toLowerCase();
  for (const uc of useCases) {
    const hits = uc.keywords.filter(k => lower.includes(k));
    if (hits.length >= 2) {
      return {
        useCaseId: uc.id,
        confidence: hits.length >= 3 ? 0.9 : 0.75,
        classifierStage: "deterministic",
        matchedKeywords: hits,
        claudeReasoning: null
      };
    }
  }
  return null;
}
```

### Stage 2 — Semantic description match

Compare the request against each use case `description` field using a simple TF-IDF cosine similarity or embedding distance. In v0 this can be a prompt to Claude asking it to score relevance without full classification, keeping it cheap.

If top match scores above 0.65 similarity → return that use case with confidence = score × 0.85 (discount for semantic-only match). Mark `classifierStage: "semantic"`.

If no match above 0.65 → proceed to Stage 3.

### Stage 3 — Claude fallback classification

Call Claude API with:

- System prompt: classification contract (see below)
- User message: the raw request
- Attached: serialised list of active use case IDs, names, descriptions, and risk tiers

Claude returns structured JSON only:

```json
{
  "useCaseId": "incident_customer_update" | null,
  "confidence": 0.87,
  "riskIndicators": ["customer-facing output", "live system access"],
  "missingContext": ["which incident number", "intended audience"],
  "nearestAlternatives": ["internal_decision_brief"]
}
```

If `useCaseId` is null or confidence < 0.6 → route is `"blocked"`, return "No approved use case found for this request" plus nearest alternatives.

If confidence is 0.6–0.75 → route proceeds but decision screen shows low-confidence warning and asks user to confirm use case before execution.

### Classification contract (Stage 3 system prompt)

```
You are a governance classifier. Your only job is to match a user request to an approved use case.

Return ONLY valid JSON. No preamble, no explanation, no markdown.

Return this structure:
{
  "useCaseId": string | null,
  "confidence": number (0.0–1.0),
  "riskIndicators": string[],
  "missingContext": string[],
  "nearestAlternatives": string[]
}

Rules:
- If the request clearly maps to one use case, return it with confidence.
- If you cannot match with confidence above 0.6, return useCaseId: null.
- Never invent use case IDs. Only return IDs from the provided list.
- riskIndicators: list any signals that suggest elevated sensitivity or external impact.
- missingContext: list any information that would be needed to execute safely.
- nearestAlternatives: list use case IDs that are close but not the best match.
```

---

## Policy bundle generator

Once a use case is classified, the bundle generator creates a `PolicyBundle` document and stores it in Firestore.

```typescript
async function generatePolicyBundle(useCaseId: string, orgId: string): Promise<PolicyBundle> {
  const useCase = await getUseCase(useCaseId);
  const riskTier = await getRiskTier(useCase.risk_tier);
  const snapshotVersion = await getActivePolicySnapshot(orgId);

  const bundle: PolicyBundle = {
    id: generateBundleId(),
    useCaseId: useCase.id,
    riskTier: useCase.risk_tier,
    allowedTools: useCase.allowed_tools,
    disallowedActions: [
      ...useCase.disallowed_actions,
      ...riskTier.blocked_actions
    ],
    maxAutonomy: riskTier.allows_autonomous_execution
      ? "full"
      : "recommendation_only",
    requiresHumanReview: riskTier.requires_human_review,
    approvalPolicyId: useCase.approval_policy_id ?? null,
    promptPackRefs: resolvePromptPacks(useCase.id),
    resourceRefs: resolveResources(useCase.id),
    snapshotVersion,
    generatedAt: now()
  };

  await saveBundle(bundle);
  return bundle;
}
```

The bundle is the runtime artifact. All downstream steps (route decision, execution, audit) reference the bundle ID, not the raw use case. This ensures what was governed is recorded, not just what was requested.

---

## Route decision

After bundle generation, route is determined:

```typescript
function decideRoute(bundle: PolicyBundle, userRoles: string[], useCase: UseCase): Route {
  // Role check first
  if (!useCase.allowed_roles.includes("all")) {
    const hasRole = userRoles.some(r => useCase.allowed_roles.includes(r));
    if (!hasRole) return "blocked";
  }

  // Approval required
  if (bundle.requiresHumanReview || useCase.requires_approval) {
    if (useCase.default_route === "governed_workspace") return "governed_workspace"; // still shows approval state
    return "approval_required";
  }

  // Default route from use case
  return useCase.default_route as Route;
}
```

---

## Mock routes (v0)

All three routes are implemented with realistic UI state but no live execution.

### Route A — Immediate answer

Used for: UC-02 (internal brief), UC-05 (workflow routing), low tier requests.

**What the UI shows:**
- Use case matched
- Risk tier badge
- Permitted tools list
- A Claude-generated response (real API call, but no MCP tools)
- Copy / save actions (within policy)
- Audit entry written

**API behaviour:** Calls Claude API with assembled prompt pack. Returns response. Logs completion.

### Route B — Approval required

Used for: UC-04 (regulatory response), any T3/T4 request where immediate execution is blocked.

**What the UI shows:**
- Use case matched
- Risk tier badge: Tier 3/4 indicator
- Route explanation: "This request requires review before output can be used"
- Draft output (generated but locked): visible to user, not copyable or exportable
- Approver group listed
- Pending badge
- In v0: mock approval button visible to any user with approver role (no real notification)

**API behaviour:** Creates request record in `approval_required` status. Creates approval record. Generates draft via Claude API. Stores draft against request. Does not expose draft until approval resolves.

### Route C — Governed workspace

Used for: UC-01 (incident update), UC-03 (billing dispute).

**What the UI shows:**
- Use case matched
- Risk tier badge
- Policy bundle summary: what's allowed, what's blocked
- "Launch workspace" CTA (mocked: shows a governed workspace panel inline)
- Mock workspace panel shows: workspace name, attached records, permitted tools, constraint summary
- Audit entry written

**API behaviour:** Creates request record in `executing` status. Resolves workspace template. In v0, renders a static workspace panel. Does not call real Cowork API.

---

## MCP tool list (v0 — all mocked)

These are defined as named tools but return mock data in v0. They are registered so the UI can display them accurately in the decision screen and audit log.

```
servicenow_read_incident      Read incident metadata and comments
billing_read_account          Read account and billing summary
metering_read_records         Read meter exchange and reading records
case_read_complaint           Read formal complaint case record
kb_search                     Search internal knowledge base
draft_status_update           Generate a structured status update draft
artifact_create_internal_brief  Create a structured internal brief artifact
approval_submit               Submit an artifact for approval
```

All tools in v0 return a clearly labelled mock payload:

```json
{
  "mock": true,
  "tool": "servicenow_read_incident",
  "data": {
    "incidentId": "INC0023441",
    "severity": "Sev2",
    "summary": "[Mock] Gas meter exchange caused billing feed interruption",
    "status": "In Progress",
    "assignedTeam": "Metering Ops"
  }
}
```

---

## Prompt assembly contract

When Claude is called (routes A and B), the prompt is assembled from three parts. These are assembled in the orchestration layer, never in the client.

### Part 1 — System: governance header

```
You are operating inside SoRR Control. All responses must comply with the governing policy bundle provided.

Use case: {useCase.name}
Risk tier: {riskTier.id} — {riskTier.name}
Allowed tools: {bundle.allowedTools}
Disallowed actions: {bundle.disallowedActions}
Max autonomy: {bundle.maxAutonomy}
Output scope: {riskTier.allowed_output_scopes}

Rules:
- Only act within the allowed tools and output scope above.
- Do not produce output intended for external audiences unless output_scope permits.
- If you identify a risk indicator or missing context, state it before proceeding.
- Do not invent source material. If a tool has not returned data, say so.
- Output is subject to human review. Flag anything that requires approver attention.
```

### Part 2 — System: prompt pack

Injected from `bundle.promptPackRefs`. Each prompt pack is a short instruction block specific to the use case. Example for UC-01:

```
You are preparing a customer-safe incident update.
- Summarise the incident in plain, non-technical language.
- Do not include internal team names, system names, or investigation details.
- Do not speculate on root cause unless it is confirmed.
- Draft in two sections: "What happened" and "What we're doing".
- Flag any content that requires legal or comms review before external use.
```

### Part 3 — User: request

```
{request.rawRequest}
```

Tool results (if any) are injected as assistant turns before the user message, using the standard Anthropic messages format.

---

## Screens summary

### 1. Request screen
- Single text input
- Shortcut tiles for active use cases (tap to pre-fill)
- Recent requests list (last 10, with status badges)
- Pending approvals count badge (for approver roles)

### 2. Classifying screen
- Animated state: "Classifying your request…"
- Classifier stage indicator (deterministic / semantic / reasoning)
- Transitions to Decision screen on completion

### 3. Decision screen
- Matched use case name and description
- Risk tier badge (coloured: green T1, amber T2, orange T3, red T4)
- Route label and plain-language explanation
- Permitted tools list
- Blocked actions list
- Required approvals (if any)
- "Proceed" CTA or "Not what you meant?" link

### 4. Execution screen (route-dependent)
- Route A: response inline, copy/save controls
- Route B: draft shown but locked, approval pending state, approver group listed
- Route C: workspace panel with policy summary and mock launch

### 5. Audit trail (per request)
- Event timeline: created → classified → bundle resolved → route decided → executed
- Each event shows timestamp, event type, and collapsed detail payload

---

## v0 launch criteria

- [ ] Auth working (sign in, role assigned, sign out)
- [ ] Request creation and classification running end to end
- [ ] All three mock routes rendering correctly
- [ ] Decision screen showing accurate use case + tier + route information
- [ ] Policy bundle generated and stored in Firestore for every request
- [ ] Audit log entries written for all events
- [ ] Five use cases and three risk tiers loaded in runtime cache
- [ ] Classifier returning correct route for a test set of 10 sample requests
- [ ] No governed tools accessible outside SoRR Control

---

## What v1 adds

- Real MCP tool calls (read-only first)
- Real approval queue with email notification
- Real Cowork workspace launch via Anthropic API
- Admin UI: use case enable/disable, risk tier editing, approver group management
- Agent register (stub + UI)
- Connector permission matrix
- Low-confidence classification UX (user confirms use case before bundle generation)
