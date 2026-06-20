"""
Blind backtest: price each COMPLETED game from the seed ratings only (no fitting
to results, neutral venue), then grade vs what actually happened.

Graded on PREDICTION quality (accuracy / Brier / log-loss / goals), NOT CLV —
we don't have the closing odds for these games. Brier: lower = better
(uniform 1X2 = 0.667). Log-loss: lower = better (uniform 1X2 = 1.099).
"""
import math
import numpy as np
import pandas as pd
from engine import build_match
from markets import market_1x2, market_totals, market_btts
from value_finder import load_ratings

ratings = load_ratings("data/team_ratings.csv")
df = pd.read_csv("data/completed_results.csv")

rows = []
brier_1x2 = []; logloss_1x2 = []
hit_1x2 = 0; hit_ou = 0; hit_btts = 0; hit_score = 0
exp_goals_tot = 0.0; act_goals_tot = 0.0; abs_err_goals = []

for _, r in df.iterrows():
    t1, t2 = r["team1"], r["team2"]
    g1, g2 = int(r["g1"]), int(r["g2"])
    if t1 not in ratings or t2 not in ratings:
        continue
    m = build_match(ratings[t1], ratings[t2], neutral=True)
    x = market_1x2(m)
    p_home, p_draw, p_away = x["Home"][0], x["Draw"][0], x["Away"][0]

    # actual 1x2 outcome
    if g1 > g2: actual = "Home"; idx = 0
    elif g1 == g2: actual = "Draw"; idx = 1
    else: actual = "Away"; idx = 2
    probs = [p_home, p_draw, p_away]
    pred = ["Home", "Draw", "Away"][int(np.argmax(probs))]
    hit_1x2 += (pred == actual)
    brier_1x2.append(sum((probs[i] - (1 if i == idx else 0))**2 for i in range(3)))
    logloss_1x2.append(-math.log(max(probs[idx], 1e-12)))

    # totals 2.5
    p_over = market_totals(m, lines=(2.5,))["Over 2.5"][0]
    over_actual = (g1 + g2) > 2.5
    hit_ou += ((p_over > 0.5) == over_actual)

    # btts
    p_btts = market_btts(m)["BTTS Yes"][0]
    btts_actual = (g1 >= 1 and g2 >= 1)
    hit_btts += ((p_btts > 0.5) == btts_actual)

    # most-likely exact score
    n = m.matrix.shape[0]
    mi = np.unravel_index(np.argmax(m.matrix), m.matrix.shape)
    hit_score += (mi == (g1, g2))

    # goals
    exp_goals_tot += m.exp_total
    act_goals_tot += (g1 + g2)
    abs_err_goals.append(abs(m.exp_total - (g1 + g2)))

    rows.append({
        "match": f"{t1} {g1}-{g2} {t2}",
        "model_pick": pred,
        "P(pick)": f"{max(probs):.0%}",
        "actual": actual,
        "1X2": "OK" if pred == actual else "x",
        "model_xG": f"{m.lam_home:.1f}-{m.lam_away:.1f}",
        "P(o2.5)": f"{p_over:.0%}",
        "tot": "OK" if (p_over > .5) == over_actual else "x",
    })

N = len(rows)
res = pd.DataFrame(rows)
print(res.to_string(index=False))
print("\n=== BLIND BACKTEST SUMMARY  (n =", N, "completed games) ===")
print(f"1X2 accuracy        : {hit_1x2}/{N} = {hit_1x2/N:.0%}   (pick = model favourite)")
print(f"1X2 Brier score     : {np.mean(brier_1x2):.3f}   (uniform 0.667; lower better)")
print(f"1X2 log-loss        : {np.mean(logloss_1x2):.3f}   (uniform 1.099; lower better)")
print(f"Over/Under 2.5 acc  : {hit_ou}/{N} = {hit_ou/N:.0%}")
print(f"BTTS accuracy       : {hit_btts}/{N} = {hit_btts/N:.0%}")
print(f"Exact-score top pick: {hit_score}/{N} = {hit_score/N:.0%}")
print(f"Goals: model expected {exp_goals_tot:.1f} total, actual {act_goals_tot} "
      f"({exp_goals_tot/N:.2f} vs {act_goals_tot/N:.2f} per game); MAE {np.mean(abs_err_goals):.2f}")
