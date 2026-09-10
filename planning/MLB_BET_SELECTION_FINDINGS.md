# MLB bet-selection — FINDINGS

_Live document. Each entry is dated and additive. Nothing here amends
`MLB_FILTER_REGISTRATION.md`, which is frozen._

---

## PURPOSE (restated 2026-09-10, binding on every entry below)

**This is a proof of concept. It is not a plan to bet, and not a plan to stake meaningful
money — no life savings, no meaningful bankroll, on any gate outcome.**

It is (a) a research instrument on whether pre-game information movement is exploitable at
real prices, (b) a reusable methods asset — pre-registration, no-leakage rigour,
fail-closed collection — which has already killed the 2025 "61.5%" leakage mirage and caught
four production bugs, and (c) **possibly, entirely TBD, a tool for _avoiding_ poor bets
rather than placing good ones.** That last use is undecided.

Its value does not depend on finding an edge. **No edge, do not bet** remains the most
likely honest outcome and is a success.

**Nothing below is a benchmark or a floor to improve on.** The figure that best represents
the project's value is `F0_all` = 51.5% over 281 games — the vig landing within ~0.1pp of
theory, which is what tells you the instrument is calibrated.

---

## 2026-09-10 — Exploratory sandbox scoring (pre-registration games only)

**Status: NO GATE EVALUATED. NO BET AUTHORISED. F2's forward test remains intact
and unspent.**

### What was scored, and what was deliberately not

Scored: the 315 EV-gradeable games finalizing **on or before 2026-08-16** — the
pre-registration sandbox, which `MLB_FILTER_REGISTRATION.md` §1 permanently excludes
from gate evaluation. These are the games that calibrated θ and φ scale.

**Not scored, not read, not computed:** any correctness value, win rate, or P&L on the
post-registration window (games finalizing 2026-08-17 or later). The scoring script
applies a hard date filter (`date <= '2026-08-16'`) and never queries beyond it.

**Why the distinction is the whole point.** The primary filter `F2_pmove` can be
evaluated exactly once against gate 3. If an interim forward result is computed, every
subsequent decision about F2 is made by a researcher who has seen it, and the forward
test is destroyed — this is spec §4's pre-registration rule and registration §0's
amendment rule. The sandbox costs nothing because it can never satisfy a gate.

### Context: why this was run now

David asked for a season-close review, recalling an agreement that season-end would be
sufficient. Registration §5 says "season-end at the earliest, and realistically 2027 for
gate 3" — the earliest moment scoring becomes *permissible*, not the moment the sample
becomes *sufficient*. The ambiguity is genuine and is recorded here so it is not
re-litigated from memory. Resolution: sandbox scored, forward window untouched.

### Sample

| | |
|---|---|
| Sandbox date range | 2026-07-18 → 2026-08-16 |
| EV-gradeable games in sandbox | 315 |
| Resolvable (both opener + T-2h snapshots matched) | 281 |
| Unresolvable | 34 (10.8%) — see Data quality below |

`P(Over)` computed at full precision via `impliedOverProb(overDec, underDec)` on
snapshot consensus prices, never from the 2dp-rounded `pOver` field, per registration §2.
Frozen thresholds applied unchanged: θ = 0.0274, φ = 0.0196.

### Correct-side accuracy, T-2h pick (breakeven 52.4% at -110)

| filter | selected | graded | pushes | win% | 95% CI (Wilson) |
|---|---|---|---|---|---|
| `F0_all` | 281 | 268 | 13 | 51.5% | 45.5 – 57.4 |
| `F1_revision` | 123 | 117 | 6 | 54.7% | 45.7 – 63.4 |
| **`F2_pmove` (PRIMARY)** | 58 | 55 | 3 | 50.9% | 38.1 – 63.6 |
| `F3_pitcher` | 6 | 6 | 0 | 33.3% | 9.7 – 70.0 |
| `F4_conf` | 55 | 53 | 2 | 60.4% | 46.9 – 72.4 |
| `F5_combo` | 23 | 22 | 1 | 63.6% | 43.0 – 80.3 |

**Every 95% CI lower bound is below 52.4%.** Gate 3 fails for all six filters on this
sample, before any other consideration.

### Realized P&L, flat 1u, at real prices after vig

