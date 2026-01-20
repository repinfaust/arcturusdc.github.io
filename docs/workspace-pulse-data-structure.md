# Workspace Pulse Dashboard - Firestore Data Structure

## Collection Path

```
/tenants/{tenantId}/dashboard/metrics
```

## Document Structure

### Main Metrics Document

```typescript
{
  // Build Progress (from Filo)
  buildProgress: {
    apps: [
      {
        name: string;              // App name (e.g., "SyncFit")
        appId?: string;            // Optional app identifier
        progress: number;          // Overall completion percentage (0-100)
        epicsComplete: number;     // Number of completed epics
        epicsTotal: number;        // Total number of epics
        featuresInProgress: number; // Number of features currently in development
        featuresTotal: number;     // Total number of features
        bugsOpen: number;          // Number of open bugs
        lastActivity: Timestamp;   // Last activity timestamp
      }
    ];
  };

  // Testing Snapshot (from Hans)
  testingSnapshot: {
    pass: number;                  // Number of passing tests
    fail: number;                  // Number of failing tests
    awaitingRetest: number;        // Number of tests awaiting retest
    coverage: number;              // Test coverage percentage (0-100)
    lastUpdated?: Timestamp;       // Last test run timestamp
  };

  // Backlog Health (from Filo)
  backlogHealth: {
    ready: number;                 // Number of cards ready for development
    inDevelopment: number;         // Number of cards in development
    blocked: number;               // Number of blocked cards
    bugsOpen: number;              // Number of open bugs
    cycleTime: number;             // Average cycle time in days (7-day rolling average)
    lastUpdated?: Timestamp;       // Last calculation timestamp
  };

  // Discovery Signals (from Harls)
  discoverySignals: {
    newNotes: number;              // Number of new discovery notes
    jtbdDrafts: number;            // Number of JTBD drafts not promoted
    coverage: number;              // Discovery coverage percentage (0-100)
    lastUpdated?: Timestamp;       // Last calculation timestamp
  };

  // Documentation Activity (from Ruby)
  documentationActivity: {
    newDocs: number;               // Number of new documents
    updatedThisWeek: number;       // Number of documents updated this week
    linkedPercentage: number;      // Percentage of docs linked to cards (0-100)
    lastUpdated?: Timestamp;       // Last calculation timestamp
  };

  // Overall metadata
  lastUpdated: Timestamp;          // Last time any metric was updated
  version: number;                 // Schema version for future migrations
}
```

## Security Rules

- **Read**: Any authenticated user with access to the tenant
- **Write**: Currently restricted to super admins only
- Future: Will be expanded to allow Cloud Functions/scheduled jobs to update metrics

## Data Sources

### 1. Build Progress
**Collections queried:**
- `stea_epics` (filtered by `tenantId` and `app`)
- `stea_features` (filtered by `tenantId` and `app`)
- `stea_cards` (filtered by `tenantId`, `app`, and `labels` containing "bug")

**Calculation logic:**
```javascript
// Per app:
- epicsComplete = count(epics where status === 'Done')
- epicsTotal = count(all epics)
- featuresInProgress = count(features where status === 'In Progress')
- featuresTotal = count(all features)
- bugsOpen = count(cards where labels.includes('bug') && status !== 'Done')
- progress = (epicsComplete / epicsTotal) * 100
- lastActivity = max(epic.updatedAt, feature.updatedAt, card.updatedAt)
```

### 2. Testing Snapshot
**Collections queried:**
- `hans_cases` (filtered by `tenantId`)
- `automated_test_runs` (latest run, filtered by `tenantId`)

**Calculation logic:**
```javascript
- pass = count(hans_cases where lastStatus === 'pass')
- fail = count(hans_cases where lastStatus === 'fail')
- awaitingRetest = count(hans_cases where needsRetest === true)
- coverage = (pass / (pass + fail + awaitingRetest)) * 100
```

### 3. Backlog Health
**Collections queried:**
- `stea_cards` (filtered by `tenantId`)

**Calculation logic:**
```javascript
- ready = count(cards where column === 'Ready' or status === 'Ready')
- inDevelopment = count(cards where column === 'In Development')
- blocked = count(cards where blocked === true or labels.includes('blocked'))
- bugsOpen = count(cards where labels.includes('bug') && status !== 'Done')
- cycleTime = average(cards completed in last 7 days: completedAt - startedAt)
```

### 4. Discovery Signals
**Collections queried:**
- `projects` (Harls projects filtered by `tenantId`)
- Project subcollections: `discovery`, `jobs`

**Calculation logic:**
```javascript
- newNotes = count(discovery docs created in last 7 days)
- jtbdDrafts = count(jobs where status === 'draft' && !promotedToFeature)
- coverage = (count of features with linked discovery) / (total features) * 100
```

### 5. Documentation Activity
**Collections queried:**
- `stea_docs` (filtered by `tenantId`)
- `stea_doc_links` (for linkage metrics)

**Calculation logic:**
```javascript
- newDocs = count(docs created in last 7 days)
- updatedThisWeek = count(docs updated in last 7 days)
- linkedPercentage = (count(docs with cardId) / total docs) * 100
```

## Update Strategy

### Phase 1: Manual Updates (Current)
- Super admin can manually trigger dashboard recalculation
- Updated via admin panel or direct Firestore write

### Phase 2: Scheduled Updates (Recommended)
- Cloud Function scheduled to run every 5-15 minutes
- Calculates all metrics and updates dashboard document
- Uses batched reads for efficiency

### Phase 3: Real-time Triggers (Future)
- Cloud Functions triggered on writes to source collections
- Incremental updates to dashboard metrics
- More complex but provides instant feedback

## Example Document

```json
{
  "buildProgress": {
    "apps": [
      {
        "name": "SyncFit",
        "progress": 62,
        "epicsComplete": 3,
        "epicsTotal": 5,
        "featuresInProgress": 12,
        "featuresTotal": 27,
        "bugsOpen": 4,
        "lastActivity": "2025-01-10T14:30:00Z"
      }
    ]
  },
  "testingSnapshot": {
    "pass": 23,
    "fail": 5,
    "awaitingRetest": 2,
    "coverage": 76
  },
  "backlogHealth": {
    "ready": 14,
    "inDevelopment": 9,
    "blocked": 2,
    "bugsOpen": 7,
    "cycleTime": 2.9
  },
  "discoverySignals": {
    "newNotes": 3,
    "jtbdDrafts": 2,
    "coverage": 64
  },
  "documentationActivity": {
    "newDocs": 1,
    "updatedThisWeek": 3,
    "linkedPercentage": 92
  },
  "lastUpdated": "2025-01-10T15:00:00Z",
  "version": 1
}
```

## Migration Notes

- Initial version uses mock data in WorkspacePulse component
- Real data integration requires implementing aggregation functions
- Consider using Cloud Functions for backend aggregation
- Alternatively, could use Cloud Scheduler + Cloud Run for scheduled jobs
