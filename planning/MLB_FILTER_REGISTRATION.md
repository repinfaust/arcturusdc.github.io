# MLB bet-selection — PRE-REGISTERED FILTER SET

**Registered 2026-08-16. Frozen. Evaluated only on games finalizing from
2026-08-17 onward.**

_Implements §4 of `MLB_BET_SELECTION_SPEC.md` (D-SITE-008 follow-up 5). This document
fixes what will be tested **before** any of it is scored. Its only purpose is to remove
the researcher's freedom to choose a rule after seeing which rule wins._

---

## 0. The rule that makes this worth anything

**Nothing in this document may be revised after a score is computed on post-registration
data.** Not the filters, not θ, not φ, not the primary designation, not the gates.

If a filter looks poor and a "better" variant suggests itself — that variant is a **new**
filter, registered on a **new** date, evaluated on games arriving after *its* registration.
Amending in place converts a forward test into a backfit and destroys the result.

If this file is ever edited, the edit must be additive, dated, and must not touch any
frozen value above it.

---

## 1. Evaluation window

| | |
|---|---|
| Registration date | **2026-08-16** |
| First eligible game date | **2026-08-17** |
| Pre-registration data used | Games finalized on or before 2026-08-16 (n=272 with both picks) — **distribution only**, see §3 |
| Games eligible | Every MLB game finalizing 2026-08-17 or later with `t2hPick.evGradeable === true` |
| Excluded | Every game finalized on or before 2026-08-16, permanently, for gate evaluation |

The 408 games already collected are **not** evidence for or against any filter here. They
were used solely to calibrate threshold *scale* (§3) and remain useful as an exploratory
sandbox — but no result computed on them can satisfy a gate.

**Expected volume:** 9.7 games/day averaged over the 28 days collected. A filter selecting
the top 20% yields ~2 bets/night. Gate 3 wants ~250+ selected bets, so a 20%-selectivity
filter needs roughly **125 slate-days** — i.e. this does not conclude in 2026. Rushing it
is the one failure mode that cannot be repaired later.

---

## 2. The filters

All are booleans over fields already stored on `mlb_games`. All are evaluated on the
**T-2h pick side** (`t2hPick.side`) at the T-2h price, flat 1 unit, EV-graded.

| id | Condition | Selectivity by design |
|---|---|---|
| `F0_all` | every EV-gradeable game | 100% — null benchmark |
| `F1_revision` | `openerPick.side !== t2hPick.side` | ~44% |
| `F2_pmove` | `abs(P(Over)@T2h − P(Over)@open) >= θ` | ~20% |
| `F3_pitcher` | `pitcherChangedBeforeT2h === true` | ~2% |
| `F4_conf` | `abs(P(Over)@T2h − 0.5) >= φ` | ~20% |
| `F5_combo` | `F2_pmove AND F4_conf` | ~5–8% |

### Frozen thresholds

```
θ (theta) = 0.0274      # |ΔP(Over)| from opener to T-2h
φ (phi)   = 0.0196      # |P(Over)@T-2h − 0.5|
```

Both are the **80th percentile** of their own distribution over pre-registration games —
i.e. each selects the most extreme ~20% of games on that variable. See §3 for why this
value and not another.

`P(Over)` is computed at **full precision** by `impliedOverProb(overDec, underDec)` on the
snapshot's consensus prices — **not** from the stored `pOver` field, which is rounded to 2dp
and too coarse to threshold (at 2dp the entire θ range collapses onto 0.02/0.03).

### Primary filter

**`F2_pmove` is the single pre-registered PRIMARY filter.**

Every other filter is **exploratory only and never bettable on this sample**, per spec §4's
instruction to pre-commit to one primary rather than correcting across many.

