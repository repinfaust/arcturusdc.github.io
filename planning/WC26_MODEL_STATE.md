# WC26 xG Value Engine — Model & App State

_As built on `main` (2026-06-21). This documents what exists, how it compares to
cowork's design, and what's open. Companion to the dated entries in
`planning/DECISIONS.md`._

Route: `/apps/stea/wc26` (alias `/wc26`), ArcturusDC-tenant gated.
Firebase project `stea-775cd`, tenant `FqhckqMaorJMAQ6B29mP`.

---

## 1. The model, end to end

**Per-team ratings = Elo prior, updated by data.**
- **Prior:** World Football Elo (eloratings.net TSV, free, no key, deterministic).
  A continuum — Spain 2.17 atk / 0.46 dfn, Brazil 1.57 / 0.64, Saudi 0.66 / 1.52 —
  replacing the old coarse 5 tiers where every "Elite" side shared an identical
  1.6 / 0.58. Centred on the mean Elo of the 48 qualified teams (`elo_avg≈1784`),
  converted via the Python engine's `ratings_from_elo` (spread 0.45). Market-
  **independent**, so the model is allowed to disagree with the line.
- **Likelihood:** deterministic Bayesian shrinkage refit (`refitWc26Ratings`,
  `PRIOR_GAMES=4`) moves each team's atk/dfn from prior → observed WC results as
  games accrue. No LLM.

**Per-fixture pricing = 50/50 blend toward the sharp market.**
- Sharp 1X2 **and** Over/Under 2.5 (Pinnacle + Betfair-exchange + Matchbook +
  Marathonbet + BetOnline, via The Odds API `eu` region) are devigged together and
  solved for the goal expectations (`lamHome`, `lamAway`) they imply.
- At pricing time the Elo-model lambdas are blended 50/50 with those sharp lambdas;
  every market is then summed off that one blended scoreline matrix.
- Fixtures with no sharp line fall back to the pure Elo model.

**Value & display.**
- Display odds = consensus (median) of UK soft books, via The Odds API `uk` region.
- Edge = model fair vs offered; ¼-Kelly stake; small-market / longshot / danger-zone
  flags from the engine.
- **Edge is sought in the derived markets** (team totals, BTTS, totals, correct
  score) the book prices lazily — not in the 1X2, where the blend anchors us to the
  sharp line by design.

**Two honesty layers.**
- **Confidence badges** (with an "i" legend): confidence is *not* edge size — a huge
  edge means the model disagrees with the market = miscalibration red flag = Low.
  Drivers: engine flags, 0-game teams (unverified), edge plausibility (looser band
  for market-calibrated picks), games behind the ratings. "Bet of the day" only
  headlines plausible-confidence picks; otherwise shows "no confident bet today".
- **Track record split:** *forward record* (predictions logged pre-kickoff, graded
  after the real result) is the only honest scorecard — starts empty, grows. The
  *in-sample backtest* is demoted with a "calibration check, NOT a track record"
  warning.

**Data integrity (the founding rule): no fabricated data, ever.**
- Results + fixtures: `openfootball/worldcup.json` (CC0, pinned URL) — fetch +
  schema-validate + reject placeholders/unknown teams.
- Odds: The Odds API (real REST feed) — no LLM, overround gate rejects suspended/
  in-play prices.
- **GPT is entirely absent from WC26** (it fabricated results + fake citations in
  testing; removed). Live state: 48 teams, 36 results, 36 fixtures priced.

---

## 2. Built vs cowork's original design

| Cowork's recommendation | Built? | Notes |
|---|---|---|
| Elo prior (continuum, market-independent) | ✅ | eloratings.net TSV; all 48 teams matched. |
| Blend prior 50/50 toward the **sharp** line | ✅ | Pinnacle + exchanges (`eu` region), not soft books. |
| Anchor **1X2 *and* totals** together | ✅ | Devig both, solve lambdas jointly — pins result + goal level. |
| Edge only in **derived small markets** | ✅ (by design) | 1X2 anchored to sharp; value hunted downstream. |
| Update on data (shrinkage likelihood) | ✅ | Pre-existing refit retained. |
| Avoid anchoring to a **soft** book | ✅ | Soft UK books are display-only; calibration uses sharp `eu`. |
| Historical results+odds backtest (football-data.co.uk) | ❌ | Cowork called it nice-to-have, not blocking. Not built. |

**Where the build diverges from cowork (deliberately):**
- **Blend point.** Cowork framed the blend at the rating level; we blend at the
  **fixture-lambda** level (per-team stays pure Elo + data). Reason: inverting market
  odds back into 48 teams' atk/dfn is underdetermined and would contaminate the clean
  Elo prior. Fixture-level blend is simpler and more honest. (Approved.)
- **Sharp source.** Cowork named Pinnacle; the `uk` region lacked it, so we use the
  `eu` region which has Pinnacle **plus** betting exchanges (arguably sharper still).

---

## 3. Architecture / where things live

