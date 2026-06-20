"""Correctness checks. Run: python3 test_engine.py"""
import math
import numpy as np
from engine import MatchModel, TeamRating, build_match, ratings_from_elo
from markets import market_1x2, market_totals, market_btts, market_asian_handicap
from devig import devig_multiplicative, devig_shin, ev, kelly

PASS, FAIL = "PASS", "FAIL"
results = []

def check(name, cond):
    results.append((name, PASS if cond else FAIL))

# 1. Matrix is a proper probability distribution (sums to 1)
m = MatchModel("A", "B", 1.7, 1.1, rho=-0.08)
check("matrix sums to 1", abs(m.matrix.sum() - 1.0) < 1e-9)
check("matrix non-negative", (m.matrix >= 0).all())

# 2. rho=0 reduces EXACTLY to independent Poisson (outer product of marginals)
m0 = MatchModel("A", "B", 1.7, 1.1, rho=0.0, max_goals=15)
from engine import _poisson_pmf
px = np.array([_poisson_pmf(i, 1.7) for i in range(16)])
py = np.array([_poisson_pmf(j, 1.1) for j in range(16)])
indep = np.outer(px, py); indep /= indep.sum()
check("rho=0 == independent Poisson", np.allclose(m0.matrix, indep, atol=1e-9))

# 3. Dixon-Coles with rho<0 inflates 0-0 and 1-1 vs independent Poisson
check("rho<0 inflates 0-0", m.matrix[0, 0] > indep[0, 0])
check("rho<0 inflates 1-1", m.matrix[1, 1] > indep[1, 1])

# 4. 1X2 probabilities sum to 1
x = market_1x2(m)
check("1X2 sums to 1", abs(sum(v[0] for v in x.values()) - 1.0) < 1e-9)

# 5. Over+Under sum to 1 at each line
t = market_totals(m, lines=(2.5,))
check("over+under=1", abs(t["Over 2.5"][0] + t["Under 2.5"][0] - 1.0) < 1e-9)

# 6. Stronger team is favourite: build_match sanity
elite = TeamRating("Elite", 1.45, 0.70)
weak = TeamRating("Weak", 0.82, 1.25)
mm = build_match(elite, weak)
xm = market_1x2(mm)
check("elite beats weak (home win > 60%)", xm["Home"][0] > 0.60)
check("elite high xG vs weak (>2.3)", mm.lam_home > 2.3)

# 7. Asian handicap: home -0 win prob == home win / (1-draw) [draw is the push]
ah = market_asian_handicap(mm, lines=(0.0,))
draw_p = xm["Draw"][0]
expected = xm["Home"][0] / (1 - draw_p)
check("AH 0.0 == DNB price", abs(ah["Home +0.00"][0] - expected) < 1e-9)

# 8. Devig: multiplicative output sums to 1
d = devig_multiplicative([1.5, 4.0, 7.0])
check("multiplicative devig sums to 1", abs(sum(d) - 1.0) < 1e-9)
check("multiplicative devig < raw implied", d[0] < 1/1.5)

# 9. Shin devig sums to 1 and sits between raw and proportional on the fav
s = devig_shin([1.5, 4.0, 7.0])
check("shin devig sums to 1", abs(sum(s) - 1.0) < 1e-9)

# 10. EV sign: +EV when model prob > implied; Kelly>0 only then
check("EV positive when edge", ev(0.55, 2.10) > 0)
check("EV negative when no edge", ev(0.40, 2.10) < 0)
check("kelly 0 when no edge", kelly(0.40, 2.10) == 0.0)
check("kelly >0 when edge", kelly(0.55, 2.10) > 0)

# 11. Elo helper monotonic: higher Elo -> higher atk, lower dfn
a_hi, d_hi = ratings_from_elo(2050)
a_lo, d_lo = ratings_from_elo(1500)
check("elo->atk monotonic", a_hi > a_lo)
check("elo->dfn monotonic", d_hi < d_lo)

print("\n=== ENGINE VERIFICATION ===")
for name, status in results:
    print(f"  [{status}] {name}")
n_fail = sum(1 for _, s in results if s == FAIL)
print(f"\n{len(results)-n_fail}/{len(results)} passed.")
print("Worked example  Elite v Weak:  xG", round(mm.lam_home,2), "-", round(mm.lam_away,2),
      "| Home", f"{xm['Home'][0]*100:.1f}%", "Draw", f"{xm['Draw'][0]*100:.1f}%",
      "Away", f"{xm['Away'][0]*100:.1f}%")
exit(1 if n_fail else 0)
