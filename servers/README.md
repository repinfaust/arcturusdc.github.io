# STEa MCP Server

MCP (Model Context Protocol) server that allows Claude Code to create and manage Epics, Features, and Cards in your STEa board through Firestore.

## Setup

### 1. Configure Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings → Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file securely (DO NOT commit to git)

### 2. Configure Claude Desktop

Edit your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration (replace with your actual paths and tenant ID):

```json
{
  "mcpServers": {
    "stea-mcp": {
      "command": "npx",
      "args": [
        "ts-node",
        "/FULL/PATH/TO/arcturusdc.github.io/servers/stea-mcp.ts"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/FULL/PATH/TO/your-firebase-service-account.json",
        "TENANT_ID": "your-tenant-id",
        "DEFAULT_APP": "Tou.me",
        "DEFAULT_COLUMN": "Idea",
        "CREATED_BY": "mcp:stea"
      }
    }
  }
}
```

**Important**:
- Replace `/FULL/PATH/TO/` with actual absolute paths
- `GOOGLE_APPLICATION_CREDENTIALS` must point to your Firebase service account JSON file (download from Firebase Console → Project Settings → Service Accounts)
- **`TENANT_ID` is REQUIRED** for multi-tenant security - get this from your tenant document in Firestore (`tenants` collection)
- Restart Claude Desktop after editing the config

### 3. Verify Installation

After restarting Claude Desktop, open a new chat and you should see the following tools available:

**Filo (Product Backlog)**:
- `stea.createEpic` - Create an Epic (top-level work item)
- `stea.createFeature` - Create a Feature nested under an Epic
- `stea.createCard` - Create a Card nested under a Feature
- `stea.listEpics` - List all epics (optionally filter by app)
- `stea.listFeatures` - List features under an epic
- `stea.listCardsByFeature` - List cards under a feature
- `stea.updateEpic` - Update an existing epic
- `stea.updateFeature` - Update an existing feature
- `stea.updateCard` - Update an existing card
- `stea.deleteEpic` - Delete an epic
- `stea.deleteFeature` - Delete a feature
- `stea.deleteCard` - Delete a card

**Ruby (Documentation)**:
- `stea.listRubySpaces` - List Ruby documentation spaces
- `stea.createRubySpace` - Create a new documentation space
- `stea.createRubyDoc` - Create a Ruby document with raw content
- `stea.generateDoc` - **Generate a doc from template (PRS, BuildSpec, ReleaseNotes) with context from source artifact (R4)**
- `stea.generateReleaseNotes` - **Automatically generate release notes from Filo Done cards, Hans test results, and GitHub PRs (R6)**
- `stea.reviewDoc` - **Start a review for a document using predefined checklists (Accessibility, Security, GDPR, Design Parity, Performance) (R5)**
- `stea.updateReview` - **Update review checklist items with pass/fail status and notes (R5)**
- `stea.completeReview` - **Complete a review with final approval status and signature (R5)**
- `stea.listReviews` - **List all reviews for a document (R5)**
- `stea.importOpenAPI` - **Import and parse OpenAPI spec (JSON/YAML) into navigable API documentation with code samples (R7)**
- `stea.syncFigmaComponents` - **Sync Figma file to extract components, variants, design tokens, and thumbnails (R7)**
- `stea.listAPIEndpoints` - **List parsed API endpoints from an imported OpenAPI spec (R7)**
- `stea.listFigmaComponents` - **List synced Figma components from a file (R7)**
- `stea.listAPISpecs` - **List all imported OpenAPI specs (R7)**
- `stea.listFigmaFiles` - **List all synced Figma files (R7)**

## Usage Examples

### Create an Epic
```
Use stea.createEpic to create an epic named "User Authentication Overhaul"
for app "Tou.me", priority HIGH, column "Planning", size "XL",
description "Modernize auth system with OAuth2 and improve security"
```

### Create a Feature under an Epic
```
Use stea.listEpics to find the "User Authentication Overhaul" epic.
Then create a feature with stea.createFeature:
- epicId: <the ID from listEpics>
- name: "Social login integration"
- priority: MEDIUM
- column: "Design"
- size: "5"
- description: "Add Google, GitHub, and Apple sign-in options"
```

