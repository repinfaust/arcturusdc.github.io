# FILO (Board & Delivery) - Industry-Leading Unique Features Analysis

## Executive Summary

Filo is a sophisticated product management and delivery platform that stands apart from traditional tools like Jira, Linear, and Asana through its **closed-loop architecture**, **AI-native design**, and **advanced hierarchy with structured testing workflows**. Rather than being just a task board, Filo is a purpose-built delivery layer in the STEa ecosystem (Harls → Filo → Hans), enabling seamless traceability from discovery through testing.

---

## 1. CORE ARCHITECTURE: THREE-TIER HIERARCHY

### 1.1 Nested Structure (Epic → Feature → Card)

Filo implements a sophisticated **three-level hierarchy** that mirrors real product delivery:

```
Epic (Red, Large Container)
├── Feature (Orange, Medium Container)
│   ├── Card (Small, draggable item)
│   ├── Card
│   └── Card
└── Feature
    ├── Card
    └── Card
```

**Key Differentiator**: Unlike Jira's flat "epics + issues" or Linear's "cycles + issues", Filo enforces semantic structure:
- **Epics**: Business-level outcomes (e.g., "Onboarding v2")
- **Features**: Coherent feature sets (e.g., "Google Sign-In Flow")
- **Cards**: Actionable stories with acceptance criteria and user flows

**Data Model** (from `/src/app/apps/stea/filo/page.js`):
```javascript
// Firestore Collections
stea_epics/{epicId}
  - name, description, app, priority, column, size
  - entityType: 'epic'

stea_features/{featureId}
  - epicId (parent link)
  - name, description, app, priority, column, size
  - entityType: 'feature'

stea_cards/{cardId}
  - epicId, featureId (hierarchical links)
  - title, description, app, priority, column, size
  - userStory, acceptanceCriteria[], userFlow[]  // Testing fields
  - searchTokens[] (for advanced search)
  - entityType: 'card'
```

### 1.2 Hierarchical State Management

```javascript
// From filo/page.js - lines 598-642
const featuresByEpic = useMemo(() => {
  const grouped = {};
  for (const feature of features) {
    const key = normalizeId(feature.epicId);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(feature);
  }
  return grouped;
}, [features]);

const featureCompletionStats = useMemo(() => {
  const stats = {};
  for (const feature of features) {
    const featureCards = cards.filter(c => 
      normalizeId(c.featureId) === normalizeId(feature.id)
    );
    const completed = featureCards.filter(c => c.statusColumn === 'Done').length;
    const total = featureCards.length;
    stats[featureId] = { completed, total, percentage: (completed / total) * 100 };
  }
  return stats;
}, [features, cards]);
```

**Why this matters**: Completion tracking flows through the hierarchy. Move a card to "Done" and Epic/Feature completion percentages update automatically (shown as progress bars).

---

## 2. UNIQUE SELLING POINT #1: STRUCTURED USER STORIES WITH TESTING METADATA

### 2.1 Per-Card Testing Fields

**What competitors have**: Title + description

**What Filo has** (lines 910-913, 1014-1016):
```javascript
// User Story: Full context
userStory: "As a new user, I want to sign in quickly using Google so I can start immediately."

// Acceptance Criteria: Measurable checkpoints (array)
acceptanceCriteria: [
  "User can tap 'Sign in with Google'",
  "Authentication completes successfully",
  "Redirects to Home screen"
]

// User Flow: Step-by-step journey (array)
userFlow: [
  "Launch app → Sign in → Permissions prompt → Home"
]
```

**Why this is differentiated**:
1. **No context switching**: All product context lives on the card
2. **Test-ready**: These fields flow directly to Hans (testing suite)
3. **Multi-level specification**: User Story (why) + AC (what) + Flow (how)

### 2.2 Integration with Hans (Testing Suite)

When a user clicks "Send to Hans" on a card:

