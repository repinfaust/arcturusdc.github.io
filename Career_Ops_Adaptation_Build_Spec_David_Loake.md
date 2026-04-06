# Build Spec: Career-Ops Adaptation for David Loake

## 1. Executive digest
Career-Ops is worth copying for its **pipeline structure**, **dedup**, **cached evaluations**, **per-role CV generation**, and **human-in-the-loop workflow**.  
It should **not** be copied literally, because the original is tuned for senior AI engineering roles. Your version should be tuned for a UK-based systems-focused Product Manager targeting Senior, Lead, and Principal roles.

### Keep
- Modular multi-stage pipeline
- Job discovery and dedup
- Structured JD extraction
- Fit scoring
- Role-specific CV generation
- Tracker and cached outputs
- HITL apply flow

### Change
- Replace AI-engineer scoring with PM/platform/data/regulatory scoring
- Change search terms and company targets
- Tailor outputs to Product Manager narratives
- Bias toward remote UK roles with real ownership and complexity

---

## 2. Candidate profile to optimise for
The system must optimise for this profile:

- UK-based **Senior / Lead / Principal Product Manager**
- Strengths: billing platforms, payments, debt, affordability, compliance, analytics, experimentation, roadmap ownership, stakeholder orchestration, AI-enabled prototyping, systems thinking
- Best-fit domains: platform, data, regulated SaaS, workflow systems, billing/payments, decisioning tools, AI-enabled enterprise software
- Avoid: junior PM roles, pure backlog admin, generic growth PM work, feature factories

---

## 3. Recommended modes
| Mode | Keep/Add/Drop | Purpose | Priority |
|---|---|---:|---|
| scan | Keep | Find roles from job boards, recruiters, and company sites | High |
| extract | Keep | Parse JD into structured schema | High |
| evaluate | Keep | Score role against PM-specific model | High |
| report | Keep | Create concise markdown report | High |
| cv | Keep | Create role-specific CV + cover note | High |
| tracker | Keep | Maintain state, dedup, and follow-up | High |
| apply | Keep, HITL only | Prepare applications, optional autofill | Medium |
| company-research | Add | Research product, funding, domain, complexity | Medium |
| comparison | Add | Compare shortlisted roles side-by-side | Medium |
| networking | Optional | Draft recruiter / hiring-manager outreach | Low |
| training | Optional | Evaluate courses / certs against target roles | Low |
| deep-research | Optional | Finalist-level research only | Low |

---

## 4. PM-specific scoring framework
Replace the original 10-dimension model with this 12-factor version.

| Dimension | Weight | Type | What it measures | Rule |
|---|---|---|---|---|
| Role level fit | Gate | Gate | Senior/Lead/Principal calibration | Auto-penalise roles below true level |
| Domain complexity | High | Positive | Complexity of system, workflow, regulation, stakes | Reward hard systems |
| Product ownership | Gate | Gate | Real ownership vs backlog admin | Reject delivery-only roles |
| Platform/data/system depth | High | Positive | Platform, internal tools, data products, structural work | Reward structural work |
| Regulatory or operational consequence | Medium | Positive | Compliance, financial, operational risk | Reward consequence |
| Stakeholder complexity | Medium | Positive | Breadth across business, tech, architecture, clients, compliance | Reward orchestration |
| AI/governance relevance | Medium | Positive | Opportunity to leverage SoRR / AI workflow thinking | Bonus, not mandatory |
| Remote feasibility | Medium | Constraint | UK remote/hybrid practicality | Penalise commute-heavy roles |
| Compensation | High | Constraint | Pay band vs target | Reject under-market roles |
| Company quality | Medium | Risk | Product maturity, mission, product culture | Penalise weak environments |
| Interview likelihood | High | Prediction | Strength of evidence match | Use proof-point mapping |
| Personal energy / resonance | Low | Human override | Whether the problem space is worth attention | Never override hard negatives |

### Suggested thresholds
- **4.5–5.0**: pursue aggressively
- **4.0–4.49**: strong target
- **3.5–3.99**: selective only
- **<3.5**: archive

---

## 5. Canonical evidence library
The repo should use a structured evidence library and never invent claims.

### Candidate anchors
- **ENSEK / British Gas**: Payment Adequacy, debt recovery, regulatory alignment, roadmap ownership, architecture/business/client coordination
- **Experian**: MarTech and analytics ownership, AWS migration, Score Boost launch, GDPR-safe data strategy, data standardisation
- **Arcturus Digital**: independent product development, React Native/Firebase/OpenAI prototypes, validation speed, real shipped apps
- **SoRR**: AI governance and structured reasoning framework for AI-assisted product and engineering workflows

### Strength tags
- Billing
- Payments
- Compliance
- Platform
- Analytics
- Experimentation
- Stakeholder influence
- AI prototyping
- Systems thinking

---

## 6. Data model Gemini should implement
Use config-first design.

- `config/candidate_profile.yaml`
- `config/evidence_library.yaml`
- `config/role_taxonomy.yaml`
- `config/scoring_weights.yaml`
- `config/search_sources.yaml`
- `data/tracker.csv`
- `data/scan_history.csv`
- `data/companies_watchlist.csv`
- `cache/`
- `output/reports/`
- `output/cvs/`
- `output/cover_notes/`
- `output/apply_packets/`

