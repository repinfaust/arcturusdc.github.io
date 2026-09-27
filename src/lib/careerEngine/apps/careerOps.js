// Career Ops: general job-search triage. Prompts are built from each user's own
// profile (target roles, salary floor, evidence) — never a fixed background
// (D-SITE-034; previously hard-coded to one energy/billing Product Owner).
import { readFile } from 'fs/promises';
import path from 'path';

// Internal demo workspace: config comes from the anonymised YAML seed files.
const DEMO_TENANT_ID = 'KovW8P7K5O2537V8I3H1';

const rolesText = (f) => (f.targetRoles.length ? f.targetRoles.join(', ') : f.currentRole || 'their target roles');
const salaryRule = (f) => (f.minSalary
  ? `Reward base salary at or above the candidate's floor of £${f.minSalary.toLocaleString('en-GB')}; penalise roles clearly below it.`
  : 'No salary floor set — score neutrally unless pay is clearly out of line with the role level.');

export const careerOpsApp = {
  name: 'Career Ops',
  collections: {
    ops: 'career_ops',
    analyses: 'career_ops_analyses',
    cvUploads: 'career_ops_cv_uploads',
  },
  accessCodeEnv: 'CAREER_ACCESS_CODE',
  unlimitedTenants: [DEMO_TENANT_ID],

  async localConfig(tenantId, name) {
    if (tenantId !== DEMO_TENANT_ID) return null;
    try {
      return await readFile(path.join(process.cwd(), 'src/app/apps/stea/career/config', `${name}.yaml`), 'utf8');
    } catch {
      return '';
    }
  },

  prompts: {
    extractSystem: (f) => `You are an expert recruiter for ${rolesText(f)} roles. Respond with ONLY valid JSON — no markdown, no code fences, no commentary.`,
    extract: (jdText, f) => `# JD Extraction
Task: Extract structured information from the following job description.

The candidate is targeting: ${rolesText(f)}.

Extract the following fields in JSON format:
1. role_title: The official title
2. company_name: The hiring organization
3. level: (Junior/Mid/Senior/Lead/Principal/Head of/Director)
4. remote_status: (Remote/Hybrid/Onsite)
5. location: Primary office location
6. compensation: Salary range if mentioned, or 'Not specified'
7. core_responsibilities: List of 5-8 key tasks
8. required_experience: Years and specific domain expertise required
9. tech_stack_mentioned: Key tools, platforms or methods named
10. product_nature: What the team or product actually does
11. ownership_level: (Strategic/Tactical/Delivery-only)

JD Text:
${jdText}`,

    evaluateSystem: (f) => `You are a career coach for candidates targeting ${rolesText(f)} roles. ` +
      'Format your response as clean GitHub-flavored Markdown: use ## headings, ' +
      '"|"-delimited tables, bullet lists and **bold**. Do NOT use LaTeX or "$$" math ' +
      'notation — write any calculations as plain text. Keep it scannable.',
    evaluate: (jdData, f) => `# Role Evaluation
Evaluate this job against the candidate (Candidate Profile, Evidence Library and CV above) using the 12-factor framework below. The candidate targets ${rolesText(f)} — judge fit against that, using their real evidence.

## JD Data:
${jdData}

## Scoring Rules:
- Role level fit (Gate): The role matches the candidate's target roles and seniority; penalise clearly junior or clearly out-of-reach roles.
- Domain fit (High): Overlap between the role's sector/problem space and the domains in the candidate's evidence.
- Core responsibilities match (Gate): The day-to-day work is what the candidate has demonstrably done; flag roles that are mostly something else.
- Tools & systems depth (High): Platforms, methods and technical depth named in the JD versus the candidate's evidence.
- Regulatory / operational consequence (Med): Stakes and compliance context the candidate has handled before.
- Stakeholder complexity (Med): Cross-functional orchestration the role needs versus the candidate's track record.
- Development upside (Med): Room to grow into the candidate's stated direction.
- Location / remote feasibility (Med): Against the candidate's location and working preferences.
- Compensation (High): ${salaryRule(f)}
- Company quality (Med): Maturity, stability and culture signals in the JD.
- Interview likelihood (High): Strength of the evidence match against the stated requirements.
- Personal energy (Low): Likely resonance with what the candidate says they want.

## Output Requirements:
1. Score for each factor (1.0 to 5.0).
2. Overall weighted score, written as "Overall score: X.X / 5.0".
3. Fit Recommendation (Pursue Aggressively / Strong Target / Selective / Archive).
4. Hard Positives (Evidence mapping).
5. Hard Negatives (Gaps/Risks).
6. Predicted Interview Questions based on JD.
7. Rationale for score.`,

    tailorSystem: (f) => `You are an expert CV writer for candidates targeting ${rolesText(f)} roles. ` +
      'Output clean GitHub-flavored Markdown. NEVER invent metrics, roles, dates or skills — only ' +
      'reuse and re-emphasise what is in the Evidence Library, Candidate Profile and CV. Produce: ' +
      '(1) a full tailored CV, (2) a 150-220 word cover note, (3) a short rationale of changes.',
    tailor: (jdSummary) => `# CV Tailoring
Task: Tailor the candidate's CV (Candidate Profile, Evidence Library and CV above) for this specific role.

## JD Summary:
${jdSummary}

## Strategy:
1. Reorder experience so the most relevant evidence for this role leads.
2. Use specific metrics from the Evidence Library — only ones that are there.
3. Align the summary statement to the JD's core problem space.
4. Highlight the candidate's strengths that this role actually asks for.
5. Ensure every claim maps to an anchor in the Evidence Library or CV.

## Constraints:
- DO NOT invent metrics, roles, or dates.
- Keep output in Markdown format.
- Maintain the candidate's authentic professional voice.

## Output:
Full Markdown CV.
150-220 word direct cover note.
Brief rationale for changes.`,

    coverSystem: (f) => `You write concise, specific, honest cover letters for candidates targeting ${rolesText(f)} roles. Never invent facts, metrics, or experience.`,
    answersSystem: () => 'You draft application form answers for a job candidate. Ground everything in their real evidence — never invent. Respond with ONLY a JSON array.',
    cvExtract: (cvText) => `From this CV, extract JSON:\n{\n  "profile": {"name": "", "current_role": "", "location": "", "target_roles": ["",""], "min_salary": null},\n  "evidence": [{"company": "", "period": "", "bullets": ["",""]}]\n}\nFor target_roles, infer 2-4 sensible targets from their experience. For min_salary use a number if stated, else null. For evidence, one entry per role (most recent first), bullets = their real achievements.\n\nCV:\n${cvText}`,
  },

  search: {
    defaultTerm: 'product',
    // Categories that are never an office/product/ops/delivery role — pure
    // token-saving cuts; the LLM ranker makes the relevance calls.
    hardExclude: ['warehouse', 'forklift', 'hgv', 'lorry', 'van driver', 'delivery driver',
      'cleaner', 'cleaning', 'security officer', 'nurse', 'carer', 'care assistant', 'teacher',
      'teaching assistant', 'chef', 'cook', 'kitchen', 'waiter', 'waitress', 'bartender',
      'electrician', 'plumber', 'labourer', 'mechanic', 'welder', 'painter', 'retail assistant',
      'shop assistant', 'cashier', 'receptionist', 'hairdresser', 'beautician', 'dental',
      'pharmacist', 'phlebotomist', 'social worker', 'sales executive', 'sales representative',
      'telesales', 'estate agent', 'recruitment consultant'],
    rankBackground: (f) => (f.currentRole ? `currently ${f.currentRole}.` : ''),
  },
};
