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
async function callAnthropic({ system, prompt, maxTokens = 2000 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY on server. Add it in Vercel project environment variables.');
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
      messages: [{ role: 'user', content: prompt }],
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

      // 2. Evaluate against profile
      const evaluatePrompt = evaluatePromptTemplate
        .replace('{{candidate_profile}}', candidateProfile)
        .replace('{{jd_data}}', jdData)
        .replace('{{evidence_library}}', evidenceLibrary);

      const evaluation = await callAnthropic({
        system: 'You are a career coach for Product Owners and Product Managers. ' +
          'Format your response as clean GitHub-flavored Markdown: use ## headings, ' +
          '"|"-delimited tables, bullet lists and **bold**. Do NOT use LaTeX or "$$" math ' +
          'notation — write any calculations as plain text. Keep it scannable.',
        prompt: evaluatePrompt,
        maxTokens: 3000,
      });

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

      const tailorTemplate = await loadPrompt('cv_tailor.md');
      const tailorPrompt = tailorTemplate
        .replace('{{jd_summary}}', JSON.stringify(analysis.jd_data || {}, null, 2))
        .replace('{{evidence_library}}', evidenceLibrary)
        .replace('{{candidate_profile}}', candidateProfile);

      const tailoredCv = await callAnthropic({
        system: 'You are an expert CV writer for Product Owners / Product Managers in energy & billing. ' +
          'Output clean GitHub-flavored Markdown. NEVER invent metrics, roles, dates or skills — only ' +
          'reuse and re-emphasise what is in the Evidence Library and Candidate Profile. Produce: ' +
          '(1) a full tailored CV, (2) a 150-220 word cover note, (3) a short rationale of changes.',
        prompt: tailorPrompt,
        maxTokens: 4000,
      });

      await docRef.set({
        tailored_cv: tailoredCv,
        tailored_cv_at: new Date(),
        status: 'Applying',
      }, { merge: true });

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
      const { keywords = '', location = '', salary_min } = body;
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
          if (reedRes.ok) {
            const data = await reedRes.json();
            sourcesTried.push('reed');
            for (const j of data.results || []) {
              results.push({
                source: 'Reed',
                title: j.jobTitle,
                company: j.employerName || '',
                location: j.locationName || '',
                salary: (j.minimumSalary || j.maximumSalary) ? `£${j.minimumSalary || ''}${j.maximumSalary ? '–£' + j.maximumSalary : ''}` : '',
                url: j.jobUrl,
                description: j.jobDescription || '',
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

      return NextResponse.json({ jobs: deduped, sources: sourcesTried });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Career Ops Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
