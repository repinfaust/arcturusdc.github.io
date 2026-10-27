# Orbit: the evidence chain — plan

**Status:** a plan, waiting for David's approval. No code yet. Written 2026-10-27 against `ebe08f9`.
The D-SITE entries (D-SITE-046 onwards) are written with the code, after approval.

## 0. Two defects in the existing chain that change the plan

Neither is cosmetic. Item 2 asks for a hash chain that verifies, and as built it can't.

**F1. The chain doesn't chain.**
- `hashEvent` (`src/lib/orbit/signatures.js:127-135`) hashes `canonicalizeEvent(event)` plus the
  signature.
- `canonicalizeEvent` calls `cleanEventForSigning` (`:12-17`), which strips `previousEventHash` and
  `blockIndex` before hashing.
- So `eventHash` doesn't depend on its predecessor at all. Events can be reordered, dropped or
  re-linked, and every `eventHash` still verifies. It is a linked list with checksums, not a hash
  chain.

**F2. Nested values are not signed or hashed.**
- `canonicalizeEvent` (`:61-65`) uses `JSON.stringify(payload, Object.keys(payload).sort())`.
- A replacer array is applied at every depth. So a nested object keeps only the keys that also
  appear at the top level, which usually means it serialises as `{}`.
- So `metrics: {…}` could be changed after signing without breaking the signature or the hash.

**F3. The verify route checks what the caller sends, not what is stored.**
- `POST /api/orbit/verify` (`src/app/api/orbit/verify/route.js:23-34`) verifies an event object
  from the request body. Its own comment says "In production, you'd fetch from database".
- It never compares `previousEventHash` with the stored predecessor (`:112-113`).
- It skips the hash check entirely when `previousEventHash` is missing (`:105`), so block 1 is
  never hash-checked.
- `verifyEventSignature` uses `timingSafeEqual` (`signatures.js:86-96`), which throws on a length
  mismatch, so a malformed signature returns a 500 rather than "not verified".

**The fix: chain version 2, for new events only.** Existing POC events keep verifying exactly as
they do now.
- `chainVersion: 2` is a field on the event, inside both the signature and the hash.
- **The v2 canonical form** is a recursive sorted-key serialisation. Every value is covered, and
  only JSON primitives, arrays and plain objects are allowed. Anything else is refused, not
  skipped as `cleanEventForSigning` skips Timestamps (`:25-50`).
- **The v2 hash** is `sha256(canonical_v2(event minus eventHash))`. It includes
  `previousEventHash`, `blockIndex` and `signature`, so each event commits to its predecessor.
- Signing covers the payload. Hashing covers the payload, the signature and the link.
- **v1 stays untouched.** `canonicalizeEvent`, `hashEvent` and `signEvent` are unchanged. The v2
  functions sit beside them, and dispatch is on `chainVersion`, so no stored event changes meaning.

## 1. Event types and schema (`src/lib/orbit/eventTypes.js`)

**Today** (`eventTypes.js:5-61`):
- There are 8 consent-domain types.
- `validateEvent` checks presence only (`!event[field]`, `:55`). So a metric of `0` fails, and
  anything else passes untyped. Unknown fields are accepted.
- `generateEventId` uses `Math.random` (`:66-68`).

**Add a second family with a strict validator**, `validateEvidenceEvent`. The legacy types and
`validateEvent` are unchanged, so the POC is untouched.

**Types:** `CONTROL_TRIGGERED`, `CONTROL_OVERRIDDEN`, `ESCALATION_REQUESTED`,
`HUMAN_REVIEW_REQUESTED`, `EVALUATION_RUN`, `RUBRIC_VERSIONED`, `HUMAN_AUDIT_COMPLETED`,
`REGRESSION_DETECTED`, `CLAIM_WITHDRAWN`, `PREREGISTRATION_FROZEN`.

**No free text is enforced by type, not by convention.** Every string field has a pattern with no
whitespace and a length cap, so a sentence can't be put in any field. The fields:

