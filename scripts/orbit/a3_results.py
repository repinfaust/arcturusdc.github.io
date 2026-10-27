#!/usr/bin/env python3
"""A3 figures from the local results files, for the Orbit evidence backfill (D-SITE-062).

Reads xyz's eval/results/baseline-20260808T083911Z.json and rejudged-20260809T073724Z.json
(the pair D-096 names) and recomputes, with xyz's own oq25_recompute.py and score.py, so the
definitions cannot drift from the published scorer. Both scripts are taken from commit 4071677,
the one that published the D-096 figures, with `git show`, not from the working tree, so the
checked-out branch doesn't matter (D-SITE-067). Set A3_SCORER_REF to use another commit.
  - per arm, 58- and 78-turn sensitivity (k) and calm-turn fires (k, n);
  - rows and error rows in the pre-registered run;
  - verdicts changed by the re-judge, paired on (scenario_id, turn_idx, arm).
oq25_recompute's tie_files() and analyse() refuse a pair they can't tie to the published
scorecards; that refusal is passed through.

Prints one JSON object: {"present": false} when neither file is there, {"error": ...} on any
refusal (including only one file present), else the figures. No reply or message text.
No API calls.

Usage: python3 -I a3_results.py <path to the xyz checkout>
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

PREREG = "baseline-20260808T083911Z.json"
REJUDGED = "rejudged-20260809T073724Z.json"
SCORER_REF = os.environ.get("A3_SCORER_REF", "4071677")
SCORER_FILES = ("eval/scripts/oq25_recompute.py", "eval/scripts/score.py")


def out(obj):
    print(json.dumps(obj, sort_keys=True))
    sys.exit(0)


def main(xyz):
    results = xyz / "eval" / "results"
    pre_p, rej_p = results / PREREG, results / REJUDGED
    present = [pre_p.exists(), rej_p.exists()]
    if not any(present):
        out({"present": False})
    if not all(present):
        out({"error": f"only one A3 results file is present ({PREREG if present[0] else REJUDGED}); need both or neither"})

    scorer_dir = Path(tempfile.mkdtemp(prefix="orbit-a3-"))
    for f in SCORER_FILES:
        try:
            src = subprocess.run(["git", "-C", str(xyz), "show", f"{SCORER_REF}:{f}"],
                                 capture_output=True, check=True).stdout
        except subprocess.CalledProcessError:
            out({"error": f"{f} not found at commit {SCORER_REF} in {xyz}; fetch that commit (git -C {xyz} fetch --all)"})
        (scorer_dir / Path(f).name).write_bytes(src)
    sys.path.insert(0, str(scorer_dir))
    import oq25_recompute as q  # noqa: E402  xyz's own recompute and scorer, as of SCORER_REF

    pre = json.loads(pre_p.read_text())
    rej = json.loads(rej_p.read_text())
    try:
        tied = q.tie_files(pre, PREREG, rej)
        figures = {"prereg": q.analyse("prereg", pre), "rejudged": q.analyse("rejudged", rej)}
    except SystemExit as e:
        out({"error": f"oq25_recompute refused: {e.code}"})

    def per_arm(a):
        return {arm: {"k58": v["58"][0], "k78": v["78"][0], "fires_k": v["fires"][0], "fires_n": v["fires"][1]}
                for arm, v in a.items()}

    key = lambda r: (r.get("scenario_id"), r.get("turn_idx"), r.get("arm"))
    pre_rows = [r for r in pre["results"] if r]
    before = {key(r): r.get("judge_class") for r in pre_rows if "error" not in r}
    after = {key(r): r.get("judge_class") for r in rej["results"] if r}
    if any(None in k for k in list(before) + list(after)):
        out({"error": "a results row lacks scenario_id, turn_idx or arm; verdicts can't be paired"})
    missing = [k for k in after if k not in before]
    if missing:
        out({"error": f"{len(missing)} re-judged rows have no pre-registered row"})

    out({
        "present": True,
        "tied_by": tied,
        "scorer_ref": SCORER_REF,
        "prereg": {"arms": per_arm(figures["prereg"]), "rows": len(pre_rows),
                   "errors": sum(1 for r in pre_rows if "error" in r)},
        "rejudged": {"arms": per_arm(figures["rejudged"]), "rows": len(after),
                     "verdicts_changed": sum(1 for k, v in after.items() if before[k] != v)},
    })


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: a3_results.py <xyz checkout>")
    try:
        main(Path(sys.argv[1]).resolve())
    except SystemExit:
        raise
    except Exception as e:  # report the cause as JSON instead of a traceback; never row text
        out({"error": f"{type(e).__name__}: {e}"})
