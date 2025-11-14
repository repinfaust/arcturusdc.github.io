# STEa Testing Documentation Index

## Quick Navigation

### Primary Test Plan Documents

**1. Comprehensive Test Plan** (1,473 lines, 42KB)
- **File:** `stea_comprehensive_test_plan.md`
- **Content:** Detailed test cases, user flows, data models, edge cases
- **Use:** Day-to-day testing reference, test execution checklist
- **Target Audience:** QA Engineers, Test Automation Engineers

**2. Test Plan Summary** (298 lines, 9.7KB)
- **File:** `TEST_PLAN_SUMMARY.md`
- **Content:** Overview, execution plan, critical sequences, known limitations
- **Use:** Quick reference, status updates, stakeholder communication
- **Target Audience:** Project Managers, Stakeholders, Test Lead

---

## Testing Coverage by Feature

### 1. Ruby Documentation Module (Section 1)

**What's Being Tested:**
- Multi-space document organization
- Rich text editor with TipTap (formatting, blocks, special elements)
- Asset management (upload, storage, insertion, deletion)
- Document-to-artifact linking system (DocLinks - bidirectional)
- Template-based document generation
- Search and filtering

**Key Files to Test:**
- `/src/app/apps/stea/ruby/page.js` - Main page (spaces + list)
- `/src/components/RubyEditor.js` - Editor component
- `/src/app/api/ruby/create-from-source/route.js` - API for doc creation

**Firestore Collections:**
- `stea_doc_spaces/` - Space containers
- `stea_docs/` - Documents (TipTap JSON content)
- `stea_doc_links/` - Bidirectional links
- `stea_doc_assets/` - File uploads

**Estimated Test Time:** 3-4 hours
**Number of Test Cases:** 75+
**Critical Flows:** 4 (create space, create doc, search, lifecycle)

**See Also:**
- Section 1.2: Ruby Documentation Page (user flows + test cases)
- Section 1.3: RubyEditor Component (toolbar + asset management)
- Section 1.4: DocLink System (cross-artifact references)

---

### 2. Hans Testing Suite (Section 2)

**What's Being Tested:**
- Test case creation from Filo cards
- Test execution tracking (status changes)
- Test notes and acceptance criteria validation
- Public test case sharing (tokens + expiry)
- Closed-loop workflow (failed test → create bug card in Filo)
- App-specific test pages (new route: `/apps/stea/hans/[app]`)
- Multi-tenant isolation

**Key Files to Test:**
- `/src/app/apps/stea/hans/page.js` - Main dashboard
- `/src/app/apps/stea/hans/[app]/page.js` - App-specific page (NEW)
- `/src/app/api/hans/createFromCard/route.js` - Create test from card API

**Firestore Collections:**
- `hans_cases/` - Test cases with public sharing tokens

**Estimated Test Time:** 2-3 hours
**Number of Test Cases:** 50+
**Critical Flows:** 4 (view stats, test lifecycle, create card, public token)

**See Also:**
- Section 2.2: Hans Main Dashboard (statistics, app cards, test cases)
- Section 2.3: App-Specific Hans Page (dynamic routes, filtering)
- Section 2.4: Create Test Case from Filo Card (API security + tokens)

---

### 3. Stripe Payment & Workspace Claiming (Section 3)

**What's Being Tested:**
- Stripe checkout session creation
- Custom field capture (workspace name, Google email)
- Discount code support (including 100% off codes)
- Webhook event processing (6 event types)
- Pending workspace creation with claim tokens
- Email-based workspace claiming
- Email validation (case-insensitive, trimmed)
- Error handling (expired tokens, email mismatch, already claimed)

**Key Files to Test:**
- `/src/app/api/create-checkout-session/route.js` - Checkout creation
- `/src/app/api/webhooks/stripe/route.js` - Webhook handler
- `/src/app/api/claim-workspace/route.js` - Claim API (GET + POST)

**Firestore Collections:**
- `pendingWorkspaces/` - Temporary claim records (7-day TTL)
- `stea_subscriptions/` - Subscription tracking
- `stea_purchases/` - One-time payment tracking
- `stea_payments/` - Invoice payment logs

**Estimated Test Time:** 2-3 hours
**Number of Test Cases:** 45+
**Critical Flows:** 3 (checkout, webhook, claim)

