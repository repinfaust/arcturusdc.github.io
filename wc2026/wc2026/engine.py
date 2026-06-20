"""
WC2026 deterministic match engine.

Dixon-Coles bivariate-Poisson scoreline model, calibrated to expected goals (xG).
Produces a full scoreline probability matrix, from which EVERY market is priced
analytically. No black box, no LLM in the prediction path — pure maths.

Reference: Dixon, M.J. & Coles, S.G. (1997), "Modelling Association Football
Scores and Inefficiencies in the Football Betting Market", Applied Statistics 46(2).
"""

from __future__ import annotations
import math
from dataclasses import dataclass, field
import numpy as np


# ----------------------------------------------------------------------------
# Core scoreline model
# ----------------------------------------------------------------------------

def _poisson_pmf(k: int, lam: float) -> float:
    return math.exp(-lam) * lam ** k / math.factorial(k)


def _dc_tau(x: int, y: int, lam: float, mu: float, rho: float) -> float:
    """Dixon-Coles low-score dependence correction.

    rho < 0 inflates 0-0 and 1-1, deflates 1-0 and 0-1 — matching the empirical
    finding that independent Poisson under-predicts draws in low-scoring games.
    rho = 0 reduces this exactly to independent Poisson.
    """
    if x == 0 and y == 0:
        return 1.0 - lam * mu * rho
    if x == 0 and y == 1:
        return 1.0 + lam * rho
    if x == 1 and y == 0:
        return 1.0 + mu * rho
    if x == 1 and y == 1:
        return 1.0 - rho
    return 1.0


@dataclass
class MatchModel:
    """A priced match. lam_home / lam_away are expected goals (xG) for each side."""
    home: str
    away: str
    lam_home: float
    lam_away: float
    rho: float = -0.08
    max_goals: int = 12
    matrix: np.ndarray = field(default=None, repr=False)

    def __post_init__(self):
        n = self.max_goals + 1
        m = np.zeros((n, n))
        for x in range(n):
            px = _poisson_pmf(x, self.lam_home)
            for y in range(n):
                py = _poisson_pmf(y, self.lam_away)
                m[x, y] = px * py * _dc_tau(x, y, self.lam_home, self.lam_away, self.rho)
        # renormalise (DC correction + truncation perturb the total slightly)
        self.matrix = m / m.sum()

    # -- helpers ------------------------------------------------------------
    @property
    def exp_total(self) -> float:
        return self.lam_home + self.lam_away

    def prob(self, mask) -> float:
        """Sum probability over a boolean mask(x, y)."""
        n = self.matrix.shape[0]
        total = 0.0
        for x in range(n):
            for y in range(n):
                if mask(x, y):
                    total += self.matrix[x, y]
        return total


# ----------------------------------------------------------------------------
# Building a match from team ratings
# ----------------------------------------------------------------------------

@dataclass
class TeamRating:
    name: str
    atk: float   # attack multiplier vs an average WC side (1.0 = average)
    dfn: float   # defence multiplier; <1.0 = concedes fewer than average


def build_match(home: TeamRating, away: TeamRating,
                base_goals: float = 1.25,
                home_adv: float = 1.0,
                rho: float = -0.08,
                neutral: bool = True) -> MatchModel:
    """Expected goals from a multiplicative strength model.

    lam_home = base * atk_home * dfn_away * (home_adv if not neutral)
    lam_away = base * atk_away * dfn_home

    base_goals ~ average goals per team per game (international tournament ~1.35).
    home_adv only applied when neutral=False (e.g. USA/Canada/Mexico at home).
    """
    ha = 1.0 if neutral else home_adv
    lam_home = base_goals * home.atk * away.dfn * ha
    lam_away = base_goals * away.atk * home.dfn
    return MatchModel(home.name, away.name, lam_home, lam_away, rho=rho)


def ratings_from_elo(elo: float, elo_avg: float = 1700.0,
                     spread: float = 0.45) -> tuple[float, float]:
    """Optional helper: convert a World Football Elo rating into (atk, dfn)
    multipliers. Transparent, tunable, and clearly an approximation —
    refresh atk/dfn from rolling xG (FBref/Understat) when you have it.

    A team `spread` log-units stronger than average scores exp(spread*z) more and
    concedes exp(-spread*z) fewer, where z scales with its Elo gap to the field.
    """
    z = (elo - elo_avg) / 200.0          # ~200 Elo per 'unit' of quality
    atk = math.exp(spread * z)
    dfn = math.exp(-spread * z)
    return round(atk, 3), round(dfn, 3)
