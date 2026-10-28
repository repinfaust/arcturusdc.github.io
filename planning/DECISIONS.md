# Decisions

## 2026-10-28 — Mandrake policy covers the approved iOS beta (D-SITE-072)

David approved the Mandrake iOS review/compliance plan (app D-M054). Updated the existing
public policy from its app source: Apple/Google purchase processing, separate platform unlocks,
local reminders, iOS backups and Keychain identity persistence. The policy continues to disclose
the unresolved explicit-consent gap (OQ-M6); no data-path or legal-basis redesign. Effective
28 October 2026. Android behaviour and the site's architecture/access controls are unchanged.

## 2026-10-27 — Backfill check `json-equals`, for flags derived from a committed string (D-SITE-071)

Lab D-L051's stage-2 export records the verdict as numeric flags (`verdict_pass`, `no_verdict`).
`json-equals` checks such a flag against the committed file: the field must be 1 if the value at
the pointer equals `equals`, and 0 otherwise. A missing pointer refuses the run.

**Rehearsed with D-L051's synthetic STOP verdict:** 19 events and 91 checks passed. `--append` on an
in-memory copy of the live chain wrote the 4 new events, verified 19 blocks and anchored the new
head. **Test** in `backfill.test.mjs`. `npm run test:orbit`: 163 pass, 2 todo.

## 2026-10-27 — The evidence head is anchored by DigiCert and Sectigo (D-SITE-070)

**Run by David** on his Mac (`anchor-head.mjs --send`, at `8dfbc8d`), 2026-10-27.

**`anchor: anchored`:**
- **Block 15:** `4331a24076def4d9d9b2b553b9ad63ac1875cf395477b7de2632e1c31b47b8bf`.
- **Imprint:** `bb22969547c50a2f40502ef35f6bd44db4581b80604a0664202e35b2744e21ba`.
- **DigiCert:** time-stamped `2026-10-27T20:28:40Z`.
- **Sectigo:** time-stamped `2026-10-27T20:28:41Z`, through the D-SITE-069 fallback.
- Both replies were verified with openssl against the Mac's System Roots, with the vendor named in
  the token and the times within 10 minutes, before the record was stored.

**What this establishes, scoped:** the evidence chain's blocks 1–15, as they stand at head
`4331a240…`, existed by 20:28:41 UTC on 2026-10-27, per two independent time-stamp authorities. That
holds for this evidence ledger (`repinfaust-evidence` on stea-775cd), not for Orbit's POC ledger or
for the product in general. Anyone can check it with `openssl ts -verify -digest <imprint>` on the
downloadable tokens.

**What doesn't change:**
- **The public Orbit pages keep "verified by Orbit, not independently"** (D-SITE-055). Those
  statements are about Orbit as a product, and the POC's v1 chain is still unanchored.
- **The claims guard still forbids** unscoped "independently verified" wording.
- **The evidence timeline is the one place that states the anchor,** scoped to the blocks it covers.

**`anchor-head.mjs --check`** (David's Mac, 2026-10-27): `block 15 digicert: token OK`,
`block 15 sectigo: token OK`, `block 15: matches the stored chain`, `check: OK — 1 anchors`. Both
stored tokens re-verified from scratch with openssl, from the imprint alone.

**The timeline, seen** (David's screenshot, 2026-10-27): block 15 (`HUMAN_AUDIT_COMPLETED`,
D-L031) shows ✓ signature, ✓ hash and ✓ link. It carries the "Anchored here" box with imprint
`bb229695…e21ba`, DigiCert 20:28:40 UTC and Sectigo 20:28:41 UTC, each with a token download, and the
`openssl ts -verify -digest …` command. **The Orbit evidence chain is complete:** 15 blocks written,
verified by Orbit, and anchored independently at block 15.

## 2026-10-27 — Sectigo anchor: macOS's self-signed R46 broke openssl's ESS check; retry with it set aside (D-SITE-069)

**David's retry** (`anchor-head.mjs --send`, at `d112aa6`) refused Sectigo again, this time with the
real error: `ESS routines:find:ess cert id not found`.
- The token carried its full chain: Signer R37, CA R41, and **Root R46 cross-signed by USERTrust
  RSA**.
- DigiCert passed. Nothing was stored.

**Diagnosis:**
- **A real Sectigo reply,** requested here for a random throwaway digest (no Orbit data), was
  inspected. Its ESS `signingCertificate` attribute lists **three** certificate ids: the signer, CA
  R41 and the cross-signed R46. Newer openssl therefore checks every certificate in the chain it
  builds against that list.
- **macOS trusts a self-signed "Sectigo Public Time Stamping Root R46"** as well. So openssl ends the
  chain at that root, which isn't in the token's list, and fails.
- **Linux trusts only USERTrust,** so the chain runs through the token's cross-signed R46 and passes.
- **Reproduced here:** the Linux roots plus the self-signed R46 (sha256 `4941B001…C046A5`, from
  `http://crt.sectigo.com`) gave the identical error.
- DigiCert's ESS lists only its signer, so it never hit this.

**Fix (`scripts/orbit/anchor.mjs`):**
- When, and only when, openssl reports `ess cert id not found`, verification retries once with the
  machine's roots **minus any self-signed root whose subject matches a certificate the token
  carries** (`rootsWithoutShadowed`). openssl then takes the chain the token names, up to a root the
  machine trusts.
- **Removing roots can only narrow trust.** With R46 as the only root, the retry fails.
- The path taken is recorded per token as `chain`: "machine roots" or "token-named chain (shadowing
  self-signed root set aside)".
- Re-verifying stored tokens (`--check`) uses the same logic.

**Tests:**
- `rootsWithoutShadowed`, for both what it drops and what it keeps.
- **A real Sectigo token is committed as a fixture** (`__tests__/orbit/fixtures/sectigo/`: the query,
  the reply, the USERTrust root and the self-signed R46; all public, and the digest is random):
  - with macOS-like roots it verifies through the fallback;
  - with USERTrust alone it verifies plainly;
  - with R46 alone it fails.
- `npm run test:orbit`: 162 pass, 2 todo.

## 2026-10-27 — Evidence chain written and verified on stea-775cd; the Sectigo anchor failed closed (D-SITE-068)

**Backfill run by David** on his Mac (`/Users/davidloake/dev/arcturus-orbit` at `0325748`), 2026-10-27.

**Dry run:**
- **78 checks passed, 0 skipped.** The real A3 results files were present, and the A3 figures were
  recomputed with xyz's scorer at `4071677`. They matched every transcribed number, tied by
  `run_identity + rejudged_from`.
- The 15 event ids were identical to the cloud session's offline run.

**`--write`:**
- The org `repinfaust-evidence` was created, with a random signing secret and no API key.
- Blocks 1–15 were written, and the chain was re-read and verified: **`verify: OK — 15 blocks, head 15
  4331a24076def4d9d9b2b553b9ad63ac1875cf395477b7de2632e1c31b47b8bf`**.

**The anchor failed closed:**
- **DigiCert** passed every check.
- **Sectigo** failed `openssl ts -verify`, so **nothing was stored**, by design.
- The error was unusable: only openssl's first stderr line ("Using configuration from …") was kept.

**Fix (`scripts/orbit/anchor.mjs`):**
- A verification failure now reports openssl's actual error lines, without the config preamble, and
  the subject and issuer of every certificate inside the token, so a missing intermediate is
  visible.
- `ORBIT_TSA_UNTRUSTED` can name a PEM file of extra intermediates, passed as `-untrusted`. That's
  for a TSA whose token lacks part of its chain. Trust still comes only from the machine's roots.

**Test:** on a chain failure, the real error and the token's certificates are reported.
`npm run test:orbit`: 159 pass, 2 todo.

**Next:** David reruns `anchor-head.mjs --send` to see Sectigo's real error. Until an anchor is stored,
the whole chain reads "verified by Orbit, not independently".

## 2026-10-27 — Backfill's A3 check loads xyz's scorer from the pinned commit, and reports the cause once (D-SITE-067)

**What happened:** David's first dry run, on his Mac at `/Users/davidloake/dev/xyz`, refused with 22
copies of `a3_results.py failed: Command failed: python3 -I …` and no cause. It failed closed, so
nothing was written or sent.

**Likely cause:** `a3_results.py` imported `oq25_recompute.py` from xyz's **working tree**. That
script exists only on the branch that added it, and David's checkout was on another branch (its
`git pull` said "Already up to date").

**Fix:**
- **The scorer is pinned to a commit.** `oq25_recompute.py` and `score.py` are now read with
  `git show 4071677:<path>`, the commit that published the D-096 figures. The checked-out branch no
  longer matters, and the figures are recomputed with exactly the published scorer. `A3_SCORER_REF`
  overrides it.
- **The commit is checked.** If it's missing, the helper says so and how to fetch it.
- **Any other exception** comes back as `{"error": "<Type>: <message>"}`, never a traceback or row
  text.
- **The CLI** reports the helper's last stderr line instead of "Command failed".
- **`backfillCore` de-duplicates errors,** so one cause prints once.

**Checked here:**
- Synthetic results files placed briefly in the real xyz `eval/results/` (gitignored), with the
  scorer at `4071677`: the figures came out as built.
- A bad ref gave the clear "not found at commit" error.
- The full offline backfill refused with exactly 3 named mismatches. That's correct: synthetic
  files don't have 693 rows.
- The files were removed afterwards, and xyz is clean.

`npm run test:orbit`: 158 pass, 2 todo.

## 2026-10-27 — CSP enforced (D-SITE-066)

David finished the signed-in pass through the STEa apps (D-SITE-065) and reported it done, with no
further violations after `cdn.tldraw.com` was added. So `src/middleware.js` now sends the policy as
`Content-Security-Policy` instead of `-Report-Only`. The policy text is unchanged.

**If something breaks,** the browser console will say "Content-Security-Policy … blocked". Then
either add the host to the policy, or, for an immediate rollback, change the header name back to
`-Report-Only`.

## 2026-10-27 — CSP pass, first results: `cdn.tldraw.com` allowed (D-SITE-065)

David's signed-in pass on 2026-10-27 (screenshots: `/apps/stea` and `/apps/stea/harls`, Firefox).

**Signed-in access works.** The STEa home and Harls loaded normally behind the new server gates
(D-SITE-064).

