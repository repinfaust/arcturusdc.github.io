# PM Role Evaluation Prompt
Evaluate this Job Description against David Loake's profile using the 12-factor scoring framework.

## Candidate Profile Summary:
{{candidate_profile}}

## JD Data:
{{jd_data}}

## Evidence Library:
{{evidence_library}}

## Scoring Rules:
- Role level fit (Gate): Penalize if below Senior.
- Domain complexity (High): Reward complex systems, regulation, stakes.
- Product ownership (Gate): Reject if delivery-only/backlog support.
- Platform/data depth (High): Reward structural/platform work.
- Regulatory consequence (Med): Reward compliance/risk sectors.
- Stakeholder complexity (Med): Reward cross-functional orchestration.
- AI/governance relevance (Med): Bonus for SoRR alignment.
- Remote feasibility (Med): UK remote is preferred.
- Compensation (High): Target >£95k.
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
