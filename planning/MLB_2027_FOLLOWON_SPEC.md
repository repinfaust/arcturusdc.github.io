# MLB 2027 follow-on — does pre-game context add anything the line has not priced?

_DRAFT, 2026-10-08. Not adopted, no D-number, nothing built. It becomes binding only when David
approves it and the open decisions in §10 are settled. Companion to `MLB_BET_SELECTION_SPEC.md`
(the method) and `MLB_FILTER_REGISTRATION.md` (the 2026 tests). It inherits every rule in both
unless this document says otherwise._

---

## 0. Purpose (inherits `MLB_BET_SELECTION_SPEC.md` §6a unchanged)

This is a proof of concept, not a plan to bet. No meaningful money is staked on any outcome.
**"The context adds nothing the market has not already priced" is the most likely honest
result, and it counts as success.**

---

## 1. The question

The 2026 study asks whether the **market's own movement** between opener and T-2h carries
signal. This follow-on asks a different, separately testable question:

> Is there a **pre-defined, physically grounded piece of pre-game information**, known by T-2h,
> such that games where it is extreme are picked correctly **> 52.4%** of the time,
> **forward and out-of-sample**, at the real T-2h price?

It is **not** "fit a model with many inputs and see what wins." That is how the 2025 "61.5%"
happened. Each input becomes a single, simple, directional rule. Its threshold is frozen before
the games it is scored on exist.

---

## 2. Why this is a new study and not an extension of 2026

1. **Different inputs.** The 2026 collector stores market prices, probable starters, lineup
   and pitcher-change events, and venue name. It does not store weather, bullpen usage or
   player/pitcher performance stats. These must be collected live, timestamped, from day one.
2. **Rules must precede data.** A rule chosen after seeing finished games is a backfit,
   whatever the sample size. A large 2026 sample does not change this. It only makes a
   backfit look more convincing.
3. **The 2026 forward window is protected.** See §7.

What 2026 legitimately contributes is **design information**: how often and when lines move,
selection volumes, snapshot timing, collector failure modes, and the measured vig (F0 = 51.5%,
n=281). None of that requires reading forward-window correctness.

---

## 3. Hypotheses (one primary, the rest exploratory)

Each candidate is ranked by how cleanly it can be measured before T-2h without leakage.

| id | Input | Rule shape | Leakage risk | Recommended role |
|---|---|---|---|---|
| `W1_wind` | Forecast wind component toward centre field at first pitch, open-air parks only | `W >= +ω` → Over; `W <= −ω` → Under | Low: forecast fetched and stored at T-2h | **Primary (recommended)** |
| `W2_temp` | Forecast temperature at first pitch, open-air parks | `T >= τ_hi` → Over; `T <= τ_lo` → Under | Low | Exploratory |
| `B1_pen` | Relief innings pitched by both bullpens over the previous 3 calendar days | `B >= β` → Over | Low if computed only from games final before the T-2h capture time | Exploratory, or second primary (§10) |
| `S1_starter` | Starter change after opener (already collected as `pitcherChangedBeforeT2h`) | as 2026 `F3_pitcher` | Low | **Not re-tested.** ~2% selectivity cannot reach sample in a season |
| `U1_ump` | Home-plate umpire's historical run environment | — | **High**: needs multi-season history and late assignments | **Out of scope for 2027** |

**Why wind is recommended as primary:** it has a physical mechanism (carry on fly balls). It is
fully observable before T-2h. It is a single number. It produces a direction (Over/Under), not
just a confidence. The honest prior is that books already price forecast wind well, which makes
it a clean test of "does the market miss it". It does not assume the market misses it.

**Directional, not model-based.** No regression or fitted weights. Each rule picks a side from
the input alone and is graded at the T-2h price for that side. A rule that agrees with the
market's lean and one that disagrees are both valid outcomes to measure. Neither is assumed.

### Wind feature definition (to be frozen)

```
W = windSpeedMph × cos(windBearingTo − parkBearingHomeToCF)
```

- `windBearingTo` is the direction the wind blows **towards** (forecast APIs usually report
  "from"; convert explicitly).
- `parkBearingHomeToCF` comes from a **static park table**, written and frozen before opening
  day, with its source cited per park.
- **Fixed-roof and retractable-roof parks are excluded entirely.** Roof status is not reliably
  known at T-2h. Including them would add noise or leakage. The exclusion list is part of the
  frozen park table.
- The forecast is for the scheduled first-pitch hour, **fetched at the T-2h capture**, stored
  with its own `fetchedAtIso`. Never an observed or after-the-fact value.

---

## 4. Leakage rules (binding; D-SITE-007 lesson)

1. Every input stored with a capture timestamp. A rule may only use inputs whose timestamp is
   **≤ the T-2h odds snapshot's `capturedAtIso`** for that game.
2. Weather = **forecast as fetched at the time**, never historical observations. A backfill
   of observed weather is a different quantity and may not be mixed into evaluation.
3. Bullpen usage = computed only from games whose final status was recorded **before** the
   capture. A doubleheader game 1 still in progress at capture does not count.
