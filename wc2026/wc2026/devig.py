"""
De-vigging and EV utilities.

The book's quoted odds include a margin (the 'vig'/'overround'). To compare your
model against the market's TRUE opinion, strip the vig first. We give two methods:
- multiplicative (proportional): simplest, the default.
- Shin: accounts for informed money, usually fairer on long-odds favourites.

Then EV is computed against the OFFERED odds (with vig) — that's what you'd be paid.
"""

from __future__ import annotations
import math


def implied(odds: float) -> float:
    return 1.0 / odds


def devig_multiplicative(odds_list: list[float]) -> list[float]:
    raw = [implied(o) for o in odds_list]
    s = sum(raw)
    return [r / s for r in raw]


def devig_shin(odds_list: list[float], iters: int = 100) -> list[float]:
    """Shin (1992) de-vig. Solves for z (insider-trading proportion) so the
    fair probabilities sum to 1. Better than proportional on lopsided two-ways."""
    raw = [implied(o) for o in odds_list]
    booksum = sum(raw)
    z = 0.0
    for _ in range(iters):
        denom = sum(math.sqrt(z * z + 4 * (1 - z) * (r ** 2) / booksum) for r in raw)
        z_new = (denom - 2) / (sum(raw) - 2) if (sum(raw) - 2) != 0 else 0.0
        if abs(z_new - z) < 1e-10:
            break
        z = max(0.0, min(z_new, 0.5))
    fair = [(math.sqrt(z * z + 4 * (1 - z) * (r ** 2) / booksum) - z) / (2 * (1 - z))
            for r in raw]
    s = sum(fair)
    return [f / s for f in fair]


def ev(model_p: float, offered_odds: float) -> float:
    """Expected value per 1 unit staked, at the odds you can actually bet."""
    return model_p * (offered_odds - 1) - (1 - model_p)


def kelly(model_p: float, offered_odds: float, fraction: float = 0.25) -> float:
    """Fractional Kelly stake (as a fraction of bankroll). Defaults to 1/4 Kelly
    — full Kelly is too aggressive for a model you don't fully trust. Returns 0
    if there's no edge."""
    b = offered_odds - 1
    edge = model_p * b - (1 - model_p)
    if edge <= 0 or b <= 0:
        return 0.0
    f_star = edge / b
    return round(max(0.0, f_star * fraction), 4)
