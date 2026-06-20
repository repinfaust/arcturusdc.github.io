# Build Spec — WC26 xG Value App (`/apps/stea/wc26`)

**For:** the Claude that knows the `arcturusdc.github.io-clean` repo.
**From:** the engine build. Everything here is verified; don't re-derive the maths.

---

## 0. TL;DR

Build a client-side page at the route `/apps/stea/wc26` that:

1. **Recommends a bet** — the single best-value game/market/selection right now, with edge and ¼-Kelly stake.
2. **Prices any match** — pick two teams, see xG + fair odds across every market.
3. **Calculates value** — paste book odds, get devigged edge + stake + flags.
4. **Shows the model's track record** — strike rate / Brier vs actual results, updated as games complete.
5. Lets the user **edit team ratings** (the one input that matters).

The whole thing is **static** — no backend, no DB. The maths lives in `engine.js` (provided, verified). The model **never uses an LLM in the prediction path** — that's a hard rule carried over from a prior MLB project where LLM hallucination wrecked results. The LLM may help wrangle data; it must not pick outcomes.

---

## 1. Files provided in this handoff folder

| File | What it is | Where it goes |
|---|---|---|
| `engine.js` | ES module — Dixon-Coles/xG engine, all markets, devig, recommend, gradeHistory. **Verified against 19 tests + Python reference.** | `apps/stea/wc26/lib/engine.js` (or your equivalent) |
| `ratings.json` | 40 teams, `{atk, dfn, tier}` seed priors | `apps/stea/wc26/data/ratings.json` |
| `results.json` | 20 completed games `{home, away, g1, g2}` | `apps/stea/wc26/data/results.json` |

Import and use `engine.js` as-is. Its public API:

```js
import {
  buildMatch, priceAll, market1x2, marketTotals, marketTeamTotals,
  marketBTTS, marketAsianHandicap, marketCorrectScore,
  devigMultiplicative, ev, kelly,
  recommend, topRecommendation, gradeHistory, DEFAULTS,
} from "./lib/engine.js";
```

---

## 2. Architecture

