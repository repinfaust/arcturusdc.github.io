# Hans Testing Suite: Complete File Reference

## Core Hans Module Files

### Main Pages (User Interface)

#### `/src/app/apps/stea/hans/page.js`
**Purpose:** Hans main dashboard for authenticated users  
**Key Features:**
- Display all test cases in workspace (filtered by tenantId)
- Global stats: Total, Passed, Failed, In Progress, Pass Rate
- App-specific grid (tap to view app-specific page)
- Test case list with filters (by app, by status)
- Expand/collapse test case cards
- Real-time Firestore listeners (onSnapshot)

**Key Components:**
- TestCaseCard: Renders individual test case with full details
- Status update buttons (Open, In Progress, Passed, Failed)
- "Create STEa Card (Fail)" button for closed-loop bug reporting
- "Create STEa Card (Feedback)" button for observations
- Public token display and copy functionality

**Stats Calculated:**
```javascript
stats = {
  total: count of all test cases,
  passed: count where status='passed',
  failed: count where status='failed',
  inProgress: count where status='in_progress',
  passRate: (passed/total)*100
}
```

**Filters:**
- By app (dropdown from available apps)
- By status (Open, In Progress, Passed, Failed)

**Line Count:** 959 lines  
**Dependencies:** Firebase (Firestore, Auth), React hooks, useTenant

---

#### `/src/app/apps/stea/hans/[app]/page.js`
**Purpose:** App-specific testing workspace (filtered view of main dashboard)  
**Key Features:**
- Same layout as main page but filtered to single app
- App name in header with breadcrumb back to Hans main
- Same 5 stats but filtered to app
- Only test cases for that app displayed
- "View in Filo" links back to app-filtered Filo board

**Query Architecture:**
```javascript
where('tenantId', '==', currentTenant.id),
where('app', '==', appName),
orderBy('createdAt', 'desc')
```

**Line Count:** 869 lines  
**Reuses:** Same TestCaseCard component as main page

---

### Public Test Execution Page

#### `/src/app/t/[token]/page.js`
**Purpose:** Public test execution page (accessible without login via token)  
**Key Features:**
- Fetch test case by public token (no authentication required)
- Display user story (preconditions section)
- Display acceptance criteria as interactive checklist
- Display user flow (numbered steps)
- Optional tester information form fields
- Submit results button
- Success confirmation page

**Form Fields (Optional):**
- Tester name
- Email
- Platform (iOS, Android, Web, Desktop)
- Build/Version
- Feedback textarea

**Interactive Behavior:**
- Click acceptance criteria to toggle: unchecked → passed → failed → unchecked
- Progress counter: "X passed · Y failed · Z unchecked"
- Form validation: must check at least one criterion OR provide feedback

**Submission Payload:**
```javascript
{
  token,
  testerName: "Jane Tester" or "Anonymous",
  testerEmail: "optional",
  platform: "iOS" (optional),
  buildVersion: "1.3.0" (optional),
  criteriaResults: [
    { index: 0, status: "passed" },
    { index: 1, status: "failed" }
  ],
  overallStatus: "passed" or "failed",
  feedback: "text"
}
```

**Status States:**
- Loading (fetching test case)
- Loaded (display test case form)
- Error (token expired, not found, etc.)
- Submitted (thank you page)

**Line Count:** 416 lines  
**No Authentication:** Public endpoint

---

### API Endpoints

#### `/src/app/api/hans/createFromCard/route.js`
**Purpose:** Create test case from Filo card  
**HTTP Method:** POST  
**Authentication:** Required (session cookie)

**Request Payload:**
```javascript
{
  cardId: "card_456",
  boardId: "main",
  app: "Tou.Me",
  title: "TC-001: Onboarding",
  description: "...",
  userStory: "As a user...",
  acceptanceCriteria: ["Check 1", "Check 2"],
  userFlow: ["Step 1", "Step 2"],
  priority: "high",
  epicId: "epic_001",
  featureId: "feature_123",
  epicLabel: "Q4 Sprint",
  featureLabel: "Authentication",
  tenantId: "workspace_001"
}
```

**Response (201 Created):**
```javascript
{
  success: true,
  testCaseId: "case_789",
  publicToken: "a1b2c3d4e5f6g7h8",
  publicTokenExpiry: "2025-11-14T14:30:00Z",
  publicUrl: "/t/a1b2c3d4",
  hansUrl: "/apps/stea/hans?case=case_789",
  message: "Test case created. Public link expires in 12 hours."
}
```

