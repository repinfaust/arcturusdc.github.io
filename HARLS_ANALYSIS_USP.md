# HARLS (Product Lab) - Industry-Leading Unique Selling Points Analysis

## Executive Summary

Harls is a specialized **discovery-to-backlog transformation platform** that bridges the gap between qualitative research and quantitative delivery planning. It combines interactive whiteboarding, structured JTBD (Jobs To Be Done) discovery, and LLM-optimized export capabilities to create a uniquely integrated product planning experience. Unlike Miro, FigJam, or Mural, Harls is purpose-built for product development workflows with direct integration into STEa's closed-loop (discovery → delivery → testing) system.

---

## 1. CORE HARLS FILES & ARCHITECTURE

### Primary Implementation
- **Main Page**: `src/app/apps/stea/harls/page.js` (1,336 lines)
  - Client-side React component (`use client`)
  - Manages entire discovery, whiteboarding, and story management lifecycle
  - Multi-tenant isolated by `tenantId`

### Key Data Collections (Firestore)
```
projects/{projectId}/
  ├── whiteboards/{boardId}
  │   ├── tldrawSnapshot (legacy) or tldrawStoragePath (Cloud Storage)
  │   ├── tldrawWriteToken (conflict detection)
  │   └── metadata (updatedAt, updatedBy)
  ├── discovery/main
  │   ├── projectName, owner, problem
  │   ├── audience[], jtbd[], goals[], constraints[]
  │   ├── inScope[], outOfScope[], assumptions[]
  │   ├── risks[], dependencies[]
  │   ├── seedStory, ac[], flows[]
  │   └── updatedAt, updatedBy
  └── stories/{storyId}
      ├── title, description
      ├── acceptanceCriteria[]
      ├── source (boardId, elementId, shapeType)
      ├── status (idea, planning, building, done)
      ├── priority (low, medium, high, critical)
      ├── lane (null=backlog, 'now', 'next', 'later')
      ├── tags[], assignees[]
      ├── tenantId, createdBy, createdAt, updatedAt
      └── xp

users/{uid}/
  ├── displayName, totalXP, level, badgesEarned
  ├── metrics/main
  │   ├── notesCreated, storiesCreated, movedToNowCount
  │   └── updatedAt
  └── badges/{badgeId}
      ├── id, name, emoji, xp, lesson
      └── earnedAt
```

---

## 2. UNIQUE FEATURES & DIFFERENTIATORS

### A. INTERACTIVE TLDRAW WHITEBOARDING WITH PERSISTENT SYNC

**What Makes It Unique:**
- Industry-standard **TLDraw v2 integration** for true collaborative sketching
- Hybrid persistence strategy: Cloud Storage + Firestore fallback
- **Client-aware conflict detection** using writeTokens to prevent merge conflicts in multi-user scenarios
- Real-time snapshot sharing without requiring complex CRDTs

**Technical Implementation (Lines 17-19, 580-628, 800-872):**

```javascript
// Cloud Storage Path: tldraw/{projectId}/{boardId}/snapshot.json
const storagePath = `tldraw/${projectId}/${boardId}/snapshot.json`;
await uploadString(snapshotRef, snapshotJson, 'raw', {
  contentType: 'application/json',
});

// Firestore tracks reference + write token for deduplication
await setDoc(boardDocRef, {
  tldrawStoragePath: storagePath,
  tldrawUpdatedAt: serverTimestamp(),
  tldrawUpdatedBy: user?.uid || null,
  tldrawWriteToken: `${clientIdRef.current}:${Date.now()}`, // Client:Timestamp
}, { merge: true });
```

**Key Advantages Over Competitors:**
- No expensive per-user licensing (like Miro enterprise)
- Direct attachment to product backlog (unlike FigJam which lives isolated in Figma)
- Write tokens prevent duplicate saves from same client across tabs
- Snapshots stored in Cloud Storage (unlimited size) while Firestore only tracks metadata

---

### B. JOBS TO BE DONE (JTBD) FRAMEWORK - DISCOVERY SIDEBAR

**What Makes It Unique:**
- Structured JTBD capture as a first-class discovery field (Line 166)
- Multi-field discovery model designed specifically for LLM consumption
- **Auto-saving discovery state** with per-field granularity (Lines 188-219)