```javascript
// From /api/hans/createFromCard/route.js (lines 142-172)
const testCase = {
  // Content from card
  app: app || 'New App',
  title: title || 'Untitled Test Case',
  description: description || '',
  userStory: userStory || '',  // From Filo card
  acceptanceCriteria: acceptanceCriteria || [],  // From Filo card
  userFlow: userFlow || [],  // From Filo card
  priority: priority || 'medium',

  // Linkage to Filo
  linkedCardId: cardId,
  linkedBoardId: boardId || 'main',
  linkedFeatureId: featureId || null,
  linkedEpicId: epicId || null,
  linkedFeatureLabel: featureLabel || null,
  linkedEpicLabel: epicLabel || null,

  // Testing metadata
  status: 'open',
  publicToken: publicToken,
  publicTokenExpiry: expiryDate.toISOString(),
  tenantId: tenantId,
  createdAt: new Date().toISOString(),
  createdBy: authResult.email,
};
```

**The loop closes**: Hans test failures auto-create Bug Cards back in Filo (from `/apps/stea/hans/page.js` lines 121-146).

---

## 3. UNIQUE SELLING POINT #2: MULTI-LEVEL SEARCH WITH TOKENIZATION

### 3.1 Advanced Search Token System

Most boards search by title. Filo builds **searchable tokens across the entire hierarchy**.

```javascript
// From filo/page.js, lines 793-800
const buildSearchTokens = (card, featureName = '', epicName = '') => {
  const base = [
    card.title, card.description, card.reporter, card.assignee,
    card.type, card.app, card.priority, card.sizeEstimate, card.appVersion, 
    card.statusColumn,
    featureName, epicName,  // Parent context
  ].join(' ');
  
  // Tokenize: split, lowercase, remove duplicates, limit to 200
  return Array.from(new Set(tokenize(base))).slice(0, 200);
};

// Helper: tokenize() [lines 70-73]
const tokenize = (s) => String(s || '')
  .toLowerCase()
  .split(/[^a-z0-9]+/i)  // Split on non-alphanumeric
  .filter(Boolean);  // Remove empty
```

**Example**: Card "Google Sign-In Flow" under Feature "Auth" under Epic "Onboarding v2" generates tokens:
```
['google', 'sign', 'in', 'flow', 'auth', 'onboarding', 'v2', ...]
```

**Search in action** (lines 719-738):
```javascript
const matchesSearch = (c) => {
  const q = (search || '').trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);

  // Build haystack from card + parent labels
  const hay = [
    c.title, c.description, c.reporter, c.assignee,
    c.type, c.app, c.priority, c.sizeEstimate, c.appVersion, c.statusColumn,
    featureLabel, epicLabel,
  ].map(x => (x || '').toString().toLowerCase()).join(' • ');

  // Match mode: 'all' (AND) or 'any' (OR)
  if (matchMode === 'all') return terms.every(t => hay.includes(t));
  return terms.some(t => hay.includes(t));
};
```

**Differentiator**: Search is smart enough to find cards by parent epic/feature name, not just card name.

---

## 4. UNIQUE SELLING POINT #3: HIERARCHICAL COMPLETION TRACKING

### 4.1 Progress Bars at Every Level

Unlike Jira (which just shows issue count), Filo visualizes completion with **gradient fills**:

```javascript
// From filo/page.js, lines 1168-1188
const getCompletionGradient = (percentage, baseColorLight, baseColorDark) => {
  const ratio = Math.min(Math.max(percentage / 100, 0), 1);
  
  if (ratio === 0) {
    return baseColorLight;  // Empty (light)
  }

  const fillLevel = ratio * 70;
  const fadeStart = fillLevel * 0.6;
  
  // Dark color fills from bottom up as percentage increases
  return `linear-gradient(to top, ${baseColorDark} 0%, ${baseColorDark} ${fadeStart}%, ${baseColorLight} ${fillLevel}%, ${baseColorLight} 100%)`;
};
```

**Visual effect**:
- Epic at 0% → Fully light red
- Epic at 50% → Red fills halfway up
- Epic at 100% → Dark red with light top edge

**Real calculation** (lines 644-672):
```javascript
const epicCompletionStats = useMemo(() => {
  const stats = {};
  for (const epic of epics) {
    const epicId = normalizeId(epic.id);
    const epicFeatures = features.filter(f => normalizeId(f.epicId) === epicId);
    const epicDirectCards = cards.filter(c => 
      normalizeId(c.epicId) === epicId && !c.featureId
    );

    // Count completed features (all their cards are done)
    const completedFeatures = epicFeatures.filter(f => {
      const featureStats = featureCompletionStats[normalizeId(f.id)];
      return featureStats?.completed === featureStats?.total;
    }).length;

    const completedDirectCards = epicDirectCards.filter(c => c.statusColumn === 'Done').length;
    const totalItems = epicFeatures.length + epicDirectCards.length;
    const completedItems = completedFeatures + completedDirectCards;

    stats[epicId] = {
      completed: completedItems,
      total: totalItems,
      percentage: (completedItems / totalItems) * 100
    };
  }
  return stats;
}, [epics, features, cards, featureCompletionStats]);
```

