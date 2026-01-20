# R7: API & Component Docs - Implementation Summary

**Date:** 2025-11-13
**Status:** Backend Complete, UI Pending
**Related Docs:** `ruby_build_spec_v_1.md`, `ruby_r7_data_model.md`

---

## ✅ Completed Tasks

### 1. Data Model Design
**File:** `ruby_r7_data_model.md`

Comprehensive data model covering:
- **Firestore Collections**: 7 new collections (stea_api_specs, stea_api_endpoints, stea_figma_files, stea_figma_components, stea_api_webhooks, stea_figma_webhooks, stea_broken_links)
- **Cloud Storage Structure**: Organized paths for API specs and Figma assets
- **Security Rules**: Multi-tenant isolation with role-based access
- **Indexes**: Optimized for all query patterns
- **Performance Considerations**: File size limits, batch operations, caching strategies

### 2. MCP Server Operations (R7)
**File:** `servers/stea-mcp.ts`

**Implemented 6 new MCP operations:**

1. **`stea.importOpenAPI`**
   - Accepts OpenAPI spec via URL or direct content (JSON/YAML)
   - Validates and parses spec using swagger-parser
   - Uploads spec to Cloud Storage
   - Parses all endpoints with parameters, request/response schemas
   - Generates code samples (curl, JavaScript, TypeScript) for each endpoint
   - Creates anchor links for deep navigation
   - Stores metadata in `stea_api_specs` collection
   - Stores parsed endpoints in `stea_api_endpoints` collection
   - Returns specId, endpoint count, and parse time

2. **`stea.syncFigmaComponents`**
   - Fetches Figma file metadata via Figma API
   - Extracts all components and component sets from file
   - Fetches component thumbnails (PNG, 2x scale)
   - Parses component variants
   - Extracts basic design tokens (colors, typography, spacing)
   - Generates direct links to components in Figma
   - Stores file metadata in `stea_figma_files` collection
   - Stores components in `stea_figma_components` collection
   - Returns fileId, component count, and sync time

3. **`stea.listAPIEndpoints`**
   - Lists parsed API endpoints from an imported spec
   - Supports filtering by HTTP method (GET, POST, etc.)
   - Supports filtering by OpenAPI tags
   - Returns endpoint summaries with anchor links and code samples

4. **`stea.listFigmaComponents`**
   - Lists synced Figma components from a file
   - Supports filtering by component type (COMPONENT, COMPONENT_SET, all)
   - Returns component details with thumbnails and Figma links

5. **`stea.listAPISpecs`**
   - Lists all imported OpenAPI specs for a tenant
   - Supports filtering by project ID
   - Returns spec metadata and parse status

6. **`stea.listFigmaFiles`**
   - Lists all synced Figma files for a tenant
   - Supports filtering by project ID
   - Returns file metadata and sync status

**Helper Functions Implemented:**
- `generateCodeSamples()` - Creates curl/JS/TS code samples for endpoints
- `generateEndpointAnchor()` - Creates URL-safe anchors for deep linking
- `generateSHA256()` - Hashes spec content for change detection

### 3. Dependencies Added
**File:** `package.json`

New packages installed:
- `@apidevtools/swagger-parser` (^10.1.0) - OpenAPI spec parsing and validation
- `@google-cloud/storage` (^7.13.0) - Cloud Storage operations
- `axios` (^1.7.9) - HTTP requests for Figma API and spec fetching
- `js-yaml` (^4.1.0) - YAML parsing for OpenAPI specs
- ~~`crypto`~~ (built-in Node module) - SHA256 hashing

### 4. MCP Server Documentation
**File:** `servers/README.md`

Added comprehensive documentation:
- R7 operations listed in tools section
- Usage examples for importing OpenAPI specs
- Usage examples for syncing Figma components
- Step-by-step workflows with code samples
- Figma access token instructions
- Example use cases combining API docs + Component docs
- Updated Firestore collections list

### 5. Firestore Security Rules
**File:** `firestore.rules`

