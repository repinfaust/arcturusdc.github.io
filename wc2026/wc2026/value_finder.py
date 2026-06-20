"""
Value-finder: compare model fair prices to the odds you can actually get,
flag bets with positive EV, and size them with fractional Kelly.

Bias toward the edges the research identified:
  * 'small markets' (team totals, BTTS, totals) get a LOWER EV threshold to flag,
    because that's where books shade least and limits are low.
  * 'danger-zone' public favourites (offered ~1.34-1.50, i.e. -200/-299) get a
    warning tag so you fade rather than follow the crowd.

Input: a CSV of fixtures + ratings + the book odds you've seen.
Output: a ranked table of value bets.
"""

from __future__ import annotations
import pandas as pd
from engine import TeamRating, build_match
from markets import price_all
from devig import ev, kelly

# markets we treat as 'small/soft' -> flag at a lower edge threshold
SMALL_MARKET_GROUPS = {"Team Totals", "BTTS", "Totals", "Correct Score (top 8)"}


def load_ratings(path: str) -> dict[str, TeamRating]:
    df = pd.read_csv(path)
    out = {}
    for _, r in df.iterrows():
        out[r["team"]] = TeamRating(r["team"], float(r["atk"]), float(r["dfn"]))
    return out


def danger_zone(offered: float) -> bool:
    """Offered decimal odds 1.34-1.50 ~ American -200 to -299: the public chalk
    zone that historically returns ~-25% ROI. Tag it."""
    return 1.34 <= offered <= 1.50


def find_value(fixtures_csv: str, ratings_csv: str,
               edge_main: float = 0.03, edge_small: float = 0.015,
               bankroll: float = 100.0) -> pd.DataFrame:
    ratings = load_ratings(ratings_csv)
    fx = pd.read_csv(fixtures_csv)
    rows = []

    for _, f in fx.iterrows():
        h, a = f["home"], f["away"]
        if h not in ratings or a not in ratings:
            continue
        neutral = bool(f.get("neutral", True))
        m = build_match(ratings[h], ratings[a], neutral=neutral)
        priced = price_all(m)

        # the odds you actually saw, given as columns like odds__Over 2.5
        for col in f.index:
            if not str(col).startswith("odds__"):
                continue
            sel = str(col)[len("odds__"):]
            offered = f[col]
            if pd.isna(offered) or float(offered) <= 1.0:
                continue
            offered = float(offered)

            # locate this selection's model probability
            model_p = group = None
            for gname, gmkt in priced.items():
                if sel in gmkt:
                    model_p = gmkt[sel][0]
                    group = gname
                    break
            if model_p is None:
                continue

            e = ev(model_p, offered)
            if group in SMALL_MARKET_GROUPS:
                thresh = edge_small
            elif offered >= 6.0:
                # longshot main-market flags from coarse priors are usually noise:
                # require a big edge before trusting them (favourite-longshot trap)
                thresh = 0.10
            else:
                thresh = edge_main
            tag = ""
            if offered >= 6.0 and group not in SMALL_MARKET_GROUPS:
                tag = "LONGSHOT - low confidence, verify ratings"
            if danger_zone(offered) and group in ("1X2", "Asian Handicap"):
                tag = "DANGER-ZONE FAV (consider fade)"
            if e >= thresh:
                rows.append({
                    "match": f"{h} v {a}",
                    "group": group,
                    "selection": sel,
                    "model_prob": round(model_p, 4),
                    "fair_odds": round(1 / model_p, 3) if model_p > 0 else None,
                    "offered_odds": offered,
                    "edge_EV": round(e, 4),
                    "qtr_kelly_units": round(kelly(model_p, offered) * bankroll, 2),
                    "flag": tag,
                })

    df = pd.DataFrame(rows)
    if not df.empty:
        # low-confidence longshots sink to the bottom regardless of headline edge
        df["_longshot"] = df["flag"].str.startswith("LONGSHOT")
        df = (df.sort_values(["_longshot", "edge_EV"], ascending=[True, False])
                .drop(columns="_longshot").reset_index(drop=True))
    return df


if __name__ == "__main__":
    import sys
    fx = sys.argv[1] if len(sys.argv) > 1 else "data/fixtures_odds.csv"
    rt = sys.argv[2] if len(sys.argv) > 2 else "data/team_ratings.csv"
    res = find_value(fx, rt)
    if res.empty:
        print("No value bets cleared the threshold.")
    else:
        print(res.to_string(index=False))
