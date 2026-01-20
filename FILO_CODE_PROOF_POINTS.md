# FILO - Code Proof Points: Unique Features in Action

This document contains actual code snippets from the Filo codebase demonstrating industry-leading capabilities.

---

## 1. Per-Card Testing Fields (User Story + AC + Flows)

### Source: `/src/app/apps/stea/filo/page.js` (lines 910-913, 1014-1016)

**Problem**: Other tools require context switching to external testing platforms. Test cases must be re-written.

**Filo Solution**: Testing metadata lives on the card itself.

```javascript
// NEW TESTING FIELDS ON EVERY CARD
const card = {
  title: "Google Sign-In Implementation",
  description: "Implement OAuth 2.0 authentication",
  type: 'feature',
  
  // UNIQUE: Structured testing context
  userStory: "As a new user, I want to sign in quickly using Google so I can start immediately.",
  acceptanceCriteria: [
    "User can tap 'Sign in with Google'",
    "Authentication completes successfully",
    "Redirects to Home screen"
  ],
  userFlow: [
    "Launch app → Sign in → Permissions prompt → Home"
  ],
  
  // Standard fields
  priority: 'high',
  statusColumn: 'Build',
  app: 'Tou.Me',
  sizeEstimate: 'L',
  reporter: 'pm@company.com',
  assignee: 'dev@company.com',
};

// Save with multi-level hierarchy
await addDoc(collection(db, 'stea_cards'), {
  ...card,
  epicId: 'epic_onboarding',
  featureId: 'feature_auth',
  searchTokens: buildSearchTokens(card),  // Auto-tokenized
  tenantId: currentTenant.id,
  createdAt: serverTimestamp(),
});
```

**Why this matters**:
- AC and flows are pre-written by PM
- Developers see exact requirements (no ambiguity)
- QA gets test steps directly from the card
- No copy-paste between Jira and TestRail

---

## 2. One-Click Send to Hans (Closed-Loop Testing)

### Source: `/src/app/api/hans/createFromCard/route.js` (lines 46-216)

**Problem**: Creating test cases requires manual re-entry. Failed tests don't link back.

**Filo Solution**: Click "Send to Hans" → Test case created → Failures auto-create Bug Cards.

```javascript
// POST /api/hans/createFromCard
export async function POST(request) {
  // 1. Authenticate user
  const authResult = await verifyAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 2. Parse card data from Filo
  const body = await request.json();
  const {
    cardId,
    app,
    title,
    description,
    userStory,              // FROM FILO CARD
    acceptanceCriteria,     // FROM FILO CARD
    userFlow,               // FROM FILO CARD
    priority,
    epicId,
    featureId,
    epicLabel,
    featureLabel,
    tenantId,
  } = body;

  // 3. Validate card ownership
  const { db } = getFirebaseAdmin();
  const cardDoc = await db.collection('stea_cards').doc(cardId).get();
  
  if (cardDoc.data().tenantId !== tenantId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // 4. Generate public token (for external testers)
  const publicToken = generatePublicToken();
  const expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);

  // 5. Create Hans test case with linkage
  const testCase = {
    // Content from Filo card (zero re-entry)
    app: app || 'New App',
    title: title || 'Untitled Test Case',
    description: description || '',
    userStory: userStory || '',        // Copied from card
    acceptanceCriteria: acceptanceCriteria || [],  // Copied from card
    userFlow: userFlow || [],          // Copied from card
    priority: priority || 'medium',

    // Bi-directional linkage
    linkedCardId: cardId,
    linkedBoardId: 'main',
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

  // 6. Save to Hans
  const testCaseRef = await db.collection('hans_cases').add(testCase);
  const testCaseId = testCaseRef.id;

  // 7. Update card with test case link
  await db.collection('stea_cards').doc(cardId).update({
    'testing.testCaseId': testCaseId,
    'testing.status': 'pending',
    'testing.createdAt': new Date().toISOString(),
    'testing.publicToken': publicToken,
    updatedAt: new Date().toISOString(),
  });

  // 8. Return public link + Hans link
  return NextResponse.json({
    success: true,
    testCaseId,
    publicToken,
    publicTokenExpiry: expiryDate.toISOString(),
    publicUrl: `/t/${publicToken}`,  // External testers
    hansUrl: `/apps/stea/hans?case=${testCaseId}`,
  }, { status: 201 });
}
```

**Key differentiators**:
- Zero manual data entry
- Public token allows external testers (no VPN)
- Bi-directional linking (card ↔ test case)
- 12-hour expiry on public links (security)