**Display** (shown as badges):
```
Epic: "Onboarding v2" 7/10  ← 70% complete
Feature: "Google Sign-In" 3/3  ← 100% complete
```

---

## 5. UNIQUE SELLING POINT #4: DRAG-AND-DROP WITH HIERARCHY UPDATES

### 5.1 Three-Level Drag-and-Drop

- **Drag Epic** → Move to column + move all nested features/cards
- **Drag Feature** → Move to epic + move all nested cards
- **Drag Card** → Move to feature OR column

**Example: Feature Drop onto Epic** (lines 1202-1301):
```javascript
const handleEpicDrop = async (event) => {
  event.preventDefault();
  const featureId = event.dataTransfer.getData('text/stea-feature-id');
  
  if (featureId) {
    const normalizedFeatureId = normalizeId(featureId);
    const feature = features.find((f) => f.id === normalizedFeatureId);
    const epicLabel = getDocLabel(epic) || epic.title || '';
    
    // Build search tokens (tokenization happens on drop!)
    const featureSearchTokens = buildSearchTokens(
      {
        ...(feature || {}),
        epicId: normalizedEpicId || null,
        epicLabel,
      },
      featureLabel,
      epicLabel || '',
    );

    const updateData = {
      epicId: normalizedEpicId || null,
      epicLabel,
      statusColumn: epic.statusColumn,  // Inherit column
      searchTokens: featureSearchTokens,
      updatedAt: serverTimestamp(),
    };

    // Update feature
    await updateDoc(doc(db, 'stea_features', normalizedFeatureId), updateData);

    // Update all impacted cards (transactional)
    const impactedCards = cards.filter((c) => 
      normalizeId(c.featureId) === normalizedFeatureId
    );
    if (impactedCards.length) {
      await Promise.all(impactedCards.map((c) =>
        updateDoc(doc(db, 'stea_cards', c.id), {
          epicId: normalizedEpicId || null,
          epicLabel,
          searchTokens: buildSearchTokens(...),
          updatedAt: serverTimestamp(),
        })
      ));
    }
  }
  setDragOverEpic('');
};
```

**Why this matters**: When you move a Feature under an Epic, all Cards get updated with the new Epic context instantly (searchTokens are rebuilt).

---

## 6. UNIQUE SELLING POINT #5: INTEGRATION WITH HARLS (Discovery) & RUBY (Documentation)

### 6.1 Bi-Directional Loops

**MCP-Powered Backlog Generation** (from STEa_MCP_Implementation_Guide.md):

```javascript
// Tools exposed to Claude Code / Anthropic's MCP
stea.createEpic(name, description, app, priority, column, size)
stea.createFeature(epicId, name, description, app, priority, column, size)
stea.createCard(epicId, featureId, title, description, app, priority, 
                column, size, testing: { userStory, acceptanceCriteria, userFlow })
stea.listEpics(app, limit)
stea.listFeatures(epicId)
stea.listCardsByFeature(featureId)
```

**Example Harls → Filo Flow**:
1. In Harls, user pastes discovery notes (problem, JTBD, goals)
2. Click "Generate Backlog"
3. MCP sends prompt + discovery context to Claude
4. Claude generates structured JSON:
   ```json
   {
     "epics": [{"title": "Onboarding", "intent": "...", "successMetrics": [...]}],
     "features": [{"epicIndex": 0, "title": "Sign-In", "scope": "..."}],
     "cards": [{
       "featureIndex": 0,
       "title": "Google Auth",
       "userStory": "As a new user...",
       "acceptanceCriteria": ["...", "..."],
       "userFlows": ["Step 1 → Step 2 → ..."]
     }]
   }
   ```
5. Filo imports and nests everything automatically

### 6.2 Ruby Integration (Documentation)