| filter | bets | worst | consensus | best | mean dec (cons) | ROI% (cons) |
|---|---|---|---|---|---|---|
| `F0_all` | 281 | -14.39 | -10.67 | -5.66 | 1.865 | -3.80 |
| `F1_revision` | 123 | +0.69 | +2.31 | +4.72 | 1.866 | +1.88 |
| **`F2_pmove`** | 58 | -3.91 | -3.32 | -2.17 | 1.848 | -5.72 |
| `F3_pitcher` | 6 | -2.38 | -2.37 | -2.34 | 1.852 | -39.50 |
| `F4_conf` | 55 | +4.93 | +5.47 | +6.68 | 1.827 | +9.95 |
| `F5_combo` | 23 | +3.30 | +3.55 | +4.05 | 1.825 | +15.43 |

### Stability (held-out split, gate 4 in form only)

Split date 2026-08-04.

| filter | H1 n | H1 win% | H1 pnl | H2 n | H2 win% | H2 pnl |
|---|---|---|---|---|---|---|
| `F0_all` | 126 | 51.6% | -4.52 | 142 | 51.4% | -6.15 |
| `F1_revision` | 47 | 59.6% | +5.28 | 70 | 51.4% | -2.97 |
| **`F2_pmove`** | 19 | 42.1% | -4.38 | 36 | 55.6% | +1.06 |
| `F3_pitcher` | 5 | 20.0% | -3.20 | 1 | 100.0% | +0.83 |
| `F4_conf` | 23 | 60.9% | +2.55 | 30 | 60.0% | +2.92 |
| `F5_combo` | 10 | 70.0% | +2.77 | 12 | 58.3% | +0.78 |

### Findings

**1. The null benchmark behaves exactly as theory predicts, and this is the most
informative number in the report.** `F0_all` at 51.5% and -3.80% ROI over 281 games is
the vig arriving almost precisely where it should. This is evidence the *instrument* is
sound — prices, grading, and EV computation are internally consistent. It is not
evidence about any edge.

**2. The primary filter looks poor, and this must change nothing.** `F2_pmove` at 50.9%,
CI 38.1–63.6, -3.32u. That interval spans nearly every hypothesis worth holding, so it is
not evidence F2 is bad — it is evidence 55 games says almost nothing. Per registration §0,
a "better" variant suggested by a poor result is a **new** filter with a **new**
registration date. **F2 remains PRIMARY and remains frozen for 2027.**

**3. `F1_revision` profits at every price variant but fails on stability.** 54.7% over
117 graded games — the largest sample of the three positive-looking filters — and positive
at worst (+0.69), consensus (+2.31) and best (+4.72). But CI lower bound 45.7%, and the
split is unfavourable: 59.6% / +5.28 in H1 collapsing to 51.4% / -2.97 in H2. The apparent
edge lives entirely in the first half of the window. Gate 4 would not pass on this
evidence even if gate 3 could.

**4. F1 and F2 disagree, and that disagreement is worth recording before it matters.**
Both operationalise the same premise — pre-game information arrival moves the price.
Registration §2 notes F1 is the coarser proxy (a side flip is a large move, but a large
move need not flip the side). In the sandbox F1 reads 54.7% and profitable while F2 reads
50.9% and negative. Their CIs overlap almost entirely and both sit on calibration games,
so nothing should be read into it. **Recorded now because of what happens later:** if F2
comes back weak in 2027 while F1 again looks strong, swapping the primary at that point
would convert the forward test into a backfit. The temptation is foreseeable, so it is
written down while nothing is at stake.

**5. `F4_conf` and `F5_combo` are the eye-catching numbers and are the least
trustworthy.** F4 at 60.4% with +9.95% ROI, stable across the split (60.9% / 60.0%);
F5 at 63.6% with +15.43% ROI. Both have CI lower bounds below breakeven (46.9%, 43.0%),
both sit on the sample the thresholds were calibrated on — the sample where a filter is
most likely to flatter itself — and both are exploratory-only, carrying a
Bonferroni-corrected threshold of 0.05/5 = 0.01 that neither approaches. `F3_pitcher` at
n=6 is uninterpretable, as registration §2 predicted.

**6. Realised selectivity is on design.** F2 selected 20.6% of sandbox games (58/281)
against a ~20% target. In the post-registration window (selection counts only, no scoring)
F2 selects 61 of 278, 21.9%. The September distribution shift the registration warned
about has not materialised as of 2026-09-10.

### Data quality — open item

Snapshot matching is by exact `capturedAtIso` equality between the pick record and the
snapshot document. This fails to resolve:

| window | unresolvable | of | rate |
|---|---|---|---|
| Sandbox (≤ 2026-08-16) | 34 | 315 | 10.8% |
| Forward (≥ 2026-08-17) | 21 | 278 | 7.6% |

