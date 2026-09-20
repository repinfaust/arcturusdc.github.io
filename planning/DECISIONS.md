# Decisions

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
