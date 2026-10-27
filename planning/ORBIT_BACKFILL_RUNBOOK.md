# Orbit evidence backfill and anchoring — runbook (David's Mac)

Records: D-SITE-057 (backfill), D-SITE-062 (A3 results checks), D-SITE-063 (anchoring),
Lab D-L049/D-L050 (sources). The paths are David's. The Repinfaust repo is **`~/dev/xyz`**.
`~` isn't expanded after `name=` in an argument, so every path below is written in full.

## 0. Once per checkout

```
cd /Users/davidloake/dev/repinfaust-lab && git pull origin claude/l4-web
cd /Users/davidloake/dev/xyz && git fetch --all
git -C /Users/davidloake/dev/arcturusdc.github.io-clean worktree add /Users/davidloake/dev/arcturus-orbit origin/main
cd /Users/davidloake/dev/arcturus-orbit && npm ci
gcloud auth application-default login
openssl ts -help >/dev/null 2>&1 && echo "openssl ts OK"
```

If the last line prints nothing, macOS's LibreSSL lacks `ts`. Then:

```
brew install openssl@3
export ORBIT_OPENSSL=/opt/homebrew/opt/openssl@3/bin/openssl
```

The backfill runs from a separate worktree (`arcturus-orbit`), because the `-clean` checkout's
`main` has diverged from GitHub (2026-10-27). To update it later, run
`cd /Users/davidloake/dev/arcturus-orbit && git fetch origin && git checkout --detach origin/main`.
xyz only needs the commits fetched: the A3 scorer is read from commit `4071677`, not from the
working tree (D-SITE-067).

## 1. Dry run (nothing written, nothing sent)

```
cd /Users/davidloake/dev/arcturus-orbit && node scripts/orbit/backfill-evidence.mjs \
  --sources /Users/davidloake/dev/repinfaust-lab/scripts/orbit/evidence-sources.json \
  --repo repinfaust-aid=/Users/davidloake/dev/xyz \
  --repo repinfaust-lab=/Users/davidloake/dev/repinfaust-lab
```

**Expect:**
- **`sources verified: 15 events, …`**
- **The A3 line:**
  - **If the results files are on the Mac** (`/Users/davidloake/dev/xyz/eval/results/`, holding
    `baseline-20260808T083911Z.json` and `rejudged-20260809T073724Z.json`): **78 checks passed, 0
    skipped**, and `A3 results (repinfaust-aid): present, recomputed and matched`.
  - **If not:** 56 passed, 22 skipped, and "A3 figures are transcribed, not checked".
  - **Any refusal** ("sources refused", "oq25_recompute refused", or "only one A3 results file")
    means stop and send me the output.
- `stored chain: 0 blocks, head none` and `to write: 15`.

## 2. Write, verify and anchor

Add `--write` to the same command.

**Expect:**
- `wrote block 1 …` through `wrote block 15 …`;
- `verify: OK — 15 blocks, head 15 <hash>`;
- `anchor: anchored — block 15 …`, followed by a time each from `digicert` and `sectigo`.

**This is the moment something leaves the Mac.** The imprint, a SHA-256 of
`{orgId, blockIndex, eventHash}` and nothing else, is posted to `http://timestamp.digicert.com` and
`http://timestamp.sectigo.com`. Both replies are verified with openssl against the Mac's System
Roots, and each token must name its vendor. If either fails, no anchor is stored: the chain stays
written and verified, and you retry with step 3.

## 3. Anchor or re-check on its own

```
cd /Users/davidloake/dev/arcturus-orbit && node scripts/orbit/anchor-head.mjs           # dry run: shows the imprint
cd /Users/davidloake/dev/arcturus-orbit && node scripts/orbit/anchor-head.mjs --send    # anchor the current head
cd /Users/davidloake/dev/arcturus-orbit && node scripts/orbit/anchor-head.mjs --check   # re-verify every stored token with openssl
```

## 4. Look

Open `https://www.arcturusdc.com/apps/stea/orbit/evidence` and press **Verify chain**.

**Expect:**
- "Chain verified against stored events: 15 blocks … Verified by Orbit, not independently; blocks
  1–15 match their DigiCert and Sectigo anchors".
- Block 15 carries an anchor box with two "download token" links and the `openssl ts -verify`
  command.

Send me a screenshot.

## Later appends (stage 2)

Run the same command as step 2 with `--append --expect-head <head hash from a dry run> --write`.
It writes only the new tail, then anchors the new head.
