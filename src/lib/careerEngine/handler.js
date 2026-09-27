// Shared API handler for the career-engine apps (Career Ops, Squared).
//
// Each app supplies its own Firestore collections, prompts, search settings and
// optional extra actions (see ./apps/*). The engine owns auth, metering, the CV
// library, analysis persistence and the job search, so a fix lands in both apps.
import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';
import { callAnthropic, stripJsonFences } from './anthropic';
import { isUrl, fetchJdFromUrl } from './jd';
import { searchJobs } from './jobSearch';

export const FREE_ACTIONS = 20;    // free allowance per tenant, per app
export const COFFEE_BUNDLE = 50;   // actions granted per £5 top-up

// Normalise config (string YAML or object/array) to readable text for prompts.
function configToText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

// Facts the prompts need from a profile that may be an object (Firestore) or a
// YAML string (the local demo profile).
export function profileFacts(profile) {
  if (profile && typeof profile === 'object') {
    return {
      name: profile.name || '',
      currentRole: profile.current_role || '',
      location: profile.location || '',
      minSalary: Number(profile.min_salary) || 0,
      targetRoles: Array.isArray(profile.target_roles) ? profile.target_roles.filter(Boolean) : [],
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
    targetRoles: rolesBlock.split('\n').map((l) => l.replace(/^\s*-\s*"?|"?\s*$/g, '')).filter(Boolean),
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
    return {
      doc,
      profile,
      evidence,
      facts: profileFacts(profile),
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
    const snap = await opsDoc(db, tenantId, 'usage').get();
    const v = snap.exists ? snap.data() : {};
    const used = v.actions_used || 0;
    const granted = (v.actions_granted ?? FREE_ACTIONS);
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

        // Resolve the actual JD text. A bare URL is fetched server-side — the
        // LLM can't browse, so passing it through would only score the title.
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
        const evaluation = await callAnthropic({
          system: app.prompts.evaluateSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt: app.prompts.evaluate(jdData, cand.facts),
          maxTokens: 3000,
        });

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
      if (action === 'tailor_cv') {
        await assertActionAvailable(tenantId);
        const { ref, analysis, error } = await getAnalysisOr404(tenantId, body.id);
        if (error) return error;
        const cand = await loadCandidate(tenantId);
        if (!cand.complete) {
          return NextResponse.json({ error: 'Set up your profile and evidence library before tailoring a CV.' }, { status: 400 });
        }

        const tailoredCv = await callAnthropic({
          system: app.prompts.tailorSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt: app.prompts.tailor(JSON.stringify(analysis.jd_data || {}, null, 2), cand.facts),
          maxTokens: 4000,
        });

        await ref.set({ tailored_cv: tailoredCv, tailored_cv_at: new Date(), status: 'Applying' }, { merge: true });
        await incrementUsage(tenantId); // one tailor = one action
        return NextResponse.json({ id: body.id, tailored_cv: tailoredCv, status: 'Applying' });
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
            targetRoles: facts.targetRoles,
            defaultTerm: app.search.defaultTerm,
            hardExclude: app.search.hardExclude,
            rankBackground: app.search.rankBackground(facts, profile),
          });
        } catch (e) {
          if (e.status) return NextResponse.json({ error: e.message }, { status: e.status });
          throw e;
        }
        if (app.search.enrich) result.jobs = app.search.enrich(result.jobs, profile);
        await incrementUsage(tenantId); // one search = one action
        return NextResponse.json(result);
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
      // The code lives only in Vercel env; redemption is disabled when unset (D-SITE-033).
      if (action === 'redeem_code') {
        const { code = '' } = body;
        const valid = process.env[app.accessCodeEnv] || '';
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

        const jd = JSON.stringify(analysis.jd_data || {}, null, 2);
        const existing = analysis.cover_letter || '';
        const prompt = edit_instruction && existing
          ? `Here is the current cover letter:\n\n${existing}\n\nRevise it per this instruction: "${edit_instruction}". Keep it grounded in the candidate's real evidence — do not invent anything. Return ONLY the revised cover letter.`
          : `Write a tailored cover letter for this role:\n\n${jd}\n\nGround every claim in the candidate's profile and evidence above. 250-350 words, professional but human, no clichés, address it "Dear Hiring Manager,". Return ONLY the cover letter.`;

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

        const raw = await callAnthropic({
          system: app.prompts.answersSystem(cand.facts),
          cachedContext: cand.cachedContext,
          prompt: `For this role:\n${JSON.stringify(analysis.jd_data || {}, null, 2)}\n\n` +
            `Draft concise, specific answers (2-4 sentences each, first person, no clichés) to the common application questions. ` +
            `Return ONLY a JSON array of {"q": "<question>", "a": "<answer>"} for: ` +
            `"Why are you interested in this role?", "Why do you want to work here?", "What makes you a good fit?", "What is your relevant experience?".`,
          maxTokens: 1500,
        });
        const cleaned = stripJsonFences(raw);
        let answers = [];
        try { answers = JSON.parse(cleaned); } catch { answers = [{ q: 'Draft answers', a: cleaned }]; }

        await ref.set({ apply_answers: answers, apply_answers_at: new Date() }, { merge: true });
        await incrementUsage(tenantId);
        return NextResponse.json({ id: body.id, apply_answers: answers });
      }

      // App-specific actions (e.g. Squared's skills translator).
      const extra = app.extraActions?.[action];
      if (extra) {
        return await extra({
          body,
          tenantId,
          loadCandidate: (opts) => loadCandidate(tenantId, opts),
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