| Field | Type / pattern | Notes |
|---|---|---|
| `eventType` | one of the 10 | |
| `orgId`, `eventId` | `^[a-z0-9][a-z0-9_-]{2,63}$` | `eventId` is deterministic in the backfill (§2) |
| `system` | identifier, `^[a-z0-9][a-z0-9._-]{0,63}$` | e.g. `repinfaust-aid` |
| `version` | identifier, same pattern | e.g. `lab-1.0` |
| `decisionId` | `^[A-Z][A-Z0-9-]{1,23}$` | `D-077`, `D-L031` |
| `relatedDecisionIds` | array of those, ≤ 16 | |
| `commit` | `^[0-9a-f]{7,40}$` | |
| `policyHash`, `promptHash`, `rubricHash`, `preregHash`, `artifactHash` | `^[0-9a-f]{12,64}$` | `rubric_sha` is 12 hex characters (xyz D-096) |
| `previousRubricHash` | same | used by `RUBRIC_VERSIONED` |
| `modelSnapshots` | array of `^[a-z0-9][a-z0-9.:-]{0,63}$`, ≤ 16 | |
| `metrics` | object: keys `^[a-z][a-z0-9_]{0,47}$`, values finite numbers, ≤ 64 keys | booleans go in as 0 or 1 |
| `controlId` | identifier | control events only |
| `supersedesEventId`, `withdrawsEventId`, `subjectEventId` | event id | links between events |
| `occurredAt` | `YYYY-MM-DD` or ISO-8601 UTC | when it happened, not when it was written |
| `backfilled` | boolean | |
| `chainVersion` | the literal `2` | |

**Required fields by type** (all types also need `eventType`, `orgId`, `eventId`, `system`,
`occurredAt` and `chainVersion`):

| Type | Also required |
|---|---|
| `EVALUATION_RUN` | `version`, `commit`, `modelSnapshots`, `metrics`, `decisionId` |
| `RUBRIC_VERSIONED` | `rubricHash`, `commit`, `decisionId` |
| `PREREGISTRATION_FROZEN` | `preregHash`, `commit`, `decisionId`, `metrics.prereg_version` |
| `HUMAN_AUDIT_COMPLETED` | `commit`, `decisionId`, `metrics` |
| `REGRESSION_DETECTED` | `decisionId`, `metrics`, `subjectEventId` |
| `CLAIM_WITHDRAWN` | `decisionId`, `commit`, plus `withdrawsEventId` or `subjectEventId` |
| the four control types | `version`, `controlId`, `policyHash` |

- Unknown fields are refused, `NaN` and `Infinity` are refused, and wrong types are refused.
- `generateEvidenceEventId` uses `crypto.randomUUID`.
- **Domain-neutral.** The validator knows no domain words. Names such as `sensitivity_58_bare_k`
  are only `metrics` keys, matched by pattern. Which keys a source uses is the backfill's business,
  not the schema's.

**Tests, failing first:**
- **Runner.** `jest.config.cjs:27-33` transforms TypeScript only, and has no `@/` mapper. So the
  ESM `.js` files under `src/lib/orbit` won't load in Jest without a new transform. I'd use
  `node --test` (Node 22.22, whose ESM syntax detection loads these files) through
  `npm run test:orbit`, with no new dependency. The alternative is a Babel transform for Jest. Say
  if you prefer that.
- **Schema tests** (`__tests__/orbit/eventTypes.test.mjs`): a valid example of each type passes.
  Each of these is refused: a missing field, an unknown field, a space in any string, an over-long
  value, a string metric, `NaN`, a `0` metric wrongly refused (the presence-check bug), and a
  nested object anywhere except `metrics`.
- **Chain tests** (`__tests__/orbit/chainV2.test.mjs`):
  - Changing a nested metric breaks the v2 signature. This is F2, shown failing against v1 first.
  - Reordering or relinking breaks v2 verification. This is F1, shown failing against v1 first.
  - Existing v1 fixtures still verify byte for byte.

## 2. The backfill (`scripts/orbit/backfill-evidence.mjs`)

**How it runs:**
- Locally, from your Mac, with the Admin SDK and admin credentials, the same pattern as the Lab's
  admin scripts. It never goes through `/api/orbit/events`.
- **Target:** the website's Firebase project `stea-775cd` (`.firebaserc`). That is not `repinfaust`
  and not `repinfaust-lab`. No Repinfaust production data is read; the sources are the two Git
  checkouts.
- **Dry run by default.** `--write` commits. It prints IDs, hashes and numbers only.

