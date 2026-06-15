// Dialled MTB tech tree — canonical feature (node) data.
// Ported verbatim from dialled_tech_tree.html (June 2026, v1.0): id/lane/col/row/
// title/cats/phase/deps unchanged — the layout maths depends on them.
// The hand-authored `status` migrated to `lifecycle` (fallback only; a feature
// with >=1 public release derives `shipped`).
//
// INTERNAL FIELDS (`desc`, `why`, `scores`) and internal-visibility nodes must
// never reach the public bundle. This module is server-only; public views are
// built via views.js which strips internal content before serialisation.
import 'server-only';

export const LAYOUT = { COL_W: 262, ROW_H: 90, NODE_W: 206, NODE_H: 72, PAD_X: 124, PAD_Y: 50 };

export const STATUS_LABEL = {
  shipped: 'Live',
  progress: 'Building',
  next: 'Next',
  open: 'Open',
  validate: 'Validate',
  locked: 'Phase 2',
  avoid: 'Avoid',
  kill: 'Kill',
};

export const LANE_LABEL = { core: 'Core', setup: 'Setup', labs: 'Labs' };
export const CAT_LABEL = { utility: 'Utility', safety: 'Safety / operational', provenance: 'Trust / provenance' };

// Lifecycle states rendered on the public route (§5.3 — confirmed by David
// 2026-06-10: Live/Building/Next/Open, Locked shown, Validate/Avoid/Kill stripped).
export const PUBLIC_LIFECYCLES = ['shipped', 'progress', 'next', 'open', 'locked'];

