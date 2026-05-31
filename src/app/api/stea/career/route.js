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
      const apiKey = process.env.ANTHROPIC_API_KEY;
      // Current Sonnet (dateless pinned id, per Anthropic model docs 2026).
      // The old claude-3-5-sonnet-* ids are retired and 404. Override with
      // CAREER_ANTHROPIC_MODEL if you want a different available model.
      const model = process.env.CAREER_ANTHROPIC_MODEL || 'claude-sonnet-4-6';

      if (!apiKey) {
        return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY on server. Add it in Vercel project environment variables.' }, { status: 500 });
      }

      // Calls the Anthropic Messages API and returns the assistant text.
      // `system` is a top-level param (not a message) and `max_tokens` is required.
      const callAnthropic = async ({ system, prompt, maxTokens = 2000 }) => {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        const payload = await res.json();
        if (!res.ok) {
          // Surface the real Anthropic error (status + type + message) so failures
          // are unambiguous instead of just echoing the model name.
          const detail = payload?.error?.message || res.statusText;
          const type = payload?.error?.type ? ` (${payload.error.type})` : '';
          throw new Error(`Anthropic API ${res.status}${type}: ${detail} [model=${model}]`);
        }
        return payload.content?.[0]?.text ?? '';
      };

      // Load workspace-specific config. This can be a string (YAML, local tenant)
      // or an object/array (Firestore tenant). Normalise to readable text for the
      // prompt — a raw object would stringify to "[object Object]".
      const toText = (v) => {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        try { return JSON.stringify(v, null, 2); } catch { return String(v); }
      };
      const candidateProfileRaw = await getWorkspaceConfig(tenantId, 'candidate_profile');
      const evidenceLibraryRaw = await getWorkspaceConfig(tenantId, 'evidence_library');
      const candidateProfile = toText(candidateProfileRaw);
      const evidenceLibrary = toText(evidenceLibraryRaw);

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
        system: 'You are an expert recruiter for Senior PM roles. Respond with ONLY valid JSON — no markdown, no code fences, no commentary.',
        prompt: extractPrompt,
      });
      const jdData = rawJdData.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      // 2. Evaluate against profile
      const evaluatePrompt = evaluatePromptTemplate
        .replace('{{candidate_profile}}', candidateProfile)
        .replace('{{jd_data}}', jdData)
        .replace('{{evidence_library}}', evidenceLibrary);

      const evaluation = await callAnthropic({
        system: 'You are a career coach for Senior Product Managers.',
        prompt: evaluatePrompt,
      });

      return NextResponse.json({
        jd_data: JSON.parse(jdData),
        evaluation
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Career Ops Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
