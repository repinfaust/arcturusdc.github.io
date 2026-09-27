// Squared: job-search triage for people leaving the Armed Forces (D-SITE-034).
// Same engine as Career Ops; its own collections, prompts, clearance tagging and
// skills translator. No service number is collected or sent anywhere.
import { NextResponse } from 'next/server';
import { callAnthropic, stripJsonFences } from '../anthropic';
import { clearanceMentioned, clearanceTag, clearanceStatus } from '../clearance';
import { chunkText, validateLine, MAX_CHUNKS, CATEGORIES } from '../recordTranslate';

// Phrases the AI says it inferred beyond the original (D-SITE-036); the review
// screen blocks the line until each is removed or confirmed by the user.
const cleanAdded = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);

const rolesText = (f) => (f.targetRoles.length ? f.targetRoles.join(', ') : 'civilian roles that fit their service');

const SERVICE_RULES = `Rules for service leavers:
- Translate military terms into civilian language an employer outside Defence understands (e.g. "detachment commander" -> "team leader"; "SJAR" -> "annual performance appraisal"). Expand any acronym you keep.
- Never invent experience, metrics, qualifications, clearance or dates. Only use what is in the Candidate Profile, Evidence Library, approved translations and CV.
- Clearance: use the "Clearance status today" line in the context, never the raw profile field. A national security clearance (CTC/SC/DV) lapses when the holder leaves; it may be reinstated only if they move to another cleared role within 12 months and it is no older than 10 years (CTC/SC) or 7 years (DV), and that is the new employer's decision. Never call a lapsed clearance "held".
- Civil Service roles: the Great Place to Work for Veterans scheme moves an eligible applicant on to the next selection stage (interview or test) if they meet the minimum criteria. Eligible: at least one year's service (Regular or Reserve, training counts), in transition or already left, and not already a civil servant. It is not a guaranteed job. Mention it only for Civil Service employers.
- Keep security-sensitive detail general: do not add operation names, locations, unit details or equipment specifics beyond what the evidence already states.
- Do not reference or request a service number.`;

