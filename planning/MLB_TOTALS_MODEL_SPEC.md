# MLB Totals Model — Spec & Build Plan (WC26 discipline ported to MLB)

_Draft for review. Author: Claude, 2026-07-15. No code written yet — this is the
plan to approve before any implementation, per the SoRR rule (plan → approval →
code)._

Route (proposed): `/apps/stea/mlb` (alias `/mlb`), ArcturusDC-tenant gated, same
Firebase project/tenant as WC26 (`stea-775cd`, `FqhckqMaorJMAQ6B29mP`).

Goal (user's own framing): **the correct Over/Under outcome on the main total —
either/or, NOT value.** We are not trying to beat the vig. We want P(Over) vs
P(Under) on the right side of the line more often than chance, from robust real
data, with zero fabrication.

---

## 0. Why the 2025 build died (diagnosis from the archived `mlb/` folder)

Read from `FAILED_PREDICTIONS_ANALYSIS.md`, `validation_system_analysis.md`,
`CURRENT_MODEL_SNAPSHOT.md`, `README.md`. It was a genuine system (MLB Stats API +
The Odds API + OpenWeatherMap; component-additive + 4-model ensemble), but it died
of the same disease as WC26 Phase 1 — in a worse form:

1. **Hand-tuned magic constants fit to noise.** The "fixes" were invented numbers
   pulled to explain a 7-game losing streak: `Yankees +1.0`, `Blue Jays +0.8`,
   `Rangers +0.6`, `hot weather +0.4/+0.7/+1.0`, `Rogers Centre -0.4→+0.2`. Every
   one is curve-fitting to games that already happened. This is exactly what WC26's
   process rejected three times (ρ, φ, λ-φ all declined as non-identifiable). MLB
   declined nothing — it just kept adding constants.
2. **Confidence claimed on trivially small samples.** "61.5% LOCKED, PROFITABLE,
   do not modify" — over **26 games** (~16 wins). Noise band ≈ ±10%;
   indistinguishable from a coin flip. Then more constants fit to 7 failures.
3. **Systematic Under bias (100% Under at one point)** — a structural mean error
   patched with team fudge-factors instead of fixing the run distribution.
4. **Version thrash (v2/v4/v5/v7c) with no forward record as arbiter.** Each
   version was judged on whichever recent days flattered it. WC26's rule — *forward
   record is the only scorecard; in-sample backtest is "calibration check, NOT a
   track record"* — was absent.

**Verdict:** the data sources were right; the *method* was the disease. We keep the
sources, discard 100% of the model code and every hand-set constant.

---

## 1. Founding rules (inherited from WC26 DECISIONS.md, non-negotiable)

- **NO fabricated data, ever.** The LLM may never produce a score, line, total,
  rating, probability, or pick. (WC26 DEC 2026-06-21.)
- **Results = pinned structured source, no LLM, no web_search.** Fetch-one-known-
  endpoint, schema-validate, reject anything malformed. Never invent.
- **No hand-set team/venue/weather constants.** Every adjustment must be *derived
  from a full season of data by a deterministic fit*, or it does not exist. If a
  factor is not identifiable from the season, it does not ship (the WC26 ρ/φ
  discipline).
- **Forward record is the only scorecard.** Picks logged before first pitch, graded
  after the final. In-sample backtest is labelled "calibration check, NOT a track
  record."
- **Fail-closed.** Missing starting pitcher / missing market total within N hours of
  first pitch = HALT that game's prediction (the old snapshot already learned this:
  `if (!homePitcher || !awayPitcher) throw`). No mock fallbacks.

---

## 2. Data sources (all real, all pinned — no search, no LLM)

| Piece | Source | Endpoint (pinned) | Notes |
|---|---|---|---|
| Schedule + probable pitchers | **MLB Stats API** (official, free, no key) | `statsapi.mlb.com/api/v1/schedule?sportId=1&date=YYYY-MM-DD&hydrate=probablePitcher,team,venue` | More robust than openfootball — official league feed. |
| Final scores / linescore | **MLB Stats API** | `.../api/v1/schedule?...&hydrate=linescore` or `/game/{gamePk}/linescore` | `status.abstractGameState==='Final'` = played. Total runs = home+away. |
| Pitcher season stats | **MLB Stats API** | `/people/{id}/stats?stats=season&season=YYYY&group=pitching` | ERA/FIP-ish inputs, deterministic. |
| Team hitting/pitching rates | **MLB Stats API** | `/teams/{id}/stats?stats=season&season=YYYY&group=hitting|pitching` | Runs/game for/against — the prior. |
| Market total (the line) | **The Odds API** | `/v4/sports/baseball_mlb/odds/?markets=totals&regions=us` | Consensus median across books; same gate pattern as WC26 `oddsApi.js`. Free tier 500/mo. |
| Weather (optional, v2) | **OpenWeatherMap** | per-venue current | Optional. NOT hand-weighted — only used if a season fit finds a real coefficient. |

Keys: `ODDS_API_KEY` already exists (reused). MLB Stats API needs none.
OpenWeather deferred to v2.

---

## 3. The model (deterministic, market-anchored — the WC26 port)

MLB run totals fit the **same distributional family** as WC26 goals. WC26 built a
Dixon-Coles Poisson **scoreline matrix** from two team lambdas and read every market
off it. MLB is directly analogous:

**Per-team run expectation (the prior, market-independent):**
- `runsFor` / `runsAgainst` season rates per team, shrunk toward league mean with a
  Bayesian prior-games weight (exactly `refitWc26Ratings`' shrinkage; `PRIOR_GAMES`
  analogue). Adjust the *away* team's run expectation by the *home* starting
  pitcher's run-suppression rate and vice versa. All derived, no constants.