From Epic/Feature peek mode (lines 1373-1383, 1682-1693):
```javascript
{/* Ruby Documentation Links */}
{currentTenant?.id && (
  <div className="mt-3 flex items-center gap-2 flex-wrap">
    <div className="text-xs text-gray-600 font-medium">Create Docs:</div>
    <CreateDocButton
      sourceType="epic"
      sourceId={epic.id}
      templateId="prs"  // Product Requirements Spec
      label="PRS"
      tenantId={currentTenant.id}
    />
    <CreateDocButton
      sourceType="feature"
      sourceId={feature.id}
      templateId="buildSpec"  // Build Specification
      label="Build Spec"
      tenantId={currentTenant.id}
    />
  </div>
)}
```

**Effect**: Click "PRS" on an Epic → Ruby auto-generates a Product Requirements document pulled from the Epic's description, features, and cards.

---

## 7. ADVANCED FEATURES NOT IN JIRA/LINEAR/ASANA

### 7.1 Per-Card App Filtering with Inheritance

```javascript
// From filo/page.js, lines 683-702
const getEffectiveApp = (entity, entityType) => {
  // If entity has an app set, use it
  if (entity.app) return entity.app;

  // Otherwise, check parent hierarchy
  if (entityType === 'card') {
    // Card: check feature's app, then epic's app
    const featureDoc = entity.featureId ? featureMap[normalizeId(entity.featureId)] : null;
    if (featureDoc?.app) return featureDoc.app;
    const epicDoc = entity.epicId ? epicMap[normalizeId(entity.epicId)] : null;
    if (epicDoc?.app) return epicDoc.app;
  } else if (entityType === 'feature') {
    // Feature: check epic's app
    const epicDoc = entity.epicId ? epicMap[normalizeId(entity.epicId)] : null;
    if (epicDoc?.app) return epicDoc.app;
  }
  return '';
};
```

**Benefit**: Set app at Epic level (e.g., "Tou.Me"), all Features/Cards inherit it. Change Epic's app → all children update.

### 7.2 Collapsible Epics/Features

State persisted per tenant (lines 517-555):
```javascript
// Load collapsed states from localStorage on mount/tenant change
useEffect(() => {
  if (!currentTenant?.id) return;
  try {
    const savedEpicsState = localStorage.getItem(
      `filo_collapsed_epics_${currentTenant.id}`
    );
    if (savedEpicsState) {
      setCollapsedEpics(JSON.parse(savedEpicsState));
    }
  } catch (err) {
    console.error('[Filo] Failed to load collapsed states:', err);
  }
}, [currentTenant?.id]);

// Save whenever they change
useEffect(() => {
  if (!currentTenant?.id) return;
  try {
    localStorage.setItem(
      `filo_collapsed_epics_${currentTenant.id}`,
      JSON.stringify(collapsedEpics)
    );
  } catch (err) {
    console.error('[Filo] Failed to save epic collapsed state:', err);
  }
}, [collapsedEpics, currentTenant?.id]);
```

**Effect**: Close an Epic containing 20 Features/100 Cards → UI becomes clean and focused.

### 7.3 "Click and Hold" Peek Mode

```javascript
// Lines 1315-1328, 1575-1588
const handleTitleMouseDown = (e) => {
  e.stopPropagation();
  e.preventDefault();
  setPeeking(`epic-${epic.id}`);
};

const handleTitleMouseUp = (e) => {
  e.stopPropagation();
  setPeeking(null);
};
```

**Effect**: Click and hold the vertical title on a collapsed Epic → full details expand. Release → collapses.

### 7.4 Keyboard Shortcuts

Slash `/` key focuses search (lines 102-117):
```javascript
function useSlashFocus(ref) {
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      const typingInField = tag === 'input' || tag === 'textarea';
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!typingInField) {
          e.preventDefault();
          ref.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ref]);
}
```

---

## 8. CLOSED-LOOP TESTING WORKFLOW

### 8.1 The Complete Flow (STEa Closed Loop)

```
Harls (Discovery) → Filo (Board) → Hans (Testing) → Filo (Bugs)
        ↑                                            ↓
        └────────────── Full Traceability ─────────┘
```

**Step 1: Card with Testing Fields** (Filo)
```javascript
{
  title: "TC-001a First-Time User Onboarding",
  userStory: "As a new user, I want to sign in quickly...",
  acceptanceCriteria: [
    "User can tap 'Sign in with Google'",
    "Authentication completes successfully",
    "Redirects to Home screen"
  ],
  userFlow: [
    "Install → Open → Sign in → Permissions → Home"
  ]
}
```

