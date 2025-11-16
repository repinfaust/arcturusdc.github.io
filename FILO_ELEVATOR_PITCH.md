# FILO - Elevator Pitch & Key Differentiators

## 30-Second Pitch

**Filo is a structured delivery platform that eliminates context switching between product management, development, and testing.**

Unlike Jira, Linear, or Asana (which are task lists), Filo enforces a **three-tier hierarchy** (Epic → Feature → Card) and embeds **testing metadata directly on each card** (User Story + Acceptance Criteria + User Flows). When you send a card to testing with one click, Hans automatically creates test cases. Failed tests auto-create Bug Cards back in Filo.

That's a **closed-loop system** from discovery → delivery → testing → bugs, with zero copy-paste and full traceability.

---

## Top 5 Unique Selling Points

### 1. Built-In Testing Metadata (Not an Afterthought)

Competitors: Title + Description

Filo: **User Story + Acceptance Criteria + User Flows**

```
Card: "Google Sign-In Implementation"
├── User Story: "As a new user, I want to sign in with Google..."
├── Acceptance Criteria: ["Google button visible", "OAuth flow works", "Profile synced", ...]
└── User Flow: ["Launch → Sign In → Permissions → Home"]
```

These fields flow directly to Hans. No context switching. No manual re-entry.

### 2. Closed-Loop Testing (One-Click to Test, Auto-Link Back)

```
Filo Card → Click "Send to Hans" → Test Case Created
              ↓ (Test Fails)
           Bug Card Auto-Created in Filo with linked context
```

**Result**: Testers, PMs, and devs stay in one place. Test failures become actionable cards instantly.

### 3. Hierarchical Search with Tokenization

Search: `google auth onboarding`

Finds: Card "Google Sign-In" → Feature "Auth Flow" → Epic "Onboarding v2"

Competitors search by title. Filo searches across the **entire hierarchy** with intelligent tokenization.

### 4. Live Completion Tracking with Gradients

Each Epic/Feature shows a **visual progress bar** that updates in real-time:
- 0% = Light (empty)
- 50% = Half-filled
- 100% = Dark (complete)

Completion bubbles up: Mark a Card "Done" → Feature % updates → Epic % updates.

### 5. AI-Native Backlog Generation (MCP)

Paste discovery notes in Harls → Click "Generate Backlog" → Claude structures everything:
- Epics with intent & success metrics
- Features with scope & dependencies
- Cards with user stories, AC, and flows

**Result**: A complete, AI-organized backlog in 60 seconds. No manual categorization.

---

## Competitive Matrix (One Pager)

| Feature | Filo | Jira | Linear | Asana |
|---------|:----:|:----:|:------:|:-----:|
| **3-Tier Hierarchy** | ✓ | 2-tier | flat | flat |
| **Testing Fields on Card** | ✓ | - | - | - |
| **Integrated Test Suite** | ✓ | External | External | External |
| **Hierarchical Search** | ✓ | Title only | Title only | Title only |
| **Auto-Bug Creation from Tests** | ✓ | - | - | - |
| **Live Completion %** | ✓ | Count only | Count only | Count only |
| **AI Backlog Gen (MCP)** | ✓ | Rules | Rules | Rules |
| **Closed-Loop Discovery→Build→Test** | ✓ | Manual | Manual | Manual |
| **App Inheritance (Epic→Feature→Card)** | ✓ | - | - | - |

---

## Code Examples (For Technical Audiences)

### Per-Card Testing Fields

```javascript
// On every card in Filo
{
  title: "Google Sign-In Implementation",
  description: "Implement OAuth...",
  
  // Unique to Filo
  userStory: "As a new user, I want to sign in with Google so...",
  acceptanceCriteria: [
    "Google button renders on auth screen",
    "OAuth flow completes without errors",
    "User profile syncs to database"
  ],
  userFlow: [
    "User launches app → Sees auth screen",
    "User taps Google button → Redirected to consent",
    "User grants permissions → Home screen"
  ]
}
```

### Send to Hans (One API Call)

```javascript
POST /api/hans/createFromCard
{
  cardId: "card_123",
  userStory: "As a new user...",
  acceptanceCriteria: [...],
  userFlow: [...],
  tenantId: "workspace_id"
}

Response: {
  success: true,
  testCaseId: "hans_case_789",
  publicToken: "a1b2c3d4...",
  publicUrl: "/t/a1b2c3d4...",  // Share with testers
  hansUrl: "/apps/stea/hans?case=hans_case_789"
}
```

### Hierarchical Completion Tracking

```javascript
// Real-time stats
Epic "Onboarding v2": 7/10 completed (70%)
  ├── Feature "Google Sign-In": 3/3 (100%)
  ├── Feature "Password Reset": 2/3 (67%)
  └── Feature "Profile Setup": 2/4 (50%)

// Gradient fills automatically
background: linear-gradient(to top, 
  darkRed 0%, 
  darkRed 42%,    // 70% * 60% = 42%
  lightRed 70%, 
  lightRed 100%
)
```

---

## Why This Matters for Different Roles

### For PMs
- **No context switching**: All spec (US, AC, flows) lives on the card
- **Live visibility**: Completion % updates as cards move
- **Testing powered**: See if features work before shipping
- **Discovery loop**: Start with problem → AI generates epic → track to Done

### For Developers
- **Clear acceptance criteria**: No "what does the PM really want?" moments
- **User flows documented**: Know the user journey for each card
- **Linked tests**: See which tests validate your work
- **Auto-linked bugs**: Failed tests create assignable cards instantly

### For QA/Testers
- **Pre-written test steps**: User flows from cards
- **Public test links**: Share with external testers, no VPN needed
- **Evidence tracking**: Attach screenshots, logs, device info
- **Results feed back**: Failed tests automatically create bugs in Filo

### For Leadership
- **Epic completion at a glance**: Visual progress bars
- **Traceability**: From discovery → card → test → bug (full audit trail)
- **Zero waste**: No manual re-entry of specs, stories, or test cases
- **AI acceleration**: Generate full backlogs in minutes

---

## Implementation Timeline

**Week 1**: Core hierarchy (Epics, Features, Cards)
**Week 2**: Testing fields (User Story, AC, Flows)
**Week 3**: Send to Hans integration
**Week 4**: Bug auto-creation from Hans
**Week 5**: Completion tracking & gradients
**Week 6**: MCP + Auto-Product backlog generation

---

## Success Metrics

- **Time to first backlog**: <5 minutes (vs 2-4 hours in Jira)
- **Test case creation**: 1 click (vs copy-paste from Jira)
- **Bug linkage**: 100% of failed tests → Filo cards (vs manual triage)
- **Context switching**: Eliminated (users stay in Filo)
- **Traceability**: 100% (every card → test → result)

---

## Call to Action

**For Agencies**: "One discovery prompt generates a complete, testable backlog for each client."

**For Scaleups**: "Stop losing context between Jira, TestRail, and Slack. Build here."

**For Teams**: "Your testers see exactly what devs built. Failed tests become cards. No Slack threads."

---

**Questions?** 

See FILO_USP_Analysis.md for deep technical details.
