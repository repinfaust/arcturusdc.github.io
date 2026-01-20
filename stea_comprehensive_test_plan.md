# STEa Comprehensive Test Plan
## Recent Changes & Testing Requirements

Last Updated: 2025-11-14

---

## SECTION 1: RUBY DOCUMENTATION CHANGES

### 1.1 Overview
Ruby is STEa's documentation module enabling users to:
- Create organized documentation spaces
- Write rich-text documents with TipTap editor
- Link documents to epics, features, cards, and tests
- Upload and manage assets (images, PDFs, files)
- Track documentation activity in Workspace Pulse

**Key Features Implemented:**
- Multi-space document organization
- Rich text editor with slash commands
- Bidirectional DocLink graph system (R3)
- Asset management with drag-drop uploads (R2)
- Document linking to artifacts for traceability

---

### 1.2 Ruby Documentation Page (`src/app/apps/stea/ruby/page.js`)

**User-Facing Features:**
- Document list view with search/filtering
- Space sidebar for organizing documents
- Template selection on document creation (Template System - R8)
- Document type indicators (Documentation, Note, Architecture, Meeting Notes)
- Space management (create, select, view)

**Critical User Flows to Test:**

**Flow 1: Create a Documentation Space**
1. Navigate to Ruby app
2. Click "+" button in Spaces sidebar
3. Enter space name (e.g., "Product Documentation")
4. Select emoji icon
5. Click "Create Space"
6. Verify space appears in sidebar
7. Verify space is immediately selectable
8. Verify space is persisted on page reload

**Flow 2: Create a Document from Template (R8)**
1. Click "New Document" button
2. Template selector modal appears
3. Select a template (e.g., "Feature Spec")
4. Modal transitions to document creation form
5. Enter document title
6. View template sections preview
7. Click "Create Document"
8. Document opens in editor with template content
9. Verify `templateId` field is populated in Firestore
10. Verify document type matches template's `docType`

**Flow 3: Search and Filter Documents**
1. Enter search query in search box (searches by title or tags)
2. Document list filters in real-time
3. Clear search - all documents reappear
4. Click space in sidebar to filter by space
5. Search within space
6. Click "All Documents" to show all

**Flow 4: Document Lifecycle**
1. Create document → appears in list
2. Open document in editor
3. Make changes → verify auto-save every 30 seconds
4. Click Save button → immediate save + timestamp
5. Close editor (back arrow) → returns to list
6. Document appears with updated timestamp
7. Delete document → confirm dialog → document removed

**Data Model - Firestore Collections:**
```
stea_doc_spaces/
  - tenantId (string)
  - name (string)
  - icon (string emoji)
  - description (string)
  - createdBy (email)
  - createdAt (timestamp)

stea_docs/
  - tenantId (string)
  - spaceId (string | null)
  - title (string)
  - type (string: documentation|note|architecture|meeting)
  - templateId (string | null)
  - content (TipTap JSON)
  - linkedEntities (array)
  - tags (array)
  - isPublic (boolean)
  - collaborators (array of emails)
  - createdBy/updatedBy/createdAt/updatedAt (timestamps)
  - version (integer)
```

**Test Cases:**
- [ ] Create space with valid name → persists
- [ ] Create space with empty name → disabled button
- [ ] Create space with emoji → displays in sidebar
- [ ] Create space with special characters → handles gracefully
- [ ] Select space → filters docs by spaceId
- [ ] Create doc without template → blank document
- [ ] Create doc with template → content populated with template JSON
- [ ] Search partial title → filters correctly
- [ ] Search tags → filters by tag
- [ ] Auto-save every 30s on active edits
- [ ] Manual save with Cmd+S → immediate save
- [ ] Delete document → requires confirmation
- [ ] Delete document → removed from Firestore

---

### 1.3 RubyEditor Component (`src/components/RubyEditor.js`)

**Key Features:**
- Rich text editing with TipTap
- Formatting toolbar (Bold, Italic, Strikethrough, Highlight)
- Headings (H1, H2, H3)
- Lists (bullet, numbered, task)
- Tables with resizable columns
- Code blocks with syntax highlighting
- Blockquotes and callouts
- Link management
- Asset upload and management
- DocLink creation (bidirectional graph - R3)

**Editor Toolbar Components:**

**Text Formatting:**
- [ ] Bold button toggles bold state
- [ ] Italic button toggles italic state
- [ ] Strikethrough button toggles strikethrough
- [ ] Highlight button applies yellow highlight

**Block Elements:**
- [ ] H1/H2/H3 buttons create headings
- [ ] Bullet list button creates unordered list
- [ ] Numbered list button creates ordered list
- [ ] Task list button creates checkboxes
- [ ] Code block button inserts syntax-highlighted code block
- [ ] Blockquote button creates quoted text
- [ ] Table button inserts 3x3 table

**Special Features:**
- [ ] Callout dropdown offers Info, Warning, Success, Error, Tip types
- [ ] Callout applies correct styling per type
- [ ] Undo/Redo buttons work correctly
- [ ] Slash command menu appears on "/"
- [ ] Slash commands create blocks (e.g., "/table", "/code")

**Asset Management (R2):**

**Asset Upload Flow:**
1. Click "Assets" tab in right sidebar
2. Drag file to upload area OR click to browse
3. Progress bar shows upload progress
4. Asset appears in list with thumbnail/icon
5. For images: can click "Insert" to embed in document
6. For all files: can click "View" to open URL
7. Can delete asset from sidebar

**Firestore Collection - Assets:**
```
stea_doc_assets/
  - docId (string)
  - tenantId (string)
  - name (string)
  - mime (string)
  - size (integer bytes)
  - url (Cloud Storage URL)
  - thumbnailUrl (for images)
  - storagePath (for deletion)
  - createdBy (email)
  - createdAt (timestamp)
```