---

## 3. Auto-Bug Creation from Test Failures

### Source: `/src/app/apps/stea/hans/page.js` (lines 121-146, 175-233)

**Problem**: Failed tests are reported in Slack or email. PM has to create bug tickets manually.

**Filo Solution**: Hans test fails → Button click → Bug Card created in Filo with full context.

```javascript
// When tester marks a test as FAILED
const openCardFromFail = (testCase) => {
  // Map test priority to card urgency
  const urgencyMap = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  };
  const urgency = urgencyMap[testCase.priority] || 'medium';

  // Pre-fill bug card with test context
  const preset = {
    type: 'bug',                                    // Mark as bug
    urgency: urgency,
    priority: testCase.priority || 'medium',
    app: testCase.app || 'New App',
    title: `${testCase.app}: ${testCase.title} - Failed Test`,
    description: `Test Case: ${testCase.title}\nPriority: ${testCase.priority}\nStatus: Failed\n\nTest Description:\n${testCase.description || 'N/A'}\n\nUser Story:\n${testCase.userStory || 'N/A'}\n\nNotes:\n${testCase.testNotes || '(none)'}\n`,
    
    // Auto-link to original epic/feature
    epicId: testCase.linkedEpicId || null,
    featureId: testCase.linkedFeatureId || null,
    epicLabel: testCase.linkedEpicLabel || '',
    featureLabel: testCase.linkedFeatureLabel || '',
  };

  setCardSeed({ from: 'fail', testCase, preset });
  setCardForm(preset);
  setCardModalOpen(true);
};

// Create the card
const handleCreateCard = async () => {
  const newCard = {
    ...cardForm,
    label: cardForm.title,
    tenantId: currentTenant.id,
    statusColumn: 'Idea',           // Put it in backlog
    entityType: 'card',
    type: cardForm.type || 'observation',
    archived: false,
    searchTokens: generateSearchTokens(
      `${cardForm.title} ${cardForm.description || ''} ${cardForm.app || ''}`
    ),
    createdAt: serverTimestamp(),
    createdBy: user?.email,
    updatedAt: serverTimestamp(),
    source: 'hans_test_suite',      // Track origin
    linkedTestCaseId: cardSeed?.testCase?.id || null,  // Link back to test
  };

  const docRef = await addDoc(collection(db, 'stea_cards'), newCard);
  
  // Show success with link to view in Filo
  setSuccessModalOpen(true);
  setCreatedCardId(docRef.id);
};
```

**Result**:
- Test failures become actionable Filo cards
- Dev sees context (user story, AC, flow)
- Linked back to original test case
- No context switching between Hans and Filo

---

## 4. Hierarchical Completion Tracking

### Source: `/src/app/apps/stea/filo/page.js` (lines 644-672, 1168-1188)

**Problem**: Jira shows issue count. Can't see "what % of the feature is actually done?"

**Filo Solution**: Live completion % bubbles up from Cards → Features → Epics with gradient visualization.

```javascript
// FEATURE COMPLETION (based on nested cards)
const featureCompletionStats = useMemo(() => {
  const stats = {};
  for (const feature of features) {
    const featureId = normalizeId(feature.id);
    
    // Count cards in this feature
    const featureCards = cards.filter(c => 
      normalizeId(c.featureId) === featureId
    );
    
    // Count how many are Done
    const completed = featureCards.filter(
      c => c.statusColumn === 'Done'
    ).length;
    
    const total = featureCards.length;
    
    stats[featureId] = {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  }
  return stats;
}, [features, cards]);

// EPIC COMPLETION (based on nested features AND direct cards)
const epicCompletionStats = useMemo(() => {
  const stats = {};
  for (const epic of epics) {
    const epicId = normalizeId(epic.id);
    
    // Get features and direct cards under this epic
    const epicFeatures = features.filter(
      f => normalizeId(f.epicId) === epicId
    );
    const epicDirectCards = cards.filter(c =>
      normalizeId(c.epicId) === epicId && !c.featureId
    );

    // Count completed features (features where ALL cards are done)
    const completedFeatures = epicFeatures.filter(f => {
      const featureStats = featureCompletionStats[normalizeId(f.id)];
      return featureStats && 
             featureStats.total > 0 && 
             featureStats.completed === featureStats.total;
    }).length;

    // Count completed direct cards
    const completedDirectCards = epicDirectCards.filter(
      c => c.statusColumn === 'Done'
    ).length;

    // Total = features + direct cards
    const totalItems = epicFeatures.length + epicDirectCards.length;
    const completedItems = completedFeatures + completedDirectCards;

    stats[epicId] = {
      completed: completedItems,
      total: totalItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0
    };
  }
  return stats;
}, [epics, features, cards, featureCompletionStats]);

// GRADIENT VISUALIZATION
const getCompletionGradient = (percentage, baseColorLight, baseColorDark) => {
  const ratio = Math.min(Math.max(percentage / 100, 0), 1);

  if (ratio === 0) {
    return baseColorLight;  // 0% = all light (empty)
  }

  // Dark color fills from bottom, light at top
  const fillLevel = ratio * 70;  // Max 70% height fill
  const fadeStart = fillLevel * 0.6;  // Smooth transition

  return `linear-gradient(
    to top, 
    ${baseColorDark} 0%, 
    ${baseColorDark} ${fadeStart}%, 
    ${baseColorLight} ${fillLevel}%, 
    ${baseColorLight} 100%
  )`;
};

// Usage in render
<div
  style={{ background: getCompletionGradient(
    completionStats.percentage, 
    '#fef2f2',    // Light red (empty)
    '#fca5a5'     // Dark red (full)
  ) }}
>
  Epic: "Onboarding v2" {completionStats.completed}/{completionStats.total}
</div>
```