**Security Checks:**
1. Verify session cookie (Firebase)
2. Verify card exists in Firestore
3. Verify card's tenantId matches request tenantId
4. Check for duplicate test case (same cardId)

**Side Effects:**
1. Create document in hans_cases collection
2. Generate public token (randomBytes(16).toString('hex'))
3. Set token expiry to 12 hours from now
4. Update source card: testing.testCaseId, testing.publicToken, testing.status='pending'
5. Return response (ignore card update errors)

**Error Responses:**
- 400: Missing required fields (cardId, title, tenantId)
- 401: Not authenticated
- 403: Card doesn't belong to your workspace
- 404: Card not found
- 409: Test case already exists for this card
- 500: Internal server error

**Line Count:** 217 lines  
**Database Writes:** 2 (hans_cases, stea_cards)

---

#### `/src/app/api/hans/getByToken/route.js`
**Purpose:** Fetch test case by public token (for public test page)  
**HTTP Method:** GET  
**Authentication:** None (public endpoint)  
**Rate Limiting:** 100 requests / 15 minutes per client IP

**Query Parameters:**
- token (required): public token string

**Response (200 OK):**
```javascript
{
  success: true,
  testCase: {
    id: "case_789",
    app: "Tou.Me",
    title: "TC-001: Onboarding",
    description: "...",
    userStory: "As a user...",
    acceptanceCriteria: ["Check 1", "Check 2"],
    userFlow: ["Step 1", "Step 2"],
    priority: "high",
    status: "open",
    linkedEpicLabel: "Q4 Sprint",
    linkedFeatureLabel: "Authentication"
  }
}
```

**Stripped Fields (Not Returned):**
- tenantId
- linkedCardId
- createdBy
- publicToken (confirmed via URL token)
- publicTokenExpiry

**Checks:**
1. Rate limit verification
2. Token parameter validation
3. Exact token match in hans_cases
4. Expiry validation (if now > publicTokenExpiry, return 410 Gone)

**Error Responses:**
- 400: Missing token parameter
- 404: Test case not found
- 410: Token has expired (Gone)
- 429: Rate limit exceeded
- 500: Internal server error

**Line Count:** 117 lines  
**Sensitive Operations:** Token expiry check prevents access to expired tests

---

#### `/src/app/api/hans/submitResults/route.js`
**Purpose:** Submit test results from external testers  
**HTTP Method:** POST  
**Authentication:** None (public endpoint)  
**Rate Limiting:** Configurable via RATE_LIMITS.publicTestSubmit

**Request Payload:**
```javascript
{
  token: "public_token",
  testerName: "Jane Tester",
  testerEmail: "jane@example.com",
  platform: "iOS",
  buildVersion: "1.3.0",
  criteriaResults: [
    { index: 0, status: "passed" },
    { index: 1, status: "failed" }
  ],
  overallStatus: "failed",
  feedback: "Description of issues..."
}
```

**Response (201 Created):**
```javascript
{
  success: true,
  submissionId: "sub_123",
  message: "Thank you! Your test results have been submitted."
}
```

**Validation:**
1. Rate limit check
2. Token lookup in hans_cases
3. overallStatus must be 'passed' or 'failed'

**Side Effects (Sequential):**
1. Create submission document in hans_cases/{caseId}/submissions
2. Update test case status: if status='open' → status='in_progress'
3. Fetch all submissions for that test case
4. Calculate pass rate: (passed / total) * 100
5. Update linked Filo card with testing.status, testing.passRate, testing.totalSubmissions
   - Only if card has same tenantId as test case (security check)

**Critical Flow - Submission → Pass Rate Calculation:**
```javascript
// Get all submissions
const allSubmissions = await db
  .collection('hans_cases')
  .doc(testCaseId)
  .collection('submissions')
  .get();

// Calculate
const totalSubmissions = allSubmissions.size;
const passedSubmissions = allSubmissions.docs
  .filter(doc => doc.data().overallStatus === 'passed')
  .length;
const passRate = totalSubmissions > 0
  ? Math.round((passedSubmissions / totalSubmissions) * 100)
  : 0;

// Sync back to Filo card
await cardRef.update({
  'testing.status': overallStatus === 'passed' ? 'passed' : 'needs_attention',
  'testing.lastSubmissionAt': ISO,
  'testing.totalSubmissions': totalSubmissions,
  'testing.passRate': passRate,
});
```