**Asset Test Cases:**
- [ ] Upload image via drag-drop → appears in assets list
- [ ] Upload image via file picker → appears in assets list
- [ ] Upload progress bar visible during upload
- [ ] Image thumbnail displays in assets panel
- [ ] Click "Insert" on image → inserts image in editor
- [ ] Paste image from clipboard → auto-uploads and inserts
- [ ] Drop image in editor → auto-uploads and inserts
- [ ] Upload non-image file (PDF, text) → displays file icon
- [ ] Click "View" on file → opens in new tab
- [ ] Delete asset → requires confirmation
- [ ] Delete asset → removed from Firestore and Cloud Storage

---

### 1.4 DocLink System (R3) - Document Cross-Referencing

**DocLink Graph Implementation:**

**Create DocLink Flow:**
1. Open document in editor
2. Click "Links" tab in right sidebar
3. Click "Create Link" button
4. Select artifact type (Epic, Feature, Card, Test)
5. Search for artifact by name
6. Select artifact from results
7. Optionally add relation type (e.g., "implements", "tests", "references")
8. Click "Create Link"
9. Link appears in "Links From This Doc" section

**Firestore Collection - DocLinks:**
```
stea_doc_links/
  - fromType (string: "document")
  - fromId (string: docId)
  - toType (string: "epic"|"feature"|"card"|"test")
  - toId (string: artifactId)
  - relation (string | null)
  - tenantId (string)
  - createdBy (email)
  - createdAt (timestamp)
```

**DocLink Test Cases:**
- [ ] Create link to epic → appears in "Links From This Doc"
- [ ] Create link to feature → appears in "Links From This Doc"
- [ ] Create link to card → appears in "Links From This Doc"
- [ ] Create link to test case → appears in "Links From This Doc"
- [ ] Add relation type → displays in link badge
- [ ] Search for artifact → results filtered to 10 items
- [ ] Select artifact → toId populated in form
- [ ] Delete link → removed from Firestore
- [ ] Incoming links appear in separate "Links To This Doc" section
- [ ] Incoming links are read-only (no delete button)
- [ ] Link search case-insensitive
- [ ] Link search partial match

---

## SECTION 2: HANS TESTING SUITE CHANGES

### 2.1 Overview
Hans is STEa's test case management module providing:
- Test case creation from Filo cards
- Test execution tracking and reporting
- Tester feedback capture
- Public test case sharing with expiring tokens
- Closed-loop integration with Filo (create cards from failed tests)
- Multi-tenant support with workspace isolation

**Key Routes:**
- `/apps/stea/hans` - Main testing suite dashboard
- `/apps/stea/hans/[app]` - App-specific test cases
- `/t/[publicToken]` - Public test case link (for external testers)

---

### 2.2 Hans Main Dashboard (`src/app/apps/stea/hans/page.js`)

**User-Facing Features:**
- Overall test statistics (Total, Passed, Failed, In Progress, Pass Rate)
- App-specific cards with pass rates
- Filter by app and status
- Test case list with expandable details
- Create card from test (closed-loop to Filo)

**Critical User Flows:**

**Flow 1: View Test Statistics**
1. Navigate to Hans Testing Suite
2. See quick stats at top:
   - Total Cases count
   - Passed count (green)
   - Failed count (red)
   - In Progress count (blue)
   - Pass Rate percentage
3. Verify stats update when test cases change

**Flow 2: View App-Specific Cards**
1. Dashboard displays grid of apps
2. Each card shows:
   - App name
   - Case count
   - Pass rate percentage (color-coded: green >80%, yellow 50-80%, red <50%)
   - Badges for Passed/Failed/In Progress counts
3. Click app card → navigates to `/apps/stea/hans/[app]`

**Flow 3: Test Case Lifecycle**
1. Expand test case card
2. View preconditions/user story
3. View numbered test steps
4. View expected results with checkboxes
5. Check off acceptance criteria as validation progresses
6. Enter test notes
7. Save notes → persists to Firestore
8. Update status (Open → In Progress → Passed/Failed)
9. Status updates saved immediately

**Flow 4: Closed-Loop to Filo (Create Card from Failed Test)**
1. Test case status = "Failed"
2. Click "Create STEa Card (Fail)" button
3. Modal opens with card creation form
4. Card type = "bug" (pre-selected)
5. Card priority = test's priority
6. Card title = "{App}: {Test Title} - Failed Test"
7. Card description includes test case details
8. Can modify title/description before creating
9. Click "Create Card in Filo"
10. Card created in stea_cards collection
11. Success modal shows → "Open Filo Board" or "Stay in Hans"

**Data Model:**
```
hans_cases/
  - tenantId (string)
  - app (string)
  - title (string)
  - description (string)
  - userStory (string - preconditions)
  - userFlow (array of step strings)
  - acceptanceCriteria (array of criterion strings)
  - priority (string: low|medium|high|critical)
  - status (string: open|in_progress|passed|failed)
  - testNotes (string)
  - publicToken (string hex)
  - publicTokenExpiry (ISO date string)
  - linkedCardId (string - from Filo)
  - linkedBoardId (string)
  - linkedEpicId/featureId (strings | null)
  - linkedEpicLabel/featureLabel (strings)
  - createdAt/updatedAt (ISO dates)
  - createdBy/updatedBy (email)
```

