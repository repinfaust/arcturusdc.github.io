# Orbit POC Implementation

This is the Proof of Concept implementation of Orbit - a cryptographically-verifiable audit-log-as-a-service.

## Architecture

### Core Components

1. **Signatures** (`signatures.js`)
   - HMAC-SHA256 signing for event tamper-evidence
   - SHA-256 hashing for snapshot integrity
   - Signature verification

2. **Event Types** (`eventTypes.js`)
   - Event type definitions
   - Schema validation
   - Event ID generation

3. **Database** (`db.js`)
   - Firestore collection helpers
   - CRUD operations for orgs, snapshots, events, consent state, alerts

4. **Policy Engine** (`policyEngine.js`)
   - Undeclared-event detection
   - Consent violation checking
   - Hash integrity verification
   - Volume anomaly detection

### API Routes

- `POST /api/orbit/orgs` - Create/update organisation
- `GET /api/orbit/orgs` - List/get organisations
- `POST /api/orbit/snapshots` - Create snapshot
- `GET /api/orbit/snapshots` - Get snapshot
- `POST /api/orbit/events` - Create ledger event
- `GET /api/orbit/events` - Query events
- `POST /api/orbit/verification/request` - Request verification
- `GET /api/orbit/alerts` - Get alerts
- `GET /api/orbit/consent` - Get consent state

### UI

- `/apps/stea/orbit/poc` - POC Dashboard with:
  - Overview of orgs and stats
  - Event timeline
  - Consent management view
  - Policy alerts
  - Org sandbox for simulating events

## Usage

### 1. Seed Demo Data

Visit the POC dashboard and click "Seed Demo Data" to create:
- 3 demo organisations (experian, challenger_bank, broker_app)
- Demo user: `user_12345`

### 2. Simulate Events

Use the "Org Sandbox" tab to:
- Register/update user profiles
- Grant/revoke consent
- Declare data usage
- Request verifications

### 3. View Results

- **Timeline**: See all events in chronological order
- **Consent**: View current consent state per org/scope
- **Alerts**: See policy violations and anomalies

## Firestore Collections

- `orbit_orgs` - Organisation metadata, API keys, scope configs
- `orbit_snapshots` - Off-ledger user profile snapshots
- `orbit_ledger_events` - Append-only event log
- `orbit_consent_state` - Derived consent state per user/org/scope
- `orbit_verification_routes` - Verification routing config (future)
- `orbit_alerts` - Policy violation alerts

## Authentication

Organisations authenticate using headers:
- `X-Orbit-Org-Id`: Organisation ID
- `X-Orbit-Api-Key`: API key (generated on org creation)

## Event Flow

1. Org creates snapshot → `PROFILE_REGISTERED` event
2. Org updates snapshot → `PROFILE_UPDATED` event
3. User grants consent → `CONSENT_GRANTED` event → consent state updated
4. Org uses data → `DATA_USED` event → policy engine checks consent
5. Org shares data → `DATA_SHARED` event → policy engine validates recipient
6. Verification request → `VERIFICATION_REQUESTED` → mock verifier → `VERIFICATION_RESPONDED`

## Policy Engine Rules

1. **Usage without Consent**: Flags `DATA_USED`/`DATA_SHARED` events without active consent
2. **Unknown Recipient**: Flags `DATA_SHARED` to non-existent orgs
3. **Hash Mismatch**: Detects snapshot tampering
4. **Anomalous Volume**: Detects unusual access patterns (future)

## Next Steps

- [ ] Add integrity check UI
- [ ] Implement snapshot versioning UI
- [ ] Add event filtering and search
- [ ] Create org onboarding UI
- [ ] Add export functionality
- [ ] Implement real verification providers
- [ ] Add multi-user support
- [ ] Enhance policy engine with ML-based anomaly detection

