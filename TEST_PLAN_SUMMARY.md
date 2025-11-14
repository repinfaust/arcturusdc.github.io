# STEa Test Plan - Executive Summary

**Document:** `stea_comprehensive_test_plan.md` (1,473 lines)
**Date Created:** 2025-11-14
**Scope:** Comprehensive testing strategy for recent STEa changes

---

## Overview

This document provides an exhaustive testing guide for four major feature areas of STEa:

1. **Ruby Documentation Module** - Document creation, editing, asset management, and cross-linking
2. **Hans Testing Suite** - Test case management with closed-loop integration to Filo
3. **Stripe Payment Integration** - Workspace creation via checkout with claim tokens
4. **Workspace Pulse Dashboard** - Unified workspace health metrics across all modules

---

## Document Structure

### Section 1: Ruby Documentation (Pages ~50-100)
- Multi-space document organization
- Rich text editing with TipTap
- Asset management (upload, storage, display)
- DocLink bidirectional graph system (cross-artifact references)
- Template system for document generation
- 75+ test cases covering all features

**Key Files:**
- `src/app/apps/stea/ruby/page.js` - Space/document list UI
- `src/components/RubyEditor.js` - Rich text editor component
- `src/lib/storage.js` - Asset upload/management

**Critical Paths:**
1. Create space → create document → use template
2. Upload assets → drag-drop to editor → insert in document
3. Create DocLink → search artifacts → link to epic/feature/card/test

---

### Section 2: Hans Testing Suite (Pages ~100-150)
- Test case creation from Filo cards
- Test execution tracking (Open → In Progress → Passed/Failed)
- Public test case sharing with 12-hour expiring tokens
- Closed-loop workflow: Failed Test → Create Bug Card in Filo
- Multi-tenant isolation with workspace support
- App-specific test case pages (new dynamic route: `/apps/stea/hans/[app]`)

**Key Files:**
- `src/app/apps/stea/hans/page.js` - Main dashboard
- `src/app/apps/stea/hans/[app]/page.js` - App-specific page (NEW)
- `src/app/api/hans/createFromCard/route.js` - Create test case from card

**Critical Paths:**
1. Create test case from Filo card
2. Execute test → update status → save notes
3. Failed test → create bug card → open in Filo
4. Share test case via public token

---

### Section 3: Stripe Payment & Workspace Claiming (Pages ~150-220)
- Stripe checkout session creation with custom fields
- Workspace name + Google email capture
- Discount code support (including 100% off - RTP726)
- Webhook processing (6 event types)
- Pending workspace creation with 7-day claim tokens
- Email-based workspace claiming with email validation

**Key Files:**
- `src/app/api/create-checkout-session/route.js` - Checkout creation
- `src/app/api/webhooks/stripe/route.js` - Webhook handler
- `src/app/api/claim-workspace/route.js` - Claim API (GET & POST)

**Critical Paths:**
1. Select plan → checkout → enter workspace name & email
2. Payment → webhook → pending workspace created
3. Claim email sent → user signs in → clicks claim link
4. Email validation → workspace created → subscription activated

**Key Features:**
- 100% discount codes still create pending workspace
- Claim tokens expire after 7 days
- Email matching case-insensitive and trimmed
- Helpful error messages for email mismatch

---

### Section 4: Workspace Pulse Dashboard (Pages ~220-330)
- Real-time dashboard with 5 metric tiles
- Build Progress (Filo epics/features/bugs per app)
- Testing Snapshot (Hans pass/fail/coverage)
- Backlog Health (Filo ready/in-dev/blocked/cycle-time)
- Discovery Signals (Harls notes/JTBD)
- Documentation Activity (Ruby docs/links)
- Admin configuration: Select which apps to track
- Cloud Function integration for 15-min aggregation

**Key Files:**
- `src/components/workspace/WorkspacePulse.jsx` - Dashboard component
- `src/lib/workspacePulseAggregator.js` - Metrics calculation
- `src/components/admin/TenantAppsManager.jsx` - Admin app selection
- `src/components/workspace/tiles/*.jsx` - Individual tile components

**Critical Paths:**
1. Navigate to home → Workspace Pulse loads
2. Real-time listener → metrics update on data change
3. Admin selects apps → saves to Firestore
4. Cloud Function aggregates → metrics stored in `tenants/{id}/dashboard/metrics`
5. Click tile → deep links to module with filter applied

---

## Firestore Collections Summary

**Ruby (Documentation):**
- `stea_doc_spaces/` - Organization containers
- `stea_docs/` - Documents with TipTap content
- `stea_doc_links/` - Bidirectional artifact links
- `stea_doc_assets/` - File uploads with Cloud Storage integration

**Hans (Testing):**
- `hans_cases/` - Test cases with public tokens

**Payment & Workspace:**
- `pendingWorkspaces/` - Temporary claim records (7-day TTL)
- `stea_subscriptions/` - Subscription tracking
- `stea_purchases/` - One-time payment tracking
- `stea_payments/` - Invoice payment logs

**Workspace Pulse:**
- `tenants/{id}/dashboard/metrics` - Aggregated metrics (real-time listener)