~9% overall. **Cause not yet established** — this may be the matching method rather than
missing data. Must be diagnosed before any gate evaluation: silently dropping ~9% of games
would bias the selected set in an unknown direction. No code changed for this yet.

### Forward-window status (counts only — no scoring performed)

| | |
|---|---|
| Post-registration EV-gradeable games | 278 |
| F2 selections | 61 (21.9%) |
| Gate 3 target | ~250+ |
| Accrual rate | ~2.6 F2 selections / slate-day |
| Remaining slate-days needed | ~73 |

Regular season ends within weeks; postseason is a handful of games/day. **This does not
conclude in 2026.** Accumulation resumes April 2027, exactly as registration §1 predicted.

### Answer to a direct question asked 2026-09-10

David asked, plainly: do we have — or will we have with x more games — grounding to model
additional data points/factors with a view to increasing profitability from these
benchmarks?

**No, and more games alone will not change it.** Two parts:

- **Sample.** Distinguishing a 55% filter from breakeven with a CI clearing 52.4% needs
  ~250–400 selected bets; a 53% edge needs well over a thousand. That is the easy half,
  and it is answered by time.
- **What the data can support.** The collector stores the market's own price at two
  moments plus the final total. There is no team-rate model, pitcher model, bullpen, park,
  lineup or weather data in this repo. D-SITE-007 already tested team rates and
  as-of-date pitcher form against a real closing line on 2,319 games (2024) and got ~50%,
  with the apparent pitcher signal proven to be look-ahead leakage. Modelling additional
  factors is **not an extension of what is running** — it is a different project requiring
  data the collector does not gather. More snapshots of the same two prices sharpen the
  estimate of how well the market prices itself; they can never say whether park or
  bullpen usage adds anything.

**On the word "benchmarks".** F1 54.7%, F4 60.4%, F5 63.6% are **not** benchmarks and must
not be treated as a floor to improve on. Every one has a CI lower bound below breakeven,
all sit on calibration games, and F1's edge lives in one half of the window. Treating them
as a floor is precisely the error that produced the 2025 "61.5%" mirage (D-SITE-007). The
only defensible benchmark here is `F0_all` at 51.5% — the vig, where theory says it
should be.

**The productive path, if factors are to be tested,** is not more of this collector. It is
choosing the factors, specifying them, and establishing whether they can be sourced
as-of-date without leakage — a new registration with a new date, scoped deliberately
rather than grown out of these results.

**Standing position unchanged: no bet until the project's end point and all five gates
pass on the primary filter.**

---

## 2026-09-10 (same day, later) — `F4b_conf` registered as a second primary

Following the review above, David directed that F4's cross-split stability (60.9% H1 /
60.0% H2) warrants its own clean forward test rather than being either bet or discarded.

**Registered:** `F4b_conf`, `abs(P(Over)@T-2h − 0.5) >= 0.0222`, second primary, evaluated
only on games finalizing **2026-09-11 or later**. Full terms in
`MLB_FILTER_REGISTRATION.md` amendment section (A0–A5).

**φ_b = 0.0222 is NOT the old φ = 0.0196, deliberately.** The old value was calibrated on
games that have now been scored, so re-registering it would freeze a threshold chosen partly
in knowledge of its performance. φ_b was recalibrated on the 278 post-registration games
(2026-08-17 → 2026-09-10) reading **the predictor distribution only** — no correctness, no
win rate, no P&L — at the same p80 target percentile carried over unchanged, so no search
over percentiles occurred. Those 278 games are now spent as F4b's calibration set and are
excluded from its evaluation window.

**Two primaries now run in parallel** on disjoint windows and disjoint calibration sets:
`F2_pmove` (from 2026-08-17) and `F4b_conf` (from 2026-09-11). Two independent experiments,
not two draws from one sample, so no Bonferroni correction applies between them. A gate
outcome for one says nothing about the other, and they must not be traded off against each
other after the fact.

**Timeline:** F4b selects ~21.2% (59 of 278 on the calibration window), ~2.5 selections per
slate-day, so gate 3's ~250+ needs ~100 slate-days. Like F2, **it does not conclude in
2026**; meaningful accumulation begins April 2027.

**Incidental data-quality finding.** All 278 post-registration games resolved a T-2h
snapshot during φ_b calibration. The 21 unresolvable games reported above therefore fail on
the **opener** side, not T-2h. This narrows the open ~9% matching issue to opener-snapshot
matching specifically and is the place to start when diagnosing it.