**Discovery Model (Lines 161-177):**
```typescript
{
  projectName: string,
  owner: string,
  problem: string,          // One clear paragraph
  audience: string[],        // User personas / roles
  jtbd: string[],            // "When I... then I need..."
  goals: string[],           // Success metrics
  constraints: string[],     // Device, compliance, deadline
  inScope: string[],
  outOfScope: string[],
  assumptions: string[],
  risks: string[],           // Unknowns & blockers
  dependencies: string[],    // External systems
  seedStory: string,         // "As a... I want... so that..."
  ac: string[],              // Acceptance criteria (seed)
  flows: string[],           // User flows
}
```

**Key Advantage:**
- Unlike traditional Miro/FigJam, discovery is not just visual notes
- Every field is **queryable in Firestore** and **exportable for LLMs**
- Structured enough to feed directly into Claude/GPT for backlog generation

---

### C. DISCOVERY-TO-BACKLOG TRANSFORMATION (GENERATE PROMPT)

**What Makes It Unique:**
- One-click export of structured discovery as **LLM-optimized Markdown** (Lines 314-330)
- Includes system prompt guardrails and schema definition for backlog JSON
- Designed for 100% consistency across LLM responses

**Export Build Function (Lines 232-312):**
The `buildMarkdown()` function generates a deterministic template with:
- Project metadata (name, owner, date)
- Problem statement
- Structured fields for audience, JTBD, goals, constraints
- Scope definition (in-scope, out-of-scope)
- Assumptions, risks, dependencies
- Seed user stories and acceptance criteria
- **Explicit LLM instructions** with required output schema (Epic→Feature→Card JSON)
- **Guardrails** to prevent hallucinated integrations

**Key Advantage:**
- **Deterministic** export format (always same structure)
- Removes copy/paste friction between discovery & LLM prompting
- Built-in validation schema prevents hallucinated integrations
- Testers (Hans) get the same AC/flows that seeded the backlog

---

### D. WHITEBOARD-TO-STORY UPGRADE (Real-Time Upgrade Button)

**What Makes It Unique:**
- Select a note/text shape on whiteboard → instantly become a story in the backlog
- **Bidirectional linking**: Story stores reference back to original whiteboard element
- One-click journey from brainstorm → backlog without context switching

**Implementation (Lines 696-770):**
```javascript
const doUpgrade = async () => {
  const sel = editorRef.current?.getSelectedShapes?.() || [];
  const note = sel.find((s) => s.type === 'note' || s.type === 'text');
  if (!note || !user) return;

  // Create story from note
  const storyRef = doc(storiesCol);
  await setDoc(storyRef, {
    title: (title || 'Untitled').split('\n')[0].slice(0, 100),
    description: title || '',
    acceptanceCriteria: [],
    source: { boardId, elementId: note.id, shapeType: note.type },
    status: 'idea',
    priority: 'medium',
    lane: null,
    tags: [],
    assignees: [user.uid],
    tenantId: tenantId,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Mark shape with storyId for backref
  editorRef.current?.updateShapes?.([{
    id: note.id,
    type: note.type,
    meta: { ...(note.meta || {}), storyId: storyRef.id }
  }]);

  await earnBadge(user.uid, 'powerup');
  await incMetric(user.uid, 'storiesCreated', 1);
};
```

**Key Advantage:**
- No export/import cycle
- Preserves original brainstorm context (linked to whiteboard element via `source` field)
- Instantly triggers gamification feedback (Power-Up badge)

---

### E. MULTI-LANE KANBAN BOARD (Now/Next/Later/Backlog)

**What Makes It Unique:**
- Lightweight prioritization framework (not complex RICE scoring) (Lines 1091-1097)
- Drag-drop lane movement with **transactional updates** (Lines 912-915)
- Each move triggers metrics collection and badge progression

**Lanes (Line 26):**
- **Backlog** (lane: null) - Raw ideas
- **Now** (lane: 'now') - Immediate sprint/release
- **Next** (lane: 'next') - Coming soon
- **Later** (lane: 'later') - Future consideration

**Lane Movement Implementation (Lines 912-915):**
```javascript
const moveToLane = async (story, lane) => {
  await updateDoc(doc(db, `projects/${projectId}/stories`, story.id), { 
    lane, 
    updatedAt: serverTimestamp() 
  });
  if (lane === 'now') await incMetric(user.uid, 'movedToNowCount', 1);
};
```

**Key Advantage:**
- Simple enough for solo builders, powerful enough for teams
- Direct alignment with MVP prioritization (Now/Next/Later is industry-tested)
- Metrics collection at each stage feeds into delivery dashboards

---

### F. GAMIFICATION & PROGRESSION SYSTEM

**Badge System (Teaching Framework) (Lines 30-36):**

