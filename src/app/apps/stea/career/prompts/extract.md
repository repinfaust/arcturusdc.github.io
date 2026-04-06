# JD Extraction Prompt
Task: Extract structured information from the following Product Manager Job Description.

Target Candidate Profile:
- Senior/Lead/Principal PM
- Focus: Platform, Data, Regulated SaaS, Billing, Payments, Compliance

Extract the following fields in JSON format:
1. role_title: The official title
2. company_name: The hiring organization
3. level: (Senior/Lead/Principal/Head of/Director)
4. remote_status: (Remote/Hybrid/Onsite)
5. location: Primary office location
6. compensation: Salary range if mentioned, or 'Not specified'
7. core_responsibilities: List of 5-8 key tasks
8. required_experience: Years and specific domain expertise required
9. tech_stack_mentioned: Key tools or platforms (e.g., AWS, SQL, Segment)
10. product_nature: (Internal Platform, Customer-facing SaaS, API-first, etc.)
11. ownership_level: (Strategic/Tactical/Delivery-only)

JD Text:
{{jd_text}}
