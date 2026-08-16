# MLB study — closing-line bug: evidence, cause, and fix plan

_Drafted 2026-08-16. Approved by David 2026-08-16 (window decision, §4).
No code changed yet. Companion to `MLB_LINE_STUDY_SPEC.md` (D-SITE-008)._

---

## 0. Definition: "closing line"

**The closing line is the last price the market offered before first pitch** — i.e. the
line as it stood at the moment the pre-game betting market *closed*. "Closing" refers to
the market shutting, not to the game ending or the line settling at a final value. The
horse-racing analogue is SP: the price at the off.

For a 19:35 first pitch, the closing line is the total quoted at 19:34.

It is emphatically **not** the total quoted at any point after the game starts. The odds
feed continues to price the game live once underway, and that in-play total is a
different quantity: it reprices as runs go in or fail to, and can end up far from the
pre-game number (two hours into a scoreless game a live total might read 4.5 when the
close was 7.5). Confusing the two is exactly the defect in §1.

The field keeps the name `close`. The term is standard in betting and is used throughout
`MLB_LINE_STUDY_SPEC.md`; this definition is recorded here and in D-SITE-014 so the
meaning is unambiguous rather than inferred (David, 2026-08-16).

---

## 1. What is wrong

The closing line is meant to be the last price recorded **before first pitch**. The code
takes the last price recorded **at all**. The odds feed keeps pricing games while they
are being played, so on most games the stored "closing line" is actually a live in-play
price from partway through the game.

Scope: **288 of 408 finished games (70.6%) hold a wrong closing line.**

What this does *not* affect: the opener pick and T-2h pick hit rates (48.5% and 54.3%).
Those are built from the snapshot records directly and never read the closing-line
field. They are correct as reported.

What has been shown to users: nothing. The study page renders only the picks — verified,
see §3.

---

## 2. Evidence

`functions/mlb/service.js:505-507`:

```js
// close = last snapshot before first pitch
const allSnaps = await db.collection(collections.snapshots).where('gameId', '==', id).get();
const snapDocs = allSnaps.docs.map((d) => d.data()).sort((a, b) => String(a.capturedAtIso).localeCompare(String(b.capturedAtIso)));
const closeSnap = snapDocs.length ? snapDocs[snapDocs.length - 1] : null;
```

The comment states the intent. The code does not implement it — there is no filter on
`minutesToFirstPitch`. That field is already stored on every snapshot
(`service.js:331`) and goes negative after first pitch, so the information needed to
filter correctly is present and simply unused.

Worked example — gamePk `823508`, Mariners @ Yankees, 2026-08-13, full series:

```
2026-08-13T16:30  mins=  65  line=7.5   <- true close (last before first pitch)
2026-08-13T17:45  mins= -10  line=7.5
2026-08-13T19:00  mins= -85  line=4.5   <- what got stored as `close`
```

The pre-game line never moved off 7.5. The stored 4.5 is a live price from 85 minutes
into a scoreless game.

Measured across all 408 finished games (6,971 snapshots):

| Measure | Value |
|---|---|
| Games whose last snapshot is post-first-pitch | 388 (95.1%) |
| Games where stored close ≠ true pre-game close | **288 (70.6%)** |
| Of those, wrong by ≥1.0 run | 227 |
| Mean absolute error among wrong values | 2.36 runs |
| Worst case (`823750`, 2026-08-07) | stored 17.25, true close 8.0 |
| Games with zero pre-game snapshots | **0** |

That last row is the important one: every wrong value is recoverable from data already
held. No API cost, no data loss.

The error is directional rather than random — in-play totals get marked down on
low-scoring games and up on high-scoring ones. So the corruption correlates with the
outcome being measured, which is the least benign shape it could take for move analysis.

### Ruled out

This trace was opened on the hypothesis that D-SITE-011 had recurred and odds events
were being written onto the wrong gamePk. **That hypothesis is dead.** All five traced
games (824330, 823679, 823508, 823916, 824724) have exactly one game doc, one distinct
`gameId` across all their snapshots, and clean single-game series. The apparent 3.5–4.5
run "swings" were this bug, not cross-game contamination. The `7.75` opener on 823508 is
a legitimate consensus median across books. **D-SITE-011's fix worked and should not be
reopened.**

---

## 3. What is and is not affected

