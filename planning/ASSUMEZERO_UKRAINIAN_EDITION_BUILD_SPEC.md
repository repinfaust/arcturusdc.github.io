# AssumeZero — Ukrainian edition: gated build specification

Date: 12 November 2026  
Status: **Local adult-review prototype approved by David under D-SITE-098.**
Owner: David / Arcturus Digital Consulting  
Decisions: [D-SITE-096 and D-SITE-098](DECISIONS.md)

## 1. Decision and authority

Explore a Ukrainian-led edition for children affected by Russia's invasion. David overruled G1 and G2 as prerequisites for a local adult-review prototype at `/apps/assumezero/ukraine`. UK pilot evidence and a Ukrainian partner remain pending. The override covers the local build. G3 and G4 continue to govern supervised child testing and deployment.

Discovery conversations can precede the UK pilot. Sending emails requires David's separate instruction.

Read this spec alongside the scoped approval in D-SITE-098. Missing evidence leaves the corresponding gate unmet. The prototype is draft material for adult review.

## 2. SoRR alignment and current baseline

Read with [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [DECISIONS.md](DECISIONS.md), especially D-SITE-091 through D-SITE-096. The older app brief is `~/dev/AssumeZero/truthnet-build-brief-v2.md`; its claims are constrained by D-SITE-094. The Little Fibbing SoRR under `~/dev/AssumeZero/Phaser/little_fibbing_sorr_docs/` records the historical village POC, not the HTML feed's implementation architecture.

Verified during drafting:

- The feed is `public/games/truthnet/index.html`, embedded by `src/app/apps/assumezero/play/page.js`.
- The external deck is `public/games/truthnet/cards.json`.
- D-SITE-094 records fixes for missing captions and repeated Creator tokens, plus corrected public claims. These are not outstanding work for this specification.
- D-SITE-095 and the current working files now describe v0.4.0: 20 teaching cards, REAL/FAKE/CAN'T TELL, counterexamples, revised explanations and three pre/three post assessment items with verification available. These changes arrived concurrently with this spec. Their deployment and successful pilot are not established by inspecting the working files.
- No qualifying UK learning results or committed Ukrainian partner are recorded here.
- Interface text, scoring, checking, assessment and endgame behaviour still live partly in HTML. Externalised cards are a useful starting point, not proof that the edition is only translation plus strings.

Preserve the static, browser-first, account-free model. State stays in memory. No anonymous authentication, pupil profiles, analytics, cloud saves, open chat, live AI, backend or new service. Changes to UK gameplay require their own decision; this spec does not override D-SITE-095's answer rules. Ukrainian edition proposals below take effect only through the gates.

## 3. Gate register

G0 is satisfied by recording this opportunity. **G1–G4 are unmet. D-SITE-098 waives G1 and G2 for the local prototype.** Future gate records must contain evidence links, version identifiers, named reviewers, dates, scope and an explicit decision. Keep identifiable participant records out of this repository.

| Gate | Evidence required | Acceptance owner | Permission granted |
|---|---|---|---|
| G0 — Discovery | Opportunity record and adult discovery questions | David | Research and preparation. Contact only when instructed. No child sessions or build. |
| G1 — UK learning signal | Shipped v0.4 or explicitly accepted equivalent; frozen pilot protocol; aggregate results meeting its predeclared learning criteria | David and UK education/evaluation lead | Progress to Ukrainian implementation only if G2 also passes. |
| G2 — Ukrainian partnership | Specific audience/setting and unmet need; named delivery partner; editorial, safeguarding and evaluation owners; funded capacity; approved module scope | David and authorised partner lead | Joint authorisation of an internal prototype. |
| G3 — Supervised usability | Reviewed content; technical acceptance record; facilitator materials; approved consent/assent, session and support procedures | Partner education and safeguarding leads; David for technical readiness | A small supervised pilot in the named setting only. |
| G4 — Bounded deployment | Pilot findings and changes; suitability review; approved claims; operating, funding, maintenance and withdrawal agreement | David and partner | Only the agreed audience, geography and distribution. |

### G1: learning, not only engagement

The UK protocol must fix these before outcome inspection:

- Primary learning outcome and minimum useful improvement.
- Novel assessment forms without loud=false / quiet=true shortcuts.
- Separate reporting of correct acceptance of supported claims and rejection of false claims, with an agreed limit on deterioration in accepting true claims.
- Evidence selection and appropriate uncertainty where taught.
- Immediate and delayed assessment. Proposed delayed window: 14–28 days; freeze the actual interval in the UK protocol.
- Sample rationale, recruitment, comparator if used, follow-up requirements, missing-data handling and uncertainty reporting.
- The person responsible for deciding whether the result justifies limited further testing.

Numerical pass thresholds belong to the UK protocol, not to a retrospective reading of the results. If they remain unspecified, G1 cannot pass. Replays, completion, enjoyment, a family playtest or an individual three-item score delta do not clear G1. Do not claim causal efficacy without a suitable design. A UK learning signal permits further investigation; it does not establish Ukrainian suitability.

### G2: a working partner, not an endorsement

Name people and funded time for Ukrainian authorship, educational review, safeguarding, recruitment, facilitation, evaluation, reporting and maintenance. A logo or introduction is insufficient. If these duties fall back to David without capacity, leave G2 unmet.

## 4. Purpose and audience

Teach children to pause, identify a claim, choose useful evidence, revise a judgement and seek support. This is education: no trauma treatment, mental-health measurement or claim of immunity to propaganda.

Provisional audience: ages 8–11 in a partner-supported setting. Confirm reading levels, language preferences, accessibility and objectives before content production. Treat children living abroad, internally displaced children and other Ukrainian settings as distinct deployment contexts.

A Ukrainian Saturday school in the UK is a possible first usability setting, subject to partner agreement. It is not automatically low risk and cannot establish suitability for children living in Ukraine. Do not recruit by asking children to disclose trauma, family military service, displacement or bereavement.

Adult documentation can state the context of Russia's invasion plainly. Child activities teach evidence evaluation without political loyalty tests, collective blame or requests to describe personal experiences. Ordinary childhood interests should dominate the first module.

## 5. Non-negotiable edition rules

1. **Never train hesitation over genuine safety instructions.** No exercise asks whether to obey an air-raid alert, shelter instruction, evacuation direction or other real emergency guidance. Never substitute for responsible adults or established safety procedures. No simulated alert sounds or realistic emergency interfaces.
2. **Feelings are not graded true or false.** Use “What does this post want you to do?”, “What do we know?” and “What could help us check?” Fear or anger is not failure.
3. **No surprise betrayal as a lesson.** No “Got you”, adversarial sting or hidden synthetic-image rug-pull in this edition. This does not remove approved UK features.
4. **Fictional targets only.** No real person, school, locality or social group is accused or made a villain. Review invented names locally for accidental associations. Never infer trustworthiness from nationality or language.
5. **Appropriate help-seeking is successful.** “Ask a trusted adult” and “Not enough evidence yet” are supported actions. Children are not responsible for investigating dangerous material or protecting their family from disinformation.
6. **Exclude distressing first-module material.** No attacks, weapons, injuries, death, missing relatives, aid scarcity or realistic military/evacuation scenarios. Later proposals need a new scope decision and specialist review.
7. **Participation is voluntary.** Stop, skip or decline assessment without lost rewards, shame or adult pressure. No timed calls, missed-day penalties or daily-loss messages.
8. **Teach appropriate trust.** Include emotional truthful posts, calm false claims and honest synthetic illustrations. Motive, sponsorship, popularity and production quality do not settle factual accuracy.
9. **No new child data collection.** No free text, uploads, contacts, location, tracking IDs, fingerprinting or remote answer logging. No identifiable child records in reports or fixtures.
10. **Claims follow evidence.** No “trauma-safe”, “proven for Ukrainian children”, “immunity”, endorsement or reach claim without supporting evidence and permission.

## 6. Conditional first-build scope

Use the following draft scope for the local build. Ratify pilot scope with the delivery partner:

- Twelve teaching cards in two selectable sessions of six; target 5–8 minutes per session with no timer.
- Four supported, four contradicted and four unresolved final conclusions across the module. Mix style within each category. Do not advertise the counts as a guessing rule.
- Four distinct follow-up practice cards. Replaying an unchanged deck must not be called fresh practice.
- Two six-item assessment forms, each with two supported, two contradicted and two unresolved items. These are proposed pilot instruments, not validated scales. Delayed measurement needs a third unseen form or a justified alternative fixed by the evaluator.
- One optional scripted “repair the post” activity: select an accurate caption and useful context for an ordinary fictional post. No publishing, free typing or rewards for engagement inflation.
- Ukrainian interface and reviewed narration, equivalent text, English facilitator notes and an English reference translation. Additional learner languages are partner-defined scope.
- Educator guide, family explanation, source/asset register, assessment instructions and release notes.

Exclude village expansion, native apps, multiplayer, social publishing, dashboards, accounts, live-news ingestion, chatbots, CMS and funding checkout.

Example directions below are not production-approved cards:

| Scenario | Check | Constraint |
|---|---|---|
| Last year's snowy playground presented as today | Original date and place label | No real-time weather or safety decision. |
| Two captions on one pet photo | What the photo establishes | Dramatic does not automatically mean false. |
| Exciting club announcement backed by its original notice | Original fictional notice | Teach justified acceptance of an enthusiastic claim. |
| Calm hobby claim contradicted by a separate record | Independent corroboration | Plain presentation must not signal truth. |
| Labelled illustration with an accurate explanation | Illustration versus documentary evidence | Synthetic origin does not invalidate the explanation. |
| Unverified ordinary rumour forwarded by a friend | Missing evidence; seek adult help | Unresolved can remain the final answer. |

## 7. Interaction and feedback contract

Flow: welcome and choice to play → optional facilitator-selected assessment → six teaching cards → optional repair activity → calm completion and choice to finish. Follow-up practice is separately selectable. No essential lesson or supportive explanation is locked behind performance.

On each teaching card:

1. Present one claim and an explicit question about it.
2. Offer Check, Ask a trusted adult, Skip and three judgement choices. Provisional English labels: “Evidence supports it”, “Evidence contradicts it”, “Not enough evidence yet”. Age-test the Ukrainian wording.
3. Check opens small static evidence artefacts: original notice, date/source detail or independent corroboration. Label these as fictional practice materials. Show the source and what each artefact establishes. Repeated copies of one source are not independent evidence.
4. Where useful, ask which clue helps answer the question. Merely opening and closing a panel is not mastery and earns no verification credit.
5. Grade what is warranted by evidence currently available. Before decisive evidence is viewed, uncertainty can be appropriate; after checking, invite revision. Some cards remain unresolved after every available check.
6. Explain the limit of the conclusion: a notice can confirm a date without revealing the poster's intentions or feelings.

This staged-evidence model is a proposed Ukrainian policy. D-SITE-095 currently marks CAN'T TELL wrong on decidable UK cards. Do not silently change that UK rule; record any proposed shared change separately before implementation.

Ask a trusted adult opens a pause/continue choice without a camera, microphone, contact lookup or message. It never says help has been contacted. If no adult is available, stop or skip remains successful. Facilitators use their organisation's established support procedure.

Draft feedback examples:

- “The original notice matches the claim. That is useful evidence.”
- “The date is different. This picture doesn't show what the caption says.”
- “We haven't found enough to decide. It is OK to leave it open.”
- “You changed your answer after checking. That is a useful skill.”

Use session progress and specific encouragement. No correctness streaks, rankings or penalty for uncertainty/help-seeking. Assessment has no reward effects. Skipped items remain missing, not wrong. Completion distinguishes finished, skipped and unanswered work and makes no diagnostic statement about the child.

## 8. Shared implementation proposal

The local prototype uses the current v0.4 core. Check the baseline again when preparing a pilot. Reuse the shared runtime and select the edition from an explicit route allowlist. Unknown or incompatible editions show a clear error.

Separate:

- **Edition policy:** actions, feedback register, activities and assessment behaviour. Ukrainian policy excludes adversarial feedback and rug-pull. Never select behaviour by matching translated strings.
- **Locale:** interface text, accessible labels, captions and narration. Use language `uk` / locale `uk-UA`; set document language correctly. Locale alone does not establish suitability for a setting.
- **Content:** claims, evidence, conclusions, reason choices, feedback and reviewed media.

Suggested content contract, adaptable to v0.4:

| Fields | Requirement |
|---|---|
| `schemaVersion`, `engineCompatibility`, `editionId`, `contentVersion`, `locale` | Pin a compatible engine/content bundle. |
| `id`, `objective`, `claim`, `question` | Stable identity and one learning objective. |
| `media`, `alt`, `provenance`, `rights` | Equivalent evidence description, media origin and reuse permission. |
| `evidence[]` | Local artefacts with IDs, source labels, relevance and independence/dependency information. |
| `initialConclusion`, `finalConclusion`, `decisiveEvidenceIds` | Warranted judgement before/after checking, including unresolved outcomes. |
| `reasonOptions`, `acceptedReasonIds`, `feedbackByState` | Deterministic feedback tied to available evidence. |
| `audio`, `transcript` | Reviewed local narration and equivalent text. |

Keep reviewer names, review dates, scope and rationales in an editorial register; publish only appropriate attribution. Release validation rejects missing required fields/media, incompatible versions, inconsistent answers and unreviewed content. Do not replace missing learning evidence with an empty background.

No remote AI, translation, cloud speech, tracking or external source browsing during play. Use bundled reviewed narration. If recordings are missing, provide text with a clear limitation for adult reviewers; do not silently substitute a language/service or claim a narration-complete release.

## 9. Offline, performance and accessibility

Offline delivery is a proposed requirement for explicit acceptance at G2. It authorises no installation now. Do not promise a weekend estimate: caching, update behaviour and device support need verification.

Choose one method with the partner:

- **Scoped PWA:** cache approved edition assets only, under a narrow game path. No root-scoped worker or interception of unrelated apps. Activate complete compatible versions atomically; retain a complete previous version if update fails. Report download/update errors. Cache no learner answers or progress.
- **Downloadable package:** bundle required content and verify its launch method on supported devices. Current JSON `fetch()` does not prove `file://` compatibility. Teachers must not need developer tools. Use only with a tested launch process and partner approval.

Provisional budgets for G2: ≤5 MB for first playable session and ≤15 MB for the full required module, excluding optional narration packs. Core learning uses text/stills and needs no video. Measure on the agreed lowest-spec device/network; do not silently sacrifice accessibility to meet a budget.

First download requires connectivity. Indicate offline readiness accurately. Persistent cross-session saves remain out of scope: resume within the open session; after reload, select/restart a short session without penalty.

Require readable Ukrainian type, touch/keyboard operation, visible focus, correct overlay focus, zoom/reflow, non-colour-only feedback, reduced motion and controllable narration. Descriptions must expose equivalent evidence without giving away the answer. Provide a reviewed alternative where a visual task cannot be made equivalent.

Use existing browsers and connected hardware. If an iOS simulator is needed, use only David's iPhone 16e, UDID `F4FC74EC-B64E-4DCC-A96C-857122C2AF86`. No additional devices, runtimes or cleared data. Android remains physical-device only. Report unavailable coverage.

## 10. Privacy, safeguarding and evaluation

Verify the full delivery surface: embedding page, analytics, cookies, fonts, CDN calls and hosting logs. Remove unnecessary third-party requests before claiming a self-contained experience. Describe unavoidable hosting metadata accurately; “no learner responses collected” does not mean “no data anywhere”.

The partner owns participant consent/assent, supervision, withdrawal, support/escalation, any research review required for the setting and record handling. Children need not explain a skip or stop. Facilitators stop on a child's request or signs of discomfort and use the partner's procedure; the app does not diagnose.

Paper observations and session screens can support the pilot. The partner retains participant-level records under its approved plan. David receives only agreed non-identifying aggregates, avoiding small-cell details that identify children. No automated export, new storage or remote collection is approved. Any such proposal needs a new SoRR decision.

Before recruitment, the evaluator fixes instruments, thresholds, stopping conditions, access/retention arrangements and reporting limitations. Measure evidence use, appropriate uncertainty, recognition of supported/contradicted claims, usability, reading burden and acceptability. No trauma screens or inference of psychological recovery. Report UK and Ukrainian results separately and label the actual pilot setting.

## 11. Acceptance checks before G3

| ID | Test | Required result |
|---|---|---|
| EDU-01 | All answer/evidence states across the three conclusion types | Feedback fits available evidence; emotion, likes and AI origin alone never settle truth. |
| EDU-02 | Open/close check panel; select irrelevant evidence | Neither action alone counts as demonstrated evidence use. |
| EDU-03 | Uncertainty, then decisive evidence, then revision | Appropriate uncertainty and justified revision receive supportive feedback. |
| SAFE-01 | Full Ukrainian text, media and audio review | No excluded themes, real targets, emergency decisions, feeling verdicts or surprise betrayal; named reviewers approve. |
| SAFE-02 | Stop, skip, help and unavailable-adult paths | Accessible throughout; no punishment, disclosure prompt or implied contact with support. |
| CONTENT-01 | Schema, reference and asset validation | Missing captions/media, duplicate IDs, inconsistent rationale and unreviewed changes visibly fail release checks. |
| STATE-01 | Repeated taps, replay, closing panels and interruption | No duplicate rewards/answers or stale feedback; missing answers stay missing. |
| LOCALE-01 | Ukrainian walkthrough with narration | No UK-string leaks, wrong-language fallback, clipping or mismatched audio. |
| ACCESS-01 | Keyboard, screen reader, zoom/reflow, touch, reduced motion | Core learning and exit work on agreed devices; limitations recorded. |
| OFFLINE-01 | Disconnect after download; interrupt download/update; reopen | Approved delivery works offline, never mixes versions, and reports incomplete download. |
| PRIV-01 | Complete-session network/storage inspection and replay | No learner responses, identifiers or progress transmitted/persisted; only approved static caching. Host disclosures match requests. |
| REG-01 | UK baseline and existing route walkthrough | Approved UK behaviour preserved; no site-wide service-worker effects. |
| EVAL-01 | Instrument and results review | Baseline has no teaching feedback; no diagnostic or efficacy claims from an individual score. |

Technical passes do not replace educational/safeguarding acceptance and cannot establish that a population is “trauma-safe”.

## 12. Work packages and deliverables

**Now — documentation and adult discovery:** keep this opportunity record. Prepare questions about unmet need, existing provision, audience, access, local authorship, evaluation and operating capacity. Potential first conversations are IREX Learn to Discern and Voices of Children, with Filter as an additional reference. No relationship or funding availability is implied. No emails are sent by this task.

**Local prototype — approved in D-SITE-098:** implement shared capabilities against the current v0.4 baseline, add draft Ukrainian text and fictional practice material, and verify the adult review route. Obtain Ukrainian authorship and review, agree delivery and device scope, and prepare the facilitator materials before proposing G3.

**After G3 — supervised usability:** partner recruits and facilitates the agreed sample, records comprehension/usability issues and applies stopping rules. Resolve issues before proposing wider evaluation. Do not broaden setting or recruitment implicitly.

**After G4 — bounded deployment:** release a pinned version with approved claims, support contact, review date and maintenance owner. Agree who can withdraw a module and how cached/printed copies are handled. Offline copies cannot be guaranteed to disappear on an urgent remote withdrawal; disclose that operational limit.

Required handoff: gate record; frozen scope/amendments; editorial/source/rights register; reviewed locale, deck and audio; build/validation instructions; device/offline/privacy evidence; educator/family materials; evaluation protocol; operating and withdrawal plan.

## 13. Funding and stop conditions

Working model: free to children/families; explore partner, grant or commissioned funding. Greater fundability than the UK product is a hypothesis, not a fact. Budget Ukrainian authorship, education/child-support review, narration/accessibility, development/QA, facilitation/evaluation, reporting and maintenance separately. Do not fund only translation and leave partner responsibilities unpaid.

For work beyond the local prototype, record how pilot evidence, local review, delivery ownership and funding affect the decision to continue. Any funding proposal must preserve the no-pupil-data model and evidence limits.

## 14. Evidence and limits

References reviewed in this chat on 12 November 2026:

- [UNESCO: media and information literacy in Ukraine](https://www.unesco.org/en/articles/unesco-strengthens-media-and-information-literacy-across-ukraine?hub=180699): existing activity and partnerships.
- [Filter](https://filter.mcsc.gov.ua/): local resources; examine overlap before claiming a gap.
- [IREX: locally led Learn to Discern work](https://www.irex.org/success-story/irex-strengthens-locally-led-learning-long-term-impact-ukraine): relevant educator network, not a confirmed partner.
- [Voices of Children](https://voices.org.ua/en): relevant child-support expertise, not a confirmed partner.
- [Ukraine education ministry: UNICEF guidance on talking with children about war](https://mon.gov.ua/news/yak-govoriti-z-ditmi-pro-viynu-poradi-vid-ekspertiv-yunisef): informs the supportive register; does not validate this game.
- [UNESCO: education response in Ukraine](https://www.unesco.org/en/emergencies/education/ukraine): practical access and support context.

Do not repeat “most rigorously evaluated anywhere”, “more fundable” or “offline is a weekend of work” as established facts. Neither this document nor another programme's results demonstrate AssumeZero's effectiveness.