### Create Cards under a Feature
```
Use stea.createCard with:
- epicId: <epic ID>
- featureId: <feature ID>
- title: "Implement Google OAuth flow"
- description: "Set up Google OAuth2 provider and handle callback"
- priority: HIGH
- testing:
    userStory: "As a user, I want to sign in with my Google account"
    acceptanceCriteria:
      - "User can click 'Sign in with Google' button"
      - "OAuth consent screen appears"
      - "User is redirected back and logged in"
    userFlow:
      - "Click 'Sign in with Google'"
      - "Authorize on Google consent screen"
      - "Redirected to app dashboard"
```

### Generate Documentation from a Card (R4: Prompt→Doc)

**Step 1: List your Ruby spaces**
```
Use stea.listRubySpaces to see available documentation spaces
```

**Step 2: Generate a Build Spec from a Filo card**
```
Use stea.generateDoc with:
- templateType: "buildspec"
- spaceId: <space ID from step 1>
- sourceType: "card"
- sourceId: <card ID>
```

This will:
- Fetch the card's title, description, user story, acceptance criteria, constraints
- Apply the Build Spec template with those values
- Create a new Ruby document marked as "draft"
- Auto-create a DocLink from the card to the document
- Return the document ID and generation time

**Available Templates**:
- `"prs"` - Product Requirements Spec (use with epics/features/cards)
- `"buildspec"` - Build Specification (use with features/cards)
- `"releasenotes"` - Release Notes (use standalone or with epics)

**Step 3: View the generated document**
The document will be in Ruby with proper formatting (headings, lists, task lists, code blocks).

### Create a Ruby Space
```
Use stea.createRubySpace with:
- name: "Product Specs"
- icon: "📋" (optional, defaults to 📚)
```

### Create a Custom Ruby Document
```
Use stea.createRubyDoc with:
- spaceId: <space ID>
- title: "API Design Guidelines"
- content: "# API Design\n\nOur REST API follows these principles..."
- type: "documentation" (or "note", "architecture", "meeting")
```

### Generate Release Notes (R6: Automation)

**Step 1: Prepare for a release**
Make sure you have:
- Moved completed cards to "Done" column in Filo
- Run Hans test sessions for this release cycle

**Step 2: Generate release notes automatically**
```
Use stea.generateReleaseNotes with:
- spaceId: <Ruby space ID>
- version: "v1.2.0"
- startDate: "2024-01-01" (optional, filters Filo/Hans by date)
- endDate: "2024-01-31" (optional, defaults to now)
- includeFilo: true (default)
- includeHans: true (default)
- includeGithub: false (optional, requires GitHub integration)
```

This will:
- **Query Filo** for all cards in "Done" column within the date range
- **Categorize** them: bugs → Fixes, features → Features, others → Improvements
- **Query Hans** for test sessions and calculate pass rate
- **Generate markdown** with links back to each Filo card
- **Create Ruby doc** with all sections populated (Features, Fixes, Improvements, Test Results)
- Return stats: number of features, fixes, improvements, test results

**Output example**:
```
Release Notes - v1.2.0

🎉 New Features
- [User authentication](https://arcturusdc.com/apps/stea/filo?card=abc123)
- [Dark mode support](https://arcturusdc.com/apps/stea/filo?card=def456)

✨ Improvements
- [Performance optimization](https://arcturusdc.com/apps/stea/filo?card=ghi789)

🐛 Bug Fixes
- [Login redirect issue](https://arcturusdc.com/apps/stea/filo?card=jkl012)

📊 Test Results
- Total tests run: 245
- Passed: 242 (98.8%)
- Failed: 3
```

**Future: GitHub Integration**
When GitHub integration is enabled, it will also include:
- PRs merged between tags (fromTag → toTag)
- Commit history
- Contributors list

### Review a Document (R5: Reviewer Mode)

**Step 1: Start a review for a document**
```
Use stea.reviewDoc with:
- docId: <Ruby document ID>
- checklistType: "accessibility" | "security" | "gdpr" | "design-parity" | "performance"
- reviewerId: <user ID> (optional)
- reviewerName: "John Doe" (optional)
```

This will:
- Load the appropriate checklist template (10-15 items)
- Create a review document in Firestore
- Initialize all checklist items with "pending" status
- Return review ID and item count