---

## Test Execution Plan

### By Feature Area

**Ruby Documentation (Estimated: 3-4 hours)**
- [ ] Space management (create, select, filter)
- [ ] Document lifecycle (create, edit, save, delete)
- [ ] Template system (select, auto-populate)
- [ ] Asset management (upload, insert, delete)
- [ ] Editor toolbar (formatting, blocks, special features)
- [ ] DocLink creation (search, link, delete, read-only incoming)
- [ ] Multi-space filtering and search

**Hans Testing Suite (Estimated: 2-3 hours)**
- [ ] Test statistics and aggregation
- [ ] Test case expansion and details
- [ ] Status updates and notes saving
- [ ] Closed-loop card creation (bug & feedback)
- [ ] App-specific pages and filtering
- [ ] Public token generation and expiry
- [ ] Multi-tenant isolation

**Stripe Payment (Estimated: 2-3 hours)**
- [ ] Checkout session creation
- [ ] Custom field entry
- [ ] Discount code application
- [ ] Webhook event processing (all 6 types)
- [ ] Pending workspace creation
- [ ] Email sending
- [ ] Claim API (GET details, POST claim)
- [ ] Email validation and error cases
- [ ] Workspace creation and linking

**Workspace Pulse (Estimated: 2-3 hours)**
- [ ] Dashboard loading and tile display
- [ ] Real-time listener updates
- [ ] App filtering
- [ ] Deep links to modules
- [ ] Metric calculations (build progress, testing, backlog, discovery, docs)
- [ ] Admin app selection and saving
- [ ] Cloud Function integration (manual trigger or scheduled)
- [ ] Mock data fallback

**Cross-Module Integration (Estimated: 1-2 hours)**
- [ ] Ruby → Filo document links
- [ ] Hans → Filo closed-loop cards
- [ ] Dashboard → Module deep links
- [ ] Email flows and CTAs

**Total Estimated Time: 10-15 hours**

---

## Critical Test Sequences (Must Pass)

### End-to-End: New Workspace Creation
1. Stripe checkout → custom fields → payment
2. Webhook → pending workspace created
3. Email sent with claim link
4. User signs in with matching email
5. Workspace claimed and created
6. User sees home with empty dashboard
7. Admin configures apps
8. Users create content
9. Dashboard metrics populate

### End-to-End: Test Case → Bug Card
1. Create test case from Filo card
2. Execute test → mark as failed
3. Click "Create STEa Card (Fail)"
4. Modal pre-fills with test details
5. User modifies if needed
6. Card created in Filo with source=hans
7. Success modal → navigate to Filo
8. Card appears in board with linked test case

### End-to-End: Documentation Cross-Linking
1. Create document in Ruby
2. Create DocLink to feature
3. Feature page shows incoming link to document
4. Document page shows outgoing link to feature
5. Click link → navigates to artifact
6. Update document → search shows artifact
7. Delete link → both sides updated

---

## Security Requirements

- [ ] Tenant isolation enforced (queries include tenantId where)
- [ ] API endpoints verify tenantId matches user's workspace
- [ ] Session cookies validated
- [ ] Email validation case-insensitive & trimmed
- [ ] Claim tokens cryptographically random (32 hex chars)
- [ ] Public test tokens don't allow modification
- [ ] Webhook signature validation
- [ ] No sensitive data in URLs (tokens in query params, but tokens random)

---

## Performance Benchmarks

- [ ] Ruby home loads <2s (1000+ docs)
- [ ] Document search filters <500ms
- [ ] Editor initialization <1s
- [ ] Hans dashboard loads <2s (500+ test cases)
- [ ] Workspace Pulse aggregation <10s initial, <2s subsequent
- [ ] Asset upload progress visible
- [ ] Real-time listener updates <2s

---

## Browser & Environment Support

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Mobile Chrome (Android 10+)

---

## Known Issues & Limitations

**Not Yet Implemented:**
- DocLink graph visualization (infrastructure in place)
- Reviewer mode (R5 feature)
- Document version history
- Concurrent edit conflict resolution
- Hans automated test result capture
- Discovery coverage calculation (currently placeholder)

**Workarounds Available:**
- Manual Workspace Pulse aggregation via admin panel
- Cloud Function can be manually triggered (15-min schedule TBD)

---

## Next Steps After Testing

1. **File Bugs** - Create issues for any failures found
2. **Performance Optimization** - Profile and optimize slow paths
3. **Documentation** - Create user guides for each feature
4. **Training** - Record demo videos
5. **Rollout** - Plan phased rollout by feature area
6. **Monitoring** - Set up error tracking and metrics

---

## Questions & Support

- **Ruby Issues** - Check TipTap docs for editor issues
- **Hans Issues** - Verify Firestore security rules
- **Stripe Issues** - Check Stripe dashboard for webhook deliveries
- **Dashboard Issues** - Verify Cloud Function logs
- **General Issues** - Check browser console for errors

---

**Total Lines in Test Plan:** 1,473
**Coverage:** All recent feature changes
**Status:** Ready for test execution