**Test Cases:**
- [ ] Test stats load and display correctly
- [ ] App cards show correct case counts
- [ ] App cards show correct pass rates
- [ ] Pass rate color coding (green/yellow/red)
- [ ] Click app card → navigates to app-specific page
- [ ] Expand test case → shows all sections
- [ ] Check acceptance criteria → checkboxes toggle
- [ ] Save test notes → persisted in Firestore
- [ ] Update status → saved immediately
- [ ] Failed test shows "Create STEa Card (Fail)" button
- [ ] Non-failed test → button disabled
- [ ] Create card from test → card created in Filo
- [ ] Card creation modal pre-populates data
- [ ] Card created with source="hans_test_suite"
- [ ] Card created with linkedTestCaseId

---

### 2.3 App-Specific Hans Page (`src/app/apps/stea/hans/[app]/page.js`)

**New Dynamic Route Implementation:**

**User-Facing Features:**
- App-scoped test case list
- Status filter (all statuses)
- Quick stats for that app
- Create cards from tests
- Deep links back to main Hans dashboard

**Critical User Flows:**

**Flow 1: View App-Specific Test Cases**
1. Navigate to `/apps/stea/hans/MyApp`
2. Header shows "MyApp Test Cases"
3. Stats show counts for MyApp only
4. Test case list filtered by app
5. Can still expand cases and manage tests

**Flow 2: Filter by Status**
1. Select status from dropdown (Open, In Progress, Passed, Failed)
2. List updates to show only matching cases
3. Select "All Statuses" → shows all cases

**Flow 3: Create Card for MyApp**
1. Open test case
2. Create card → card.app = "MyApp"
3. Card links back to the test case

**URL Encoding Edge Cases:**
- [ ] App name with spaces → URL encoded (%20)
- [ ] App name with special chars → URL encoded
- [ ] Navigation from card → app name encoded correctly
- [ ] Back link to Hans → navigates correctly

**Test Cases:**
- [ ] Navigate to app page → loads app-specific cases
- [ ] Status filter works on app page
- [ ] Stats show app-only metrics
- [ ] Create card → card.app = current app
- [ ] Back link to Hans → returns to main dashboard
- [ ] URL app name decoded correctly in header

---

### 2.4 Create Test Case from Filo Card (`src/app/api/hans/createFromCard/route.js`)

**API Endpoint: POST /api/hans/createFromCard**

**Request Body:**
```json
{
  "cardId": "string",
  "boardId": "string | null",
  "app": "string",
  "title": "string",
  "description": "string",
  "userStory": "string",
  "acceptanceCriteria": ["array", "of", "criteria"],
  "userFlow": ["step 1", "step 2", "..."],
  "priority": "low|medium|high|critical",
  "epicId": "string | null",
  "featureId": "string | null",
  "epicLabel": "string",
  "featureLabel": "string",
  "tenantId": "string"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "testCaseId": "string",
  "publicToken": "string (32 hex chars)",
  "publicTokenExpiry": "ISO date (12 hours)",
  "publicUrl": "/t/{publicToken}",
  "hansUrl": "/apps/stea/hans?case={testCaseId}",
  "message": "Test case created. Public link expires in 12 hours."
}
```

**Security Features:**
1. Verify session cookie → extract user email
2. Validate required fields (cardId, title, tenantId)
3. Verify card exists in database
4. Verify card.tenantId == request tenantId (isolation)
5. Check no duplicate test case for this card
6. Generate secure public token (32 hex chars)

**Public Token Features:**
- 32-character hex string (cryptographically random)
- Expires 12 hours after creation
- Allows external testers to access test case details
- Cannot be used to modify test case
- URL: `/t/{token}` (public route, no auth required)

**Test Cases:**
- [ ] Valid card → creates test case
- [ ] Test case linked to card via linkedCardId
- [ ] Public token generated (32 hex chars)
- [ ] Public token expiry = 12 hours from now
- [ ] Duplicate card → 409 error "already exists"
- [ ] Missing cardId → 400 error
- [ ] Missing title → 400 error
- [ ] Missing tenantId → 400 error
- [ ] Card not found → 404 error
- [ ] Wrong tenantId → 403 error "Unauthorized"
- [ ] Unauthenticated → 401 error
- [ ] Public link returns test case details
- [ ] Public link does NOT allow modifications
- [ ] Token expires after 12 hours → 404 on access

---

## SECTION 3: STRIPE PAYMENT INTEGRATION & WORKSPACE CLAIMING

### 3.1 Overview
STEa now supports:
- Workspace creation via Stripe checkout
- Custom fields for workspace name and Google email
- Discount code support (including 100% off codes - RTP726)
- Pending workspace with claim token system
- Email-based workspace claiming flow

---

### 3.2 Create Checkout Session (`src/app/api/create-checkout-session/route.js`)

**API Endpoint: POST /api/create-checkout-session**

**Request Body:**
```json
{
  "priceId": "price_1ST5paCtbV5UkklC3qY1EcxC",
  "mode": "subscription|payment",
  "email": "user@example.com",
  "planName": "Solo Monthly"
}
```

**Plan ID Mapping:**
```
price_1ST5paCtbV5UkklC3qY1EcxC → solo-monthly
price_1ST5pbCtbV5UkklCMtwkY2Rl → solo-yearly
price_1ST5pcCtbV5UkklCU0wTnhyM → team-monthly
price_1ST5pdCtbV5UkklCmzRVHRWc → team-yearly
price_1ST5pfCtbV5UkklC8d44VTfC → agency-monthly
price_1ST5pgCtbV5UkklCsj4MuhYh → agency-yearly
```

**Custom Fields in Checkout:**
1. "Workspace Name" (required text field)
   - User enters workspace name
   - Validated by Stripe
   - Passed to webhook via custom_fields
2. "Google Sign-in Email" (required text field)
   - User enters email they'll use to sign in
   - Validated as email format
   - Passed to webhook via custom_fields

**Features:**
- Allow promotion codes (discount codes)
- Skip card collection if 100% discount applied
- Support both subscription and one-time payment modes
- Capture billing address
- Redirect to success/cancel URLs with session ID

