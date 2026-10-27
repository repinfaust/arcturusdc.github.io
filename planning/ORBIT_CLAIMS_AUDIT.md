# Orbit integrity claims: audit and proposed interim wording

**Status:** shipped 2026-10-27. The three false statements were removed in D-SITE-051, and the
wording below was applied in D-SITE-052, with the SDK row removed and a ✓ only for what exists.
This list is kept as the record. The claims hold until chain v2 is live and verified
(`planning/ORBIT_EVIDENCE_CHAIN_PLAN.md` §0).
**Audited:** 2026-10-27, at the commit that adds this file.

## What the code actually does today

- **Signatures: real, with limits.** Each event is signed with HMAC-SHA256 (`src/lib/orbit/signatures.js:73-78`).
  - The secret is generated and held by Orbit, not by the organisation (`handlers/orgs.js`).
  - So a signature shows the event hasn't changed **since Orbit signed it**, as long as you trust
    Orbit. It doesn't show the organisation made the declaration, and Orbit itself could re-sign.
  - Nested values aren't covered (F2, `signatures.js:61-65`).
- **The hash chain is not a chain (F1).** `eventHash` excludes `previousEventHash` and
  `blockIndex` (`signatures.js:17`), so reordering or relinking events is not detected.
- **Snapshot hashes** use the same key-filtering serialisation (`signatures.js:103-106`), so
  nested snapshot fields aren't covered.
- **Verification** checks whatever event the caller supplies, not the stored event, and never
  checks links (F3, `api/orbit/verify/route.js`).
- **Nothing makes the store append-only.** Until D-SITE-046, any signed-in user could delete
  events, and the owner still can.
- **Key expiry isn't enforced.** `keyExpiresAt` is only displayed client-side
  (`poc/page.js:265`, `:1160`). The server never refuses an expired key.

## Public pages (no sign-in; middleware.js:36-69 doesn't protect them)

| File:line | Current | Proposed interim wording |
|---|---|---|
| `orbit/page.js:45` | "Cryptographically-Verifiable Event Ledger" | "Signed Event Ledger" |
| `orbit/page.js:46` | "Tamper-evident audit trail that sits around existing systems…" | "An audit trail that sits around existing systems. It never stores PII, only pointers, hashes, signatures and declarations. Hash-chain verification is in development." |
| `orbit/page.js:52` | "…cryptographic hashes proving integrity at specific timestamps." | "…Orbit stores pointers and a hash of each snapshot as it was recorded." |
| `orbit/page.js:58` | "Organisations declare their actions with cryptographic signatures…" | "Organisations declare their actions, and Orbit signs each declaration on receipt: profile updates, data usage, sharing events, consent changes." (The org doesn't sign; Orbit does.) |
| `orbit/page.js:239` | "**Hashes** proving data integrity at specific timestamps" | "**Hashes** of data as it was at specific timestamps" |
| `orbit/page.js:302` | "…snapshot pointer + hash proof." | "…snapshot pointer + hash." |
| `orbit/page.js:333` | "the proof layer" | "the record layer" |
| `orbit/page.js:471` | "A cryptographically-verifiable record of who did what with a user's data." | "A signed record of who did what with a user's data." |
| `orbit/page.js:507` | ✓ "**Orbit Integrity Service:** Cryptographic signing and hash chain linking for tamper-evident logs" | "**Orbit Integrity Service:** event signing today; hash-chain verification in development", without the ✓ |
| `orbit/overview/page.js:86` | "Immutable record of constraints, planning snapshot, outputs, and approvals. No data, only hashes." | "A hash-linked record of constraints, planning snapshot, outputs and approvals. No data, only hashes." |
| `orbit/overview/page.js:132` | "Stage 3: Provable Provenance" | "Stage 3: Recorded Provenance" |
| `orbit/overview/page.js:135` | "Add immutable recording to Stage 2 project." | "Add hash-linked recording to the Stage 2 project." |
| `orbit/overview/page.js:145` | "Audit-ready proof" | "Audit-ready record" |

The overview describes planned stages. So the only change there is that "immutable" and
"provable" don't claim a property nothing yet verifies.

**Outside the brief, but flagged:** `orbit/page.js:503` shows ✓ "**Orbit Logging SDK:** Open
standard for Annex IV-ready logging (Python, Node.js, Java, Go)". I found no SDK in this repo.
If there isn't one, that ✓ is the same kind of claim and should read "planned".

## Gated pages (signed-in STEa users)

These aren't the public page or the overview. But three of them state things the code doesn't do,
which is worse than overclaiming, so they're listed too.

| File:line | Problem | Proposal |
|---|---|---|
| `orbit/poc/page.js:1359-1360` | "each event's hash includes the previous event's hash". **False today** (F1) | "Each event records the previous event's hash. Linking the hashes themselves arrives with chain v2." |
| `orbit/poc/page.js:628` | "Hash chain intact - N linked events" counts events that merely *have* a `previousEventHash`. No check runs | "N events carry a link to the previous event (not verified)" |
| `orbit/poc/page.js:1126` | "✓ Hash chain intact - Immutable linked list" after a check that can't fail on relinking | "✓ This event's hash matches its contents (links not checked)" |
| `orbit/poc/page.js:1230`, `:1311` | "immutable audit trail", "immutable chain" | "signed audit trail", "linked record" |
| `orbit/poc/page.js:1267`, `:1353` | "cannot be tampered with" | "a change by anyone without Orbit's signing secret is detectable" |
| `orbit/poc/page.js:1353` | "Signatures expire after 90 days" (not enforced server-side) | "Keys carry a 90-day expiry date (not yet enforced)" |
| `orbit/poc/page.js:1374` | "External verifiers can independently verify events" (needs Orbit's secret, so not independent) | "Verifiers can check events through Orbit's verify route" |
| `AI-Act-…/page.js:1925`, `:1965`, `:2019-2021` | `tamperSignals` is **hard-coded to 0** ("Would be calculated…"), then the page says "All tamper-evident records are intact. No evidence of data tampering detected." | Remove the tile and the message until something computes them. This is the most serious item on the list |
| `AI-Act-…/page.js:1020-1027` | "Tamper-Evident Record… cryptographically sealed… proof of authenticity for regulators" | "Sealed with a SHA-256 hash of the bundle at generation time" |
| `AI-Act-…/page.js:3662` | "enterprise-grade security, cryptographic integrity, and architectural guarantees" | "security and integrity design (proof of concept)" |
| `orbit-grapheneos/poc/page.js:810-813`, `orbit-charity/poc/page.js:577` | Self-contained demos over their own mock data. `summaryIntegrity` (`grapheneos:193-199`) does compare links, but only over client-side data | Leave as is, labelled demo data. Not part of the ledger |

## Repo documents

| File:line | Current | Proposal |
|---|---|---|
| `src/lib/orbit/README.md:3`, `:10` | "cryptographically-verifiable", "tamper-evidence" | Match the public wording above |
| `src/lib/orbit/README.md:76` | "`orbit_ledger_events` - Append-only event log" | "Event log (not append-only: the owner reset deletes from it)" |
| `public/docs/sorr/sorr-control-v0-spec.md:27`, `:313` | "Append-only" | A different system (SoRR Control), outside this audit. Listed only because the search matched it |

## What lifts this

- When chain v2 is live and `verifyChain` passes on the evidence org, the public wording can
  return to "tamper-evident", **scoped**: "for the evidence ledger, verified <date>".
- The POC's v1 events stay as they are. Its copy keeps the interim wording, since v1 never chained.
