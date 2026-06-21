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

**Calibration quality (highest priority).**
- After blending, **derived-market edges are still large (up to ~30%)**. The 1X2
  miscalibration is fixed (Spain v Saudi 88% = sharp line), but secondary outcomes
  (draw prices, away longshots in lopsided games) still show big gaps vs the **soft**
  display book. Open question: how much of that is *real* soft-book value (the bias
  we want to exploit) vs *residual model error* on draw/longshot rates? Needs the
  forward record to disambiguate. Until then, treat large derived-market edges with
  the same scepticism as before.
- The fixed `ρ = −0.08` Dixon-Coles correction and `base_goals = 1.25` are not
  re-fit from WC data. Could matter for draw/low-score calibration.

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
