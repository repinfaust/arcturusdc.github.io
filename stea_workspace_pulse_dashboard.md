# STEa Workspace Pulse Dashboard — Specification

A unified, lightweight dashboard section displayed on the STEa Home screen, giving a high-level overview of workspace health across all apps and modules (Harls, Filo, Hans, Ruby, Auto Product).

---

## 1. Objective

Provide users with an at-a-glance status overview that answers the core Product Hunt question:

**“Does it integrate all these tools into one dashboard?”**

The Workspace Pulse does not replace Harls/Filo/Hans dashboards — it complements them by surfacing global signals.

---

## 2. Placement on Home Screen

The Pulse dashboard appears **beneath the existing module cards**:

```
STEa Workspace Header
Module Cards (Harls, Auto Product, Filo, Hans, Ruby, Automated Tests, Explore STEa)
---------------------------------------------------------------------------
Workspace Pulse  ← NEW SECTION
(3–5 compact metric tiles)
```

Each tile is clickable and deep-links into the relevant module.

---

## 3. Dashboard Tiles

The Pulse consists of **3–5 rounded tiles**, small, light, and visually aligned with the existing STEa card style (soft gradients, subtle borders, rounded corners).

### 3.1 Build Progress (per App)
Shows delivery progress for each app within the workspace.

**Example:**
- **SyncFit — 62% complete**
  - Epics complete: 3/5  
  - Features in progress: 12/27  
  - Bugs open: 4  
  - Last activity: 2 hours ago  

---

### 3.2 Testing Snapshot (Hans)
High-level view of test health and release readiness.

**Example:**
- Pass: 23  
- Fail: 5  
- Awaiting Retest: 2  
- Coverage: 76%

---

### 3.3 Backlog Health (Filo)
A concise summary of delivery flow and current workload.

**Example:**
- Ready: 14  
- In Development: 9  
- Blocked: 2  
- Bugs Open: 7  
- Cycle Time (7-day avg): 2.9 days

---

### 3.4 Discovery Signals (Harls)
Indicates whether enough validated discovery exists for upcoming work.

**Example:**
- New notes: 3  
- JTBD drafts not promoted: 2  
- Discovery coverage: 64%

---

### 3.5 Documentation Activity (Ruby)
A quick pulse of documentation hygiene.

**Example:**
- New docs: 1  
- Updated this week: 3  
- Linked to cards: 92%

---

## 4. Design Guidelines

- Tile size slightly smaller than module cards  
- Soft gradients mapped to the module colour palette  
- Hover = slight elevation + highlight border  
- Click = deep-link into relevant module with filters pre-applied  

---

## 5. Implementation Plan

### Step 1: Define Aggregated Data  
Stored in Firestore:

```
/workspaces/{workspaceId}/dashboard
    buildProgress: { ... }
    testingSnapshot: { ... }
    backlogHealth: { ... }
    discoverySignals: { ... }
    documentationActivity: { ... }
```

---

### Step 2: Create `<WorkspacePulse />` Component  
- Grid layout: 3–5 tiles wide  
- Lazy loaded beneath module cards  

---

### Step 3: Deep Linking  
- Build Progress → `/stea/filo?app={id}`
- Testing Snapshot → `/stea/hans?filter=failing`
- Backlog Health → `/stea/filo?filter=blocked`
- Discovery Signals → `/stea/harls`
- Documentation Activity → `/stea/ruby?filter=recent`

---

## 6. Future Enhancements

- Per-user metrics  
- Workspace velocity  
- Automated risk flags  
- Export as PNG/PDF  

---

## 7. Summary

The Workspace Pulse turns the STEa Home screen into a unified command centre that answers:

- *How healthy is my build?*  
- *What needs my attention?*  
- *Where are we in the loop?*

