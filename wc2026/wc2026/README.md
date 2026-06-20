# WC2026 xG Value Engine

A deterministic football pricing engine for the 2026 World Cup. Dixon-Coles
bivariate-Poisson, calibrated to expected goals (xG). It turns two teams'
attack/defence ratings into a full scoreline distribution and prices **every
market off that one matrix** — so the prices can never contradict each other.

No black box. No LLM anywhere in the prediction path. The maths picks; the
LLM only ever helped wrangle data and build the tooling. (That's the MLB
lesson, carried across: hallucination stays out of the numbers.)

## What's in here

```
wc2026/
├── engine.py          # Dixon-Coles scoreline model + xG calibration
├── markets.py         # prices 1X2, AH, totals, team totals, BTTS, correct score
├── devig.py           # multiplicative + Shin de-vig, EV, fractional Kelly
├── value_finder.py    # compares model vs book odds, flags +EV bets
├── clv.py             # closing-line-value tracker (the real scorecard)
├── test_engine.py     # 19 correctness checks — run this first
├── build_workbook.py  # generates the Excel workbook
├── WC2026_Value_Engine.xlsx   # the usable deliverable
└── data/
    ├── team_ratings.csv       # EDIT THIS — attack/defence per team
    ├── fixtures_odds.csv      # fixtures + the book odds you've seen
    └── clv_log.csv            # your bet log
```

## Quick start

```bash
python3 test_engine.py                                  # verify (19/19)
python3 value_finder.py data/fixtures_odds.csv data/team_ratings.csv
python3 build_workbook.py                               # refresh the xlsx
```

Requires Python 3 with `numpy`, `pandas`, `openpyxl`.

## The model in one paragraph

Each team has an **attack** multiplier (`atk`, >1 = scores more than an average
WC side) and a **defence** multiplier (`dfn`, <1 = concedes fewer). Expected
goals: `λ_home = base × atk_home × dfn_away`, `λ_away = base × atk_away ×
dfn_home`, with `base ≈ 1.35` goals/team/game. Those two λ's feed a Poisson grid
with the Dixon-Coles low-score correction (`ρ < 0` inflates 0-0 and 1-1, which
plain Poisson under-predicts). Every market is then a sum over that grid.

## The one job that matters: ratings

Out of the box `team_ratings.csv` holds **coarse seed priors** (tier-based, not
measured). The single highest-leverage thing you can do is replace them with
**rolling xG** from FBref / Understat / FotMob — recent xG-for and xG-against per
game, normalised so 1.00 = tournament average. The engine is only as good as
those inputs. There's also `ratings_from_elo()` if you'd rather seed from World
Football Elo.

## Known failure mode (don't get caught)

A coarse model **over-rates longshots**, so it will occasionally flag "minnow to
beat an elite side" as value. That's a calibration artifact, not an edge. Those
rows are tagged `LONGSHOT — low confidence` and sorted to the bottom. Refresh the
ratings before trusting any 1X2 longshot. The trustworthy output out of the box
is the **small markets** (team totals, BTTS, totals) and the **danger-zone fade**.

## Where the edge actually is

- **Small markets** (team totals, BTTS, totals): books shade them least, limits
  are low. Flagged at a lower edge threshold. *Primary target.*
- **Danger-zone favourites** (odds ~1.34–1.50, i.e. −200/−299): the public
  overpays; ~−25% ROI historically. The finder tags these so you **fade**.
- **48-team format**: more mismatches (totals/handicaps) and dead third group
  games (rotation the market is slow to price).

## How to judge yourself — CLV, not results

Over ~48 remaining games, win/loss is noise. **Closing-line value is the
signal.** Log every bet at the odds you took; add the closing odds later. If your
average CLV is positive across many bets, you're beating the market and you're
good — even on a losing run. If it isn't, no hot streak is real. That's the whole
discipline.

## Reality check

64 games, ~48 left. Even a genuine 4% edge can't statistically prove itself
before the trophy is lifted — variance dominates a sample this small. This is a
clean, honest modelling challenge for curiosity, not a pension plan. Stake only
what you'd happily lose, and size with the built-in ¼-Kelly (full Kelly is too
aggressive for a model you don't fully trust).

*Not financial advice — it's a Poisson grid with opinions.*