**Storage: a dedicated collection, not `orbit_ledger_events`.** I recommend this strongly, because
the existing collection is unsafe for evidence:
- **Anyone signed in can delete it.** `POST /api/orbit/reset` (`reset/route.js:33,61-63`) deletes
  every ledger event for any `userId` in the body, for any signed-in user. An evidence chain
  stored there would be one request away from deletion.
- **It's the wrong shape.** The chain there is per user and org (`db-admin.js:175-234`), and
  evidence has no user.
- **Side effects.** Consent updates and the policy engine run on every event there
  (`events/route.js:96-121`).

So:
- **Collection:** `orbit_evidence_events`. Its chain is per org.
- **Head document:** `orbit_evidence_heads/{orgId}`, holding `{blockIndex, eventHash}`. Every
  append runs in a Firestore transaction on it, so two appends can't fork the chain.
- **Rules:** both are added to `firestore.rules` as `allow read, write: if false`, matching
  `:521-556`.
- **The org:** `repinfaust-evidence`, written by the script to `orbit_orgs`. It gets a random
  signing secret and **no API key at all**, since nothing ingests into it yet.

**Sources.** Every hash is checked against the local checkout before anything is written. It
refuses on any mismatch, as `oq25_recompute.py` does (xyz D-096).

| # | Type | System | Decision | Commit | Key values |
|---|---|---|---|---|---|
| 1 | `PREREGISTRATION_FROZEN` | repinfaust-aid | D-036 | `c664397` | the headline pair, fixed before the baseline |
| 2 | `RUBRIC_VERSIONED` | repinfaust-aid | D-034 | `778550f` | rubric `84e80788c7ea` |
| 3 | `EVALUATION_RUN` | repinfaust-aid | D-058 | `589ba8e` | the A3 baseline (`baseline-20260808T083911Z.json` sha256); 58-turn sensitivity 20, 45, 32 of 58; 78-turn from D-096 |
| 4 | `CLAIM_WITHDRAWN` | repinfaust-aid | D-058 | `589ba8e` | withdraws the void directive figures (1/106; 100.0/100); subject is #3 |
| 5 | `RUBRIC_VERSIONED` | repinfaust-aid | D-075 | `2e088d8` | `8b0aafe284d0`, previous `84e80788c7ea` |
| 6 | `EVALUATION_RUN` | repinfaust-aid | D-076 | `2e088d8` | the re-judge (`rejudged-20260809T073724Z.json` sha256); 25, 51, 45 of 58; `verdicts_changed` 209 of 693; supersedes nothing, because D-076 keeps both |
| 7 | `CLAIM_WITHDRAWN` | repinfaust-aid | D-077 | `2e088d8` | filter-over-lexicon, behavioural; subject is #6 |
| 8 | `EVALUATION_RUN` | repinfaust-aid | D-096 | `e1e0800` | the OQ-25 recompute, with no paid calls; 58- and 78-turn figures on both scorecards |
| 9 | `CLAIM_WITHDRAWN` | repinfaust-aid | D-096 | `e1e0800` | the correction of D-077's "it was true on the old instrument"; subject is #7 |
| 10 | `PREREGISTRATION_FROZEN` | repinfaust-lab | D-L017 | `2435e1e` | v1 `adc5ed2b…55ed` |
| 11 | `PREREGISTRATION_FROZEN` | repinfaust-lab | D-L018 | `6bf8443` | v2 `03a35c69…77e9`, supersedes #10 |
| 12 | `PREREGISTRATION_FROZEN` | repinfaust-lab | D-L019 | `2c85b11` | v3 `4f3895ca…01bc`, supersedes #11 |
| 13 | `PREREGISTRATION_FROZEN` | repinfaust-lab | D-L022 | `13b7d70` | v4 `f3fc8e9b…e390`, supersedes #12 |
| 14 | `EVALUATION_RUN` | repinfaust-lab | D-L031 | `6881375` | stage 1 under v4: 693 of 693; threshold 5, 0 misses; check 6 passed (27, 51, 42 of 58; 24, 61, 57 of 106); outcome file sha256 at `5aff24e` |
| 15 | `HUMAN_AUDIT_COMPLETED` | repinfaust-lab | D-L031 | `c08bfe1` | 9 disagreements of 60, 6 allowed; `secondary_reliable` 0; locked at `319322f`; subject is #14 |

- All the hashes above were recomputed this session from Git. The four pre-registration hashes
  match their commit messages.