export const FEATURES = [
  /* CORE (rows 0-2) */
  {
    id: 'core_loop', lane: 'core', col: 0, row: 0, title: 'Maintenance Loop', lifecycle: 'shipped',
    visibility: 'public',
    publicSummary: 'Ride log → counters → service thresholds → reminders. Deterministic maintenance tracking at the heart of the app.',
    desc: 'Ride log → counters → threshold → reminder. Fully deterministic: no AI, no parts database.',
    why: 'The heart of the product. Must never feel experimental. Everything else on this board is optional next to it.',
    deps: [],
  },
  {
    id: 'imperial', lane: 'core', col: 1, row: 0, title: 'Imperial Units', lifecycle: 'open',
    visibility: 'public',
    publicSummary: 'Distance and elevation in miles or kilometres — stored metric underneath, converted at display.',
    desc: 'distanceUnit "metric" | "imperial" on the profile. Stored metric internally, converted at render.',
    why: 'Cheap polish that removes a real friction point for a chunk of the audience. Coach Snapshot still reads metric server-side, so it does not destabilise sharing.',
    deps: ['core_loop'],
  },
  {
    id: 'sync_harden', lane: 'core', col: 2, row: 0, title: 'Sync & Reminder Trust', lifecycle: 'open',
    visibility: 'public',
    publicSummary: 'Counter accuracy, no lost data, and reminders that fire reliably across devices.',
    desc: 'Counter accuracy, no lost data, reminders that fire reliably across devices.',
    why: 'If a reminder is wrong once, the core promise breaks. Unglamorous, defensive, non-negotiable.',
    deps: ['core_loop'],
  },
  {
    id: 'default_intervals', lane: 'core', col: 1, row: 1, title: 'Sensible Default Intervals', lifecycle: 'next',
    visibility: 'public',
    publicSummary: 'Sensible category-default service intervals with clear guidance, out of the box.',
    desc: 'Category defaults plus clear copy so free users know when to service — without needing a parts database.',
    why: 'The freemium gap is a content and onboarding problem, not a feature deficit. The cheapest credibility win on the board.',
    deps: ['core_loop'],
  },
  {
    id: 'health_mileage', lane: 'core', col: 1, row: 2, title: 'Health Mileage Source', lifecycle: 'open',
    visibility: 'public',
    publicSummary: 'Apple Health / Health Connect as a universal distance and hours source for maintenance counters.',
    desc: 'Apple Health / Google Health Connect as the universal distance & hours feed for maintenance counters.',
    why: 'Universal, compliant mileage with none of Strava’s baggage. Sits cleanly in the non-AI maintenance lane.',
    deps: ['core_loop'],
  },
  {
    id: 'strava_gear', lane: 'core', col: 2, row: 2, title: 'Strava Gear Attribution', lifecycle: 'open', cats: ['utility'],
    visibility: 'public',
    publicSummary: 'Optional Strava connection for ride import and per-bike gear attribution.',
    desc: 'Optional power-user OAuth for gear attribution. Feeds maintenance counters only — never the OpenAI prompt.',
    why: 'Strava’s Nov-2024 AI ban is a hard architectural line. Useful for power users, but the boundary is enforced at the data pipeline, not in the docs.',
    deps: ['health_mileage'],
  },

  /* MAINTENANCE TRACKING v1 (core lane, col 3-4) — maintenance_tracking_v1_build_spec.md */
  {
    id: 'maint_catalogue', lane: 'core', col: 3, row: 0, title: 'Component Catalogue', lifecycle: 'next',
    visibility: 'public',
    publicSummary: 'A config-driven catalogue of trackable components and their default service intervals — extendable without an app update.',
    desc: 'app_config/maintenance_catalogue, seeded from the parts service guide CSV. Component types + default intervals are Firestore-tunable, mirroring app_config/tyre_deltas. Adding a component type is a config edit, not a release.',
    why: 'The principled answer to "we can’t have a drop-down for every part": the list is data. Ship a sensible default set, grow it without rebuilds. Spec §3.',
    deps: ['core_loop'],
  },
  {
    id: 'component_tracking', lane: 'core', col: 3, row: 1, title: 'Component-Level Tracking', lifecycle: 'next',
    visibility: 'public',
    publicSummary: 'Register the serviceable parts on your bike — fork, shock, brakes, drivetrain, dropper, bearings, tyres — each with its own service interval, so reminders fire per component, not per bike.',
    desc: 'TrackedComponent[] (embedded map per §13.1, pending bike-doc-size check) carrying per-action ServiceSpecs with counters. Per-component due derivation is a pure function over the existing counter + stored interval — deterministic, free-tier, offline. Brake bleed interval is config-derived brand→fluid, never LLM. DueState kept separate from fitConfidence. Spec §2–§5.',
    why: 'Turns the per-bike maintenance loop into a per-component one — the upgrade riders actually feel. Stays deterministic so the free/offline spine holds.',
    deps: ['core_loop', 'default_intervals'],
  },
  {
    id: 'service_logging', lane: 'core', col: 3, row: 2, title: 'Service Logging & History', lifecycle: 'next',
    visibility: 'public',
    publicSummary: 'Log a service (DIY or shop), tick what was done to reset the right counters, and keep a running service history per bike. Free.',
    desc: 'applyServiceEvent mirrors applyAdvisorProposal’s atomic batch: writes a ServiceEvent to the bikes/{id}/serviceEvents subcollection, resets the touched components’ counters, bumps stateVersion once. serviceEvents render reverse-chron as the retention surface. DIY log + photo attach are free; only AI parse is gated. Spec §6, §8.',
    why: 'The reset path that makes counters mean something, and the reason to open the app between rides. One engine, two entry points (DIY here, receipt parse in Scan & Store).',
    deps: ['component_tracking'],
  },
  {
    id: 'interval_advisor', lane: 'core', col: 4, row: 1, title: 'Advisor Interval Suggestions', lifecycle: 'open', cats: ['utility'],
    visibility: 'public',
    publicSummary: 'For Premium riders: the Advisor can suggest a sensible service interval for a specific component — you confirm or edit before it’s stored.',
    desc: 'suggestServiceInterval Cloud Function (sibling to generateRideInsight). Parametric suggestion → confirm card → stored with source:"advisor". Called at most once per component-add; the reminder loop it feeds is free and offline. Safety-critical intervals (brakes) may shorten but never lengthen the category default. Premium. Spec §4.3, §4.4.',
    why: 'The "third source" of intervals — refinement, not the spine. Propose-confirm-store discipline means an AI guess never silently becomes a stored fact.',
    deps: ['component_tracking', 'advisor'],
  },
  {
    id: 'scan_store', lane: 'core', col: 4, row: 2, title: 'Scan & Store', lifecycle: 'open', cats: ['utility'],
    visibility: 'public',
    publicSummary: 'For Premium riders: attach a workshop receipt and let the Advisor read off what was serviced — you confirm the line items before any counter resets.',
    desc: 'parseServiceReceipt Cloud Function (lifts the Rehab Path document-parse pattern). Parse → confirm card (high-confidence rows default on) → confirmed set becomes the ServiceEvent and routes through the same applyServiceEvent. Never auto-commits. Tier labels (Bronze/Gold) are display metadata, never a reset trigger. Receipts never enter a coach snapshot. Premium. Spec §7.',
    why: 'Path B of the same service-event engine: a data-entry assistant for paid services, not a separate subsystem. The confirm gate is mandatory — a misparsed "brake inspection"→"bleed" would be safety-adjacent.',
    deps: ['service_logging', 'advisor'],
  },

  /* SETUP (rows 3-7) */
  {
    id: 'calculators', lane: 'setup', col: 0, row: 4, title: 'Setup Calculators', lifecycle: 'shipped',
    visibility: 'public',
    publicSummary: 'Suspension PSI, sag and tyre pressure calculators with MTB-specific ranges.',
    desc: 'Suspension PSI, sag, tyre pressure. MTB-specific ranges (~14–40 PSI).',
    why: 'Second pillar. Immediately useful and understandable. Root of the entire setup branch.',
    deps: [],
  },
  {
    id: 'advisor', lane: 'setup', col: 0, row: 6, title: 'AI Advisor — Premium', lifecycle: 'shipped', cats: ['utility'],
    visibility: 'public',
    publicSummary: 'AI-backed setup and maintenance Q&A for Premium riders.',
    desc: 'OpenAI-backed setup Q&A, Premium-gated. A supporting layer, not the foundation.',
    why: 'The upsell. Confident-but-wrong output is the single biggest trust risk — guarded at the spec level, not left to chance.',
    deps: [],
  },
  {
    id: 'tyre_config', lane: 'setup', col: 1, row: 3, title: 'Tyre Config Upgrade', lifecycle: 'progress',
    visibility: 'public',
    publicSummary: 'Tyre casing, tubeless and insert-aware pressure guidance from a curated catalogue.',
    desc: 'Casing / tubeless / insert deltas. Curated catalogue from mtb_tyres_uk.csv plus a manual-add fallback.',
    why: 'Straight off Wayne’s feedback card. Makes PSI output actually reflect the rider’s tyres. Spec’d; deltas Firestore-tunable without an app release.',
    deps: ['calculators'],
  },
  {
    id: 'bikestate', lane: 'setup', col: 1, row: 5, title: 'BikeState + fitConfidence', lifecycle: 'progress',
    visibility: 'public',
    publicSummary: 'A structured record of your bike’s current setup that tracks where each value came from.',
    desc: 'Schema v1, touchField helper, dual-write, confidence derivation (25/25 tests green).',
    why: 'Units 1–2 done. The substrate that Coach Snapshot, write-back and confidence chips all stand on.',
    deps: ['calculators'],
  },
  {
    id: 'gravel', lane: 'setup', col: 3, row: 3, title: 'Gravel / Rigid Support', lifecycle: 'open',
    visibility: 'public',
    publicSummary: 'Zero-travel and higher pressure ranges for gravel and rigid bikes.',
    desc: 'Zero-travel input and higher PSI ranges. A post-launch positioning call (involves Ashleigh).',
    why: 'Half-hearted support produces confidently wrong advisor output — gravel runs much higher PSI than the MTB range. Either do it properly or hold the line. Already on the risk register.',
    deps: ['tyre_config'],
  },
  {
    id: 'conf_chips', lane: 'setup', col: 2, row: 5, title: 'Confidence Chips + Quick-Confirm', lifecycle: 'next',
    visibility: 'public',
    publicSummary: 'Per-field confidence indicators with one-tap confirm on the setup screen.',
    desc: 'Per-field confidence chip on the setup screen plus a one-tap confirm gesture.',
    why: 'Literally the next unit. Surfaces trust state to the rider and is the precondition for sharing a snapshot that means anything.',
    deps: ['bikestate'],
  },
  {
    id: 'writeback', lane: 'setup', col: 2, row: 6, title: 'AI Advisor Write-Back', lifecycle: 'open', cats: ['utility'],
    visibility: 'public',
    publicSummary: 'Apply the Advisor’s suggested setup values to your bike in one tap, with a confirm step.',
    desc: 'Apply the advisor’s numeric suggestions into setup in one tap, with a confirm step. Six fields, no schema growth.',
    why: 'Closes the loop between advice and state. Applied values deliberately read as "estimated", not "confirmed" — so an AI guess never launders itself into ground truth.',
    deps: ['bikestate', 'advisor'],
  },
  {
    id: 'component_setup', lane: 'setup', col: 3, row: 6, title: 'Component-Level Setup', lifecycle: 'locked',
    visibility: 'public',
    publicSummary: 'Component-level setup records — torque, spoke tension, fluid specs.',
    desc: 'Torque, spoke tension, fluid specs — fields the advisor already mentions but currently cannot write.',
    why: 'Explicitly Phase 2. Resist adding fields to capture advisor output early; that is exactly how scope creeps in.',
    deps: ['writeback'],
  },

  /* LABS (rows 8-13) */
  {
    id: 'nfc_switch', lane: 'labs', col: 1, row: 9, title: 'NFC Quick Switch', lifecycle: 'open', cats: ['utility'], phase: 'Labs P1',
    visibility: 'public',
    publicSummary: 'Tap an NFC tag on your bike to instantly load its profile, setup and maintenance context.',
    scores: { c: 9, d: 3, o: 2, s: 8 },
    desc: 'Tap the bike → its profile, setup and maintenance context loads instantly.',
    why: 'Solves multi-bike friction at the moment it hurts most. Low risk, demonstrable, high perceived value. The obvious Labs opener and the spine everything else hangs off.',
    deps: ['core_loop'],
  },
  {
    id: 'coach_share', lane: 'labs', col: 2, row: 8, title: 'Coach Snapshot / Share', lifecycle: 'progress', cats: ['utility'],
    visibility: 'public',
    publicSummary: 'Share a read-only snapshot of your bike setup with a coach via a private link.',
    desc: 'Read-only setup snapshot via token at arcturusdc.com/.../coach/[token]; rider-side Create / Active Shares UI.',
    why: 'Already in flight. The sharing & permissions architecture that Coach Mode reuses — the bridge that carries the setup branch into Labs.',
    deps: ['conf_chips'],
  },
  {
    id: 'coach_mode', lane: 'labs', col: 3, row: 8, title: 'Coach / Instructor Mode', lifecycle: 'open', cats: ['utility'], phase: 'Labs P2',
    visibility: 'public',
    publicSummary: 'Coaches access rider setup and bike context read-only, during sessions.',
    scores: { c: 6, d: 5, o: 4, s: 6 },
    desc: 'A coach taps the rider to access setup and bike context, read-only.',
    why: 'Likely emerges from the snapshot sharing layer rather than as a standalone build. Modest, but cheap once sharing exists.',
    deps: ['coach_share', 'nfc_switch'],
  },
  {
    id: 'emergency_tag', lane: 'labs', col: 2, row: 10, title: 'Emergency Rider Tag', lifecycle: 'validate', cats: ['safety'], phase: 'Tier B',
    visibility: 'public', // lifecycle 'validate' keeps it off the public route per §5.3
    publicSummary: 'Emergency contact and rider info on an NFC tag — readable by any phone, no app install.',
    scores: { c: 8, d: 5, o: 6, s: 8 },
    desc: 'ICE info, allergies and rider context via NFC on helmet or bike — accessible without an app install.',
    why: 'Emotionally compelling, premium-feel. A public endpoint with medical data means Jo reviews before any rollout. Frame as "helpful information", never a "safety system".',
    deps: ['nfc_switch'],
  },
  {
    id: 'verified_service', lane: 'labs', col: 3, row: 10, title: 'Verified Mechanical Servicing', lifecycle: 'open', cats: ['provenance'], phase: 'Labs P3',
    visibility: 'public',
    publicSummary: 'Workshops add verified, timestamped service records to a bike’s history.',
    scores: { c: 9, d: 7, o: 8, s: 10 },
    desc: 'Workshops write timestamped, immutable, attributed service records to a bike’s history via NFC.',
    why: 'The single highest-leverage node on the board: real network effects, B2B revenue, switching costs. An immutable trail that travels with the bike across ownership. Pilot partner via Ashleigh; scope the workshop UX before any build.',
    deps: ['nfc_switch'],
  },
  {
    id: 'uplift', lane: 'labs', col: 3, row: 12, title: 'Uplift / Bike Park Check-In', lifecycle: 'validate', cats: ['safety'], phase: 'Tier B',
    visibility: 'public', // lifecycle 'validate' keeps it off the public route per §5.3
    publicSummary: 'NFC check-in for uplifts, bike parks and events.',
    scores: { c: 8, d: 6, o: 8, s: 9 },
    desc: 'NFC validation for uplifts, bike parks and events. Embeds Dialled physically in venues.',
    why: 'Real B2B potential, but operationally heavy — live-event support and offline reliability are hard requirements. Validate the ops burden before committing.',
    deps: ['nfc_switch', 'emergency_tag'],
  },

  /* AVOID terminals (col 4) — internal only, never in the public bundle (§5) */
  {
    id: 'passport', lane: 'labs', col: 4, row: 8, title: 'Rider Experience Passport', lifecycle: 'avoid', cats: ['provenance'],
    visibility: 'internal',
    scores: { c: 7, d: 8, o: 9, s: 9 },
    desc: 'A capability / grading system for riders.',
    why: 'MTB culture is anti-gatekeeping. Reads as elitist regardless of framing, especially competition-adjacent. Brand-damage risk outweighs the upside. Non-goal: identity systems.',
    deps: ['coach_mode'],
  },
  {
    id: 'antitheft', lane: 'labs', col: 4, row: 11, title: 'Ownership / Anti-Theft Identity', lifecycle: 'kill', cats: ['provenance'],
    visibility: 'internal',
    scores: { c: 8, d: 9, o: 10, s: 9 },
    desc: 'Identity infrastructure, a theft registry and dispute resolution for stolen bikes.',
    why: 'Not a feature — a different company. Needs identity infra, legal trust systems and a registry. BikeRegister already exists. Non-goal: identity systems.',
    deps: ['verified_service'],
  },
  {
    id: 'checkpoint', lane: 'labs', col: 4, row: 12, title: 'Event Checkpoint Validation', lifecycle: 'avoid', cats: ['safety'],
    visibility: 'internal',
    scores: { c: 5, d: 7, o: 7, s: 5 },
    desc: 'NFC checkpoints for timing and validation at events.',
    why: 'GPS, Strava and timing systems already solve this. Niche market, strong incumbents, high offline-reliability bar. A feature without a business behind it.',
    deps: ['uplift'],
  },
];

export const FEATURES_BY_ID = Object.fromEntries(FEATURES.map((f) => [f.id, f]));
