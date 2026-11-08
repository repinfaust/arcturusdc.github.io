// Shared API handler for the career-engine apps (Career Ops, Squared).
//
// Each app supplies its own Firestore collections, prompts, search settings and
// optional extra actions (see ./apps/*). The engine owns auth, metering, the CV
// library, analysis persistence and the job search, so a fix lands in both apps.
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';
import { callAnthropic, stripJsonFences } from './anthropic';
import { isUrl, fetchJdFromUrl, extractLinkedInJobId, fetchLinkedInJobDetail } from './jd';
import { searchJobs, cleanLocationList } from './jobSearch';

export const FREE_ACTIONS = 20;    // free allowance per tenant, per app
export const FIRST_USER_ACTIONS = 250; // extended allowance for invited early workspaces (e.g. Wayne)
export const COFFEE_BUNDLE = 50;   // actions granted per £5 top-up

function stripMarkdownFences(md) {
  if (!md || typeof md !== 'string') return '';
  return md
    .replace(/^\s*```(?:markdown|md)?\s*\r?\n/gim, '')
    .replace(/\r?\n\s*```\s*$/gim, '')
    .replace(/^\s*```\s*$/gm, '')
    .trim();
}

// Normalise config (string YAML or object/array) to readable text for prompts.
function configToText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

// Facts the prompts need from a profile that may be an object (Firestore) or a
// YAML string (the local demo profile).
// Profile list fields arrive as arrays (form) or comma-separated strings.
const list = (v) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
  .map((x) => String(x || '').trim()).filter(Boolean);

export function profileFacts(profile) {
  if (profile && typeof profile === 'object') {
    return {
      name: profile.name || '',
      currentRole: profile.current_role || '',
      location: profile.location || '',
      minSalary: Number(profile.min_salary) || 0,
      targetSalary: Number(profile.target_salary) || 0,
      targetRoles: list(profile.target_roles),
      stretchRoles: list(profile.stretch_roles),
      targetSectors: list(profile.target_sectors),
      excludedSectors: list(profile.excluded_sectors),
      workPattern: profile.work_pattern || '',
    };
  }
  const text = typeof profile === 'string' ? profile : '';
  const field = (k) => text.match(new RegExp(`^[ \\t]*${k}:[ \\t]*"?([^"\\n]+)"?`, 'm'))?.[1]?.trim() || '';
  const rolesBlock = text.match(/^target_roles:\s*\n((?:\s+-.*\n?)+)/m)?.[1] || '';
  return {
    name: field('name'),
    currentRole: field('current_role'),
    location: field('location'),
    minSalary: Number(field('min_salary')) || 0,
    targetSalary: 0,
    targetRoles: rolesBlock.split('\n').map((l) => l.replace(/^\s*-\s*"?|"?\s*$/g, '')).filter(Boolean),
    stretchRoles: [],
    targetSectors: [],
    excludedSectors: [],
    workPattern: '',
  };
}

const toIso = (v) => (v?.toDate ? v.toDate().toISOString() : null);
const toMs = (v) => (v?.toDate ? v.toDate().getTime() : (v?._seconds ? v._seconds * 1000 : 0));