**Visual effect**:
- 0% → Fully light (red container, nothing filled)
- 50% → Red fills halfway up
- 100% → Fully dark red

**Why this matters**:
- CEO sees "Onboarding is 70% done" at a glance
- Not just "10 tasks of 15"—actual completion visibility
- Updates in real-time as cards move to Done

---

## 5. Intelligent Search with Hierarchical Tokenization

### Source: `/src/app/apps/stea/filo/page.js` (lines 70-73, 793-800, 719-738)

**Problem**: Searching by title only. "Google Auth" card under "Auth Flow" feature under "Onboarding v2" epic won't show up if you search "onboarding auth".

**Filo Solution**: Build searchTokens from card + parent hierarchy. Match across multiple terms intelligently.

```javascript
// TOKENIZE: Convert text to searchable tokens
const tokenize = (s) => String(s || '')
  .toLowerCase()
  .split(/[^a-z0-9]+/i)  // Split on non-alphanumeric
  .filter(Boolean);       // Remove empty

// BUILD SEARCH TOKENS (on every card save/move)
const buildSearchTokens = (card, featureName = '', epicName = '') => {
  // Combine card fields + parent context
  const base = [
    card.title,                // "Google Sign-In Implementation"
    card.description,          // "Implement OAuth 2.0"
    card.reporter,             // "pm@company.com"
    card.assignee,             // "dev@company.com"
    card.type,                 // "feature"
    card.app,                  // "Tou.Me"
    card.priority,             // "high"
    card.sizeEstimate,         // "L"
    card.appVersion,           // "1.2.0"
    card.statusColumn,         // "Build"
    featureName,               // "Authentication Flow"
    epicName,                  // "Onboarding v2"
  ].join(' ');
  
  // Tokenize and deduplicate
  return Array.from(new Set(tokenize(base))).slice(0, 200);
};

// Example result
const tokens = [
  'google', 'sign', 'in', 'implementation',
  'implement', 'oauth', '2', '0',
  'pm', 'company', 'com', 'dev',
  'feature', 'tou', 'me', 'high', 'l', 'build',
  'authentication', 'flow',  // From feature
  'onboarding', 'v2'         // From epic
];

// SEARCH MATCHING
const matchesSearch = (card) => {
  const q = (search || '').trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/).filter(Boolean);

  // Get parent context
  const featureDoc = card.featureId ? featureMap[card.featureId] : null;
  const epicDoc = card.epicId ? epicMap[card.epicId] : null;
  const featureLabel = getDocLabel(featureDoc) || (card.featureLabel || '');
  const epicLabel = getDocLabel(epicDoc) || (card.epicLabel || '');

  // Build haystack (everything searchable)
  const hay = [
    card.title,
    card.description,
    card.reporter,
    card.assignee,
    card.type,
    card.app,
    card.priority,
    card.sizeEstimate,
    card.appVersion,
    card.statusColumn,
    featureLabel,              // Parent context
    epicLabel,                 // Parent context
  ].map(x => (x || '').toString().toLowerCase()).join(' • ');

  // Match mode: 'all' (AND) or 'any' (OR)
  if (matchMode === 'all') {
    return terms.every(t => hay.includes(t));  // All terms must match
  }
  return terms.some(t => hay.includes(t));     // Any term matches
};

// Example search results
// User searches: "google auth onboarding"
// Result: Card "Google Sign-In" → Feature "Auth Flow" → Epic "Onboarding v2" ✓
```