**Available Checklists**:
- **accessibility**: WCAG 2.1 Level AA compliance checks (contrast, keyboard nav, alt text, etc.)
- **security**: Security considerations (input validation, auth, encryption, XSS/CSRF prevention)
- **gdpr**: Data privacy and GDPR compliance (consent, right to access/delete, DPAs, etc.)
- **design-parity**: Design system consistency (tokens, typography, spacing, responsive)
- **performance**: Performance optimization (Core Web Vitals, bundle size, caching, images)

**Step 2: Update review items**
```
Use stea.updateReview with:
- reviewId: <review ID from step 1>
- itemId: "a11y-001" (checklist item ID)
- status: "pass" | "fail" | "n/a"
- notes: "Contrast ratio is 4.8:1" (optional)
- suggestedFix: "Increase button text color to #2C3E50" (optional)
- owner: "Frontend team" (optional)
```

Repeat for each checklist item. The system tracks progress automatically.

**Step 3: Complete the review**
```
Use stea.completeReview with:
- reviewId: <review ID>
- status: "approved" | "changes-requested"
- reviewerSignature: "John Doe"
- summary: "Document meets accessibility standards with minor recommendations" (optional)
```

This will:
- Verify all items are reviewed (no pending items)
- Mark the review as complete with timestamp
- Calculate final stats (passed, failed, critical failures)
- Lock the review from further edits

**Step 4: List all reviews for a document**
```
Use stea.listReviews with:
- docId: <Ruby document ID>
- checklistType: "all" | "accessibility" | "security" | etc. (optional filter)
```

Returns all reviews with progress stats, completion status, and timestamps.

**Example Workflow**:
1. Product manager creates PRS document using `generateDoc`
2. Tech lead starts security review: `reviewDoc(docId, "security")`
3. Reviews each security item, marks pass/fail with notes
4. Completes review with "changes-requested" status
5. Developer addresses issues and requests re-review
6. Design lead starts design-parity review in parallel
7. Both reviews approved → document ready for implementation

### Import OpenAPI Spec (R7: API Docs)

**Step 1: Import an OpenAPI spec from URL**
```
Use stea.importOpenAPI with:
- name: "Payment API v2"
- description: "Payment processing API documentation"
- specUrl: "https://api.example.com/openapi.json"
- projectId: <project ID> (optional)
```

This will:
- Fetch the OpenAPI spec from the URL
- Validate and parse the spec (supports OpenAPI 2.0, 3.0, 3.1)
- Upload spec to Cloud Storage
- Parse all endpoints with parameters, request/response schemas
- Generate code samples (curl, JavaScript, TypeScript) for each endpoint
- Create anchor links for deep linking
- Return specId and endpoint count

**Step 2: Import OpenAPI spec from content**
```
Use stea.importOpenAPI with:
- name: "Users API"
- specContent: "<paste your OpenAPI JSON or YAML here>"
```

**Step 3: List all imported specs**
```
Use stea.listAPISpecs with:
- projectId: <project ID> (optional filter)
- limit: 20 (default)
```

**Step 4: List endpoints from a spec**
```
Use stea.listAPIEndpoints with:
- specId: <spec ID from step 1>
- method: "GET" (optional filter)
- tags: ["users", "auth"] (optional filter)
- limit: 50 (default)
```

Returns endpoints with:
- Path, method, operation ID
- Summary and description
- Parameter count, request body, response count
- Anchor link for navigation
- Pre-generated code samples

### Sync Figma Components (R7: Component Docs)

**Step 1: Sync a Figma file**
```
Use stea.syncFigmaComponents with:
- figmaFileId: "abc123xyz" (from Figma file URL)
- figmaAccessToken: "<your Figma personal access token>"
- name: "Design System Components"
- projectId: <project ID> (optional)
```

To get your Figma file ID:
1. Open your Figma file
2. Look at the URL: `https://www.figma.com/file/ABC123XYZ/...`
3. The file ID is `ABC123XYZ`

To get a Figma access token:
1. Go to Figma → Account Settings → Personal Access Tokens
2. Click "Create new token"
3. Copy the token (keep it secure!)

This will:
- Fetch Figma file metadata (name, version, last modified)
- Extract all components and component sets
- Fetch component thumbnails (PNG, 2x scale)
- Parse variants (for component sets)
- Extract design tokens (colors, typography, spacing - basic extraction)
- Generate direct links to components in Figma
- Return file ID, component count, and sync time

