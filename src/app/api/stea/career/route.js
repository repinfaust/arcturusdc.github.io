import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

// David's workspace ID (ArcturusDC primary tenant or his specific one)
const DAVID_TENANT_ID = 'KovW8P7K5O2537V8I3H1';

const isUrl = (s) => /^https?:\/\//i.test((s || '').trim());

// Strip HTML tags/entities to readable plain text.
function htmlToText(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

// Pull a JobPosting description out of a page's JSON-LD blocks, if present.
function extractJobPostingFromJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of blocks) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const candidates = Array.isArray(data) ? data : (data['@graph'] || [data]);
    for (const node of candidates) {
      const type = node && node['@type'];
      const isJob = type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'));
      if (isJob && node.description) {
        const title = node.title ? `${node.title}\n\n` : '';
        const company = node.hiringOrganization?.name ? `Company: ${node.hiringOrganization.name}\n` : '';
        const loc = node.jobLocation?.address?.addressLocality ? `Location: ${node.jobLocation.address.addressLocality}\n` : '';
        const salary = node.baseSalary?.value?.minValue ? `Salary: ${node.baseSalary.value.minValue}-${node.baseSalary.value.maxValue || ''} ${node.baseSalary.currency || ''}\n` : '';
        return htmlToText(`${title}${company}${loc}${salary}\n${node.description}`);
      }
    }
  }
  return null;
}

// Fetch a job-ad URL and return the best plain-text JD we can extract.
// Returns null if the page can't be fetched or yields no usable description.
async function fetchJdFromUrl(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();

  // 1) Prefer structured JobPosting JSON-LD (Reed, Indeed, Greenhouse, etc.)
  const fromJsonLd = extractJobPostingFromJsonLd(html);
  if (fromJsonLd && fromJsonLd.length > 200) return fromJsonLd;

  // 2) Fallback: og:description / meta description (short, but better than the URL)
  const meta =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (meta && meta.length > 120) return htmlToText(meta);

  return null;
}

async function loadLocalConfig(fileName) {
  const filePath = path.join(process.cwd(), 'src/app/apps/stea/career/config', fileName);
  return await readFile(filePath, 'utf8');
}

async function getWorkspaceConfig(tenantId, configName) {
  // If it's David's tenant, load from local YAML
  if (tenantId === DAVID_TENANT_ID) {
    return await loadLocalConfig(`${configName}.yaml`);
  }

  // Otherwise, load from Firestore
  const { db } = getFirebaseAdmin();
  const configDoc = await db.collection('tenants').doc(tenantId).collection('career_ops').doc('config').get();
  if (configDoc.exists) {
    return configDoc.data()[configName] || '';
  }
  return '';
}

// Anthropic config + a shared call helper used by analyse and tailor_cv.
const ANTHROPIC_MODEL = process.env.CAREER_ANTHROPIC_MODEL || 'claude-sonnet-4-6';
// `cachedContext` is a large, reusable text block (candidate profile + evidence)
// that is identical across calls — marked with cache_control so repeated input
// tokens bill at ~10% within the 5-minute cache window.
async function callAnthropic({ system, prompt, maxTokens = 2000, cachedContext }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY on server. Add it in Vercel project environment variables.');

  const content = [];
  if (cachedContext) {
    content.push({ type: 'text', text: cachedContext, cache_control: { type: 'ephemeral' } });
  }
  content.push({ type: 'text', text: prompt });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }),
  });
  const payload = await res.json();
  if (!res.ok) {
    const detail = payload?.error?.message || res.statusText;
    const type = payload?.error?.type ? ` (${payload.error.type})` : '';
    throw new Error(`Anthropic API ${res.status}${type}: ${detail} [model=${ANTHROPIC_MODEL}]`);
  }
  return payload.content?.[0]?.text ?? '';
}

// --- Usage metering (combined action pool: analyse + tailor + search) ---
const FREE_ACTIONS = 20;            // free allowance per tenant
const COFFEE_BUNDLE = 50;           // actions granted per £5 top-up
// Tenants exempt from the cap (super-admin / internal testing).
const UNLIMITED_TENANTS = new Set([DAVID_TENANT_ID]);
const USAGE_DOC = (db, tenantId) =>
  db.collection('tenants').doc(tenantId).collection('career_ops').doc('usage');

