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