- **Before writing,** the script resolves every commit and file hash, and you review the dry-run
  table.
- **`occurredAt`** comes from each decision's own date line. Order is source order, not write time.
- **`eventId`** is `ev_` plus the first 24 hex characters of the sha256 of `system|decisionId|type|n`.
  So a re-run is idempotent: it refuses if the chain already holds the events, unless you pass
  `--append` with the current head hash.
- **`REGRESSION_DETECTED` is unused here.** Nothing in these sources is a regression, and I won't
  force one. It's defined for stage 2 and live use.

**Where the source list lives.** It names Repinfaust decision IDs, so I'd keep it in
`repinfaust-lab` (private) as `scripts/orbit/evidence-sources.json`. The website script takes
`--sources <path>`. The website repo then commits only generic code.
- **Check needed:** is `repinfaust/arcturusdc.github.io` public? Its GitHub Pages name suggests it
  might be. If so, this split also keeps D-L011 intact.

**Verification after writing,** in two forms:
- **The script** re-reads the whole chain from Firestore and verifies it with the same
  `verifyChain` that the route uses (below).
- **The route.** Then, from your signed-in browser, the timeline's "Verify chain" button calls
  `POST /api/orbit/verify`. That's the existing route, extended:
  - It gains a mode `{ orgId, chain: true }`. This mode **fetches the stored events
    server-side** and walks them: each signature, each v2 hash, each `previousEventHash` against
    the stored predecessor, `blockIndex` contiguity, and the head document.
  - Its current mode, which takes a client-supplied event, is kept unchanged for the POC.
  - The shared logic moves to `src/lib/orbit/verifyCore.js`, which also length-checks before
    `timingSafeEqual` (F3).

## 3. The timeline (`/apps/stea/orbit/evidence`)

- **A server component** reads `orbit_evidence_events` through the Admin SDK. There's no client
  Firestore access and no new public API. It's read-only, and has no form other than the verify
  button.
- **Auth is the existing middleware.** The path is added to `protectedPaths` at
  `middleware.js:36-69`, along with its `/stea/orbit/evidence` vanity form.
- **It should also be owner-only,** using the existing Repinfaust-route pattern at
  `middleware.js:96-105` (the `repinfaust@gmail.com` check), and the page re-checks it
  server-side.
  - The reason: `verifySession` (`auth.js:15-45`) accepts any signed-in user. "Behind the existing
    auth" alone means any Google account that signs in to STEa.
  - Under D-L011, that comes close to public for a page naming Repinfaust's evaluation trail.
  - Confirm this, or tell me a wider audience is fine.
- **It shows,** per block:
  - the index, `occurredAt`, type, system and version, and the decision ID;
  - the commit, and the hashes shortened to 12 characters (full on hover or copy);
  - the metrics as a small table;
  - the links (supersedes, withdraws, subject) as anchors to other blocks;
  - a per-block linked or broken mark after verification.
- **The verification result is scoped:** "Chain verified against stored events, 15 blocks,
  head `…`, <UTC time>". It is not a standing badge.
- **Versions.** The site is on Next 14.2.35 (`package.json:53`). I'll read that version's docs for
  server components and middleware before writing.

## 4. Security: Orbit org API keys

**Findings**, recorded in `planning/FINDINGS.md` and as a D-SITE entry:
- **K1. Keys are stored in plaintext.** `apiKey` is written as-is (`orgs/route.js:86`).
- **K2. The comparison isn't constant-time.** It's `org.apiKey !== apiKey` in three copies:
  `events/route.js:23`, `snapshots/route.js:23` and `verification/request/route.js:22`.
- **K3. Any signed-in user can read every org's key.** `GET /api/orbit/orgs` strips only
  `signingSecret` (`orgs/route.js:144,150`), and it's open to any signed-in user.
  `poc/page.js:1592` relies on this to send the key. This is worse than K1 and K2.
- **K4. The demo keys and signing secrets are hard-coded** (`orgs/route.js:19-36`). They're
  sandbox-only, but if the repo is public, they are public too.
- **K5.** `POST /api/orbit/orgs` returns the existing key on every update (`:72-73,102`).