| Thing | Status |
|---|---|
| Opener pick / T-2h pick hit rates | **Correct.** Built by `buildPick()` from snapshots (`service.js:517-520`), never reads `close`. |
| Study page (`MLBClient.js`) | **Clean.** Renders only `openerPick`/`t2hPick` (`MLBClient.js:147,163,269-270`); never reads `close`, `moveSummary`, `delta`, or `openerToActual`. No wrong number has been displayed. |
| `close` field | Wrong on 288 games. |
| `moveSummary.delta`, `moveSummary.openerToActual` | Wrong on the same 288 — both derive from `close`. |
| Spec questions Q1 (anatomy of the move) and Q4 (opener + close archive) | Currently rest on corrupt data. Any analysis run against today's values would be invalid. |

The two deliverables affected are exactly the ones the 8-week analysis depends on, which
is why this is worth fixing properly now rather than at analysis time.

---

## 4. The T-2h window — decided, no change

Separate issue found in the same trace. A T-2h pick requires a price snapshot taken
100–140 minutes before first pitch. The collection schedule has gaps of up to 210
minutes, so **79 of 408 finished games have no snapshot in that window** and get no T-2h
pick. This — not the 2026-07-19 amendment — is the real reason ungraded games keep
appearing at ~0–1/day. (The 17 games from 16–18 Jul are a separate, genuinely historical
cause.)

Widening to 90–150 minutes would recover 32 of the 79.

**Decision (David, 2026-08-16): leave the window at 100–140. No widening, no
re-finalize.**

Rationale: the 100–140 window was set before any results were seen. Loosening it after
inspecting outcomes is specification drift — even with innocent intent, it becomes
impossible to demonstrate the threshold was not chosen to flatter the numbers. 329
graded games is an adequate sample, and pre-registration is the main thing keeping this
study credible.

If coverage is judged worth improving later, the clean route is adding a collection pass
to fill the 13:00→16:30 ET gap: ~30 credits/month against a 288-credit balance, and
forward-only by construction, so no retroactive-tuning question arises. **Not part of
this work.**

---

## 5. The fix

### 5.1 Code — one change

In `finalizeDayImpl`, restrict close selection to pre-game snapshots:

```js
const preGame = snapDocs.filter((s) => Number.isFinite(s.minutesToFirstPitch) && s.minutesToFirstPitch >= 0);
const closeSnap = preGame.length ? preGame[preGame.length - 1] : null;
```

Fail-closed by design: a game with no pre-game snapshot yields `closeSnap = null` and
falls through to `prev.close` rather than reaching for a post-game price. 0 of 408 games
currently hit this branch, but falling back to a live price would reintroduce the bug.

`moveSummary` is recomputed from `close` in the same function, so it is corrected by this
change with no separate edit.

### 5.2 Backfill the 288 games

Pure recomputation from retained snapshots. No API calls.

- Script at `scripts/mlb-backfill-close.mjs` — committed, not a temp file
- For each finished game: recompute `close`, `moveSummary.delta`,
  `moveSummary.openerToActual` from the true pre-game close
- **Leave `openerPick` and `t2hPick` untouched** — they are correct and must not be
  recomputed as a side effect
- Write `closePreFixValue` and `closeBackfilledAt` on every touched doc so the correction
  is auditable and reversible
- Dry-run mode first; the 288-row diff reviewed before any write
- Idempotent — a second run must be a no-op

### 5.3 SoRR — same commit

- New decision **D-SITE-014** in `planning/DECISIONS.md`: the defect, measured blast
  radius, the fix, the backfill, and the §4 window decision with its rationale
- **D-SITE-014 must open with the §0 definition of "closing line"** — last price before
  first pitch, market-closes sense, explicitly excluding in-play prices. The field keeps
  the name `close`; the definition is what gets recorded. The ambiguity in the term is
  what allowed a mid-game price to be filed as a close without it looking wrong, so the
  definition is part of the fix, not commentary on it.
- Record explicitly that this is a *second, independent* defect in `finalizeDayImpl`,
  not a D-SITE-011 recurrence
- Note in `MLB_LINE_STUDY_SPEC.md` that closing lines before 2026-08-16 were wrong and
  have been backfilled, so any earlier analysis output is void

---

## 6. Sequence

1. D-SITE-014 + code fix + backfill script, one commit, no push
2. Backfill dry-run; review the 288-row diff together
3. Execute backfill
4. Verify: re-run the blast-radius check, expect 0 games where stored ≠ true close
5. Confirm the next `mlbFinalizeDay` run (07:30 UTC) writes a clean close

Open: whether the per-doc audit fields in §5.2 are wanted, or whether the D-SITE-014
entry is record enough. Defaulting to including them.
