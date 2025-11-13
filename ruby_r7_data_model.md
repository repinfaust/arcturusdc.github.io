# Ruby R7: API & Component Docs - Data Model Design

**Version:** 1.0
**Date:** 2025-11-13
**Related:** ruby_build_spec_v_1.md (R7)

---

## Overview

This document defines the data model for R7: API & Component Docs feature, which enables:
1. **API Documentation**: Import and render OpenAPI specs with navigable reference, anchor links, and code samples
2. **Figma Component Docs**: Sync with Figma to display components, variants, design tokens, and thumbnails

**Storage Strategy:**
- **Firestore**: Metadata, parsed endpoints, component data, webhook tracking, link validation
- **Cloud Storage**: Full OpenAPI spec files, Figma thumbnails/assets
- **Updates**: Webhook-driven (GitHub for OpenAPI, Figma webhooks for components)

---

## Firestore Collections

### 1. `stea_api_specs`
Stores metadata for imported OpenAPI specifications.

**Document ID**: Auto-generated
**Schema**:
```typescript
{
  id: string;                    // Firestore doc ID
  tenantId: string;              // Multi-tenant isolation
  projectId?: string;            // Optional project association
  docId?: string;                // Optional linked Ruby doc

  // Spec metadata
  name: string;                  // User-friendly name
  description?: string;
  version: string;               // OpenAPI spec version (e.g., "1.2.3")
  openApiVersion: string;        // OpenAPI format version (e.g., "3.0.0")

  // Storage
  storageUrl: string;            // Cloud Storage path to spec file
  storageBucket: string;         // GCS bucket name
  storagePath: string;           // Path within bucket
  fileSize: number;              // File size in bytes
  sha256: string;                // Hash for change detection

  // Parse status
  parseStatus: 'pending' | 'parsing' | 'success' | 'error';
  parseError?: string;
  parsedAt?: Date;

  // Webhook tracking
  webhookUrl?: string;           // GitHub/GitLab webhook URL
  webhookSecret?: string;        // Webhook verification secret
  sourceRepo?: string;           // e.g., "org/repo"
  sourceBranch?: string;         // e.g., "main"
  sourcePath?: string;           // Path in repo

  // Stats
  endpointCount: number;         // Total operations
  brokenLinkCount: number;       // Tracked broken refs
  lastValidated?: Date;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;

  // Search
  searchTokens: string[];        // For fuzzy search
}
```

**Indexes**:
- `(tenantId, name)`
- `(tenantId, projectId)`
- `(tenantId, docId)`
- `(tenantId, parseStatus)`

---

### 2. `stea_api_endpoints`
Stores parsed API endpoints/operations from OpenAPI specs.