**Step 2: List all synced Figma files**
```
Use stea.listFigmaFiles with:
- projectId: <project ID> (optional filter)
- limit: 20 (default)
```

**Step 3: List components from a file**
```
Use stea.listFigmaComponents with:
- fileId: <Figma file ID>
- type: "COMPONENT" | "COMPONENT_SET" | "all" (default: all)
- limit: 50 (default)
```

Returns components with:
- Node ID, name, description
- Component type (single or set)
- Variant count (for component sets)
- Thumbnail URL
- Direct Figma link

**Example Workflow**:
1. Import OpenAPI spec for your API: `importOpenAPI`
2. List endpoints: `listAPIEndpoints` → review code samples
3. Sync Figma design system: `syncFigmaComponents`
4. List components: `listFigmaComponents` → verify design tokens
5. Create Ruby doc linking both: `createRubyDoc` with references
6. Document publishes as unified API + Component reference

## Firestore Collections

The MCP server creates documents in these collections:

**Filo (Product Backlog)**:
- **stea_epics** - Top-level work items
- **stea_features** - Mid-level items nested under epics
- **stea_cards** - Detailed task cards nested under features

**Ruby (Documentation)**:
- **stea_doc_spaces** - Documentation spaces (collections/folders)
- **stea_docs** - Documentation documents with TipTap content
- **stea_doc_links** - Bi-directional links between docs and artifacts
- **stea_doc_assets** - Uploaded files (PDFs, images, etc.)
- **stea_doc_versions** - Document version history
- **stea_reviews** - Document reviews with checklist items and status (R5)
- **stea_api_specs** - Imported OpenAPI specifications metadata (R7)
- **stea_api_endpoints** - Parsed API endpoints with code samples (R7)
- **stea_figma_files** - Synced Figma file metadata (R7)
- **stea_figma_components** - Extracted Figma components with design tokens (R7)
- **stea_api_webhooks** - GitHub/GitLab webhook events for API spec updates (R7)
- **stea_figma_webhooks** - Figma webhook events for component updates (R7)
- **stea_broken_links** - Detected broken links in API specs and Figma URLs (R7)

### Data Schema

#### Epic
```typescript
{
  name: string
  description: string
  app: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  column: string
  size?: string | number
  createdBy: string
  createdAt: Timestamp
}
```

#### Feature
```typescript
{
  epicId: string  // parent Epic ID
  name: string
  description: string
  app: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  column: string
  size?: string | number
  createdBy: string
  createdAt: Timestamp
}
```

#### Card
```typescript
{
  epicId: string
  featureId: string  // parent Feature ID
  title: string
  description: string
  app: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  column: string
  size?: string | number
  testing?: {
    userStory?: string
    acceptanceCriteria?: string[]
    userFlow?: string[]
  }
  createdBy: string
  createdAt: Timestamp
}
```

#### Ruby Space
```typescript
{
  name: string
  icon: string  // emoji
  tenantId: string
  createdBy: string
  createdAt: Timestamp
}
```

#### Ruby Document
```typescript
{
  title: string
  content: object  // TipTap JSON format
  type: "documentation" | "note" | "architecture" | "meeting"
  spaceId: string
  tenantId: string
  draft?: boolean  // true for generated docs
  templateType?: "prs" | "buildspec" | "releasenotes"
  templateVersion?: string
  createdBy: string
  createdAt: Timestamp
  updatedBy: string
  updatedAt: Timestamp
}
```

#### DocLink
```typescript
{
  fromType: "epic" | "feature" | "card" | "document" | "note" | "test"
  fromId: string
  toType: "epic" | "feature" | "card" | "document" | "note" | "test"
  toId: string
  relation?: string  // e.g., "generated_from", "implements", "tests"
  tenantId: string
  createdBy: string
  createdAt: Timestamp
}
```

#### Review (R5)
```typescript
{
  docId: string
  docTitle: string
  checklistType: "accessibility" | "security" | "gdpr" | "design-parity" | "performance"
  checklistName: string
  items: [{
    id: string
    question: string
    category: string
    severity: "Critical" | "Major" | "Minor"
    guidance: string
    status: "pending" | "pass" | "fail" | "n/a"
    notes: string
    suggestedFix: string
    owner: string
  }]
  status: "in-review" | "approved" | "changes-requested"
  reviewerId: string
  reviewerName: string
  reviewerSignature?: string
  summary?: string
  tenantId: string
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
}
```