**Test Cases:**
- [ ] Create checkout session with valid priceId
- [ ] Session URL returned
- [ ] Custom fields present in Stripe dashboard
- [ ] Can enter workspace name in checkout
- [ ] Can enter Google email in checkout
- [ ] Discount code input available
- [ ] 100% discount code → payment_method_collection: if_required
- [ ] Mode=subscription → subscription checkout
- [ ] Mode=payment → one-time payment checkout
- [ ] Success URL includes session_id
- [ ] Cancel URL includes canceled=true
- [ ] Missing priceId → 400 error
- [ ] Invalid mode → 400 error

---

### 3.3 Stripe Webhook Handler (`src/app/api/webhooks/stripe/route.js`)

**Webhook Events Handled:**

**1. checkout.session.completed**
- Extract custom_fields (workspace name, Google email)
- Extract plan from metadata
- Check if payment or subscription mode

**For Subscriptions (with custom fields):**
1. Generate 32-character claim token (crypto.randomBytes)
2. Create pendingWorkspaces doc:
   ```
   {
     workspaceName: string,
     googleEmail: string (lowercase, trimmed),
     stripeCustomerId: string,
     stripeSessionId: string,
     plan: "solo|team|agency",
     status: "pending_claim",
     createdAt: timestamp,
     expiresAt: timestamp + 7 days
   }
   ```
3. Send claim email to customer_email with:
   - Workspace name
   - Claim URL: `{NEXT_PUBLIC_SITE_URL}/apps/stea/claim?token={token}`
   - Token expiry info
4. Create stea_subscriptions doc with plan details

**For One-Time Payments:**
1. Create stea_purchases doc:
   ```
   {
     customerId: string,
     sessionId: string,
     email: string,
     amount: number,
     currency: string,
     paymentStatus: "succeeded",
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

**2. customer.subscription.created**
- Log subscription creation
- Create/update stea_subscriptions doc

**3. customer.subscription.updated**
- Find existing subscription by subscriptionId
- Update status, period dates, cancel_at_period_end

**4. customer.subscription.deleted**
- Find subscription by subscriptionId
- Mark status = "canceled"
- Set canceledAt timestamp

**5. invoice.payment_succeeded**
- Create stea_payments doc with payment details
- Log to stea_payments collection

**6. invoice.payment_failed**
- Create stea_payments doc
- Mark status = "failed"
- Store failure reason

**Firestore Collections Created:**

```
pendingWorkspaces/{token}/
  - workspaceName (string)
  - googleEmail (string)
  - stripeCustomerId (string)
  - stripeSessionId (string)
  - plan (string)
  - status (string: pending_claim|claimed)
  - createdAt (timestamp)
  - expiresAt (timestamp + 7 days)
  - claimedAt (timestamp | null)
  - workspaceId (string | null - after claim)

stea_subscriptions/
  - customerId (string)
  - sessionId (string)
  - subscriptionId (string)
  - email (string)
  - status (string: pending|active|canceled)
  - mode (string: subscription|payment)
  - amount (number)
  - currency (string)
  - plan (string)
  - workspaceName (string)
  - googleEmail (string)
  - currentPeriodStart (timestamp)
  - currentPeriodEnd (timestamp)
  - cancelAtPeriodEnd (boolean)
  - workspaceId (string | null - after claim)
  - createdAt (timestamp)
  - updatedAt (timestamp)

stea_purchases/
  - customerId (string)
  - sessionId (string)
  - email (string)
  - amount (number)
  - currency (string)
  - paymentStatus (string)
  - createdAt (timestamp)
  - updatedAt (timestamp)

stea_payments/
  - invoiceId (string)
  - customerId (string)
  - subscriptionId (string)
  - amount (number)
  - currency (string)
  - status (string: succeeded|failed)
  - paidAt (timestamp)
  - failureReason (string | null)
  - createdAt (timestamp)
