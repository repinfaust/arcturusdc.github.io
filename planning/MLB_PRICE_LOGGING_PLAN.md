# MLB study — per-pick price & EV logging: build plan

_Drafted 2026-08-16 for approval. No code changed. Implements §3 of
`MLB_BET_SELECTION_SPEC.md` (D-SITE-008 follow-up 5), which named this as the only
near-term code step._

---

## 0. Standing position on betting — recorded at user's explicit instruction

**David is not placing bets, and does not intend to place any bet, until the project
reaches its end point and the five go/no-go gates in `MLB_BET_SELECTION_SPEC.md` §5 have
been evaluated and passed.** The study is being built as a system that *could* inform
bets in future, on a horizon of season-length data — not as anything acting now.

This is recorded because it was misread in session on 2026-08-16: a forward-looking
question ("would this ever be useful") was answered as though staking were imminent,
which produced an unwarranted negative characterisation of the whole project. The
project's purpose per D-SITE-008 follow-up 5 is unchanged and remains valid: find whether
a **pre-registered** condition carves out a bettable subset, decided on realized EV at
real prices, evaluated forward and out-of-sample.

Building the measurement instrument is not a step toward betting sooner. It is the
precondition for ever being able to answer the question at all — and, per §5 of the
selection spec, accuracy alone can never clear the gates without price data.

---

## 1. Why this is needed

The five go/no-go gates require **realized EV at the actual price**, not accuracy. A 53%
pick at -120 loses money. Gates 2 (EV positive after vig) and 5 (robust to worst-book
pricing) are currently **unevaluable** — the fields they need do not exist on any game
doc. Without this build, the 8-week analysis cannot produce a go/no-go answer regardless
of what the hit rate says.

## 2. What already exists (verified 2026-08-16, not assumed)

Sampled 400 live snapshots in `mlb_line_snapshots`:

- **400 of 400 carry a per-book price payload.** No gaps.
- Shape confirmed: `books: { fanduel: {line, over, under}, draftkings: {...}, ... }`,
  decimal odds, per book, per snapshot (written at `service.js:197`).
- Books per snapshot: min 1, **median 9**, max 9.
- Book keys seen: `fanduel` (398), `draftkings` (376), `bovada` (359), `betmgm` (356),
  `betonlineag` (348), `lowvig` (347), `mybookieag` (305), `betrivers` (286), `betus` (257).
- **0 book entries missing an `under` price.**

So the raw price data has been collected correctly since day one. **This build requires
no new API calls and no new collection** — it derives per-pick price fields from data
already held, at finalize time. Historical games are back-computable.

## 3. Recovered file — `MLB_BET_SELECTION_SPEC.md` was never on `main`

D-SITE-008 follow-up 5 states the spec was written. It is **not in the working tree and
not in `main`**. It exists only on branch `codex/promo-campaigns` (commit `735b0c5`,
2026-07-24).

This is the **same failure mode as D-SITE-010's renumbering note**: work committed on
`codex/promo-campaigns` that never reached `main`, leaving DECISIONS.md describing a file
nobody can read. The pre-registered gates and filters — the things that keep the whole
evaluation honest — have been unreadable on `main` for three weeks.

**Action: restore `planning/MLB_BET_SELECTION_SPEC.md` to `main` verbatim from `735b0c5`
as part of this commit.** Content unchanged — restoring it after seeing results, with
edits, would destroy the pre-registration property that gives it its value. Verbatim or
not at all.

## 4. Build

### 4.1 Fields — exactly as pre-registered in spec §3, no invention

At the T-2h snapshot (the decision moment), per game:

```
pick            over | under        // already have (t2hPick.side)
line            8.5                 // already have
priceDecimal    1.91                // NEW - actual price for the picked side
priceAmerican   -110                // NEW - same, human form
book            'fanduel'           // NEW - which book that price came from
impliedProb     1/priceDecimal      // NEW - vigged implied prob at that price
finalTotal, push, correct           // already have
```

At finalize:

```
stakeUnits      1.0                 // flat; fractional Kelly only post-gates (spec §6)
pnlUnits        push    ->  0
                correct ->  stakeUnits * (priceDecimal - 1)
                wrong   -> -stakeUnits
```

Written as `t2hPick.ev = {...}` and, symmetrically, `openerPick.ev = {...}` so the
opener/T-2h comparison stays like-for-like.

### 4.2 Book selection — decision required (§7 Q1)

Spec §3 says "best available among tracked". Best price for the picked side flatters EV
and assumes you'd always get on at the best book. Spec gate 5 separately demands the
result survive *worst*-book pricing.

**Proposal: log all three per pick** — `best`, `worst`, `consensus` — each with its own
`priceDecimal`/`book`/`pnlUnits`. Costs three small objects per pick, makes gate 2 and
gate 5 both directly computable, and removes the temptation to pick the flattering one
later. Headline EV reported on **consensus**, the honest middle.

### 4.3 No-fabrication rule (spec §3, carried verbatim)

If a snapshot holds no real price for the picked side at a real book, the pick is **not
EV-gradeable** and is excluded. **Never impute a price.** `ev: null` with
`evGradeable: false`, so excluded picks are counted, not silently dropped — the same
discipline applied to ungradeable finals in follow-up 3.

### 4.4 Backfill

Derivable for all historical games from retained snapshots, no API cost. Same script
pattern as the close backfill: dry-run, diff reviewed, idempotent, audit-stamped.
Sequenced **after** the close fix, since both touch `finalizeDayImpl`.

## 5. Explicitly not in this build

- No filter is registered, scored, or evaluated. Filters F0–F5 and thresholds θ/φ are
  registered in DECISIONS.md **before** scoring, as a separate step (spec §4).
- No gate is evaluated.
- No staking logic, no Kelly, no bet.
- No change to pick selection or the 100–140 window.

This build only makes EV **measurable**. It answers nothing.

## 6. SoRR

- **D-SITE-015** in `planning/DECISIONS.md`: the build, the verified data availability,
  the book-selection decision, and §0's standing position on betting.
- Restore `MLB_BET_SELECTION_SPEC.md` to `main` verbatim; note in D-SITE-015 that
  follow-up 5's file was branch-only for three weeks, and flag the recurring
  `codex/promo-campaigns` orphan pattern as a process risk in its own right.
- **§0's standing position also to be added to `MLB_LINE_STUDY_SPEC.md`** so it is stated
  where the study is described, not only in a decision entry.

## 7. Open questions

1. §4.2 — log best/worst/consensus (recommended), or single-book per spec's "best available"?
2. Backfill historical picks now, or forward-only from deploy? Recommend backfill —
   free, and gate 3 (sample size) needs every game it can get.
3. Sequencing: close fix first (already planned), then this? Recommend yes — both touch
   `finalizeDayImpl` and separate commits keep the diffs reviewable.
