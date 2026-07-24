# MLB Bet-Selection & Forward-EV Spec — the go/no-go method (NOT yet a betting system)

_Draft for future approval, 2026-07-24. Companion to `MLB_LINE_STUDY_SPEC.md` (D-SITE-008)
and its follow-ups. This spec defines **how a betting decision would be made and evaluated
IF the collected data ever justifies one** — it does not authorise any bet, does not claim an
edge exists, and builds nothing until (a) there is enough forward data and (b) explicit
approval. It exists so the evaluation method is fixed in advance, before anyone sees which
games a rule would have selected — the single most important guard against fooling ourselves._

The founding rules stand unchanged: no fabricated data, no LLM, results from the pinned
MLB Stats API, forward record is the only scorecard, fail-closed. Adds one rule specific to
betting: **pre-registration** — a selection filter is defined and frozen BEFORE it is scored
on the games it selects. Any rule discovered by searching the data is backfit until it
survives forward on data it never saw.

---

## 1. The question this answers

Not "predict every total." The real question:

> Is there a **pre-defined condition** such that the games meeting it are picked correctly
> **> 52.4%** of the time (the -110 breakeven), **forward and out-of-sample**, on a large
> enough selected sample to be more than noise — and does betting them at the **actual prices
> available** make money after vig?

If yes → bet only the games meeting that condition, sized to the edge. If no (the D-SITE-007
default expectation) → **bet nothing**, and the study has done its job by saying so credibly.

You never bet all games. Selectivity is the whole point: betting the full slate pays the
~4.5% vig on ~15 games/night against a market that is ~50% accurate by construction — a
guaranteed slow loss. A genuine edge in MLB totals, if it exists at all, is thin and rare:
expect a real filter to fire on **~0–4 games/night**, not most of the slate. A rule that
"qualifies" 12 of 15 games nightly is overfit noise, not signal.

---

## 2. Two numbers, and why accuracy alone is not enough

The study currently logs **correct-side accuracy vs the line**. That is necessary but
**not sufficient** to decide a bet, because you bet into a **price**, not a coin:

- A 53%-correct pick taken at **-120** (implied 54.5%) still **loses money**.
- A 51%-correct pick taken at **+100** (implied 50%) still **makes money**.

So the go/no-go must be made on **realized EV at the price you would actually have gotten**,
not hit-rate. This spec's core addition is capturing that price and computing per-bet P/L.

Breakeven reference: at decimal odds `d`, breakeven win-rate = `1/d`. At -110 (`d=1.909`),
that is **52.38%**. A filter must clear breakeven **at the odds its selected bets actually
carry**, which may be worse or better than -110.

---

## 3. What must be captured per selected pick (data the finalizer must log)

Most already exists; the gap is **price at the pickable moment** and **which book**.

Per game, at the T-2h snapshot (the decision moment), record:
```
pick:            over | under            // the side the rule would back
line:            e.g. 8.5                // total at that snapshot
priceDecimal:    e.g. 1.91               // ACTUAL over/under price for that side, that book
priceAmerican:   e.g. -110               // same, human form
book:            e.g. fanduel            // which book's price (best available among tracked)
impliedProb:     1/priceDecimal          // vigged implied win prob at that price
finalTotal, push, correct                // already logged
```
Then at finalize:
```
stakeUnits:      1.0 (flat) OR fractional-Kelly units (see §6)
pnlUnits:        push -> 0
                 correct -> stakeUnits * (priceDecimal - 1)
                 wrong   -> -stakeUnits
```
**No fabrication rule applies to price too:** if the snapshot did not capture a real
over/under price for the picked side at a real book, the pick is **not gradeable for EV** and
is excluded — never impute a price. (Today's snapshots store per-book `over`/`under` decimals,
so this is available going forward; games before it was captured cannot be EV-graded.)

---

## 4. Pre-registered filters (define BEFORE scoring; freeze in DECISIONS.md)

Each candidate filter is a boolean over already-collected fields. Register the exact set you
will test, in writing, dated, **before** looking at how they score. Candidates worth pre-registering:

