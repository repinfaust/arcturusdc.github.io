Here you go — a consolidated **Tier 0 Build Spec** for:

1. Skill-mode UX
2. Fast session logging loop
3. Lap time charts + Insights v1
4. Paddock v1

Assumes the existing Next.js + Firebase + Firestore stack and current PoC data model. 

---

## 0. Foundations & Assumptions

* **Stack**

  * Next.js (App or Pages Router)
  * React / TypeScript
  * Firebase Auth (Google)
  * Firestore (client SDK)
  * Charting: `recharts` or `visx` (pick one and standardise)
* **Design**

  * Use ApexTwin design system: dark panels, one accent colour, Inter + IBM Plex Mono. 
* **Existing Collections**

  * `riders`, `tracks`, `sessions`, `riders/{riderId}/bikes` as per PoC spec. 

---

## 1. Skill-Mode UX

### 1.1 Goal

Allow **different UI complexity** based on rider skill:

* `novice` – minimum fields, friendly labels
* `intermediate` – more controls, but still guided
* `pro` – full technical controls and advanced filters

### 1.2 Data Model Changes

Extend `Rider` type in `riders/{uid}`:

```ts
type ExperienceLevel = 'novice' | 'intermediate' | 'pro';

type Rider = {
  displayName: string;
  email: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  experienceLevel: ExperienceLevel;   // new, required
  homeCountry?: string;
  // optionally:
  prefersMetric?: boolean;           // future: psi/bar, C/F
};
```

Default `experienceLevel = 'novice'` on first login if not set.

### 1.3 Config-driven Field Visibility

Create a config file, e.g. `config/skillModes.ts`:

```ts
type FieldId =
  | 'tyrePressures'
  | 'tyreCompounds'
  | 'tyreTemps'
  | 'suspensionBasic'
  | 'suspensionAdvanced'
  | 'electronics'
  | 'gearing'
  | 'chainLength'
  | 'weatherManual'
  | 'lapTimes'
  | 'confidence'
  | 'notes'
  | 'advancedNotes';

type SkillModeConfig = {
  label: string;
  description: string;
  showFields: FieldId[];
};

export const SKILL_MODES: Record<ExperienceLevel, SkillModeConfig> = {
  novice: {
    label: 'Novice',
    description: 'Simple logging: pressures, lap times, confidence.',
    showFields: ['tyrePressures', 'lapTimes', 'confidence', 'notes'],
  },
  intermediate: {
    label: 'Club / Intermediate',
    description: 'Add tyres, gearing, basic suspension.',
    showFields: [
      'tyrePressures',
      'tyreCompounds',
      'gearing',
      'lapTimes',
      'confidence',
      'notes',
      'weatherManual',
    ],
  },
  pro: {
    label: 'Pro',
    description: 'Full setup: suspension, electronics, tyres, gearing.',
    showFields: [
      'tyrePressures',
      'tyreCompounds',
      'tyreTemps',
      'suspensionBasic',
      'suspensionAdvanced',
      'electronics',
      'gearing',
      'chainLength',
      'lapTimes',
      'confidence',
      'notes',
      'advancedNotes',
    ],
  },
};
```

Then in forms, use a helper:

```ts
const { experienceLevel } = useRiderProfile();
const modeConfig = SKILL_MODES[experienceLevel];

const isFieldVisible = (fieldId: FieldId) =>
  modeConfig.showFields.includes(fieldId);
```

### 1.4 UI Implementation

#### 1.4.1 Rider Profile Page (`/rider`)

Components:

* `<SkillModeSelector />`

  * 3 cards or segmented control: Novice / Intermediate / Pro
  * Shows label + description + example fields
  * `onChange` updates `riders/{uid}.experienceLevel` in Firestore

* Also show:

  * Rider group (Orange / Red / Gold)
  * Summary stats (sessions logged, tracks, best PB)

Event logging:

* `skill_mode_changed` with previous + new mode

#### 1.4.2 Forms & Views That Respect Skill Mode

* **Session Form**

  * Condition fields based on `isFieldVisible`
  * For hidden advanced fields, still store backend model safely:

    * Either leave existing values untouched on update
    * Or show a subtle “Advanced fields hidden in this mode” notice
* **Event / Session Detail**

  * Group sections into:

    * “Core data” (always visible)
    * “Advanced setup” (hidden in novice with a “Switch to Pro mode to view full setup” link)

### 1.5 Edge Cases

* Changing from `pro` → `novice` should **not delete** advanced fields.
* Show a warning when downgrading mode:
  “Advanced fields will be hidden in forms but still stored safely.”

---

## 2. Fast Session Logging Loop

### 2.1 Goals

* Log a session in **under 45 seconds**
* Minimise repeated data entry:

  * Copy previous session
  * Apply bike defaults
  * Auto weather
* Support multi-day events + confidence slider

### 2.2 Data Model Adjustments

Extend `Session` type (if not already present):