**Report-only violations:** only from tldraw (Harls' whiteboard). It loads fonts and
`translations/en.json` from `https://cdn.tldraw.com/2.4.6/…`, so that host is added to `font-src`
and `connect-src`. The STEa home page had none.

**Ignored:** the other console lines come from Firefox itself (`about:newtab`, `mozgcp.net`,
`getElementById` warnings on the new-tab page), not from this site.

**Not caused by D-SITE-064:** `[Harls] Project setup failed: FirebaseError: Missing or insufficient
permissions` for tenant `zsQe61eMHgrTdjjGjNCK`, followed by success for `FqhckqMaorJMAQ6B29mP`.
- `harls/page.js:1180-1191` runs project setup for whichever workspace is current. It first ran
  under the Dialled MTB workspace shown in the switcher, where the Firestore rules refuse it, then
  re-ran when the workspace changed.
- Neither the Harls code nor the deployed Firestore rules changed today. The gates are server-side
  and pass before the page runs.
- It's a pre-existing workspace race in Harls. It's noted here, not fixed.

**Still to do:** the remaining apps in the pass. The CSP is enforced only once those show no
violations.

## 2026-10-27 — Page gates move to server layouts, plus an edge cookie check; `src/middleware.js` for host and headers (D-SITE-064)

David chose option (c) plus (a) from D-SITE-061.

**(c) Server layouts are the real gate.**
- `src/lib/protectedRoutes.js` lists every route the old root `middleware.js` protected, 17 bases.
  `/apps/stea/toume` is left out because it has no route; `/stea/toume` already 404s.
- Each base folder has a server `layout.js` that calls `enforceGate(base)` (`src/lib/serverGate.js`,
  which runs in Node). It verifies `__session` with revocation, as the old middleware meant to:
  - signed out goes to `/apps/stea?next=<base>`;
  - for `/apps/stea/repinfaust`, anything but the verified `repinfaust@gmail.com` goes to
    `?denied=repinfaust`;
  - for `/apps/stea/orbit/evidence`, anyone but the owner gets a 404.
- **The Career and Squared layouts** keep their shells; the gate runs first.
- `/stea/...` vanity paths are rewrites, so they're covered.
- **Missing Admin credentials** count as signed out, so the gate fails closed.

**(a) Edge middleware.** The new `src/middleware.js` imports no Admin SDK. It does three things:
1. **Canonical host:** `arcturusdc.com` redirects to `https://www.arcturusdc.com` with a 308. Vercel
   serves the apex with a 200 today.
2. **Cookie check:** a gated path (either spelling) with no `__session` cookie redirects to sign-in
   with a 307 before anything renders. It doesn't verify the cookie; the layout does.
3. **Headers:** `Permissions-Policy`, and the CSP **as `Content-Security-Policy-Report-Only`**.

The root `middleware.js` is deleted.

**Why the CSP is report-only (a deviation from "CSP", flagged to David):**
- The old policy was never live, and it would have blocked Google Fonts (82 references) and Dialled
  MTB's Cloud Functions (`*.cloudfunctions.net`).
- The new policy adds those, plus `www.gstatic.com`, `*.firebaseapp.com` frames and Google
  Analytics.
- It becomes enforced once a signed-in pass through the apps shows no "[Report Only]" violations
  in the console. That's a one-word header change.
- `X-Frame-Options` stays `SAMEORIGIN`, from `next.config.js`. The old `DENY` isn't added, because
  setting both would conflict.

**Local check** (production build, `next start`, 2026-10-27):
- **Signed out,** all 34 spellings of the gated routes (`/apps/stea/…` and `/stea/…`, including
  nested pages) get a **307 to sign-in**. `/apps/stea/dialledmtb-riders` gets its existing 308 to
  `dialled-mtb/riders` first.
- **The public pages** (`/`, `/apps/stea`, `/apps/stea/orbit`, `explore`, `sidestand`) still return
  200.
- **With a forged cookie,** the layout stops the request:
  - `admin` gets a 307 and `orbit/evidence` a 404;
  - `wc26` and `repinfaust` return 200 with the redirect inside the stream. The page's
    `<title>` and a reference to its JS bundle are sent, but **not the page component**. The bundle
    itself is public under `/_next/static` anyway. That is the residual.
- **Without the edge check,** some routes gave that in-stream 200 even with no cookie. This is why
  (a) matters.
- **The built middleware manifest is no longer empty** (`"middleware": {"/": …}`).

**Tests:** `__tests__/orbit/gates.test.mjs`, written first:
- every old protected path is covered, or has no route;
- every listed folder has a server layout that calls its gate and is dynamic;
- the decisions for signed out, other users and the owner;
- the root file is gone, and the new middleware is edge-safe and checks the cookie on every gated
  route.

`npm run test:orbit`: 158 pass, 2 todo. `next build` passes.

**After deploy: the live check on www.arcturusdc.com, signed out, 2026-10-27, at `5b2b02b`.** The
deploy went live about 105 s after the push.
- **All 46 gated spellings** return a **307 to `/apps/stea?next=<base>`**. That's 23 paths, each as
  `/apps/stea/…` and `/stea/…`, nested pages included: Career and Squared subpages, Dialled MTB
  riders and promo, Hans/Toume, the Orbit POC, AI Act and evidence pages, and Repinfaust.
  `/apps/stea/dialledmtb-riders` keeps its 308 to `dialled-mtb/riders`.
- **The public pages** (`/`, `/apps/stea`, `/apps/stea/orbit`, `overview`, `explore`) return 200.
- **The apex** `https://arcturusdc.com/apps/stea` gets a 308 to `https://www.arcturusdc.com/apps/stea`.
- **The headers:** `content-security-policy-report-only` and `permissions-policy` are present, and
  `x-frame-options` is still `SAMEORIGIN`.
- **`/apps/stea/toume` returns 200, but it isn't a page.** Every unknown path does the same, as a
  soft 404 with the default title: `/apps/stea/this-does-not-exist` also returns 200. Nothing sits
  behind it to gate. The soft-404 behaviour is pre-existing and not changed here.

**Still owed:**
- a signed-in pass through the apps, checking the console for CSP "[Report Only]" violations
  before the CSP is enforced;
- David's check that signed-in access to his apps is unchanged.

## 2026-10-27 — RFC 3161 anchoring of the evidence head: DigiCert and Sectigo, after every append batch (D-SITE-063)

David chose this from D-SITE-060: RFC 3161, from DigiCert and Sectigo, anchoring the head after every
append batch, starting with the backfill. Nothing is sent until he runs it.

**What is anchored:**
- **The imprint** is `sha256(canonicalV2({orgId, blockIndex, eventHash}))` for the head. Nothing
  else leaves the Mac.
- **It's sent to both TSAs:** `http://timestamp.digicert.com` and `http://timestamp.sectigo.com`.
  They're plain HTTP, which is safe because the tokens are signed and verified.
- **Each reply must, before anything is stored:**
  - pass `openssl ts -verify` against the query, meaning the same imprint and nonce;
  - verify against the machine's trusted roots (macOS System Roots, exported for each run);
  - be "Granted";
  - carry a time within 10 minutes of the local clock;
  - contain a certificate whose subject names the expected vendor.
- **Both must pass,** or nothing is stored.
- **Storage:** one record, `orbit_evidence_anchors/{orgId}__{block}`, created and never set. It
  holds the imprint, and per TSA the time, serial, policy and token (DER, base64).

**Why trust the machine's roots** and not certificates committed to the repo: the DigiCert root
downloaded here (`DigiCertTrustedRootG4`, sha256 `552F7BDC…C89988`), but Sectigo's certificate host
refused this session's proxy. A root committed without a check would be worse than the OS store, and
the vendor-name pin narrows the OS store's breadth.

**Code:**
- `src/lib/orbit/anchors.js` (server-safe): the imprint, the TSAs, and `checkAnchors`, which checks
  each anchor still matches the stored block and has both tokens.
- `scripts/orbit/anchor.mjs`: the openssl side, meaning query, reply verification, stored-token
  verification from the digest, HTTP POST and the roots file.
- `scripts/orbit/anchor-head.mjs`: the CLI. It's a dry run by default; `--send` anchors and
  `--check` re-verifies every stored token.
- **The backfill anchors after every write,** unless `--no-anchor`. A failed anchor leaves the chain
  written and verified, and says how to retry.

**Shown:**
- **The verify chain mode** (D-SITE-058) adds `anchors` and `anchoredThrough`. An anchor that no
  longer matches the chain fails verification. Token signatures need openssl, so the route checks
  them only for consistency and says so.
- **The timeline** says which blocks are anchored. Later blocks are "verified by Orbit, not
  independently, until the next anchor". Each anchored block offers the tokens for download, with
  the `openssl ts -verify -digest …` command.

**Runbook:** `planning/ORBIT_BACKFILL_RUNBOOK.md`, with David's paths, `~/dev/xyz` included.

**Tests:** `anchor.test.mjs`, written first, failed on import. It uses throwaway local TSAs built
with openssl, so nothing is sent. It covers:
- the imprint;
- genuine replies;
- refusals for another query, the wrong CA, the wrong vendor, clock skew and garbage;
- all-or-nothing storage;
- dry runs sending nothing;
- stored-token re-verification;
- HTTP posting;
- `checkAnchors`;
- the rules.

The verify route and timeline tests were extended. `npm run test:orbit`: 134 pass, 2 todo.
`next build` passes.

**Not yet exercised against the real TSAs:** whether their tokens carry the full intermediate chain
is only known from the first real run. If one doesn't, the run fails closed and stores nothing.

## 2026-10-27 — Backfill checks A3 figures against the local results files; paths corrected to ~/dev/xyz (D-SITE-062)

**David's request:** when xyz's A3 results files are on disk, verify the A3 event metrics against
them, as `oq25_recompute.py` does, and refuse on a mismatch.

**`scripts/orbit/a3_results.py`:**
- It's run as `python3 -I`, with the xyz checkout path as its argument.
- It reads `eval/results/baseline-20260808T083911Z.json` and
  `rejudged-20260809T073724Z.json`, the pair D-096 names.
- It imports xyz's own `oq25_recompute` (`tie_files`, `analyse`) and therefore `score.py`'s
  `correct()`. That means:
  - the same population and definitions as the published scorer;
  - oq25's own refusals pass straight through: wrong `rubric_sha`, a different `run_identity`,
    `rejudged_from` naming another file, or 58-turn counts that differ from the published ones.
- **It adds:** per arm, k for 58-turn and 78-turn sensitivity and calm-turn fires; rows and error
  rows; and verdicts changed by the re-judge, paired on `(scenario_id, turn_idx, arm)`.
- **It returns** `{present: false}` when neither file is there, and `{error}` when only one is, or on
  any refusal. It never outputs text.

**`backfillCore.mjs`:**
- **A new check kind, `a3`.** With the files present, every figure must match. A mismatch or a
  refusal refuses the run.
- **Files absent:** the check is recorded as **skipped** (`ok: null`), never as passed. The CLI
  prints "A3 figures are transcribed, not checked".

**The Lab sources** gain 22 `a3` checks (D-L050).

**Paths:** the Repinfaust repo on David's Mac is `/Users/davidloake/dev/xyz`. The usage text and
the runbook use full paths, because `~` isn't expanded after `name=` in a shell argument.

**Checked:**
- **Synthetic results through xyz's real `oq25_recompute.py`:** the figures came out as built.
  Changing `run_identity` gave oq25's refusal, and one file alone was refused.
- **Here, with no results files:** 56 checks passed and 22 were skipped.
- `npm run test:orbit`: 118 pass, 2 todo. The A3 tests were written before the code, but not run
  red first.

## 2026-10-27 — FINDING: `middleware.js` has never run; protected pages are gated client-side only (D-SITE-061)

**Found while checking D-SITE-059 on the live site, signed out:**
- `/apps/stea/repinfaust`, `/apps/stea/orbit/poc` and `/apps/stea/orbit/AI-Act-…` all return
  **200**, not the middleware's redirect.
- The built `.next/server/middleware-manifest.json` is empty (`"middleware": {}`).
- The live responses carry none of the middleware's headers: no CSP, and `x-frame-options` is
  `SAMEORIGIN` rather than the middleware's `DENY`.

**Cause:** the app lives in `src/app`. Next.js 14 loads middleware from `src/middleware.js` in that
layout, and silently ignores the root `middleware.js`. So none of this has ever run:
- the `protectedPaths` redirects;
- the Repinfaust email gate;
- the canonical-host redirect;
- the CSP and security headers.

**What still protects data:**
- The API routes check the session themselves (Orbit's since D-SITE-046 to 050, and `verifySession`
  elsewhere).
- Firestore rules.
- Each page's client-side sign-in check.

**What is exposed:** the HTML and JavaScript bundles of "protected" pages download without signing
in, and no page gets the CSP.

**The Orbit evidence timeline (D-SITE-059) is not affected.** Its gate is the page's own
server-side check (`loadTimeline`, then `notFound()`), which returned 404 signed out on the live
site. The middleware lines added in D-SITE-059 are inert until this is fixed.

**Not fixed here: this needs a decision.** Moving the file to `src/middleware.js` would switch it
on, but it imports `firebase-admin`, which can't run in Next 14's Edge middleware runtime. That
would break the build or every request. The options:
- **(a)** Edge-safe middleware that only checks the cookie is present, plus the headers. The real
  session check stays in each page or route.
- **(b)** Verify the session cookie in Edge with `jose` against Google's public keys.
- **(c)** Move the gates into server layouts per area, as done for the evidence page.

Each changes behaviour across all STEa apps, so each gets its own plan and approval. Also recorded
in FINDINGS.

## 2026-10-27 — Independent anchoring of the evidence head: recommendation, waiting for David (D-SITE-060)

David asked for this after the backfill and verify chain mode, as its own entry. Anchoring is not
deferred indefinitely.

**Recommendation:** use **RFC 3161 time-stamp tokens from two independent TSAs** (DigiCert and
Sectigo proposed), verified with `openssl ts -verify`, with OpenTimestamps as an optional third
anchor later. The trade-offs, the design and the open questions are in
`planning/ORBIT_ANCHOR_RECOMMENDATION.md`.

**Nothing has been sent to any TSA or calendar.** Sending hashes to an outside service waits for
David's choice.

**Until anchoring ships,** all copy says integrity is "verified by Orbit, not independently"
(D-SITE-055), and the claims guard enforces it.

## 2026-10-27 — Orbit evidence timeline: owner-only, read-only, re-checked server-side (D-SITE-059)

**The route:** `/apps/stea/orbit/evidence`, and its vanity form `/stea/orbit/evidence`.
- **Middleware** (`middleware.js`) adds both paths to `protectedPaths`. A new
  `isOrbitEvidenceRoute` check redirects anyone who isn't the owner, meaning the verified
  `repinfaust@gmail.com`, to `/apps/stea?denied=orbit-evidence`.
  *(Same day: D-SITE-061 found the root middleware never runs. The page's own check below is the
  gate that works.)*
- **The page** (`page.js`) is a dynamic server component. It reads the `__session` cookie and
  checks it with revocation (`serverSession.js`). It then calls `loadTimeline`
  (`evidenceTimeline.js`), which checks the owner **before** reading anything, and anyone else
  gets `notFound()`, so the route doesn't confirm it exists.
- **Not indexed:** `robots: noindex, nofollow`.

**The view** (`EvidenceTimeline.js`) is read-only. It has no form other than the verify button.
For each block it shows:
- the index, type, system and version, the decision id, the date and the commit;
- the related decisions, the hashes (shortened, with the full value on hover) and the models;
- the links, as anchors to the linked blocks;
- the event hash and the previous hash;
- the metrics, as a table.

Signatures and `recordedAt` are not sent to the client.

**"Verify chain"** calls `POST /api/orbit/verify {orgId, chain: true}` (D-SITE-058). It marks
signature, hash and link per block, and prints one scoped line: "Chain verified against stored
events: N blocks, head …, <UTC time>. Verified by Orbit, not independently."

**Tests:** `timeline.test.mjs`, written first, gives 6 tests. They cover the rows, owner-only
loading with nothing read for others, the cookie check, the middleware gate, the page's
server-side 404, and the scoped wording.

**Not yet seen with real data:** the timeline is empty until David runs the backfill. Its visual
check is part of the exit check, after the backfill.

## 2026-10-27 — `POST /api/orbit/verify` chain mode: the stored chain, walked server-side (D-SITE-058)

Logic is in `src/lib/orbit/handlers/verify.js`; the route is a thin wrapper.

**Chain mode** (`{orgId, chain: true}`):
- It's **owner only**.
- It fetches the org's stored evidence chain and its head server-side, and runs `verifyChainV2`:
  per-block schema, signature, hash, link and index, then the head.
- **The caller sends only the org id,** so what is verified is what is stored. This fixes F3, where
  the route checked an object the caller sent.
- **An empty chain is never "verified".**
- **The response** carries per-block booleans, the head, `verifiedAt` and a `scope` string ("…
  verified by Orbit, not independently. Orbit holds the signing secret."). Errors name blocks and
  checks, never values.

**Event mode** (the POC) is kept, with three changes:
- A malformed signature or snapshot hash returns "not verified" instead of a 500.
- A snapshot is only looked up for a user the caller may read (D-SITE-050).
- The hash note says "links not checked", because chain v1 never hashed its links.

**Tests:** `verifyRoute.test.mjs`, written first, gives 8 tests:
- an intact chain verifies;
- a stored metric edit is caught at block 2, without leaking the value;
- a deleted block is caught;
- a 403, a 404 and a 401;
- an empty chain is not ok;
- event mode is unchanged, including simulated tampering;
- a malformed signature gives no 500;
- another user's snapshot isn't looked up.

`npm run test:orbit`: 114 pass, 2 todo. `next build` passes.

## 2026-10-27 — Orbit evidence backfill: local, source-verified, idempotent (D-SITE-057)

**Files:** `scripts/orbit/backfill-evidence.mjs`, the CLI, and `scripts/orbit/backfillCore.mjs`, the
pure core.

**The sources** are `repinfaust-lab` `scripts/orbit/evidence-sources.json` (Lab D-L049), which is
kept out of this repo (D-SITE-048).

**How it runs:**
- **Locally, with Application Default Credentials** against `stea-775cd`, never through the public
  API.
- **Dry run by default.** `--write` writes, and `--offline` verifies the sources without touching
  any database.

**Verification before any read or write:**
- **Commits:** every payload's commit must exist in its local checkout.
- **Hashes** are checked against `git show <at>:<path>`, either the full sha256 or its first 12
  hex characters.
- **Numbers** are checked by JSON pointer against committed outcome files, with booleans compared
  as 1 or 0.
- **Links** resolve only to earlier events.
- **Payloads** must pass `validateEvidenceEvent`.
- **The backfill sets the chain fields,** never the sources: a hand-set `eventId` or chain field is
  refused.
- **Every failure is listed together,** and nothing is written unless all checks pass.

**Ids and the head:**
- **`eventId`** is `ev_` plus the first 24 hex characters of `sha256(orgId|key)`. So a re-run is
  refused if the chain already holds the events.
- **`--append --expect-head <hash>`** writes only the missing tail, and only if the head is
  unchanged. A chain that doesn't match the sources is refused.

**The org:** `repinfaust-evidence` is created on first `--write` with a random signing secret and
**no API key**, since nothing ingests into it.

**After writing,** the whole stored chain is re-read and verified with `verifyChainV2`. The output
is keys, types, decision ids, commits, event ids, hashes and counts.

**Result (2026-10-27, cloud session):**
- **Offline:** 15 events, **56 checks, all passed**.
- **In memory,** with the real sources: all 15 blocks written, `verifyChainV2` OK, and a re-run
  refused.
- **Not run against Firestore yet.** That needs David's credentials; the command is in the
  script's header.

**The A3 numbers are transcribed** from the scorecards and D-096, because the results files aren't
in xyz. The Lab numbers are machine-checked.

**Tests:** `__tests__/orbit/backfill.test.mjs`, written first, gives 6 tests. `npm run test:orbit`
gives 100 pass, 2 todo.

## 2026-10-27 — Orbit evidence store: own collection, one chain per org, head moved in the same transaction (D-SITE-056)

`src/lib/orbit/evidenceStore.js`, as approved in D-SITE-048 (answer 1).

**Collections:** `orbit_evidence_events` holds the blocks, and `orbit_evidence_heads/{orgId}`
holds `{orgId, blockIndex, eventHash, updatedAt}`. Neither is touched by the POC reset, the
consent updates or the policy engine.

**`appendEvidenceEvent`:**
- In one Firestore transaction, it reads the head, links the event (`linkEventV2`, which validates
  first), **creates** the block document `{orgId}__{blockIndex, 8 digits}`, and sets the head.
- `create` refuses an existing block, so a lost or reset head can't lead to block 1 being
  rewritten.
- An optional `expectHead` refuses the append if anything else was appended since the head was
  read. The backfill's `--append` uses this.
- `recordedAt` is server bookkeeping, outside both the signature and the hash.

**`readEvidenceChain`:** returns the chain in block order, sorted in memory so no composite index
is needed, together with the head.

**Rules:** both collections are added to `firestore.rules` as `allow read, write: if false`. The
file has no catch-all rule, so they were already denied before the rules are deployed. Deploying
keeps the file and the live rules in step.

**Tests:** `__tests__/orbit/evidenceStore.test.mjs`, written first, against an in-memory Firestore
with serialised transactions. They cover:
- link and verify;
- 5 concurrent appends with no fork;
- an `expectHead` refusal;
- invalid, wrong-org and free-text payloads, each writing nothing;
- no overwrite after a lost head;
- separate chains per org;
- the rules text.

`npm run test:orbit`: 94 pass, 2 todo.

## 2026-10-27 — AI Act page: SDK tab removed, chain spec rewritten as design; integrity "verified by Orbit, not independently" (D-SITE-055)

**Live verification of D-SITE-046, 047 and 050** was done by David on www.arcturusdc.com,
2026-10-27, from screenshots:
- **Signed in as the owner:** `GET /api/orbit/orgs`; testing the body for `apiKey|signingSecret`
  gave `false`.
- **Signed in with a second, non-owner Google account:**
  - `POST /api/orbit/reset` returned `HTTP/2 403`;
  - `GET /api/orbit/events?userId=nobody` returned `HTTP/2 403`.
- David accepted the sandbox compromise (non-owners can read only `user_12345`).

**The AI Act POC page** (`AI-Act-…/page.js`), at David's request:
- **The SDK tab is removed.** That covers the "Orbit Logging SDK" tab, `LoggingSDKExplainer` and
  `LoggingSDKExamples` (Python, Node, Java and Go examples, plus install commands for packages that
  don't exist), and eight orphaned SDK comments.
- **The other SDK mentions are reworded:** the header, the positioning block, the "Explore the
  tabs" step, the "replaces all of this with a single SDK" line (now "aims to … (proof of
  concept)") and the "Orbit Logging SDK" box in the KYC diagram (now "Your Logs").
- **"Hash Chain Specification"** is rewritten to describe chain v2 (D-SITE-054) and labelled
  **"Design — in development"** until v2 is live and verified on stored events. The old text
  described v1 as if the link were hashed.
- **"✓ Independent integrity layer"** now reads "Integrity layer (verified by Orbit, not yet
  independently)".

**Rule until an external anchor exists:** all copy says integrity is verified by Orbit, not
independently. The public page's two hash-chain lines say so.
- The external anchor is due after the backfill and verify chain mode, as its own D-SITE entry. It
  is not deferred indefinitely.

**Guard:** `claims.test.mjs` now fails on any SDK reference in the AI Act page, on a chain spec
without the design label, and on "independently verified", "independent integrity" or similar on
any Orbit page. The old AI Act copy matches these guards 18 times.

**Tests:** `npm run test:orbit` gives 86 pass, 0 fail, 2 todo (the v1 defects).

## 2026-10-27 — Orbit chain v2: recursive canonical form, hash covers the link (D-SITE-054)

`src/lib/orbit/chainV2.js`, for new events only. v1 (`signatures.js`) is untouched.

**F2.** `canonicalV2` serialises recursively with sorted keys, so nested values are covered. It
refuses `undefined`, NaN and infinities, Dates, Timestamps, Maps, BigInt and functions, instead of
skipping them as v1's `cleanEventForSigning` does.

**F1.** The hash covers the link:
- **The signature** is HMAC-SHA256 over the payload plus `signingKeyId`.
- **The hash** is SHA-256 over everything stored except `eventHash` and bookkeeping (`id`,
  `recordedAt`). That includes the signature, `previousEventHash` and `blockIndex`.
- **Block 1** links to `GENESIS_HASH`, 64 zeros, so it's checked like every other block. v1 never
  checked block 1 (F3).

**Functions:**
- `linkEventV2` validates the payload first (D-SITE-053), so chain fields can't be smuggled in as
  payload.
- `verifySignatureV2` returns false on malformed input; it never throws.
- `verifyChainV2` checks, per block, the schema, signature, hash, link and index, then the head
  record. Its errors name blocks and checks only, never values.

**Trust limit, stated rather than solved:** Orbit holds the HMAC secret. So anyone with the secret
(Orbit, or the owner) could rewrite and re-sign the whole chain, recomputing every hash after the
edit. Chain v2 detects edits by anyone without the secret, and any partial edit. Making the head
checkable from outside needs an external anchor, for example publishing the head hash to a commit
or a timestamping service. That isn't in scope; it's noted for a later decision.

**Tests** (`__tests__/orbit/chainV2.test.mjs`):
- **The v2 tests pass.** These cover the canonical form, refusals, signatures, genesis linking, and
  the detection of an edited metric, a reorder, a deletion, a relink, a truncated tail and a
  re-signed edit.
- **The same two properties run against v1** as `todo` tests. They fail on every run, which shows
  F1 and F2: v1's signature ignores a nested metric change, and v1's hash ignores relinking.
- **A legacy v1 event is pinned byte for byte:** signature `c0185753…`, hash `d1f7933c…`.
- `npm run test:orbit`: 80 pass, 0 fail, 2 todo.

## 2026-10-27 — Orbit evidence event family: 11 types, strict schema, no free text (D-SITE-053)

Added to `src/lib/orbit/eventTypes.js`, beside the legacy consent family. That family and
`validateEvent` are unchanged, and a test pins them.

**The types:**
- **Control:** `CONTROL_TRIGGERED`, `CONTROL_OVERRIDDEN`, `ESCALATION_REQUESTED`,
  `HUMAN_REVIEW_REQUESTED`, `HUMAN_REVIEW_COMPLETED`.
- **Evaluation:** `EVALUATION_RUN`, `RUBRIC_VERSIONED`, `HUMAN_AUDIT_COMPLETED`,
  `REGRESSION_DETECTED`, `CLAIM_WITHDRAWN`, `PREREGISTRATION_FROZEN`. The last is the addition to
  the direction note (D-SITE-048).
- `HUMAN_REVIEW_COMPLETED` requires `subjectEventId`, which links it to its request.

**`validateEvidenceEvent`:**
- It returns `{valid, errors}` and never throws.
- Every field is typed, and unknown fields are refused, so `userId` and free-text fields can't be
  stored.
- Every string field has a pattern with no whitespace and a length cap.
- `metrics` is an object of at most 64 identifier keys, with finite numbers only. Booleans are
  stored as 0 or 1. A `0` is a value, which fixes the presence-check bug in `validateEvent`.
- Arrays are typed and capped at 16.
- `chainVersion` must be `2`.
- `generateEvidenceEventId` uses `crypto.randomUUID`.

**Tests:** `__tests__/orbit/eventTypes.test.mjs` was written first and failed on import. It covers
a valid event of each type, each required field, unknown fields, free text, metric types, arrays,
nesting, and the type-specific rules.

## 2026-10-27 — Orbit: audited wording shipped; a tick only for what exists (D-SITE-052)

`planning/ORBIT_CLAIMS_AUDIT.md`'s proposed wording is shipped as approved, under David's rule:
**nothing gets a ✓ unless it exists in this repository.**

**Public pages (`orbit/page.js`, `overview/page.js`):** every row of the audit table is applied.
- **The SDK row is removed,** along with the two other SDK mentions on the public page
  (`:489` and `:497`). `:489` was missed by the audit and caught by the new guard test.
- **Integrity Service:** "Event signing (HMAC-SHA256)" keeps its ✓, because signing exists.
  Hash-chain verification is a separate row, marked ○ "in development".
- **Compliance Workflows:** ✓ "Governance alerts from the policy engine (proof of concept)". The
  POC's compliance tasks are mock data (`AI-Act-…/page.js:1379`), so they're no longer claimed.
- **Documentation Generation:** ✓ "bundle drafts … (proof of concept)".
- **The five ✓ in "What Orbit stores"** all exist: pointers, hashes, declarations, consent state
  and access events.

**POC page:**
- The interim wording from the audit is applied.
- The removed tick (D-SITE-051) is replaced by a neutral ○ "N events carry a link to the previous
  event (not verified)".
- The 90-day expiry is described as "not yet enforced".
- Signing is described as "a per-organisation secret held by Orbit".

**AI Act bundle:** the seal reads "Sealed with a SHA-256 hash of the bundle at generation time",
and "enterprise-grade … guarantees" now reads "proof of concept".

**The README** matches, and "Append-only" is corrected.

**Guard:** `__tests__/orbit/claims.test.mjs` fails if any of these phrases return to the Orbit
page, the overview or the POC:
- "tamper-evident", "cryptographically-verifiable", "immutable", "cannot be tampered";
- the false link statement, an unchecked "Hash chain intact" tick, or "Logging SDK";
- `tamperSignals`, in the AI Act page.

A phrase is lifted only by a D-SITE entry that cites the chain-v2 verification.

**Left for David (gated, larger than a wording change):** the AI Act POC has a whole "Orbit
Logging SDK" tab with code examples (`AI-Act-…/page.js:456`, `:1064`, `:3450`) for an SDK that isn't
in the repo, and a "Hash Chain Specification" section describing chain linking (`:3683`). The
options are to label them "design, not shipped", or to remove them.

**Tests:** `npm run test:orbit` 38/38. `next build` passes.

## 2026-10-27 — Orbit: three false integrity statements removed (D-SITE-051)

At David's request, and as its own commit ahead of the wording change (D-SITE-049's audit):
- **`orbit/poc/page.js:628`:** removed the ✓ "Hash chain intact - N linked events". It counted
  events that *had* a `previousEventHash` and checked nothing.
- **`orbit/poc/page.js:1359-1360`:** removed "each event's hash includes the previous event's
  hash, creating an immutable linked list". That is false (F1: `signatures.js:17` strips the link
  before hashing). The visual description of the link stays.
