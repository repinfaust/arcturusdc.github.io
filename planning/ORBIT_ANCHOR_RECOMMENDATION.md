# Orbit: independent anchoring of the evidence chain head — recommendation

**Status:** a recommendation (D-SITE-060), waiting for David's choice. Nothing has been sent to any
external service. Written 2026-10-27, after the backfill (D-SITE-057) and verify chain mode
(D-SITE-058) were built.

## What anchoring adds

Chain v2 (D-SITE-054) detects any edit made by someone without Orbit's signing secret. It can't
stop someone **with** the secret (Orbit, or the owner) from rewriting the whole chain and
re-signing it.

Anchoring sends the head's hash to a third party, which returns a signed statement: "this hash
existed at time T". After that, nobody can rewrite any block at or before the anchored head without
the change showing, Orbit included. Once that holds, the copy can say, scoped: "head N anchored by
<service> at <time>".

Only a hash leaves Orbit. The imprint is `sha256(canonicalV2({orgId, blockIndex, eventHash}))`. It
reveals nothing about the events.

## The two options

| | RFC 3161 time-stamp authority (TSA) | OpenTimestamps (OTS) |
|---|---|---|
| **Who you trust** | The TSA and its certificate chain | Bitcoin consensus, plus whatever you use to read block headers |
| **Time to a usable proof** | Immediate: a signed token in the response | Pending for one to several hours, until a Bitcoin block includes it; then an "upgrade" step |
| **Time precision** | Seconds, from the TSA's clock | About the block time; Bitcoin timestamps allow roughly ±2 hours |
| **How anyone verifies** | `openssl ts -verify` with the TSA's CA chain, offline, using standard tools | An OTS client, plus a Bitcoin node or a block explorer (relying on the explorer brings back a trusted party) |
| **Audience familiarity** | High: RFC 3161 is the format eIDAS qualified timestamps use, and what auditors and code signing already use | Low outside crypto circles |
| **Cost** | Free public TSAs (DigiCert, Sectigo, FreeTSA). Qualified eIDAS TSAs are paid | Free public calendars |
| **Tooling here** | `openssl ts` (OpenSSL 3 is available here; macOS has LibreSSL, and Homebrew `openssl@3` if its `ts` falls short). No new npm dependency | The `opentimestamps` npm client is little maintained; or the Python `ots` client |
| **Single point of trust** | Yes, per TSA. Mitigated by anchoring with two independent TSAs | No |
| **Weakness** | A compromised or dishonest TSA could backdate | Proof is slow; verifying without trusting an explorer needs a node |

## Recommendation: RFC 3161, with two independent TSAs

**Why:**
- **It fits Orbit's audience.** Orbit is pitched at AI Act compliance, where reviewers check
  evidence with standard tools and know RFC 3161. eIDAS qualified timestamps use the same format,
  so moving to a qualified TSA later is a change of endpoint, not of design.
- **The proof is immediate.** The timeline can show "anchored" straight after a backfill or append.
  There's no pending state to track for hours.
- **Anyone can check it** with `openssl ts -verify` and the TSA's public chain, without Orbit's
  code or secret.
- **It needs no new dependency:** the script calls `openssl ts` for the query and the
  verification, and uses `fetch` for the POST.
- **The single-TSA trust problem** is answered by anchoring each head with **two unrelated TSAs**
  (proposed: DigiCert `http://timestamp.digicert.com` and Sectigo `http://timestamp.sectigo.com`;
  FreeTSA as an alternative). Backdating would then need both to collude.

**What would make OTS the better choice:** if the claim needs to hold without trusting any company,
including against a TSA compromise. OTS can be added later as a third anchor. It doesn't replace
the TSA tokens.

## Design, if approved (a separate D-SITE entry, tests first)

- **Storage:** `orbit_evidence_anchors/{orgId}__{blockIndex}` holds
  `{orgId, blockIndex, eventHash, imprint, tsa, policyOid, serial, genTime, tokenDer (base64)}`.
  - It's deny-all in the rules, written by the Admin SDK only.
  - It's separate from the chain, so anchoring never changes a block.
- **`scripts/orbit/anchor-head.mjs`** runs locally after a backfill or append. For each TSA it:
  1. reads the head;
  2. builds the request (`openssl ts -query -sha256 -digest <imprint> -cert`);
  3. POSTs it;
  4. verifies the reply against the TSA's CA chain;
  5. checks that the reply's imprint is ours and its time is within minutes of now;
  6. stores it.

  Nothing is stored unless both TSAs verify. The CA chains are committed to the repo.
- **The verify chain mode** gains `anchors`: for each anchor, whether its imprint matches the
  stored block, and whether that block is still in the chain with the same hash. The token's
  signature is checked by `openssl`, in the script and in a test with a fixture token.
- **Copy after it ships:**
  - Blocks up to N: "anchored by DigiCert and Sectigo at <time>; checkable with `openssl ts
    -verify`".
  - Later blocks: "verified by Orbit, not independently" until the next anchor.
  - The claims guard then allows "independently" only in that scoped form.

## Open for David

1. **RFC 3161 with two TSAs (recommended), or OTS, or both?**
2. **Which TSAs?** DigiCert and Sectigo (free, widely trusted), or one paid eIDAS-qualified TSA for
   regulatory weight.
3. **When to anchor:** after every append, or only on backfill and append runs? The second is
   enough while appends are manual.