- **Static client-side render.** Works on the existing GitHub → Vercel static flow. If `/apps/stea/` is Next.js, make this a route/page and import `engine.js` as a normal module; if it's plain static, a single `index.html` + `<script type="module">` is fine. **Match whatever `/apps/stea/` already uses** — don't introduce a new framework.
- **No server.** All computation in the browser. Data comes from the committed JSON files; the user's own bet log lives in `localStorage`.
- **No build-time secrets, no API keys.** Odds are entered by hand (there's no free live-odds feed — confirmed, the connector registry has none).

---

## 3. The model in one paragraph (so you can label the UI correctly)

Each team has an **attack** multiplier (`atk`, >1 scores more than an average WC side) and a **defence** multiplier (`dfn`, <1 concedes fewer). Expected goals: `λ_home = base × atk_home × dfn_away`, `λ_away = base × atk_away × dfn_home`. Those feed a Poisson scoreline grid with the Dixon-Coles low-score correction (`ρ = −0.08`, inflates 0-0/1-1 which plain Poisson under-predicts). Every market is a sum over that one grid, so prices are mutually consistent by construction.

### Calibration — `base_goals` (already set, here's the why)

`DEFAULTS.baseGoals = 1.25` (≈ **2.50 goals/game**). This was tuned on the 20 completed games **and** anchored to the historical WC **group-stage** scoring rate (~2.5), not curve-fitted:

| base | O/U 2.5 acc | 1X2 Brier | goals/game |
|---|---|---|---|
| 1.35 | 40% | 0.600 | 2.92 |
| 1.30 | 45% | 0.596 | 2.81 |
| **1.25** | **65%** | **0.592** | **2.70** |
| 1.20 | 60% | 0.588 | 2.59 |

1.25 is the defensible default for group games. **Expose it as a slider/setting (1.15–1.40)** and document: nudge to **1.30–1.35 for open knockout ties**, where games run higher than cagey group openers. Do not let users push it to extremes thinking it's free accuracy — the 20-game O/U numbers bounce around the 2.5 line and are noisy.

---

## 4. Features & UI

### 4a. Recommendation panel (headline — top of page)

Call `topRecommendation(fixtures, ratings)` for the single best bet, and `recommend(...)` for the ranked list below it. Display for the top pick:

> **Bet of the day:** `Brazil v Morocco` — **Home Over 1.5 goals** @ 2.55
> Model fair 1.94 · **edge +31%** · stake **5.1u** (¼-Kelly on 100u bank)
> *Small market — books shade these least.*

Rules baked into `recommend()` (don't reinvent):
- **Small markets** (Team Totals, BTTS, Totals, Correct Score) flagged at a lower edge threshold (1.5%) — they're the primary target.
- **Longshots** (offered ≥ 6.0 in main markets) need a 10% edge and are tagged `LONGSHOT — low confidence` and **sorted to the bottom**. A coarse-prior model over-rates longshots; this stops it embarrassing itself.
- **Danger-zone favourites** (offered 1.34–1.50) tagged `DANGER-ZONE FAV (fade)` — the public overpays here (~−25% ROI historically); surface it as a *fade*, not a follow.

`fixtures` shape:
```js
[{ home: "Brazil", away: "Morocco", neutral: true,
   odds: { "Over 2.5": 2.00, "Home Over 1.5": 2.55, "BTTS Yes": 1.85, "Home -1.50": 4.30 } }]
```
Selection keys must match the engine's market keys exactly (e.g. `"Over 2.5"`, `"Home Over 1.5"`, `"BTTS Yes"`, `"Home -1.50"`, `"Home"`, `"Draw"`, `"Away"`). Store upcoming fixtures + odds in a committed `fixtures.json` the user edits, **and/or** let them add a fixture in-UI.

### 4b. Match pricer

Two team dropdowns (from `ratings.json`) + neutral/host toggle → `buildMatch` → `priceAll`. Show: xG line (`λ_home – λ_away`), 1X2, Double Chance, Totals, Team Totals, BTTS, Asian Handicap, top-8 Correct Scores. Each as model probability **and** fair decimal odds.

### 4c. Value calculator

For a priced match, let the user type the book odds they see per selection. Show `ev()` (as %) and `kelly()` stake, colour-coded (green +EV). Optional: a two/three-way devig display via `devigMultiplicative()` so they can see the book's true (no-vig) opinion next to the model's.

### 4d. Model track record / strike rate

Call `gradeHistory(results, ratings)`. Render:
- Headline tiles: **1X2 strike rate**, **Brier** (with "uniform = 0.667" reference so it's meaningful), **O/U strike rate**, games graded.
- A per-game table: `match`, model pick + confidence, actual, ✓/✗.
- **Honesty callout (keep this — it's the most useful thing on the page):** note that the model's wrong calls have clustered on **draws** (group stage is draw-heavy), and that *strike rate is not profit* — the real scorecard is closing-line value, which a static site can't compute without closing odds. See §5.

Current blind numbers (base 1.25, 20 games, via `engine.js`): **1X2 55% · Brier 0.592 · O/U 65%**. These will move as `results.json` grows.

> **Note on 1X2 strike rate fragility:** equal-rated teams (e.g. Canada/Qatar both seeded "Mid") produce a *symmetric* match where the model has no real 1X2 opinion and the pick is an arbitrary tie-break. Don't over-read the exact %. Brier and O/U are the more stable metrics. (This also exposes a seed-rating gap: **Canada is a host and won 6-0 yet is rated equal to Qatar** — bump host/improving teams, or use the host toggle.)

### 4e. Editable ratings

Editable table of `ratings.json` (atk/dfn per team), persisted to `localStorage` (with a "reset to defaults" + "export JSON" button so the user can commit improved ratings back to the repo). Label loudly: **these are coarse seed priors — refresh from rolling xG (FBref / Understat / FotMob) for real accuracy.** This is the single highest-leverage input.

---

## 5. Track record done honestly (important)

Two distinct ledgers — keep them separate:

1. **Model prediction log** (`results.json`, committed): completed games → `gradeHistory` computes strike rate / Brier. This is *prediction* quality. It is **noisy and not the same as profit** — a 55%-favourite hit rate is roughly what the market itself produces.
2. **User bet log** (`localStorage`): every bet the user actually places — `{date, match, market, selection, oddsTaken, stake, closingOdds, result}`. Compute **CLV%** = `oddsTaken/closingOdds − 1` and P&L. **This is the real scorecard.** Surface average CLV and % of bets beating the close prominently. The line to put on screen: *"Over ~48 games, results are noise. If your average CLV is positive you have an edge — even on a losing run."*

Don't conflate the two. The model can have a great strike rate and still lose money, and vice versa.

---

## 6. Guardrails (please keep)

- **No LLM in the prediction path.** Numbers come from `engine.js` only.
- **Responsible-gambling footer** + "not financial advice." Stake-what-you-can-lose.
- **Reality check copy:** 64 games, ~48 left; even a real 4% edge can't prove itself before the final. This is a modelling challenge, not income.
- Don't auto-place bets or integrate a sportsbook. Display only.

---

## 7. Acceptance checks before shipping

- [ ] `buildMatch({atk:1.45,dfn:0.70},{atk:0.82,dfn:1.25})` → xG **2.27–0.72**, 1X2 **71.8 / 18.6 / 9.6%** (this exact output = engine imported correctly).
- [ ] Every scoreline matrix sums to 1.0; Over + Under at any line sum to 1.0.
- [ ] `gradeHistory(results, ratings).summary` → games 20, acc1x2 0.55, brier1x2 ≈ 0.592, accOU 0.65.
- [ ] `recommend()` puts small-market value above longshots; longshot rows carry the tag.
- [ ] Ratings edits persist across reload (localStorage) and "export" produces valid JSON.
- [ ] `base_goals` slider changes prices live and is documented (1.25 default, 1.30–1.35 knockouts).
- [ ] Page renders with no network calls beyond the committed JSON.

---

## 8. Making it adaptive (Firestore + Cloud Functions) — recommended

As shipped, the model is **static**: ratings are fixed seed priors and nothing updates until someone edits them. "Learning" here means **one thing only — refreshing each team's attack/defence rating from match data as games happen.** The Dixon-Coles *maths* never changes; the *ratings* do. Since Firebase/Firestore + Functions are already wired, do this server-side and the app becomes self-updating.

### What "learning" should actually be (deterministic — no LLM)

Ratings are re-estimated from observed games. Two valid methods:

- **A — Bayesian shrinkage update (recommended for WC):** posterior rating = seed/Elo **prior** updated by observed games, with the weight shifting from prior → data as a team accumulates matches. With only ~3 group games per team, a pure fit overfits; shrinkage is the honest small-sample approach (and echoes the whole "48 games is a tiny sample" caveat). Time-decay weights recent games more (Dixon-Coles φ(t)).
- **B — Dixon-Coles MLE refit (gold standard, once enough data):** re-estimate all attack/defence params + home advantage by maximum likelihood over a rolling, time-weighted window. Deterministic optimiser (L-BFGS). Heavier; better late in the tournament.

Calibrate to **xG**, not raw goals, where available (stabilises faster). If you only have scores, MLE on goals is the classic fallback.

### Firestore shape

| Collection | Docs |
|---|---|
| `teams` | `{atk, dfn, priorAtk, priorDfn, gamesPlayed}` |
| `matches` | `{home, away, g1, g2, xgHome?, xgAway?, status}` |
| `fixtures` | `{home, away, neutral, odds:{}}` |
| `predictions` | model pre-match prices + timestamp (logged BEFORE kickoff → honest track record) |
| `bets` | user log `{oddsTaken, closingOdds, stake, result}` → CLV |

### Cloud Functions

1. **`refitRatings`** (scheduled, e.g. daily 06:00 or post-matchday): read `matches` → shrinkage/MLE update → write `teams`. **Deterministic. No LLM.** This is the bit that "learns."
2. **`onMatchResult`** (Firestore trigger on a `matches` doc going final): grade the stored `prediction`, update strike-rate aggregates; if `closingOdds` present, compute CLV.
3. **`ingestData`** (scheduled): acquire results + xG + odds and write to `matches`/`fixtures`. **An LLM is a legitimate, cost-effective way to do this** — see below.

The page reads `teams`/`fixtures` live from Firestore and computes recommendations client-side via `engine.js` (or move that into a callable Function if you'd rather not expose the logic). Manual "run a script" is then never needed — the schedule handles it.

### Data acquisition via LLM (the cost-effective route)

Paid odds APIs (API-Football, Opta) charge because **reliability** is the expensive part, not the data — results, xG and odds all sit on public pages. So use the OpenAI key as a **scraper/extractor**, not a calculator:

`ingestData` fetches the relevant pages (results/xG from FBref/Understat/Flashscore; odds from a public aggregator or the book pages you can read) → passes the HTML/text to the LLM → asks for **structured JSON only** (`{home, away, g1, g2, xgHome, xgAway}`, `{selection, odds}`). Cheap per call, and it dodges the subscription.

**The one hard rule — validate before the maths.** The failure mode is transcription error: the LLM reads `1.90` as `1.09`, that phantom number hits the EV calc, and you bet into an edge that isn't there. So every extracted row passes a deterministic gate before reaching the engine:
- odds must be `> 1.0`; a 3-way market's overround must be sane (≈ 100–115%) — reject otherwise;
- scores are plausible non-negative integers; team names map to a known `teams` doc (this is where the LLM legitimately helps — reconciling name variants);
- where possible, cross-check two sources and flag disagreement for manual review.

LLM **in**: fetching and transcribing data. LLM **out**: computing any rating, probability, or pick — that stays deterministic in `engine.js`. That line is the whole MLB lesson.

**Honest caveat:** scraping odds is fragile — book/aggregator pages are JS-heavy and anti-bot, ToS varies, and layouts change, so expect occasional breakage. Build the validation gate + a manual-entry fallback in the UI for when a scrape fails. That's the real trade vs a paid feed: you save the money, you spend a little maintenance.

### Optional cosmetic LLM use

A plain-English "why this bet?" blurb over numbers the engine already produced. Nice-to-have, never in the calculation.

## 9. Deploy

Drop the files into the repo under the `/apps/stea/wc26` route to match the existing `/apps/stea/` structure, commit, push — Vercel picks it up. No env vars, no build config beyond whatever `/apps/stea/` already uses.

*If you want me (the engine build) to adapt `engine.js` into a specific framework component (React/Next page, Svelte, etc.), connect the repo folder to that session and I'll match the stack exactly.*