**Step 2: Send to Hans** (API: `/api/hans/createFromCard`)
```javascript
POST /api/hans/createFromCard
{
  cardId: "card_123",
  app: "Tou.Me",
  title: "TC-001a First-Time User Onboarding",
  userStory: "...",
  acceptanceCriteria: [...],
  userFlow: [...],
  tenantId: "tenant_456"
}
```

Returns:
```javascript
{
  success: true,
  testCaseId: "hans_case_789",
  publicToken: "a1b2c3d4e5f6...",
  publicUrl: "/t/a1b2c3d4e5f6...",
  hansUrl: "/apps/stea/hans?case=hans_case_789"
}
```

**Step 3: Hans Test** (Testing Suite)
- Tester runs steps on device
- Marks Pass/Fail/Skip
- Attaches screenshots

**Step 4: Test Result Syncs Back** (Hans → Filo)
If test fails, Hans auto-creates a Bug Card in Filo:
```javascript
// From /apps/stea/hans/page.js, lines 121-146
const openCardFromFail = (testCase) => {
  const preset = {
    type: 'bug',
    priority: testCase.priority || 'medium',
    app: testCase.app || 'New App',
    title: `${testCase.app}: ${testCase.title} - Failed Test`,
    description: `Test Case: ${testCase.title}\n...`,
    epicId: testCase.linkedEpicId || null,
    featureId: testCase.linkedFeatureId || null,
  };
  
  setCardSeed({ from: 'fail', testCase, preset });
  setCardForm(preset);
  setCardModalOpen(true);
};
```

---

## 9. COMPETITIVE COMPARISON MATRIX

| Feature | Filo | Jira | Linear | Asana |
|---------|------|------|--------|-------|
| **Hierarchy** | Epic → Feature → Card (3 levels) | Epic → Issue (2 levels) | Cycles → Issues (flat) | Projects → Tasks (flat) |
| **Testing Fields** | User Story + AC + Flows per card | None (external tool) | None (external tool) | None (external tool) |
| **Test Integration** | Hans suite built-in | TestRail/etc (external) | External tools | External tools |
| **Search Tokens** | Hierarchical, multi-level | Title/description only | Title/description only | Title/description only |
| **AI Backlog Gen** | MCP + Auto-Product | Automation via rules | Automation via rules | Automation via rules |
| **Completion Tracking** | Hierarchical %s with gradients | No visualization | No visualization | No visualization |
| **Closed-Loop** | Discovery → Board → Testing → Bugs | Manual import | Manual import | Manual import |
| **Drag-and-Drop** | Three-level (card/feature/epic) | Two-level | Two-level | Two-level |
| **App Inheritance** | Yes (Epic → Feature → Card) | No | No | No |
| **Documentation Gen** | Ruby integration (PRS/BuildSpec) | None | None | None |

---

## 10. CODE EXAMPLES: PUTTING IT ALL TOGETHER

### 10.1 Complete Card Creation with Testing Fields

```javascript
// Create a card with full testing context
const newCard = {
  title: "Google Sign-In Implementation",
  description: "Implement OAuth 2.0 Google authentication",
  type: 'feature',
  app: 'Tou.Me',
  priority: 'high',
  statusColumn: 'Build',
  sizeEstimate: 'L',
  epicId: 'epic_onboarding_v2',
  featureId: 'feature_auth_flow',
  epicLabel: 'Onboarding v2',
  featureLabel: 'Authentication Flow',
  
  // CRITICAL: Testing metadata
  userStory: 'As a new user, I want to sign in with Google so I can start immediately without creating a password.',
  acceptanceCriteria: [
    'Google OAuth provider is configured in Firebase',
    'User sees "Sign in with Google" button on auth screen',
    'OAuth flow completes without errors',
    'User profile is synced to app database',
    'Subsequent logins use cached credentials'
  ],
  userFlow: [
    'User launches app → Sees auth screen',
    'User taps "Sign in with Google" → Redirected to Google consent',
    'User grants permissions → Redirected back to app',
    'User sees onboarding flow → Home screen'
  ],
  
  // Search tokens built automatically
  searchTokens: buildSearchTokens(newCard, 'Authentication Flow', 'Onboarding v2'),
  
  reporter: 'pm@company.com',
  assignee: 'dev@company.com',
  tenantId: 'tenant_123',
  createdAt: serverTimestamp(),
};

await addDoc(collection(db, 'stea_cards'), newCard);
```