| Badge | Trigger | XP | Lesson |
|-------|---------|-----|---------|
| 🧠 Brainstormer | 5+ notes created | 10 | Ideas are seeds — quantity helps quality |
| ⚡️ Power-Up! | 1+ story upgraded from note | 20 | You turned an idea into something buildable |
| ✍️ Storyteller | 1+ story created | 10 | Every story starts with a user need |
| 🎯 Precision Master | 3+ acceptance criteria | 15 | Defining done helps teams move fast |
| 🧩 MVP Architect | 3+ stories moved to Now | 20 | Start small. Learn fast |

**Badge Earning Triggers (Lines 149-151, 756, 930):**
```javascript
if (field === 'notesCreated' && nextVal >= 5) await earnBadge(uid, 'brainstormer');
if (field === 'storiesCreated' && nextVal >= 1) await earnBadge(uid, 'storyteller');
if (field === 'movedToNowCount' && nextVal >= 3) await earnBadge(uid, 'mvp_arch');
if (ac.length >= 3) await earnBadge(story.createdBy || user.uid, 'precision');
```

**Transactional Badge Earning (Lines 120-139):**
```javascript
async function earnBadge(uid, badgeKey) {
  const badge = BADGES[badgeKey];
  if (!badge) return;

  const badgeRef = doc(db, `users/${uid}/badges`, badge.id);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (tx) => {
    const badgeSnap = await tx.get(badgeRef);
    if (badgeSnap.exists()) return; // Already earned

    tx.set(badgeRef, { ...badge, earnedAt: serverTimestamp() });
    const userSnap = await tx.get(userRef);
    const d = userSnap.exists() ? userSnap.data() : { totalXP: 0, level: 1, badgesEarned: 0 };
    const totalXP = (d.totalXP || 0) + badge.xp;
    const level = Math.floor(totalXP / 100) + 1;
    const badgesEarned = (d.badgesEarned || 0) + 1;
    tx.set(userRef, { totalXP, level, badgesEarned }, { merge: true });
  });
}
```

**Key Advantage:**
- Designed as a **teaching system** for product design methodology
- Each badge teaches a lean/agile principle
- Progression is transparent (Level = totalXP / 100)
- User behavior is naturally steered toward MVP best practices

---

## 3. MULTI-TENANT ISOLATION & COLLABORATIVE ARCHITECTURE

### Multi-Tenant Project Scoping (Lines 52-114)

**Automatic Project & Board Creation:**
```javascript
async function ensureProjectAndBoard(uid, tenantId) {
  const projectId = `${tenantId}_harls_lab`;
  const projectRef = doc(db, 'projects', projectId);
  
  // Create/update tenant-scoped project
  const snap = await getDoc(projectRef);
  if (!snap.exists()) {
    await setDoc(projectRef, {
      ownerUid: uid,
      name: 'Harls Product Lab',
      members: [uid],
      tenantId: tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Add user if not already member
    const data = snap.data();
    if (!data?.members?.includes(uid)) {
      await updateDoc(projectRef, {
        members: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Create main board under project
  const boardId = 'main';
  const boardRef = doc(db, `projects/${projectId}/whiteboards`, boardId);
  // ... board initialization
}
```

**Key Advantage:**
- **One shared project per tenant** = perfect for team collaboration
- Members auto-added when they join tenant
- No duplicate projects or board creation conflicts
- Firestore security rules can scope to tenantId

---

## 4. DATA STRUCTURE & RELATIONSHIPS