async function getUsage(tenantId) {
  if (UNLIMITED_TENANTS.has(tenantId)) {
    return { used: 0, granted: Infinity, remaining: Infinity, unlimited: true };
  }
  const { db } = getFirebaseAdmin();
  const snap = await USAGE_DOC(db, tenantId).get();
  const v = snap.exists ? snap.data() : {};
  const used = v.actions_used || 0;
  const granted = (v.actions_granted ?? FREE_ACTIONS);
  return { used, granted, remaining: Math.max(0, granted - used) };
}

// Throws a structured limit error if the tenant is out of actions.
async function assertActionAvailable(tenantId) {
  const u = await getUsage(tenantId);
  if (u.remaining <= 0) {
    const err = new Error('You have used all your free Career Ops actions. Buy a coffee to keep going.');
    err.code = 'LIMIT_REACHED';
    err.usage = u;
    throw err;
  }
  return u;
}

async function incrementUsage(tenantId) {
  if (UNLIMITED_TENANTS.has(tenantId)) return; // exempt tenants aren't metered
  const { db } = getFirebaseAdmin();
  const FieldValueMod = (await import('firebase-admin/firestore')).FieldValue;
  await USAGE_DOC(db, tenantId).set(
    { actions_used: FieldValueMod.increment(1), updated_at: new Date() },
    { merge: true }
  );
}