## Templates

The MCP server includes three YAML-based document templates:

### PRS (Product Requirements Spec)
Sections: Overview, Problem Statement, Target Audience, Goals & Success Metrics, User Stories, Acceptance Criteria, Technical Constraints, Assumptions, Risks & Mitigations, Dependencies, Out of Scope, Open Questions, Approval

**Use for**: Epics, Features, or Cards that need comprehensive product documentation

### BuildSpec (Build Specification)
Sections: Overview, User Story Context, Acceptance Criteria, Architecture (Components, Diagram), Data Model, API Specification, UI/UX Requirements, Technical Constraints, Dependencies, Error Handling, Testing Strategy, Security Considerations, Performance Requirements, Rollout Plan, Open Questions, Sign-off

**Use for**: Features or Cards that need technical implementation details

### ReleaseNotes
Sections: New Features, Improvements, Bug Fixes, Breaking Changes, Known Issues, Test Results, Deployment, Documentation, Links & Evidence, Contributors, Approval

**Use for**: Epics representing releases or standalone release documentation

## Review Checklists (R5)

The MCP server includes five YAML-based review checklists:

### Accessibility (WCAG 2.1 Level AA)
**10 items**: Alt text, color contrast, keyboard navigation, form labels, heading hierarchy, ARIA attributes, focus indication, table structure, text resizing, reduced motion

**Use for**: Ensuring documents and implementations meet accessibility standards

### Security
**14 items**: Input validation, authentication, authorization, encryption (transit/rest), SQL injection prevention, XSS prevention, CSRF protection, secrets management, rate limiting, error message sanitization, file upload security, security headers, logging

**Use for**: Security review of technical designs and implementations

### GDPR Compliance
**15 items**: Legal basis, privacy notice, consent management, data subject rights (access/rectification/erasure/portability), data minimization, retention periods, security measures, third-party processors, international transfers, DPIA requirements, breach notification

**Use for**: Ensuring features comply with data privacy regulations

### Design Parity
**12 items**: Figma design match, design tokens usage, spacing/layout grid, typography accuracy, interactive states, animations/transitions, component variants, responsive breakpoints, icons/illustrations, loading/empty states, dark mode, micro-interactions

**Use for**: Verifying implementation matches design specifications

### Performance
**14 items**: Core Web Vitals (LCP/FID/CLS), image optimization, JavaScript bundles, fonts, CSS optimization, API calls, database queries, third-party scripts, caching strategy, render-blocking resources, server response time (TTFB), list rendering, memory usage, animations (60fps)

**Use for**: Performance optimization review

## Firestore Composite Indexes

For optimal query performance, create these composite indexes in Firebase Console:

1. **stea_features**
   - Fields: `epicId` (Ascending), `priority` (Ascending)

2. **stea_cards**
   - Fields: `featureId` (Ascending), `priority` (Ascending)

3. **(Optional)** **stea_cards**
   - Fields: `epicId` (Ascending), `priority` (Ascending)

Go to: Firebase Console → Firestore Database → Indexes → Create Index

## Troubleshooting

### "STEa MCP server not found"
- Verify the path in `claude_desktop_config.json` is absolute and correct
- Make sure you restarted Claude Desktop after config changes

### "TENANT_ID environment variable is required" error
- Add `TENANT_ID` to your MCP server `env` configuration
- Get your tenant ID from Firestore → `tenants` collection → your workspace document ID
- This is required for multi-tenant security to prevent cross-tenant data access

### "Permission denied" errors
- Ensure your Firebase service account has Firestore read/write permissions
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file
- Verify the `TENANT_ID` matches a tenant you have access to

### "Epic not found" when creating Feature
- Use `stea.listEpics` to verify the Epic ID exists
- Make sure you're using the full Epic ID string

### Tools not appearing in Claude
- Check Claude Desktop logs for errors
- Verify JSON syntax in config file (use a JSON validator)
- Try `npx ts-node servers/stea-mcp.ts` manually to test for errors

## Security Notes

- The MCP server runs **locally** on your machine
- It uses Firebase Admin SDK (bypasses security rules)
- **Never commit** Firebase credentials to git
- Keep your service account key secure
- The server is not deployed to Vercel (local dev only)