- League baseline is **measured from the season to date**, not a hard-coded 8.7.

**Per-game total = blend toward the market total (the WC26 50/50 blend):**
- The Odds API market total is sharp. Model total `μ_model = λ_home + λ_away`.
- Blend: `μ = w · μ_market + (1-w) · μ_model` (start `w=0.5`, same as WC26 — the
  market keeps us honest; the model only moves the number when data strongly says).
- Because the user wants *correct side, not value*, `w` can even sit higher (0.5–0.7)
  toward the market — the market total is already an excellent point estimate; our
  job is only the Over/Under **probability split around it**.

**Over/Under probabilities (the run distribution):**
- Model total runs as **negative-binomial** (runs are over-dispersed vs Poisson —
  this is the *measured* MLB reality, and exactly the dispersion WC26 investigated).
  One global dispersion φ **fit from the season**, tested against the WC26-style
  over-correction guard. If the season can't identify φ, fall back to Poisson.
- `P(Over line) = P(totalRuns > line)`, `P(Under) = 1 - P(Over)` (half-run lines
  avoid pushes; integer lines handle the push explicitly).
- Pick = the side with P > 0.5. Confidence = distance from 0.5, **calibrated later
  against the forward record**, never guessed.

**No GPT anywhere in this path.** Same as WC26.

---

## 4. Architecture (mirrors WC26 file-for-file)

| WC26 | MLB equivalent |
|---|---|
| `src/app/apps/stea/wc26/lib/engine.js` | `src/app/apps/stea/mlb/lib/engine.js` — NB run distribution, `buildGameTotal`, `marketOverUnder`, `gradeHistory` |
| `src/lib/wc26/ingestResults.js` (openfootball) | `src/lib/mlb/ingestGames.js` (MLB Stats API) — schedule + finals, schema-validate, reject malformed |
| `src/lib/wc26/oddsApi.js` (The Odds API soccer) | `src/lib/mlb/oddsApi.js` (The Odds API `baseball_mlb` totals) — median consensus + gate |
| `src/lib/wc26/calibrate.js` | `src/lib/mlb/calibrate.js` — solve model λ, fit φ from season |
| `functions/wc26/service.js` (refit/predict/grade) | `functions/mlb/service.js` — season refit, pre-first-pitch prediction log, post-final grading |
| `POST /api/stea/wc26/ingest` + `/odds-api` | `POST /api/stea/mlb/ingest` + `/odds` |
| `WC26Client.js` (UI) | `MLBClient.js` — today's games, model total vs market, O/U pick + confidence, forward record first |
| Firestore `wc26_*` | `mlb_games`, `mlb_teams`, `mlb_pitchers`, `mlb_predictions`, `mlb_meta` (client read-only, Functions write) |

Reuse the WC26 admin/ingest patterns, the ADC one-off script pattern
(`wc26-live-refresh.js` → `mlb-live-refresh.js`), and the forward-record grading
flow unchanged in spirit.

---

## 5. Honesty layer (same two layers as WC26)

- **Forward record first.** Every day: log each game's O/U pick + P before first
  pitch (`mlb_predictions`, locked at first pitch), grade after Final. UI shows this
  scorecard first; it starts at zero.
- **Backtest demoted.** Any season backtest is labelled "in-sample calibration
  check, NOT a track record."
- **Confidence is not certainty.** Bands calibrated against real hit-rate once the
  forward record has enough graded games — heuristic until then, and stated as such.

---

## 6. Realistic expectation (stated up front, unlike the 2025 build)

MLB totals are hard; the market total is sharp. A clean, data-robust model
realistically targets **~52–55% correct-side on high-confidence picks over a
season**, NOT the fabricated 61.5%/26-games the old docs claimed. The win here is
**a number that is real and survives contact with live games** — which is exactly
the stated goal (robust data, honest predictions, best genuine chance). This is a
modelling exercise, not income. Stake only what you'd lose.

---

## 7. Proposed build order (each step approved before the next)

1. **Data path proof (no model).** Build `ingestGames.js` + `oddsApi.js`, pull one
   real day: today's schedule + probable pitchers + market totals, and yesterday's
   finals. Print them. Prove the no-fabrication layer end to end. (~½ day)
2. **Engine + season prior.** NB run distribution, team run-rate shrinkage refit
   from season-to-date, pitcher adjustment. Deterministic. Unit-tested like the WC26
   engine. (~1 day)
3. **Blend + O/U probabilities.** Market-total blend, `P(Over)/P(Under)`, pick +
   raw confidence. Backtest on a past month **labelled in-sample**. (~1 day)
4. **Forward record + Firestore + minimal UI.** Log pre-first-pitch picks, grade
   after finals, `/apps/stea/mlb` page showing today's picks + the (empty, growing)
   forward record. (~1–2 days)
5. **Only then**, if the forward record earns it: consider weather/park factors —
   each admitted **only** if a full-season fit identifies a real coefficient that
   passes the over-correction guard. Never a hand-set constant.

---

## 8. Open questions for you

- **Season scope:** current 2026 MLB season live data, or rebuild/validate against
  the archived Aug-2025 games first (they're in the folder as a ready-made backtest
  set)? Backtesting on 2025 is a good in-sample calibration check before going live.
- **Weather in or out of v1?** Recommend OUT (deferred to §7.5) — it was a top
  source of the old hand-tuning; only add it if the season fit earns it.
- **SoRR home:** add MLB decisions to `planning/DECISIONS.md` (same as WC26) and a
  companion `MLB_MODEL_STATE.md` once built. Confirm.
```