export function createCareerHandler(app) {
  const tenantRef = (db, tenantId) => db.collection('tenants').doc(tenantId);
  const opsDoc = (db, tenantId, docId) => tenantRef(db, tenantId).collection(app.collections.ops).doc(docId);
  const analysesCol = (db, tenantId) => tenantRef(db, tenantId).collection(app.collections.analyses);
  const cvCol = (db, tenantId) => tenantRef(db, tenantId).collection(app.collections.cvUploads);
  const unlimited = new Set(app.unlimitedTenants || []);

  async function getConfigDoc(tenantId) {
    const { db } = getFirebaseAdmin();
    const snap = await opsDoc(db, tenantId, 'config').get();
    return snap.exists ? snap.data() : {};
  }

  async function getConfigField(tenantId, name, doc) {
    if (app.localConfig) {
      const local = await app.localConfig(tenantId, name);
      if (local != null) return local;
    }
    const data = doc || await getConfigDoc(tenantId);
    return data[name] || '';
  }

  // The user's active uploaded CV (full text). Empty string if none uploaded.
  async function getActiveCvText(tenantId) {
    try {
      const { db } = getFirebaseAdmin();
      const snap = await cvCol(db, tenantId).where('active', '==', true).limit(1).get();
      if (!snap.empty) return snap.docs[0].data().cv_text || '';
    } catch (e) { console.error('getActiveCvText failed', e?.message); }
    return '';
  }

  // Everything the prompts know about the candidate, assembled once per call.
  async function loadCandidate(tenantId, { withCv = true } = {}) {
    const doc = await getConfigDoc(tenantId);
    const profile = await getConfigField(tenantId, 'candidate_profile', doc);
    const evidence = await getConfigField(tenantId, 'evidence_library', doc);
    const profileText = configToText(profile);
    const evidenceText = configToText(evidence);
    const extras = app.contextExtras ? app.contextExtras(doc) : '';
    const cv = withCv ? await getActiveCvText(tenantId) : '';
    const cvBlock = cv ? `\n\n## Candidate's CV (primary reference):\n${cv.slice(0, 12000)}` : '';
    // Saved scoring weights travel with the facts so the evaluate prompt can
    // apply them (D-SITE-074); they were saved but never read before.
    const weights = doc.scoring_weights && typeof doc.scoring_weights === 'object' ? doc.scoring_weights : {};
    return {
      doc,
      profile,
      evidence,
      facts: { ...profileFacts(profile), weights },
      complete: !!profileText.trim() && !!evidenceText.trim(),
      cachedContext: `## Candidate Profile:\n${profileText}\n\n## Evidence Library:\n${evidenceText}${extras}${cvBlock}`,
    };
  }

  // --- Usage metering (one pool: analyse, tailor, search, extract, letters) ---
  async function getUsage(tenantId) {
    if (unlimited.has(tenantId)) {
      return { used: 0, granted: Infinity, remaining: Infinity, unlimited: true };
    }
    const { db } = getFirebaseAdmin();
    const usageRef = opsDoc(db, tenantId, 'usage');
    const snap = await usageRef.get();
    const v = snap.exists ? snap.data() : {};
    const used = v.actions_used || 0;
    let granted = v.actions_granted ?? FREE_ACTIONS;

    // Auto-grant 250 actions to Wayne's workspace on first check so he has full
    // runway without needing to enter an access code (D-SITE-081).
    if (granted <= FREE_ACTIONS && !v.early_user_checked) {
      try {
        const tSnap = await tenantRef(db, tenantId).get();
        const tName = String(tSnap.exists ? (tSnap.data()?.name || '') : '');
        if (/\bwayne\b/i.test(tName)) {
          granted = FIRST_USER_ACTIONS;
          await usageRef.set({ actions_granted: FIRST_USER_ACTIONS, early_user_checked: true, updated_at: new Date() }, { merge: true });
        } else if (snap.exists) {
          await usageRef.set({ early_user_checked: true }, { merge: true });
        }
      } catch {}
    }

    return { used, granted, remaining: Math.max(0, granted - used) };
  }

  async function assertActionAvailable(tenantId) {
    const u = await getUsage(tenantId);
    if (u.remaining <= 0) {
      const err = new Error(`You have used all your free ${app.name} actions. Buy a coffee to keep going.`);
      err.code = 'LIMIT_REACHED';
      err.usage = u;
      throw err;
    }
    return u;
  }

  async function incrementUsage(tenantId) {
    if (unlimited.has(tenantId)) return;
    const { db } = getFirebaseAdmin();
    const { FieldValue } = await import('firebase-admin/firestore');
    await opsDoc(db, tenantId, 'usage').set(
      { actions_used: FieldValue.increment(1), updated_at: new Date() },
      { merge: true }
    );
  }

  async function getAnalysisOr404(tenantId, id) {
    if (!id) return { error: NextResponse.json({ error: 'id is required' }, { status: 400 }) };
    const { db } = getFirebaseAdmin();
    const ref = analysesCol(db, tenantId).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return { error: NextResponse.json({ error: 'Analysis not found' }, { status: 404 }) };
    return { ref, analysis: doc.data() };
  }

  async function listAnalysisDocs(tenantId) {
    const { db } = getFirebaseAdmin();
    const col = analysesCol(db, tenantId);
    // Ordered query needs an index; fall back to unordered + in-memory sort.
    try {
      return await col.orderBy('createdAt', 'desc').limit(50).get();
    } catch (e) {
      console.error('analyses orderBy failed, falling back', e?.message);
      return await col.limit(50).get();
    }
  }

  return async function POST(request) {
    try {
      const body = await request.json();
      const { action, url, jd_text, tenantId } = body;

      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
      }

      // Every action reads or writes one workspace's private career data, so the
      // caller must be signed in and an active member of that workspace (D-SITE-033).
      const access = await verifySteaWorkspaceAccess(request, { tenantId });
      if (!access.ok) {
        return NextResponse.json({ error: access.error }, { status: access.status });
      }

      if (action === 'get_config') {
        const doc = await getConfigDoc(tenantId);
        const profile = await getConfigField(tenantId, 'candidate_profile', doc);
        const evidence = await getConfigField(tenantId, 'evidence_library', doc);
        const weights = await getConfigField(tenantId, 'scoring_weights', doc);

        // Evidence is "present" only if there's at least one anchor with content.
        const hasEvidence = Array.isArray(evidence)
          ? evidence.some((a) => a && (a.company || (a.bullets && a.bullets.some(Boolean))))
          : !!evidence;
        const hasProfile = profile && (profile.name || profile.current_role || profile.min_salary);

        const extras = {};
        for (const f of app.extraConfigFields || []) extras[f] = doc[f] ?? null;

        return NextResponse.json({
          has_config: !!hasProfile && !!hasEvidence,
          // Both the object keys the page reads and the plain keys.
          profile_obj: profile || null,
          evidence_obj: evidence || null,
          weights_obj: weights || null,
          profile,
          evidence,
          weights,
          ...extras,
        });
      }

      if (action === 'save_config') {
        // The page sends *_obj keys; accept both. Only fields present are written,
        // so saving one panel never blanks another.
        const update = { updated_at: new Date() };
        const pick = (objKey, key) => (objKey in body ? body[objKey] : (key in body ? body[key] : undefined));
        const profile = pick('profile_obj', 'profile');
        const evidence = pick('evidence_obj', 'evidence');
        const weights = pick('weights_obj', 'weights');
        if (profile !== undefined) update.candidate_profile = profile;
        if (evidence !== undefined) update.evidence_library = evidence;
        if (weights !== undefined) update.scoring_weights = weights;
        for (const f of app.extraConfigFields || []) {
          if (f in body) update[f] = body[f];
        }
        const { db } = getFirebaseAdmin();
        await opsDoc(db, tenantId, 'config').set(update, { merge: true });
        return NextResponse.json({ success: true });
      }

      if (action === 'analyse') {
        await assertActionAvailable(tenantId);
        const cand = await loadCandidate(tenantId);
        if (!cand.complete) {
          return NextResponse.json({ error: 'Workspace configuration is incomplete. Please set up your profile and evidence library first.' }, { status: 400 });
        }

        // Resolve the actual JD text. A bare URL (or a short search-card snippet
        // accompanied by a job URL) is fetched server-side — the LLM can't browse,
        // so passing only a title/snippet would under-score the role.
        let resolvedJd = (jd_text || '').trim();
        const looksLikeUrlOnly = isUrl(resolvedJd) && resolvedJd.length < 300 && !resolvedJd.includes('\n');
        if (!resolvedJd || looksLikeUrlOnly) {
          const target = looksLikeUrlOnly ? resolvedJd : (url || '');
          if (isUrl(target)) {
            const fetched = await fetchJdFromUrl(target);
            if (fetched) {
              resolvedJd = fetched;
            } else {
              return NextResponse.json({
                error: "Couldn't read the job description from that link (the site may block automated access or require login). Please copy the full job description text and paste it into the box instead — that gives the most accurate analysis.",
              }, { status: 422 });
            }
          }
        } else if (resolvedJd.length < 350 && isUrl(url || '')) {
          const fetched = await fetchJdFromUrl(url);
          if (fetched && fetched.length > resolvedJd.length) {
            resolvedJd = fetched;
          }
        }
        if (!resolvedJd) {
          return NextResponse.json({ error: 'Please paste a job description or a job-ad URL to analyse.' }, { status: 400 });
        }

        // 1. Extract structured JD data.
        const rawJdData = await callAnthropic({
          system: app.prompts.extractSystem(cand.facts),
          prompt: app.prompts.extract(resolvedJd, cand.facts),
        });
        const jdData = stripJsonFences(rawJdData);

        // 2. Evaluate against the candidate. Profile + evidence + CV are identical
        // across calls, so they go in cachedContext (cache_control).
        const evaluation = stripMarkdownFences(await callAnthropic({
          system: app.prompts.evaluateSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt: app.prompts.evaluate(jdData, cand.facts),
          maxTokens: 3000,
        }));

        await incrementUsage(tenantId); // one analyse = one action

        const parsedJd = JSON.parse(jdData);

        // Overall score from the evaluation markdown (e.g. "3.05 / 5.0").
        const scoreMatch =
          evaluation.match(/overall[^0-9]*([0-5](?:\.\d+)?)\s*\/\s*5/i) ||
          evaluation.match(/\b([0-5](?:\.\d+)?)\s*\/\s*5(?:\.0)?\b/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

        // Persist so it survives reload and populates the pipeline.
        let analysisId = null;
        try {
          const { db } = getFirebaseAdmin();
          const ref = await analysesCol(db, tenantId).add({
            company: parsedJd.company_name || 'Unknown company',
            role: parsedJd.role_title || 'Unknown role',
            level: parsedJd.level || '',
            location: parsedJd.location || '',
            score,
            status: 'Evaluated',
            jd_data: parsedJd,
            evaluation,
            source_url: isUrl((jd_text || '').trim()) ? (jd_text || '').trim() : (url || ''),
            createdAt: new Date(),
          });
          analysisId = ref.id;
        } catch (e) {
          console.error('Failed to persist analysis', e);
        }

        return NextResponse.json({ id: analysisId, score, jd_data: parsedJd, evaluation });
      }

      if (action === 'list_analyses') {
        const snap = await listAnalysisDocs(tenantId);
        const analyses = snap.docs
          .map((d) => {
            const v = d.data();
            return {
              id: d.id,
              company: v.company,
              role: v.role,
              level: v.level || '',
              score: v.score ?? null,
              status: v.status || 'Evaluated',
              source_url: v.source_url || '',
              _ms: toMs(v.createdAt),
              createdAt: toIso(v.createdAt),
            };
          })
          .sort((a, b) => b._ms - a._ms)
          .map(({ _ms, ...rest }) => rest);
        return NextResponse.json({ analyses });
      }

      if (action === 'get_analysis') {
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
        const { db } = getFirebaseAdmin();
        const doc = await analysesCol(db, tenantId).doc(id).get();
        if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const v = doc.data();
        return NextResponse.json({ id: doc.id, ...v, createdAt: toIso(v.createdAt) });
      }

      // Role-tailored CV for an analysed role, saved against that role.
      // Supports an optional `edit_instruction` to revise an existing tailored CV.
      if (action === 'tailor_cv') {
        await assertActionAvailable(tenantId);
        const { edit_instruction = '' } = body;
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cand = await loadCandidate(tenantId);
        if (!cand.complete) {
          return NextResponse.json({ error: 'Set up your profile and evidence library before tailoring a CV.' }, { status: 400 });
        }

        const jdBlock = JSON.stringify(analysis.jd_data || {}, null, 2) +
          (analysis.company_context ? `\n\nCOMPANY & ROLE CONTEXT (research / notes):\n${analysis.company_context}` : '');
        const existingCv = analysis.tailored_cv || '';
        const prompt = edit_instruction.trim() && existingCv
          ? `Here is the current tailored CV for this role:\n\n${existingCv}\n\n` +
            `Role context:\n${jdBlock}\n\n` +
            `Revise the tailored CV per this instruction: "${edit_instruction.trim()}". ` +
            `Keep every claim strictly grounded in the candidate's real evidence and base CV — never invent a role, metric, or qualification. ` +
            `Preserve the markdown structure (tailored CV followed by \`---\` and \`### What was tailored\`).`
          : app.prompts.tailor(jdBlock, cand.facts);

        const tailoredCv = stripMarkdownFences(await callAnthropic({
          system: app.prompts.tailorSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt,
          maxTokens: 4000,
        }));

        await ref.set({ tailored_cv: tailoredCv, tailored_cv_at: new Date(), status: 'Applying' }, { merge: true });
        await incrementUsage(tenantId); // one tailor / revision = one action
        return NextResponse.json({ id: body.id, tailored_cv: tailoredCv, status: 'Applying' });
      }

      // Save a user's manual inline edits to a tailored CV (free — no AI call).
      if (action === 'save_tailored_cv') {
        const { tailored_cv = '' } = body;
        if (!tailored_cv.trim()) return NextResponse.json({ error: 'Tailored CV cannot be empty.' }, { status: 400 });
        const { ref, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cleaned = stripMarkdownFences(tailored_cv);
        await ref.set({ tailored_cv: cleaned, tailored_cv_at: new Date() }, { merge: true });
        return NextResponse.json({ id: body.id, tailored_cv: cleaned });
      }

      // Save user-edited company / role context notes (free — no AI call).
      if (action === 'save_company_context') {
        const { company_context = '' } = body;
        const { ref, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        await ref.set({ company_context, company_context_at: new Date() }, { merge: true });
        return NextResponse.json({ id: body.id, company_context });
      }

      // Research the company and role context (web search + JD synthesis, 1 action).
      if (action === 'research_company') {
        await assertActionAvailable(tenantId);
        const { user_notes = '' } = body;
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const company = analysis.company || analysis.jd_data?.company_name || 'Unknown company';
        const roleTitle = analysis.role || analysis.jd_data?.role_title || 'Role';
        const jd = JSON.stringify(analysis.jd_data || {}, null, 2);

        const companyContext = stripMarkdownFences(await callAnthropic({
          system:
            'You are a sharp career research analyst. Use web search when helpful to find current, factual context about the employer, their products/programmes, regulatory or commercial pressures, and what matters most for this role. Be concise, specific, and practical — no generic filler.',
          prompt:
            `Research the employer and role below to help the candidate tailor their application and prepare for interviews.\n\n` +
            `Company: ${company}\nRole: ${roleTitle}\n` +
            (analysis.source_url ? `Source URL: ${analysis.source_url}\n` : '') +
            (user_notes.trim() ? `Candidate's own notes / angle: ${user_notes.trim()}\n` : '') +
            `\nExtracted JD:\n${jd}\n\n` +
            `Return a concise markdown briefing with:\n` +
            `- **What they do & current focus:** 2–3 bullets on the organisation, recent product/programme priorities, or sector pressures.\n` +
            `- **What this role is really solving:** 2–3 bullets reading between the lines of the JD.\n` +
            `- **Hooks to weave into CV / cover letter:** 2–3 concrete angles connecting the company's context to the role.` +
            (user_notes.trim() ? `\n- **Candidate notes incorporated:** keep the candidate's own notes intact.` : ''),
          maxTokens: 1500,
          tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        }));

        await ref.set({ company_context: companyContext, company_context_at: new Date() }, { merge: true });
        await incrementUsage(tenantId);
        return NextResponse.json({ id: body.id, company_context: companyContext });
      }

      // Generate an interview preparation brief for an analysed role (1 action).
      if (action === 'interview_brief') {
        await assertActionAvailable(tenantId);
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cand = await loadCandidate(tenantId, { withCv: true });
        if (!cand.complete) {
          return NextResponse.json({ error: 'Set up your profile and evidence library first.' }, { status: 400 });
        }

        const jdBlock = JSON.stringify(analysis.jd_data || {}, null, 2) +
          (analysis.company_context ? `\n\nCOMPANY & ROLE CONTEXT:\n${analysis.company_context}` : '');

        const brief = stripMarkdownFences(await callAnthropic({
          system:
            'You prepare a candidate for an interview using ONLY their real profile, evidence anchors, and CV. Never invent experience. Be direct, practical, and specific.',
          cachedContext: cand.cachedContext,
          prompt:
            `Prepare a 1-page interview briefing for ${cand.facts.name} interviewing for ${analysis.role || 'this role'} at ${analysis.company || 'this employer'}.\n\n` +
            `ROLE & COMPANY CONTEXT:\n${jdBlock}\n\n` +
            `PRIOR FIT EVALUATION (including any flagged gaps/risks):\n${analysis.evaluation || 'None'}\n\n` +
            `Structure the briefing in clean markdown with these sections:\n` +
            `## 1. Your 60-Second Pitch for This Role\nA tight opening positioning statement grounded in their real record.\n\n` +
            `## 2. Likely Questions & Which Evidence to Lead With\n5 role-specific questions the panel is likely to ask. For each, name the exact role/project from the candidate's evidence to use and 2–3 bullet talking points.\n\n` +
            `## 3. How to Handle Flagged Gaps / Watch-outs\nDirect, honest ways to frame any gaps or risks identified in the evaluation without bluffing.\n\n` +
            `## 4. Sharp Questions to Ask the Panel\n3 specific questions tailored to this role and organisation.`,
          maxTokens: 2800,
        }));

        await ref.set({ interview_brief: brief, interview_brief_at: new Date() }, { merge: true });
        await incrementUsage(tenantId);
        return NextResponse.json({ id: body.id, interview_brief: brief });
      }

      // Saved tailored CVs: analyses that have one.
      if (action === 'list_cvs') {
        const snap = await listAnalysisDocs(tenantId);
        const cvs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((v) => v.tailored_cv)
          .map((v) => ({
            id: v.id,
            company: v.company,
            role: v.role,
            status: v.status || 'Applying',
            tailored_cv: v.tailored_cv,
            _ms: toMs(v.tailored_cv_at),
            tailored_cv_at: toIso(v.tailored_cv_at),
          }))
          .sort((a, b) => b._ms - a._ms)
          .map(({ _ms, ...rest }) => rest);
        return NextResponse.json({ cvs });
      }

      if (action === 'search_jobs') {
        await assertActionAvailable(tenantId);
        const { keywords = '', location = '', salary_min, exclude_employer = '', mode = 'both' } = body;
        const doc = await getConfigDoc(tenantId);
        const profile = await getConfigField(tenantId, 'candidate_profile', doc);
        const facts = profileFacts(profile);
        const excludeEmployers = Array.isArray(exclude_employer) ? exclude_employer : [exclude_employer];
        let result;
        try {
          result = await searchJobs({
            keywords,
            location,
            salary_min,
            excludeEmployers,
            mode,
            // Stretch roles are searched alongside the core targets.
            targetRoles: [...facts.targetRoles, ...facts.stretchRoles],
            defaultTerm: app.search.defaultTerm,
            hardExclude: app.search.hardExclude,
            rankBackground: app.search.rankBackground(facts, profile),
            rankRules: app.search.rankRules ? app.search.rankRules(facts) : '',
          });
        } catch (e) {
          if (e.status) return NextResponse.json({ error: e.message }, { status: e.status });
          throw e;
        }
        if (app.search.enrich) result.jobs = app.search.enrich(result.jobs, profile);
        await incrementUsage(tenantId); // one search = one action
        return NextResponse.json(result);
      }

      // --- Morning Scout Queue & Preferences (persisted per workspace in Firestore) ---
      if (action === 'get_scout_queue') {
        const { db } = getFirebaseAdmin();
        const snap = await opsDoc(db, tenantId, 'scout_queue').get();
        const data = snap.exists ? snap.data() : {};
        return NextResponse.json({
          jobs: Array.isArray(data.jobs) ? data.jobs : [],
          last_run_at: toIso(data.last_run_at),
          sources: Array.isArray(data.sources) ? data.sources : [],
          prefs: data.prefs || null,
        });
      }

      if (action === 'save_scout_queue') {
        const { jobs = [], prefs } = body;
        const { db } = getFirebaseAdmin();
        const payload = {
          jobs: Array.isArray(jobs) ? jobs.slice(0, 40) : [],
          updated_at: new Date(),
        };
        if (prefs && typeof prefs === 'object') payload.prefs = prefs;
        await opsDoc(db, tenantId, 'scout_queue').set(payload, { merge: true });
        return NextResponse.json({ success: true });
      }

      if (action === 'save_scout_prefs') {
        const { prefs = {} } = body;
        const { db } = getFirebaseAdmin();
        await opsDoc(db, tenantId, 'scout_queue').set(
          { prefs, updated_at: new Date() },
          { merge: true }
        );
        return NextResponse.json({ success: true, prefs });
      }

      // Server-side Morning Scout Agent (1 action): searches LinkedIn Jobs
      // (`jobs-guest` public API) + Reed + Adzuna against the candidate's
      // honed target roles, locations, source toggles, and steering instructions,
      // filters out roles already in the pipeline, ranks the best matches, and
      // pulls the full LinkedIn JD for each match.
      if (action === 'morning_scout') {
        await assertActionAvailable(tenantId);
        const { linkedin_url = '', keywords = '', prefs: incomingPrefs, replace_queue = true } = body;
        const doc = await getConfigDoc(tenantId);
        const profile = await getConfigField(tenantId, 'candidate_profile', doc);
        const evidence = await getConfigField(tenantId, 'evidence_library', doc);
        const facts = profileFacts(profile);

        // Current/most-recent employer exclusion so we don't scout their own company.
        const currentEmployer = Array.isArray(evidence) && evidence[0]?.company ? [evidence[0].company] : [];

        // Load existing pipeline + existing scout queue for deduplication.
        const { db } = getFirebaseAdmin();
        const [analysesSnap, queueSnap] = await Promise.all([
          listAnalysisDocs(tenantId),
          opsDoc(db, tenantId, 'scout_queue').get(),
        ]);
        const existingPipelineKeys = new Set(
          analysesSnap.docs.map((d) => {
            const v = d.data();
            return `${String(v.role || '').toLowerCase().trim()}|${String(v.company || '').toLowerCase().trim()}`;
          })
        );
        const queueData = queueSnap.exists ? (queueSnap.data() || {}) : {};
        const existingQueue = Array.isArray(queueData.jobs) ? queueData.jobs : [];
        const savedPrefs = queueData.prefs || {};
        const activePrefs = incomingPrefs && typeof incomingPrefs === 'object'
          ? { ...savedPrefs, ...incomingPrefs }
          : savedPrefs;

        // Build effective target roles: prefer honed `activePrefs.roles`, otherwise
        // combine currentRole + targetRoles + stretchRoles with senior titles first.
        const rawProfileRoles = [
          facts.currentRole,
          ...(facts.targetRoles || []),
          ...(facts.stretchRoles || []),
        ].map((r) => String(r || '').trim()).filter(Boolean);
        const seniorFirstProfileRoles = [
          ...rawProfileRoles.filter((r) => /\b(senior|lead|principal|founding|head|director|vp|group)\b/i.test(r)),
          ...rawProfileRoles.filter((r) => !/\b(senior|lead|principal|founding|head|director|vp|group)\b/i.test(r)),
        ];
        const effectiveRoles = Array.isArray(activePrefs.roles) && activePrefs.roles.length > 0
          ? activePrefs.roles.map((r) => String(r || '').trim()).filter(Boolean)
          : [...new Set(seniorFirstProfileRoles)];

        const effectiveLocations = cleanLocationList(
          facts.location || 'United Kingdom',
          Array.isArray(activePrefs.locations) ? activePrefs.locations : []
        );

        const includeRemote = activePrefs.include_remote !== undefined
          ? Boolean(activePrefs.include_remote)
          : /remote|hybrid/i.test(facts.workPattern || '') || /remote/i.test(facts.location || '');

        const mode = includeRemote
          ? (effectiveLocations.length > 0 ? 'both' : 'remote')
          : 'location';

        const enabledSources = Array.isArray(activePrefs.sources) && activePrefs.sources.length > 0
          ? activePrefs.sources
          : ['linkedin', 'reed', 'adzuna'];

        const steering = typeof activePrefs.steering === 'string' ? activePrefs.steering.trim() : '';
        const excludedTitles = Array.isArray(activePrefs.excluded_titles) ? activePrefs.excluded_titles : [];

        const directJobs = [];
        const singleLinkedInId = extractLinkedInJobId(linkedin_url);
        if (singleLinkedInId && !/\/jobs\/search/i.test(linkedin_url)) {
          const detail = await fetchLinkedInJobDetail(singleLinkedInId);
          if (detail) {
            directJobs.push({
              source: 'LinkedIn',
              title: detail.title,
              company: detail.company,
              location: detail.location,
              url: detail.url,
              jd_text: detail.fullText,
              relevance: 95,
              why: 'Direct LinkedIn URL',
              harvestedAt: new Date().toISOString(),
            });
          }
        }

        const searchRes = await searchJobs({
          keywords,
          location: effectiveLocations[0] || 'United Kingdom',
          locations: effectiveLocations,
          salary_min: undefined, // keep salary-unlisted LinkedIn/ATS roles in the pool
          excludeEmployers: currentEmployer,
          mode,
          targetRoles: effectiveRoles,
          defaultTerm: app.search.defaultTerm,
          hardExclude: app.search.hardExclude,
          excludedTitles,
          enabledSources,
          steering,
          minScore: 55,
          rankBackground: app.search.rankBackground(facts, profile),
          rankRules: app.search.rankRules ? app.search.rankRules(facts) : '',
          linkedInSearchUrl: /linkedin\.com\/jobs\/search/i.test(linkedin_url) ? linkedin_url : '',
        });

        // Filter out roles already analysed in pipeline and take top 12 fresh matches.
        const freshCandidates = (searchRes.jobs || [])
          .filter((j) => {
            const key = `${String(j.title || '').toLowerCase().trim()}|${String(j.company || '').toLowerCase().trim()}`;
            return !existingPipelineKeys.has(key);
          })
          .slice(0, 12);

        // Fetch full LinkedIn JDs in parallel for all LinkedIn matches.
        const enrichedFresh = await Promise.all(
          freshCandidates.map(async (j) => {
            const liId = j.jobId || extractLinkedInJobId(j.url);
            let fullJd = j.description || '';
            if (liId) {
              const detail = await fetchLinkedInJobDetail(liId);
              if (detail?.fullText) fullJd = detail.fullText;
            }
            return {
              source: j.source || (liId ? 'LinkedIn' : 'Job Board'),
              title: j.title || 'Untitled role',
              company: j.company || 'Unknown company',
              location: j.location || '',
              salary: j.salary || '',
              url: j.url || '',
              jd_text: fullJd || `${j.title} at ${j.company}`,
              relevance: j.relevance ?? null,
              why: j.why || '',
              harvestedAt: new Date().toISOString(),
            };
          })
        );

        const seen = new Set();
        const merged = [];
        const baseQueue = replace_queue ? [...directJobs, ...enrichedFresh] : [...directJobs, ...enrichedFresh, ...existingQueue];
        for (const item of baseQueue) {
          const key = `${String(item.title || '').toLowerCase().trim()}|${String(item.company || '').toLowerCase().trim()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(item);
        }
        const finalQueue = merged.slice(0, 30);
        const persistedPrefs = {
          roles: effectiveRoles,
          locations: effectiveLocations,
          include_remote: includeRemote,
          sources: enabledSources,
          steering,
          excluded_titles: excludedTitles,
        };
        const now = new Date();
        await opsDoc(db, tenantId, 'scout_queue').set(
          {
            jobs: finalQueue,
            prefs: persistedPrefs,
            last_run_at: now,
            sources: searchRes.sources || ['linkedin'],
            updated_at: now,
          },
          { merge: true }
        );
        await incrementUsage(tenantId);

        return NextResponse.json({
          jobs: finalQueue,
          prefs: persistedPrefs,
          added_count: directJobs.length + enrichedFresh.length,
          last_run_at: now.toISOString(),
          sources: searchRes.sources || ['linkedin'],
          debug: searchRes.debug || null,
        });
      }

      // --- CV library (uploaded CVs; the source of truth for the candidate) ---
      if (action === 'save_cv') {
        const { label = 'My CV', cv_text = '', make_active = true } = body;
        if (!cv_text.trim()) return NextResponse.json({ error: 'No CV text provided.' }, { status: 400 });
        const { db } = getFirebaseAdmin();
        const col = cvCol(db, tenantId);
        if (make_active) {
          const existing = await col.where('active', '==', true).get();
          const batch = db.batch();
          existing.docs.forEach((d) => batch.update(d.ref, { active: false }));
          await batch.commit();
        }
        const ref = await col.add({
          label: label.trim() || 'My CV',
          cv_text,
          active: !!make_active,
          createdAt: new Date(),
        });
        return NextResponse.json({ id: ref.id });
      }

      if (action === 'list_cv_uploads') {
        const { db } = getFirebaseAdmin();
        const col = cvCol(db, tenantId);
        let snap;
        try { snap = await col.orderBy('createdAt', 'desc').limit(50).get(); }
        catch { snap = await col.limit(50).get(); }
        const cvs = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id, label: v.label, active: !!v.active,
            preview: (v.cv_text || '').slice(0, 160),
            cv_text: v.cv_text || '',
            createdAt: toIso(v.createdAt),
          };
        }).sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
        return NextResponse.json({ cvs });
      }

      if (action === 'set_active_cv') {
        const { id, label } = body;
        const { db } = getFirebaseAdmin();
        const col = cvCol(db, tenantId);
        if (id) {
          const existing = await col.where('active', '==', true).get();
          const batch = db.batch();
          existing.docs.forEach((d) => batch.update(d.ref, { active: false }));
          const update = { active: true };
          if (typeof label === 'string') update.label = label.trim() || 'My CV';
          batch.set(col.doc(id), update, { merge: true });
          await batch.commit();
        } else if (typeof label === 'string' && body.relabel_id) {
          await col.doc(body.relabel_id).set({ label: label.trim() || 'My CV' }, { merge: true });
        }
        return NextResponse.json({ success: true });
      }

      if (action === 'relabel_cv') {
        const { id, label } = body;
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const { db } = getFirebaseAdmin();
        await cvCol(db, tenantId).doc(id).set({ label: (label || 'My CV').trim() }, { merge: true });
        return NextResponse.json({ success: true });
      }

      if (action === 'delete_cv') {
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        const { db } = getFirebaseAdmin();
        await cvCol(db, tenantId).doc(id).delete();
        return NextResponse.json({ success: true });
      }

      // AI-extract profile + evidence anchors from an uploaded CV (one action).
      if (action === 'extract_from_cv') {
        await assertActionAvailable(tenantId);
        const { id } = body;
        let cvText = body.cv_text || '';
        if (!cvText && id) {
          const { db } = getFirebaseAdmin();
          const doc = await cvCol(db, tenantId).doc(id).get();
          cvText = doc.exists ? (doc.data().cv_text || '') : '';
        }
        if (!cvText.trim()) return NextResponse.json({ error: 'No CV text to extract from.' }, { status: 400 });

        const raw = await callAnthropic({
          system: 'You extract structured career data from a CV. Use ONLY what is in the CV — never invent. Respond with ONLY valid JSON.',
          prompt: app.prompts.cvExtract(cvText.slice(0, 12000)),
          maxTokens: 2500,
        });
        let extracted;
        try { extracted = JSON.parse(stripJsonFences(raw)); } catch { return NextResponse.json({ error: 'Could not parse the CV. Try pasting the text, or fill the form manually.' }, { status: 422 }); }
        await incrementUsage(tenantId);
        return NextResponse.json({ profile: extracted.profile || {}, evidence: extracted.evidence || [] });
      }

      if (action === 'get_usage') {
        const u = await getUsage(tenantId);
        // Infinity isn't JSON; send null + unlimited flag for exempt tenants.
        const safe = u.unlimited ? { used: 0, granted: null, remaining: null, unlimited: true } : u;
        return NextResponse.json({ ...safe, free_actions: FREE_ACTIONS, bundle: COFFEE_BUNDLE });
      }

      // --- Apply Assist: extra application fields the user fills once and reuses ---
      if (action === 'get_apply_profile') {
        const { db } = getFirebaseAdmin();
        const snap = await opsDoc(db, tenantId, 'apply_profile').get();
        return NextResponse.json({ apply_profile: snap.exists ? snap.data() : {} });
      }
      if (action === 'save_apply_profile') {
        const { apply_profile = {} } = body;
        const { db } = getFirebaseAdmin();
        await opsDoc(db, tenantId, 'apply_profile').set({ ...apply_profile, updated_at: new Date() }, { merge: true });
        return NextResponse.json({ success: true });
      }

      // First-run onboarding dismissal (per workspace).
      if (action === 'get_onboarding') {
        const { db } = getFirebaseAdmin();
        const snap = await opsDoc(db, tenantId, 'prefs').get();
        return NextResponse.json({ onboarding_dismissed: !!(snap.exists && snap.data().onboarding_dismissed) });
      }
      if (action === 'dismiss_onboarding') {
        const { db } = getFirebaseAdmin();
        await opsDoc(db, tenantId, 'prefs').set({ onboarding_dismissed: true, updated_at: new Date() }, { merge: true });
        return NextResponse.json({ success: true });
      }

      // Friendlies access code → unlimited actions for this workspace (no payment).
      // The code lives only in Vercel env; redemption is disabled when unset (D-SITE-033, D-SITE-080).
      if (action === 'redeem_code') {
        const { code = '' } = body;
        const valid = process.env[app.accessCodeEnv] || process.env.CAREER_ACCESS_CODE || '';
        if (!valid || (code || '').trim().toUpperCase() !== valid.toUpperCase()) {
          return NextResponse.json({ error: 'That code isn\'t valid.' }, { status: 400 });
        }
        const { db } = getFirebaseAdmin();
        await opsDoc(db, tenantId, 'usage').set(
          { unlimited_code: true, actions_granted: 100000, updated_at: new Date() },
          { merge: true }
        );
        return NextResponse.json({ success: true });
      }

      // Generate (or revise) a tailored cover letter for an analysed role.
      if (action === 'cover_letter') {
        await assertActionAvailable(tenantId);
        const { edit_instruction = '' } = body;
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cand = await loadCandidate(tenantId, { withCv: false });
        if (!cand.complete) {
          return NextResponse.json({ error: 'Set up your profile and evidence library first.' }, { status: 400 });
        }

        const jd = JSON.stringify(analysis.jd_data || {}, null, 2) +
          (analysis.company_context ? `\n\nCOMPANY & ROLE CONTEXT:\n${analysis.company_context}` : '');
        const existing = analysis.cover_letter || '';
        const prompt = edit_instruction && existing
          ? `Here is the current cover letter:\n\n${existing}\n\nRole & company context:\n${jd}\n\nRevise it per this instruction: "${edit_instruction}". Keep it grounded in the candidate's real evidence — do not invent anything. Return ONLY the revised cover letter.`
          : `Write a tailored cover letter for this role:\n\n${jd}\n\nGround every claim in the candidate's profile and evidence above. If company context is provided, weave it in naturally. 250-350 words, professional but human, no clichés, address it "Dear Hiring Manager,". Return ONLY the cover letter.`;

        const coverLetter = await callAnthropic({
          system: app.prompts.coverSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt,
          maxTokens: 1500,
        });

        await ref.set({ cover_letter: coverLetter, cover_letter_at: new Date() }, { merge: true });
        await incrementUsage(tenantId);
        return NextResponse.json({ id: body.id, cover_letter: coverLetter });
      }

      // Draft the common application free-text answers for a role.
      if (action === 'apply_answers') {
        await assertActionAvailable(tenantId);
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cand = await loadCandidate(tenantId, { withCv: false });

        const jd = JSON.stringify(analysis.jd_data || {}, null, 2) +
          (analysis.company_context ? `\n\nCOMPANY & ROLE CONTEXT:\n${analysis.company_context}` : '');
        const existingCustom = Array.isArray(analysis.apply_answers)
          ? analysis.apply_answers.filter((qa) => qa?.custom)
          : [];

        const raw = await callAnthropic({
          system: app.prompts.answersSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt: `For this role:\n${jd}\n\n` +
            `Draft concise, specific answers (2-4 sentences each, first person, no clichés) to the common application questions. ` +
            `Return ONLY a JSON array of {"q": "<question>", "a": "<answer>"} for: ` +
            `"Why are you interested in this role?", "Why do you want to work here?", "What makes you a good fit?", "What is your relevant experience?".`,
          maxTokens: 1500,
        });
        const cleaned = stripJsonFences(raw);
        let answers = [];
        try { answers = JSON.parse(cleaned); } catch { answers = [{ q: 'Draft answers', a: cleaned }]; }
        const merged = [...answers, ...existingCustom];

        await ref.set({ apply_answers: merged, apply_answers_at: new Date() }, { merge: true });
        await incrementUsage(tenantId);
        return NextResponse.json({ id: body.id, apply_answers: merged });
      }

      // Draft an answer to a custom portal application question for a role (1 action).
      if (action === 'custom_question') {
        await assertActionAvailable(tenantId);
        const { question = '', guidance = '' } = body;
        if (!question.trim()) {
          return NextResponse.json({ error: 'Enter the application question to answer.' }, { status: 400 });
        }
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cand = await loadCandidate(tenantId, { withCv: true });
        if (!cand.complete) {
          return NextResponse.json({ error: 'Set up your profile and evidence library first.' }, { status: 400 });
        }

        const jd = JSON.stringify(analysis.jd_data || {}, null, 2) +
          (analysis.company_context ? `\n\nCOMPANY & ROLE CONTEXT:\n${analysis.company_context}` : '');

        const answer = await callAnthropic({
          system: app.prompts.answersSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt:
            `Role & company context:\n${jd}\n\n` +
            `Application form question: "${question.trim()}"\n` +
            (guidance.trim() ? `Word limit / angle / guidance: "${guidance.trim()}"\n` : '') +
            `\nWrite a direct, first-person answer grounded strictly in the candidate's real evidence anchors and CV above. ` +
            `Do not invent any metric, employer, qualification, or project. Avoid AI clichés. Return ONLY the answer text.`,
          maxTokens: 1200,
        });

        const existing = Array.isArray(analysis.apply_answers) ? analysis.apply_answers : [];
        const label = guidance.trim() ? `${question.trim()} (${guidance.trim()})` : question.trim();
        const nextAnswers = [...existing, { q: label, a: answer.trim(), custom: true }];

        await ref.set({ apply_answers: nextAnswers, apply_answers_at: new Date() }, { merge: true });
        await incrementUsage(tenantId);
        return NextResponse.json({ id: body.id, apply_answers: nextAnswers });
      }

      // Save edited or deleted application answers on a role (free — no AI call).
      if (action === 'save_apply_answers') {
        const { apply_answers = [] } = body;
        const { ref, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        await ref.set({ apply_answers: Array.isArray(apply_answers) ? apply_answers : [], apply_answers_at: new Date() }, { merge: true });
        return NextResponse.json({ id: body.id, apply_answers });
      }

      // App-specific actions (e.g. Squared's skills translator).
      const extra = app.extraActions?.[action];
      if (extra) {
        return await extra({
          body,
          tenantId,
          loadCandidate: (opts) => loadCandidate(tenantId, opts),
          getUsage: () => getUsage(tenantId),
          assertActionAvailable: () => assertActionAvailable(tenantId),
          incrementUsage: () => incrementUsage(tenantId),
        });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
      // Out-of-actions is a normal state, not a server error — return 402 + usage
      // so the UI can show the "buy a coffee" prompt.
      if (error?.code === 'LIMIT_REACHED') {
        return NextResponse.json({ error: error.message, limit_reached: true, usage: error.usage }, { status: 402 });
      }
      console.error(`${app.name} Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  };
}
