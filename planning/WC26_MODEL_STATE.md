# WC26 xG Value Engine — Model & App State

_As built on `main` (2026-06-21), updated 2026-07-03. This documents what
exists, how it compares to cowork's design, and what's open. Companion to the
dated entries in `planning/DECISIONS.md`._

---

## 0. Status update — 2026-07-03 (mid-knockouts)

**Objective restated by David: ACCURACY over betting edge.** The headline is now
forecast accuracy (hit rate + Brier) vs the devigged consensus market; the
flagged-picks betting ledger is secondary.

**Forward record after 38 graded games** (all inputs logged pre-kickoff):

| Track | 1X2 acc | 1X2 Brier | O/U 2.5 acc | O/U 2.5 Brier |
|---|---|---|---|---|
| Pure Elo (as logged) | 68.4% | 0.4405 | **47.4%** | 0.2482 |
| Devigged market | 69.4% | 0.4295 | 63.9% | 0.2341 |
| 50/50 blend (counterfactual) | 69.4% | 0.4359 | 50.0% | 0.2357 |

The model is near-market on match outcomes and clearly behind on totals —
exactly the favourite-tail Poisson shape error §4 diagnosed on 06-21. A blend-
weight sweep (n=36) showed Brier improving monotonically toward the market on
both markets. Betting ledger for completeness: 66 flagged picks, −24% ROI, 0%
CLV coverage.

**What changed on 2026-07-03** (full detail in DECISIONS.md):
1. Root cause of the dead automation found: production Vercel lacked
   `WC26_ODDS_API_KEY` + `CRON_SECRET` since launch (odds button 500'd; the
   closing-snapshot cron could never auth → CLV null). Fixed + redeployed.
2. Predictions are now logged **two-track server-side**: pure Elo + a
   market-anchored blend (1X2 50% market, totals 90% market) + a devigged
   market baseline snapshot. Previously the blend existed only in the browser,
   so the graded forward record measured a model nobody was shown.
3. Grading now scores per-track accuracy; `wc26_meta/accuracy` feeds the new
   headline "Forward accuracy" panel. Early games' tracks were computed
   retrospectively from stored pre-kickoff lambdas/odds (`tracksRetro`).
4. Odds pulls scheduled (`pullWc26Odds`, every 6 h, cron-secret auth on the
   route). Ingest flips played fixtures to `final` (38 stale "upcoming" games
   cleaned). Rematch id-collision guard added for the final rounds. Temp
   `?debug=1` endpoint removed.

**2026-07-04:** CLV pipeline confirmed live (first 3 closing snapshots + graded
CLV). Golden Boot standings + seeded bracket-MC forecast added
(`functions/wc26/goldenboot.js`, `wc26_meta/goldenboot`, 12 h schedule) — same
pinned source, FIFA counting rules, assumptions disclosed on-page. The
calibrated value scan moved into the shared engine and the prediction logger
now flags the SAME picks as the UI board (ledger consistency fix). See
DECISIONS.md 2026-07-04.

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
  testing; removed). Live state 2026-07-03: 48 teams, 85 results, knockout
  fixtures priced + kickoffs stored.

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