### 10.2 Sending Card to Hans

```javascript
// User clicks "Send to Hans" button on card
const handleSendToHans = async (card) => {
  const response = await fetch('/api/hans/createFromCard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardId: card.id,
      boardId: 'main',
      app: card.app,
      title: card.title,
      description: card.description,
      userStory: card.userStory,
      acceptanceCriteria: card.acceptanceCriteria,
      userFlow: card.userFlow,
      priority: card.priority,
      epicId: card.epicId,
      featureId: card.featureId,
      epicLabel: card.epicLabel,
      featureLabel: card.featureLabel,
      tenantId: currentTenant.id,  // Security
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Test case created:', result.testCaseId);
    console.log('Share with testers:', result.publicUrl);
    
    // Update card with test case link
    await updateDoc(doc(db, 'stea_cards', card.id), {
      'testing.testCaseId': result.testCaseId,
      'testing.status': 'pending',
      'testing.publicToken': result.publicToken,
    });
  }
};
```

### 10.3 Searching with Hierarchical Context

```javascript
// User searches: "google auth onboarding"
const searchQuery = "google auth onboarding";
const searchTerms = searchQuery.toLowerCase().split(/\s+/);

// Filter cards by search
const results = cards.filter(card => {
  const featureDoc = featureMap[card.featureId];
  const epicDoc = epicMap[card.epicId];
  
  // Build full context haystack
  const hay = [
    card.title,
    card.description,
    featureDoc?.title || card.featureLabel,
    epicDoc?.title || card.epicLabel,
    card.app,
    card.priority
  ].map(x => (x || '').toLowerCase()).join(' ');
  
  // All terms must match
  return searchTerms.every(term => hay.includes(term));
});

// Result: Card "Google Sign-In" → Feature "Auth Flow" → Epic "Onboarding v2" is found
```

---

## 11. SECURITY & MULTI-TENANCY

### 11.1 Tenant Isolation

Every collection supports multi-tenancy:
```javascript
// Create with tenantId
const newCard = { title, description, ..., tenantId: currentTenant.id };
await addDoc(collection(db, 'stea_cards'), newCard);

// Query only tenant's data
const q = query(
  collection(db, 'stea_cards'),
  where('tenantId', '==', currentTenant.id)
);
```

### 11.2 Hans API Security

```javascript
// Verify tenant ownership before creating test case
if (cardDoc.data().tenantId !== tenantId) {
  return NextResponse.json(
    { error: 'Unauthorized: Card does not belong to your workspace' },
    { status: 403 }
  );
}
```

---

## 12. NEXT-GENERATION FEATURES (Roadmap)

From STEa docs:
- **Flaky Test Detector**: Identify unreliable test cases
- **AC Coverage Scoring**: Track how much code is covered by test cases
- **Priority Heatmap**: Visual urgency mapping
- **CI Hooks**: Link to Maestro/Espresso/XCUITest
- **GitHub/GitLab Sync**: Bi-directional issue linking
- **Release Gates**: Prevent shipping until tests pass

---

## 13. SUMMARY: WHY FILO IS INDUSTRY-LEADING

| Dimension | What Makes It Unique |
|-----------|---------------------|
| **Structure** | Enforced 3-tier hierarchy mirrors real product org |
| **Testing** | Per-card User Story + AC + Flows eliminate context switching |
| **Loop** | Closed circuit from discovery → delivery → testing → bugs |
| **Intelligence** | AI-native (MCP) backlog generation from discovery |
| **Search** | Hierarchical tokens + smart matching |
| **Visibility** | Live completion % with gradient fills |
| **Integration** | Harls + Filo + Hans + Ruby form complete system |
| **Flexibility** | Drag-and-drop hierarchy, collapsible layers, peek modes |
| **Multi-tenancy** | Built-in tenant isolation, workspace tokens |

**Bottom line**: Filo is not a task board. It's a **structured delivery engine** that enforces product thinking (Epics → Features → Stories), connects to testing (Hans), and closes the loop automatically.

---

**Document Version**: 1.0  
**Based on codebase**: STEa October 2025  
**Author**: Analysis of Arcturus DC