```

**Test Cases:**
- [ ] Checkout completion → pending workspace created
- [ ] Pending workspace has correct fields
- [ ] Claim token generated (32 hex)
- [ ] Claim email sent to customer_email
- [ ] Claim URL includes correct token
- [ ] Subscription event → stea_subscriptions created
- [ ] Payment succeeded event → stea_payments created with "succeeded"
- [ ] Payment failed event → stea_payments created with "failed"
- [ ] Webhook signature verification passes
- [ ] Invalid signature → 400 error
- [ ] 100% discount → pending workspace still created
- [ ] Multiple checkouts → multiple pending workspaces

---

### 3.4 Claim Workspace (`src/app/api/claim-workspace/route.js`)

**GET /api/claim-workspace?token={token}**

**Response (200 OK):**
```json
{
  "workspaceName": "string",
  "googleEmail": "string",
  "plan": "solo|team|agency"
}
```

**Validations:**
- Token exists in pendingWorkspaces
- Token not expired
- Status = "pending_claim" (not already claimed)

**Errors:**
- 400: Token missing
- 404: Token not found or invalid
- 410: Token expired (expiresAt < now)
- 409: Already claimed (status != pending_claim)

**POST /api/claim-workspace**

**Request Body:**
```json
{
  "token": "string",
  "userEmail": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "workspaceId": "string",
  "workspaceName": "string"
}
```

**Process:**
1. Get pending workspace by token
2. Verify not expired
3. Verify status = "pending_claim"
4. Normalize emails (lowercase, trim)
5. Verify userEmail matches pendingWorkspace.googleEmail
6. Create actual tenant using createTenantAdmin():
   ```
   {
     name: workspaceName,
     plan: plan,
     ownerEmail: userEmail
   }
   ```
7. Update stea_subscriptions with workspaceId
8. Mark pendingWorkspace.status = "claimed"
9. Return workspace ID

**Errors:**
- 400: Missing token or userEmail
- 404: Token not found
- 410: Token expired
- 409: Already claimed
- 403: Email mismatch (shows expected email)
- 500: Internal error (tenant creation failed)

**Email Mismatch Error Response:**
```json
{
  "error": "Email mismatch",
  "expectedEmail": "user@example.com",
  "message": "Please sign in with user@example.com (the email you used at checkout)."
}
```

**Test Cases:**
- [ ] Valid token → returns workspace details
- [ ] Missing token → 400 error
- [ ] Invalid token → 404 error
- [ ] Expired token → 410 error
- [ ] Already claimed → 409 error
- [ ] Correct email → creates workspace
- [ ] Email mismatch → 403 error with expected email
- [ ] Email case-insensitive matching
- [ ] Email whitespace trimmed
- [ ] Workspace created with correct name
- [ ] Workspace created with correct plan
- [ ] Workspace created with user as owner
- [ ] Subscription updated with workspaceId
- [ ] PendingWorkspace marked as claimed

---

### 3.5 Discount Code Support (RTP726)

**100% Off Discount Codes:**
- Applied at Stripe checkout
- Amount total will be 0
- Webhook still processes (creates pending workspace)
- Payment method not collected (if_required)
- User still receives claim email
- Workflow identical to paid checkout

**Test Cases:**
- [ ] Apply 100% discount code → checkout processes
- [ ] Amount_total = 0
- [ ] payment_method_collection = if_required
- [ ] Pending workspace still created
- [ ] Claim email still sent
- [ ] Workspace can be claimed normally
- [ ] Regular discount codes (% off) work
- [ ] Promotion code input available

---

## SECTION 4: WORKSPACE PULSE DASHBOARD

### 4.1 Overview
Workspace Pulse provides at-a-glance workspace health across all modules:
- Build Progress (Filo - Epics/Features/Bugs)
- Testing Snapshot (Hans - Pass/Fail rates)
- Backlog Health (Filo - Ready/In Dev/Blocked)
- Discovery Signals (Harls - Notes/JTBD)
- Documentation Activity (Ruby - Docs/Links)

**Component:** `WorkspacePulse.jsx` displays 5 dashboard tiles
**Aggregation:** `workspacePulseAggregator.js` calculates metrics
**Admin Control:** `TenantAppsManager.jsx` allows admins to select tracked apps

---

### 4.2 WorkspacePulse Component (`src/components/workspace/WorkspacePulse.jsx`)

**User-Facing Features:**
- Grid of 5 tiles (responsive: 1/2 cols on mobile, 3 on desktop)
- App selector dropdown for multi-app workspaces
- "Workspace Pulse" section header with last-updated timestamp
- Loading skeleton while data loads
- Real-time Firestore listener for metrics

**Critical User Flows:**

**Flow 1: View Dashboard on Home**
1. Navigate to STEa home
2. Scroll down to Workspace Pulse section
3. 5 tiles load:
   - Build Progress (blue gradient)
   - Testing Snapshot (green/red)
   - Backlog Health (orange gradient)
   - Discovery Signals (purple gradient)
   - Documentation Activity (teal gradient)
4. Last updated timestamp visible

**Flow 2: Filter by App (Multi-App)**
1. If workspace has 2+ apps
2. "Filter by app" dropdown appears
3. Select app from dropdown
4. Build Progress tile updates to show that app's metrics
5. Other tiles show workspace-wide metrics

**Flow 3: Click Through to Details**
1. Click any tile → deep links to module
2. Build Progress → `/apps/stea/filo?app={appName}`
3. Testing Snapshot → `/apps/stea/hans?filter=failing`
4. Backlog Health → `/apps/stea/filo?filter=blocked`
5. Discovery Signals → `/apps/stea/harls`
6. Documentation Activity → `/apps/stea/ruby?filter=recent`

**Firestore Data Structure:**

Data stored at: `tenants/{tenantId}/dashboard/metrics`

```
{
  buildProgress: {
    apps: [
      {
        name: "SyncFit",
        progress: 62,
        epicsComplete: 3,
        epicsTotal: 5,
        featuresInProgress: 12,
        featuresTotal: 27,
        bugsOpen: 4,
        lastActivity: timestamp
      }
    ]
  },
  testingSnapshot: {
    pass: 23,
    fail: 5,
    awaitingRetest: 2,
    coverage: 76
  },
  backlogHealth: {
    ready: 14,
    inDevelopment: 9,
    blocked: 2,
    bugsOpen: 7,
    cycleTime: 2.9
  },
  discoverySignals: {
    newNotes: 3,
    jtbdDrafts: 2,
    coverage: 64
  },
  documentationActivity: {
    newDocs: 1,
    updatedThisWeek: 3,
    linkedPercentage: 92
  },
  lastUpdated: timestamp,
  version: 1
}
```

**Test Cases:**
- [ ] WorkspacePulse loads on home page
- [ ] 5 tiles display correctly
- [ ] Loading skeleton shows while loading
- [ ] Last updated timestamp displays
- [ ] Real-time listener updates when metrics change
- [ ] Single app → no dropdown, shows that app
- [ ] Multi-app → dropdown visible
- [ ] Select app in dropdown → tile updates
- [ ] Click Build Progress → links to Filo with app filter
- [ ] Click Testing Snapshot → links to Hans
- [ ] Click Backlog Health → links to Filo
- [ ] Click Discovery Signals → links to Harls
- [ ] Click Documentation Activity → links to Ruby
- [ ] No metrics doc → mock data displays
- [ ] Error loading metrics → mock data displays

---

### 4.3 Workspace Pulse Aggregator (`src/lib/workspacePulseAggregator.js`)

**Main Export:**
```javascript
aggregateWorkspacePulse(tenantId, options = {})
```

**Parameters:**
- `tenantId`: string
- `options.apps`: array of app names to track (e.g., ["SyncFit", "MyApp"])

**Functions:**

**aggregateBuildProgress(tenantId, appNames)**
- Queries stea_epics for each app
- Counts epics with status="Done" or column="Done"
- Queries stea_features for each app
- Counts features with status/column="In Progress"
- Queries stea_cards for bugs (labels.includes("bug"))
- Counts bugs that aren't Done
- Calculates progress = epicsComplete / epicsTotal * 100
- Finds lastActivity by comparing all updatedAt fields

**aggregateTestingSnapshot(tenantId)**
- Queries hans_cases
- Counts status="passed" → pass
- Counts status="failed" → fail
- Counts needsRetest=true → awaitingRetest
- Calculates coverage = pass / (pass+fail+awaitingRetest) * 100

**aggregateBacklogHealth(tenantId)**
- Queries stea_cards
- Counts status/column="Ready" → ready
- Counts status/column="In Development" → inDevelopment
- Counts blocked=true or labels.includes("blocked") → blocked
- Counts bugs not Done → bugsOpen
- Calculates cycleTime (7-day average):
  - Find cards completed in last 7 days
  - Calculate days = (completedAt - startedAt) / days
  - Average all cycle times

**aggregateDiscoverySignals(tenantId)**
- Queries projects collection
- For each project, counts discovery notes created in last 7 days
- For each project, counts jobs with status="draft" and promotedToFeature!=true
- Returns newNotes, jtbdDrafts, coverage (placeholder: 64)

**aggregateDocumentationActivity(tenantId)**
- Queries stea_docs
- Counts docs created in last 7 days → newDocs
- Counts docs updated in last 7 days → updatedThisWeek
- Counts docs with cardId or linkedCards.length > 0 → docsWithLinks
- Calculates linkedPercentage = docsWithLinks / total * 100

**Test Cases:**
- [ ] aggregateBuildProgress → queries epics correctly
- [ ] Build progress counts Done epics
- [ ] Build progress counts In Progress features
- [ ] Build progress counts open bugs
- [ ] Build progress calculates progress %
- [ ] Build progress finds lastActivity
- [ ] aggregateTestingSnapshot → queries test cases
- [ ] Testing counts passed cases
- [ ] Testing counts failed cases
- [ ] Testing counts retest cases
- [ ] Testing calculates coverage %
- [ ] aggregateBacklogHealth → queries cards
- [ ] Backlog counts Ready cards
- [ ] Backlog counts In Development cards
- [ ] Backlog counts blocked cards
- [ ] Backlog counts open bugs
- [ ] Backlog calculates 7-day cycle time
- [ ] aggregateDiscoverySignals → queries projects
- [ ] Discovery counts 7-day notes
- [ ] Discovery counts draft JTBDs
- [ ] aggregateDocumentationActivity → queries docs
- [ ] Docs counts 7-day new docs
- [ ] Docs counts 7-day updated docs
- [ ] Docs calculates link percentage
- [ ] aggregateWorkspacePulse → calls all functions
- [ ] WorkspacePulse writes to Firestore
- [ ] Returns complete metrics object

---

### 4.4 Tenant Apps Manager (`src/components/admin/TenantAppsManager.jsx`)

**Admin-Only Feature:**
- Visible only to super admins
- Allows non-developers to configure dashboard without code

**User Flow:**

**Flow 1: Discover Available Apps**
1. Admin opens admin page
2. TenantAppsManager loads
3. Automatically queries:
   - stea_cards for app names
   - stea_epics for app names
   - stea_features for app names
4. Deduplicates and sorts alphabetically
5. Displays in checklist with emoji icons (📱)
6. Default apps included: ['Adhd Acclaim', 'Mandrake', 'SyncFit', 'Tou.Me']

**Flow 2: Select Apps to Track**
1. Admin checks/unchecks apps
2. "Select All" link → selects all discovered apps
3. "Deselect All" link → deselects all apps
4. Shows count: "{selected} of {total} apps selected"

**Flow 3: Save Configuration**
1. Click "Save Configuration" button
2. Updates tenants/{tenantId}.apps array
3. Success message: "Saved {count} app(s). Dashboard updates within 15 minutes."
4. Save disabled if 0 apps selected

**Firestore Update:**
```
tenants/{tenantId}
  apps: ["App1", "App2", "App3"]