export const squaredApp = {
  name: 'Squared',
  collections: {
    ops: 'squared_ops',
    analyses: 'squared_analyses',
    cvUploads: 'squared_cv_uploads',
  },
  accessCodeEnv: 'SQUARED_ACCESS_CODE',
  unlimitedTenants: [],
  // Config fields beyond profile/evidence/weights, round-tripped by get/save_config.
  extraConfigFields: ['skills_translations'],

  // Approved skills translations are part of what the AI may draw on.
  contextExtras(doc) {
    const profile = doc.candidate_profile && typeof doc.candidate_profile === 'object' ? doc.candidate_profile : {};
    let out = `\n\n## Clearance status today:\n${clearanceStatus(profile).label}`;
    const approved = (doc.skills_translations || []).filter((t) => t && t.used && t.civ);
    if (approved.length) {
      out += `\n\n## Approved civilian translations of service experience (use these phrasings):\n` +
        approved.map((t) => `- ${t.mil} -> ${t.civ}`).join('\n');
    }
    return out;
  },

  prompts: {
    extractSystem: () => 'You are an expert recruiter who places Armed Forces service leavers into civilian roles. Respond with ONLY valid JSON — no markdown, no code fences, no commentary.',
    extract: (jdText, f) => `# JD Extraction
Task: Extract structured information from the following job description.

The candidate is an Armed Forces service leaver targeting: ${rolesText(f)}.

Extract the following fields in JSON format:
1. role_title: The official title
2. company_name: The hiring organization
3. level: (Entry/Mid/Senior/Lead/Head of/Director)
4. remote_status: (Remote/Hybrid/Onsite)
5. location: Primary work location
6. compensation: Salary range if mentioned, or 'Not specified'
7. core_responsibilities: List of 5-8 key tasks
8. required_experience: Years and specific experience required
9. qualifications_required: Named qualifications, licences or certifications (e.g. PRINCE2, NEBOSH, degree), or []
10. security_clearance: Clearance named (BPSS / CTC / SC / DV) or 'None stated'
11. sector: The employer's sector
12. forces_friendly_signals: Anything the JD itself states about veterans, the Armed Forces Covenant or guaranteed interviews, or 'None stated'

JD Text:
${jdText}`,

    evaluateSystem: () => 'You are a straight-talking career coach for people leaving the Armed Forces for civilian work. ' +
      'Format your response as clean GitHub-flavored Markdown: ## headings, "|"-delimited tables, bullet lists and **bold**. ' +
      'No LaTeX or "$$" notation. Be honest: no false hope, no padding.\n\n' + SERVICE_RULES,
    evaluate: (jdData, f) => `# Role Evaluation
Evaluate this job for the candidate (Candidate Profile, Evidence Library, approved translations and CV above). They are leaving or have left the Armed Forces and are targeting ${rolesText(f)}.

## JD Data:
${jdData}

## Scoring (12 factors, each 1.0-5.0):
- Role fit (Gate): The work matches the candidate's target roles and a realistic civilian level for their rank and experience.
- Transferable leadership (High): Leadership, people and responsibility in their evidence versus what the role needs.
- Operational / technical match (High): Their trade and hands-on experience versus the core responsibilities.
- Qualifications gap (High): Named civilian qualifications they hold versus what is required. Note any gap that a short course could close.
- Sector familiarity (Med): Defence, security, public-sector or related experience the role values.
- Clearance fit (Med): Clearance required versus held (per the rules above).
- Language gap (Med): How much translation their experience needs to read well to this employer.
- Location / relocation (Med): Against the candidate's home base and preferences.
- Compensation (High): ${f.minSalary ? `Against the candidate's floor of £${f.minSalary.toLocaleString('en-GB')}.` : 'No floor set — score neutrally unless pay is clearly out of line.'}
- Employer forces-friendliness (Low): Only what the JD states. Do not assume Armed Forces Covenant status.
- Interview likelihood (High): Strength of the evidence match against the stated requirements.
- Personal energy (Low): Likely resonance with what the candidate says they want.

## Output format (follow exactly):
Start with exactly these three lines, no heading above them:
Overall score: X.X / 5.0
Recommended action: <one plain sentence telling them what to do>
Risk Signal: <one plain sentence: the single biggest watch-out>

Then these sections, each a "## " heading followed by 2-5 bullets:
## Role summary
## Where your service maps
## Gaps to close
## Clearance & eligibility
## Factor scores
(a table: Factor | Score | Why)
## Likely interview questions`,

    tailorSystem: () => 'You are an expert CV writer for Armed Forces service leavers moving into civilian work. ' +
      'Output clean GitHub-flavored Markdown. Produce: (1) a full tailored CV in civilian language, ' +
      '(2) a 150-220 word cover note, (3) a short rationale of changes.\n\n' + SERVICE_RULES,
    tailor: (jdSummary) => `# CV Tailoring
Task: Tailor the candidate's CV for this role, written for a civilian hiring manager.

## JD Summary:
${jdSummary}

## Strategy:
1. Lead with the evidence most relevant to this role, in civilian terms.
2. Use the approved translations wherever they apply.
3. Use specific numbers from the evidence (team sizes, budgets, equipment value, outcomes) — only ones that are there.
4. Write the summary around the employer's problem, not around military career history.
5. List qualifications and clearance only as stated in the profile.

## Output:
Full Markdown CV.
150-220 word direct cover note.
Brief rationale for changes.`,

    coverSystem: () => 'You write concise, specific, honest cover letters for Armed Forces service leavers applying for civilian roles. ' +
      'Civilian language throughout. Never invent facts, metrics or experience.\n\n' + SERVICE_RULES,
    answersSystem: () => 'You draft application form answers for an Armed Forces service leaver applying for a civilian role. ' +
      'Civilian language; ground everything in their real evidence — never invent. Respond with ONLY a JSON array.\n\n' + SERVICE_RULES,
    cvExtract: (cvText) => `From this CV of an Armed Forces service leaver, extract JSON:
{
  "profile": {"name": "", "current_role": "", "location": "", "target_roles": ["",""], "min_salary": null,
    "service_branch": "", "trade": "", "rank": "", "years_served": null, "clearance": "", "exit_date": ""},
  "evidence": [{"company": "", "period": "", "bullets": ["",""]}]
}
Rules:
- service_branch: one of "British Army", "Royal Navy", "Royal Air Force", "Royal Marines", or "" if not stated.
- clearance: one of "BPSS", "CTC", "SC", "eDV", "DV" only if the CV states it, else "".
- exit_date: ISO date (YYYY-MM-DD) only if stated, else "".
- target_roles: infer 2-4 sensible civilian targets from their experience.
- evidence: one entry per posting or role (most recent first); "company" = unit or employer; bullets = real achievements.
- Never extract a service number.

CV:
${cvText}`,
  },

  search: {
    defaultTerm: 'operations manager',
    // Trades many leavers go into (security, HGV, engineering trades) are real
    // targets here, so only cut what is never plausible.
    hardExclude: ['care assistant', 'carer', 'hairdresser', 'beautician', 'waiter', 'waitress',
      'bartender', 'phlebotomist', 'dental nurse', 'telesales', 'teaching assistant'],
    rankBackground: (f, profile) => {
      const p = profile && typeof profile === 'object' ? profile : {};
      const bits = [p.rank, p.trade, p.service_branch].filter(Boolean).join(', ');
      return `Armed Forces service leaver${bits ? ` (${bits})` : ''}. Military experience often maps to operations, logistics, engineering, security, project and people-management roles.`;
    },
    enrich(jobs, profile) {
      const status = clearanceStatus(profile && typeof profile === 'object' ? profile : {});
      return jobs.map((j) => {
        const required = clearanceMentioned(`${j.title}\n${j.description}`);
        return required ? { ...j, clearance: clearanceTag(required, status) } : j;
      });
    },
  },

  extraActions: {
    // Whole-record translation (D-SITE-035): an appraisal, JPA extract or
    // military CV in, reviewable civilian lines out. One action per chunk. The
    // record itself is never stored; only lines the user approves are saved.
    async translate_record({ body, loadCandidate, getUsage, incrementUsage }) {
      const text = (body.text || '').trim();
      if (!text) return NextResponse.json({ error: 'Upload or paste a record to translate.' }, { status: 400 });
      const chunks = chunkText(text);
      if (chunks.length > MAX_CHUNKS) {
        return NextResponse.json({ error: `That record is too long (${chunks.length} parts). Split it and translate up to ${MAX_CHUNKS} parts at a time.` }, { status: 400 });
      }
      const usage = await getUsage();
      if (!usage.unlimited && usage.remaining < chunks.length) {
        const err = new Error(`This record needs ${chunks.length} actions and you have ${usage.remaining} left.`);
        err.code = 'LIMIT_REACHED';
        err.usage = usage;
        throw err;
      }
      const cand = await loadCandidate({ withCv: false });

      const system = 'You translate Armed Forces records (appraisal reports, JPA extracts, course reports, military CVs) into plain civilian CV language. ' +
        'Respond with ONLY a valid JSON array.\n\n' + SERVICE_RULES;
      const prompt = (chunk) => `From this part of the candidate's service record, pick out every line worth putting on a civilian CV and translate each one.

Return ONLY a JSON array of objects:
{"mil": "<the original wording, copied EXACTLY from the record>", "civ": "<one civilian CV line, max 25 words>", "category": "<one of: ${CATEGORIES.join(', ')}>", "added": ["<each phrase in civ that states a fact not in mil, copied exactly from civ>"], "note": "<optional: what you could not translate without more detail, else empty>"}

Rules:
- "mil" must be copied character for character from the record below — no paraphrasing, no joining separate sentences.
- "civ" keeps every fact and number exactly as the original states it; add no new numbers, claims or qualifications.
- If civ says anything the original does not (e.g. "zero losses" when the original only says "kit account"), list that phrase in "added". Be strict: an interviewer may ask about it.
- Skip administrative text, headings, and anything security-sensitive.

Record:
${chunk}`;

      const results = await Promise.all(chunks.map(async (chunk) => {
        try {
          const raw = await callAnthropic({ system, cachedContext: cand.cachedContext, prompt: prompt(chunk), maxTokens: 4000 });
          const arr = JSON.parse(stripJsonFences(raw));
          return Array.isArray(arr) ? arr : null;
        } catch (e) {
          console.error('translate_record chunk failed', e?.message);
          return null;
        }
      }));

      // Only successful chunks are charged.
      const ok = results.filter(Boolean);
      for (let i = 0; i < ok.length; i++) await incrementUsage();
      if (!ok.length) return NextResponse.json({ error: 'Could not translate that record. Try pasting the text instead of uploading.' }, { status: 422 });

      const lines = ok.flat()
        .filter((l) => l && typeof l.mil === 'string' && typeof l.civ === 'string' && l.civ.trim())
        .map((l) => {
          const line = { mil: l.mil.trim(), civ: l.civ.trim(), category: CATEGORIES.includes(l.category) ? l.category : 'Skills', added: cleanAdded(l.added), note: (l.note || '').trim() };
          return { ...line, ...validateLine(line, text) };
        });
      return NextResponse.json({ lines, chunks: chunks.length, charged: ok.length, failed: chunks.length - ok.length });
    },

    // The AI suggests a civilian phrasing for one line of service experience;
    // the user approves it line by line in Config (one action).
    async translate_skill({ body, loadCandidate, assertActionAvailable, incrementUsage }) {
      const line = (body.text || '').trim();
      if (!line) return NextResponse.json({ error: 'Paste a line to translate.' }, { status: 400 });
      if (line.length > 600) return NextResponse.json({ error: 'Keep it to one line (under 600 characters).' }, { status: 400 });
      await assertActionAvailable();
      const cand = await loadCandidate({ withCv: false });

      const raw = await callAnthropic({
        system: 'You translate Armed Forces experience into plain civilian CV language. ' +
          'Keep every fact and number exactly; add nothing; expand or replace military jargon. ' +
          'Respond with ONLY valid JSON.\n\n' + SERVICE_RULES,
        cachedContext: cand.cachedContext,
        prompt: `Translate this line of service experience into one civilian CV line (max 25 words):\n\n"${line}"\n\n` +
          'If the civilian line says anything the original does not, list each such phrase (copied exactly from civ) in "added".\n' +
          'Return ONLY JSON: {"civ": "<civilian line>", "added": ["<phrase>"], "note": "<optional: anything you could not translate without more detail, else empty>"}',
        maxTokens: 400,
      });
      let out;
      try { out = JSON.parse(stripJsonFences(raw)); } catch { return NextResponse.json({ error: 'Could not translate that line. Try rewording it.' }, { status: 422 }); }
      await incrementUsage();
      return NextResponse.json({ mil: line, civ: out.civ || '', added: cleanAdded(out.added), note: out.note || '' });
    },
  },
};