**See Also:**
- Section 3.2: Create Checkout Session (custom fields, discount codes)
- Section 3.3: Stripe Webhook Handler (event types, Firestore writes)
- Section 3.4: Claim Workspace (GET details, POST claim, email validation)
- Section 3.5: Discount Code Support (100% off handling)

---

### 4. Workspace Pulse Dashboard (Section 4)

**What's Being Tested:**
- Real-time workspace health dashboard
- 5 metric tiles (Build Progress, Testing, Backlog, Discovery, Documentation)
- App-specific filtering
- Deep links to individual modules
- Admin configuration (select which apps to track)
- Real-time Firestore listener updates
- Metric aggregation (5 functions, each aggregating different data)
- Cloud Function integration

**Key Files to Test:**
- `/src/components/workspace/WorkspacePulse.jsx` - Dashboard component
- `/src/lib/workspacePulseAggregator.js` - Metrics calculation library
- `/src/components/admin/TenantAppsManager.jsx` - Admin app selection
- `/src/components/workspace/tiles/*.jsx` - Individual tile components

**Firestore Collections:**
- `tenants/{tenantId}/dashboard/metrics` - Aggregated metrics

**Estimated Test Time:** 2-3 hours
**Number of Test Cases:** 50+
**Critical Flows:** 3 (view dashboard, filter by app, click tile)

**See Also:**
- Section 4.2: WorkspacePulse Component (UI, real-time updates, deep links)
- Section 4.3: Workspace Pulse Aggregator (metric calculations)
- Section 4.4: Tenant Apps Manager (admin configuration)

---

## Test Execution Roadmap

### Phase 1: Core Functionality (Day 1)
- [ ] Ruby: Create space, create document, edit, delete
- [ ] Hans: View statistics, create test case, update status
- [ ] Stripe: Checkout session, claim workspace
- [ ] Dashboard: Load dashboard, view metrics

**Estimated Time:** 2-3 hours

### Phase 2: Features & Integration (Day 2)
- [ ] Ruby: Template system, asset uploads, search
- [ ] Hans: App-specific pages, closed-loop card creation
- [ ] Stripe: Webhook processing, email claims
- [ ] Dashboard: Real-time updates, app filtering

**Estimated Time:** 3-4 hours

### Phase 3: Edge Cases & Security (Day 3)
- [ ] Ruby: DocLink search, bidirectional links, special characters
- [ ] Hans: Public tokens, expiry, multi-tenant isolation
- [ ] Stripe: Email mismatch, expired tokens, 100% discount
- [ ] Dashboard: Aggregation with large datasets

**Estimated Time:** 2-3 hours

### Phase 4: Cross-Module & Performance (Day 4)
- [ ] Ruby → Filo document links (CTA)
- [ ] Hans → Filo closed-loop (CTA)
- [ ] Dashboard → Module deep links
- [ ] Performance under load
- [ ] Browser compatibility

**Estimated Time:** 2-3 hours

**Total Estimated Time:** 10-15 hours

---

## Critical Test Sequences (Must Pass)

### Sequence 1: New Workspace from Payment to Usage
```
1. Stripe checkout (custom fields + discount)
   ↓
2. Webhook creates pending workspace
   ↓
3. Claim email sent
   ↓
4. User claims with email validation
   ↓
5. Workspace created and ready
   ↓
6. Admin configures apps
   ↓
7. Users create content
   ↓
8. Dashboard aggregates and displays metrics
```

### Sequence 2: Test Case from Creation to Card
```
1. Create test case from Filo card
   ↓
2. Execute test (mark as failed)
   ↓
3. Click "Create STEa Card (Fail)"
   ↓
4. Card modal pre-fills with test data
   ↓
5. Card created in Filo
   ↓
6. Card linked to original test case
```

### Sequence 3: Documentation Cross-Linking
```
1. Create document in Ruby
   ↓
2. Create DocLink to Filo feature
   ↓
3. Feature shows incoming link to document
   ↓
4. Document shows outgoing link to feature
   ↓
5. Click link → navigate to artifact
```

---

## Test Data Setup

### Ruby Test Data
```javascript
// Create test space
stea_doc_spaces: {
  name: "Test Documentation",
  icon: "📚",
  tenantId: "test-workspace"
}

// Create test document
stea_docs: {
  title: "Test Doc",
  type: "documentation",
  spaceId: "...",
  tenantId: "test-workspace"
}
```