```ts
type Session = {
  // existing…
  date: Timestamp;
  eventName?: string;
  sessionNumber?: number;
  // NEW:
  eventId?: string;         // optional, later if you formalise events
  confidence?: number;      // 0–100
  frontSprocket?: number;
  rearSprocket?: number;
  chainLengthLinks?: number;
  tyreSizeFront?: string;
  tyreSizeRear?: string;
  // weather fields:
  weatherSource?: 'auto' | 'manual';
  weatherProvider?: 'open-meteo';
  weatherSummary?: string;
  weatherIconCode?: string;
};
```

### 2.3 Garage Defaults (Per Bike)

New subcollection `riders/{riderId}/bikes/{bikeId}/defaults` or flattened in bike doc if you want one active default:

Simpler (per bike, single `defaultSettings` object on `Bike`):

```ts
type BikeDefaultSettings = {
  frontSprocket?: number;
  rearSprocket?: number;
  chainLengthLinks?: number;
  tyreSizeFront?: string;
  tyreSizeRear?: string;
  tyrePressureFrontColdPsi?: number;
  tyrePressureRearColdPsi?: number;
  forkCompClicksOut?: number;
  forkRebClicksOut?: number;
  shockCompClicksOut?: number;
  shockRebClicksOut?: number;
  tractionControlLevel?: string;
  engineMap?: string;
  updatedAt: Timestamp;
};

type Bike = {
  // existing...
  defaultSettings?: BikeDefaultSettings;
  defaultsSet?: boolean;  // for UI badge
};
```

History of changes can live in `riders/{riderId}/bikes/{bikeId}/defaultSettingsHistory`.

### 2.4 Copy Previous Session

#### 2.4.1 API / Query

When user taps **“Copy previous session”**:

1. Query latest session for that rider + bike + track:

```ts
const q = query(
  collection(db, 'sessions'),
  where('riderId', '==', riderId),
  where('bikeId', '==', selectedBikeId),
  where('trackId', '==', selectedTrackId),
  orderBy('date', 'desc'),
  limit(1),
);
```

2. Use result to prefill form values (except date/time & maybe lap results).

#### 2.4.2 UI Behaviour

* Button: `Copy previous session setup`
* On click:

  * Prefill:

    * Tyres (brand, compound, pressures, sizes)
    * Gearing
    * Suspension / electronics
  * Do **not** prefill:

    * Laps completed
    * Fastest lap
    * Notes
* Show inline toast:
  “Copied setup from [date] session at [track].”

### 2.5 Apply Bike Defaults

On Session form, with bike selected:

* Button: `Use bike defaults`

  * Loads `defaultSettings` from bike doc
  * Prefills same fields as above
* If no defaults set:

  * Disable or show tooltip: “Set defaults in Garage to enable.”

In Garage:

* UI to configure defaults for each bike
* “Defaults set” badge in bike list

### 2.6 Auto Weather Lookup (Open-Meteo)

You said this is already implemented, but this is the build spec shape.

#### 2.6.1 Inputs

* Track lat/lon from `tracks/{trackId}`
* Session date/time

#### 2.6.2 Client Implementation

* On track + date selection (or on form open):

  * Call your backend proxy route: `/api/weather?lat=…&lon=…&time=…`
* Backend fetch from Open-Meteo and return:

  * `airTempC`
  * `weather` (sunny / cloudy / wet / mixed)
  * `weatherIconCode`
* Pre-populate weather section.

Force users to be able to override manually (weatherSource: auto / manual).

### 2.7 Confidence Slider

* Field: `confidence` (0–100)
* UI: slider with labels:

  * 0 = “No feel”
  * 50 = “OK”
  * 100 = “On rails”
* Required? No, but encourage in UI (“Helps your insights later”)

### 2.8 Multi-day Events

Short term: keep `eventName` as free text but:

* In “copy previous session”, pull from same `eventName` if same track & recent date.
* Later: introduce `events` collection.

---

## 3. Lap Time Charts + Insights v1

### 3.1 Goal

On an **Event / Track Day** view:

* Show a visual chart of fastest lap times per session
* Allow overlays for selected variables (confidence, pressures, temp, etc.)
* Provide simple correlations: “What seems to make you faster?”

### 3.2 Data Model / Structure

No changes needed beyond `fastestLapSec`, `confidence`, pressures, weather.

Important: Store lap as seconds in `fastestLapSec`.

### 3.3 Queries

Assume per “event” we group by `(trackId, date, riderId)` or `eventName`.

For now, simplest: sessions for rider + track within a given date range (one track day):

```ts
const q = query(
  collection(db, 'sessions'),
  where('riderId', '==', riderId),
  where('trackId', '==', trackId),
  where('date', '>=', dayStart),
  where('date', '<=', dayEnd),
  orderBy('date', 'asc'),
);
```

Transform to chart data:

```ts
type SessionChartPoint = {
  sessionIndex: number;        // 1..N
  sessionId: string;
  fastestLapSec: number | null;
  confidence?: number;
  frontColdPsi?: number;
  rearColdPsi?: number;
  airTempC?: number;
  sessionNumber?: number;
};
```

