# MLB Line-Movement Study — Collector Spec (market-microstructure research)

_Draft for approval, 2026-07-16. Companion to `MLB_TOTALS_MODEL_SPEC.md` (D-SITE-007),
which concluded: no exploitable edge in our data at any price point, but the
open→close move is real (57.7% follow-the-move @ opener, 2024 data) and is driven by
information arriving pre-game. This spec is the instrument to observe that process._

**This is a research instrument, NOT a betting model.** It makes no predictions,
logs no picks, and has no LLM anywhere. It collects the sequenced pre-game data that
cannot be bought historically: line snapshots + timestamped game events, so we can
later measure *what information moves the MLB total, by how much, and how fast*.

The user's framing (2026-07-16): like horse racing overnight odds vs SP — the going
and declarations move the price; we want to watch that happen with timestamps.
Pre-game is the one moment all data is free and live; historically it is unbuyable.

---

## 1. Questions the data will answer (after ~8+ weeks)

1. **Anatomy of the move** — what fraction of total-line moves ≥0.5 are preceded
   (within measurable granularity) by an observable event: lineup posted, starting
   pitcher scratched/changed, postponement/venue/time change — vs unexplained
   (sharp money / information we don't capture)?
2. **Reaction latency** — when a lineup posts or a pitcher scratches, how many
   minutes until the line moves?
3. **The 45.6% question** — do moves systematically run against stale public
   season-rates (the market fading naive models), confirming D-SITE-007's finding?
4. (Byproduct) A true **opener + close archive** for every 2026 game — the dataset
   we had to buy a 2024 sample of, growing daily, free.

Explicitly out of scope: predictions, picks, EV/edge claims, betting automation.

---

## 2. Data sources (all real, all free-tier, no LLM)

| What | Source | Cost |
|---|---|---|
| Totals lines (all games, one call) | The Odds API `/v4/sports/baseball_mlb/odds?markets=totals&regions=us&oddsFormat=decimal` | **1 credit per pass** (regions×markets), 500/month free tier, shared with WC26 key (`WC26_ODDS_API_KEY`; WC26 ends with the final — budget frees up) |
| Schedule, probable pitchers, game status, first-pitch times | MLB Stats API `/api/v1/schedule?sportId=1&hydrate=probablePitcher,team` | Free, unlimited, no key |
| Posted lineups | MLB Stats API `/api/v1/schedule?...&hydrate=lineups` (batting orders appear once posted, ~2–4h pre-game) | Free |
| Weather at venue | **Phase 2, default OFF** (respects the standing weather-out decision; flag-gated if ever enabled for attribution only) | — |

Key facts that shape the design:
- One Odds API request returns **every** upcoming MLB event that has a line —
  including tomorrow's games once their openers post. So every pass costs 1 credit
  regardless of slate size, and "first time we see a game" = its opener (bounded by
  pass cadence).
- MLB Stats API is free, so event detection can poll far more often than odds.
  **Attribution granularity is therefore limited by the odds cadence, not events**
  — mitigated by burst snapshots (§4).

---

## 3. Snapshot schedule (all times **America/New_York**, cron tz-pinned — DST-safe)

MLB slate reality: day games start ~13:05 ET; night games ~18:40–19:10 ET; west
coast ~21:40–22:15 ET. Lineups post ~2–4h before first pitch. Openers for tomorrow
post the previous evening.

**7 fixed odds passes/day** (1 credit each):

| # | ET time | Purpose |
|---|---|---|
| 1 | 09:00 | Morning baseline for today; catches overnight moves; openers for any newly posted games |
| 2 | 12:30 | T-35m for day games (their close); T-6h for night slate |
| 3 | 15:00 | T-4h night games — pre-lineup baseline |
| 4 | 17:00 | T-2h night games — lineups mostly posted; the key attribution window |
| 5 | 18:15 | T-25m for 18:40 starts — night-game close |
| 6 | 21:30 | T-30m for west-coast starts — their close |
| 7 | 23:00 | Tomorrow's openers as they post; late west-coast pre-close |

Cron expressions (Firebase Scheduled Functions v2, `timeZone: 'America/New_York'`,
single shared impl exported under three schedules):
- `0 9,15,17,23 * * *`
- `30 12,21 * * *`
- `15 18 * * *`

**Free-call guard:** every pass first hits the free MLB schedule endpoint; if no
games are scheduled today/tomorrow (off-day, All-Star break, off-season), it exits
**without spending the odds credit**.

**Event polling** (free): every 30 min, 09:00–22:30 ET (`*/30 9-22 * * *`, NY tz).
Detects: lineup first-appears (posting time bounded to 30 min), probable-pitcher
changes/scratches, status changes (postponed/delayed), first-pitch time changes.

**Burst snapshots** (the attribution sharpener): when the event poller detects a
*material* event — lineup posted or pitcher change — it may trigger an immediate
extra odds pass, **hard-capped at 3/day** via a counter in `mlb_meta/collector`.
This brackets the line right after news, instead of waiting up to the next cron.

**Budget math:** 7 cron + ≤3 burst = ≤10 credits/day ⇒ ≤310/month worst case;
realistic ~250 (bursts won't fire daily, off-days skip). Guard: if the API's
`x-requests-remaining` header < 50, skip non-close passes (#1, #3, #7 first) and
log a `budget_throttle` event. Never exceed the free tier.

---

## 4. Firebase architecture (mirrors WC26: Functions write, clients read-only)

Project `stea-775cd`, tenant `FqhckqMaorJMAQ6B29mP`, region `us-central1`,
code in `functions/mlb/` (CJS, same layout as `functions/wc26/`).

| Function | Trigger | Does |
|---|---|---|
| `mlbSnapshotLines` (3 exports, 1 impl) | crons above | free schedule check → 1 odds call → write one snapshot doc per game (consensus median + per-book map) → update game doc's opener/latest |
| `mlbPollGameData` | `*/30 9-22 * * *` NY | schedule+lineups poll → diff vs stored state → write `mlb_game_events` → maybe trigger burst (cap check) |
| `mlbFinalizeDay` | `30 3 * * *` NY | pull yesterday's finals (covers late west-coast) → write `finalTotal`, mark games final, compute per-game move summary (opener→close delta, event count), reset burst counter |

No callable/user-triggered functions in v1. No UI in v1 — data collection first;
an admin read view can come later under `/apps/stea/` if wanted.

### Firestore collections (all docs carry `tenantId`; rules: client read-only)

**`mlb_games/{gamePk}`**
```
date, home, away, venue, scheduledFirstPitch, actualFirstPitch|null,
probablePitchers: { home:{id,name}, away:{id,name} },   // latest
status, finalTotal|null,
opener: { line, overDec, underDec, capturedAt },         // first snapshot seen
close:  { line, overDec, underDec, capturedAt },         // last pre-first-pitch
moveSummary|null: { delta, nSnapshots, nEvents, largestStep }   // by finalizer
```

**`mlb_line_snapshots/{gamePk}_{epochMin}`**
```
gamePk, capturedAt, minutesToFirstPitch,
consensus: { line, overDec, underDec },                  // median across books
books: { fanduel:{line,over,under}, draftkings:{...}, ... },
trigger: 'cron' | 'burst:lineup_posted' | 'burst:pitcher_change',
requestsRemaining                                        // from API header
```

**`mlb_game_events/{autoId}`**
```
gamePk, type: 'lineup_posted'|'pitcher_change'|'postponed'|'time_change',
detectedAt, granularityMin: 30,
payload: { team, lineup:[names] } | { role, old:{id,name}, new:{id,name} } | {...}
```

**`mlb_meta/collector`** — daily counters (odds calls, bursts used), last-run
status per function, `requestsRemaining`, throttle state. The observability doc.

Volume: ~15 games/day × 7 snapshots + polls ⇒ ~150–250 writes/day. Firestore cost
negligible. Function invocations ~40/day — negligible.

### Failure policy (WC26 fail-closed rules)
- Odds call fails → log to meta, **no retry storm** (single retry max), skip pass.
- Schema surprise (missing totals market, absurd line <4 or >18) → reject the row,
  count it in meta, never write a guessed value. **No fabricated data, ever.**
- MLB API down → poller exits, logs; next cron self-heals. No state assumptions.

---

## 5. Analysis plan (run after ≥8 weeks of data; pure read-side, offline scripts)

1. Move attribution table: for every |Δline| ≥ 0.5 between consecutive snapshots,
   was there an `mlb_game_events` row in the preceding window? Output: % attributed
   by event type vs unexplained, with granularity bounds stated.
2. Latency histogram: event → first snapshot showing a moved line.
3. Naive-model fade test: recompute the walk-forward team-rate total (rig already
   built) per game; correlate sign(model−opener) with sign(close−opener) on 2026
   forward data — the honest re-run of the 45.6% finding.
4. Publish findings into `planning/MLB_LINE_STUDY_FINDINGS.md`. If (and only if)
   an attributed, latency-bounded window looks systematically exploitable, THAT
   becomes a new decision gate — with the D-SITE-007 bar: >52.4% walk-forward, no
   leakage, forward-verified.

Season context: collection starting mid-July 2026 captures ~2.5 months of regular
season (~1,000 games) + postseason this year; a full season from 2027-04.

---

## 6. Build estimate & sequencing

1. `functions/mlb/` collector impl + schedules + rules for the four collections — ~½ day.
2. Deploy, then a 3-day soak: verify snapshot cadence, burst cap, budget guard,
   off-day skip, doubleheader handling (two gamePks same matchup) against
   `mlb_meta/collector`.
3. DECISIONS.md entry (D-SITE-008) lands in the same commit as the code.
4. Analysis scripts at the 8-week mark — separate approval.

Open items for approval:
- **Region set:** `us` books only (FanDuel/DraftKings/etc., 1 credit) — or add a
  second region later (+1 credit/pass). v1 = `us` only.
- **Weather capture:** stays OFF per standing decision; revisit only as an
  attribution input if unexplained-move fraction turns out high.
- Confirm the shared Odds API key/budget with WC26 until the tournament ends
  (throttle guard already reserves 50 credits).