| Filter id | Condition (all computable from existing data) |
|---|---|
| `F0_all` | every game (the null benchmark — must be beaten to matter) |
| `F1_revision` | opener pick and T-2h pick disagree (the "information changed the pick" games) |
| `F2_pmove` | \|P(Over)@T-2h − P(Over)@open\| ≥ θ  (price moved materially; θ pre-set, e.g. 0.04) |
| `F3_pitcher` | a starting pitcher changed between open and T-2h |
| `F4_conf` | \|P(Over)@T-2h − 0.5\| ≥ φ  (market strongly leans; φ pre-set, e.g. 0.06) |
| `F5_combo` | a specific AND/OR of the above, **fully specified in advance** |

Rules that make this honest:
- **θ, φ, and the exact combo are fixed before scoring**, not tuned to maximise the result.
- The number of filters tested is recorded — testing many filters and reporting the best is
  p-hacking; apply a multiple-comparisons correction (e.g. Bonferroni: divide the significance
  threshold by the number of filters) or, better, pre-commit to **one** primary filter and
  treat the rest as exploratory-only (never bettable on this sample).
- A filter is evaluated **only on games that arrived after it was registered.**

---

## 5. The go/no-go gates (all required; any one fails → bet nothing)

A filter graduates from "interesting" to "bettable" only if **all** hold on
**forward, out-of-sample, EV-graded** selections:

1. **Accuracy gate:** selected-subset correct-side rate > 52.4% (or > `1/d` at the subset's
   actual mean odds if worse than -110).
2. **EV gate:** cumulative `pnlUnits` > 0 with flat 1u stakes, i.e. the bets actually made
   money at real prices after vig.
3. **Sample gate:** enough selected bets that the result is not noise. Rule of thumb: a 55%
   edge needs on the order of **~250+** selected bets before its 95% CI clears 52.4%; 53%
   needs far more. State the CI explicitly; if the lower bound of the 95% CI on the win-rate
   is below breakeven, the gate is **not** met regardless of the point estimate.
4. **Stability gate:** the edge holds across a held-out split (e.g. first-half vs second-half
   of the forward window) — not driven by one hot streak or a handful of blowouts.
5. **Robustness gate:** result survives realistic frictions — using the *worst* of the tracked
   books' prices rather than best, and assuming you cannot always get the closing price.

Only if all five pass on a **pre-registered primary filter** does a staking discussion begin.
This mirrors the D-SITE-007 bar (>52.4% walk-forward, no leakage, forward-verified) and extends
it to price.

---

## 6. Staking (only relevant if §5 passes — not before)

- Flat staking (1u/bet) for the **evaluation** — it makes P/L interpretable. Do not use
  variable stakes to score a filter; that mixes selection skill with sizing luck.
- If a filter passes and real staking is ever contemplated: **fractional Kelly** (¼–½ Kelly),
  sized from the *measured* edge and the *actual* price, capped per bet. Never full Kelly
  (variance ruin), never Martingale, never "due" reasoning.
- Bankroll is finite and pre-set; a losing streak inside the edge is expected and must not
  trigger stake escalation.

---

## 7. What this is not

- Not a claim that an edge exists — the likeliest honest outcome is that no filter clears the
  gates and the answer is **do not bet**. That is a successful result, not a failure.
- Not EV/tout advice, not a recommendation — a research evaluation of whether a pre-defined
  rule would have been profitable at real prices.
- Not a licence to keep searching until something passes — the pre-registration and
  multiple-comparisons rules exist precisely to stop that.

---

## 8. Build sequencing (nothing built yet)

1. **Now:** keep collecting. This spec changes no running code.
2. **When contemplated (separate approval):** extend `finalizeDayImpl` to log per-pick
   `priceDecimal/priceAmerican/book/impliedProb` from the T-2h snapshot (data already present)
   and compute `pnlUnits`. Add a read-only EV column to the viewer. This is the only code step
   before evaluation and is small.
3. **At sufficient forward sample (season-end likely, not weeks):** register the primary filter
   + θ/φ in DECISIONS.md *before* scoring; run the five gates offline; write findings to
   `planning/MLB_BET_SELECTION_FINDINGS.md`.
4. **Only if all gates pass:** a staking decision becomes its own separate, explicit approval.

Open items for when this is picked up:
- Which single filter is the **primary** (pre-registered) one vs exploratory.
- θ (price-move threshold) and φ (confidence threshold) exact values, fixed before scoring.
- Which tracked book's price is the reference (recommend: worst-of, for conservatism).
- Minimum selected-sample size to declare a gate met (recommend stating the 95% CI, not a
  fixed n).