### Example entities
- `role_record`
- `company_record`
- `jd_extract`
- `evaluation_result`
- `cv_variant`
- `application_packet`

---

## 7. Suggested repo structure
```text
repo/
  config/
    candidate_profile.yaml
    evidence_library.yaml
    role_taxonomy.yaml
    scoring_weights.yaml
    search_sources.yaml
  data/
    tracker.csv
    companies_watchlist.csv
    exclusions.csv
    scan_history.csv
  prompts/
    extract.md
    evaluate.md
    company_research.md
    cv_tailor.md
    cover_note.md
    apply_answers.md
  src/
    scan/
    extract/
    evaluate/
    rank/
    report/
    cv/
    apply/
    tracker/
    common/
  output/
    reports/
    cvs/
    cover_notes/
    apply_packets/
  scripts/
    run_scan.sh
    run_pipeline.sh
    rerank_shortlist.sh
    generate_cv.sh
    prep_application.sh
```

---

## 8. Search strategy for this candidate
### Primary search terms
- senior product manager platform remote uk
- principal product manager data remote uk
- lead product manager workflow remote uk
- senior product manager saas platform remote uk
- product manager internal tools remote uk
- product manager billing platform remote uk
- product manager decisioning systems remote uk

### Negative filters
- growth PM
- consumer engagement
- junior PM
- product owner only
- backlog support
- feature delivery only

### Company bias
Prefer:
- regulated SaaS
- fintech infrastructure
- energy tech
- analytics platforms
- workflow SaaS
- compliance tooling
- AI-enabled enterprise software

---

## 9. Output requirements
The system should generate:

1. **Evaluation brief** in markdown  
   - fit score
   - hard positives
   - hard negatives
   - comp signal
   - risk signal
   - recommendation

2. **Role-specific CV** in markdown, then optional PDF  
   - summary
   - reordered proof points
   - skills emphasis
   - no fabrication

3. **Short cover note**  
   - 150–220 words
   - direct
   - evidence-based

4. **Application packet JSON**
   - salary
   - notice period
   - location
   - work eligibility
   - product examples
   - motivation answers

5. **Comparison sheet**
   - ranked shortlist
   - rationale

---

## 10. Human-in-the-loop rules
- The system may scan, extract, score, rank, and draft
- It may **not** auto-submit without explicit approval
- Every generated CV claim must map to a real proof point
- Under-level, under-paid, delivery-only, or location-misaligned roles should be auto-archived
- Reusable answers should be cached only after approval

---

## 11. Recommended build roadmap
### Phase 1 — MVP
- scan
- extract
- evaluate
- tracker

**Success:** you can process roles fast and shortlist confidently.

### Phase 2 — CV engine
- role-specific CV
- cover note generation

**Success:** application assets become fast to produce.

### Phase 3 — apply prep
- answer packets
- optional browser autofill

**Success:** admin drops without losing judgment.

### Phase 4 — compare + research
- company research
- ranked comparisons

**Success:** better role selection, not just more output.

### Phase 5 — polish
- batch workers
- retries
- analytics
- performance improvements

**Success:** durable, scalable workflow.

---

## 12. Prompt contract for Gemini CLI
Use this as the adaptation brief:

```text
Adapt this repository into a human-in-the-loop AI job-search system for David Loake, a UK-based Senior/Lead/Principal Product Manager.

Keep the repo's modular pipeline pattern, dedup, caching, evaluation flow, report generation, and per-role CV tailoring.
Replace any AI-engineer-specific assumptions with a Product Manager search model.

Candidate positioning:
- Systems-focused Product Manager
- Strongest evidence in billing, payments, debt, compliance, data, experimentation, roadmap ownership, stakeholder orchestration, and AI-enabled prototyping
- Target roles: Senior Product Manager, Lead Product Manager, Principal Product Manager, Platform PM, Data PM, Regulated SaaS PM
- Geography: UK remote first
- Human-in-the-loop only for final application submission

Implement these changes:
1. Add configurable YAML files for candidate profile, evidence library, role taxonomy, search sources, and scoring weights.
2. Replace the scoring framework with the PM-specific model in this spec.
3. Update prompts so JD extraction, evaluation, CV tailoring, and company research are PM-oriented.
4. Generate outputs in markdown first, then optional PDF.
5. Preserve traceability: every claim in a generated CV must map to a source proof point.
6. Add hard reject rules for under-level, under-paid, delivery-only, or location-misaligned roles.
7. Keep apply mode optional and approval-gated.
8. Add a comparison mode for shortlisted roles.
9. Ensure the system can be run locally from CLI with simple commands.
10. Write a README section explaining config, commands, and HITL safeguards.

Deliverables:
- Updated file structure
- Updated prompt files
- Config templates with example values
- Scoring implementation
- Sample CLI commands
- README notes on how to tailor evidence and target companies
```

---

## 13. Guardrails
- Do not fake experience, metrics, industries, titles, or dates
- Do not optimise for volume over fit
- Do not let keyword stuffing degrade credibility
- Do not auto-apply blindly
- Do not overbuild batch orchestration before the single-role flow is correct

---

## 14. Final recommendation
Copy the architecture, not the identity.

The best version of this system for David Loake is a **Product-Manager-first operating system** for complex systems roles. It should make evidence portable, decisions faster, and applications sharper — without turning the process into spam.