4. No input may be re-fetched or "corrected" after first pitch. A failed fetch is stored as
   failed; the game is ineligible (fail closed), and the count of such games is reported.
5. Ineligibility counts are reported per cause at evaluation. Silently dropped games are a
   gate failure (same rule as the 2026 ~9% opener-matching item).

---

## 5. Calibration and evaluation windows

| | |
|---|---|
| Calibration | First **21 slate-days** of the 2027 regular season. **Predictor distribution only**: no correctness, win rate or P&L read. |
| Thresholds | ω (and τ, β if registered) = **80th percentile** of the feature's own distribution over calibration games. Same percentile as 2026, so no percentile search. |
| Registration | A dated `MLB_2027_FILTER_REGISTRATION.md`, frozen and committed **before the first evaluation game**. |
| Evaluation | Every eligible game from slate-day 22 onward. Calibration games are permanently excluded. |

**Why calibrate in 2027, not on 2026 data:** live inputs are forecasts captured at T-2h, and no
like-for-like 2026 record exists. Calibrating on a different quantity (observed weather) would
freeze a threshold on the wrong distribution. Early-season weather is colder and more variable,
which is a known shift. It is accepted and recorded, not corrected after the fact.

---

## 6. Gates

The five gates of `MLB_BET_SELECTION_SPEC.md` §5 apply unchanged (accuracy, EV, sample,
stability, robustness at worst-of-books pricing). Added:

6. **Incremental gate.** On the same evaluation games, the rule's selected subset must beat
   the market-only null (`F0_all` re-measured on 2027 games) on EV. A rule that only matches
   the vig has shown nothing.
7. **Multiple-comparisons gate.** One primary at α = 0.05. Every exploratory rule at
   0.05 / (number of exploratory rules). If two primaries share one evaluation window, each is
   at 0.025. (Unlike 2026 F2/F4b, these windows would not be disjoint.)

**Bet nothing** unless the primary passes all seven. An exploratory pass is a reason to
register a new test for 2028, never a reason to bet.

---

## 7. Protection of the 2026 study (binding)

- No 2027 work may compute correctness, win rate or P&L on any 2026 game finalizing on or after
  **2026-08-17** until F2 and F4b have been evaluated under their own registrations.
- The 2026 sandbox (≤ 2026-08-16, already scored) may be used for exploration and code testing
  only. No result on it satisfies any gate here.
- F2 and F4b keep accumulating in 2027 on the existing collector, unaffected. The follow-on adds
  stored fields. It does not change any field, function or schedule the 2026 tests depend on.

---

## 8. Volume and timeline (estimates, to be re-checked)

- A full regular season is roughly 2,400 games. Excluding domed/retractable parks leaves about
  three-quarters of that, minus calibration (~21 slate-days).
- At ~20% selectivity, `W1_wind` would select on the order of **300–400** games over the
  evaluation window. That is enough to reach gate 3's ~250+ **within 2027**, unlike 2026's F2
  and F4b. This depends on the park exclusion count and must be re-estimated once the park
  table exists.
- Earliest honest evaluation: end of the 2027 regular season (~late September 2027).

---

## 9. Build outline (off-season, separate approval before any code)

1. **Park table** (static JSON in repo): park id, home-to-CF bearing, roof type, source per
   park. Reviewed and frozen.
2. **Weather capture** inside the existing T-2h check: one forecast call per eligible game,
   stored on the game doc as `contextAtT2h.weather` with `fetchedAtIso`, provider, and raw
   values. Fail closed.
3. **Bullpen usage** (if registered) from the MLB Stats API (already the pinned source, free):
   relief IP for each team over the previous 3 days, computed at T-2h, stored with the list of
   source gamePks used.
4. **Dry run on spring training** (late Feb–Mar 2027): pipeline and fail-closed checks only. No
   scoring.
5. **Offseason idle check** must pass first (open item in the 2026 findings), so no cron spends
   credits before the 2027 schedule gate opens.
6. SoRR: a D-number for adopting this spec, and another for the frozen registration. All six
   existing MLB functions plus any new ones deploy as one bundle (D-SITE-030).

No new odds API calls are needed. Prices come from the existing T-2h snapshot.

---

## 10. Open decisions for David

1. **Primary hypothesis.** Recommendation: `W1_wind` alone. Alternative: `W1_wind` + `B1_pen`
   as two primaries at α = 0.025 each.
2. **Weather provider.** This is a new third-party service in a production data path, so it needs
   explicit approval under the Firebase-first rule. Transport: called from the existing Cloud
   Function, stored in Firestore. Candidates are to be compared on cost, forecast-hour
   granularity, and whether they expose the forecast as issued (not revised). Nothing chosen.
3. **Calibration length.** 21 slate-days recommended (~300 games). Shorter gives a larger
   evaluation window but a noisier threshold.
4. **Scope of exploratory set.** Recommended `W2_temp` and `B1_pen` only. Every added
   exploratory rule raises the bar for all of them (§6 gate 7).

---

## 11. What this is not

- Not a model-building exercise. No fitted weights, no feature search, no "try combinations".
- Not a reuse of 2026 forward-window outcomes for anything.
- Not a staking plan on any outcome (§0).