| Piece | Location |
|---|---|
| Engine (Dixon-Coles, markets, devig, kelly) | `src/app/apps/stea/wc26/lib/engine.js` (ESM) + `functions/wc26/engine.js` (CJS) — kept in sync |
| Elo prior | `src/lib/wc26/elo.js` |
| Sharp-market calibration | `src/lib/wc26/calibrate.js` |
| Results/fixtures ingest (openfootball) | `src/lib/wc26/ingestResults.js` + `POST /api/stea/wc26/ingest` |
| Odds + calibration ingest (The Odds API) | `src/lib/wc26/oddsApi.js` + `POST /api/stea/wc26/odds-api` |
| Manual odds entry | `POST /api/stea/wc26/odds` |
| UI (all panels, blend, badges) | `src/app/apps/stea/wc26/WC26Client.js` |
| Deterministic refit / predictions / grading | `functions/wc26/service.js` (deployed `us-central1`) |
| One-off admin scripts | `scripts/wc26-elo-seed.js`, `wc26-live-refresh.js`, `wc26-purge-fabricated.js` |
| Firestore collections | `wc26_teams`, `wc26_fixtures`, `wc26_results`, `wc26_predictions`, `wc26_meta` (rules: client read-only, Functions write) |

---

## 4. Open questions / next steps

**Calibration quality (THE whole ballgame — per cowork).** Half the signal is the
market by design (50/50 blend), so the only remaining edge surface is the derived
markets + updating faster than the line. If the derived edges are model error, there
is no edge anywhere. So #1 is not "top priority", it is the value proposition.

_Diagnostic run 2026-06-21 (cowork's a/b/c/d test):_
- **(a) Vig in the comparison — confirmed present, not the main cause.** Stored
  derived odds are vigged consensus (~6.5% two-way vig on O/U 2.5). Edge is computed
  vs the vigged price, not the no-vig prob — a real bug to fix. BUT devigging makes
  the headline edges *larger*, not smaller (model prob sits above book), so vig isn't
  what's inflating them.
- **(b) ρ / shape — the likely real cause, but the absolute error is SMALL.** Devig
  test on the draw: the soft book agrees with the sharp line almost exactly
  (Algeria/Austria soft 31% = sharp 31%), and **our model is the outlier by only
  ±2–4pp** (ours 27%), non-directional. So the book is internally consistent; we
  dissent slightly. That is model error, not value — but small.
- **The 30% "edges" are small probability errors AMPLIFIED by longshot odds.** The
  top "edges" are Away/Home/Draw picks at 3.9–9.0 (Curacao Draw @9, Egypt Away @3.9).
  A 4pp probability error at odds of 9.0 shows as "+37% edge". So the screaming
  numbers are ρ/shape error magnified by price, not soft-book value.
- **Verdict:** model error, not value (cowork's prior was right). Mitigations already
  in place: longshots (≥6.0) tagged LOW and sunk; confidence badges. Real fix = reduce
  the probability error itself.

_Next concrete steps for #1 (cheap → structural):_
1. **Fix the comparison: devig the display book per market before computing edge.**
   Compare model fair prob to the book's no-vig prob, not the raw price. Correct
   regardless of cause; removes the free ~6.5% inflation.
2. **Refit ρ** against the sharp line + completed WC games (cowork to spec). The
   derived markets (BTTS, low-score CS, team-total tails, draw rate) are *driven* by
   ρ and the Poisson shape; means are anchored, shape is not. Likely the actual fix.
3. **(Later) Poisson over-dispersion.** Fitted dispersion / neg-binomial for
   team-total tails. Shape-error candidate, lower priority.
4. **base_goals = 1.25** also un-refit; revisit after ρ.

**Automation.**
- Calibration (`marketLambdas`) is currently written by the "Pull live odds" button
  and the one-off script. It is **not** on a schedule. Next step: a scheduled job (or
  fold into the existing `refitWc26Ratings` cadence) so odds + calibration refresh
  without a manual click. Mind the 500 req/month Odds API free-tier budget (~2 req
  per pull: uk + eu).
- The forward record only populates once `syncWc26Predictions` logs pre-kickoff
  predictions for *upcoming* fixtures (done: 37 logged) **and** `onWc26ResultFinalized`
  grades them after results land. Verify end-to-end on the next completed matchday.

**Data / ratings.**
- 9 teams (Algeria, Austria, etc.) now have Elo priors (good) but still few/no WC
  games — confidence stays Low for them by design until games accrue.
- Elo is pulled by the one-off seed script, not on a schedule; ratings drift from the
  live Elo over the tournament. Decide whether to re-pull Elo periodically or let the
  shrinkage refit own all post-seed movement.

**Honesty / product.**
- Confidence thresholds are heuristic (edge bands 15%/30%). Once the forward record
  has enough graded games, calibrate the bands against actual hit rates rather than
  guessing.
- Backtesting is in-sample only. Cowork's note stands: over a 64-game tournament the
  forward record is the only scorecard that counts — don't over-invest in historical
  backtests for a sample this small.

**Known caveat to keep stated on the page.**
- This is a modelling exercise, not income. Even a real 4% edge can't prove itself
  over ~48 remaining games. Stake only what you'd lose; ¼-Kelly; not financial advice.