```

**Integration:**
- WorkspacePulse reads tenants.apps array
- Passes to aggregateWorkspacePulse(tenantId, { apps: [...] })
- Cloud Function runs aggregation every 15 minutes
- Dashboard refreshes with new metrics

**Test Cases:**
- [ ] Super admin sees TenantAppsManager
- [ ] Non-admin doesn't see component
- [ ] Apps discovered from cards
- [ ] Apps discovered from epics
- [ ] Apps discovered from features
- [ ] Apps deduplicated
- [ ] Apps sorted alphabetically
- [ ] Apps display with emoji icons
- [ ] Check app → selection updates
- [ ] Uncheck app → selection updates
- [ ] "Select All" → all checked
- [ ] "Deselect All" → all unchecked
- [ ] Count updates: "{selected} of {total}"
- [ ] Save button disabled when 0 selected
- [ ] Save button enabled when 1+ selected
- [ ] Click Save → updates Firestore
- [ ] Success message displays
- [ ] Saved apps persist on page reload
- [ ] Invalid tenant → shows error

---

## SECTION 5: CROSS-MODULE INTEGRATION & CTAs

### 5.1 Ruby → Filo Cross-Links

**Location:**
- Ruby: Create document
- Filo: Source artifact (epic/feature/card)

**CTA: Create Documentation from Artifact**
- Filo card shows button: "Document" or "Create Doc in Ruby"
- Opens modal to select template
- Creates Ruby doc linked to that card
- API: POST `/api/ruby/create-from-source`

**CTA: Link Existing Documentation**
- Ruby document sidebar: "Create DocLink"
- Search and link to Filo artifacts
- Bidirectional links tracked in stea_doc_links

---

### 5.2 Hans → Filo Closed-Loop

**Location:**
- Hans test case expanded view
- Failed test section

**CTA: Create STEa Card (Fail)**
- Button enabled only if status="failed"
- Opens card creation modal
- Pre-fills type="bug", priority=test.priority
- Pre-fills description with test details
- Creates card in stea_cards (Filo)
- Card linked to test via linkedTestCaseId

**CTA: Create STEa Card (Feedback)**
- Always available
- Opens card creation modal
- Pre-fills type="observation"
- Pre-fills description with test feedback
- Creates card for general feedback/suggestions

---

## SECTION 6: CRITICAL PATH TEST SEQUENCES

### 6.1 End-to-End: Workspace Creation → Usage

**Sequence:**
1. **Checkout Flow**
   - User selects plan (e.g., Team Monthly)
   - Clicks "Upgrade Now"
   - Stripe checkout opens with custom fields
   - Enter workspace name: "Acme Corp"
   - Enter Google email: "acme@example.com"
   - Apply discount code (optional)
   - Complete payment
   - Webhook processes checkout.session.completed
   - Pending workspace created
   - Claim email sent to acme@example.com

2. **Email Claim Flow**
   - User receives claim email
   - Clicks claim link: `/apps/stea/claim?token={token}`
   - Claims page loads
   - Shows: "Welcome to Acme Corp"
   - User signs in with Google using acme@example.com
   - Email validated against expected email
   - Workspace created via createTenantAdmin
   - Subscription marked as "active"
   - Redirected to workspace home

3. **Initial Workspace Setup**
   - User navigates to home
   - STEa home displays
   - Module cards visible (Harls, Filo, Hans, Ruby, etc.)
   - Workspace Pulse section visible
   - Workspace Pulse shows mock data (no metrics yet)

4. **Create Content**
   - User creates epics in Filo
   - User creates features in Filo
   - User creates test cases in Hans
   - User creates documentation in Ruby
   - System aggregates metrics (15-min interval or manual trigger)

5. **Workspace Pulse Updates**
   - Real-time listener detects new metrics
   - Tiles update with actual data
   - Admin configures tracked apps
   - Dashboard reflects app selection

---

## SECTION 7: SECURITY & MULTI-TENANT TESTING

### 7.1 Tenant Isolation

**Test: User A Cannot Access User B's Data**

1. Create two workspaces:
   - Workspace A (User A)
   - Workspace B (User B)

2. User A signs in → TenantContext loads User A's workspace
3. Query: stea_docs where tenantId == WorkspaceA.id
4. Result: Only docs from Workspace A
5. User B signs in → TenantContext loads User B's workspace
6. Query: stea_docs where tenantId == WorkspaceB.id
7. Result: Only docs from Workspace B

**Test: API Enforces Tenant Isolation**

1. POST /api/hans/createFromCard
2. Provide valid cardId from Workspace A
3. Provide tenantId = Workspace B
4. Response: 403 "Unauthorized: Card does not belong to your workspace"

---

### 7.2 Authentication Flows

**Test: Unauthenticated User Redirect**

1. Navigate to `/apps/stea/ruby` without sign-in
2. Redirected to `/apps/stea?next=/apps/stea/ruby`
3. Sign in with Google
4. Redirected back to `/apps/stea/ruby`

**Test: Valid Token Claims**

1. GET `/api/claim-workspace?token={invalidToken}`
2. Response: 404 "Invalid or expired claim token"
3. GET `/api/claim-workspace?token={expiredToken}` (>7 days old)
4. Response: 410 "Claim token has expired"
5. POST `/api/claim-workspace` with email mismatch
6. Response: 403 "Email mismatch" (shows expected email)

---

## SECTION 8: PERFORMANCE & LOAD TESTING

### 8.1 Dashboard Loading

**Scenario: Large Workspace with 1000+ Documents**

- [ ] Load Ruby home page → documents list loads in <2s
- [ ] Search documents → filters in <500ms
- [ ] Load editor → TipTap editor initializes <1s
- [ ] Save document → persists in <2s
- [ ] Upload asset → progress visible, <5s for typical file

**Scenario: Hans Dashboard with 500+ Test Cases**

- [ ] Load Hans home → stats visible <2s
- [ ] Filter by app → updates <500ms
- [ ] Filter by status → updates <500ms
- [ ] Expand test case → shows details <500ms
- [ ] Expand 50 test cases sequentially → no lag

**Scenario: Workspace Pulse Aggregation**

- [ ] Initial aggregation (100 epics, 500 features, 50 cards) <10s
- [ ] Subsequent aggregation (real-time listener) <2s
- [ ] Dashboard render with 5 tiles <1s

---

## SECTION 9: EDGE CASES & ERROR HANDLING

### 9.1 Network Errors

- [ ] Create document with network timeout → user sees error, can retry
- [ ] Upload asset with network disconnect → upload resumes or fails gracefully
- [ ] Claim workspace with network error → helpful error message
- [ ] Webhook delivery failure → Stripe retries

### 9.2 Data Validation

- [ ] Empty document title → button disabled
- [ ] Document with no content → saves as blank
- [ ] Asset > 100MB → rejected with size error
- [ ] Invalid email format → validation error
- [ ] Special characters in workspace name → accepted and escaped

### 9.3 Concurrent Edits

- [ ] User A opens document, User B opens same document
- [ ] User A saves at 10:01:00, User B saves at 10:01:01
- [ ] Both saves succeed (no conflict detection yet)
- [ ] Last write wins (User B's content)
- [ ] Last saved timestamp shows User B's save time

---

## SECTION 10: REGRESSION TEST CHECKLIST

### Authentication & Multi-Tenant
- [ ] Users can sign in with Google
- [ ] Users can sign out
- [ ] Unauthenticated users redirected to login
- [ ] Users only see their workspace's data
- [ ] Users cannot access other workspace data via API

### Ruby Documentation
- [ ] Create space
- [ ] Create document without template
- [ ] Create document with template
- [ ] Edit document in TipTap editor
- [ ] Auto-save every 30 seconds
- [ ] Manual save with Cmd+S
- [ ] Delete document
- [ ] Search documents by title
- [ ] Filter documents by space
- [ ] Upload assets (images, PDFs, files)
- [ ] Insert image from assets
- [ ] Create DocLink to artifacts
- [ ] View bidirectional links

### Hans Testing Suite
- [ ] View test statistics
- [ ] Filter test cases by app
- [ ] Filter test cases by status
- [ ] Expand test case details
- [ ] Check acceptance criteria
- [ ] Save test notes
- [ ] Update test status
- [ ] Create card from failed test
- [ ] Create card from feedback
- [ ] View app-specific page
- [ ] Generate public test token
- [ ] Access test via public token
- [ ] Token expires after 12 hours

### Stripe Payment
- [ ] Create checkout session
- [ ] Enter custom fields (workspace name, email)
- [ ] Apply discount code
- [ ] Process payment
- [ ] Webhook creates pending workspace
- [ ] Send claim email
- [ ] Claim workspace with correct email
- [ ] Reject claim with wrong email
- [ ] Handle token expiry (>7 days)
- [ ] Handle already-claimed token
- [ ] Handle 100% discount code

### Workspace Pulse Dashboard
- [ ] Dashboard loads on home page
- [ ] 5 tiles display
- [ ] Real-time updates when metrics change
- [ ] App filter works on multi-app workspace
- [ ] Click tiles → deep links to modules
- [ ] Last updated timestamp displays
- [ ] Admin can select apps to track
- [ ] Aggregation job runs (manual or Cloud Function)
- [ ] Metrics recalculated correctly

---

## SECTION 11: KNOWN ISSUES & LIMITATIONS

### Known Issues
- (None documented at time of test plan creation)

### Limitations
- DocLink graph UI not yet implemented (R3 labels infrastructure in place)
- Reviewer mode features not yet implemented (R5)
- No concurrent edit conflict resolution
- No document version history
- Hans test case result tracking is manual (no automated result capture)
- Discovery Signals coverage calculation is placeholder (64)
- Cloud Function scheduler TBD (manual aggregation available via admin panel)

---

## SECTION 12: TEST ENVIRONMENT SETUP

### Firestore Test Data Setup Script

```javascript
// Creates test data for manual testing
async function setupTestData(tenantId) {
  // Create test space
  await db.collection('stea_doc_spaces').add({
    tenantId,
    name: 'Test Documentation',
    icon: '📚',
    createdBy: 'test@example.com',
    createdAt: new Date(),
  });

  // Create test document
  await db.collection('stea_docs').add({
    tenantId,
    title: 'Test Document',
    type: 'documentation',
    content: { type: 'doc', content: [] },
    createdBy: 'test@example.com',
    createdAt: new Date(),
  });

  // Create test cases
  await db.collection('hans_cases').add({
    tenantId,
    app: 'TestApp',
    title: 'Login Test',
    status: 'open',
    priority: 'high',
    createdBy: 'test@example.com',
    createdAt: new Date(),
  });
}
```

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Requires auth: `4000 0027 6000 3184`
- Decline: `4000 0000 0000 0002`

### Environment Variables Needed

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## SECTION 13: SUCCESS CRITERIA

A feature is considered "tested and ready" when:

1. **All critical user flows pass** (Section 6.1)
2. **All integration points work** (Section 5)
3. **Tenant isolation enforced** (Section 7.1)
4. **No critical bugs found** (P0/P1)
5. **Performance acceptable** (Section 8)
6. **Error handling graceful** (Section 9)
7. **Regression tests pass** (Section 10)
8. **Security verified** (Section 7)

---

## APPENDIX: FIRESTORE SCHEMA REFERENCE

### Collections Overview

```
stea_doc_spaces/
  - Multi-space documentation organization
  - Scoped by tenantId

stea_docs/
  - Rich documents with TipTap JSON content
  - Links to spaces and artifacts
  - Scoped by tenantId

stea_doc_links/
  - Bidirectional links between documents and artifacts
  - Enables cross-module traceability
  - Scoped by tenantId

stea_doc_assets/
  - File uploads (images, PDFs, documents)
  - Cloud Storage integration
  - Scoped by tenantId and docId

hans_cases/
  - Test cases created from Filo cards
  - Includes public sharing tokens
  - Scoped by tenantId

pendingWorkspaces/
  - Temporary records for workspace claiming
  - 7-day expiry
  - Keyed by random claim token

stea_subscriptions/
  - Stripe subscription records
  - Linked to workspace after claim
  - Tracks billing status

stea_purchases/
  - One-time payment records
  - Linked to workspace after claim

stea_payments/
  - Invoice payment records
  - Success and failure logs

tenants/{tenantId}/dashboard/metrics
  - Aggregated workspace health metrics
  - Real-time listener on WorkspacePulse
  - Updated by Cloud Function or manual trigger
```

---

End of Test Plan
