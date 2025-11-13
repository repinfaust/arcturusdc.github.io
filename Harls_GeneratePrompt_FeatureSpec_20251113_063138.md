# Feature: Generate Prompt (Markdown Export)

## Overview
Harls users can export structured discovery content as a Markdown file designed for use with any LLM. No direct integration with MCP or LLM APIs exists — this is a standalone export.

---

## Feature Summary
**Goal:** Let users download a `.md` file that compiles all current Harls fields (problem, JTBD, goals, constraints, assumptions, etc.) into a consistent, LLM‑ready template.

**Outcome:** A deterministic, human‑readable file that can be dropped into ChatGPT, Claude, or any LLM to generate build specs or backlog JSON.

---

## User Flow
1. User completes discovery in Harls (Problem, JTBD, Goals, etc.).
2. Clicks **Generate Prompt**.
3. Sees a preview of the compiled Markdown (editable).
4. Clicks **Download .md**.
5. File downloads locally — no backend or LLM calls.

---

## Markdown Template (Exported Format)

````md
# Project
Name: <Project Name>
Owner: <Your Name / Team>
Date: <YYYY-MM-DD>

## Problem to Solve
<One clear paragraph summarising the user problem and impact.>

## Audience / Users
- <Persona / role>
- <Key needs / pain points>

## Jobs To Be Done
- When I… <JTBD 1>
- When I… <JTBD 2>
- When I… <JTBD 3>

## Goals / Success Metrics
- Outcome metrics: <e.g., time to first value, conversion, NPS>
- Leading indicators: <e.g., AC coverage, cycle time>

## Scope & Constraints
- In scope: <capabilities>
- Out of scope: <explicit exclusions>
- Constraints: <devices, platforms, compliance, accessibility, performance, deadlines>

## Assumptions, Risks, Dependencies
- Assumptions: <bullets>
- Risks/Unknowns: <bullets>
- Dependencies: <systems/APIs/teams>

## Seed Stories / Acceptance Criteria / Flows
### Example User Story
As a <user>, I want <capability>, so that <outcome>.

### Acceptance Criteria (seed)
1. <Given/When/Then…>
2. <…>

### User Flows (seed)
- <Flow name>: Step 1 → Step 2 → Expected result

---

## What I want from the LLM (follow exactly)
1) Produce a **concise build spec (Markdown)** with these sections in order:
   - Overview, Architecture (ASCII diagram OK), Data model, API contracts (req/resp),
     Feature breakdown (Epic → Feature → Story), Non-functionals, Test strategy,
     Release plan (flags/migrations).

2) Produce a **Backlog JSON** using this schema:
```json
{
  "epics": [{ "title": "", "intent": "", "successMetrics": [] }],
  "features": [{ "epicIndex": 0, "title": "", "scope": "", "dependencies": [] }],
  "cards": [{
    "featureIndex": 0,
    "title": "",
    "userStory": "",
    "acceptanceCriteria": ["", ""],
    "userFlows": ["", ""],
    "size": "XS|S|M|L|XL",
    "priority": "Now|Next|Later"
  }]
}
```

3) Return **only** two payloads, clearly delimited:
```
===build-spec.md===
# <Title>
...
===backlog.json===
{ ...exact JSON... }
```

## Guardrails
- Stay within MVP + one follow-up release.
- Do not invent integrations not listed under Dependencies.
````

---

## Implementation Notes (Client-side)

```ts
import { Editor } from '@tiptap/react';

type HarlsState = {
  projectName: string;
  owner: string;
  problem: string;
  audience: string[];
  jtbd: string[];
  goals: string[];
  constraints: string[];
  inScope: string[];
  outOfScope: string[];
  assumptions: string[];
  risks: string[];
  dependencies: string[];
  seedStory: string;
  ac: string[];
  flows: string[];
};

export function buildMarkdown(state: HarlsState) {
  const pad = (arr?: string[]) => (arr && arr.length ? arr.map(x => `- ${x}`).join('\n') : '-');
  const today = new Date().toISOString().slice(0,10);

  return [
    `# Project`,
    `Name: ${state.projectName || '<Project Name>'}`,
    `Owner: ${state.owner || '<Owner>'}`,
    `Date: ${today}`,
    ``,
    `## Problem to Solve`,
    state.problem || '<One clear paragraph…>',
    ``,
    `## Audience / Users`,
    pad(state.audience),
    ``,
    `## Jobs To Be Done`,
    pad(state.jtbd),
    ``,
    `## Goals / Success Metrics`,
    pad(state.goals),
    ``,
    `## Scope & Constraints`,
    `- In scope: ${state.inScope?.join(', ') || '<…>'}`,
    `- Out of scope: ${state.outOfScope?.join(', ') || '<…>'}`,
    `- Constraints: ${state.constraints?.join(', ') || '<…>'}`,
    ``,
    `## Assumptions, Risks, Dependencies`,
    `- Assumptions:\n${pad(state.assumptions)}`,
    `- Risks/Unknowns:\n${pad(state.risks)}`,
    `- Dependencies:\n${pad(state.dependencies)}`,
    ``,
    `## Seed Stories / Acceptance Criteria / Flows`,
    `### Example User Story`,
    state.seedStory || 'As a <user>, I want <capability>, so that <outcome>.',
    ``,
    `### Acceptance Criteria (seed)`,
    (state.ac?.length ? state.ac.map((a,i)=>`${i+1}. ${a}`).join('\n') : '1. <Given/When/Then…>'),
    ``,
    `### User Flows (seed)`,
    pad(state.flows),
    ``,
    `---`,
    ``,
    `## What I want from the LLM (follow exactly)`,
    `1) Produce a **concise build spec (Markdown)** with the sections listed.`,
    `2) Produce a **Backlog JSON** using the provided schema.`,
    `3) Return **only** two payloads, delimited by "===build-spec.md===" and "===backlog.json===".`, 
    ``,
    `## Guardrails`,
    `- Stay within MVP + one follow-up release.`,
    `- Do not invent integrations not listed under Dependencies.`,
  ].join('\n');
}
```

---

## Acceptance Criteria
- Clicking **Generate Prompt** compiles Harls data into Markdown.
- **Preview** modal allows edits before export.
- **Download .md** saves file locally with timestamped name.
- File opens cleanly in text editors; easily pasted into LLMs.
- No external API calls made.