- **`AI-Act-…/page.js:1925, :1965-1966, :2017-2023`:**
  - Removed `tamperSignals`, which was hard-coded to `0` ("Would be calculated from hash chain
    checks").
  - Removed the "Tamper Signals" tile that showed it.
  - Removed the "✓ No Tamper Signals: All tamper-evident records are intact" message it triggered.
  - The summary grid goes from 5 columns to 4.

Copy and layout only. There are no logic, auth or data changes.

## 2026-10-27 — Orbit user-record reads restricted; failing-first proof for D-SITE-046/047 (D-SITE-050)

**Reads (the open item from FINDINGS, closed at David's request):**
- `GET /api/orbit/events`, `/alerts`, `/consent` and `/snapshots` (by `userId`) let any signed-in
  account read any `userId`. Now:
  - the owner can read any user;
  - any other signed-in account can read only the shared sandbox user `user_12345`. Every POC
    visitor already writes to and reads from that user, so the POC keeps working;
  - anything else gets a 403, before any read.
- **A snapshot read by pointer** returns 404 both when it's missing and when it isn't permitted,
  so a pointer can't be probed.
- **The policy** is `canReadUserRecords` in `src/lib/orbit/owner.js`.
- **Strict owner-only** would be a one-line change. It would also lock other signed-in users out
  of the POC.
- **Not covered:** `POST /api/orbit/verify` still returns a snapshot's hashes by pointer. It's
  reworked with chain v2 (§2 of the plan). The `ai-act/*` routes weren't audited here.

**Route-level tests:**
- `__tests__/orbit/routes.test.mjs` loads the **real route files**. Next, Firebase Admin and the
  Firestore helpers are swapped for fakes by a loader hook (`__tests__/orbit/fakes/`), so the tests
  run on any commit.
- `npm run test:orbit` now passes 34/34.
- The read tests were written first and failed 4/4 on the code before this change.

**Failing-first proof for D-SITE-046 and D-SITE-047 (David's request):**
- `routes.test.mjs` was run unchanged against `ebe08f9`, the parent of `2f6894e`, in a scratch
  worktree. The result was 9 pass, 8 fail.
- Every test for these two entries failed, each for the stated reason:
  - **non-owner reset:** `200 !== 403`;
  - **orgs GET:** the body leaked `"apiKey":"org_plaintext_key"`;
  - **orgs POST update:** returned the existing `apiKey`;
  - **orgs POST create:** wrote the plaintext key.
- The other four failures are this entry's read tests.
- The owner-path tests passed on both commits, as they should.

## 2026-10-27 — Orbit integrity claims audited; interim wording proposed, not shipped (D-SITE-049)

David asked that, until chain v2 is live and verified, the Orbit page and overview stop claiming
cryptographic tamper-evidence for the existing chain, and for every such claim on the site to be
listed with file and line, with interim wording. The list and the proposals are in
`planning/ORBIT_CLAIMS_AUDIT.md`. **No copy has changed**: David approves the wording first, and
it then ships as its own copy change.

- **Public:** 9 claims on `/apps/stea/orbit` and 4 on the overview.
- **Gated:** three statements in gated pages are false, not just strong:
  - `poc/page.js:1359` says each hash includes the previous hash, which it doesn't (F1).
  - `poc/page.js:628` reports "Hash chain intact" without checking anything.
  - `AI-Act-…/page.js:1925` hard-codes `tamperSignals = 0`, and `:2019-2021` then says all
    records are intact.
- **Also flagged:** the ✓ on a four-language "Orbit Logging SDK" (`orbit/page.js:503`). No SDK is
  in this repo.

## 2026-10-27 — Orbit evidence-chain plan approved, with answers (D-SITE-048)

`planning/ORBIT_EVIDENCE_CHAIN_PLAN.md` was approved by David, in this order:
1. **The live exposures first:** D-SITE-046 and D-SITE-047.
2. Then the claims audit (D-SITE-049).
3. Then features.

**Answers:**
1. **Storage:** a dedicated `orbit_evidence_events` collection, plus the per-org head
   transaction.
2. **Timeline:** owner-only, re-checked server-side.
3. **Visibility:** David is checking the repo's visibility. If it's public, the K4 demo secrets
   are rotated, and `evidence-sources.json` lives in the Lab repo. It lives there either way.
4. **Event types:**
   - `HUMAN_REVIEW_COMPLETED` is added to the control family, paired with
     `HUMAN_REVIEW_REQUESTED`.
   - It is distinct from `HUMAN_AUDIT_COMPLETED`, in the evaluation family.
   - The 9 Aug direction note lists nine types. **`PREREGISTRATION_FROZEN` is an addition** to
     the note, made here.
   - So the family is 11 types.
5. **Tests:** `node --test` (`npm run test:orbit`). There's no new dependency, and Jest isn't
   touched.

**Stage-2 export:** approved as a proposal only. The Lab's code guard
(`eval/scripts/l3_codeguard.py`, `GUARDED = eval, functions/src, prompts, functions/package*.json`)
classifies `scripts/orbit/export-evidence.mjs` and `scripts/orbit/evidence-sources.json` as
unguarded. That was checked by calling `guarded()` on 2026-10-27.

**Numbering:** the plan's §7 table is renumbered, and the feature entries start at D-SITE-050.

## 2026-10-27 — Orbit org API keys hashed at rest, compared in constant time, never returned (D-SITE-047)

Security finding, recorded in FINDINGS.

**Defects:**
- **K3. Any signed-in STEa user could read every org's API key.** `GET /api/orbit/orgs` stripped
  only `signingSecret`. This was the live exposure.
- **K1.** Keys were stored in plaintext.
- **K2.** Keys were compared with `!==`, in three copied `authenticateOrg` functions (events,
  snapshots, verification/request).
- **K5.** An update returned the existing key.
- **K4.** The four demo orgs' keys and signing secrets are hard-coded.

**Fix:**
- **`src/lib/orbit/orgKeys.js`:**
  - It stores `apiKeyHash = sha256(key)`, with `apiKeyHashVersion: 1`. The keys are 128 random
    bits, so no KDF is needed.
  - It compares sha256 digests with `timingSafeEqual`. They're always 32 bytes, so there's no
    length leak and no throw.
  - `publicOrgView` drops `apiKey`, `apiKeyHash`, `apiKeyHashVersion` and `signingSecret`.
- **`src/lib/orbit/orgAuth.js`:** the one `authenticateOrg`.
- **`src/lib/orbit/handlers/orgs.js`:**
  - Creation stores the hash and shows the key and secret once.
  - An update writes no credential field and returns `[REDACTED]`.
  - GET returns `publicOrgView` only.
  - Error bodies no longer carry `error.message` or stacks.
- **The POC page** sends the known demo keys from a constant (`DEMO_API_KEYS`), instead of reading
  them back from GET.
- **Migration:** `scripts/orbit/hash-org-keys.mjs`.
  - It's local and uses ADC against `stea-775cd`. It's a dry run unless `--apply`.
  - It prints org ids only.
  - It refuses a record whose existing hash disagrees with its plaintext.
  - Until it runs, a legacy plaintext record still matches, compared on hashes.
- **Not changed:** `signingSecret` stays recoverable, because HMAC needs it. K4 rotation waits on
  David's visibility check (D-SITE-048).

**Tests:** `__tests__/orbit/security.test.mjs`, 15/15. A static check fails on any `apiKey !==` or
`apiKey ===` in `src/app/api/orbit` or `src/lib/orbit`. `next build` passes.

## 2026-10-27 — `POST /api/orbit/reset` is owner-only (D-SITE-046)

Security finding, recorded in FINDINGS.

**The exposure:** any signed-in STEa user could delete:
- every ledger event, alert, consent record and snapshot, for **any** `userId` in the body;
- with `deleteOrgs`, the four demo orgs.

**Fix:**
- `src/lib/orbit/handlers/reset.js` refuses anyone but the owner with a 403, before touching the
  database.
- **The owner check** (`src/lib/orbit/owner.js`, `isOrbitOwner`) requires
  `repinfaust@gmail.com` with `email_verified`. `verifySession` now returns `emailVerified`. This
  is the same address as the middleware's Repinfaust gate.
- The route is a thin wrapper around the handler.
- Error bodies no longer carry `error.message`.
- **Behaviour change:** other signed-in users can still use the POC sandbox, but "Reset sandbox"
  now fails for them with the 403 message.

**Chosen over removal:** owner-only keeps David's sandbox reset working. Removing the route would
remove that and protect nothing more.

**Tests:** a non-owner gets 403 and nothing is deleted. Signed out gets 401 and nothing is
deleted. The owner's reset succeeds. A 500 carries no internals.

## 2026-10-26 — Orbit public copy removes pricing, penalties and federated roadmap (D-SITE-045)

David requested removal of Orbit's pricing tiers and margin figures, penalty
framing, and the Federated Consortium Governance roadmap. Remove the pricing
data and rendered pricing blocks, the complete penalty card, and the Phase 2
roadmap card; retain the service descriptions and centralised infrastructure
card. Adjust the remaining regulatory and infrastructure layouts to fit their
card counts. This supersedes D-SITE-044's choice to display qualified penalties.
Copy only; no app features, backend, auth, dependencies or infrastructure change.
Publish through the existing main/Git/Vercel path. JSX syntax, removal checks and
Git whitespace checks passed before publication.

## 2026-10-26 — Orbit regulatory copy reflects phased AI Act application (D-SITE-044)

David requested correction of the expired August 2026 deadline and blanket €35M
fine claim on `/apps/stea/orbit`. The public page now distinguishes transparency
rules applying since 2 August 2026 from high-risk application dates of
2 December 2027 (Annex III) and 2 August 2028 (regulated products). It links the
European Commission's implementation timeline and Article 99, identifies the
€35M/7% ceiling as applying to prohibited practices, and qualifies other penalties
and SME protections. Regulatory copy is dated 26 October 2026. The Data Act date
is stated as applying since 12 September 2025; the expired pre-deadline GTM copy
is replaced with undated aims.

Sources checked:
- https://ai-act-service-desk.ec.europa.eu/en/ai-act/eu-ai-act-implementation-timeline
- https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-99
- https://digital-strategy.ec.europa.eu/en/factpages/data-act-explained

Copy only within the existing App Router page; no auth, backend, infrastructure,
dependencies or product functionality changes. Consent-tracking wording describes
policy checks without claiming either advisory-only or complete fail-closed
enforcement, respecting the recorded open enforcement gap. David authorised publication to main through the existing Git/Vercel path.
JSX syntax and stale-copy checks passed before publication.

## 2026-10-26 — Mandrake privacy policy published from the corrected 1.4 app record (D-SITE-043)

David requested publication of `~/dev/mandrake2/legal/privacy-policy.md` after confirming the
live page still carried 29 August's inaccurate custom-text storage claims. Keep the existing
static App Router/legal layout and publish through the existing Git/Vercel path from current
`origin/main`, excluding unrelated working-tree changes.

The effective date becomes **26 October 2026**. The policy now states that text typed under
"Other" is neither uploaded nor retained, distinguishes Firestore's offline cache of uploaded
fields from an independent local event store, removes the claimed local copy including custom
text, and explains user-requested strength/mood check-ins. This supersedes the custom-text
claims in D-SITE-019/D-SITE-021. Other legal sections remain unchanged, including the honest
statement that explicit consent is still an app-side gap; publishing this policy does not
claim to implement consent. No app code, auth, backend, dependencies, collection or
infrastructure changes. Billing fixes are being handled separately by Claude.


## 2026-10-19 — RehabPath 1.3.1 reviewed optional AI context disclosure
The RehabPath release work approved individually selected activity notes, symptom readings and additional details, on-device redaction and editable outgoing/returned review gates (RehabPath planning/DECISIONS.md, 17 October). The public policy and two product descriptions still say written notes never reach AI. Prepare factual copy alignment on codex/rehabpath-131-policy from origin/main in a bounded isolated website worktree, preserving existing retention/deletion claims and all site functionality. No backend, auth, collection, dependency or service changes. David explicitly approved publishing the exact correction in the RehabPath project’s planning/PUBLIC_POLICY_1.3.1_CORRECTION.md and then submitting the Play closed test on 19 October. Use the existing Git/Vercel publication path, verify production Ready and the live policy wording before sending the Alpha/Data Safety changes for review.

## 2026-10-07 — Repinfaust mirror: GPT-6.1 Sol and GPT-6 Astra in the model switcher (D-SITE-042)

Mirrors app decision D-093 in `~/dev/xyz` (provider choice, privacy approval and reasoning live
there). The web mirror's model list gains the two OpenAI options; replies are labelled by model as
before. The broker routes them server-side via the OpenAI Responses API; no key or provider call
touches the browser. Broker deployed 2026-10-07.

## 2026-10-07 — Repinfaust mirror: callable timeouts match the server (D-SITE-041)

Mirrors app decision D-092. The web mirror showed `deadline-exceeded` after an archive: `distillNow`
returned 200 after 76.6 s, but the Firebase callable client stops waiting at its 70 s default.
Each callable whose server `timeoutSeconds` exceeds 70 s now sets a matching client `timeout`
(`chat`, `compareModels`, `distillNow`, `deleteAll` 300 s; `draftDisclosure`, `exportAll` 120 s).

## 2026-10-03 — Site build runtime moved to Node.js 24 on Vercel (D-SITE-040)

**Why:** the production build of `71f9378` failed in 12 s, before compiling: Vercel has
discontinued Node.js 20.x and requires 24.x. Root `package.json` `engines.node` was
`">=18 <=20"`, which Vercel resolves to 20.x. The previous production build (3 days earlier, same
setting) succeeded, so the discontinuation landed in between. Production kept serving the last
good deployment throughout.

**Decision: runtime only, no dependency changes.** `engines.node` set to `"24.x"`. Verified locally
in a clean worktree off `origin/main`: `npm ci` + `next build` on Next 14.2.35 exit 0 under Node
24.21.0, with output identical to the same tree under Node 20.19.5 (253 routes each; the same 5
pre-existing "Dynamic server usage" logs from API routes in both). `functions/package.json`
(Firebase, Node 22, D-SITE-031) is a separate runtime and unchanged.

**Rule carried forward:** after any push to main, confirm the Vercel production deployment
reaches Ready (`vercel ls`) before reporting it deployed.

## 2026-10-03 — Repinfaust mirror: Sonnet 5.5 option and in-chat model switcher (D-SITE-039)

Mirrors app decision D-091 in `~/dev/xyz` (the real app and broker; reasoning lives there). The
`/apps/stea/repinfaust` web mirror gains Sonnet 5.5 in its model list and a "voice" switcher above
the chat composer that writes the same sticky `profile/state.model` preference Settings uses. Each
aid reply shows the model that wrote it, from the `model` field the broker already stores. Sonnet 4.6
stays the default. The broker allowlist change was deployed 2026-10-03.

## 2026-09-30 — Home hero: animated decision-tree SVG replaces the logo watermark (D-SITE-038)

**Why:** the hero is all type, and the 13% logo watermark added nothing to "Better decisions in
the real world". David wanted motion without the hero looking like AI stock footage.

**Decision:** `DecisionTreeHero` (`src/components/DecisionTreeHero.jsx` + `.module.css`) draws a
decision tree as inline SVG that plays once, 5s end to end: ink branches draw left to right
(0–1.6s), dashed alternatives fade in, one red path resolves to an outcome (2–3.9s), then the ink
recedes to half strength (4.3–5s) and the drawing rests on that state. A first version looped
every 18s; David cut it to 5s once-through because visitors do not sit at the top of the home page
that long, and a redraw loop behind the headline is distraction, not story. The art direction came from four Higgsfield stills (Nano Banana 2,
8 credits); the decision tree was chosen over a Boötes star chart, contours and an orbital diagram.
It is hand-built SVG rather than generated video because line art redrawn as vectors stays sharp,
weighs a few KB instead of MBs, loops exactly, and ships no JavaScript.
- Opacity is kept low (ink 0.2, red 0.38) because the tree sits behind the heading and paragraph
  at every width; a first pass at 0.75 red competed with the headline.
- `preserveAspectRatio="xMidYMid slice"`: on mobile it crops to the centre (the red path).
- `prefers-reduced-motion: reduce` shows a still of the last frame (ink at 0.5, red path full),
  not the mid-animation state. Checked in Chromium: the SVG alone differs from the finished
  animation only by anti-aliasing (99.7% of pixels identical, the rest within a few levels).
- Revert: restore the `<Image src="/img/arcturus-logo-transparent.png" …>` watermark in
  `ArcturusRefreshHome.jsx`.

## 2026-09-27 — Career-engine apps: tabs rewrite the URL in place; finishing the tour dismisses it (D-SITE-037)

**Bug:** in Squared (and, by the same code, Career Ops) the first-run tour reappeared on every tab
change. Each tab has its own route file, and `setTab` used `router.push`, which changes route
segment and remounts the dashboard, re-running every load call (7 API requests per tab change)
and the tour check. Only "Don't show again" was persisted.

**Decision:** tabs call `window.history.pushState` instead, and read the tab back from
`usePathname()` for Back/Forward. Verified in Next 14.2.35 with a probe route: one mount (strict
mode doubles it in dev) across push, back and forward, with `usePathname` tracking each step.
Deep links to each tab still work, because the route files remain. Finishing the tour ("Get
started") now persists the dismissal; closing it only hides it for that visit.

## 2026-09-27 — Squared: review fixes (clearance lapse, sourcing, privacy wording, Adzuna credit) (D-SITE-036)

Business-partner review of Squared, and David's approval of every fix, same day.

- **Clearance lapses on exit.** "You hold SC" was wrong from the day after exit. `clearanceStatus`
  (`src/lib/careerEngine/clearance.js`) now follows UK Security Vetting aftercare guidance
  (gov.uk, "Aftercare and existing clearances"): a CTC/SC/DV clearance lapses on leaving; it may be
  reinstated if the holder moves to another cleared role within 12 months; a transfer needs it to
  be no older than 10 years (CTC/SC) or 7 years (DV); the new employer decides. There is a new
  optional "year granted" field. Search tags, the Config note and the AI context all use this
  status; BPSS is treated as an employer check, not a national security clearance.
- **Great Place to Work for Veterans:** eligibility shown from the service record (1+ year served;
  in transition or left; not already a civil servant), with links to the scheme and Civil Service
  Jobs, both from official pages. It moves an applicant on a stage if they meet the minimum
  criteria; it does not guarantee an interview, so the copy says the former. The AI rules carry
  the same facts. CTP RightJob is not linked: a search result says it was discontinued in
  September 2024, and the source page could not be fetched to confirm it.
- **Inferred claims:** both translators now return `added` phrases (facts in the civilian line
  that are not in the original, e.g. "zero losses"). A line cannot be ticked while any added phrase
  is still in it and unconfirmed; the user edits it out or confirms "I can back this up", recorded
  as `confirmed_claims`. Each saved translation shows its source (record or single line).
- **Privacy wording:** "we never sell or share your data" contradicted "sent to the AI and job
  boards". Both apps now say "we never sell your data or use it for marketing; shared only with the
  AI and job-board services that run your search".
- **MOD exclusion** defaults to off.
- **Relevance** shows as a strong/good/partial title match, not a percentage, so it can't be read
  as fit next to the /5 verdict.
- **Notice date** is shown in full ("Notice started 14 Mar 2026").
- **OPSEC nudge** added on CV upload.
- **Phone text:** 12px becomes 13px and 11px becomes 12px below the `sm` breakpoint; the lowest
  label size goes from 10px to 11px; `#a39b89` (about 2.6:1 on paper) is no longer used for
  readable text.
- **Adzuna credit:** its API terms require "Jobs by Adzuna" on every displayed Adzuna advert, at
  least 116x23px, with "Jobs" and the Adzuna logo linked to adzuna.co.uk. Neither app did this.
  `AdzunaCredit` now renders on each Adzuna advert in both apps. The logo image comes from
  adzuna.co.uk/press.html (it blocks automated download, so David supplied it); it is resized from
  4000px to 320px wide as `public/img/adzuna-logo.jpg`, shown 18px high and linked.
- **Saved searches / digest (planned item 3) on hold:** default Adzuna limits (250 calls/day, 2,500
  a month, shared by both apps) cannot support it as designed. Reed publishes no API terms; its
  website terms bar copying "for any commercial or business use", so storing or emailing Reed
  listings needs Reed's written confirmation first.

## 2026-09-27 — Squared: whole-record translation with provenance and number checks (D-SITE-035)

**Why:** David's business partner's core observation: service leavers are capable but struggle to
change their language from military to civilian. The one-line translator is too slow for a
whole appraisal report.

**Decision:** a `translate_record` action takes an appraisal report, JPA extract, course report
or military CV (uploaded and read in the browser, or pasted) and returns reviewable civilian
lines grouped by category.
- **Price:** one action per 12,000-character chunk, at most 3 chunks per run, shown to the user
  before sending. Only chunks that translate successfully are charged. The run is refused up front
  if the balance is below the chunk count.
- **Provenance check (code, not trust):** each line's original wording must appear verbatim
  (ignoring case and whitespace) in the submitted record, or it is flagged and cannot be ticked.
- **Number check:** every number in the civilian line must appear in the original, or it is
  flagged and cannot be ticked. This catches the most damaging kind of fabricated CV claim.
- The same checks run live in the review screen as the user edits (`recordTranslate.js`, no
  dependencies, shared by server and client).
- **Data minimisation:** the record is never stored. It is held in the request and in the review
  component's memory only; only ticked lines are saved, into `skills_translations`
  (`source: 'record'`, `category`), capped at 200. The user can also append them to an evidence
  anchor.
- A pre-upload warning covers OFFICIAL/unmarked documents and security-sensitive detail. It is
  advice, not a filter: classification cannot be reliably detected.

**Not in this change:** the jargon check (glossary under review by Ellis) follows separately.

## 2026-09-27 — Squared: forces-leaver app on a shared career engine; Career Ops prompts profile-driven (D-SITE-034)

**What:** Squared (`/apps/stea/squared`) is a separate STEa app for people leaving the Armed
Forces, built from the Claude Design export in `planning/design/career-ops-forces/`. David chose
a separate app with its own name rather than a Career Ops edition flag, so data controls can be
refined per app as onboarding starts.

**Shared engine (`src/lib/careerEngine/`):** the Career Ops API route was one 900-line handler.
It is now a shared handler (auth, metering, CV library, analysis persistence, job search,
checkout) plus one config per app (`apps/careerOps.js`, `apps/squared.js`) holding collections,
prompts, search rules and extra actions. Both API routes are thin bindings. Membership auth
(D-SITE-033) lives in the handler, so every engine app has it.

**Career Ops prompts were hard-coded to one user.** The extract, evaluate, tailor, ranking and
cover-letter prompts all assumed an energy/billing Product Owner targeting >£65k. They now build
from each user's profile (target roles, salary floor, evidence). Output format is unchanged, so
the Career Ops page is unaffected. Also changed: `analyse` now includes the active CV in the
model context (it was loaded but unused), and prompts are JS modules, not runtime-read `.md` files.

**Squared data:** own collections `tenants/{tid}/squared_ops` (config, usage, apply_profile,
prefs), `squared_analyses`, `squared_cv_uploads`. Nothing is shared with Career Ops. No service
number is collected; the prompts forbid requesting one. Exit date is optional (not set,
countdown, or already out).

**Squared features:** service record (branch, trade, rank, years, clearance, exit and notice
dates) stored on the profile; clearance tags on search results from a case-sensitive pattern
match on listing text, labelled "mentioned", never "required", because it is a text match; the
default employer exclusion is the MOD plus the user's service; a skills translator
(`translate_skill`, one action) where the AI suggests and the user approves line by line;
approved lines join the model context. The evaluate prompt fixes the output headings the verdict
panel parses.

**Pricing:** same model as Career Ops (20 free, £5 for 50) with its own usage counter. Its own
Stripe price (`SQUARED_COFFEE_PRICE_ID`) so checkout never shows Career Ops branding; unset
means top-ups report "no price configured". Own access code (`SQUARED_ACCESS_CODE`), no default.
The Stripe webhook maps `kind` to the right app's usage doc.

**Access:** catalogue key `squared` and launchpad card; protected in `middleware.js`. Workspaces
with an explicit `allowedSteaApps` list need `squared` added to see it.

## 2026-09-27 — Career Ops API requires a signed-in workspace member (D-SITE-033)

**Finding:** `/api/stea/career` and `/api/stea/career/checkout` had no authentication. Both
trusted the `tenantId` in the request body, and `middleware.js` skips all `/api/` paths. An
unauthenticated POST with an arbitrary tenant ID returned `HTTP 200`
(`{"action":"get_usage","tenantId":"nonexistent-probe-tenant"}`, 2026-09-27). With a real
workspace ID, every action was reachable: users' CVs (`list_cv_uploads`), analyses
(`get_analysis`), and writes/deletes (`save_config`, `delete_cv`). Workspace IDs are random but
not secret; two are committed in this public repo. Not tested against a real workspace, to avoid
reading personal data. The unlimited-actions access code also defaulted to a value hard-coded in
the public repo because `CAREER_ACCESS_CODE` was never set in Vercel.

**Decision:**
- Both routes call `verifySteaWorkspaceAccess(request, { tenantId })` before any action: a valid
  `__session` cookie or Firebase ID token, and an active `tenant_members` record for that
  workspace (super-admins pass). Otherwise 401/403.
- The career page sends the Firebase ID token as `Authorization: Bearer` on every call, because
  the session cookie lapses after 12 h.
- The access code has no default. Redemption is disabled unless `CAREER_ACCESS_CODE` is set, and
  the old public value is retired.

**Rule carried forward:** every STEa API route that touches workspace data verifies membership
server-side. A client-supplied `tenantId` is a claim, not an authorisation. Squared (the forces
app built from Career Ops) inherits this from its first commit.

## 2026-09-27 — Career CV tab route moved from `/cvs` to `/cv-library` (D-SITE-032)

**Symptom:** `/apps/stea/career/cvs` returned 404 in production (`x-matched-path: /_not-found`)
while its sibling routes `/scans`, `/setup` and `/apply`, built the same way in the same commit
(3fc3f69), returned 200. `cvs/page.js` was on `main`, but the production build log's route list
had no `/apps/stea/career/cvs`, so the page was never built.

**Cause:** Vercel's default upload ignore list includes `CVS` (the legacy version-control
directory) and matches it case-insensitively, so the `cvs/` route directory was dropped from the
deployment source. No repo config referenced `cvs`. The build log does not report the drop; this
is an inference from the one-directory-missing evidence.

**Decision:** rename the route segment to `cv-library` rather than try to override the ignore
with `.vercelignore`: overriding a platform default is unverified and would fail silently if it
stopped working. `/apps/stea/career/cvs` permanently redirects to the new path in
`next.config.js`, because redirects live in config and are not subject to the file ignore.

**Rule carried forward:** never name an `src/app` route directory after a Vercel default-ignored
name (`CVS`, `node_modules`, `venv`, `__pycache__`, `.git`, `.svn`, `.hg`, `.cache` and similar,
case-insensitive).

## 2026-09-26 — Cloud Functions moved to Node.js 22; WC26 crons and orphan removed (D-SITE-031)
> Restored to `main` on 2026-10-27. It was written and deployed on 2026-09-26, but never committed;
> it was found parked in David's local checkout. The text is unchanged, and the code change
> (`functions/index.js`, `functions/package.json`) is restored in the same commit, so `main` matches
> what is deployed.

**Why now:** Google decommissions Node.js 20 for Cloud Functions on 2026-10-30. After that
date no function on that runtime can be redeployed, which would freeze fixes such as
D-SITE-030. All 21 first-gen functions in `stea-775cd` were on `nodejs20`.

**Decision: runtime only, no dependency upgrade.** `functions/package.json` `engines.node`
changed from `"20"` to `"22"`. `firebase-functions` 5.1.1 and `firebase-admin` 12.7.0 are unchanged; both run
on Node 22, and `index.js` loads cleanly under Node 22.23.3. Moving `firebase-functions` to
v6/v7 is a breaking API change (root import becomes v2), and it is deliberately a separate,
later piece of work. The `ext-firestore-send-email` extension is Gen 2 and manages its own
runtime; it was out of scope.

**Low-drift redeploy, checked first:** since their last deploys, the non-MLB, non-WC26
functions (05-21) had only comment changes, and `functions/wc26/` (07-04) had none. Deployed
2026-09-26 by explicit name list, never a bare `--only functions`: all 18 source exports are
now `nodejs22`, and environment variables carried over.

**Removed (David's decision, same day):**
- `refreshWc26GoldenBootNow`: deployed but absent from source (orphan), so it could not be
  upgraded. Deleted.
- `refitWc26Ratings` (every 24 h) and `syncWc26Predictions` (every 6 h): WC2026 ended
  2026-07-19 and these crons had no season-end shutoff, the same failure class as D-SITE-009.
  Deleted from production, and commented out in `functions/index.js` with a do-not-re-enable
  note. The on-demand `refitWc26RatingsNow` and `syncWc26PredictionsNow` callables are kept,
  as is the `onWc26ResultFinalized` trigger.

**Rule carried forward:** deploy functions by explicit name list covering every source export,
then confirm with `gcloud functions list` that nothing deployed is absent from source.

## 2026-09-26 — MLB T-2h window widened; all six MLB functions redeployed as one bundle (D-SITE-030)

Health check of `apps/stea/mlb` (full evidence: `planning/MLB_BET_SELECTION_FINDINGS.md`,
2026-09-26 entries). Two decisions, approved by David the same day.

**1. `mlbT2hCheck` now runs `*/15 9-23` ET (was `12-23`).** The T-2h window is 100-140 min
before first pitch. With a 12:00 start, no game with first pitch before ~14:00 ET could be
captured by the targeted check. Over 09-12 → 09-25, all 7 no-snapshot T-2h misses were
13:10-13:37 ET first pitches. The collection's earliest regular slot is 12:10 ET (window opens
09:50), so 09:00 covers every first pitch from 11:05 onward. Cost: extra Firestore reads
only. An odds credit is still spent only when a game is actually in its window. The previous
comment, which claimed 13:05 coverage, was wrong and has been corrected.

*Effect on the study:* the missed games were a **systematic** exclusion of day games from
the eligible population, not random loss. The change alters who is eligible from 2026-09-27;
it touches no filter, threshold, primary designation or gate. Recorded as a dated additive
note in `MLB_FILTER_REGISTRATION.md` so it is visible at gate evaluation.

**2. All six MLB functions deploy together, never with a partial `--only` list.** Root cause
of 31 post-fix gamePk-less orphan docs: `mlbPollGameData` was last deployed 2026-07-18, and the
`burst:material_event` snapshot it fires (`functions/mlb/service.js:540`) ran the bundled
pre-D-SITE-011 `snapshotLinesImpl`. The 2026-08-03 fix was deployed to the snapshot, close
and T-2h functions only. Production therefore ran two versions of the same function, and one
of them failed open. Every orphan snapshot carries the burst trigger; 0 of 15,171 non-burst
snapshots since 08-04 lack a gamePk. Redeployed 2026-09-26 19:26Z:
`mlbSnapshotLines, mlbSnapshotLinesClose, mlbSnapshotLinesCloseNight, mlbPollGameData,
mlbFinalizeDay, mlbT2hCheck`. Source diff since the 08-03 bundle touched finalize and EV
helpers only, so the snapshot and T-2h functions change behaviour only by the cron edit above.

**Orphan data: documented, not repaired (David's decision).** Of 26 post-registration
orphans with a real counterpart, 21 real games still got an opener at or before the orphan's
time. 5 had their opener captured 0.5-1.0 h late, and 1 of those (Dodgers@Braves, 2026-08-25,
gamePk 824881) has a different opener line (+0.25). Rewriting openers would alter F2 inputs
after registration, so they stay as captured. The orphan docs remain; they are excluded from
everything by `gamePk: null`.

**Also:** `firebase.json` functions `ignore` now excludes `_*-tmp.*`, so ad-hoc admin scripts
in `functions/` are no longer uploaded with the bundle.

**Open, not decided here:** Node.js 20 is decommissioned for Cloud Functions on 2026-10-30,
after which these functions cannot be redeployed without a runtime upgrade.

## 2026-09-26 — PMR homepage concept served as a static Claude Design export (D-SITE-029)

Adds `/apps/pmr/concept`: the PMR Bike Couriers homepage concept, a self-contained Claude
Design share export, stored byte-for-byte at `public/apps/pmr/concept.html` and reached
through a `next.config.js` rewrite. Every `/apps/pmr/*` response carries
`X-Robots-Tag: noindex, nofollow`, and the page is not listed in the app catalogue: it is a
client concept shared by link, not a public product page.

**Why a static file, not the `route.js` pattern used for the legal pages:** the export is
14 MB because every asset is embedded, including the 4 MB hero video. A `route.js` handler
would trace that file into a serverless function and read it on every request; a `public/`
file is served straight from the CDN. Nothing is lost by serving it statically: the page
assembles itself in the browser (bundled React, fonts, images, and the hero video set to
muted and started by the page's own code, so autoplay works on mobile). The export makes no
network requests of its own.

**Known cost:** the browser must download the whole 14 MB before anything renders, so first
load on mobile data is slow. If the concept is kept long-term, the hero video should be
split out and streamed (web-ready `pmr-animation-bg.webm`/`.mp4` and poster files already
exist in the PMR project's `Assets/Videos/`).

**Pattern going forward:** further client concepts exported from Claude Design go in
`public/apps/<client>/<name>.html`, get a rewrite for the extensionless URL, and get the
noindex header. Replacing a concept means replacing the file, with no code change.

## 2026-09-20 — RehabPath QR store redirect; store URLs read from the catalogue (D-SITE-028)

Adds `/apps/rehabpath/get` (`src/app/apps/rehabpath/get/route.js`), mirroring the existing
Dialled MTB route at `src/app/apps/dialled-mtb/get/route.js`: a `route.js` handler that
sniffs the User-Agent and 302s to the App Store or Play Store, with `Cache-Control:
private, no-store` and `Vary: User-Agent` so no shared cache can pin one platform's
destination for the other's scanners. Desktop and unrecognised agents fall through to
`/apps/rehabpath`, which lists both stores — the right destination for a scanner on a
laptop, and kept deliberately.

**Departure from the Dialled route, and the reason:** Dialled hardcodes its two store URLs,
duplicating `src/data/apps.json`. RehabPath instead imports the catalogue and reads
`appStoreUrl` / `googlePlayUrl` from the `rehabpath` entry. A QR code is printed on
physical media and cannot be reissued once it is in the wild, so the redirect behind it
must not be able to drift from the catalogue. Two copies of a store URL is exactly the
shape that rots silently: nothing fails at build time when one is updated and the other is
not, and the symptom is a dead link reached by scanning a sticker.

A missing catalogue field degrades to the marketing page rather than redirecting to
`undefined`. This means a malformed catalogue entry produces a usable page, not a broken
redirect.

**Pattern going forward:** new store-redirect routes read from `apps.json`. The Dialled
route is left as-is — its hardcoded URLs currently match the catalogue (verified), and
rewriting a working production redirect that sits behind already-distributed QR codes is
not worth the change risk. It should be migrated the next time it is touched for another
reason.

## 2026-09-20 — Dialled MTB analytics registered in the app catalogue (D-SITE-027)

The route `/apps/stea/dialled-mtb/dashboard` (metadata title "Analytics — Dialled MTB",
`src/app/apps/stea/dialled-mtb/dashboard/page.js:4`) existed and rendered, but had no entry
in `src/lib/steaAppCatalog.js`. Two consequences, one cosmetic and one a governance hole:

1. The launchpad grid renders from the catalogue, so no card existed. The page was reachable
   only by typing the URL — which is how this surfaced.
2. `getSteaAppForPath` returned `null` for the path, and `isSteaAppAllowed` returns `true`
   for a null `appKey` ("routes that are not launchpad cards retain their existing access
   controls"). The route therefore sat outside the workspace shelf policy entirely. That
   null-means-allow branch is correct for genuinely fixed-tenant tools, but an unregistered
   card-shaped route inherits it silently — the failure is invisible until someone notices
   the missing card.

Registered as `dialled-mtb-dashboard` in the `Team operations` group, with the matching card
in `src/app/apps/stea/page.js` restricted to the three Dialled addresses, consistent with the
other Dialled cards.

**Migration consequence, accepted deliberately:** any tenant with an explicit
`allowedSteaApps` array will not see the new key until an admin re-saves the workspace policy
with it selected. This is fail-closed and correct per the project's SoRR stance — a new
governed key defaults to denied, not granted. The Dialled workspace needs one admin save
after deploy.

**Pattern worth carrying:** a new page under `/apps/stea/` is not complete when it renders.
It is complete when it has a catalogue entry, because the catalogue — not the route tree —
is what the access gate reads.

## 2026-09-18 — US Solo one-off price reduced to $30 (D-SITE-026)

- David reduced the US-market Solo one-off purchase from **$46 USD to $30 USD**. The server-owned Stripe amount, public pricing UI, structured data, and STEa Terms move together; the entitlement and non-recurring purchase flow are unchanged.

## 2026-09-18 — STEa checkout repaired and US Solo one-off model added (D-SITE-025)

- Fixed the live Stripe Checkout failure shown on `/apps/stea/explore`: the configured Stripe API rejects `custom_fields[1][description]`, so the unsupported custom-field parameter was removed. The Google sign-in email remains a required Checkout field.
- Follow-up from the first deployed $46 checkout: `payment_method_collection: if_required` is now sent only for subscription sessions because the deployed Stripe API rejects it for one-time prices. This repairs both the US Solo one-off and the existing MCP Config Pack checkout.
- Added a US-market Solo one-off purchase at **$46 USD**, charged once with no recurring fee. Checkout uses server-owned inline Stripe price data rather than accepting an amount or currency from the browser.
- The purchase creates the same claimable Solo workspace as the recurring Solo plans. Its Checkout metadata is `kind: stea_us_solo_one_off`, `plan: solo-one-off-us`, and `market: US`; the webhook records it in `stea_purchases`, sends the existing claim email, and the claim route links the resulting workspace back to that purchase.
- Checkout-session records are keyed by Stripe session id and pending claim tokens are deterministically signed from that id, preventing ordinary Stripe webhook retries from creating duplicate purchase/subscription records or workspaces.
- Updated the public pricing structured data and STEa Terms so the displayed price, currency, non-recurring nature, and entitlement match the implemented checkout flow.
- No new authentication mechanism or infrastructure was introduced. Existing Google sign-in, Stripe webhook, pending-workspace, and tenant creation flows are reused.

## 2026-09-12 — thereabouts legal pages disclose the one-time purchase and RevenueCat (D-SITE-024)

- Required before store submission. The live Terms section 10 asserted "thereabouts has no subscription, purchase, or paid entitlement", which directly contradicted the app's shipped monetisation (`sprocket-lingo` D-PROD-044, D-ARC-065). The public record is now aligned with the binary rather than the binary with the record.
- Every purchase claim on the pages is taken from the app source, not from the supplied brief: one non-consumable lifetime purchase (`src/domain/entitlement.ts`), free tier of one complete trip plus five successful `Say it now` translations, paywall on a second trip or a sixth translation, and explicit restore on the paywall and in Settings (`src/ui/useRevenueCat.ts`).
- **The launch price is deliberately not stated on the pages.** D-PROD-044 fixes it at £2.99 UK but treats it as an experiment, and the client always reads price and currency from the store product. A figure in the Terms becomes wrong the moment the experiment moves, and a legal page is the worst place to carry a volatile value.
- Terms section 10 replaced by sections 10–13 (free use and payment, restoring, refunds, purchases and account deletion), tail renumbered to 16. Refunds are stated as Apple's and Google's to grant under their own policies, because we cannot refund a store purchase, with statutory rights preserved. Section 2's "features may be withdrawn" is now explicitly bounded so it cannot read as a right to withdraw paid access.
- Privacy gains section 10 naming RevenueCat as a processor; 10–17 renumbered to 11–18. Disclosed: the linked user identifier (RevenueCat's anonymous id before sign-in, the Firebase uid after Apple or Google linking, per the supported anonymous-to-identified merge), store purchase history and receipt data, entitlement processing, and install technical data. Stated as not sent: trips, phrases, memories, transcripts, feedback, and any advertising identifier. RevenueCat is not used for analytics, attribution or marketing.
- **Deletion ordering was corrected against `cloudSync.ts:562`, which deletes the RevenueCat customer *first* — before cloud, device and Firebase Auth — because that record is keyed to the uid and must be authorised while the account still exists.** Both the Privacy policy and the delete-account page previously described a sequence that omitted the step entirely. The fail-closed behaviour is now stated: if a step fails the account is kept rather than claiming every copy is gone while a processor still holds one.
- All three pages now state that deleting an account **does not cancel the purchase and is not a refund**; store ownership persists and Restore returns access. This is the disclosure most likely to generate a support complaint if left unsaid.
- `updated` default in `ThereaboutsLegalPage.jsx` moved to 12 September 2026, which moves the date on all four thereabouts legal pages together. No site auth, backend, analytics, data collection or infrastructure changed.
- Not claimed and deliberately left out: any server-authoritative entitlement. D-ARC-065 records that every present gate is local UI; if a future paid gate protects server work that becomes a new decision, and the pages must not imply it exists today.

## 2026-09-10 — MLB: `F4b_conf` registered as second primary; project purpose restated (D-SITE-023)

Two things, both directed by David after the D-SITE-022 review: register F4 properly as its
own forward test, and put the project's actual purpose back on the record because the
documents had drifted into reading like preparation for a betting operation.

**PURPOSE, restated and now binding in three places** (`MLB_BET_SELECTION_SPEC.md` §6a,
`MLB_FILTER_REGISTRATION.md` §A5, `MLB_BET_SELECTION_FINDINGS.md` header): **this is a proof
of concept, not a plan to bet, and emphatically not a plan to stake meaningful money — no
life savings, no meaningful bankroll, on any gate outcome.** It is (a) a research instrument
on whether pre-game information movement is exploitable at real prices, (b) a reusable
methods asset (pre-registration, no-leakage rigour, fail-closed collection) that has already
killed the 2025 "61.5%" leakage mirage and caught four production bugs, and (c) **possibly,
entirely TBD, a tool for _avoiding_ poor bets rather than placing good ones** — that use is
undecided. Its value does not depend on finding an edge; "no edge, do not bet" remains the
most likely honest outcome and is a success.

**Registered `F4b_conf`** (`MLB_FILTER_REGISTRATION.md` amendment §A0–A5, additive, touching
no frozen value): `abs(P(Over)@T-2h − 0.5) >= 0.0222`, **second primary**, evaluated only on
games finalizing **2026-09-11 or later**. Rationale: F4 held 60.9% (H1) / 60.0% (H2) across
the sandbox split — stability is the pattern worth a second look, but it sat on calibration
games with a 46.9% CI lower bound. The correct response to an interesting-but-contaminated
signal is neither to bet it nor bin it, but to give it a clean forward test. New id
deliberately, so the exploratory `F4_conf` under the 2026-08-16 registration is untouched.

**φ_b = 0.0222 is deliberately NOT the old φ = 0.0196.** The old value was calibrated on
games that have now been scored (D-SITE-022), so re-registering it would freeze a threshold
chosen partly in knowledge of its performance — precisely the failure the original §3 exists
to prevent. **φ_b was recalibrated on the 278 post-registration games reading the predictor
distribution ONLY** — no correctness, no win rate, no P&L — at the same p80 target percentile
carried over unchanged, so no search over percentiles occurred either. Those 278 games are
now spent as F4b's calibration set and are excluded from its evaluation window. Decision
taken by David when the contamination was put to him with both options.

**Two primaries now run in parallel** on **disjoint windows and disjoint calibration sets**:
`F2_pmove` (games from 2026-08-17) and `F4b_conf` (games from 2026-09-11). Two independent
experiments, not two draws from one sample, so **no Bonferroni correction applies between
them**. A gate outcome for one says nothing about the other, and they must not be traded off
after the fact — specifically, F2 failing while F4b passes is **not** licence to call F4b
"the real primary all along". Both outcomes were registered in advance so both can be
reported honestly. The five exploratory filters keep their 0.05/5 = 0.01 threshold.

**Timeline:** F4b selects ~21.2% (59/278 on calibration), ~2.5 selections/slate-day, so gate
3's ~250+ needs ~100 slate-days. Like F2 it **does not conclude in 2026**; accumulation
begins April 2027.

**Incidental data-quality finding that narrows the D-SITE-022 open item:** all 278
post-registration games resolved a T-2h snapshot during φ_b calibration. The 21 unresolvable
games therefore fail on the **opener** side, not T-2h. The ~9% matching issue is an
opener-snapshot problem specifically — that is where diagnosis should start. Still not fixed;
no code changed.

**No code changed, nothing deployed, no bet authorised.** Documentation only.

## 2026-09-10 — MLB season-close review: sandbox scored, forward window preserved (D-SITE-022)

Season-close review of `apps/stea/mlb`. **No gate evaluated, no bet authorised, and the
primary filter `F2_pmove`'s forward test remains intact and unspent.** Full numbers in
`planning/MLB_BET_SELECTION_FINDINGS.md`; this entry records the decision and its reasoning.

**The decision: score the pre-registration sandbox only.** David asked for a season review,
recalling an agreement that season-end would be sufficient to look. `MLB_FILTER_REGISTRATION.md`
§5 says "season-end at the earliest, and realistically 2027 for gate 3" — season-end is the
earliest moment scoring becomes *permissible*, not the moment the sample becomes *sufficient*.
The ambiguity is genuine and is recorded so it is not re-litigated from memory. Resolution
(David, 2026-09-10): score the 315 pre-registration games (permanently excluded from gate
evaluation by registration §1, so scoring them costs nothing); never touch the post-registration
window. The scoring script applies a hard `date <= '2026-08-16'` filter.

**Why the forward window was not scored, stated plainly:** F2 can be evaluated against gate 3
exactly once. Computing an interim forward result means every later decision about F2 is made by
someone who has seen it — the forward test is then gone and cannot be restored. Arithmetic makes
this a bad trade regardless: at 61 selections the 95% CI is roughly ±12pp, so even a 60% observed
rate would have a lower bound near 48%, below the 52.4% breakeven. Scoring now would spend the
primary filter to obtain a number that cannot clear a gate.

**Sandbox results (281 resolvable of 315 EV-gradeable, 2026-07-18 → 2026-08-16), exploratory
only:** `F0_all` 51.5% / -10.67u; `F1_revision` 54.7% / +2.31u; `F2_pmove` (primary) 50.9% /
-3.32u; `F3_pitcher` 33.3% (n=6); `F4_conf` 60.4% / +5.47u; `F5_combo` 63.6% / +3.55u.
**Every 95% CI lower bound sits below the 52.4% breakeven — gate 3 fails for all six.**

**`F0_all` at 51.5% and -3.80% ROI over 281 games is the most informative figure:** the vig
arriving where theory says it should, which is evidence the *instrument* is sound (prices,
grading and EV computation internally consistent). It is not evidence about any edge.

**F2 looks poor and this changes nothing.** CI 38.1–63.6 on 55 graded games spans nearly every
hypothesis worth holding, so it is not evidence F2 is bad. Per registration §0, a "better"
variant suggested by a poor result is a **new** filter with a **new** date. F2 stays PRIMARY,
frozen, for 2027.

**Recorded pre-emptively because the temptation is foreseeable:** F1 and F2 operationalise the
same premise (information arrival moves the price) and disagree in the sandbox — F1 54.7% and
profitable at every price variant, F2 50.9% and negative. Their CIs overlap almost entirely and
both sit on calibration games, so nothing should be read into it. But if F2 reads weak in 2027
while F1 again looks strong, **swapping the primary at that point would convert the forward test
into a backfit.** Written down now, while nothing is at stake. F1 also fails stability on its
own terms: 59.6%/+5.28 in H1 against 51.4%/-2.97 in H2.

**F4/F5 are the eye-catching numbers and the least trustworthy** — CI lower bounds 46.9% and
43.0%, both computed on the sample that calibrated θ and φ, both exploratory-only under a
Bonferroni threshold of 0.05/5 = 0.01 that neither approaches.

**Answer to David's direct question — can we model further factors to improve on these
benchmarks? No, and more games alone will not change it.** (a) Sample: a 55% filter needs
~250–400 selected bets to clear breakeven on a CI, a 53% edge well over a thousand — that part
is answered by time. (b) **What the data can support:** the collector stores the market's own
price at two moments plus the final total, and nothing else. No team-rate, pitcher, bullpen,
park, lineup or weather data exists in this repo. D-SITE-007 already tested team rates and
as-of-date pitcher form against a real closing line on 2,319 games and got ~50%, with the
apparent pitcher signal proven to be look-ahead leakage. Modelling further factors is a
different project requiring data not being gathered — not an extension of what is running.
**F1/F4/F5 are explicitly NOT benchmarks and must not be treated as a floor to improve on;**
doing so is the exact error that produced the 2025 "61.5%" mirage. The only defensible benchmark
is `F0_all` at 51.5%, i.e. the vig.

**Collector health (verified live, 2026-09-10):** `lastError: null`, last odds pass 13:00Z,
last finalize 07:30Z grading 15 games, 365 credits remaining on the dedicated `MLB_ODDS_API_KEY`,
`lastUnmatched: 0`. 777 game docs, 749 with finals, 593 EV-gradeable. All D-SITE-011/014/015
fixes holding.

**Forward status (selection counts only, no scoring):** 278 post-registration EV-gradeable games;
F2 selects 61 (21.9%, against a ~20% design target — the September distribution shift registration
§3 warned of has not materialised). At ~2.6 F2 selections/slate-day, gate 3's ~250 needs ~73 more
slate-days. Regular season ends within weeks and the postseason is a handful of games/day, so
**this does not conclude in 2026**; accumulation resumes April 2027.

**Open item, not yet diagnosed:** snapshot matching by exact `capturedAtIso` equality fails to
resolve 34/315 sandbox games (10.8%) and 21/278 forward games (7.6%), ~9% overall. Cause unknown —
may be the matching method rather than missing data. **Must be resolved before any gate
evaluation:** silently dropping ~9% of games would bias the selected set in an unknown direction.
No code changed.

**Also worth deciding before the season ends:** whether the collector idles cleanly through the
offseason. The free MLB schedule gate should skip and spend nothing from ~October to April, but
that should be *verified* rather than assumed, given D-SITE-010 — a finite-event cron left running
past its event drained a shared quota.

Standing position unchanged: no bet until the project's end point and all five gates pass.

## 2026-08-29 — Mandrake web privacy copy aligned with the corrected deletion flow (D-SITE-021)
- David explicitly limited this pass to the public Mandrake website. No Android source, version, artifact, Play listing or release process is part of this site change.
- Adopted the reviewed landing-page wording: anonymous by default; no name, email or password; urge entries stored in the cloud under a random identifier; screening answers and custom text kept on-device; export and deletion available. Deliberately rejected any claim that history survives a lost phone, reinstall or device change: anonymous Firebase state is local and Android backup recovery is opportunistic, not guaranteed.
- Updated the Privacy Policy and Data Deletion pages to the corrected Mandrake deletion implementation recorded in app decision D-M014, superseding D-SITE-019's disclosure of the older broken flow. Reset is cloud-first and fail-closed: Firestore urge events are deleted before local Room data and preferences; on cloud failure local data remains and the user is told to retry. The UID is now copyable in Settings for email deletion requests. The anonymous-auth record, purchase records, support correspondence and any Android-managed backup are not claimed to be deleted.
- Effective dates moved to 29 August 2026. No site auth, backend, analytics, data collection or infrastructure changed.

## 2026-08-28 — Personal residential address removed from every public policy source (D-SITE-020)
- David identified that the postal address repeated in several app policy pages is his personal home address and must not be published. Removed it site-wide from all nine matching public-source locations across Mandrake, Unload, Sprocket, Tou.me and ADHD Acclaim; contact sections retain the company name and support email only.
- Scanned every PDF under `public/` by extracted text for both the street name and postcode; no PDF contains the address. Re-ran repository text searches for both forms after the edit and found no remaining source occurrence.
- Privacy rule: never copy a founder, director or developer postal address from supplied legal drafts into a public page without explicit confirmation that it is an approved public business/registered-office address. A company name and monitored contact email are the default until such confirmation exists.

## 2026-08-28 — Mandrake public record corrected and HTML legal set completed (D-SITE-019)
- Replaced Mandrake's 6 October 2025 privacy page and PDF-only policy links with public, readable HTML routes at `/apps/mandrake/privacy-policy`, `/apps/mandrake/terms-of-service`, and `/apps/mandrake/data-deletion`. The pages share a compact legal navigation and use the site's existing static App Router architecture; no auth, backend, analytics, data collection, or new infrastructure was added.
- Source of the rewrite: three drafts supplied by David from `~/dev/mandrake2/legal`, checked against the canonical Mandrake Android source and its SoRR rather than copied as fact. The legal copy is not a substitute for a solicitor's review.
- Corrected the website's materially stale product claims: Mandrake is Android-only, not iOS/cross-platform; it automatically creates a Firebase anonymous identity; and urge events are stored in Firestore rather than remaining local-only. The stale iOS route remains available to avoid breaking an existing URL but now states that Mandrake is unavailable on iOS.
- The cloud disclosure follows `FirestoreUrgeRepository`: timestamp, event type/gave-in state, preset urge category, intensity, mood, trigger, preset tactic, wave-timer use and duration are uploaded. Custom tactic/category text is present in the local Room entity but is not included in the Firestore write. Screening raw responses, scores/bands, risk assessments, loops, rewards and preferences are local.
- Purchase copy reflects the implemented three-day trial followed by a one-time Google Play unlock checked through RevenueCat; it does not describe a subscription. Firebase Analytics and Crashlytics are not present in the current app dependencies.
- The supplied deletion draft overstated the current Reset behavior and was corrected rather than published verbatim. `SettingsScreen` clears Room first, then attempts Firestore urge-event deletion while swallowing/logging a cloud failure; it does not clear the protobuf preferences store or delete the Firebase anonymous-auth record. The public deletion page names that limitation, recommends being online, and provides an email request route without claiming support can identify anonymous records when the UID is unavailable.
- The landing page's old PDF disclaimer is consolidated into the HTML Terms medical/emergency disclaimer, matching the supplied draft. Legacy PDFs remain in `public/` but are no longer linked from the Mandrake pages because their local-only, iOS and split-document claims are stale.
- FOLLOW-UP REQUIRED IN THE APP REPO: make deletion cloud-first/fail-closed or visibly retryable, delete the anonymous-auth record and local preferences when promised, expose a safe identifier or authenticated external deletion path, and add a separate explicit-consent step before processing special-category urge data. The website discloses the current behavior; it does not pretend those app gaps are resolved.

## 2026-08-19 — Workspace-scoped STEa app shelves and Repinfaust owner boundary (D-SITE-018)
- Added the optional tenant field `allowedSteaApps`, backed by the exact app-card set rendered on the authenticated `/apps/stea` workspace launchpad. Product pages, unpublished tools, and route-folder experiments are not assignable merely because they exist. New workspaces choose at least one launchpad app during creation; existing workspaces retain their legacy all-app view until an admin saves an explicit policy, preserving existing functionality.
- Rider Management uses the canonical `/apps/stea/dialled-mtb/riders` route so it remains inside the Dialled MTB route family. The former top-level `/apps/stea/dialledmtb-riders` URL redirects to it and remains mapped to the same `rider-management` policy key only for transition safety.
- The selected workspace policy now drives the STEa home shelf and shared app dropdown. A shared route gate blocks members from rendering internal STEa apps that are not assigned to the active workspace; explicitly public demos, including the temporarily unauthenticated PAYGO mirror, remain public in accordance with existing decisions.
- Super admins retain direct operational access to internal apps, but the visible shelf still follows the selected workspace so irrelevant tools do not clutter customer workspaces.
- Added an `App Access` admin tab for post-creation changes. Active workspace admins may update only `allowedSteaApps`; Firestore rules reject changes to ownership, plan, branding, other tenant fields, unknown app keys, and any attempt to assign Repinfaust.
- Repinfaust remains outside the assignable catalogue. In addition to its existing client and separate-project Firebase owner checks, middleware now rejects every `/apps/stea/repinfaust` request unless the verified STEa session email is exactly `repinfaust@gmail.com`.
- No new authentication mechanism, anonymous access, backend service, or infrastructure was introduced.

## 2026-08-16 — thereabouts policy pages restated for public release (D-SITE-017)
- Source of the rewrite: copy supplied by David from a separate review of the app source. This site repo does not contain the thereabouts app, so the factual claims below were not verified against app code here — they are recorded as supplied.
- Status line changed from "private iOS and Android development build" to "iOS and Android release" (David, 2026-08-16). This is the `updated`/status default in `src/app/apps/thereabouts/_components/ThereaboutsLegalPage.jsx`, so it applies to all three legal pages at once. `updated` bumped to 16 August 2026.
- Supersedes three claims in D-SITE-014 that are no longer true:
  - AI translation is live, not disabled pending an App Check gate. Consent is requested before first request and withdrawable in settings.
  - Account deletion now cascades: cloud records, then device data, then the auth account, and fails closed (account retained) if the cloud step fails. The email-based cloud-deletion route in `delete-account/page.js` is therefore removed, not merely supplemented.
  - Analytics is genuinely off-until-consent with event filtering, and no advertising identifier is collected. The D-SITE-014 disclosure telling testers to assume automatic Firebase events is withdrawn.
- Three data flows were previously undisclosed and are now documented: the free-text trip note sent to OpenAI (the main AI input, previously described as a narrow closed-field payload); phrase text sent to Microsoft Azure Speech for languages the device TTS cannot speak, cached on device; destination sent to the Unsplash search API.
- New section on information about other people, covering third parties named in the trip note who have not consented. Directs users away from including others' health, ID, financial or address data.
- The trust-label system described in Terms §4 and §6 no longer exists in the app; replaced with a statement that language is AI-written and AI-checked rather than human-reviewed, plus a user-report-and-withdraw path.
- Consequential edits beyond the supplied copy, approved by David 2026-08-16: Terms §2 retitled Private development status → Service status; §10 No charge in the current build → Charges; "experiment" removed from Terms §1/§13 and Privacy §12/§14; `delete-account/page.js` rewritten to match the new cascade behaviour; the AI FAQ answer on `apps/thereabouts/page.js` corrected because it still told users AI translation was disabled.
- `apps/thereabouts/page.js` (the public landing page) restated for release in the same pass, on David's instruction 2026-08-16 — the pre-release framing should not have been there once the policies said "release". Ten items: status pill "Private preview · v0.1" → "iOS and Android"; "BUILD 0.0.1" demo label removed; simulator caption → "A walk through the trip loop."; "Current build · v0.1 / What works now / Still a private experiment, not a release candidate" → "In the app / What it does / Available on iOS and Android."; roadmap heading "What comes next if the trip loop earns it" → "What comes next" with "Planned, and not yet in the app."; "trip-readiness experiment" → "app".
- Three landing-page claims were factually wrong, not just pre-release framing, and are the reason this could not be left as marketing copy:
  - The "Is it available to download?" FAQ said "Not yet. thereabouts is in private development" — the most damaging line on a page a store reviewer reads. Now states availability on iOS and Android, free with no paid entitlement.
  - The "How is the language checked?" FAQ and feature 05 both described the removed trust-label system ("visible trust status", "provisional until it passes an allowed review route", "reviewed by Italian speakers"). Both rewritten to the AI-written/AI-checked + report-and-withdraw model now stated in Terms §4. Feature 05 retitled "Know which language you can trust" → "Say when something sounds wrong", since the old title promised exactly the guarantee that was removed.
  - Feature 01's "reviewed replies" carried the same false implication; "reviewed" dropped.
- The reminders FAQ keeps explicit roadmap framing ("the reminders on the roadmap will be...") because reminders remain in the planned section, not the app. Do not let a future tone pass turn that into a present-tense claim.
- STORE URLS OUTSTANDING: David has no App Store / Play links to hand as of 2026-08-16, so the download FAQ asserts availability without linking anywhere. Add real store buttons to the hero before or at submission — a page claiming availability with no route to install is a weak spot in review.
- The Atessa / October 2026 hero framing is deliberate first-trip positioning and was left intact.
- Caveat carried from the source review and restated to David: not legally reviewed. Worth a solicitor's pass before relying on these for store submission.

## 2026-08-14 — PAYGO mirror runtime assets served unauthenticated (D-SITE-015)
- The PAYGO demo mirror had three independent auth layers, not one. The 2026-06-23 change that dropped the magic-link gate removed only two of them: `PaygoMagicLinkGate` in `src/app/apps/stea/paygo/page.js` and the session guard in `src/app/api/stea/paygo/poc-analysis/route.js`. The third — a `verifySession` check at the top of `GET` in `src/app/apps/stea/paygo/runtime/[...asset]/route.js` — was missed.
- Consequence: the page shell rendered but the iframe at `/apps/stea/paygo/runtime/index.html` 401'd on every asset, so the embedded app was blank. The symptom was misleading because visiting an authenticated STEa route first set a `__session` cookie, after which the mirror loaded correctly — making the failure look intermittent rather than unconditional.
- Decision: remove the third gate so the mirror is reachable without authentication, matching the stated intent of the 2026-06-23 change. This is the root-cause fix, not a bypass: the other two layers were already down, so this route was enforcing an auth contract nothing else still honoured. `middleware.js` was never involved — `/apps/stea/paygo` is not in `protectedPaths`.
- The route hydrates `PAYGO_FIREBASE_API_KEY` into the served JS bundle at request time. Removing the gate makes that key publicly retrievable. Accepted (David, 2026-08-14): a Firebase Web API key is a public client identifier, not a secret — it ships in every client bundle by design, and protection rests on Firebase Security Rules and authorised-domain restrictions rather than key secrecy.
- The page remains `robots: { index: false, follow: false }`. The demo contains no real customer data, no PII and no live energy accounts, so unauthenticated access carries no data-protection exposure. Path-traversal protection on the asset route is unchanged.
- This is a TEMPORARY state pending Ensek IT resolving the proxy block on `identitytoolkit.googleapis.com`. All three layers must be restored together; each carries a matching `TEMP 2026-06-23` comment naming the other two so a partial restore cannot recur.

## 2026-08-10 — thereabouts public app and policy record (D-SITE-014)
- Added `/apps/thereabouts` as a development-status app page using the product's pocket-notebook visual system and existing compressed 55-second iOS demo.
- Public product copy separates the working v0.1 private-preview feature set from accepted v0.2 direction. Planned onboarding, reminders, translation capture, and guided acquisition are not presented as shipped.
- Public positioning describes thereabouts as a personalised destination-language product. Italian and Atessa are its current first-trip implementation, not a permanent product or language boundary. Internal development jargon is excluded from user-facing copy.
- Added readable HTML routes at `/apps/thereabouts/privacy-policy`, `/terms-of-use`, and `/delete-account` for both iOS and Android development builds.
- Policy copy follows the thereabouts SoRR and source rather than cloning Sprocket's behaviour: local SQLite is primary; anonymous Firebase ownership starts at launch; Apple/Google linking is optional; cloud backup and AI are separate consent choices; AI requests exclude memories; raw microphone audio is not saved by the app.
- The current account deletion control removes Firebase Authentication but does not cascade-delete Firestore mirror records, so the public deletion route directs cloud deletion requests through `help@arcturusdc.com` and does not claim otherwise.
- The source includes Firebase Analytics and a consent UI but does not yet prove that the choice controls SDK collection. The privacy policy discloses that development testers should assume standard automatic Firebase events may occur. A public-release claim of opt-in analytics requires verified enforcement in the app first.
- No site authentication, backend, analytics, or new infrastructure was added. Assets are served from `public/`; the supplied web video remains H.264 at approximately 2 MB.

## 2026-08-02 — Sidestand STEa workspace and read-only analytics surface (D-SITE-011)
- Created a `Sidestand` team tenant in the existing STEa Firebase project, matching the Dialled MTB team-access shape: `repinfaust@gmail.com` owns/administers it, `dialled.app@gmail.com` is an admin member, and the existing STEa super-admin role continues to cover Daryn. No new auth mechanism or anonymous access was introduced.
- Added `/apps/stea/sidestand` as the authenticated workspace hub and `/apps/stea/sidestand/dashboard` as a four-view analytics surface (exec readout; activation & maintenance; rider distribution; journeys & events). Access is limited to Sidestand or ArcturusDC workspace admins through `verifySteaWorkspaceAccess`.
- The dashboard reads Sidestand's existing `sidestand-b19e7` Firestore collections with Firebase Admin. Headline/funnel data excludes accounts carrying server-owned `users.internalType`, per Sidestand D-072; rider detail uses one-way pseudonymous codes and returns no email, name, raw UID, free text or coordinates.
- No Sidestand schema or write path was added. The dashboard computes current readouts on demand rather than creating `dashboardSnapshots`, because adding a collection to the app backend would require its own Sidestand-repo SoRR plan/decision. Lifetime registrations are derivable from `users.createdAt`; premium history is not fabricated when RevenueCat mirror dates do not exist.
- Firebase project inspection confirmed the production Firestore database is live in `europe-west2` and populated. Both native apps are linked to GA4 property `546046598`; the dashboard queries that property aggregate-only and degrades honestly to `GA4 access pending` until the dashboard service account has Viewer permission.
- Added `/apps/stea/sidestand/promo` in configuration mode. It records the known `premium` entitlement and native product IDs, provides two-store provisioning guidance and a browser-only scenario calculator, but cannot create/activate campaigns. Sidestand has no approved campaign schema, app redemption flow or RevenueCat webhook projection, so claiming live promo support would invent functionality and contradict the app SoRR. Live activation remains a separate Sidestand-repo plan requiring iOS/Android parity and RevenueCat/store configuration.
- Sidestand surfaces use the canonical Livery Lite design system: paper/panel/ink, safety orange as the sole accent, Archivo + IBM Plex Mono, zero radius, borders-only depth, dot-matrix data bars and the supplied logo glyph.
- Deployment configuration required: `SIDESTAND_FIREBASE_SERVICE_ACCOUNT_KEY_JSON` (server-only; base64 or JSON), optional `SIDESTAND_GA4_PROPERTY_ID` override, and GA4 Viewer access for that service-account email. RevenueCat live campaign work later requires a server-only secret API key and signed webhook secret; neither belongs in client code or git.

## 2026-07-21 — RehabPath data-retention disclosure

- The RehabPath privacy policy has a dedicated `Data retention and deletion` section because retention details must be explicit and easy for app-store reviewers to locate.
- The section distinguishes on-device data, user-controlled exports, transient AI content, 31-day AI quota counters, 30-day metadata-only gateway logs, and the Firebase anonymous-auth record.
- Public wording must remain aligned with the implemented RehabPath backend rather than claiming that no data of any kind is retained.

## Ruby build spec decisions
- Ruby is positioned as the product intelligence layer across STEa apps (Ruby, Harls, Filo, Hans).
- TipTap is the authoring core with uploads, slash commands, and rich block support.
- DocLink graph is the primary traceability model between docs and artifacts.
- Prompt-to-doc uses MCP templates for PRS, build spec, and release notes.
- Reviewer Mode and release notes automation are planned as quality gates.
- Delivery is phased with stage gates (architecture, security/privacy, UAT, release).

## Sources
- /Users/davidloake/Library/Mobile Documents/com~apple~CloudDocs/dev-backup/arcturusdc.github.io/ruby_build_spec_v_1.md

## 2026-02-07 — Page update rules
- This repo uses Next.js App Router (`src/app/`) for page routes.
- App cards are driven by `src/data/apps.json`.
- Static assets are served from `public/` via absolute paths.

## 2026-02-21 — Sprocket page structure
- Added Sprocket as a first-class app route under `src/app/apps/sprocket/`.
- Policy links for Sprocket use HTML routes (`/apps/sprocket/privacy-policy`, `/apps/sprocket/terms-of-use`) to meet accessibility and store-readability requirements.
- Sprocket card metadata is kept in `src/data/apps.json`; hero and branding assets live under `public/img/`.

## 2026-06-21 — Sprocket current portfolio positioning
- Sprocket is positioned from the live App Store listing (`https://apps.apple.com/us/app/sprocket-calm-phone-helper/id6759454436`) as `Sprocket: Calm Phone Helper`, not the earlier narrow message/letter helper.
- Public app and portfolio copy should describe the broader current scope: voice/text assistance, plain-language reminders, memory/notes, step-by-step phone help, confusing-message explanations, read-aloud replies, and calm/privacy-first interaction patterns.
- This is copy/positioning only; no site auth, infrastructure, analytics, or data handling changes are introduced.

## 2026-03-12 — Orbit GrapheneOS POC v2 route
- Added a new App Router path at `/apps/stea/orbit-grapheneos/poc` as a separate POC surface, leaving existing Orbit routes unchanged.
- Implemented the v2 two-tier UX in the new page: public demo tier (seeded demo dataset + demo banner) and magic-link sign-in tier for posting real device events.
- Kept implementation frontend-first (no new backend or infrastructure) to preserve project constraints; authenticated-tier event history is scoped per signed-in user in local storage for POC behaviour.

## 2026-03-12 — Orbit Charity POC v2 route
- Added a new App Router path at `/apps/stea/orbit-charity/poc` with a charity-specific POC based on the v2 build spec.
- Implemented seeded multi-role identity demo data for OII `oii_mc_demo_001` including the 17-block Margaret narrative, CRITICAL cross-domain alerts, and ICO-focused audit views.
- Reused the same two-tier model pattern (public demo + magic-link sign-in tier) and kept it frontend-first for POC delivery without introducing new backend infrastructure.

## 2026-03-12 — Charity style guide alignment + Graphene explainers
- Updated `/apps/stea/orbit-charity/poc` to use the charity style guide direction (warm light surfaces, Source Sans/Code typography mapping, NHS-adjacent trust-blue + sage palette, critical purple alert hierarchy) rather than the prior dark Graphene-derived presentation.
- Added explainer cards/instructions to `/apps/stea/orbit-grapheneos/poc` Overview and Org Sandbox so users can quickly understand what the demo shows and how to drive the sandbox flow.

## 2026-03-21 — SoRR Control UI POC override and route shape
- User explicitly approved a SoRR override to allow backend work (Firestore + Claude proxy) for this POC, despite baseline repo constraints that usually keep POCs frontend-first.
- Implemented SoRR Control under `/apps/stea/sorr/controlui` with multi-page module routes (overview, request engine, classification, approvals, audit trail, governed workspace).
- Kept magic-link authentication pattern aligned with existing Orbit POCs and made the entry visible from `/apps/stea`.

## 2026-03-21 — SoRR product-model reset (Claude-first, SoRR-as-broker)
- Repositioned `/apps/stea/sorr/controlui` as a product concept layer: Claude-first workflow with contextual SoRR handoff, product-governed use cases, and admin-console preview.
- Retained existing governance/admin screens under dedicated subroutes (`/overview`, `/request`, `/approvals`, `/audit`, `/classification`, `/workspace`) as internal control surfaces rather than universal front door UX.
- Removed the mixed front-door governance flow component to reduce ambiguity between product UX and backend/infosec operations views.

## 2026-05-19 — Dialled MTB workspace feedback triage
- Added `/apps/stea/dialled-mtb` as the Dialled MTB workspace's internal User Feedback tool for manually triaging friendlies feedback.
- Dialled MTB is the STEa workspace/tenant. User Feedback is the app/tool inside that workspace.
- Access remains governed by the existing STEa Google/Firebase session and tenant membership/admin framework; no new auth model is introduced. Users may select the Dialled MTB workspace for product access, or ArcturusDC for internal admin access.
- The server reads the existing Dialled MTB `feedback` collection and `feedbackScreenshots/{uid}/{feedbackId}.jpg` Storage paths with Firebase Admin, preserving the mobile app's write-only client rules.
- Triage is manual only for now: status, priority, and internal notes are admin-managed fields on the existing feedback document.
- The admin portal uses the Dialled MTB anthracite + magenta brand system from the app's public policy/style pages.

## 2026-06-05 — STEa Companion: integration approach (Phase 0 / D-COMP-001)
- **Decision:** Build the STEa Companion (macOS Tauri desktop app, per build spec) against a new authenticated **`/api/companion/*` API layer** in this site repo — **Option B from the spec, NOT Option A (the MCP server)**.
- **Why Option A (MCP) was rejected:** `servers/stea-mcp.ts` is stdio-only (no network endpoint) and authenticates with a Firebase **Admin** service-account key on local disk plus a hard-pinned `TENANT_ID`. Shipping it into a distributed desktop app would put a god-mode key on every machine and bypass per-user workspace permissions — a direct violation of spec §11 (respect permissions) and §15 (don't bypass auth). The MCP server stays untouched for Claude Code / Codex.
- **Auth:** Companion uses Firebase Google sign-in; the API layer verifies the user's ID token via `adminAuth.verifyIdToken` and re-checks `tenant_members/{email}_{tenantId}` server-side before any read or write (satisfies AC14). Reuses the existing tenancy model in `firestore.rules`; no new auth model.
- **Data model (additive only — AC15 safe):** new OPTIONAL fields `activityState`, `priorityBand`, `companionOrder`, `lastTouchedAt`, `source` on `stea_epics`/`stea_features`/`stea_cards`; new tenant-scoped collection `stea_jots` for raw captures; new `firestore.rules` block for `stea_jots` mirroring the `stea_cards` tenant guard. No existing field renamed or removed.
- **LLM classification (Phase 3):** Claude API, server-side only, strict JSON schema, server validates before any write; the model never writes to the DB (spec §15, AC8).
- **Repo split:** Companion app lives in a new repo `~/dev/stea-companion`; the API layer, rules change, and shared write/validation helpers live in this site repo.
- **Status:** Phase 0 integration report written (`~/dev/stea-companion/docs/INTEGRATION_REPORT.md`). No UI/Phase-1 code until this decision is approved (spec §17 + SoRR report-first rule).
- **Hand-off flag:** final Tauri `.dmg` build/codesign/notarization requires a human at the Mac (Xcode + codesign); all scaffolding and code can be done headlessly.

## 2026-06-11 — Dialled MTB tech tree changelog v1 (D-SITE-001)
Built per `tech_tree_changelog_v1_build_spec.md`; canonical visual source `dialled_tech_tree.html` (June 2026 v1.0).
- **Routes:** `/apps/dialled-mtb/changelog` (public tree), `/release/[id]` + `/feature/[id]` permalinks, `/internal` (full tree). Root route confirmed by David; renders inside the site's global Header/Footer shell as a dark full-bleed section.
- **Rendering:** the site's root layout forces `dynamic = "force-dynamic"`, so these routes are server-rendered on Vercel rather than statically exported (spec §8 assumed SSG/Firebase). `generateStaticParams` is present; behaviour is identical for visitors. Deliberately did not fight the site-wide rendering mode.
- **Public/internal split (§5):** enforced at the data layer in server-only modules (`src/lib/dialled-changelog/`, `import 'server-only'`). Public view strips internal nodes (`passport`, `antitheft`, `checkpoint`), `desc`/`why`/`scores`, internal releases, edges touching internal nodes, and the Avoid/Kill/Validate status labels, then compacts the sparse col/row grid (public-only transform). Public lifecycle set (David, 2026-06-10): Live/Building/Next/Open + Locked; Validate nodes (`emergency_tag`, `uplift`) therefore do not render publicly.
- **Internal route gating:** env var `DIALLED_INTERNAL_TREE=1` required or the route 404s; var is NOT set on Vercel production. Internal data never enters `.next/static` (client bundle) — verified by leak test.
- **Leak test (§5.5):** `scripts/check-dialled-changelog-leaks.mjs` greps `.next/static` for 17 forbidden strings; wired as `postbuild` so every Vercel build fails on a leak. Rendered-HTML grep also verified clean at review time.
- **Content model (§4):** one MDX file per release in `content/dialled-releases/` (gray-matter frontmatter; 5 required fields; build fails loudly on malformed files; authoring README included). Status is derived: ≥1 public release ⇒ Live; else authored lifecycle fallback. Seeded with two real releases (Imperial Units 2.0.3, Advisor write-back 2.0.6) — these correctly flip those nodes to Live vs the artefact's hand-authored statuses.
- **Dependencies added:** `gray-matter`, `server-only`. Lightbox is a minimal custom implementation (no gallery lib). `react-markdown` (already installed) renders release notes. Space Mono via `next/font/google`, weights 400/700, scoped to the changelog segment.
- **Fidelity notes:** artefact contains 23 nodes (spec says 22) — all 23 ported verbatim. Source CSS cascade lets status border-colour override the lane-coloured left border — reproduced, not "fixed". Legend says "Locked" while node pills say "Phase 2" — reproduced. Detail panel gained max-height/scroll (needed for release history) — flagged as the one styling addition.

## 2026-06-11 — Dialled MTB changelog Timeline view (D-SITE-002)
Phase 2 of D-SITE-001, approved by David 2026-06-11 (month grouping chosen).
- **Route:** `/apps/dialled-mtb/changelog/timeline` — reverse-chronological feed of public releases, grouped by month, mobile-native (no horizontal canvas).
- **Data:** reads the same `content/dialled-releases/*.mdx` via `publicReleases()` — zero schema change, as the D-SITE-001 model intended. One MDX file populates tree + timeline together. Internal releases never render.
- **Visuals:** locked tech-tree vocabulary only — entry spine takes the lane colour of the first feature the release advances; metadata rows/pills/lightbox reuse existing module classes. No new motion.
- **Navigation:** quiet cross-links between tree and timeline views; timeline added to sitemap. Public/internal leak posture unchanged (postbuild leak test covers the new route automatically).
- This closes the scope agreed for the changelog feature; no further phases planned.

## 2026-06-17 — Art Atlas route and source-cache approach
- Added `/apps/stea/art-atlas` as a browser-based interactive art-history atlas and walkable museum prototype.
- User selected timeline direction **B: Cosmos** (constellation-style historical atlas) after the required A/B/C check-in.
- **Data storage decision:** use the existing integrated Firebase/Admin stack as an optional read-through catalogue cache if populated later; do not add Neo Postgres for this route. The app must also ship with a source-attributed local fallback catalogue so it runs without database provisioning.
- **Source constraint:** artist summaries, dates, portraits, and artwork references must be sourced from Wikipedia/Wikidata/Wikimedia Commons. Do not invent artwork facts; source URLs remain visible in the data layer and UI attribution.
- **Auth/privacy:** no new authentication model, no anonymous auth, and no user data collection. The route is read-only from the visitor's perspective.
- **Infrastructure boundary:** no new external infrastructure. Three.js is allowed as an app dependency for the required 3D museum scene.

## 2026-06-20 — Repinfaust single-user web mirror
- Added `/apps/stea/repinfaust` as a single-user web mirror of the existing Repinfaust Android app.
- **Scope:** this is not a new STEa tenant product and not a public app page. It is a private browser surface for David only, matching the source app's single-user model.
- **Auth:** Google sign-in only, hard-gated to verified `repinfaust@gmail.com` in the client; the existing Repinfaust Firebase project also enforces the owner email in Firestore rules and callable Functions. Firebase Auth authorized domains for this project include `www.arcturusdc.com` and `arcturusdc.com` for the web mirror.
- **Data/sync:** the web mirror uses the existing `repinfaust` Firebase project, Firestore collections, and callable Functions in `europe-west2`. Android and web share the same `profile/state`, sessions/messages, contacts, chain map, friction, litmus, comparison, export, and delete state. No separate sync layer or new database is introduced.
- **Infrastructure boundary:** no new backend infrastructure in this site repo. The route uses a named Firebase client app with the existing public Repinfaust Firebase config baked in and optional `NEXT_PUBLIC_REPINFAUST_FIREBASE_*` overrides; it calls the already-deployed Repinfaust Firebase Functions broker.
- **Safety:** Anthropic remains server-side only through the Repinfaust Functions broker. The web client never calls model providers directly.

## 2026-06-20 — WC26 value engine route and adaptive Firebase layer
- Added `/apps/stea/wc26` with short alias `/wc26` as an ArcturusDC-workspace tool for deterministic World Cup 2026 pricing and value checks.
- **Access:** WC26 is available to members of the existing ArcturusDC tenant (`FqhckqMaorJMAQ6B29mP`) and super admins through the existing STEa Google/Firebase session and tenant membership model. No anonymous auth and no new auth model are introduced.
- **Phase 1:** the page ships with committed JSON fallback data and the verified JS port of the Python Dixon-Coles/xG engine. User rating edits and bet/CLV logs remain in `localStorage`.
- **Phase 2 backend exception:** user approved continuing with the existing Firestore + Cloud Functions stack to make the WC26 data adaptive. This uses new tenant-scoped WC26 collections only; it does not add new external infrastructure.
- **Backend boundary:** Cloud Functions may seed/sync teams, fixtures, results, pre-kickoff predictions, and aggregate grading metrics for the ArcturusDC workspace. Client access is read-only for shared model data; workspace members do not write prediction data directly.
- **Safety:** no LLM is allowed in prediction, rating refit, probability, staking, or recommendation paths. If data ingestion is added later, any LLM use must be extractor-only behind deterministic validation before data reaches the engine.
- **Privacy:** backend user bet logging is deferred. Personal bet logs stay local-only unless a separate tenant-scoped data collection decision is recorded.

## 2026-06-21 — WC26 data integrity fix + pinned-source results ingest
- **Incident:** Phase 1 seed `fixtures.json` contained Claude-invented fixtures with fabricated odds; the live page priced them as real, producing fake edges/recommendations. This violates the project's founding rule for a betting model. All fabricated fixtures + unverified sample results were purged from Firestore (`scripts/wc26-purge-fabricated.js`), seed files emptied, and the WC26 Cloud Functions redeployed with empty seed so scheduled jobs cannot resurrect them.
- **HARD RULE (restated):** NO fabricated data, ever. The LLM may never produce a result, fixture, odd, rating, probability, or pick.
- **Results/fixtures = pinned structured source, NO LLM.** Source: `openfootball/worldcup.json` (public domain CC0) at the raw GitHub URL. Verified shape: `{ name, matches:[{team1,team2,date,group,round,score:{ft:[g1,g2]}}] }`; a match with `score.ft` = played (result), without = upcoming (fixture). Parser `src/lib/wc26/ingestResults.js` is pure + tested: schema-validate, alias-reconcile to known teams, REJECT (never invent) bracket placeholders and teams without ratings. Yield as of 2026-06-21: 35 results, 37 fixtures, 32 placeholders rejected, 0 unknown.
- **Why pinned-source not LLM search:** a tested `web_search`-backed GPT extraction returned fabricated `sourceUrl` citations and scores regurgitated from the old sample — confirming open-search ingest launders hallucination. Results are a fetch-one-known-URL problem, not a search problem.
- **Ingest route:** `src/app/api/stea/wc26/ingest` (Next.js, ArcturusDC-gated, reuses Vercel `OPENAI_API_KEY` only for the separate odds path — not for results). `GET`=preview, `POST`=write real results/fixtures + `wc26_meta/ingest` report. Never writes odds. A super-admin "Refresh results & ratings" button on the page calls it then the deterministic `refitWc26RatingsNow`/`syncWc26PredictionsNow`.
- **LLM boundary going forward:** results/fixtures = pinned JSON (done). xG = stable pages (FBref/Understat) or BALLDONTLIE, later. Odds = the ONLY place LLM-scrape-with-validation belongs, with manual-entry fallback; not yet built.
- **Team set corrected to 48** (WC2026 field). Removed stale `Denmark` (did not qualify); added tier-based seed priors for 9 qualified teams missing from the handoff seed (Algeria, Austria, DR Congo, Ghana, Iraq, Jordan, Panama, Paraguay, Uzbekistan). These are coarse model priors, clearly labelled, refinable in the ratings editor — not asserted facts.

## 2026-06-21 — WC26 honest performance layer + odds policy
- **Odds are NOT a model input.** The model (ratings → Dixon-Coles → fair prices) is driven only by results. Odds are used solely to compute *value* (model fair vs book price). Therefore odds are **optional**: full model output (xG, fair odds, predictions, track record) works with zero odds; only the value/recommendation board needs them.
- **Odds acquisition is manual-only, by design.** A super-admin "Enter odds" panel writes to `wc26_fixtures.odds` via `POST /api/stea/wc26/odds`, behind a deterministic gate (known engine market key; decimal > 1.0, < 1000). **No GPT/LLM odds path** — a tested web_search extraction fabricated prices, so automated odds scraping is explicitly rejected. The gate is source-agnostic so a future vetted feed could reuse it.
- **Honest performance — two clearly separated metrics:**
  1. **Forward record** (the only honest scorecard): predictions logged BEFORE kickoff (`wc26_predictions`, `firstLoggedAt`), locked at kickoff, graded only after the real result via `onWc26ResultFinalized`. Starts at zero and grows. The UI shows it first.
  2. **In-sample backtest** (`gradeHistory`): grades the model on completed games using ratings shaped by those same games — flattering and NOT a track record. Demoted in the UI with an explicit "calibration check only" warning.
- **Why this matters:** the previously displayed "55% / 65.7% strike rate" was a real computation but in-sample/self-graded, never a genuine track record. The page must never present a self-graded number as performance.
- **State 2026-06-21:** 37 pre-kickoff predictions logged for upcoming fixtures (0 graded — correct, games unplayed). Forward record populates as games complete.

## 2026-06-21 — WC26 odds via The Odds API; GPT fully removed from WC26
- **Odds source = The Odds API** (the-odds-api.com), sport key `soccer_fifa_world_cup`, free tier 500 req/month. Real structured REST feed for UPCOMING matches — nothing to fabricate. Key stored as `WC26_ODDS_API_KEY` (server env / Vercel; `.env.local` for dev, gitignored). NOT in the repo.
- **Consensus + gate:** `src/lib/wc26/oddsApi.js` takes the median price per market across UK books (robust to a single stale book), maps to engine keys (Home/Draw/Away, Over/Under 2.5), and REJECTS events whose 1X2 overround falls outside ~100–125% (catches suspended/in-play matches that quote nonsense). Route `POST /api/stea/wc26/odds-api` writes accepted consensus odds onto existing fixtures (never creates fixtures). Verified live: 36 written, 1 rejected (in-play), 0 unmatched.
- **GPT is fully removed from WC26.** It served no purpose once results=openfootball and odds=The Odds API. Confirmed zero OpenAI/GPT/web_search references in any WC26 code. Manual odds entry (`/api/stea/wc26/odds`) retained as an optional fallback. The Vercel `OPENAI_API_KEY` remains for OTHER features (SoRR/PAYGO), untouched.
- **Odds are not a model input** (restated): they only compute value. Honest caveat surfaced: against real market odds the coarse tier priors produce implausibly large "edges" (45–74%) — this is rating miscalibration, not free money. The market is closer to right; ratings must be refined (rolling xG / shrinkage as results accrue) before any edge is trustworthy. The page already labels ratings as coarse priors.

## 2026-06-21 — Tiered portfolio and controlled exposure model
- Added a public portfolio layer as a curated lens over existing routes rather than a new auth or data model.
- **Tiers:** public consumer apps, public B2B/product concepts, controlled demos, authenticated workspaces, and private owner-only tools.
- **CV/recruiter links:** `/portfolio/cv` and related public portfolio routes may include non-PII UTM/campaign parameters for attribution, but must not add per-recipient server-side visitor tracking without a separate privacy/SoRR decision.
- **Private boundary:** Repinfaust remains excluded from public/CV portfolio surfaces. Owner-only and workspace tools must stay behind existing Firebase/Google/session-cookie and tenant membership controls; no anonymous auth is introduced.
- **Implementation rule:** portfolio pages may link to authenticated tools, but must label them as controlled or workspace-gated and must not render private workspace data into public pages.

## 2026-06-27 — Firestore rules security hardening (P0/P1 remediation, deployed)

Context: AI-apps security assessment (authorization-first). Full report at `~/dev/AI_SECURITY_ASSESSMENT.md`. All changes deployed live to `stea-775cd` 2026-06-27 and behaviorally verified.

Decisions:
- **P0 — public unauthenticated write removed.** `hans_cases/{caseId}/submissions` had `allow create: if true` (any internet client could write Firestore directly, bypassing the API; storage/cost/poisoning/stored-injection vector — especially serious given the `firestore-send-email` extension on this project and the 2026-05-21 email breach). Now `allow create: if authed()`. If unauthenticated tester submissions are ever required, route them through an authenticated callable, not an open rule.
- **P1 — tenant-isolation escape hatch removed.** The `!('tenantId' in resource.data) || canAccessTenant(...)` idiom (42 occurrences across ~15 collections) let any authenticated user read/write any tenant-less doc, defeating tenant isolation. Removed; tenantId + `canAccessTenant` is now required unconditionally on those collections. Pre-removal data audit (see below) was mandatory.
- **P1 — comments tenant-scoped.** `stea_epics|features|cards/{id}/comments` were `allow read, create, delete: if authed()` (any user could read/delete any tenant's comments). Now gated by the parent board doc's tenant via new `canAccessParentTenant()` helper.
- **P1 — apextwin POC reads locked.** `apextwin_sessions`/`apextwin_events` here (older POC copy) were `allow read: if authed()` (all riders' telemetry exposed to any signed-in user). Now owner-only. NOTE: the live apexstate app uses its own project `apexstate-f9e24`, whose rules were already owner-scoped — only this website POC copy was exposed.
- **Decision — `projects` is membership-primary, tenant-optional.** Unlike the other collections, `projects` access is governed by `inProject()` (owner/member); tenant isolation applies only when a `tenantId` is present. Personal/legacy projects (no tenantId, e.g. the 5 "Felix Product Lab" workspaces owned by non-tenant users) remain accessible to their members. Forcing tenant on `projects` would have locked these real users out.
- **P2 — super-admin via custom claim.** `isSuperAdmin()` now checks `request.auth.token.superadmin == true` first; the hardcoded email comparison is a transitional fallback. Provision the claim via `scripts/set-superadmin-claim.js`, then remove the email branch. Rationale: email can be unverified/mutable depending on provider.

Production data cleanup (pre-deploy, irreversible writes — done with backup + per-doc re-verification):
- Live tenant-less audit (`scripts/audit-tenantless-docs.js`, read-only) found 18 docs that would have become client-inaccessible on deploy.
- 13 = abandoned MCP "cat game" board orphans (`createdBy: mcp:stea`, parent epic `GMr2vQsuFzJX6PNotsvL` already deleted). Backed up to `backups/deleted-orphans-*.json`, then deleted. Restorable from that backup.
- 5 = real "Felix Product Lab" personal projects — kept; protected by the membership-primary `projects` rule (owner read verified live).
- Post-cleanup audit: CLEAN.

Tooling added: `scripts/audit-tenantless-docs.js` (pre-deploy gate; run before any future tightening of tenant rules), `scripts/set-superadmin-claim.js`.

Outstanding: provision the superadmin custom claim on both admin UIDs, then remove the email fallback.

## 2026-06-26 — STEa Clips: agent-native issue capture (Path B, native build)
- **Origin:** Evaluated BuilderIO `agent-native` (https://github.com/BuilderIO/agent-native, MIT). It is built on Drizzle/SQL + Nitro hosting, which conflicts with this platform (Next.js 14 App Router, Firebase/Firestore, GCS, Vercel). Decision: **do not fork the repo.** Reimplement the agent-native **Clips pattern** natively so it reuses existing Firebase auth, the tenant model, GCS storage, the SoRR policy engine, and the existing `stea-mcp` server.
- **Outcome:** record a screen clip + browser console/debug logs + a short text "ask", store it, and let Claude Code consume it via MCP — i.e. record an issue/ask for an agent instead of writing it up by hand.
- **Routes/files:** recorder UI at `/apps/stea/clips` (`src/app/apps/stea/clips/page.js`); upload API at `src/app/api/stea/clips/route.js`; admin/storage helper `src/lib/steaClips.js`; MCP tool spec in `planning/STEA_CLIPS_MCP_SPEC.md`.
- **Storage:** video at GCS `steaClips/{tenantId}/{clipId}.webm`; Firestore collection `steaClips` doc `{ tenantId, uid, email, clipId, title, ask, status:'new', consoleLogs[], durationMs, createdAt }`. Reuses the `firebase-admin/storage` signed-URL pattern from `src/lib/dialledMtbAdmin.js`.
- **SoRR governance (mandatory, fatal):** a clip's `ask` is an instruction surface to an agent, so the upload route runs it through `classifyPromptLocal` (`src/lib/sorr/controlui.js`). Confidence `< 0.75` ⇒ **blocked / fail-closed**, no clip persisted, tier-4 `INCIDENT` audit entry in `sorr_control_auditLog`. No advisory band.
- **Tenant/auth:** page sits behind the existing Firebase auth + `TenantContext` like other `/apps/stea/*` pages; clips are tenant-scoped. No anonymous auth introduced.
- **MCP (follow-up, outside this repo):** `stea_listClips` and `stea_getClip` (returns ask + console logs + short-lived signed video URL) to be added to the `stea-mcp` server. Spec'd here; wiring deferred to that repo.
- **Other agent-native uses noted for STEa (not yet decided):** Harls/Auto Product backlog steps as multi-surface Actions; SoRR as the universal governance layer for every Action's `run()`; WC26 ingest/refit as governed A2A Actions for the STEa Companion (no-fabricated-data enforced at the Action boundary).

## 2026-06-30 — Dialled MTB community promo administration
- Added `/apps/stea/dialled-mtb/promo` as the internal campaign workbench for community/affiliate offers. It extends the existing Dialled MTB STEa workspace and Firebase Admin exception; it does not introduce a new auth model or database.
- Campaign creation and mutation are restricted server-side to STEa super admins or active workspace admins in the Dialled MTB/ArcturusDC workspaces. Mobile clients never write campaign, assignment, or revenue-ledger records directly.
- Commercial rule approved by David: affiliate commission is **10% of RevenueCat-estimated proceeds for the first 12 months**, with refunds reversing accrual. Payment execution remains outside the tool.
- Native discount provisioning remains store-owned. The workbench records and validates App Store redemption mappings and Google Play developer-offer option IDs. It does not pretend that RevenueCat creates native store coupon codes.
- Campaign activation is fail-closed: every enabled monthly/annual plan must have ready iOS and Android mappings. Codes are immutable Firestore document IDs once created; campaigns are paused/ended rather than deleted so referral and payout history remains auditable.
- The existing Dialled MTB RevenueCat webhook and supportUserConfigs → BigQuery pipeline remain authoritative for conversion/revenue reporting. No new infrastructure is added; the existing projection gains allowlisted referral aggregates.

## 2026-07-11 — Dialled MTB rider analytics dashboard (D-SITE-003)
- Added `/apps/stea/dialled-mtb/dashboard`: internal two-tab analytics dashboard (Exec summary; Engagement & onboarding) replacing the hand-built Looker Studio exec view. Server page + client component + Bearer-token API, cloned from the promo workbench pattern; same workspace-admin authz (`verifySteaWorkspaceAccess`, super_admin/admin, Dialled MTB/ArcturusDC workspaces).
- **Primary data source is direct Firestore reads via `getDialledMtbAdmin()`, not BigQuery/GA4.** Verified 2026-07-11: no GA4→BigQuery events export exists in `dialledmtb-ea850` (only `dialled_support_export`), and the app never calls Analytics `setUserId`, so GA4 events cannot be joined to premium status. At ~70 users a full scan gives per-user precision GA4 cannot. Revisit if users exceed ~5–10k.
- Snapshot architecture: `computeDashboardSnapshot()` (`src/lib/dialledDashboard.js`) full-scans users/bikes/rides/maintenanceTasks/stravaConnections/aiInsights/feedback/userFeatureFlags + collection groups `advisorHistory` and `serviceEvents`, writes JSON (~36 KB) to `dashboardSnapshots/{YYYY-MM-DD}` + `/latest` in the dialledmtb project. Daily Vercel cron 05:00 UTC (`vercel.json` crons + `CRON_SECRET`); manual Refresh recomputes on demand. Mobile clients have no rules access to `dashboardSnapshots` (admin SDK only).
- Maintenance metric correction: top-level `maintenanceEntries` is empty in production; completed services live at `bikes/{bikeId}/serviceEvents`. The dashboard unions both. `maintenanceTasks` (auto-generated schedules) only feeds the "tasks due" metric.
- GA4 sessions/event counts fetched aggregate-only via GA4 Data API (`@google-analytics/data`, new dependency) using the existing service account; degrades gracefully to "access pending" until the SA is granted Viewer on the GA4 property and `DIALLED_MTB_GA4_PROPERTY_ID` is set.
- "Ask the data" panel: OpenAI Chat Completions (same pattern as PAYGO doc assistant but **with** the workspace-admin guard) answering questions against the latest snapshot JSON + metric definitions; short client-held history for follow-ups.
- **Finding (open, needs decision): root `middleware.js` has never executed.** Next.js ignores root-level middleware when the app lives under `src/`; `.next/server/middleware-manifest.json` is empty and production serves "protected" pages with 200 and no redirect. Moving it to `src/middleware.js` fails the build because `firebase-admin` cannot bundle for the Edge runtime — the middleware was written for a runtime it can never run on. Data remains protected by per-route server-side authz + client redirects. Fix options recorded in the session summary; not changed in this commit (outside approved scope).

## 2026-07-12 — Dashboard trend charts + GA4 default-event filter (D-SITE-004)
Approved by David 2026-07-12. Extends the D-SITE-003 dashboard.
- **Two trend line charts added to the top of the Exec tab** (`TrendChart` SVG component, dataviz-validated palette free=#F72585 / premium=#0284C7 on #12161A):
  - *Registered users — lifetime*: cumulative daily series computed in `buildSnapshot()` from each user's `createdAt`. Accurate for the full lifetime.
  - *Premium vs free*: daily counts read from the day-keyed `dashboardSnapshots/{YYYY-MM-DD}` docs (`fetchSnapshotHistory()`, field-masked `select()` on the three totals). **No fabricated backfill**: Firestore never records when a user became premium, so premium/free history exists only from the first stored snapshot onward and grows one point per day. Extrapolating premium status backwards from current `isPremium` is explicitly forbidden (also stated in METRIC_DEFINITIONS for the Ask panel).
- Trend series are embedded in the snapshot (`snapshot.trends`), so they appear after the next refresh; old snapshots render a "hit Refresh" hint.
- **GA4 auto-collected noise (`screen_view`, `user_engagement`) is filtered out of the Top GA4 events table client-side** — raw counts remain in the stored snapshot so the Ask panel and future analyses keep the full data.

## 2026-07-13 — Bike adoption trend + sortable table columns (D-SITE-005)
Extends the D-SITE-003/D-SITE-004 dashboard.
- **Bike adoption trend chart** added to the Exec tab: cumulative % of registered users with ≥1 bike, computed in `buildSnapshot()` (`snapshot.trends.bikeAdoption.points`) from each user's own `createdAt`/`firstBikeAt`. Accurate for the full lifetime — same category as the registrations trend, not the premium/free trend, since bike creation (unlike premium status) is a fact recorded once and never changes retroactively.
- Free vs premium split for this metric is shown as two current-status stat tiles (`snapshot.trends.bikeAdoption.currentPctByPlan`), computed from today's `isPremium` only. Explicitly **not** a historical series — extrapolating current premium status backwards is forbidden, same rule as D-SITE-004's premium/free trend. UI carries a visible caveat line.
- **Sortable column headers** added to four tables (weekly signup cohorts, recent registrants without a bike, top GA4 events, rider detail): click a header to sort descending, click again to toggle ascending. Client-side only (`useSortableRows`/`SortableTh` in `DialledDashboardClient.js`), no new data source, no schema change.
- No new dependencies, no auth change.

## 2026-08-02 — Dialled MTB trend chart axes and time windows (D-SITE-012)
- Extended the existing D-SITE-004 registered-users and premium/free charts with independent rolling Week (7-day), Month (30-day), Year (365-day), and Lifetime controls. This is a client-only read-side change; it adds no schema, data write, auth path, dependency, or infrastructure.
- Both charts now expose dated horizontal-axis ticks, integer user-count vertical-axis ticks, exact date/count point tooltips, and visible daily points. Week labels every day; Month retains daily labels with compact rotation; Year and Lifetime use readable month/period ticks instead of overlapping hundreds of labels. The single registration line uses a bounded integer scale around the selected period so small weekly changes remain legible; the two-series plan-mix axis stays zero-based so relative magnitude is not overstated.
- The cumulative registration series carries the last known total through no-signup days because it is exactly derivable from `users.createdAt`. Premium/free continues to plot only real stored `dashboardSnapshots` points: missing history is not filled and premium state is never projected backwards.

## 2026-08-04 — Aggregate country footprint on Dialled MTB and Sidestand dashboards (D-SITE-013)
- Added a country distribution to both authenticated analytics dashboards using the existing GA4 Data API integrations: dimension `country`, metric `activeUsers`, from each product's documented analytics start date through today. No new service, credential, collection, write path, auth mechanism, or app instrumentation was introduced.
- Country is presented as ranked brand-native telemetry bars rather than a map. City is deliberately not queried or exposed because its apparent precision is not reliable enough for this decision surface. Duplicate normalized country labels are combined before display.
- Raw GA4 active-user country counts must not be compared with or presented as the Firestore registered-rider total: GA4 includes anonymous/pre-registration activity, and a person active in multiple countries can contribute to multiple country rows. The chart therefore normalizes the country rows into a 100% distribution and displays percentages only. It remains explicitly labelled as aggregate, consent-dependent GA4 geography; it cannot exclude internal/test accounts or join geography to named/pseudonymous riders, and GA4 privacy thresholding may suppress small rows.

## 2026-07-15 — MLB totals model: revive with WC26 discipline (D-SITE-007)
Reviving the abandoned Aug-2025 MLB over/under (main total) work using the WC26 anti-fabrication pattern. User goal: **correct Over/Under outcome, either/or — NOT value.** Full spec: `planning/MLB_TOTALS_MODEL_SPEC.md`. Proposed route `/apps/stea/mlb`, tenant-gated, mirrors WC26 architecture.
- **Diagnosis of why the 2025 build died** (from the archived `mlb/` folder): the data sources were right (MLB Stats API, The Odds API, OpenWeatherMap) but the *method* was the disease — ChatGPT hand-tuned magic constants fit to a 7-game losing streak (`Yankees +1.0`, `hot weather +0.4/+0.7`, `Rogers Centre flip`), "61.5% LOCKED PROFITABLE" claimed over **26 games** (coin-flip noise), 100% Under bias patched with team fudge-factors, and v2→v7c version thrash with no forward record as arbiter. Same disease as WC26 Phase 1 fabrication, worse form. **All 2025 model code and every hand-set constant discarded.**
- **Founding rules inherited from WC26** (DEC 2026-06-21): no fabricated data ever; results = pinned structured source (MLB Stats API, official, no key), no LLM/web_search; no hand-set team/venue constants (every adjustment must be derived from a full-season deterministic fit or it does not exist); forward record is the only scorecard; fail-closed on missing pitcher/line.
- **Backtest decision (user, 2026-07-15):** backtest against **actual final totals only, no market line** — the archive had real market totals for only ~12 games (too few); MLB Stats API gives unlimited real finals. Weather **out** of v1 (it was a top source of the old hand-tuning). SoRR home = this file + a future `MLB_MODEL_STATE.md`.
- **First real result (walk-forward, 1,953 of 1,994 real 2025 finals, Apr–Aug, zero look-ahead):** team-rate model MAE **3.63 runs**, calibration **47.2%** actual-over-model (near-ideal 50%, **no Under bias** — the key structural win over 2025). BUT the model beats the naive "always predict league mean" baseline by only **0.02 runs (3.63 vs 3.65)** — i.e. season team-offense rates carry almost no single-game signal; MLB game totals are variance-dominated (SD ~4.5). **This is the true number the fabricated 61.5% hid.** Points at starting pitching as the dominant omitted signal (every archived explosion was a pitcher/bullpen event). Pitcher lever not yet tested (needs a probable-pitcher ID resolution pass).
- **Pitcher signal test (2026-07-15, walk-forward, 1,953 games, real season pitcher ERA for all 337 starters, 100% probable-pitcher ID coverage):** starting pitcher IS the dominant lever, as the archive's failure log implied. Team+pitcher MAE **3.560** vs team-only 3.629 vs naive 3.641 — pitcher adds ~4× the team-only improvement. **The metric that matters (user goal = correct Over/Under side, either/or):** correct-side accuracy vs a balanced fixed line of 8.5 (actual went Over 49.3% — a genuine coin-flip line) = **team+pitcher 58.2%** vs team-only 53.0% (+5.2 pts from the pitcher signal). On unbalanced lines (7.5, 9.5) the model only marginally beats the always-one-side default, as expected.
- **Verdict: real, buildable signal.** Crosses from "no signal" (team-only ≈ league mean) to meaningful (pitcher-driven ~58% on the fair line). **Two stated caveats before believing it:** (1) mild leakage — pitcher ERA is season-final, includes post-game-date games; must refine to as-of-date ERA (game logs) which is the next step and likely *more* predictive, not less; (2) 58% vs a static 8.5 line ≠ 58% vs the live bookmaker line, which moves per game to balance — this proves model skill at separating high/low games, NOT yet beating a live market line.
- **AS-OF-DATE refinement (2026-07-15) — THE decisive test.** Re-ran with each starter's runs-rate computed from ONLY their appearances dated strictly before the game (real 2025 game logs for all 337 pitchers, shrunk by starts-so-far toward league prior — zero leakage; also handles thin early-season form). Result on the balanced 8.5 line: **50.6%** correct-side (50.3% excluding first 3 weeks) — vs the leaky season-final-ERA version's 58.2%. As-of pitcher MAE 3.642 is WORSE than team-only 3.629 and no better than naive.
- **VERDICT: no genuine edge.** The apparent pitcher signal was almost entirely **look-ahead leakage** — a pitcher's season-FINAL ERA partly encodes how the very games being predicted turned out. With only prior information, correct-side collapses to a coin flip (~50%) on a fair line. **This is exactly why the 2025 ChatGPT build "had promise then died": its backtest was leaky (looked ~61%), and live — with only prior info — it was a coin flip.** We reproduced the full rise-and-fall honestly in one session. MLB game totals are variance-dominated; neither season team rates nor as-of-date starter form beat the market/mean at the single-game level in this data.
- **Recommendation: do NOT build `/apps/stea/mlb` as a predictive model.** There is no honest edge to ship. The disciplined negative result is the deliverable. Options if revisited later: (a) bullpen/lineup/park micro-signals with the SAME as-of-date rigor (likely also marginal), (b) reframe as a transparent "model total vs market line" *information* tool with no predictive claim, (c) drop it. The WC26 anti-fabrication + as-of-date-no-leakage method is the reusable asset — it correctly killed a mirage that fabricated confidence had kept alive.
- **DECISIVE TEST vs REAL closing line (2026-07-15).** Obtained a real full-season dataset via Kaggle (`oliviersportsdata/mlb-multimarket-sample-2024`: 2,465 real 2024 MLB games with actual closing totals from 9 sportsbooks + scores + pitchers — the historical-odds gap the archive couldn't fill). Ran the walk-forward team-rate model's total vs the 9-book consensus closing line, grading correct Over/Under side on 2,319 games (107 pushes excluded):
  - **Model correct-side vs line: 49.7%** (all games); **50.0%** on the confident 65% of the slate (|model−line|≥0.5). Break-even at −110 is 52.4%.
  - Baselines: always-Over 49.8%, always-Under 50.2% — i.e. the real line is so well-calibrated that even naive one-side strategies are coin flips. **The model has no edge over the line; everything it knows is already priced in.**
- **FINAL VERDICT: no exploitable edge in team-rate or as-of-date-pitcher MLB totals against a real closing line.** The 2025 "61.5%" was leakage/small-sample fabrication; the honest number vs a real line is ~50%. This is the definitive negative result the 2025 build never obtained. **Do not build a predictive `/apps/stea/mlb`.** Any future attempt must clear this same real-line bar (>52.4% walk-forward, no leakage) before it is worth anything — micro-signals (bullpen/lineup/park/umpire) can be tested on the exact rig built here, but the prior is strongly that the line already contains them.
- **Reusable assets produced (scratch only, not committed):** clean MLB Stats API ingest (finals + probable-pitcher IDs + dated game logs), a no-leakage walk-forward backtest harness, and now a real closing-line dataset + model-vs-line grader. This IS the "foundation" — a signal-testing rig that honestly kills mirages in an afternoon. Forward plan (user, 2026-07-15): start snapshotting live Odds API closing totals daily to grow an honest forward record if revisited.
- **OPEN→CLOSE movement test (2026-07-16)** — the one genuinely positive market finding, with its catch. Pure market data, 2,465 real 2024 games (opener + 9-book closing consensus): the close IS sharper than the open (MAE 3.320 vs 3.357); "follow the move" graded at the OPENER hits **57.7%** (60.6% on moves ≥1.0), symmetric across directions — the soft-opener/closing-line-value phenomenon is real. **Catch: it's hindsight** — the move is only knowable after the opener price is gone. Exploiting it requires predicting the move at open time or real-time steam-chasing infrastructure (books limit/ban for it).
- **Can OUR model exploit the soft opener? NO (2026-07-16).** Walk-forward model vs the opener line: **50.0%** (1167-1166). Move prediction: model agreed with the subsequent move direction only **45.6%** (477/1047) — if anything anti-correlated, consistent with the model holding stale season-rate info the sharp money has already priced past. (Explicitly NOT inverting that signal — that would be the overfit trap.) **The line is moved by information we don't have** (lineups, injury news, sharp models, live weather) arriving between open and close.
- **Complete, coherent picture:** open is soft → informed money sharpens it by close → our season-rate data contains none of that information → coin flip for us at every price point (49.7% @ close, 50.0% @ open, 45.6% move prediction). Remaining honest candidates if ever revisited: FIP/xFIP pitcher metrics on the rig, bullpen-fatigue as-of-date, lineup-timing forward record, or real-time steam infrastructure (out of scope). Forward odds collection should capture OPENERS as well as closes if built.
- Status: investigation complete, definitive negative result for our data; soft-opener phenomenon documented as real but unexploitable without real-time information infrastructure. Spec + full diagnosis in `planning/MLB_TOTALS_MODEL_SPEC.md`. No repo code, no app, nothing committed. Scratch analysis + Kaggle data in session scratchpad only.
- **Follow-up (2026-07-16): line-movement observational study SPEC'D.** `planning/MLB_LINE_STUDY_SPEC.md` — a research instrument (explicitly NOT a betting model, no predictions/picks/LLM) to collect what history can't buy: sequenced pre-game line snapshots + timestamped game events (lineups, scratches), to measure what moves the MLB total, by how much, how fast.

## 2026-07-16 — MLB Line-Movement Study collector BUILT (D-SITE-008)
Approved and built the observational collector from `planning/MLB_LINE_STUDY_SPEC.md`. **Research instrument, NOT a betting model** — no predictions, picks, EV claims, or LLM anywhere. Purpose: measure how pre-game information (lineups, scratches, sharp money) moves the MLB total — the horse-racing overnight-odds-vs-SP phenomenon, with timestamps. Follows the D-SITE-007 arc which proved no exploitable edge exists in our data at any static price point, but that the open→close move is real and information-driven.
- **Code:** `functions/mlb/service.js` (CJS, mirrors `functions/wc26/service.js` conventions — shared `admin`, tenant const, fail-closed, no fabrication). Wired in `functions/index.js` with firebase-functions **v1** scheduled exports, all `America/New_York` (DST-safe).
- **Schedules:** non-close passes `0 9,15,17,23` + close passes `30 12,21` and `15 18` (survive budget throttle) = 7 odds passes/day; free MLB event poll `*/30 9-22`; finalizer `30 3`. Each odds pass = 1 credit (shared `WC26_ODDS_API_KEY`); free MLB-schedule gate spends nothing on off-days; burst snapshots capped 3/day; hard budget guard reserves 50 credits for WC26. ≤310 credits/month worst case.
- **Collections (rules added, client read-only, Functions-write):** `mlb_games`, `mlb_line_snapshots`, `mlb_game_events`, `mlb_meta/collector`. One composite index added (`mlb_line_snapshots`: gameId ASC + capturedAtIso DESC) for the finalizer's close-line lookup.
- **Verified:** live Odds API path returns real MLB totals (9-book consensus); pure fns (`consensusTotals`, `gameKey`, `median`/`medianLine`) unit-tested incl. edge cases (absurd-line reject, malformed reject, split-line prices). **Caught + fixed a real bug pre-deploy:** the totals-line range gate (4–18) was baked into the shared `median()` and wrongly filtered out decimal *odds* (~1.9), nulling all consensus prices — split into pure `median()` + `medianLine()`. `mlb/service.js` lints clean; index.js schedule blocks match existing WC26 house style.
- **NOT YET DEPLOYED / NOT COMMITTED.** Needs `firebase deploy --only functions,firestore:rules,firestore:indexes` (user action) + a 3-day soak against `mlb_meta/collector` to verify cadence, burst cap, budget guard, off-day skip, doubleheader handling. Analysis scripts at the ~8-week mark are a separate approval. Data collection captures ~2.5 months of 2026 regular season + postseason; full season from 2027-04.

## 2026-07-18 — MLB collector: `status_change` duplicate-event bug found + fixed
Deployed and running since 2026-07-16; first data review (46 games, 293 line snapshots, 127 events, 15 finalized) surfaced a real bug in `pollGameDataImpl` (`functions/mlb/service.js`), not signal.
- **Bug:** the poller (line ~330) diffed `curStatus` (today's live MLB status) against `prev.status` on the game doc to emit `status_change` events, but never wrote the newly-observed status back — only `tracking` and `updatedAt` were persisted. `prev.status` therefore never advanced between 30-min polls; every tick re-diffed against the same stale value until an unrelated function (`snapshotLinesImpl` or `finalizeDayImpl`, which write `status` for other reasons and run far less often) happened to overwrite it. Confirmed on gamePk `824414` (Pirates @ Guardians, postponed 07-17 → resumed/completed 07-18 per MLB's own `rescheduledFrom` field): 21 duplicate `status_change` events logged for what should have been ~2–3 real transitions (`Preview→Live→Final`, plus the one genuine reschedule-related flip).
- **Fix:** `pollGameDataImpl` now writes `status: curStatus` (only when `curStatus` is truthy, to avoid an `undefined`-valued field write) alongside `tracking` on every poll, so the stored status always reflects the last-seen value and the diff only fires once per genuine transition. One-line root-cause fix, no schema change, no backfill.
- **Known contamination window:** `mlb_game_events` rows with `type: 'status_change'` logged between 2026-07-16 (build) and this fix (2026-07-18) may contain duplicate/inflated counts for games that were postponed, suspended, or otherwise re-polled across a status write from another function. `lineup_posted` and `pitcher_change` events are unaffected (they gate on `tracking`/ID-diff, not on this status field). Do not treat `nEvents`/`status_change` counts from this window as clean when running the eventual move-attribution analysis (§5 of `MLB_LINE_STUDY_SPEC.md`) — filter or flag pre-fix data if it lands in that 8-week sample.

## 2026-07-19 — MLB collector: line-only analysis was answering the wrong question; added T-2h correct-side grading (D-SITE-008 follow-up)
Reviewing the first 3 days of collected data, the initial readout only measured half-run **line** movement (opener→close delta), which showed 45% of games with zero movement. User correctly flagged this as the wrong lens — books move the **price** (juice) far more often and more granularly than the sticky half-run line; the line-only view systematically undercounts the pre-game information effect the study exists to observe. Re-running on de-vigged implied P(Over) (`1/overDec` and `1/underDec` normalized to sum to 1) showed real price drift (up to 7.4pp swings in P(Over)) even in games where the line never moved.
- **Follow-on question (user, 2026-07-19):** not "does the market or our old model beat the closing line" (D-SITE-007 already answered that: no, ~50%) but **"if we pick using all data available 2 hours before first pitch, what's the correct-side hit rate against the real final score"** — an accuracy question, not a value/edge claim.
- **Constraint:** no historical dataset with intraday (T-2h) odds snapshots exists to test this retroactively — historical odds sources only have open/close. This can only be measured prospectively, using the live collector now running. There is no shortcut; the study was built for exactly this.
- **Built:** `buildT2hPick(snap, finalTotal)` (pure fn, `functions/mlb/service.js`) — at finalize time, finds the line snapshot closest to (but within 100–140 min of) first pitch, computes de-vigged P(Over) from that snapshot's consensus price, records which side the T-2h market favored, and grades it against the real final total (push excluded from correct/incorrect). Stored as `t2hPick` on each `mlb_games/{id}` doc. No model — this is the T-2h **market's own price** as the pick, since no team-rate/pitcher engine exists in this repo (D-SITE-007's engine was scratch-only, never committed; see 2026-07-15 entry). Zero new API cost — reads snapshots already being collected.
- **First read (n=9 games with a valid T-2h snapshot so far): 5/9 correct (55.6%).** Explicitly noise at this sample size (95% CI roughly 21–86% on n=9) — not a result, just confirmation the mechanism computes correctly. Accumulates automatically every night via `finalizeDayImpl`; needs many weeks of games before this number means anything.
- **Deployed:** `firebase deploy --project stea-775cd --only functions:mlbFinalizeDay`.

## 2026-07-19 — MLB study: rebuilt around opener-vs-T-2h pick comparison; fixed T-2h snapshot coverage gap (D-SITE-008 follow-up 2)
User feedback (2026-07-19): the previous readout still centered the line-movement cards/table (opener/latest/move) with the T-2h pick bolted on as one column — backwards. **The pick comparison is the point of the page**, not a footnote: what was the pick at open, what was the pick at T-2h (with starting pitchers as known at each point), was each correct, and did revising the pick at T-2h actually help vs. hurt vs. do nothing.
- **Generalized `buildT2hPick` → `buildPick`** (pure fn): same logic (de-vigged P(Over) from any snapshot's consensus price, graded against the real final total), now applied symmetrically to both the opener snapshot and the T-2h snapshot, producing `openerPick` and `t2hPick` on each game doc.
- **Added `buildRevisionOutcome(openerPick, t2hPick)`** (pure fn): compares the two picks — `unchanged` (same side both times), `improved` (picks differed, T-2h side was correct), `worsened` (picks differed, opener side would have been correct). This is the actual metric requested: did waiting for T-2h information help.
- **Added starting-pitcher-at-each-point capture.** `opener.pitchers` is now frozen at the moment the opener snapshot is first written (`snapshotLinesImpl`). `pitchersAsOf(openerPitchers, pitcherChangeEvents, cutoffIso)` (pure fn) reconstructs who was probable for each side at the T-2h snapshot's timestamp by replaying `pitcher_change` events up to that time — MLB's API only exposes "current" probable pitcher, not point-in-time history, so this is derived from our own event log, not fabricated. **Known limitation:** games whose opener was captured before this deploy have no `opener.pitchers` (the field didn't exist yet when their opener was set) and can never retroactively get it — this affects all games tracked 2026-07-16 through this deploy. Only games first seen after this point have complete pitcher-at-open data.
- **Found + fixed a real coverage gap, not a display bug:** manually re-triggering the finalizer showed only ~3 of 15 games had a valid T-2h snapshot (100–140 min pre-first-pitch). Root cause: the original 7 fixed-clock odds passes (09:00/12:30/15:00/17:00/18:15/21:30/23:00 ET) were designed for open/mid/lineup/close attribution coverage of the whole slate, not for landing inside a 100–140-min window for every individual game — first pitches range ~13:05–22:15 ET, so most games' T-2h moment falls between fixed passes.
- **Fix: `mlbT2hCheck`** (new scheduled function, `*/15 12-23 * * *` NY, `functions/index.js`). `t2hCheckImpl` does a **free** Firestore read of today's `mlb_games` for any non-final game currently 100–140 min from `scheduledFirstPitch` with `t2hSnapshotTaken` not yet set; only if at least one exists does it call `snapshotLinesImpl` (1 Odds API credit, same as any other pass — The Odds API returns the whole slate per call, so this is NOT a per-game cost, one call covers every in-window game simultaneously). `snapshotLinesImpl` now sets `t2hSnapshotTaken: true` on any game whose snapshot lands in that window, so the checker stops re-triggering for it. Verified live: manual trigger correctly skipped (no game in window at that moment; nearest was 152 min out) — spent nothing, exactly as designed.
- **Budget:** worst case adds ~1 credit per game per day (not per 15-min tick — the free check absorbs the polling cost), well within the existing ≤310/month ceiling; subject to the same `RESERVE_CREDITS` throttle as all other passes.
- **Page rebuilt** (`MLBClient.js`): pick-vs-actual table (date, matchup, SP at open, SP at T-2h with a "changed" flag, opener pick, T-2h pick, actual, revision outcome) is now the primary content. A summary panel above it shows opener-pick accuracy, T-2h-pick accuracy, revision helped/hurt/unchanged counts, and how many games had a pitcher change before T-2h. Upcoming-games list and collector health both demoted below the pick table (collector health now collapsed by default).
- **Deployed:** `firebase deploy --project stea-775cd --only functions:mlbFinalizeDay,functions:mlbSnapshotLines,functions:mlbT2hCheck`.

## 2026-07-20 — MLB study: separated ungradeable finals from the pick record (D-SITE-008 follow-up 3)
User flagged that the picks table "updated but the top performance component didn't". Investigated against live Firestore (`mlb_games`, tenant `FqhckqMaorJMAQ6B29mP`): 30 finalized games, but only 12 have any built pick (`openerPick`/`t2hPick` with a `side`); the other 18 are dated 2026-07-16/17 (plus postponements) and have **zero line snapshots** — the collector only began capturing pre-game lines on 2026-07-18, so those games got a real `finalTotal` but can never be pick-graded. This is the same "known limitation" recorded in follow-up 2, surfacing in the UI. **Not a rendering bug:** the summary and table read the same `graded` set and the same fields; the table simply gained 18 all-`—` rows that contribute nothing to the summary, so the numbers correctly barely moved. The summary header also mislabelled the sample as "(30 graded games)" when only 12 are pick-graded.
- **Fix (client-only, read-side, `MLBClient.js`):** the finalized set is now split into `pickGraded` (has a real opener or T-2h pick) and `ungraded` (final total but no snapshot-derived pick). The "Picks vs actual" table and the summary panel both drive off `pickGraded` only. Ungradeable finals move to a new "Final — not graded" section (date / matchup / actual total) with a one-line explanation that no pre-game lines were captured before 2026-07-18. Summary header relabelled "(N pick-graded games)".
- **No functions/data/schema change; no backfill** — the 18 games are permanently ungradeable (their snapshots never existed and cannot be reconstructed). Verified the split against live data: pickGraded 12, ungraded 18; summary unchanged (opener 5/9, T-2h 1/3, revision 0 helped/1 hurt/0 unchanged) — pushes keep a game in the pick table but are correctly excluded from the accuracy fractions. Deploy = git push to main (Vercel); no `firebase deploy` needed.

## 2026-07-21 — MLB study: fixed clean-window cutoff + de-noised the page (D-SITE-008 follow-up 4)
User asked to reduce visual noise and focus the record on the clean data window. Line capture only reached full slate coverage on **2026-07-18** (07-16/17 games finalized before it began); the full ungradeable-finals table and a set of postponed 07-17 games stuck permanently in "Upcoming" were cluttering the page.
- **Clean-window constant `STUDY_START_DATE = '2026-07-18'` (`MLBClient.js`).** The Forward-record panel and the "Picks vs actual" table now count only games finalized on/after this date that also have a real pick — decision confirmed with user (07-18 onward, not 07-20 strict, since 07-18/19 already have near-full coverage; keeps ~42 graded games vs ~15). Header now reads "Forward record · since 2026-07-18 (N pick-graded games)".
- **Ungradeable finals collapsed to a single muted line** ("N earlier games excluded — finalized before full line capture began on 2026-07-18…"); the full `UngradedList` table (added in f/u 3) is removed. Data remains in Firestore, just not surfaced as a table.
- **Stuck "Upcoming" games aged out.** `STALE_UPCOMING_MS = 24h`: a non-final game whose `scheduledFirstPitch` is >24h in the past (postponed/suspended, never re-reported Final by MLB — the 07-17 rain batch) is dropped from the Upcoming list. Genuinely upcoming and recently-started-awaiting-finalize games are unaffected.
- **Client-only, read-side; no functions/data/schema change; no backfill.** Verified against live data: pickGraded 42 (dates 07-18/19/20), excluded note = 19, Upcoming 30→15 (only the truly-stuck games removed; kept games all have first pitch within the last 24h awaiting the nightly finalizer). Record shown: opener 13/35, T-2h 14/26, revision 4 helped/2 hurt/14 unchanged. Deploy = git push to main (Vercel).


## 2026-07-24 — MLB study: bet-selection & forward-EV method sketched ahead of any staking (D-SITE-008 follow-up 5)
User asked how betting on predictions would work — whether a bet is required on all games or only certain ones. Answer: **never all games; selectivity is the entire point.** Betting the full slate pays the ~4.5% vig on ~15 games/night against a ~50%-accurate-by-construction market — a guaranteed slow loss. The study's job is to find whether a **pre-defined condition** carves out a subset that beats the -110 breakeven (52.4%) **forward and out-of-sample**; a real edge in MLB totals, if any, is thin and rare (~0–4 games/night, some nights zero). The likeliest honest outcome — per the D-SITE-007 precedent — is that no filter clears the bar and the answer is **bet nothing**, which is a successful result.
- **Written:** `planning/MLB_BET_SELECTION_SPEC.md` — the go/no-go **method**, fixed in advance so the evaluation is not backfit. Nothing built, nothing authorised, no bet implied. Key points: (1) **pre-registration** — a selection filter and its thresholds are frozen *before* being scored on the games it selects; a rule found by searching the data is backfit until it survives forward on unseen data. (2) **Accuracy is necessary but not sufficient** — you bet into a *price*, so a 53% pick at -120 still loses; the decision must be made on **realized EV at the actual price**, which requires logging per-pick `priceDecimal/priceAmerican/book` (already present in snapshots) and computing `pnlUnits`. (3) **Five go/no-go gates**, all required: accuracy > breakeven at real odds, EV positive after vig, sample large enough that the 95% CI lower bound clears breakeven (~250+ selected bets for a 55% edge), edge stable across a held-out split, and robust to worst-book pricing / missed closes. (4) **Fractional Kelly** staking only if all gates pass — never full Kelly, Martingale, or "due" reasoning.
- **No code, no schema, no deploy.** This changes no running behaviour. The only near-term build (separate approval, when contemplated) is extending `finalizeDayImpl` to log per-pick price + `pnlUnits` and adding a read-only EV column to the viewer. Filter registration + gate evaluation happen at a sufficient forward sample (season-end likely, not weeks), written to a future `MLB_BET_SELECTION_FINDINGS.md`. Any actual staking is its own separate, explicit approval.

## 2026-07-26 — WC26 closing-odds cron left running after tournament end, drained MLB's shared Odds API quota (D-SITE-010, incident)
> Renumbered 2026-07-28: originally authored as D-SITE-009 on `codex/promo-campaigns`, but that commit never reached `main` and D-SITE-009 was independently assigned to the SoRR entry above. This incident is D-SITE-010.
MLB dashboard showed `OUT_OF_USAGE_CREDITS` (0 credits left) despite MLB's own budget guard reporting only 3 odds calls / 3 bursts used that day — MLB was well inside its own limits. Root cause: MLB (`functions/mlb/service.js`) reads `process.env.WC26_ODDS_API_KEY` — it was never given its own key, so MLB and the WC26 value engine share one the-odds-api.com credit pool. `snapshotWc26ClosingOdds` (`functions/index.js`, `every 1 hours`) was still enabled a full week after the World Cup finished, with no season-end shutoff ever built in. Its own in-route budget gate (`src/app/api/stea/wc26/snapshot-closing/route.js`) only skips the actual API call when no ungraded prediction has a fixture inside a 75-min kickoff window — it does not know or care that the tournament is over, so it kept evaluating (and, whenever any ungraded/unknown-kickoff prediction existed, spending) hourly, consuming the shared pool MLB depends on down to zero.
- **Fix (this commit):** disabled `exports.snapshotWc26ClosingOdds` in `functions/index.js` (commented out, not deleted, with a dated note) — WC2026 is over, there is nothing left to snapshot. `refitWc26Ratings` (24h) and `syncWc26Predictions` (6h) were checked and confirmed Firestore-only (no Odds API calls) — left running as-is.
- **Not yet done:** redeploy (`firebase deploy --only functions:snapshotWc26ClosingOdds`, user action) to actually stop the scheduled invocations in production — this commit only changes source; **the cron keeps firing hourly in production until deployed.** Separately worth deciding: give MLB its own dedicated Odds API key instead of sharing `WC26_ODDS_API_KEY`, so a future one-off tournament engine can never again starve MLB's quota. Not done in this commit — needs a new the-odds-api.com signup, a decision on which env var name to use, and confirmation of MLB's actual monthly credit need.
- **Lesson:** any cron built for a finite/seasonal event (a tournament, an event window) must ship with an explicit end condition or hard stop date from day one — "gate on data" is not the same as "know the season ended." Apply this to any future one-off event-driven schedule in this repo.
- **Deployed same session:** `firebase functions:delete snapshotWc26ClosingOdds --region us-central1` — removed from production, no longer scheduled. Listing deployed functions during this cleanup surfaced two more stale WC26 schedules with no trace left in the current `functions/index.js` source: **`pullWc26Odds`** (every 6h, called `/api/stea/wc26/odds-api` directly — an odds-API-spending cron orphaned since commit `75c30bd` replaced it with `snapshotWc26ClosingOdds`, but never deleted from the deployed project, so it had been silently burning credits on its own schedule this whole time on top of the incident above) and **`refreshWc26GoldenBoot`** (every 12h, pinned openfootball scrape, no LLM, no odds-API cost — just stale compute). Both confirmed absent from source via `git log -S`, then deleted the same way: `firebase functions:delete pullWc26Odds --region us-central1` and `firebase functions:delete refreshWc26GoldenBoot --region us-central1`. **Orphaned deployed functions are invisible to a source-only review — `firebase functions:list` against the live project is the only way to catch drift between what's deployed and what's in `functions/index.js`; worth doing periodically, not just when chasing an incident.**
- **Follow-up — dedicated MLB odds key provisioned (same day):** new the-odds-api.com key created for MLB exclusively, stored as `MLB_ODDS_API_KEY` in `functions/.env` (gitignored, not committed). `functions/mlb/service.js` (`snapshotLinesImpl`, both the read at the top of the function and the "not set" error path) repointed from `process.env.WC26_ODDS_API_KEY` to `process.env.MLB_ODDS_API_KEY`. MLB and WC26 no longer share any credit pool — a future WC26-side leak (or any other consumer added to that key later) can never again silently starve MLB's collector, and vice versa. Requires `firebase deploy --only functions:mlbSnapshotLines,functions:mlbSnapshotLinesClose,functions:mlbSnapshotLinesCloseNight,functions:mlbT2hCheck` to take effect in production.
- **Source/production drift found 2026-07-28 (health check):** the deployed `mlbSnapshotLines` was updated 2026-07-26T19:59Z — *before* this commit was authored at 21:01Z — and its env holds both `MLB_ODDS_API_KEY` and the legacy `WC26_ODDS_API_KEY`. Production was therefore already running the new key and healthy (483 credits, `lastError: null`, snapshots landing daily), while `main`'s source still read `WC26_ODDS_API_KEY` because this commit only ever existed on `codex/promo-campaigns`. The stale key still being present in the deployed env is why nothing broke. Porting this commit to `main` closes the drift; **the next `firebase deploy --only functions` from `main` would otherwise have re-uploaded the old code and re-enabled the hourly WC26 cron.** Reinforces the lesson above: `firebase functions:list` (and `gcloud functions describe` for env vars) against the live project is the only source of truth for what is deployed.

## 2026-07-28 — SoRR classification made fail-closed; policy-engine halt still OPEN (D-SITE-009)
The repo CLAUDE.md has required fail-closed SoRR enforcement since the 2026-05-21 breach (24 app users' email addresses sent to each other). The code did not implement it, and the gap was never on `main` — it sat uncommitted on `codex/promo-campaigns`, so production has been running the weaker advisory behaviour.
- **`src/lib/sorr/controlui.js`** — `classifyPromptLocal` threshold raised 0.6 → **0.75**, blocking unconditionally below it. The 0.6–0.75 "proceed with low-confidence warning" band is removed; scores in that range return a distinct reason stating the advisory path is disabled. Route `blocked`, tier 4. This is the change that actually alters behaviour: the function is pure and both callers (`api/sorr/controlui/requests/route.js:182`, `lib/sorr/controlui-server.js:87`) consume its return value synchronously.
- **`src/lib/sorr/poc-analysis-documents.js`**, **`public/docs/sorr/sorr-control-v0-spec.md`** — primer and v0 spec still documented the advisory band. Updated so docs match behaviour.

### OPEN — policy engine does not halt anything (do not mark SoRR fail-closed until fixed)
A drafted change to `src/lib/orbit/policyEngine.js` (throw on violation instead of returning a list) was **deliberately not committed**. It would have been cosmetic: the sole caller, `src/app/api/orbit/events/route.js:120-122`, invokes it fire-and-forget —
```js
import('@/lib/orbit/policyEngine').then(({ checkEventPolicies }) => {
  checkEventPolicies(event).catch(console.error);
});
```
— *after* the event is already written to Firestore and with the HTTP response returned regardless. A thrown error lands in `.catch(console.error)` and becomes a log line; the event still persists. Making violations genuinely halt processing requires awaiting the check **before** the write and failing the request on violation, which is a change to the events route and needs its own evidence/plan/approval cycle. Until that lands, the policy engine is advisory in practice regardless of what it returns.

## 2026-08-03 — MLB collector orphaned 1-2-day-ahead games, corrupting the opener record (D-SITE-011)
Routine data review found 24 `mlb_games` docs with `gamePk: null`, `status: null`, `venue: null` — ~8% of the collection, none gradeable. **Root cause:** `fetchSchedule` (`functions/mlb/service.js`) fetched the MLB Stats schedule for a **single day**, but the Odds API returns events **1-2 days ahead**. Verified live 2026-08-03: MLB schedule for that date = 8 games; odds feed = 8 events, 3 that day and **5 the next**. Unmatchable events did not reject — `gameKey()` fell back to a matchup slug and the doc was stamped with the **collection** date, not the game's own date. Every unmatched doc had a first-pitch lag of 1-2 days; every matched doc 0-1. All 30 team names resolve correctly elsewhere, so this was never a naming mismatch.
- **Severity — not just miscounting:** 17 of the 24 orphans hold the **true opener** for a real game. When the game's own day arrived it got a fresh correctly-keyed doc whose "opener" was the *second* sighting, hours later, after the line had moved; **7 of those 17 have a materially different opener line**. 17 of 187 graded games (~9%) therefore carry a late opener. The opener archive is the study's Q4 deliverable and feeds the D-SITE-007 45.6%-fade question, and a systematically late opener biases it toward the close. `t2hPick` and close are unaffected (grading requires a gamePk, so orphans never entered the record). This also explains observed T-2h coverage gaps: `t2hCheckImpl` queries `where('date','==',todayNY())`, so misfiled docs were invisible to it.
- **Fix (this commit), three parts:** (1) `fetchSchedule` takes an optional `throughDate` and uses `startDate`/`endDate`, so the odds pass indexes **today..+2d** — still one free MLB Stats call, no odds-credit cost. (2) The schedule index is keyed on **matchup + NY game-day** (`byPairDay`) and resolved against the odds event's own `commence_time`; a bare matchup key would collapse a 3-game series to its last fixture and mis-assign the earlier ones. Docs are filed under `dayNY(firstPitch)` — the day the game is *played* — never the collection date. (3) **Fail closed:** an unresolved matchup now increments `rejected`/`unmatched` and writes nothing, instead of creating a gamePk-less doc. `unmatched` is surfaced in `mlb_meta/collector` (`lastUnmatched`, `lastRunNote`) — the previous `lastUnmatched: 0` was never written by this path, which is how the fault hid for 19 days.
- **Verified against live APIs before deploy:** new logic matched **15/15** odds events; the old single-day logic matched **12/15**. 38 games across the 3-day window produced 38 unique keys (no series collisions). `eslint mlb/service.js` exits 0.
- **Not in this commit — historical backfill.** The 17 orphans holding true openers are a separate, dry-run-first repair (copy the earlier opener onto the real doc, re-grade `openerPick`, then delete orphans). Mutating collected research data needs its own reviewed diff; until it runs, the opener record before 2026-08-03 retains the late-opener bias described above and any analysis must state that.
- **Lesson:** the collector's own health doc reported `lastError: null` and `0 rejected` throughout — a fault that manifests as *silently well-formed but unjoinable* data is invisible to error-count monitoring. Coverage/consistency checks (does every doc carry the key it needs to be gradeable?) belong alongside error checks for any ingest that joins two independent feeds.

## 2026-08-16 — MLB closing line was recording in-play prices; 288 of 408 finals wrong (D-SITE-014)

**Definition, recorded because its ambiguity is what let the bug hide.** The **closing
line** is the last price the market offered **before first pitch** — the line as the
*pre-game market closed*. "Closing" refers to the market shutting, not the game ending or
the line settling on a final value; the horse-racing analogue is SP, the price at the off.
For a 19:35 first pitch, the closing line is the total quoted at 19:34. It is emphatically
**not** a price quoted after the game starts. The field keeps the name `close` (the term is
standard and used throughout `MLB_LINE_STUDY_SPEC.md`); this definition is the fix's other
half (David, 2026-08-16).

**Root cause.** `finalizeDayImpl` (`functions/mlb/service.js`) sorted every snapshot for a
game by capture time and took the last one as `close`, with no filter on
`minutesToFirstPitch`. The code comment said "close = last snapshot before first pitch"; the
code did not implement it. The Odds API keeps pricing a game **live** once underway, so any
game whose final snapshot pass landed after first pitch had an in-play total — repriced by
runs already scored — filed as its closing line. `minutesToFirstPitch` was already stored on
every snapshot (`service.js:331`) and goes negative post-first-pitch, so the data needed to
filter correctly was present and simply unused.

**Measured blast radius** (all 408 finals, 6,971 snapshots): **288 (70.6%) held a wrong
close**; 227 of those wrong by ≥1.0 run; mean absolute error **2.36 runs**; worst `823750`
(2026-08-07) stored **17.25** vs true close **8.0**. 388 finals (95.1%) had a post-first-pitch
snapshot as their last. The error is **directional, not noise** — in-play totals mark down on
low-scoring games and up on high-scoring ones, so the corruption correlates with the outcome
being measured, the least benign shape for move analysis. **0 finals had zero pre-game
snapshots**, so every value was recoverable.

**Not affected:** `openerPick`/`t2hPick` hit rates. `buildPick()` reads snapshots directly and
never touches `close`. **Nothing corrupt was ever displayed** — `MLBClient.js` renders only the
picks (verified: it never reads `close`, `moveSummary`, `delta`, `openerToActual`). Damage was
confined to stored data awaiting the 8-week analysis, which is why it was worth fixing now.

**Fix (this commit):** close selection restricted to `minutesToFirstPitch >= 0`, taking the
last pre-game snapshot. **Fail closed** — a game with no pre-game snapshot yields `null` and
falls through to any previously stored close, never reaching for an in-play price. `moveSummary`
(`delta`, `openerToActual`) derives from `close` and is corrected by the same change.

**Backfill executed:** `scripts/mlb-backfill-close-and-ev.mjs`, dry-run reviewed first, then
`--apply`: **393 docs written, 288 closes corrected, 0 fail-closed skips**. Re-run confirms
idempotency (407 unchanged, 0 rewrites). Independent verification: **0 finals** now hold a close
differing from the true pre-game close, and **0** closes are sourced from a post-first-pitch
snapshot. 288 docs carry `closePreFixValue` + `closeBackfilledAt` + `closeBackfillNote` so the
correction is auditable and reversible; audit fields are written **once**, on first correction,
so re-runs cannot overwrite an original value with an already-fixed one.

**Not a D-SITE-011 recurrence.** The trace was opened on that hypothesis and **disproved it**:
all five traced games (824330, 823679, 823508, 823916, 824724) have exactly one game doc, one
distinct `gameId` across their snapshots, and clean single-game series. The apparent 3.5–4.5 run
"swings" were this bug. D-SITE-011's fix works and should not be reopened.

**T-2h window — decided, unchanged at 100–140 min.** The same trace found **79 of 408 finals
have no snapshot in that window** (cron gaps reach 210 min), which — not the 2026-07-19
amendment — is the real reason ungraded games kept appearing at ~0–1/day. Widening to 90–150
would recover 32. **David's decision: leave it.** The window was set before any results were
seen; loosening it after inspecting outcomes is specification drift, and even with innocent
intent it becomes impossible to show the threshold was not chosen to flatter the numbers. If
coverage is worth improving later the clean route is an extra collection pass (~30 credits/month
of a 288 balance), forward-only by construction.

**Lesson.** Two defects now (D-SITE-011, D-SITE-014) have been *silently well-formed but wrong*
data that error-count monitoring cannot see — `lastError: null` throughout both. A stored value
that is the right type, in a plausible range, in the right field is invisible to health checks.
Ingests joining two feeds need **semantic** invariants asserted (here: "close must come from a
snapshot with minutesToFirstPitch >= 0"), not just error counts.

## 2026-08-16 — MLB per-pick price + realized EV logging (D-SITE-015)

**Standing position on betting, recorded at David's explicit instruction.** **No bet will be
placed until the project reaches its end point and the five go/no-go gates in
`MLB_BET_SELECTION_SPEC.md` §5 have been evaluated and passed.** The purpose of the work **is**
to build toward a system that could, in future, inform which games are worth backing — using
data available close to first pitch, on the premise that MLB markets are less fluid pre-game
than horse-racing markets are pre-off. That goal is legitimate and unchanged; what is deferred
is *acting* on it. Recorded because it was misread in session on 2026-08-16: a forward-looking
question about future usefulness was answered as though staking were imminent, producing an
unwarranted negative characterisation of the project. Building the measurement instrument is
**not** a step toward betting sooner — it is the precondition for ever answering the question,
since per spec §5 accuracy alone can never clear the gates.

**Why needed.** Gates 2 (EV positive after vig) and 5 (survives worst-book pricing) were
**unevaluable** — the fields they need existed nowhere. A 53% pick at -120 loses money. Without
this the 8-week analysis could not produce a go/no-go answer whatever the hit rate said.

**Data availability verified, not assumed.** Sampled 400 live snapshots: **400/400 carry
per-book prices** (`books: {key: {line, over, under}}`, decimal, written at `service.js:197`),
median **9 books** per snapshot, **0** missing `under` prices, present since day one. This build
therefore makes **no new API calls** and cannot spend a credit; historical games are fully
back-computable.

**`MLB_BET_SELECTION_SPEC.md` was never on `main`** — D-SITE-008 follow-up 5 described it as
written, but it existed only on `codex/promo-campaigns` (`735b0c5`, 2026-07-24). The
pre-registered gates and filters — the things keeping the evaluation honest — were unreadable on
`main` for three weeks. **This is the second occurrence of the same failure** (see D-SITE-010's
renumbering note: work committed on `codex/promo-campaigns` that never merged), so it is a
process risk, not bad luck. **Restored verbatim** from `735b0c5` in this commit — editing it
after seeing results would destroy the pre-registration property that gives it its value.

**Built** (`functions/mlb/service.js`, pure fns, unit-tested): `toAmerican()`, `pnlUnits()`,
`buildPickEv()`. Fields exactly as pre-registered in spec §3 — `priceDecimal`, `priceAmerican`,
`book`, `impliedProb`, `stakeUnits`, `pnlUnits` — attached as `ev` on both `openerPick` and
`t2hPick` so the comparison stays like-for-like.

**Three price variants per pick** (David's decision): `best`, `worst`, `consensus`. Spec §3 says
"best available", but gate 5 demands worst-book robustness; logging only `best` flatters EV and
assumes you always get on at the top book, logging only `worst` understates it. All three makes
gates 2 and 5 directly computable and removes any later temptation to quote the flattering one.
Headline reported on `consensus`. Only books quoting the pick's **own line** are comparable — a
price at a different total is a different bet — so off-line books are excluded from selection
(`nBooks` records how many qualified).

**No-fabrication rule carried verbatim from spec §3:** a pick with no real book quote at its own
line is `ev: null`, `evGradeable: false` — counted, never imputed, never interpolated. Backfill
found **3** such picks of 378.

**Backfill executed** in the same run as D-SITE-014: **375 picks received EV**, 3 ungradeable.

**First read — F0_all null benchmark, flat 1u, no filter applied, no gate evaluated:**

| pick | variant | n | hit | pnl | roi |
|---|---|---|---|---|---|
| opener | best | 331 | 46.2% | -34.59u | -10.45% |
| opener | consensus | 331 | 46.2% | -38.76u | -11.71% |
| opener | worst | 331 | 46.2% | -42.09u | -12.72% |
| t2h | best | 304 | 52.0% | +9.17u | +3.02% |
| t2h | consensus | 304 | 52.0% | +3.55u | +1.17% |
| t2h | worst | 304 | 52.0% | -0.72u | -0.24% |

**This is the null benchmark — betting every game — and it is explicitly the thing spec §4 says
must be beaten to matter, not a result.** Read with care: T-2h at consensus is +1.17% ROI on
n=304, which at this sample is indistinguishable from zero, and at **worst-book pricing it is
already negative** — i.e. it fails gate 5 outright as an unfiltered strategy. The opener figures
being firmly negative is expected and is the vig doing exactly what it should. Note the hit rates
here (46.2% / 52.0%) differ from the previously quoted 48.5% / 54.3% because EV grading requires a
real book quote at the pick's line, a stricter population than correct-side grading. **No filter
has been registered, no gate evaluated, and no bet is implied or authorised by this data
existing.**

**Not in this build:** no filter registered or scored (F0–F5 and θ/φ must be frozen in DECISIONS.md
*before* scoring, per spec §4), no gate evaluated, no staking logic, no Kelly, no change to pick
selection or the 100–140 window. This build makes EV **measurable** and answers nothing.

## 2026-08-16 — MLB bet-selection filters PRE-REGISTERED and frozen (D-SITE-016)

Registered the filter set that will be tested, **before scoring any of it**, per
`MLB_BET_SELECTION_SPEC.md` §4. Written to `planning/MLB_FILTER_REGISTRATION.md`. This
changes no running code and authorises no bet.

**Why now:** the instrument only became complete today (D-SITE-015 made EV measurable).
Pre-registration is worthless if done after results are known, and cheap if done before —
so it happens now, at the moment scoring first becomes possible.

**Six filters registered:** `F0_all` (null benchmark), `F1_revision` (opener/T-2h sides
differ, ~44%), `F2_pmove` (|ΔP(Over)| ≥ θ, ~20%), `F3_pitcher` (starter changed by T-2h,
~2%), `F4_conf` (|P(Over)−0.5| ≥ φ, ~20%), `F5_combo` (F2 AND F4, ~5–8%).

**`F2_pmove` is the single PRIMARY filter**; the other five are exploratory-only and never
bettable on this sample (spec §4 prefers one pre-committed primary to correcting across
many). Rationale fixed in advance: the study's whole premise is that pre-game information
arrival moves the price, and F2 operationalises exactly that — it selects games where the
market demonstrably moved between opener and T-2h. F1 is a coarser proxy (a side flip is a
large move, but a large move need not flip the side), F4 measures conviction not
information, F3 at 2.2% can never reach the sample gate. Filters tested = 6, recorded;
exploratory five carry Bonferroni 0.05/5 = 0.01 and are reportable, never actionable.

**Frozen thresholds: θ = 0.0274, φ = 0.0196** — each the 80th percentile of its own
distribution over pre-registration games (n=272), selecting the most extreme ~20%.

**Thresholds were set from the predictor distribution alone. No win rate, no P&L, and no
correctness value was computed, inspected, or referenced during threshold selection** — the
calibration computed percentiles of `|ΔP(Over)|` and `|P(Over)−0.5|` and nothing else. This
is the specific discipline that keeps the test forward: the usual way to corrupt a
pre-registration is to try several θ, see which scores best, and register the winner. The
scoring machinery was never pointed at these games. Selectivity drove the choice (~2
bets/night, matching the spec's "0–4 games/night"), balanced against gate 3's ~250+ bet
requirement.

**Precision finding:** `pOver` is stored rounded to 2dp, which is too coarse to threshold —
at 2dp the entire useful θ range collapses onto 0.02/0.03. Filters therefore compute
`P(Over)` at full precision via `impliedOverProb(overDec, underDec)` on the snapshot's
consensus prices, never from the stored `pOver`. Recorded because using the rounded field
would silently distort every selection.

**Evaluation window: games finalizing 2026-08-17 or later.** The 408 games already
collected are permanently excluded from gate evaluation — they calibrated threshold scale
only and remain an exploratory sandbox. **At 9.7 games/day and ~20% selectivity, gate 3
(~250+ selected bets) needs roughly 125 slate-days — this does not conclude in 2026.**

**Reference price for gates fixed as `ev.worst`** (spec §8 open item, resolved:
conservatism). `ev.consensus` is the reported headline; `ev.best` is recorded but grounds no
go/no-go claim.

**Amendment rule, and the point of the whole document:** nothing registered may be revised
after a score is computed on post-registration data. A "better" variant suggested by a poor
result is a **new** filter with a **new** registration date, evaluated on games arriving
after it. Amending in place converts a forward test into a backfit.

**Caveat to carry into findings:** thresholds are absolute, not rolling quantiles (the
honest choice), so if the forward price-movement distribution shifts — plausible in
September/postseason — realised selectivity will drift from ~20%. The realised selection
rate must be reported alongside any result.

Standing position unchanged: no bet until the project's end point and all five gates pass.
Registration authorises nothing.