Rationale for F2 as primary, stated now so it cannot be rationalised later: the study's
entire premise (D-SITE-008, and David's horse-racing framing) is that *pre-game information
arrival moves the price*. F2 is the direct operationalisation of that premise — it selects
games where the market demonstrably moved on new information between opener and T-2h. If
the project's core hypothesis is right, F2 is where it shows up. F1 is a coarser proxy for
the same thing (side flip is a large move, but a large move need not flip the side); F4
measures conviction rather than information arrival; F3 is too rare (2.2%) to ever reach
gate 3.

**Filters tested: 6.** Recorded for the multiple-comparisons rule. With one pre-committed
primary, no Bonferroni correction applies to F2; the five exploratory filters carry a
Bonferroni-corrected significance threshold of 0.05/5 = 0.01 and are reportable but never
actionable.

---

## 3. How θ and φ were set — and why this does not contaminate the test

**θ and φ were chosen from the distribution of the predictor variables alone. No win rate,
no P&L, and no correctness value was computed, inspected, or referenced at any point during
threshold selection.** The calibration script computed percentiles of `|ΔP(Over)|` and
`|P(Over)−0.5|` and nothing else.

This matters because the ordinary way to corrupt a pre-registration is to try θ = 0.02,
0.03, 0.04, see which scores best, and register that. That did not happen and cannot have:
the scoring machinery was never pointed at these games.

**Selectivity, not performance, drove the choice.** The 80th percentile was fixed in advance
as the target because:

- it yields ~2 bets/night, consistent with the spec's "0–4 games/night, some nights zero";
- it is selective enough to plausibly isolate a signal, without being so rare that gate 3
  (~250+ bets) becomes unreachable within a season;
- it is a round, defensible choice that was not searched for.

Observed distribution over pre-registration games (n=272), for the record:

| percentile | θ candidate | φ candidate | games selected |
|---|---|---|---|
| p50 | 0.0118 | 0.0105 | ~136 (50%) |
| p70 | 0.0209 | 0.0170 | ~82 (30%) |
| **p80** | **0.0274** | **0.0196** | **~54 (20%)** |
| p90 | 0.0339 | 0.0222 | ~27 (10%) |
| max | 0.0494 | 0.0412 | — |

**A caveat that must survive into the findings:** these thresholds are calibrated on
pre-registration data, so the *selectivity* claim (~20%) assumes the forward distribution
resembles the past one. If the market's price-movement distribution shifts — a plausible
September/postseason effect — F2's realised selectivity will drift. That is acceptable
(the threshold is absolute, not a rolling quantile, which is the honest choice) but the
realised selection rate must be **reported alongside** the result.

---

## 4. The five gates (from spec §5, restated so they cannot drift)

All five must hold, on forward, out-of-sample, EV-graded selections, for the **primary**
filter:

1. **Accuracy** — selected correct-side rate > 52.4%, or > `1/d` at the subset's actual mean
   odds if worse than -110.
2. **EV** — cumulative `pnlUnits` > 0, flat 1u, at real prices after vig.
3. **Sample** — 95% CI lower bound on the win rate clears breakeven. Point estimates alone
   never satisfy this gate. (~250+ selected bets for a 55% edge; more if thinner.)
4. **Stability** — edge holds across a held-out split of the forward window; not one hot
   streak or a few blowouts.
5. **Robustness** — survives `ev.worst` pricing, not just `ev.best` or `ev.consensus`.

**Reference price for gate evaluation: `ev.worst`** (spec §8 open item, hereby fixed —
conservatism). `ev.consensus` is the reported headline; `ev.best` is recorded but is not
the basis of any go/no-go claim.

**Any one gate failing ⇒ do not bet.** Per spec §7 that is a successful result, not a
failure.

---

## 5. What happens next

1. **Nothing.** Collection continues unchanged. No scoring until a meaningful forward
   sample exists — season-end at the earliest, and realistically 2027 for gate 3 on a
   20%-selectivity filter.
2. When scored: results go to `planning/MLB_BET_SELECTION_FINDINGS.md`, reporting all six
   filters, the realised selection rate of each, the 95% CI, and the gate outcomes.
3. Only if all five gates pass on F2 does a staking discussion begin — and that is its own
   separate, explicit approval (spec §6).

**Standing position (David, 2026-08-16), restated:** no bet will be placed until the
project reaches its end point and all five gates have been evaluated and passed. Registering
these filters does not authorise, imply, or bring forward any bet.

---
---

# AMENDMENT — SECOND REGISTRATION, 2026-09-10

**Additive only. Nothing above this line is altered, and nothing above it may be read as
altered.** θ, φ, the `F2_pmove` primary designation, the six original filters, the five
gates and the 2026-08-17 window all stand exactly as frozen on 2026-08-16. This section
registers a **separate, second** filter with its **own** window, per §0's rule that a new
idea is a new registration on a new date rather than an amendment in place.

---

## A0. Why this exists, in one paragraph

The 2026 season-close review (D-SITE-022, `MLB_BET_SELECTION_FINDINGS.md`) scored the
pre-registration sandbox. `F4_conf` — market conviction at T-2h — read 60.4% there and,
more notably, held across the held-out split at 60.9% (H1) and 60.0% (H2). That stability
is the pattern worth a second look. It is **not** evidence: those are the games φ was
calibrated on, the CI lower bound was 46.9%, and F4 was exploratory-only. The correct
response to an interesting-but-contaminated signal is neither to bet it nor to discard it,
but to **give it a clean forward test of its own**. That is all this section does.

---

## A1. What is registered

| | |
|---|---|
| Filter id | **`F4b_conf`** (new id — deliberately *not* `F4_conf`, which stays exploratory-only under the 2026-08-16 registration) |
| Condition | `abs(P(Over)@T-2h − 0.5) >= φ_b` |
| **φ_b (frozen)** | **0.0222** |
| Status | **SECOND PRIMARY**, independent of `F2_pmove` |
| Registration date | **2026-09-10** |
| First eligible game | **2026-09-11** |
| Permanently excluded | Every game finalizing on or before 2026-09-10 |

`P(Over)` is computed at full precision via `impliedOverProb(overDec, underDec)` on the
snapshot's consensus prices, never from the 2dp-rounded `pOver` field — same rule as §2.

**`F2_pmove` remains the primary for its own window and is unaffected.** The two run in
parallel on disjoint windows, are scored separately, and neither may be substituted for the
other. There are now two pre-committed primaries, each with one shot: F2 on games from
2026-08-17, F4b on games from 2026-09-11.

---

## A2. How φ_b was set — and why it is NOT 0.0196

**The old φ = 0.0196 was not reused, and could not honestly have been.** It was calibrated
on the pre-registration games, and on 2026-09-10 those games were scored — F4's 60.4% is now
known. Re-registering that same threshold would mean freezing a value chosen partly in the
knowledge of how it performed. That is the precise failure §3 was written to prevent.

**φ_b = 0.0222 was recalibrated on the 278 post-registration games (2026-08-17 → 2026-09-10),
reading the predictor distribution ONLY.** The calibration script computed
`|P(Over)@T-2h − 0.5|` per game and its percentiles, and read no correctness value, no win
rate and no P&L. That window has never been scored by anyone, so no outcome on it was known
at the moment φ_b was fixed. The target percentile (p80) was carried over unchanged from §3
rather than re-chosen, so no search over percentiles occurred either.

Observed distribution, n=278, for the record:

| percentile | φ_b candidate | games selected |
|---|---|---|
| p50 | 0.0117 | 140 (50.4%) |
| p60 | 0.0157 | 112 (40.3%) |
| p70 | 0.0170 | 87 (31.3%) |
| p75 | 0.0196 | 71 (25.5%) |
| **p80** | **0.0222** | **59 (21.2%)** |
| p90 | 0.0222 | 40 (14.4%) |
| max | 0.0325 | — |

The conviction distribution is coarse at the top (p80, p85 and p90 share the 0.0222 value),
a consequence of 2dp price rounding upstream. Recorded so the realised selectivity is not
later mistaken for drift.

**Note:** those 278 games are now spent as a *calibration* set for F4b, exactly as the
original 272 were for F2. They are excluded from F4b's evaluation window and can never
satisfy a gate for it.

---

## A3. Gates, and the multiple-comparisons position

The five gates in §4 apply to `F4b_conf` unchanged, evaluated on `ev.worst`.

**Filters now pre-committed as primary: two** (`F2_pmove`, `F4b_conf`) — on **disjoint
windows and disjoint calibration sets**, each tested once. This is two independent
experiments, not two draws from one sample, so no Bonferroni correction applies between
them. The five exploratory filters from the 2026-08-16 registration keep their 0.05/5 = 0.01
threshold and remain never-actionable.

**A gate failing for one primary says nothing about the other.** They are not alternatives
and must not be traded off. Specifically: if F2 fails and F4b passes, that is not licence to
retrospectively call F4b "the real primary all along" — both outcomes were registered in
advance precisely so both can be reported honestly.

---

## A4. Expected timeline

At ~21% selectivity, `F4b_conf` accrues ~2.5 selections per slate-day. Gate 3's ~250+ needs
roughly **100 slate-days**. The 2026 regular season ends within weeks and the postseason is
a handful of games per day, so F4b — like F2 — **does not conclude in 2026**. Meaningful
accumulation begins April 2027. Rushing either is the one failure mode that cannot be
repaired later.

---

## A5. PURPOSE — restated, and binding on both registrations

Restated at David's explicit instruction (2026-09-10) because the documents had drifted into
reading like preparation for a betting operation, which they are not.

**This is a proof of concept. It is not a plan to bet, and it is emphatically not a plan to
stake meaningful money.**

What it is:

- **A research instrument** measuring whether pre-game information arrival moves the MLB
  total in a way that is exploitable at real prices — the question D-SITE-007 answered "no"
  for static team/pitcher models, asked again for *price movement*.
- **A methods asset.** The pre-registration discipline, the no-leakage rigour, the
  fail-closed collection and the honest-negative-result culture are reusable across
  projects. They have already killed one mirage (the 2025 "61.5%", which was leakage) and
  caught four production bugs that would each have produced a confident wrong answer.
- **Possibly, and this is entirely TBD,** an additional tool for *avoiding* poor bets rather
  than placing good ones — i.e. a filter that says "this one is not worth touching." Whether
  it is ever used that way is undecided and depends on the gate outcomes.

What it is **not**:

- Not a betting system, a tipping service, or a staking plan.
- Not a route to significant sums. No life savings, no meaningful bankroll, nothing of the
  sort is contemplated, now or on any gate outcome.
- Not something whose value depends on finding an edge. **The most likely honest outcome
  remains "no edge, do not bet"** (spec §7, D-SITE-007 precedent), and that result is a
  success — the alternative was believing 61.5% and finding out with money.

**The single number that best represents the project's value to date is `F0_all` = 51.5%
over 281 games** — the vig arriving within ~0.1pp of where theory predicts (~51.4%). That
demonstrates the instrument is calibrated and trustworthy. It is not a finding about any
edge, and no filter result in the findings document should be read as a "benchmark" or a
floor to improve on.

**Standing position (David), unchanged and reaffirmed:** no bet will be placed until the
project reaches its end point and all five gates have been evaluated and passed on a
pre-registered primary. Registering `F4b_conf` authorises nothing, implies nothing, and
brings nothing forward.
