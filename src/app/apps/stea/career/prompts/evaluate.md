# PM Role Evaluation Prompt
Evaluate this Job Description against the candidate's profile (see Candidate Profile Summary below) using the 12-factor scoring framework.

## Candidate Profile Summary:
{{candidate_profile}}

## JD Data:
{{jd_data}}

## Evidence Library:
{{evidence_library}}

## Scoring Rules:
- Role level fit (Gate): Reward Product Owner / Product Manager roles; mild penalty only if clearly junior or pure delivery admin.
- Domain complexity (High): Reward energy/utilities/billing, regulation, and operational stakes.
- Product ownership (Gate): Reward genuine backlog & outcome ownership; flag delivery-only/PMO-only roles.
- Platform/data depth (High): Reward billing-platform, metering, settlements and systems work.
- Regulatory consequence (Med): Reward compliance/risk sectors (Ofgem-regulated energy is a strong fit).
- Stakeholder complexity (Med): Reward cross-functional orchestration (product/engineering/service/ops).
- AI/governance relevance (Med): Bonus for roles open to AI-assisted discovery/prototyping.
- Remote feasibility (Med): UK remote/hybrid is preferred.
- Compensation (High): Target >£65k base.
- Company quality (Med): Product culture and maturity.
- Interview likelihood (High): Evidence match strength.
- Personal energy (Low): Subjective resonance.

## Output Requirements:
1. Score for each factor (1.0 to 5.0).
2. Overall weighted score.
3. Fit Recommendation (Pursue Aggressively / Strong Target / Selective / Archive).
4. Hard Positives (Evidence mapping).
5. Hard Negatives (Gaps/Risks).
6. Predicted Interview Questions based on JD.
7. Rationale for score.
