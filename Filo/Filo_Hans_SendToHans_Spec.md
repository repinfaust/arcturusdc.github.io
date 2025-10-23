# Filo + Hans Integration Specification  
*Feature: “Send to Hans” Test Case Flow*

---

## 🧭 Overview

This document outlines how to implement and connect the **Filo Board** and **Hans Testing Suite**, enabling direct creation of test cases from cards in Filo.  
It also includes the new UI fields for **User Story**, **Acceptance Criteria**, and **User Flow**, and the cross-app filtering logic between both tools.

---

## 1. Goals

- Allow Filo users to send cards directly to Hans to create structured test cases.
- Maintain contextual consistency between apps (Epic, Feature, Card, App name).
- Provide beta testers with a clean, tokenized public page for submitting test results.
- Ensure both tools use the same App filter to keep boards and tests aligned.

---

## 2. Filo Changes

### 2.1 New Fields on Card Creation / Edit Modal

**Add under Description section:**

| Field | Type | Purpose |
|-------|------|----------|
| **User Story** | Textarea | Defines the context and objective of the feature being tested |
| **Acceptance Criteria** | Multi-line text | Specific, measurable conditions to confirm success |
| **User Flow** | Multi-line text | Describes the end-to-end journey the tester should validate |

All three fields are saved to Firestore under `cards/{cardId}`.

Example schema:

```json
{
  "userStory": "As a new user, I want to sign in quickly using Google so I can start immediately.",
  "acceptanceCriteria": [
    "User can tap 'Sign in with Google'",
    "Authentication completes successfully",
    "Redirects to Home screen"
  ],
  "userFlow": [
    "Launch app → Sign in → Permissions prompt → Home"
  ]
}
```

---

### 2.2 “Send to Hans” Button

A **Send to Hans** button appears under these new fields.

When clicked:
1. Takes the `userStory`, `acceptanceCriteria`, and `userFlow` fields.
2. Sends them via POST request to `/api/hans/createFromCard`.
3. Creates a test case under the `hans/cases` collection.
4. Updates the Filo card with a link to the Hans test case and testing status.

#### Example Payload

```json
{
  "boardId": "board_123",
  "cardId": "card_456",
  "app": "Tou.Me",
  "title": "TC-001a First-Time User Onboarding",
  "userStory": "...",
  "acceptanceCriteria": [...],
  "userFlow": [...]
}
```

---

## 3. Hans Changes

### 3.1 Data Model Additions

Each Hans test case now includes:

```json
{
  "app": "Tou.Me",
  "userStory": "...",
  "acceptanceCriteria": [...],
  "userFlow": [...],
  "linkedCardId": "card_456",
  "linkedBoardId": "board_123"
}
```

### 3.2 UI Filter by App

Add an identical **App filter dropdown** to Hans (same data source as Filo).  
This ensures testers and PMs only see relevant test cases per app.

| Filter | Function |
|---------|-----------|
| App | Shows only test cases linked to selected app |
| Type / Priority | Optional future filters for internal testing management |

---

### 3.3 Test Case Display in Hans

Each case should show:

- **Title**
- **App name + badge**
- **User Story**
- **Acceptance Criteria (checklist format)**
- **User Flow (visual steps or collapsible list)**
- **Status** (Open, In Progress, Passed, Failed)
- **Pass / Fail / Skip buttons for each step**
- **Optional screenshot upload**

---

### 3.4 Public Test Page

Testers can access a read-only test case via public token:
```
/t/[publicToken]
```

They complete Pass/Fail for each step and submit.

Results are stored in `hans/cases/{caseId}/submissions` and sync back to the linked Filo card under `testing.status`.

---

## 4. Shared Logic

### Firestore Linking
- `cards.{cardId}.testing.testCaseId` → `hans.cases.{caseId}`
- Shared `app` field for cross-tool filtering.

### Permissions
- Public testers: read case by token, write submission only.
- Authenticated users: full CRUD.

### API Routes Summary
| Route | Purpose |
|--------|----------|
| `/api/hans/createFromCard` | Create test case from Filo card |
| `/api/hans/submit` | Public test submissions |
| `/api/hans/update` | Update case status and feedback |

---

## 5. Migration Checklist

| Step | Task |
|------|------|
| ✅ | Add User Story / AC / User Flow fields in card modal |
| ✅ | Implement “Send to Hans” button |
| ✅ | Create `/api/hans/createFromCard` endpoint |
| ✅ | Link card to created Hans test case |
| ✅ | Build Hans App filter dropdown (mirrors Filo) |
| ✅ | Update Firestore with `app` linkage |
| ✅ | Replace `/testersonlypage` with `/apps/hans/...` structure |
| ✅ | Test Tou.Me onboarding flow end-to-end |

---

## 6. Example Workflow (Tou.Me)

| Step | Action |
|------|--------|
| 1 | Create Feature: *First-Time User Onboarding* in Filo |
| 2 | Add Cards: TC-001a, TC-002, TC-003 |
| 3 | Enter User Story, Acceptance Criteria, User Flow |
| 4 | Click “Send to Hans” to generate test cases |
| 5 | Share tokenized link with beta testers |
| 6 | Review pass/fail submissions and sync results back into Filo |

---

## 7. Future Enhancements

- AI-assisted test case generation (via ChatGPT/Atlas API)
- Cross-linked analytics: % Passed per App, per Feature
- Export PDF/CSV reports for clients or app store submissions

---

**Version:** 1.0 — October 2025  
**Author:** David Loake (ArcturusDC)
