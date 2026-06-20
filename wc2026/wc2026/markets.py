"""
Market pricing from a Dixon-Coles scoreline matrix.

Every market below is derived analytically from the same probability matrix, so
all prices are internally consistent (1X2, totals, BTTS, AH, team totals and
correct score can never contradict each other). Returns fair (no-vig) prices.
"""

from __future__ import annotations
import numpy as np
from engine import MatchModel


def _fair_odds(p: float) -> float:
    return float("inf") if p <= 0 else round(1.0 / p, 3)


def market_1x2(m: MatchModel) -> dict:
    home = m.prob(lambda x, y: x > y)
    draw = m.prob(lambda x, y: x == y)
    away = m.prob(lambda x, y: x < y)
    return {
        "Home": (home, _fair_odds(home)),
        "Draw": (draw, _fair_odds(draw)),
        "Away": (away, _fair_odds(away)),
    }


def market_double_chance(m: MatchModel) -> dict:
    home = m.prob(lambda x, y: x > y)
    draw = m.prob(lambda x, y: x == y)
    away = m.prob(lambda x, y: x < y)
    return {
        "1X (Home/Draw)": (home + draw, _fair_odds(home + draw)),
        "12 (No Draw)": (home + away, _fair_odds(home + away)),
        "X2 (Away/Draw)": (away + draw, _fair_odds(away + draw)),
    }


def market_btts(m: MatchModel) -> dict:
    yes = m.prob(lambda x, y: x >= 1 and y >= 1)
    return {"BTTS Yes": (yes, _fair_odds(yes)),
            "BTTS No": (1 - yes, _fair_odds(1 - yes))}


def market_totals(m: MatchModel, lines=(1.5, 2.5, 3.5, 4.5)) -> dict:
    out = {}
    for ln in lines:
        over = m.prob(lambda x, y: (x + y) > ln)
        out[f"Over {ln}"] = (over, _fair_odds(over))
        out[f"Under {ln}"] = (1 - over, _fair_odds(1 - over))
    return out


def market_team_totals(m: MatchModel, lines=(0.5, 1.5, 2.5)) -> dict:
    """Team-total goals — a 'small market' the books shade less."""
    out = {}
    for side, axis in (("Home", 0), ("Away", 1)):
        for ln in lines:
            if axis == 0:
                over = m.prob(lambda x, y: x > ln)
            else:
                over = m.prob(lambda x, y: y > ln)
            out[f"{side} Over {ln}"] = (over, _fair_odds(over))
            out[f"{side} Under {ln}"] = (1 - over, _fair_odds(1 - over))
    return out


def market_asian_handicap(m: MatchModel, lines=(-2.0, -1.5, -1.0, -0.5,
                                                0.0, 0.5, 1.0, 1.5, 2.0)) -> dict:
    """Asian handicap on the HOME team. Quarter lines split the stake; whole
    lines can push (stake returned). Returns win-probability conditional on a
    decision (push mass removed), i.e. the price you'd actually be laid."""
    out = {}
    n = m.matrix.shape[0]
    for h in lines:
        win = push = 0.0
        for x in range(n):
            for y in range(n):
                p = m.matrix[x, y]
                margin = (x - y) + h
                if abs(margin) < 1e-9:
                    push += p
                elif margin > 0:
                    win += p
        decisive = 1 - push
        adj = win / decisive if decisive > 0 else 0.0
        out[f"Home {h:+.2f}"] = (adj, _fair_odds(adj))
    return out


def market_correct_score(m: MatchModel, top=8) -> dict:
    n = m.matrix.shape[0]
    scores = []
    for x in range(n):
        for y in range(n):
            scores.append((f"{x}-{y}", m.matrix[x, y]))
    scores.sort(key=lambda t: t[1], reverse=True)
    return {s: (p, _fair_odds(p)) for s, p in scores[:top]}


def price_all(m: MatchModel) -> dict:
    """Everything, keyed by market group."""
    return {
        "1X2": market_1x2(m),
        "Double Chance": market_double_chance(m),
        "BTTS": market_btts(m),
        "Totals": market_totals(m),
        "Team Totals": market_team_totals(m),
        "Asian Handicap": market_asian_handicap(m),
        "Correct Score (top 8)": market_correct_score(m),
    }
