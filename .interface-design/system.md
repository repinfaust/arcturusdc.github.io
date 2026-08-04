# ArcturusDC interface design system

## Dialled MTB analytics

### Direction and feel
- Audience: founders and product operators checking rider growth, activation, engagement, and commercial mix between decisions.
- Feel: compact trail telemetry — technical, direct, high-contrast, and legible at a glance without becoming a generic BI dashboard.
- Domain cues: rider progression, trail cadence, maintenance signals, plan composition, and cumulative adoption.

### Palette
- Canvas: `#0D1013`.
- Raised data surface: `#12161A`; secondary surface: `#15191D`.
- Primary text: `#F4F6F8`; supporting text: `#A8B0B8`; metadata: `#7E8790`; muted: `#68717A`.
- Registered/free accent: `#F72585`; hover/emphasis: `#FF6EAF`.
- Premium accent: `#0284C7`.
- Color communicates brand, series identity, active controls, or state only; it is not decorative.

### Depth and surfaces
- Borders-first depth on the dark canvas. Use low-opacity white borders (`white/10` standard, `white/5` soft) and quiet surface shifts.
- Do not introduce drop shadows for dashboard cards. Tooltips or overlays may use a restrained shadow when separation is otherwise unclear.
- Cards use the established `rounded-xl`; compact controls use `rounded-md` inside a `rounded-lg` group.

### Typography
- Preserve the existing site/Dialled typography.
- Use heavy, tightly tracked display text for headings; compact uppercase labels for telemetry metadata.
- Use monospace with tabular numbers for dates, axes, counts, ranges, and data readouts.

### Spacing
- Base unit: 4px.
- Control micro-spacing: 4–8px; component spacing: 12–16px; card padding: 20–24px; section spacing: 28px.

### Reusable patterns

#### Trend chart
- Keep explicit integer labels on the vertical axis and dated ticks on the horizontal axis.
- Every plotted point exposes its exact date and value in a native SVG tooltip.
- Use visible point markers, faint grid lines, and end-of-line values; keep the line itself at 2px.
- A single cumulative series may use an integer scale bounded around the selected period so small changes remain legible.
- Comparative series use a zero baseline when magnitude comparison matters; do not exaggerate plan differences.
- Never backfill or interpolate facts the source does not record. Carry-forward is allowed only for cumulative facts that are exactly derivable.

#### Time-range control
- Offer independent `Week`, `Month`, `Year`, and `Lifetime` controls per chart.
- Windows are rolling 7, 30, and 365 days ending at the latest available point; Lifetime uses all available history.
- Week labels every day. Month retains daily ticks with compact rotated labels. Year and Lifetime reduce label density to readable month/period ticks while retaining exact point tooltips.
- Use a compact segmented group on the inset canvas surface. The active range uses the Dialled magenta fill; all buttons require hover, pressed, and keyboard-focus states.
- Display the resolved date span beside the control so shortened source histories are explicit.

#### Data integrity
- Registration history comes from Firebase `createdAt` and may carry its cumulative total through days with no signup.
- Premium/free history comes only from stored daily dashboard snapshots. Do not infer historic premium state, fill missing snapshots, or project current status backwards.

#### Country distribution
- Present GA4 country geography as ranked brand-native horizontal bars, never as a precision map and never with city-level data.
- Merge duplicate normalized country labels before display, group the remainder after the top eight as `Other countries`, and normalize all displayed country observations to a 100% distribution.
- Use the percentage itself as the bar width on a true 0–100% track and show percentage labels only. Do not expose raw GA4 active-user counts beside Firestore registration totals because anonymous/pre-registration activity and multi-country activity make those populations non-comparable.
- Keep the source caveat visible: aggregate and consent-dependent, not joined to rider profiles, unable to exclude internal accounts, and subject to GA4 privacy thresholding.
- Preserve each product's expression: magenta telemetry bars on Dialled's dark surface; orange dot-matrix bars on Sidestand's paper/ink surface.