**Error Responses:**
- 400: Missing required fields
- 404: Test case not found
- 429: Rate limit exceeded
- 500: Internal server error

**Line Count:** 174 lines  
**Database Writes:** 3 (submission, hans_cases, stea_cards)  
**Critical Feature:** Automatic sync back to Filo card

---

## Filo Integration

#### `/src/app/apps/stea/filo/page.js` (Excerpt: Lines 2224-2375)
**Component:** SendToHansButton  
**Purpose:** Button in Filo card editor to send card to Hans

**Preconditions (canSend):**
```javascript
const canSend = !sending && !hasTestCase && hasMinimumData && card?.id;
```

Where:
- hasTestCase = card?.testing?.testCaseId exists
- hasMinimumData = hasUserStory || hasAcceptanceCriteria || hasUserFlow
- !sending = not currently in flight

**Card Fields Used:**
- card.id (cardId)
- card.app (app)
- card.title (title)
- card.description (description)
- card.userStory (userStory)
- card.acceptanceCriteria (acceptanceCriteria array)
- card.userFlow (userFlow array)
- card.priority (priority)
- card.epicId (epicId)
- card.featureId (featureId)
- card.tenantId (tenantId - required for security)

**UI States:**
1. Disabled (no minimum data)
2. Ready to send (enabled)
3. Sending (spinner + disabled)
4. Already sent (shows "✅ Test Case Created" link)

**Error Handling:**
- Network errors caught and displayed
- User can retry
- Success message auto-disappears after 3 seconds

**Line Count:** 152 lines  
**Component Type:** Functional React component  
**State Management:** useState for sending, sent, error

---

#### `/Filo/Filo_Hans_SendToHans_Spec.md`
**Purpose:** Integration specification document  
**Content:**
- Overview of Filo + Hans integration
- New fields in card editor (User Story, Acceptance Criteria, User Flow)
- "Send to Hans" button behavior
- Hans data model additions
- Hans UI filters by app
- Test case display in Hans
- Public test page design
- Shared logic and permissions
- Migration checklist
- Example workflow for Tou.Me
- Future enhancements

**Key Specification Details:**
- All three fields (US, AC, UF) saved to stea_cards/{cardId}
- acceptanceCriteria is array of strings
- userFlow is array of strings (steps)
- testing metadata structure on cards

---

## Database Collections Reference

### hans_cases

**Full Document Structure:**
```javascript
{
  // Content fields (from card)
  app: string,
  title: string,
  description: string,
  userStory: string,
  acceptanceCriteria: string[],
  userFlow: string[],
  priority: string, // low, medium, high, critical
  
  // Linkage fields
  linkedCardId: string,
  linkedBoardId: string,
  linkedFeatureId: string,
  linkedEpicId: string,
  linkedEpicLabel: string,
  linkedFeatureLabel: string,
  
  // Public sharing
  publicToken: string, // 32-char hex
  publicTokenExpiry: ISO,
  
  // Test execution state
  status: string, // open, in_progress, passed, failed
  testNotes: string, // Added by tester
  
  // Multi-tenant
  tenantId: string,
  
  // Audit
  createdAt: ISO,
  createdBy: string,
  updatedAt: ISO,
}
```

**Queries:**
- Main dashboard: `where('tenantId') orderBy('createdAt', 'desc')`
- App-specific: `where('tenantId') where('app') orderBy('createdAt', 'desc')`
- By token: `where('publicToken')`

**Indexes:** tenantId, app, createdAt

---

### hans_cases/{caseId}/submissions (Subcollection)

**Document Structure:**
```javascript
{
  testerName: string, // optional, defaults to "Anonymous"
  testerEmail: string | null, // optional
  platform: string | null, // iOS, Android, Web, Desktop
  buildVersion: string | null,
  criteriaResults: Array<{
    index: number,
    status: string // passed, failed
  }>,
  overallStatus: string, // passed, failed
  feedback: string,
  submittedAt: ISO,
}
```

**Access Pattern:**
- Get all submissions: `db.collection('hans_cases').doc(caseId).collection('submissions').get()`

---

## Key Functions & Utilities

### Authentication & Authorization