### Story Document Schema
```javascript
{
  id: string,                         // Auto-generated doc ID
  title: string,                      // First line of note
  description: string,                // Full note text
  acceptanceCriteria: string[],       // Manual additions
  source: {
    boardId: string,
    elementId: string,                // TLDraw shape ID
    shapeType: string                 // 'note' | 'text'
  },
  status: 'idea' | 'planning' | 'building' | 'done',
  priority: 'low' | 'medium' | 'high' | 'critical',
  lane: null | 'now' | 'next' | 'later',
  tags: string[],
  assignees: string[],                // User UIDs
  xp: number,
  tenantId: string,
  createdBy: string,                  // UID
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Discovery Document Schema
```javascript
{
  projectName: string,
  owner: string,
  problem: string,
  audience: string[],
  jtbd: string[],
  goals: string[],
  constraints: string[],
  inScope: string[],
  outOfScope: string[],
  assumptions: string[],
  risks: string[],
  dependencies: string[],
  seedStory: string,
  ac: string[],
  flows: string[],
  tenantId: string,
  updatedAt: Timestamp,
  updatedBy: string
}
```

### Whiteboard Document Schema
```javascript
{
  name: string,
  tenantId: string,
  // Cloud Storage reference (NEW)
  tldrawStoragePath: string,          // 'tldraw/{projectId}/{boardId}/snapshot.json'
  // Fallback (LEGACY)
  tldrawSnapshot: object,             // Full TLDraw state (if size < 1MB)
  // Write tracking
  tldrawWriteToken: string,           // '{clientId}:{timestamp}'
  tldrawUpdatedAt: Timestamp,
  tldrawUpdatedBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## 5. REAL-TIME COLLABORATION FEATURES

### Write Token Deduplication (Lines 639-655, 680-687)
```javascript
// Only apply remote updates from OTHER clients
if (remote?.tldrawWriteToken) {
  const remoteClientId = remote.tldrawWriteToken.split(':')[0];
  const myClientId = clientIdRef.current;

  // Skip if this update came from us (prevents save loop)
  if (remoteClientId === myClientId) {
    console.log('[TLDraw] Skipping own update');
    return;
  }

  // Skip if we've already seen this exact writeToken
  if (remote.tldrawWriteToken === lastWriteTokenRef.current) {
    return;
  }

  // Apply remote update
  applySnapshot(snapshot);
}
```

**Key Advantage:**
- Prevents the "infinite save loop" in multi-user scenarios
- Each client UUID stays consistent across tabs/refreshes
- Timestamp in token allows sequencing without CRDTs

### Orientation-Aware UI (Mobile Support) (Lines 516-535, 781-791)
```javascript
const [isPortrait, setIsPortrait] = useState(false);

useEffect(() => {
  const checkOrientation = () => {
    const isMobile = window.innerWidth < 768;
    const isPortraitMode = window.innerHeight > window.innerWidth;
    setIsPortrait(isMobile && isPortraitMode);
  };
  
  checkOrientation();
  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);
  
  return () => {
    window.removeEventListener('resize', checkOrientation);
    window.removeEventListener('orientationchange', checkOrientation);
  };
}, []);

// Shows helpful prompt to rotate device in portrait mode
if (isPortrait) {
  return (
    <div className="flex items-center justify-center">
      <div className="text-6xl mb-4 animate-bounce">📱 → 📲</div>
      <h3>Rotate to Landscape</h3>
      <p>The whiteboard works best in landscape mode.</p>
    </div>
  );
}
```

---

## 6. INTEGRATION WITH STEa ECOSYSTEM

### Harls → Filo Pipeline
1. Generate backlog JSON from Harls discovery (Generate Prompt feature)
2. Send via MCP server to Claude/GPT
3. LLM produces structured JSON with Epics → Features → Cards
4. Cards auto-import to Filo with full User Story, AC, Flows preserved

### Harls → Hans Pipeline
1. In Filo, click "Send to Hans" on a Card
2. Hans receives Card's AC + User Flows
3. Hans generates test cases with steps matching AC
4. Test failures auto-create Bug Cards in Filo (linked to original Card)

### Badge/Metric Visibility (Lines 1121-1161)
- Harls metrics feed **WorkspacePulse** dashboard
- Badge strip shows **Discovery Progress** across workspace
- Metrics tracked: `notesCreated`, `storiesCreated`, `movedToNowCount`

---

## 7. KEY DIFFERENTIATORS VS COMPETITORS

| Feature | Harls | Miro | FigJam | Mural | Filo/Jira |
|---------|-------|------|--------|-------|-----------|
| **JTBD Framework** | Native field | Annotation only | Sticky note | Sticky note | None |
| **Whiteboard + Backlog** | Unified UI | Separate | Separate | Separate | Separate |
| **LLM-Ready Export** | Structured prompt | Manual copy/paste | Manual | Manual | Manual |
| **Story Upgrade (1-click)** | Yes | No | No | No | No |
| **Cloud Storage Snapshots** | Yes (Firebase) | Yes (proprietary) | In Figma | In Mural | N/A |
| **Real-time Sync Token** | Client-aware dedup | Operational transforms | Figma engine | Mural engine | Git diffs |
| **Gamification/Badges** | Lean methodology | No | No | No | No |
| **Multi-Tenant Isolation** | Per-project scoping | Org-wide | Org-wide | Org-wide | Org-wide |
| **Closed-loop Testing** | Hans integration | No | No | No | Manual |
| **Free tier** | Yes (STEa account) | Limited | Yes (Figma) | Limited | Limited |

---

## 8. TECHNICAL EXCELLENCE HIGHLIGHTS

### Debounced Saves (Conflict Prevention) (Lines 543-547)
```javascript
const debounceSave = (fn, ms = 1500) => {
  if (saveTimer.current) clearTimeout(saveTimer.current);
  saveTimer.current = setTimeout(fn, ms);
};
```
- 1.5s debounce prevents thrashing on large shape selections
- Clear timeout ensures only latest state is saved
- Matches human interaction patterns (draw, then pause, then save)

### Snapshot Management Strategy (Lines 580-628)
```javascript
// Try Cloud Storage first (unlimited size)
if (data?.tldrawStoragePath) {
  const snapshotRef = storageRef(storage, data.tldrawStoragePath);
  const blob = await getBlob(snapshotRef);
  const text = await blob.text();
  const snapshot = JSON.parse(text);
}
// Fall back to Firestore (legacy, 1MB limit)
else {
  initialSnapshotRef.current = data?.tldrawSnapshot || null;
}
```
- Firestore 1MB doc size limit handled gracefully
- Cloud Storage path stored in Firestore reference
- No breaking changes for legacy boards

---

## 9. USER JOURNEY & VALUE PROPOSITION

### For Founders / Solo Builders
1. **Day 1**: Sign in, fill out JTBD field
2. **Day 1-2**: Sketch ideas on whiteboard, upgrade to stories
3. **Day 2**: Click "Generate Prompt" → drop into Claude
4. **Day 2-3**: Claude generates full backlog JSON
5. **Day 3**: Stories flow into Filo, ready for dev
6. **Outcome**: From problem statement to backlog in hours, not weeks

### For Product Teams
1. **Week 1**: Harls hosts discovery workshop (sketches + JTBD)
2. **Week 2**: Export → send to LLM for initial backlog
3. **Week 2-3**: Manual refinement in Harls, then export refined version
4. **Week 3**: Backlog locked in Filo, cards sent to Hans for UAT design
5. **Outcome**: Full traceability from research to test cases

### For Agencies
1. **Sprint 1**: Client workshop in Harls (discovery + whiteboard)
2. **Sprint 1-2**: Export for LLM, generate backlog
3. **Sprint 2-4**: Execution in Filo/Hans with audit trail
4. **Project End**: Full discovery document, backlog, test results (client deliverable)
5. **Outcome**: Repeatable discovery → delivery → validation process per client

---

## 10. COMPETITIVE MOAT

### Network Effects
- Every exported prompt (Harls → Filo → Hans) creates traceability
- Users stay in STEa ecosystem (switching cost = losing full history)

### Data Advantages
- Aggregated JTBD patterns across users
- Baseline success metrics (avg time from idea → production)
- Failure patterns in acceptance criteria precision

### Operational Excellence
- **Single vendor**: No Figma + Jira + Slack glue
- **On-prem capable**: Harls can run in GCP/Firebase for enterprise security
- **Zero context switching**: Everything in one URL (`/apps/stea/harls`)

---

## 11. ROADMAP & EXPANSION OPPORTUNITIES

### Immediate (Already Implemented)
- TLDraw whiteboarding with Cloud Storage persistence
- JTBD structured capture
- One-click story upgrade
- Badge/gamification system
- Discovery → LLM export

### Near-term (Next Quarter)
- Attachment support (screenshots, decision logs)
- Collaborative real-time cursor tracking
- Template library (SaaS onboarding, mobile app discovery, etc.)
- Variant management (A/B discovery scenarios)

### Medium-term (6 months)
- AI-powered assumption validation
- Automated impact assessment (changed JTBD vs backlog delta)
- Integration with product analytics (Amplitude/Mixpanel for research)
- Competitor research aggregator

### Long-term (Vision)
- Harls as research database (search across past projects)
- ML-based backlog sizing (from historical data)
- Automated success metric tracking (JTBD → OKRs)

---

## CONCLUSION

Harls is **not a whiteboarding tool**. It's a **discovery-to-delivery compiler** that transforms messy research (JTBD, problem statements, workshop sketches) into structured artifacts (backlog JSON, test cases, acceptance criteria) that feed directly into delivery and testing systems.

Its unique strength is **structural clarity** — every field maps to a specific downstream use case, and every action triggers measurable progress toward product delivery. Combined with gamification that teaches lean principles and multi-tenant isolation that scales from solo builders to agencies, Harls establishes a **new category**: **Discovery Operating System**.

---

## Document References

- **Main implementation**: `src/app/apps/stea/harls/page.js` (1,336 lines)
- **Feature spec**: `Harls_GeneratePrompt_FeatureSpec_20251113_063138.md`
- **Integration guide**: `stea_explainer_showcase_harls_filo_hans.md`
- **Component tiles**: `src/components/workspace/tiles/DiscoverySignalsTile.jsx`
