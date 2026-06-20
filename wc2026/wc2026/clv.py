"""
Closing-Line Value tracker — the ONLY honest scorecard over a 48-game sample.

You log every bet at the odds you took. When the market closes, you add the
closing odds. CLV% > 0 over many bets means you are beating the market, which is
the real signal of an edge — independent of whether the bets won or lost.

A model that consistently beats the close is good even on a losing run; one that
doesn't is just gambling, no matter how many bets land.
"""

from __future__ import annotations
import pandas as pd

COLUMNS = ["date", "match", "market", "selection",
           "odds_taken", "stake_units", "closing_odds", "result"]


def new_log(path: str):
    pd.DataFrame(columns=COLUMNS).to_csv(path, index=False)
    return path


def clv_pct(odds_taken: float, closing_odds: float) -> float:
    """Beating the close: positive when you got better odds than it closed at.
    Uses no-vig-free raw comparison of implied probabilities."""
    p_taken = 1 / odds_taken
    p_close = 1 / closing_odds
    return round((p_close - p_taken) / p_taken * 100, 2)


def summarise(path: str) -> dict:
    df = pd.read_csv(path)
    if df.empty:
        return {"bets": 0}
    df = df.dropna(subset=["odds_taken", "closing_odds"])
    df["clv_pct"] = df.apply(
        lambda r: clv_pct(r["odds_taken"], r["closing_odds"]), axis=1)

    out = {
        "bets": int(len(df)),
        "avg_clv_pct": round(df["clv_pct"].mean(), 2),
        "pct_beating_close": round((df["clv_pct"] > 0).mean() * 100, 1),
    }
    if "result" in df and df["result"].notna().any():
        graded = df.dropna(subset=["result"]).copy()
        # result: 1=win, 0=loss, 0.5=push/half
        graded["pnl"] = graded.apply(
            lambda r: r["stake_units"] * (r["odds_taken"] - 1) * r["result"]
            - r["stake_units"] * (1 - r["result"]) if r["result"] not in (0.5,)
            else 0.0, axis=1)
        out["units_staked"] = round(graded["stake_units"].sum(), 2)
        out["pnl_units"] = round(graded["pnl"].sum(), 2)
        out["roi_pct"] = round(
            graded["pnl"].sum() / graded["stake_units"].sum() * 100, 2) \
            if graded["stake_units"].sum() else 0.0
    return out


if __name__ == "__main__":
    import sys
    print(summarise(sys.argv[1] if len(sys.argv) > 1 else "data/clv_log.csv"))