**verifyAuth (createFromCard/route.js:10-32)**
- Extracts session cookie
- Calls Firebase auth.verifySessionCookie
- Returns authenticated, uid, email

**Multi-Tenant Checks:**
- Frontend: useTenant context provides currentTenant.id
- API: Verify cardDoc.data().tenantId === requestTenantId
- Firestore: All queries include tenantId where clause

---

### Token Generation

**generatePublicToken (createFromCard/route.js:37-39)**
```javascript
function generatePublicToken() {
  return randomBytes(16).toString('hex'); // 32 character hex string
}
```

**Expiry Calculation:**
```javascript
const expiryDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
```

---

### Pass Rate Calculation

**Pattern (submitResults/route.js:124-136):**
```javascript
const allSubmissions = await db
  .collection('hans_cases')
  .doc(testCaseId)
  .collection('submissions')
  .get();

const totalSubmissions = allSubmissions.size;
const passedSubmissions = allSubmissions.docs
  .filter(doc => doc.data().overallStatus === 'passed')
  .length;
const passRate = totalSubmissions > 0
  ? Math.round((passedSubmissions / totalSubmissions) * 100)
  : 0;
```

---

### Test Case Card Component (page.js:668-958)

**Props:**
- testCase: object (full test case document)
- expanded: boolean
- onToggleExpand: callback
- onCreateFailCard: callback
- onCreateFeedbackCard: callback

**Internal State:**
- updating: boolean
- criteriaStatus: object (map of index → checked)
- testNotes: string

**Key Methods:**
- handleStatusChange: Updates status in Firestore
- handleSaveNotes: Updates testNotes in Firestore
- toggleCriteria: Local state toggle (UI only, not persisted)

---

## File Statistics

| File | Lines | Purpose |
|------|-------|---------|
| hans/page.js | 959 | Main dashboard |
| hans/[app]/page.js | 869 | App-specific dashboard |
| t/[token]/page.js | 416 | Public test page |
| api/hans/createFromCard/route.js | 217 | Create test API |
| api/hans/getByToken/route.js | 117 | Public fetch API |
| api/hans/submitResults/route.js | 174 | Submission API |
| filo/page.js (SendToHansButton) | 152 | Filo integration |

**Total Hans-Specific Code:** ~2,904 lines

---

## Environment & Dependencies

### Firebase Services Used
- firestore: collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp
- auth: onAuthStateChanged
- storage: (reserved for future file uploads)

### React Features
- useState: Local component state
- useEffect: Lifecycle management and subscriptions
- useMemo: Memo optimization
- useRouter: Navigation
- useParams: Dynamic route parameters
- useSearchParams: Query string parameters

### Context & Custom Hooks
- useTenant: TenantContext for multi-tenant operations
- usePersistentState: localStorage-backed state (in Filo)

### Rate Limiting Library
- checkRateLimit: Custom rate limiter (from @/lib/rateLimit)
- getClientIdentifier: IP + User-Agent hashing

---

## Configuration Constants

### Status Options (page.js:14-19)
```javascript
[
  { value: 'open', label: 'Open', color: 'bg-gray-100...' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100...' },
  { value: 'passed', label: 'Passed', color: 'bg-green-100...' },
  { value: 'failed', label: 'Failed', color: 'bg-red-100...' },
]
```

### Priority Colors (page.js:21-26)
```javascript
{
  low: 'bg-gray-100...',
  medium: 'bg-yellow-100...',
  high: 'bg-orange-100...',
  critical: 'bg-red-100...',
}
```

---

## File Absolute Paths

```
/Users/davidloake/arcturusdc.github.io/src/app/apps/stea/hans/page.js
/Users/davidloake/arcturusdc.github.io/src/app/apps/stea/hans/[app]/page.js
/Users/davidloake/arcturusdc.github.io/src/app/api/hans/createFromCard/route.js
/Users/davidloake/arcturusdc.github.io/src/app/api/hans/getByToken/route.js
/Users/davidloake/arcturusdc.github.io/src/app/api/hans/submitResults/route.js
/Users/davidloake/arcturusdc.github.io/src/app/t/[token]/page.js
/Users/davidloake/arcturusdc.github.io/src/app/apps/stea/filo/page.js (SendToHansButton at lines 2224-2375)
/Users/davidloake/arcturusdc.github.io/Filo/Filo_Hans_SendToHans_Spec.md
```

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Author:** Code Analysis System

