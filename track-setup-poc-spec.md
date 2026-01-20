# Track Setup Companion – Web PoC Build Specification

## 1. Overview

This document defines the technical specification for an initial web-based Proof of Concept (PoC) for a **motorbike track setup companion**. The PoC will be built on an existing web stack using:

- **Next.js / React** (assumed)
- **Firebase Authentication** (Google sign-in)
- **Cloud Firestore** as the primary data store

The PoC should be lightweight, focused, and usable by ~10 real riders at track days to collect early data and feedback.

---

## 2. Objectives & Scope

### 2.1 Primary Objectives

1. Allow authenticated riders to:
   - Create and manage **bike profiles**
   - Log **track sessions** including:
     - Basic session metadata (date, track, bike)
     - Tyre pressures (cold / hot)
     - Optional tyre temperatures
     - Basic suspension / electronics settings
     - Simple performance summary (fastest lap, # laps)
2. Provide a **history view** so riders can:
   - Browse their own sessions
   - Filter by track and bike
   - See previous setups for a track when returning to it
3. Provide a **“Paddock View”** so riders can:
   - See anonymised setups from other riders at the same track/date
   - Quickly compare tyre pressures/compounds and lap times

### 2.2 Non-Goals (PoC)

- No GPS/gyroscope/OBD telemetry capture
- No AI-based setup recommendations
- No team/org management (simple single-rider accounts only)
- No full tyre inventory / maintenance lifecycle
- No payment/subscription flows

---

## 3. Architecture

### 3.1 High-Level

- **Frontend**: Next.js/React Single Page Application
  - Authentication via Firebase Auth (Google provider)
  - Direct Firestore access via Firebase Web SDK
- **Backend**: None for PoC beyond Firestore
  - All data access via client-side SDK
  - Optional: future Cloud Functions for aggregation/anonymisation
- **Hosting**: Existing site hosting (e.g., Vercel + Firebase project already in place)

### 3.2 Logical Modules

- **Auth Module**
  - Handles Google sign-in, logout, and user state
- **Rider Profile Module**
  - Ensures a `riders/{uid}` document exists for each authenticated user
- **Bikes Module**
  - CRUD operations for bike profiles under each rider
- **Tracks Module**
  - Simple track registry (pre-seeded and user-added)
- **Sessions Module**
  - CRUD operations for sessions
  - Filtering & listing for “My Sessions” and “Paddock View”

---

## 4. Data Model (Firestore)

### 4.1 Riders

**Collection**: `riders`  
**Document ID**: `riderId = auth.uid`

```ts
type Rider = {
  displayName: string;
  email: string;
  createdAt: FirebaseFirestore.Timestamp;
  lastLoginAt: FirebaseFirestore.Timestamp;
  experienceLevel?: 'novice' | 'intermediate' | 'advanced';
  homeCountry?: string;
};
```

### 4.2 Bikes

**Collection**: `riders/{riderId}/bikes`

```ts
type Bike = {
  name: string;             // “R6 Track Bike”
  make: string;             // “Yamaha”
  model: string;            // “YZF-R6”
  year?: number;
  displacementCc?: number;
  notes?: string;
  createdAt: FirebaseFirestore.Timestamp;
};
```

### 4.3 Tracks

**Collection**: `tracks`

```ts
type Track = {
  name: string;             // “Donington Park”
  layout?: string;          // “National”, “GP”
  country?: string;         // ISO-3166 alpha-2 or alpha-3 if desired
  latitude?: number;
  longitude?: number;
  createdAt: FirebaseFirestore.Timestamp;
  source?: 'manual' | 'api';
};
```

> PoC can begin with a manually-seeded list of tracks (especially UK/EU) plus “Custom track” creation by users.

### 4.4 Sessions

**Collection**: `sessions` (top-level)

```ts
type Session = {
  // Ownership / relations
  riderId: string;          // auth.uid
  bikeId: string;           // riders/{riderId}/bikes/{bikeId}
  trackId: string;          // tracks/{trackId}

  // Session basics
  date: FirebaseFirestore.Timestamp;   // when the session took place
  eventName?: string;       // e.g. “No Limits TD – Group 2”
  sessionNumber?: number;   // e.g. 1, 2, 3 for that day

  // Tyres
  tireBrandFront?: string;
  tireModelFront?: string;
  tireCompoundFront?: string;
  tireBrandRear?: string;
  tireModelRear?: string;
  tireCompoundRear?: string;

  tireSetAgeSessions?: number;         // approximate #sessions on this set

  tirePressureFrontColdPsi?: number;
  tirePressureRearColdPsi?: number;
  tirePressureFrontHotPsi?: number;
  tirePressureRearHotPsi?: number;

  tireTempFrontInnerC?: number;
  tireTempFrontMiddleC?: number;
  tireTempFrontOuterC?: number;
  tireTempRearInnerC?: number;
  tireTempRearMiddleC?: number;
  tireTempRearOuterC?: number;

  // Suspension & geometry (subset for PoC)
  forkPreloadTurns?: number;
  forkCompClicksOut?: number;
  forkRebClicksOut?: number;
  shockPreloadTurns?: number;
  shockCompClicksOut?: number;
  shockRebClicksOut?: number;

  forkHeightMm?: number;      // tube showing above top yoke
  rearRideHeightMm?: number;

  // Electronics
  tractionControlLevel?: string; // textual, as bike UIs vary
  absMode?: string;
  engineMap?: string;           // “A”, “B”, “Rain” etc.
  engineTorqueSettingNm?: number; // if known from dyno/map or user notes

  // Conditions
  airTempC?: number;
  trackTempC?: number;
  weather?: 'sunny' | 'cloudy' | 'wet' | 'mixed';
  notesHandling?: string;

  // Performance summary
  fastestLapSec?: number;    // stored as seconds (e.g. 105.32)
  avgLapSec?: number;
  lapsCompleted?: number;

  // Meta
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
```

For PoC, the UI may initially expose only a subset of these fields (core tyre pressures + basic performance) to keep data entry fast.

---

## 5. Firestore Security Rules (PoC)

**Goals:**

- Authenticated users can create/read/update/delete their own sessions.
- For PoC, paddock-style sharing can be implemented by allowing read access to all sessions for authenticated users and stripping sensitive data at the UI layer.

Example rules (pseudo-code):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /riders/{riderId} {
      allow read, write: if request.auth != null && request.auth.uid == riderId;
    }

    match /riders/{riderId}/bikes/{bikeId} {
      allow read, write: if request.auth != null && request.auth.uid == riderId;
    }

    match /tracks/{trackId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null; // PoC; tighten later
    }

    match /sessions/{sessionId} {
      allow create: if request.auth != null;

      allow read: if request.auth != null; // PoC: paddock view across all riders

      allow update, delete: if request.auth != null &&
                            request.auth.uid == resource.data.riderId;
    }
  }
}
```

> For a productionised version, consider introducing a separate `paddockSessions` collection with pre-sanitised data written by Cloud Functions and limiting direct `sessions` reads to owners only.

---

## 6. Frontend Routes & Screens

Assumes Next.js `app` or `pages` router. Route names are indicative.

### 6.1 Authentication

- `/_app` or layout wraps pages with an `AuthProvider` using Firebase Auth.
- `RequireAuth` HOC / component wraps all `/track-setup/*` routes.

### 6.2 Routes

1. `/track-setup` → redirects to `/track-setup/dashboard` if authenticated
2. `/track-setup/dashboard`
3. `/track-setup/bikes`
4. `/track-setup/sessions`
5. `/track-setup/sessions/new`
6. `/track-setup/sessions/[sessionId]`
7. `/track-setup/paddock`

### 6.3 Components (Suggested)

- `AuthProvider`, `RequireAuth`
- `TrackSetupLayout` – navbar, breadcrumbs for the module
- `BikeList`, `BikeForm`
- `TrackSelect` – typeahead / dropdown; allows custom tracks
- `SessionForm`
- `SessionList`, `SessionListFilters`
- `SessionDetail`
- `PaddockFilters`
- `PaddockTable`

---

## 7. Screen Specifications

### 7.1 Dashboard (`/track-setup/dashboard`)

**Purpose:** Entry point after login.

**Sections:**

- **Quick Actions**
  - “Log new session” → `/track-setup/sessions/new`
  - “My sessions” → `/track-setup/sessions`
  - “Paddock view” → `/track-setup/paddock`
- **Recent Sessions**
  - List up to 3 most recent sessions for current rider:
    - date, track name, bike name
    - front/rear cold pressures
    - fastest lap (if set)

### 7.2 Bikes (`/track-setup/bikes`)

- Table/list of bikes:
  - name, make/model, year
- Actions:
  - “Add Bike” → opens `BikeForm` modal
  - Edit / Delete

### 7.3 Log Session (`/track-setup/sessions/new`)

Form sections (MVP, a subset of full model):

1. **Session Basics**
   - Date/time (default now)
   - Track (via `TrackSelect`)
   - Bike (dropdown from user bikes)
   - Optional: event name, session number

2. **Tyres (Core)**
   - Front/Rear tyre brand (text)
   - Front/Rear compound (text)
   - Front/Rear cold pressures (number)
   - Optional: Front/Rear hot pressures (number)
   - Optional: tyre set age (sessions count)

3. **Quick Setup (optional fields)**
   - Fork compression clicks (number)
   - Shock compression clicks (number)
   - Traction control level (text/number)
   - Engine map (text)

4. **Outcome**
   - Laps completed (number)
   - Fastest lap (user input `mm:ss.xxx` → convert to seconds)
   - Notes (free text)

**Buttons:**

- “Save Session” (primary)
- Optional: “Save & add another”

**Client-side Validation (MVP):**

- Required: track, bike, date, at least front/rear cold pressures or laps/fastest lap.
- Basic numeric checks (non-negative numbers).

### 7.4 My Sessions (`/track-setup/sessions`)

**Filters:**

- Track (dropdown)
- Bike (dropdown)
- Date range (from/to)

**List:**

- Each row/card:
  - date
  - track name
  - bike name
  - front/rear cold pressures
  - fastest lap (if set)

**Click-through:**

- Clicking a row → `/track-setup/sessions/[sessionId]`

### 7.5 Session Detail (`/track-setup/sessions/[sessionId]`)

Sections:

1. **Session Summary**
   - track, date, bike, event name, session number
   - laps completed, fastest lap (pretty formatted)

2. **Tyre & Setup Snapshot**
   - front/rear pressures (cold/hot)
   - compounds
   - key suspension / electronics fields if present

3. **Notes & Handling**
   - notesHandling

4. **Previous Sessions at This Track (Same Bike)**  
   - Query: last 3 sessions where `trackId == current.trackId` AND `bikeId == current.bikeId` AND `date < current.date`, ordered by date desc.
   - Display a compact table:
     - date
     - fastest lap
     - front/rear cold pressures

### 7.6 Paddock View (`/track-setup/paddock`)

**Filters:**

- Track (dropdown)
- Date (date picker; default to today)

**Query:**

- `sessions` where:
  - `trackId == selectedTrack`
  - `date` between start-of-day and end-of-day for selected date

**Displayed columns (sanitised):**

- Rider: first name only (derived client-side from `rider.displayName`)
- Bike: make + model (+ year)
- Tyres: front/rear brand + compound
- Front/Rear cold pressures
- Fastest lap (if available)

No email, no notes, no detailed suspension data shown here for PoC.

---

## 8. Firestore Queries (Examples)

### 8.1 List My Sessions

```ts
const q = query(
  collection(db, 'sessions'),
  where('riderId', '==', currentUser.uid),
  orderBy('date', 'desc'),
  limit(50)
);
```

Add additional `where` clauses if track or bike filters are applied.

### 8.2 Paddock Sessions for Track + Date

```ts
const dayStart = Timestamp.fromDate(startOfDay(selectedDate));
const dayEnd = Timestamp.fromDate(endOfDay(selectedDate));

const q = query(
  collection(db, 'sessions'),
  where('trackId', '==', selectedTrackId),
  where('date', '>=', dayStart),
  where('date', '<=', dayEnd),
  orderBy('date', 'asc')
);
```

> Note: Firestore requires composite indexes for multiple `where` + `orderBy` constraints; create indexes as needed when the console prompts.

### 8.3 Previous Sessions for Same Track + Bike

```ts
const q = query(
  collection(db, 'sessions'),
  where('riderId', '==', currentSession.riderId),
  where('trackId', '==', currentSession.trackId),
  where('bikeId', '==', currentSession.bikeId),
  where('date', '<', currentSession.date),
  orderBy('date', 'desc'),
  limit(3)
);
```

---

## 9. Track Data Source Strategy

### 9.1 PoC Approach

For the PoC, use a **simple strategy**:

1. Seed a small set of popular tracks in `tracks` (e.g. key UK/EU circuits).
2. Allow riders to add a **custom track** via a minimal form:
   - name (required)
   - country (required)
   - optional city, lat/long

This avoids external API complexity and ensures the PoC can run offline and with minimal dependencies.

### 9.2 Optional: External Track APIs (Future Enhancement)

For a later iteration, consider integrating with open / free data sources to search circuits by country, cache locally, and then use as options in `TrackSelect`:

- **OSM + Overpass API**  
  - Query OpenStreetMap features tagged as race tracks (e.g. `highway=raceway` with additional motor-sport-related tags) for a specific country.
  - Transform the response into `Track` documents (name, country, coordinates).

- **3rd Party Motorsport APIs**  
  - Some motorsport APIs expose circuit lists as part of race data.  
  - Integration would typically be read-only with local caching in Firestore to avoid rate limits.

For the PoC, including a `source` field on `Track` ensures you can distinguish between manually-created and externally-imported circuits.

---

## 10. Implementation Plan

### Phase 0 – Wiring & Skeleton

1. Create `/track-setup/*` routes and shared layout.
2. Implement `AuthProvider` and `RequireAuth` around those routes.
3. Implement basic `riders` provisioning on first login.

### Phase 1 – Core CRUD

1. Bikes
   - Implement list + add/edit/delete using Firestore subcollection.
2. Tracks
   - Seed core tracks; implement simple dropdown + “Add custom track”.
3. Sessions
   - Implement `SessionForm` with core fields.
   - Implement `My Sessions` list + detail view.

### Phase 2 – Paddock View & Comparison

1. Implement `PaddockView` page with track/date filters and aggregated table.
2. Implement “Previous sessions at this track” panel in session detail.

### Phase 3 – Refinements / Feedback

1. Add additional (optional) fields to the form (tyre temps, more suspension).
2. Add CSV export for a rider’s sessions.
3. Collect user feedback and adjust UX and data model as needed.

---

## 11. Non-Functional Requirements (PoC)

- **Performance**:  
  - Queried lists limited to reasonable sizes (e.g. latest 50 sessions).
  - Client-side pagination as needed.

- **Offline tolerance**:  
  - App should at least fail gracefully when offline (e.g. show message); full offline caching can be considered later with Firestore persistence.

- **Security & Privacy**:  
  - Sessions are readable to all authenticated users only for PoC; communicate this clearly to early testers.
  - No sensitive personal data is stored beyond basic profile and setup notes.

- **Observability**:  
  - Use existing analytics (if enabled) to track basic events:
    - `session_created`
    - `paddock_view_opened`
    - `bike_created`

---

## 12. Future Extensions (Beyond PoC)

- Per-rider privacy settings (opt-out of paddock sharing).
- Tyre lifecycle tracking (tie sessions to tyre “objects” and track heat cycles).
- Richer charts (e.g. lap time vs pressure over days).
- Integrations with GPS/telemetry tools (RaceBox, RaceChrono, etc.).
- Team / coach roles and multi-rider dashboards.
- AI-assisted suggestions based on accumulated data.