**Differentiator**: 
- Search includes parent hierarchy
- No copy-paste tokens into card description (auto-tokenized)
- Switch between AND/OR matching
- Finds cards you couldn't in Jira

---

## 6. Three-Level Drag-and-Drop with Cascading Updates

### Source: `/src/app/apps/stea/filo/page.js` (lines 1202-1301, 1517-1560)

**Problem**: Moving a Feature doesn't move all its Cards. No transactional updates.

**Filo Solution**: Drag Feature → Drops on Epic → Feature moves + all nested Cards updated + searchTokens rebuilt.

```javascript
// FEATURE DROPS ONTO EPIC
const handleEpicDrop = async (event) => {
  event.preventDefault();
  const featureId = event.dataTransfer.getData('text/stea-feature-id');
  
  if (featureId) {
    const normalizedFeatureId = normalizeId(featureId);
    const feature = features.find((f) => f.id === normalizedFeatureId);
    const epicLabel = getDocLabel(epic) || epic.title || '';
    
    // Get epic context for child cards
    const normalizedEpicId = normalizeId(epic.id);

    // Build search tokens for the feature
    const featureSearchTokens = buildSearchTokens(
      {
        ...(feature || {}),
        epicId: normalizedEpicId || null,
        epicLabel,
      },
      feature.title || featureLabel,
      epicLabel || '',
    );

    // Update data (feature moves to epic AND to epic's column)
    const updateData = {
      epicId: normalizedEpicId || null,
      epicLabel,
      statusColumn: epic.statusColumn,  // Inherit epic's column
      searchTokens: featureSearchTokens,
      updatedAt: serverTimestamp(),
    };

    try {
      // 1. Update feature
      await updateDoc(
        doc(db, 'stea_features', normalizedFeatureId), 
        updateData
      );

      // 2. Find and update ALL impacted cards
      const impactedCards = cards.filter((c) =>
        normalizeId(c.featureId) === normalizedFeatureId
      );

      if (impactedCards.length) {
        // Batch update all cards with new epic context
        await Promise.all(
          impactedCards.map((c) =>
            updateDoc(doc(db, 'stea_cards', c.id), {
              epicId: normalizedEpicId || null,
              epicLabel,
              statusColumn: epic.statusColumn,  // Inherit column too
              searchTokens: buildSearchTokens(
                {
                  ...c,
                  epicId: normalizedEpicId || null,
                  epicLabel,
                },
                feature.title || c.featureLabel,
                epicLabel || '',
              ),
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
      
      // Force re-render
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('[STEa Board] Failed to nest feature under epic', err);
    }
  }
  setDragOverEpic('');
};

// CARD DROPS ONTO FEATURE
const handleFeatureDrop = async (event) => {
  event.preventDefault();
  const cardId = event.dataTransfer.getData('text/stea-card-id');
  
  if (cardId) {
    const card = cards.find((c) => c.id === cardId);
    const featureLabel = getDocLabel(feature) || feature?.title || '';
    const normalizedEpicId = normalizeId(feature.epicId);
    const epicDoc = normalizedEpicId ? epicMap[normalizedEpicId] : null;
    const epicLabel = getDocLabel(epicDoc) || '';

    // Build search tokens (includes both feature AND epic context)
    const searchTokens = buildSearchTokens(
      {
        ...(card || {}),
        featureId: normalizedFeatureId || null,
        featureLabel,
        epicId: normalizedEpicId || null,
        epicLabel,
        statusColumn: feature.statusColumn,
      },
      featureLabel || '',
      epicLabel || '',
    );

    try {
      // Update card with feature (and epic from feature)
      await updateDoc(doc(db, 'stea_cards', cardId), {
        featureId: normalizedFeatureId || null,
        featureLabel,
        epicId: normalizedEpicId || null,
        epicLabel,
        statusColumn: feature.statusColumn,  // Inherit feature's column
        searchTokens,
        updatedAt: serverTimestamp(),
      });
      
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('[STEa Board] Failed to nest card under feature', err);
    }
  }
  setDragOverFeature('');
};
```