**Document ID**: Auto-generated
**Schema**:
```typescript
{
  id: string;
  specId: string;                // Reference to stea_api_specs
  tenantId: string;

  // Endpoint details
  path: string;                  // e.g., "/users/{id}"
  method: string;                // GET, POST, PUT, DELETE, PATCH
  operationId?: string;          // OpenAPI operationId
  summary: string;
  description?: string;
  tags: string[];                // API grouping tags

  // Parameters
  parameters: Array<{
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    schema: object;              // JSON schema
    description?: string;
  }>;

  // Request body
  requestBody?: {
    required: boolean;
    contentType: string;         // e.g., "application/json"
    schema: object;
    examples?: object;
  };

  // Responses
  responses: Array<{
    statusCode: string;          // e.g., "200", "404"
    description: string;
    contentType?: string;
    schema?: object;
    examples?: object;
  }>;

  // Security
  security?: Array<{
    type: string;                // bearer, apiKey, oauth2, etc.
    name: string;
    in?: string;
  }>;

  // Code samples (generated)
  codeSamples: {
    curl?: string;
    javascript?: string;
    typescript?: string;
  };

  // Anchor for deep linking
  anchor: string;                // e.g., "get-users-id"

  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `(tenantId, specId)`
- `(tenantId, specId, method, path)` - Unique constraint
- `(specId, tags)` - For filtering by tag

---

### 3. `stea_figma_files`
Stores metadata for synced Figma files.

**Document ID**: Figma file ID (e.g., "abc123xyz")
**Schema**:
```typescript
{
  id: string;                    // Figma file ID (used as doc ID)
  tenantId: string;
  projectId?: string;
  docId?: string;                // Linked Ruby doc

  // Figma metadata
  name: string;
  key: string;                   // Figma file key
  url: string;                   // Link to Figma file
  version: string;               // Figma version ID
  lastModified: Date;            // From Figma API

  // Access
  accessToken: string;           // Encrypted Figma personal/team token
  webhookId?: string;            // Figma webhook ID

  // Sync status
  syncStatus: 'pending' | 'syncing' | 'success' | 'error';
  syncError?: string;
  lastSyncedAt?: Date;
  nextSyncAt?: Date;             // For polling fallback

  // Stats
  componentCount: number;
  styleCount: number;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;

  // Search
  searchTokens: string[];
}
```

**Indexes**:
- `(tenantId, name)`
- `(tenantId, projectId)`
- `(tenantId, syncStatus)`

---

### 4. `stea_figma_components`
Stores individual Figma components extracted from files.

**Document ID**: Auto-generated
**Schema**:
```typescript
{
  id: string;
  fileId: string;                // Reference to stea_figma_files
  tenantId: string;

  // Component details
  nodeId: string;                // Figma node ID
  name: string;
  description?: string;
  type: 'COMPONENT' | 'COMPONENT_SET';

  // Variants (for component sets)
  variants?: Array<{
    name: string;                // Variant property name
    values: string[];            // Possible values
  }>;

  // Design tokens
  tokens: {
    colors?: Array<{
      name: string;
      value: string;             // Hex, RGB, etc.
      type: 'fill' | 'stroke';
    }>;
    typography?: Array<{
      name: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
    }>;
    spacing?: Array<{
      name: string;
      value: number;
    }>;
  };

  // Visual assets
  thumbnailUrl?: string;         // Cloud Storage URL
  thumbnailStoragePath?: string;
  previewUrl?: string;           // Figma render URL (temp, 30-day expiry)

  // Links
  figmaUrl: string;              // Direct link to component in Figma

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `(tenantId, fileId)`
- `(tenantId, fileId, name)`
- `(fileId, type)`

---

### 5. `stea_api_webhooks`
Tracks webhook events for API spec updates.

**Document ID**: Auto-generated
**Schema**:
```typescript
{
  id: string;
  specId: string;
  tenantId: string;

  // Event details
  source: 'github' | 'gitlab' | 'bitbucket' | 'manual';
  event: string;                 // e.g., "push", "pull_request.merged"
  payload: object;               // Full webhook payload (sanitized)

  // Processing
  processStatus: 'pending' | 'processing' | 'success' | 'error';
  processError?: string;

  // Changes detected
  specChanged: boolean;
  oldSha256?: string;
  newSha256?: string;

  // Audit
  receivedAt: Date;
  processedAt?: Date;
}
```

**Indexes**:
- `(specId, receivedAt DESC)`
- `(tenantId, processStatus)`

---

### 6. `stea_figma_webhooks`
Tracks Figma webhook events for component updates.

**Document ID**: Auto-generated
**Schema**:
```typescript
{
  id: string;
  fileId: string;
  tenantId: string;

  // Event details
  event: 'FILE_UPDATE' | 'FILE_VERSION_UPDATE' | 'LIBRARY_PUBLISH';
  passcode: string;              // Figma webhook passcode
  payload: object;

  // Processing
  processStatus: 'pending' | 'processing' | 'success' | 'error';
  processError?: string;

  // Changes
  componentsAdded: number;
  componentsUpdated: number;
  componentsDeleted: number;

  // Audit
  receivedAt: Date;
  processedAt?: Date;
}
```

**Indexes**:
- `(fileId, receivedAt DESC)`
- `(tenantId, processStatus)`

---

### 7. `stea_broken_links`
Tracks broken references in API specs (e.g., invalid $ref, missing schemas).

**Document ID**: Auto-generated
**Schema**:
```typescript
{
  id: string;
  specId?: string;               // For API docs
  fileId?: string;               // For Figma docs
  tenantId: string;

  // Link details
  linkType: 'schema_ref' | 'component_ref' | 'example_ref' | 'figma_url';
  source: string;                // Where the link appears
  target: string;                // What it points to
  errorType: '404' | 'invalid' | 'circular' | 'unauthorized';
  errorMessage: string;

  // Status
  status: 'open' | 'fixed' | 'ignored';
  resolvedAt?: Date;
  resolvedBy?: string;

  // Audit
  detectedAt: Date;
  lastCheckedAt: Date;
}
```

**Indexes**:
- `(specId, status)`
- `(fileId, status)`
- `(tenantId, status, detectedAt DESC)`

---

## Cloud Storage Structure

### Buckets
- **Main bucket**: `{project-id}.appspot.com` (default Firebase Storage)
- **Path prefix**: `ruby/r7/`

### API Specs
```
ruby/r7/api-specs/{tenantId}/{specId}/
  - spec.json              # Full OpenAPI spec (JSON)
  - spec.yaml              # Full OpenAPI spec (YAML)
  - metadata.json          # Additional metadata
  - versions/              # Historical versions
    - v1.0.0_spec.json
    - v1.1.0_spec.json
```

### Figma Assets
```
ruby/r7/figma/{tenantId}/{fileId}/
  - components/
    - {componentId}_thumbnail.png
    - {componentId}_preview.svg
  - thumbnails/
    - file_thumbnail.png
  - tokens/
    - colors.json
    - typography.json
    - spacing.json
```

---

## Security Rules

### Firestore Rules (additions to `firestore.rules`)

```javascript
// R7: API Specs
match /stea_api_specs/{specId} {
  allow read: if isTenantMember(request.auth, resource.data.tenantId);
  allow create: if isTenantMember(request.auth, request.resource.data.tenantId)
                && request.resource.data.createdBy == request.auth.token.email;
  allow update: if isTenantMember(request.auth, resource.data.tenantId);
  allow delete: if isTenantAdmin(request.auth, resource.data.tenantId);
}

match /stea_api_endpoints/{endpointId} {
  allow read: if isTenantMemberBySpecId(request.auth, resource.data.specId);
  allow write: if false; // Only server can write
}

// R7: Figma Files
match /stea_figma_files/{fileId} {
  allow read: if isTenantMember(request.auth, resource.data.tenantId);
  allow create: if isTenantMember(request.auth, request.resource.data.tenantId);
  allow update: if isTenantMember(request.auth, resource.data.tenantId);
  allow delete: if isTenantAdmin(request.auth, resource.data.tenantId);
}

match /stea_figma_components/{componentId} {
  allow read: if isTenantMemberByFileId(request.auth, resource.data.fileId);
  allow write: if false; // Only server can write
}

match /stea_broken_links/{linkId} {
  allow read: if isTenantMember(request.auth, resource.data.tenantId);
  allow update: if isTenantMember(request.auth, resource.data.tenantId)
                && request.resource.data.keys().hasOnly(['status', 'resolvedAt', 'resolvedBy']);
  allow write: if false; // Create/delete server-only
}
```

### Storage Rules (additions to `storage.rules`)

```javascript
match /ruby/r7/api-specs/{tenantId}/{specId}/{allPaths=**} {
  allow read: if request.auth != null
              && isTenantMember(tenantId);
  allow write: if request.auth != null
               && isTenantMember(tenantId)
               && request.resource.size < 10 * 1024 * 1024; // 10MB limit
}

match /ruby/r7/figma/{tenantId}/{fileId}/{allPaths=**} {
  allow read: if request.auth != null
              && isTenantMember(tenantId);
  allow write: if false; // Server-only (Figma sync)
}
```

---

## Indexes Required

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "stea_api_specs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stea_api_endpoints",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "specId", "order": "ASCENDING" },
        { "fieldPath": "method", "order": "ASCENDING" },
        { "fieldPath": "path", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stea_figma_files",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "syncStatus", "order": "ASCENDING" },
        { "fieldPath": "lastSyncedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stea_figma_components",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "fileId", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stea_broken_links",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "detectedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Migration Notes

1. **No existing data to migrate** - R7 is a new feature
2. **Firestore indexes** will be created on first deployment
3. **Security rules** must be updated before feature launch
4. **Cloud Storage bucket** - use existing Firebase Storage bucket with new path prefix

---

## Performance Considerations

1. **Spec file size**: Limit to 10MB per OpenAPI file
2. **Endpoint parsing**: Batch parse in Cloud Function (max 5min timeout)
3. **Figma sync**: Rate limit to avoid API quota exhaustion (150 requests/minute)
4. **Thumbnail caching**: Store in Cloud Storage with 1-year cache headers
5. **Broken link validation**: Run async validation job, not inline

---

## Next Steps

1. Update `firestore.rules` with R7 security rules
2. Update `firestore.indexes.json` with R7 indexes
3. Update `storage.rules` with R7 access rules
4. Deploy rules: `firebase deploy --only firestore:rules,firestore:indexes,storage`
5. Implement MCP operations (see Tasks 2-5)
6. Build UI components (see Tasks 11-12)