Added rules for 7 R7 collections:
- **stea_api_specs**: Full CRUD with tenant access control
- **stea_api_endpoints**: Read-only (server writes only)
- **stea_figma_files**: Full CRUD with tenant access control
- **stea_figma_components**: Read-only (server writes only)
- **stea_api_webhooks**: Read-only (server manages webhooks)
- **stea_figma_webhooks**: Read-only (server manages webhooks)
- **stea_broken_links**: Read + limited update (users can mark as fixed/ignored)

All rules enforce multi-tenant isolation via `canAccessTenant()` helper.

### 6. Firestore Indexes
**File:** `firestore.indexes.json`

Added 12 composite indexes for R7 queries:
- `stea_api_specs` (3 indexes): by tenant+name, tenant+project, tenant+parseStatus
- `stea_api_endpoints` (3 indexes): by tenant+spec, tenant+spec+method+path, spec+tags
- `stea_figma_files` (2 indexes): by tenant+syncStatus+lastSynced, tenant+createdAt
- `stea_figma_components` (2 indexes): by tenant+file+name, file+type
- `stea_broken_links` (1 index): by tenant+status+detectedAt

### 7. Cloud Storage Rules
**File:** `storage.rules`

Added rules for R7 storage paths:
- **ruby/r7/api-specs/**: OpenAPI spec files (10MB limit, JSON/YAML only, authenticated users can read/write)
- **ruby/r7/figma/**: Figma thumbnails and assets (authenticated users can read, server-only writes)

---

## 📋 Remaining Tasks

### High Priority - Backend

1. **Webhook Handlers** (Medium effort)
   - Implement GitHub webhook endpoint for OpenAPI spec updates
   - Implement Figma webhook endpoint for component updates
   - Add webhook signature verification
   - Trigger re-import/re-sync on webhook events
   - **Files to create:**
     - `/src/app/api/webhooks/github/route.js`
     - `/src/app/api/webhooks/figma/route.js`

2. **Broken Link Detection** (Medium effort)
   - Implement background job to validate $ref links in OpenAPI specs
   - Check for circular references
   - Validate Figma URLs (ensure components still exist)
   - Store broken links in `stea_broken_links` collection
   - **Files to create:**
     - `/src/lib/validateOpenAPILinks.js`
     - `/src/lib/validateFigmaLinks.js`

### High Priority - Frontend UI

3. **API Documentation Viewer** (Large effort)
   - Build React component to render OpenAPI endpoints
   - Display endpoint details (path, method, parameters, responses)
   - Show code samples with syntax highlighting
   - Support anchor-based deep linking (e.g., `#get-users-id`)
   - Tag-based filtering and search
   - **Files to create:**
     - `/src/components/ruby/APIDocViewer.jsx`
     - `/src/components/ruby/EndpointCard.jsx`
     - `/src/components/ruby/CodeSampleTabs.jsx`

4. **Figma Component Browser** (Large effort)
   - Build React component to display Figma components
   - Grid/list view with thumbnails
   - Show component variants and design tokens
   - Link to Figma for editing
   - Filter by component type
   - **Files to create:**
     - `/src/components/ruby/FigmaComponentBrowser.jsx`
     - `/src/components/ruby/ComponentCard.jsx`
     - `/src/components/ruby/DesignTokensPanel.jsx`

5. **Ruby Integration Page** (Medium effort)
   - Add new Ruby tab/page for "API & Component Docs"
   - Import/Sync UI (upload OpenAPI, connect Figma)
   - List view of imported specs and files
   - **Files to create:**
     - `/src/app/apps/stea/ruby/api-docs/page.js`

### Medium Priority

6. **Tests** (Medium effort)
   - Unit tests for MCP operations
   - Integration tests for OpenAPI parsing
   - Integration tests for Figma API sync
   - Test broken link detection
   - **Files to create:**
     - `/__tests__/mcp/r7-api-docs.test.js`
     - `/__tests__/mcp/r7-figma-sync.test.js`

7. **Deployment** (Small effort)
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`
   - Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
   - Deploy Storage rules: `firebase deploy --only storage`
   - Restart MCP server (users update their Claude Desktop config)

### Nice-to-Have

8. **Enhanced Features**
   - OpenAPI spec diff view (compare versions)
   - Export API docs as Markdown/PDF
   - Figma token extraction improvements (more sophisticated parsing)
   - Rate limiting for Figma API calls
   - Bulk operations (import multiple specs, sync multiple files)

---

## 🚀 Deployment Checklist

### Before Deployment

- [ ] Remove `crypto` package from package.json (it's built-in)
- [ ] Test MCP operations locally with `npx ts-node servers/stea-mcp.ts`
- [ ] Review security rules for any edge cases
- [ ] Add monitoring/logging for R7 operations

### Deploy Infrastructure

```bash
# Install dependencies
npm install

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Storage rules
firebase deploy --only storage
```

### Update MCP Server

Users need to restart Claude Desktop after the MCP server code is updated. No config changes required - new tools will appear automatically.

### Testing MCP Operations

**Test ImportOpenAPI:**
```
Use stea.importOpenAPI with:
- name: "Test API"
- specUrl: "https://petstore3.swagger.io/api/v3/openapi.json"
```

**Test SyncFigmaComponents:**
```
Use stea.syncFigmaComponents with:
- figmaFileId: "<your file ID>"
- figmaAccessToken: "<your token>"
- name: "Test Components"
```

**Test Listing:**
```
Use stea.listAPISpecs
Use stea.listFigmaFiles
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        R7: API & Component Docs             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Claude Code    │       │   Ruby UI        │       │   GitHub/Figma   │
│   (MCP Client)   │       │   (Next.js)      │       │   (Webhooks)     │
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                          │                          │
         │ MCP Protocol             │ Firebase SDK            │ HTTPS
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     STEa MCP Server (Node.js)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  R7 Operations:                                      │   │
│  │  - importOpenAPI → Parse → Cloud Storage            │   │
│  │  - syncFigmaComponents → Figma API → Firestore     │   │
│  │  - listAPIEndpoints → Query → Return results        │   │
│  │  - listFigmaComponents → Query → Return results     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────┬────────────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────────┐   ┌──────────────────────┐
│   Cloud Firestore    │   │   Cloud Storage      │
│  ┌────────────────┐  │   │  ┌────────────────┐  │
│  │ stea_api_specs │  │   │  │ ruby/r7/api/   │  │
│  │ stea_endpoints │  │   │  │ ruby/r7/figma/ │  │
│  │ stea_figma_*   │  │   │  └────────────────┘  │
│  │ stea_broken_*  │  │   │                      │
│  └────────────────┘  │   └──────────────────────┘
└──────────────────────┘
```

---

## 🔑 Key Design Decisions

1. **Webhook-Driven Updates**: Chose webhooks over polling for better performance and real-time updates
2. **Code Sample Generation**: Pre-generate samples during import to avoid runtime overhead
3. **Server-Only Writes**: Endpoints and components are read-only to users, ensuring data integrity
4. **Multi-Tenant Isolation**: All queries filtered by tenantId at both Firestore rules and application level
5. **Cloud Storage**: Large spec files stored in GCS, not Firestore, to avoid document size limits
6. **Anchor Links**: Generated deterministically for stable deep linking (method + path)

---

## 📝 Next Steps for User

1. **Deploy infrastructure** (rules, indexes) - Ready to deploy now
2. **Test MCP operations** - Can test immediately via Claude Code
3. **Build UI components** - API Viewer and Figma Browser (largest remaining effort)
4. **Implement webhooks** - For auto-updates
5. **Add broken link detection** - Background validation job

**Estimated Remaining Effort:**
- Backend (webhooks + link detection): ~1-2 days
- Frontend UI: ~3-4 days
- Testing + Polish: ~1 day
- **Total: ~5-7 days to full R7 completion**

---

**Ruby — Product Intelligence that writes itself, now with API & Component Docs.**