### Hans Test Data
```javascript
// Create test case
hans_cases: {
  app: "TestApp",
  title: "Login Test",
  status: "open",
  priority: "high",
  tenantId: "test-workspace"
}
```

### Workspace Test Data
```javascript
// Set up for Dashboard testing
tenants: {
  apps: ["TestApp", "OtherApp"]
}

// Mock metrics
tenants/test-workspace/dashboard/metrics: {
  buildProgress: { apps: [...] },
  testingSnapshot: { pass: 10, fail: 2, ... }
  // ...
}
```

---

## Security Checklist

- [ ] Tenant isolation enforced (all queries include tenantId)
- [ ] API endpoints verify user's tenantId
- [ ] Session cookies validated
- [ ] Claim tokens cryptographically random (32 hex)
- [ ] Public test tokens are read-only (no modify)
- [ ] Webhook signatures verified
- [ ] Email validation case-insensitive & trimmed
- [ ] No sensitive data in URLs (except random tokens)
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info

---

## Performance Targets

- Ruby home page: <2s load (1000+ docs)
- Document search: <500ms filter
- Editor initialization: <1s
- Hans dashboard: <2s load (500+ test cases)
- Workspace Pulse aggregation: <10s initial, <2s updates
- Real-time listener: <2s for metric changes
- Asset upload: progress visible immediately

---

## Browser Support Matrix

| Browser | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Chrome | Latest | Yes | Yes |
| Firefox | Latest | Yes | Yes |
| Safari | Latest | Yes | iOS 15+ |
| Edge | Latest | Yes | Yes |

---

## Known Issues & Limitations

### Not Yet Implemented
- [ ] DocLink graph visualization (infrastructure done)
- [ ] Reviewer mode (R5 feature)
- [ ] Document version history
- [ ] Concurrent edit conflict resolution
- [ ] Hans automated result capture
- [ ] Discovery coverage calculation (placeholder)

### Workarounds
- [ ] Manual dashboard aggregation available (button in admin panel)
- [ ] Cloud Function scheduled aggregation (TBD - currently manual)

---

## Bugs Found During Testing

Use this section to log bugs as they're discovered:

| ID | Feature | Title | Severity | Status | Notes |
|----|---------|----|----------|--------|-------|
|    |         |    |          |        |       |

---

## Test Results Summary

**Date:** [To be filled during testing]
**Tester:** [Name]
**Duration:** [Hours spent]

### By Feature Area

| Feature | Passed | Failed | Skipped | Coverage |
|---------|--------|--------|---------|----------|
| Ruby | - | - | - | - |
| Hans | - | - | - | - |
| Stripe | - | - | - | - |
| Dashboard | - | - | - | - |
| **TOTAL** | - | - | - | - |

### Critical Sequences

| Sequence | Status | Notes |
|----------|--------|-------|
| New Workspace → Usage | [ ] | |
| Test Case → Bug Card | [ ] | |
| Documentation Links | [ ] | |

---

## Resources

### Documentation Files
- `stea_comprehensive_test_plan.md` - Full test plan (1,473 lines)
- `TEST_PLAN_SUMMARY.md` - Executive summary (298 lines)
- `TESTING_INDEX.md` - This file (navigation and coordination)

### Related Documentation
- `stea_workspace_pulse_dashboard.md` - Dashboard specification
- `STEA_MULTI_TENANT_SUMMARY.md` - Multi-tenant architecture
- `stea_dashboard_auth_summary.md` - Authentication flow

### Code References
- `/src/app/apps/stea/ruby/` - Ruby module
- `/src/app/apps/stea/hans/` - Hans module
- `/src/app/api/create-checkout-session/` - Stripe checkout
- `/src/app/api/webhooks/stripe/` - Stripe webhooks
- `/src/components/workspace/` - Dashboard components
- `/src/lib/workspacePulseAggregator.js` - Metrics library

---

## Contact & Support

- **Questions about Ruby?** Check Section 1 of comprehensive test plan
- **Questions about Hans?** Check Section 2 of comprehensive test plan
- **Questions about Stripe?** Check Section 3 of comprehensive test plan
- **Questions about Dashboard?** Check Section 4 of comprehensive test plan
- **General questions?** Check TEST_PLAN_SUMMARY.md

---

**Status:** Ready for Testing
**Last Updated:** 2025-11-14
**Next Review:** After testing completion