_ρ-refit attempted 2026-06-21 (cowork's RHO_REFIT_SPEC) — and REJECTED by its own
acceptance test:_
- Fit a single global ρ to the sharp devigged 1X2 across 36 fixtures (cross-entropy,
  golden-section). ρ* = **−0.0487**, interior (passes §5.2)... **but the mean draw
  error barely moved: 2.58pp → 2.49pp** (spec target was <1pp). The fit has almost no
  leverage.
- Why: the per-fixture draw residuals are **scattered and mean-zero** (signed mean
  −0.28pp; Paraguay/Australia −8pp but Cabo Verde/Saudi +4pp; no correlation with
  total goals). A *global* ρ moves the *global* draw rate, but there is no global
  bias to remove. **The error is not ρ-shaped.** (Exactly the §5.2 stop condition.)
- Root cause found: it's the **50/50 lambda blend, by design.** Pure sharp lambdas
  reproduce the sharp draw rate to **0.89pp** (< the spec's 1pp target — so the
  Dixon-Coles shape is already correct, even at the default −0.08). The 2.49pp
  residual is entirely our independent Elo voice pulling each fixture's draw rate off
  the sharp line. That dissent is the feature, not a bug.
- **Decision: do NOT ship a ρ-refit.** It would tune a global constant to mask a
  per-fixture blend — under-identified and wrong. ρ stays at the −0.08 default.

_What actually fixes the "+30%" artefacts — the §7 display/correctness layer (the
edges were always small probability errors magnified by long odds, not shape):_
1. **Devig the display book per market before computing edge** — compare model fair
   prob to the book's no-vig prob, not the raw vigged price. Removes ~6.5% free vig.
2. **Rank the value board by absolute probability disagreement `|Δp|`, not EV%**, and
   auto-flag `|Δp| < 3pp` as "price-magnified — low confidence". This is what kills
   the longshot artefacts (a 4pp error at odds 9.0 reads as +37% EV but is 4pp on
   `|Δp|`). Generalises the existing `offered ≥ 6.0` longshot guard to all markets.
3. **Poisson over-dispersion `φ` — NOW WARRANTED (decomposition run 2026-06-21).**
   Settled the "level vs shape" question without waiting for a matchday, via cowork's
   mean/shape decomposition of the O/U 2.5 |Δp|:
   - Split each fixture's O/U disagreement into MEAN (blend total vs sharp total) and
     SHAPE (price O/U from the *sharp* lambdas vs the book — means matched, so any gap
     is pure Poisson shape). Overall MIXED (mean MAE 4.5pp, shape MAE 4.3pp).
   - **But the shape error is a clean dispersion signature:** even games (supremacy
     <0.8) shape signed **−0.3pp** (Poisson fine); lopsided games (supremacy ≥1.5)
     shape signed **+7.5pp** (we systematically over-predict Over); **corr(favourite
     λ, shape error) = +0.78.** Error grows with the favourite's goal expectation and
     vanishes in even games — exactly what variance=mean under-dispersion predicts.
   - **Verdict:** the totals disagreement in mismatches is genuine Poisson shape error,
     not just Elo level-dissent. A negative-binomial `φ` is the right tool. The
     even-game MEAN component remains Elo dissent that only the forward record can judge
     — φ does not touch that.

   _Global φ fit attempted 2026-06-21 (PHI_REFIT_SPEC) — NOT SHIPPED, fails the §5
   over-correction guard:_
   - Fit one global φ on the **sharp** lambdas (NB marginals, cross-entropy vs sharp
     totals ladder, 1-D over d=1/φ). φ* = **3.49** (d*=0.286), interior — dispersion is
     genuinely wanted (not Poisson). Acceptance table (Poisson → φ*):
     - lopsided shape **+7.5pp → +0.0pp** ✓ (favourite tail fixed)
     - even-game shape **−0.3pp → −2.7pp** ✗ (pushed NEGATIVE — over-dispersed)
     - corr(fav λ, shape) **0.78 → 0.53** ✗ (only half-killed)
     - 1X2 draw error **0.92pp → 2.60pp** ✗ (dented the ρ-validated draw calibration)
   - This is exactly cowork's §6 escalation signature: a constant φ (excess var = μ²/φ)
     over-disperses the low-λ end while only partly fixing the favourite. **Decision: do
     NOT ship global φ.** Poisson retained. The data wants a **λ-dependent dispersion**
     (excess scaling as a different power of μ than μ²) — escalate to that spec.
   - Discipline note: ρ self-rejected at the boundary; φ passes "is dispersion wanted"
     but fails the over-correction guard. Both correctly ship nothing. The acceptance
     test catching the even-game/draw damage is the whole point.

   _λ-dependent dispersion `r = φ·λ^a` attempted 2026-06-21 (LAMBDA_DISPERSION_SPEC) —
   NOT SHIPPED, hit the §6 rabbit-hole bound on identifiability:_
   - First fit (O/U 2.5 only, the odds we'd stored) drifted to **a=0** — the rejected
     constant-φ corner. Root cause: we stored only the 2.5 line; `a`'s leverage is in
     the 1.5/3.5 tail (spec §2). Re-pulled the **full sharp totals ladder** (1.5–3.5,
     56 lines): fit then found a* ≈ −2.4, φ finite — interior, in the expected range.
   - **But a stability test killed it.** Refitting across reasonable data choices,
     a* swings **0 → −2.47** (2.5-only: a=0; full ladder: −2.37; drop-thirds: −1.94 /
     −2.27 / −2.47; φ* 25→56). The estimate is pinned by *which totals points each book
     happened to quote*, not by the physics. With ~36 fixtures and mostly one sharp
     totals point each, **(φ, a) is not identifiable.** The acceptance decomposition was
     also non-reproducible across baseline constructions.
   - **Verdict: STOP (spec §6).** The λ-form isn't refuted — it's *unmeasurable* at this
     data volume. Shipping two structural params fit to 36 noisy points whose answer
     flips with the subset is the curve-fitting-to-36-games failure the process exists to
     avoid. **Engine stays Poisson + ρ=−0.08.** Log the favourite-tail O/U residual as a
     known limitation; the §7 `|Δp|` guard already sinks those picks; the **forward
     record** is the arbiter. No third shape parameter, no λ-form re-attempt until the
     sharp-fixture × totals-line count is materially larger (knockouts + a wider ladder).

   - **Tally of structural changes the data declined: ρ (boundary self-reject), global
     φ (over-correction guard), λ-φ (non-identifiable).** Shipped only what passed its
     own test: Elo prior, sharp blend, devig, |Δp| ranking. Engine maths unchanged from
     the verified port. That discipline — three declines, zero forced — is the point.
   - **Interim caution:** the §7 |Δp| reorder leads the board with O/U 2.5 mismatch
     disagreements — least-trustworthy on the page. Keep O/U 2.5 stakes minimal; the
     forward record will judge whether they were edge or favourite-tail model error.
4. **base_goals = 1.25** stays (anchored per-fixture by the O/U blend); revisit only
   as a separate group-stage-goals calibration, never co-fit.

**Automation.**
- ~~Calibration is not on a schedule~~ **Done 2026-07-03:** `pullWc26Odds`
  (Firebase scheduler, every 6 h) drives `/api/stea/wc26/odds-api` with the cron
  secret — odds + `marketLambdas` + kickoffs refresh unattended (~8 req/day
  against the 500/month tier). Manual button retained.
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