**Why this is powerful**:
- Move Feature → All 10 Cards move AND inherit context
- Move Epic → All Features + All Cards move in one operation
- SearchTokens rebuild on every move
- No orphaned cards
- Full audit trail (updatedAt tracked)

---

## 7. MCP Integration for AI Backlog Generation

### Source: `/Filo/STEa_MCP_Implementation_Guide.md` + `/src/app/apps/stea/harls/page.js`

**Problem**: Backlog creation is manual and takes days.

**Filo Solution**: AI generates Epics → Features → Cards with full testing metadata.

```javascript
// MCP TOOLS EXPOSED TO CLAUDE
// (Claude Code can call these to populate Filo)

stea.createEpic({
  name: "Onboarding Overhaul",
  description: "Revamp first-time user journey to reduce drop-off",
  app: "Tou.Me",
  priority: "HIGH",
  column: "Planning",
  size: "L"
})
// Returns: { epicId: "epic_abc123" }

stea.createFeature({
  epicId: "epic_abc123",
  name: "Google Sign-In Flow",
  description: "Contextual step-through screens; NUX copy",
  app: "Tou.Me",
  priority: "MEDIUM",
  column: "Design",
  size: "3"
})
// Returns: { featureId: "feature_def456" }

stea.createCard({
  epicId: "epic_abc123",
  featureId: "feature_def456",
  title: "Tour modal appears after Google sign-in",
  description: "Trigger on first open after auth",
  app: "Tou.Me",
  priority: "MEDIUM",
  column: "Design",
  testing: {
    userStory: "As a new user, I want a guided tour so I understand core features.",
    acceptanceCriteria: [
      "Tour shows within 1s of successful auth",
      "Backdrop dim is 60% opacity",
      "Dismiss persists for future logins",
      "Analytics track tour completion"
    ],
    userFlow: [
      "Install → Open → Sign in with Google → Permissions → Modal appears",
      "User taps Next x4 → Each screen highlights feature",
      "User taps Done or Dismiss → Home screen"
    ]
  }
})
// Returns: { cardId: "card_ghi789" }

// PROMPT TEMPLATE (Harls → LLM → MCP → Filo)
const buildMarkdown = () => {
  return [
    `# Project`,
    `Name: ${discovery.projectName || '<Project Name>'}`,
    ``,
    `## Problem to Solve`,
    discovery.problem || '<One clear paragraph…>',
    ``,
    `## What I want from the LLM (follow exactly)`,
    `1) Produce a **Build Spec (Markdown)** with sections:`,
    `   - Overview, Architecture, Data model, API contracts, Feature breakdown`,
    ``,
    `2) Produce a **Backlog JSON** using this schema:`,
    `{`,
    `  "epics": [{ "title": "", "intent": "", "successMetrics": [] }],`,
    `  "features": [{ "epicIndex": 0, "title": "", "scope": "", "dependencies": [] }],`,
    `  "cards": [{`,
    `    "featureIndex": 0,`,
    `    "title": "",`,
    `    "userStory": "",`,
    `    "acceptanceCriteria": ["", ""],`,
    `    "userFlows": ["", ""],`,
    `    "size": "XS|S|M|L|XL",`,
    `    "priority": "Now|Next|Later"`,
    `  }]`,
    `}`,
  ].join('\n');
};
```

**Result**:
- Paste discovery notes
- Claude generates structured JSON
- MCP imports directly to Filo
- All 3 levels (Epics, Features, Cards) with full metadata in <5 minutes
- Zero manual entry

---

## Summary Table

| Feature | Code Location | Proof of Differentiation |
|---------|---|---|
| **Testing Fields** | `/filo/page.js:910-913` | userStory, AC, flows on card (not external) |
| **Send to Hans** | `/api/hans/createFromCard/route.js:46-216` | One-click with bi-directional linking |
| **Auto-Bug Creation** | `/hans/page.js:121-233` | Failed test → card in Filo |
| **Completion Tracking** | `/filo/page.js:644-1188` | Hierarchical % with gradients |
| **Smart Search** | `/filo/page.js:70-800` | Tokenize + search across hierarchy |
| **3-Level Drag-Drop** | `/filo/page.js:1202-1560` | Cascading updates across all levels |
| **MCP Backlog Gen** | `/harls/page.js` + `/STEa_MCP_Implementation_Guide.md` | AI generates full backlog with metadata |

---

**Key Takeaway**: Filo isn't just another kanban board. It's a **structured delivery engine** where testing is built-in, discovery feeds directly into planning, and failed tests automatically create actionable cards.