**Fix:**
- **`src/lib/orbit/orgAuth.js`**: one `authenticateOrg`, replacing the three copies.
  - It stores `apiKeyHash = sha256(apiKey)` as hex, with `apiKeyHashVersion: 1`. The keys are 128
    random bits (`:44`), so a slow KDF adds nothing.
  - It compares `timingSafeEqual(sha256(presented), stored)`. Both are always 32 bytes, so there's
    no length leak and no throw.
- **Keys are shown only on creation,** and never stored or returned afterwards. Updates return
  `[REDACTED]`, and `GET` never returns `apiKey` or `apiKeyHash`.
- **Migration:** `scripts/orbit/hash-org-keys.mjs`, local, with Admin credentials, dry run first.
  It hashes every existing `apiKey`, then deletes the plaintext field. Until it runs, `orgAuth`
  accepts a plaintext record, compared in constant time on the hashes, so nothing breaks
  mid-deploy.
- **The POC page:** the four demo keys are already in source (K4). So the POC page uses that
  constant map, instead of reading keys back from `GET`. Real orgs get theirs once, on creation.
- **Not changed:** `signingSecret` stays recoverable, because HMAC needs it. Moving it to Secret
  Manager is a separate decision; I'll note it, not do it.
- **Tests:** a hash round trip, a wrong key refused, a legacy plaintext record accepted, and `GET`
  responses carrying no key field. These come under `test:orbit`, using the same injection seam as
  the Lab handlers.

## 5. Out of scope, and how stage 2 can emit events

Live ingestion from the Lab or Repinfaust, and any change to L3's frozen code, are out of scope.

**Proposal: post-run export from the committed outcome files.** There is no request-path change,
no network call from the Lab, and no server-to-server auth.
- **A Lab script,** `scripts/orbit/export-evidence.mjs`, reads only committed files:
  `eval/l3/results/stage2-outcome.json`, the verdict file D-L048 waits on
  (`stage2-verdict.json`), any stage-2 audit outcome, and `preregistration.json`'s sha256.
- **It writes** a local `evidence-sources` fragment, in the same format as §2, with IDs, hashes and
  numbers only:
  - an `EVALUATION_RUN` for stage 2;
  - a `HUMAN_AUDIT_COMPLETED` if an audit runs;
  - a `REGRESSION_DETECTED` if threshold 1 fails;
  - a `CLAIM_WITHDRAWN` against the D-L048 comparison claim if the comparison fails.
- **You then run** the website backfill with `--append --expect-head <hash>` from your Mac.
- **It runs after stage 2's outcome commit,** so it can't influence the run.
- **It lives under `scripts/`,** outside the stage-2 code guard's paths (D-L021, D-L028). Before
  writing it, I'd confirm that with the guard's listing.
- **Live ingestion later** (spec §4 L6, "controls emit → Orbit records") needs its own design and
  review: workload identity or signed requests, replay protection, and per-org rate limits. I've
  noted that and not started it.

## 6. Questions for you

1. **Storage:** a dedicated evidence collection and head document (recommended), or
   `orbit_ledger_events` as written?
2. **Timeline audience:** owner-only (recommended), or any signed-in STEa user?
3. **Is the website repo public?** I'd keep the source list in the private Lab repo either way.
4. **The direction note.** I couldn't find `arcturus-product-direction` in either repo or in Drive.
   The ten types are taken from your message. The Lab spec (`BUILD_SPEC_v1.1.md:379`) names
   `HUMAN_REVIEW_COMPLETED`, which isn't in your list. Should I add it, or does
   `HUMAN_AUDIT_COMPLETED` cover it?
5. **Test runner:** `node --test` (recommended, no new dependency), or a Jest transform?

## 7. Proposed D-SITE entries (written with the code)

| Entry | What |
|---|---|
| D-SITE-046 | Evidence event family, strict schema, no free text |
| D-SITE-047 | Chain v2: recursive canonical form and a linked hash (F1, F2), with v1 untouched |
| D-SITE-048 | The evidence collection, the per-org head transaction, and the reset exposure |
| D-SITE-049 | The backfill: local admin, source-verified, idempotent |
| D-SITE-050 | Verify route chain mode, and the server-side fetch (F3) |
| D-SITE-051 | The timeline route and its audience |
| D-SITE-052 | API keys hashed at rest with constant-time compare (K1-K5), plus a FINDINGS entry |
| D-SITE-053 | The stage-2 export proposal, recorded as a proposal |