// Normalise config (string YAML or object/array) to readable text for prompts.
function configToText(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

async function loadPrompt(fileName) {
  const filePath = path.join(process.cwd(), 'src/app/apps/stea/career/prompts', fileName);
  return await readFile(filePath, 'utf8');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, url, jd_text, tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (action === 'get_config') {
      const profile = await getWorkspaceConfig(tenantId, 'candidate_profile');
      const evidence = await getWorkspaceConfig(tenantId, 'evidence_library');
      const weights = await getWorkspaceConfig(tenantId, 'scoring_weights');

      // Evidence is "present" only if there's at least one anchor with content.
      const hasEvidence = Array.isArray(evidence)
        ? evidence.some((a) => a && (a.company || (a.bullets && a.bullets.some(Boolean))))
        : !!evidence;
      const hasProfile = profile && (profile.name || profile.current_role || profile.min_salary);

      return NextResponse.json({
        has_config: !!hasProfile && !!hasEvidence,
        // Return under both the object keys the page reads and the plain keys, so
        // the form re-populates correctly after load.
        profile_obj: profile || null,
        evidence_obj: evidence || null,
        weights_obj: weights || null,
        profile,
        evidence,
        weights
      });
    }

    if (action === 'save_config') {
      // The page sends *_obj keys; accept both for safety.
      const profile = body.profile_obj ?? body.profile ?? null;
      const evidence = body.evidence_obj ?? body.evidence ?? null;
      const weights = body.weights_obj ?? body.weights ?? null;
      const { db } = getFirebaseAdmin();
      await db.collection('tenants').doc(tenantId).collection('career_ops').doc('config').set({
        candidate_profile: profile,
        evidence_library: evidence,
        scoring_weights: weights,
        updated_at: new Date()
      }, { merge: true });

      return NextResponse.json({ success: true });
    }

    if (action === 'analyse') {
      await assertActionAvailable(tenantId);
      // Uses the module-level callAnthropic (claude-sonnet-4-6, ANTHROPIC_API_KEY).
      const candidateProfileRaw = await getWorkspaceConfig(tenantId, 'candidate_profile');
      const evidenceLibraryRaw = await getWorkspaceConfig(tenantId, 'evidence_library');
      const candidateProfile = configToText(candidateProfileRaw);
      const evidenceLibrary = configToText(evidenceLibraryRaw);

      if (!candidateProfile.trim() || !evidenceLibrary.trim()) {
        return NextResponse.json({ error: 'Workspace configuration is incomplete. Please set up your profile and evidence library first.' }, { status: 400 });
      }

      // Resolve the actual JD text. If the user pasted a URL (not full text),
      // fetch the page server-side and extract the real job description — the
      // LLM can't browse, so passing a bare URL would only score the title.
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

      // Load generic prompts
      const extractPromptTemplate = await loadPrompt('extract.md');
      const evaluatePromptTemplate = await loadPrompt('evaluate.md');

      // 1. Extract JD Data
      // Anthropic has no JSON response-format flag, so ask for raw JSON and strip
      // any ```json fences before parsing.
      const extractPrompt = extractPromptTemplate.replace('{{jd_text}}', resolvedJd);

      const rawJdData = await callAnthropic({
        system: 'You are an expert recruiter for Product Owner, Product Manager, and Operations & Delivery roles. Respond with ONLY valid JSON — no markdown, no code fences, no commentary.',
        prompt: extractPrompt,
      });
      const jdData = rawJdData.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      // 2. Evaluate against profile. The candidate profile + evidence library are
      // identical across calls, so they go in cachedContext (cache_control) and
      // only the JD-specific instruction goes in the per-call prompt.
      const cachedContext = `## Candidate Profile:\n${candidateProfile}\n\n## Evidence Library:\n${evidenceLibrary}`;
      const evaluatePrompt = evaluatePromptTemplate
        .replace('{{candidate_profile}}', '(see cached Candidate Profile above)')
        .replace('{{jd_data}}', jdData)
        .replace('{{evidence_library}}', '(see cached Evidence Library above)');

      const evaluation = await callAnthropic({
        system: 'You are a career coach for Product Owners and Product Managers. ' +
          'Format your response as clean GitHub-flavored Markdown: use ## headings, ' +
          '"|"-delimited tables, bullet lists and **bold**. Do NOT use LaTeX or "$$" math ' +
          'notation — write any calculations as plain text. Keep it scannable.',
        cachedContext,
        prompt: evaluatePrompt,
        maxTokens: 3000,
      });

      await incrementUsage(tenantId); // one analyse = one action

      const parsedJd = JSON.parse(jdData);

      // Pull the overall score from the evaluation markdown (e.g. "3.05 / 5.0",
      // "OVERALL SCORE: 4.2", "**4.2/5**"). Best-effort; null if not found.
      const scoreMatch =
        evaluation.match(/overall[^0-9]*([0-5](?:\.\d+)?)\s*\/\s*5/i) ||
        evaluation.match(/\b([0-5](?:\.\d+)?)\s*\/\s*5(?:\.0)?\b/);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

      // Persist the analysed role so it survives reload and populates the pipeline.
      let analysisId = null;
      try {
        const { db } = getFirebaseAdmin();
        const ref = await db
          .collection('tenants').doc(tenantId)
          .collection('career_ops_analyses')
          .add({
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
        // Don't fail the analysis if persistence has an issue — just log it.
        console.error('Failed to persist analysis', e);
      }

      return NextResponse.json({
        id: analysisId,
        score,
        jd_data: parsedJd,
        evaluation
      });
    }

    if (action === 'list_analyses') {
      const { db } = getFirebaseAdmin();
      const col = db.collection('tenants').doc(tenantId).collection('career_ops_analyses');
      // Try ordered query; if Firestore needs an index it would throw, so fall
      // back to an unordered fetch + in-memory sort. Saved roles always show.
      let snap;
      try {
        snap = await col.orderBy('createdAt', 'desc').limit(50).get();
      } catch (e) {
        console.error('list_analyses orderBy failed, falling back', e?.message);
        snap = await col.limit(50).get();
      }
      const toMs = (v) => (v?.toDate ? v.toDate().getTime() : (v?._seconds ? v._seconds * 1000 : 0));
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
            createdAt: v.createdAt?.toDate ? v.createdAt.toDate().toISOString() : null,
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
      const doc = await db
        .collection('tenants').doc(tenantId)
        .collection('career_ops_analyses').doc(id).get();
      if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const v = doc.data();
      return NextResponse.json({ id: doc.id, ...v, createdAt: v.createdAt?.toDate ? v.createdAt.toDate().toISOString() : null });
    }

    // Generate a role-tailored CV for an analysed role and save it against that
    // role (the "proceed to apply" loop → per-tenant CV library).
    if (action === 'tailor_cv') {
      await assertActionAvailable(tenantId);
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
      const { db } = getFirebaseAdmin();
      const docRef = db.collection('tenants').doc(tenantId).collection('career_ops_analyses').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      const analysis = doc.data();

      const candidateProfile = configToText(await getWorkspaceConfig(tenantId, 'candidate_profile'));
      const evidenceLibrary = configToText(await getWorkspaceConfig(tenantId, 'evidence_library'));
      if (!candidateProfile.trim() || !evidenceLibrary.trim()) {
        return NextResponse.json({ error: 'Set up your profile and evidence library before tailoring a CV.' }, { status: 400 });
      }

      const tailorCachedContext = `## Candidate Profile:\n${candidateProfile}\n\n## Evidence Library:\n${evidenceLibrary}`;
      const tailorTemplate = await loadPrompt('cv_tailor.md');
      const tailorPrompt = tailorTemplate
        .replace('{{jd_summary}}', JSON.stringify(analysis.jd_data || {}, null, 2))
        .replace('{{evidence_library}}', '(see cached Evidence Library above)')
        .replace('{{candidate_profile}}', '(see cached Candidate Profile above)');

      const tailoredCv = await callAnthropic({
        system: 'You are an expert CV writer for Product Owners / Product Managers in energy & billing. ' +
          'Output clean GitHub-flavored Markdown. NEVER invent metrics, roles, dates or skills — only ' +
          'reuse and re-emphasise what is in the Evidence Library and Candidate Profile. Produce: ' +
          '(1) a full tailored CV, (2) a 150-220 word cover note, (3) a short rationale of changes.',
        cachedContext: tailorCachedContext,
        prompt: tailorPrompt,
        maxTokens: 4000,
      });

      await docRef.set({
        tailored_cv: tailoredCv,
        tailored_cv_at: new Date(),
        status: 'Applying',
      }, { merge: true });

      await incrementUsage(tenantId); // one tailor = one action

      return NextResponse.json({ id, tailored_cv: tailoredCv, status: 'Applying' });
    }

    // List saved tailored CVs (the library): analyses that have a tailored CV.
    if (action === 'list_cvs') {
      const { db } = getFirebaseAdmin();
      const col = db.collection('tenants').doc(tenantId).collection('career_ops_analyses');
      let snap;
      try {
        snap = await col.orderBy('createdAt', 'desc').limit(50).get();
      } catch (e) {
        console.error('list_cvs orderBy failed, falling back', e?.message);
        snap = await col.limit(50).get();
      }
      const toMs = (v) => (v?.toDate ? v.toDate().getTime() : (v?._seconds ? v._seconds * 1000 : 0));
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
          tailored_cv_at: v.tailored_cv_at?.toDate ? v.tailored_cv_at.toDate().toISOString() : null,
        }))
        .sort((a, b) => b._ms - a._ms)
        .map(({ _ms, ...rest }) => rest);
      return NextResponse.json({ cvs });
    }

    // Search real job boards (Reed + Adzuna) and return normalised, deduped roles.
    if (action === 'search_jobs') {
      await assertActionAvailable(tenantId);
      const { keywords = '', location = '', salary_min, exclude_employer = '' } = body;
      const results = [];
      const sourcesTried = [];
      const sourcesAvailable = [];

      // --- Reed ---
      const reedKey = process.env.REED_API_KEY;
      if (reedKey) {
        sourcesAvailable.push('reed');
        try {
          const params = new URLSearchParams({ keywords: keywords || '', resultsToTake: '50' });
          if (location) params.set('locationName', location);
          if (salary_min) params.set('minimumSalary', String(salary_min));
          const reedRes = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
            headers: { Authorization: 'Basic ' + Buffer.from(`${reedKey}:`).toString('base64') },
          });
          if (!reedRes.ok) {
            console.error('Reed search non-OK', reedRes.status, (await reedRes.text()).slice(0, 200));
          }
          if (reedRes.ok) {
            const data = await reedRes.json();
            sourcesTried.push('reed');
            for (const j of data.results || []) {
              // Reed field casing varies; fall back across variants and build the
              // job URL from jobId if no explicit url is returned.
              const jobId = j.jobId ?? j.JobId;
              const url = j.jobUrl || j.JobUrl || j.url || (jobId ? `https://www.reed.co.uk/jobs/${jobId}` : '');
              results.push({
                source: 'Reed',
                title: j.jobTitle || j.JobTitle || 'Untitled role',
                company: j.employerName || j.EmployerName || '',
                location: j.locationName || j.LocationName || '',
                salary: (j.minimumSalary || j.maximumSalary) ? `£${j.minimumSalary || ''}${j.maximumSalary ? '–£' + j.maximumSalary : ''}` : '',
                url,
                description: j.jobDescription || j.JobDescription || '',
              });
            }
          }
        } catch (e) { console.error('Reed search failed', e?.message); }
      }

      // --- Adzuna ---
      const adzId = process.env.ADZUNA_APP_ID;
      const adzKey = process.env.ADZUNA_APP_KEY;
      if (adzId && adzKey) {
        sourcesAvailable.push('adzuna');
        try {
          const params = new URLSearchParams({
            app_id: adzId, app_key: adzKey, results_per_page: '50',
            what: keywords || '', 'content-type': 'application/json',
          });
          if (location) params.set('where', location);
          if (salary_min) params.set('salary_min', String(salary_min));
          const adzRes = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`);
          if (!adzRes.ok) {
            console.error('Adzuna search non-OK', adzRes.status, (await adzRes.text()).slice(0, 200));
          }
          if (adzRes.ok) {
            const data = await adzRes.json();
            sourcesTried.push('adzuna');
            for (const j of data.results || []) {
              results.push({
                source: 'Adzuna',
                title: j.title,
                company: j.company?.display_name || '',
                location: j.location?.display_name || '',
                salary: (j.salary_min || j.salary_max) ? `£${Math.round(j.salary_min || 0)}${j.salary_max ? '–£' + Math.round(j.salary_max) : ''}` : '',
                url: j.redirect_url,
                description: j.description || '',
              });
            }
          }
        } catch (e) { console.error('Adzuna search failed', e?.message); }
      }

      if (sourcesAvailable.length === 0) {
        return NextResponse.json({ error: 'No job-search sources configured. Add REED_API_KEY and/or ADZUNA_APP_ID + ADZUNA_APP_KEY in Vercel.' }, { status: 400 });
      }

      // Dedupe by normalised title+company.
      const seen = new Set();
      const deduped = results.filter((r) => {
        const key = `${(r.title || '').toLowerCase().trim()}|${(r.company || '').toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // --- Stage 1: cheap NEGATIVE-only title filter ---
      // Only drop obvious wrong-discipline titles; let everything else through to
      // the LLM ranker (the smart filter). A positive word-match was too strict
      // and dropped good roles with slightly different titles.
      const profileRaw = await getWorkspaceConfig(tenantId, 'candidate_profile');
      let targetRoles = [];
      try {
        const p = typeof profileRaw === 'string' ? null : profileRaw;
        if (p && Array.isArray(p.target_roles)) targetRoles = p.target_roles;
      } catch {}
      const NEGATIVE = ['software engineer', 'backend developer', 'frontend developer',
        'full stack', 'data scientist', 'sdet', 'qa tester', 'accountant', 'nurse',
        'teacher', 'driver', 'solicitor', 'graphic designer', 'sysadmin', 'electrician',
        'plumber', 'chef', 'warehouse', 'cleaner', 'security officer'];
      const excludeCo = (exclude_employer || '').toLowerCase().trim();
      const stage1 = deduped.filter((r) => {
        const t = (r.title || '').toLowerCase();
        if (NEGATIVE.some((n) => t.includes(n))) return false;
        // Exclude the candidate's current/most-recent employer if requested.
        if (excludeCo && (r.company || '').toLowerCase().includes(excludeCo)) return false;
        return true;
      });

      // --- Stage 2: LLM relevance ranking of the survivors ---
      let ranked = stage1;
      try {
        if (process.env.ANTHROPIC_API_KEY && stage1.length > 0) {
          const list = stage1.slice(0, 40).map((r, i) => `${i}. ${r.title} @ ${r.company} (${r.location})`).join('\n');
          const rankPrompt =
            `Candidate target roles: ${targetRoles.join(', ') || keywords}.\n\n` +
            `Here are job listings (index. title @ company):\n${list}\n\n` +
            `Return ONLY a JSON array of objects {"i": <index>, "score": <0-100 relevance to the target roles>} ` +
            `for the listings that are a plausible match (score >= 50). Omit clear mismatches. No prose, no code fences.`;
          const raw = await callAnthropic({
            system: 'You rank job listings by relevance to a candidate. Respond with ONLY a JSON array.',
            prompt: rankPrompt,
            maxTokens: 1200,
          });
          const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
          const scores = JSON.parse(cleaned);
          if (Array.isArray(scores) && scores.length) {
            ranked = scores
              .filter((s) => stage1[s.i])
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((s) => ({ ...stage1[s.i], relevance: s.score }));
          }
        }
      } catch (e) {
        console.error('LLM ranking failed, returning title-filtered list', e?.message);
      }

      await incrementUsage(tenantId); // one search = one action

      return NextResponse.json({ jobs: ranked, sources: sourcesTried, total_raw: deduped.length });
    }

    if (action === 'get_usage') {
      const u = await getUsage(tenantId);
      // Infinity isn't JSON; send null + unlimited flag for exempt tenants.
      const safe = u.unlimited
        ? { used: 0, granted: null, remaining: null, unlimited: true }
        : u;
      return NextResponse.json({ ...safe, free_actions: FREE_ACTIONS, bundle: COFFEE_BUNDLE });
    }

    // --- Apply Assist: extra application fields the user fills once and reuses ---
    if (action === 'get_apply_profile') {
      const { db } = getFirebaseAdmin();
      const snap = await db.collection('tenants').doc(tenantId).collection('career_ops').doc('apply_profile').get();
      return NextResponse.json({ apply_profile: snap.exists ? snap.data() : {} });
    }
    if (action === 'save_apply_profile') {
      const { apply_profile = {} } = body;
      const { db } = getFirebaseAdmin();
      await db.collection('tenants').doc(tenantId).collection('career_ops').doc('apply_profile')
        .set({ ...apply_profile, updated_at: new Date() }, { merge: true });
      return NextResponse.json({ success: true });
    }

    // Generate (or revise) a tailored cover letter for an analysed role.
    if (action === 'cover_letter') {
      await assertActionAvailable(tenantId);
      const { id, edit_instruction = '' } = body;
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
      const { db } = getFirebaseAdmin();
      const docRef = db.collection('tenants').doc(tenantId).collection('career_ops_analyses').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      const analysis = doc.data();

      const candidateProfile = configToText(await getWorkspaceConfig(tenantId, 'candidate_profile'));
      const evidenceLibrary = configToText(await getWorkspaceConfig(tenantId, 'evidence_library'));
      if (!candidateProfile.trim() || !evidenceLibrary.trim()) {
        return NextResponse.json({ error: 'Set up your profile and evidence library first.' }, { status: 400 });
      }

      const cachedContext = `## Candidate Profile:\n${candidateProfile}\n\n## Evidence Library:\n${evidenceLibrary}`;
      const jd = JSON.stringify(analysis.jd_data || {}, null, 2);
      const existing = analysis.cover_letter || '';
      const prompt = edit_instruction && existing
        ? `Here is the current cover letter:\n\n${existing}\n\nRevise it per this instruction: "${edit_instruction}". Keep it grounded in the candidate's real evidence — do not invent anything. Return ONLY the revised cover letter.`
        : `Write a tailored cover letter for this role:\n\n${jd}\n\nGround every claim in the candidate's profile and evidence above. 250-350 words, professional but human, no clichés, address it "Dear Hiring Manager,". Return ONLY the cover letter.`;

      const coverLetter = await callAnthropic({
        system: 'You write concise, specific, honest cover letters for Product Owner / Product Manager / Operations & Delivery candidates. Never invent facts, metrics, or experience.',
        cachedContext,
        prompt,
        maxTokens: 1500,
      });

      await docRef.set({ cover_letter: coverLetter, cover_letter_at: new Date() }, { merge: true });
      await incrementUsage(tenantId);
      return NextResponse.json({ id, cover_letter: coverLetter });
    }

    // Draft the common application free-text answers for a role (A3).
    if (action === 'apply_answers') {
      await assertActionAvailable(tenantId);
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
      const { db } = getFirebaseAdmin();
      const docRef = db.collection('tenants').doc(tenantId).collection('career_ops_analyses').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      const analysis = doc.data();

      const candidateProfile = configToText(await getWorkspaceConfig(tenantId, 'candidate_profile'));
      const evidenceLibrary = configToText(await getWorkspaceConfig(tenantId, 'evidence_library'));
      const cachedContext = `## Candidate Profile:\n${candidateProfile}\n\n## Evidence Library:\n${evidenceLibrary}`;

      const raw = await callAnthropic({
        system: 'You draft application form answers for a job candidate. Ground everything in their real evidence — never invent. Respond with ONLY a JSON array.',
        cachedContext,
        prompt: `For this role:\n${JSON.stringify(analysis.jd_data || {}, null, 2)}\n\n` +
          `Draft concise, specific answers (2-4 sentences each, first person, no clichés) to the common application questions. ` +
          `Return ONLY a JSON array of {"q": "<question>", "a": "<answer>"} for: ` +
          `"Why are you interested in this role?", "Why do you want to work here?", "What makes you a good fit?", "What is your relevant experience?".`,
        maxTokens: 1500,
      });
      const cleaned = raw.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      let answers = [];
      try { answers = JSON.parse(cleaned); } catch { answers = [{ q: 'Draft answers', a: cleaned }]; }

      await docRef.set({ apply_answers: answers, apply_answers_at: new Date() }, { merge: true });
      await incrementUsage(tenantId);
      return NextResponse.json({ id, apply_answers: answers });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    // Out-of-actions is a normal state, not a server error — return 402 + usage
    // so the UI can show the "buy a coffee" prompt.
    if (error?.code === 'LIMIT_REACHED') {
      return NextResponse.json({ error: error.message, limit_reached: true, usage: error.usage }, { status: 402 });
    }
    console.error('Career Ops Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