### 3.4 Chart UI

Component: `<LapTimeChart />`

* Library: `recharts` (e.g., `LineChart`)
* X-axis: `sessionIndex` or `sessionNumber`
* Y-axis: `fastestLapSec` (inverted if you want “lower is faster” visually)

Controls:

* Toggle chips for overlay fields:

  * Confidence
  * Front/Rear cold PSI
  * Air temp
* Each overlay:

  * Normalise to same visual range (or use right-side Y-axis with visual hint).

### 3.5 Insights v1 (Heuristic)

Compute simple correlations on client:

1. For each overlay variable `X` and lap time `Y = fastestLapSec`:

   * Only use sessions where both `X` and `Y` exist.
   * Compute Pearson correlation `r`.
2. Interpret:

```ts
if (Math.abs(r) < 0.2) → "no clear pattern yet"
if (r <= -0.2) → "higher X is associated with faster laps"
if (r >= 0.2) → "higher X is associated with slower laps"
```

3. For each overlay, surface summary:

* Example:

  * “Higher confidence is strongly associated with faster lap times.”
  * “Running higher front pressure correlates with slightly slower laps (early indication).”

UI Component: `<PerformanceInsights />`

* List of cards, one per factor with:

  * icon
  * headline
  * short explanation
  * “Data quality” (how many sessions contributed)

Log event: `insights_viewed`.

---

## 4. Paddock v1

### 4.1 Goal

Allow riders to see **anonymised setups** for a specific **Track + Date**, without complex roles or privacy management.

### 4.2 Security Rules

For now (as in PoC): authenticated users can read all `sessions`. 

Later: move to a derived paddock collection.

```js
match /sessions/{sessionId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null; // paddock mode
  allow update, delete: if request.auth != null &&
                        request.auth.uid == resource.data.riderId;
}
```

### 4.3 Queries

Route: `/events/paddock` or `/paddock`

Inputs:

* `trackId` (required)
* `date` (defaults to today)

Query:

```ts
const dayStart = Timestamp.fromDate(startOfDay(selectedDate));
const dayEnd = Timestamp.fromDate(endOfDay(selectedDate));

const q = query(
  collection(db, 'sessions'),
  where('trackId', '==', selectedTrackId),
  where('date', '>=', dayStart),
  where('date', '<=', dayEnd),
  orderBy('date', 'asc'),
);
```

Optional: limit to last N sessions if needed.

### 4.4 Data Shaping

Sanitize client-side:

```ts
type PaddockRow = {
  riderShortName: string; // first name or initials only
  bikeLabel: string;      // "Yamaha R6 (2018)"
  tyreFront: string;      // "Pirelli SC1"
  tyreRear: string;
  frontColdPsi?: number;
  rearColdPsi?: number;
  fastestLapSec?: number;
  sessionNumber?: number;
};
```

From `rider.displayName`, compute:

```ts
const riderShortName = displayName.split(' ')[0]; // first name only
```

No email, no notes, no detailed suspension.

### 4.5 UI Implementation

Page: `/paddock`

Layout:

* Filters panel:

  * Track select
  * Date picker
* Table / cards:

Columns:

* Rider (short name)
* Bike
* Tyres (front / rear brand + compound)
* Front/Rear cold PSI
* Fastest lap (pretty formatted `mm:ss.xxx`)
* Optional: session number

Interactions:

* Sorting: fastest lap ascending, pressures, etc.
* Quick filter chips (e.g., show only riders within ±5 PSI of your front).

Performance:

* Keep to ≤ 100 rows per query.
* If more, add pagination or “Load more”.

---

## 5. Implementation Plan (Tier 0 Only)

### Phase 1 — Skill-Mode & Profile

1. Extend `Rider` model + backfill default `experienceLevel = 'novice'`.
2. Build `<SkillModeSelector />` on Rider page.
3. Add `SKILL_MODES` config and `isFieldVisible` helper.
4. Refactor Session form to respect skill modes.

### Phase 2 — Fast Session Loop

1. Add Garage defaults to `Bike` model + Garage UI.
2. Implement `Use bike defaults` on session form.
3. Implement `Copy previous session` query + prefill.
4. Wire confidence slider + new gearing/tyre fields.
5. Ensure auto-weather flow is stable & overridable.

### Phase 3 — Lap Chart + Insights

1. Add `/events/[eventId]` or equivalent event/track-day view.
2. Implement sessions query + `LapTimeChart`.
3. Implement `PerformanceInsights` with simple correlations.

### Phase 4 — Paddock v1

1. Implement `/paddock` page with filters.
2. Implement Paddock query + row shaping.
3. Add guardrails about data visibility (small note for early testers).

---

If you like, I can now:

* Turn this into a **single `.md` file** you can drop straight into the repo, or
* Break it into **4 smaller specs** (one per feature) with checklists for your devs.
