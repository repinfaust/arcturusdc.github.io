// Live job search: LinkedIn + Reed + Adzuna, deduped, obvious-mismatch culling,
// then an LLM relevance ranking of what survives. App-specific inputs (culling
// list, candidate background for the ranker) come from the app config.
import { callAnthropic, stripJsonFences } from './anthropic';
import { searchLinkedInGuest } from './jd';

export function cleanLocationList(location = '', locations = []) {
  const rawList = Array.isArray(locations) && locations.length > 0
    ? locations
    : String(location || '')
        .replace(/\([^)]*\)/g, '') // strip parenthetical notes like "(Hybrid or UK remote)"
        .split(/[,;/]+/);
  const cleaned = rawList
    .map((s) => String(s || '').replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean);
  return cleaned.length > 0 ? [...new Set(cleaned)] : ['United Kingdom'];
}

export async function searchJobs({
  keywords = '',
  location = '',
  locations = [],
  salary_min,
  excludeEmployers = [],
  mode = 'both', // 'location' | 'remote' | 'both'
  targetRoles = [],
  defaultTerm,
  hardExclude = [],
  excludedTitles = [],
  enabledSources = ['linkedin', 'reed', 'adzuna'],
  steering = '',
  minScore = 40,
  rankBackground = '',
  rankRules = '', // extra app/profile ranking rules, e.g. excluded sectors
  linkedInSearchUrl = '',
}) {
  const results = [];
  const sourcesTried = new Set();
  const sourceCounts = {};

  const activeSources = new Set(
    (Array.isArray(enabledSources) && enabledSources.length > 0
      ? enabledSources
      : ['linkedin', 'reed', 'adzuna']
    ).map((s) => String(s || '').toLowerCase().trim())
  );

  const reedKey = process.env.REED_API_KEY;
  const adzId = process.env.ADZUNA_APP_ID;
  const adzKey = process.env.ADZUNA_APP_KEY;

  async function fetchLinkedIn(query, loc, isRemote = false) {
    if (!activeSources.has('linkedin')) return;
    try {
      const liLoc = !loc || /united kingdom|^uk$/i.test(loc)
        ? 'United Kingdom'
        : /united kingdom|uk/i.test(loc)
        ? loc
        : `${loc}, United Kingdom`;
      const [page0, page1] = await Promise.all([
        searchLinkedInGuest({
          keywords: query,
          location: liLoc,
          remoteOnly: isRemote,
          searchUrl: linkedInSearchUrl,
          start: 0,
        }),
        searchLinkedInGuest({
          keywords: query,
          location: liLoc,
          remoteOnly: isRemote,
          searchUrl: linkedInSearchUrl,
          start: 10,
        }),
      ]);
      const items = [...page0, ...page1];
      if (items.length > 0) {
        sourcesTried.add('linkedin');
        sourceCounts.linkedin = (sourceCounts.linkedin || 0) + items.length;
        results.push(...items);
      }
    } catch (e) {
      console.error('LinkedIn guest search failed', e?.message);
    }
  }

  // One query against Reed; loc='' means UK-wide (used for remote).
  async function fetchReed(query, loc) {
    if (!reedKey || !activeSources.has('reed')) return;
    try {
      const params = new URLSearchParams({ keywords: query, resultsToTake: '35', distanceFromLocation: '30' });
      if (loc && !/^united kingdom$|^uk$/i.test(loc)) params.set('locationName', loc);
      if (salary_min) params.set('minimumSalary', String(salary_min));
      const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${reedKey}:`).toString('base64') },
      });
      if (!res.ok) { console.error('Reed non-OK', res.status); return; }
      const data = await res.json();
      sourcesTried.add('reed');
      sourceCounts.reed = (sourceCounts.reed || 0) + (data.results || []).length;
      for (const j of data.results || []) {
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
    } catch (e) { console.error('Reed failed', e?.message); }
  }

  async function fetchAdzuna(query, loc) {
    if (!(adzId && adzKey) || !activeSources.has('adzuna')) return;
    try {
      const params = new URLSearchParams({ app_id: adzId, app_key: adzKey, results_per_page: '35', what: query, distance: '48', 'content-type': 'application/json' });
      if (loc && !/^united kingdom$|^uk$/i.test(loc)) params.set('where', loc);
      if (salary_min) params.set('salary_min', String(salary_min));
      const res = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`);
      if (!res.ok) { console.error('Adzuna non-OK', res.status); return; }
      const data = await res.json();
      sourcesTried.add('adzuna');
      sourceCounts.adzuna = (sourceCounts.adzuna || 0) + (data.results || []).length;
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
    } catch (e) { console.error('Adzuna failed', e?.message); }
  }

  // Role-family query terms from the candidate's target roles + whatever they
  // typed. De-dupe to a handful of distinct searches.
  const queryTerms = [...new Set([keywords, ...targetRoles].map((s) => (s || '').trim()).filter(Boolean))].slice(0, 6);
  if (queryTerms.length === 0 && defaultTerm) queryTerms.push(defaultTerm);

  const locList = cleanLocationList(location, locations).slice(0, 3);

  const tasks = [];
  if (linkedInSearchUrl) {
    tasks.push(fetchLinkedIn('', locList[0] || 'United Kingdom', mode === 'remote'));
  }
  for (const term of queryTerms) {
    if (mode === 'location' || mode === 'both') {
      for (const loc of locList) {
        tasks.push(fetchLinkedIn(term, loc, false));
        tasks.push(fetchReed(term, loc));
        tasks.push(fetchAdzuna(term, loc));
      }
    }
    if (mode === 'remote' || mode === 'both') {
      tasks.push(fetchLinkedIn(term, 'United Kingdom', true));
      // Reed: include "remote" in keywords; Adzuna: where=remote.
      tasks.push(fetchReed(`${term} remote`, ''));
      tasks.push(fetchAdzuna(term, 'remote'));
    }
  }
  await Promise.all(tasks);

  // Place LinkedIn results BEFORE Reed/Adzuna before deduplication and slicing so
  // high-volume Reed responses never push LinkedIn jobs out of the rankable window.
  const orderedRaw = [
    ...results.filter((r) => r.source === 'LinkedIn'),
    ...results.filter((r) => r.source !== 'LinkedIn'),
  ];

  // Dedupe by normalised title+company.
  const seen = new Set();
  const deduped = orderedRaw.filter((r) => {
    const key = `${(r.title || '').toLowerCase().trim()}|${(r.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // --- Stage 1: cheap, OBVIOUS-ONLY exclusions + user-dismissed title exclusions ---
  const excluded = excludeEmployers.map((e) => (e || '').toLowerCase().trim()).filter(Boolean);
  const dismissedTitles = (Array.isArray(excludedTitles) ? excludedTitles : [])
    .map((t) => String(t || '').toLowerCase().trim())
    .filter(Boolean);

  const stage1 = deduped.filter((r) => {
    const t = (r.title || '').toLowerCase().trim();
    if (hardExclude.some((n) => t.includes(n))) return false;
    if (dismissedTitles.some((d) => t === d || t.includes(d))) return false;
    const co = (r.company || '').toLowerCase();
    if (excluded.some((e) => co.includes(e))) return false;
    return true;
  });

  // Debug trace so the UI can show *why* the result set is what it is.
  const debug = {
    query: { terms: queryTerms, locations: locList, mode, salary_min: salary_min || '(none)' },
    sources_tried: [...sourcesTried],
    source_counts: sourceCounts,
    raw_count: results.length,
    deduped_count: deduped.length,
    after_negative_filter: stage1.length,
    dropped_by_negative_filter: deduped
      .filter((r) => hardExclude.some((n) => (r.title || '').toLowerCase().includes(n)))
      .map((r) => r.title),
    target_roles_used: targetRoles.length ? targetRoles : [keywords],
    threshold: minScore,
    ranked_count: 0,
    ranker: 'skipped',
    scores: [],
  };

  // --- Stage 2: LLM relevance ranking of the survivors ---
  let ranked = stage1.map((r) => ({ ...r })); // default if ranker fails
  const hasLlmKey = Boolean(
    process.env.CAREER_OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY
  );
  try {
    if (hasLlmKey && stage1.length > 0) {
      const rankable = stage1.slice(0, 80);
      const list = rankable
        .map((r, i) => `${i}. [${r.source}] ${r.title} @ ${r.company} (${r.location})${r.salary ? ` · ${r.salary}` : ''}`)
        .join('\n');
      const wantsSenior = targetRoles.some((t) => /\b(senior|lead|principal|founding|head|director|vp|group)\b/i.test(t));
      const seniorityRule = wantsSenior
        ? `Seniority check: The candidate targets Senior / Lead / Principal / Founding / Head-level product leadership roles. Score generic mid-level or junior roles (e.g. plain "Product Owner", "Product Marketing Manager", "Solutions Architect", "Business Analyst", or mid-level "Product Manager" without senior/lead/principal/founding/domain signals) BELOW 45 unless explicitly requested.\n`
        : '';
      const steeringRule = steering && steering.trim()
        ? `USER REFINEMENT / STEERING RULES (highest priority — follow strictly): ${steering.trim()}\n`
        : '';
      const rankPrompt =
        `The candidate is targeting these roles: ${targetRoles.join(', ') || keywords}.\n` +
        `Target locations: ${locList.join(', ')}${mode !== 'location' ? ' (+ UK Remote)' : ''}.\n` +
        (rankBackground ? `Their background: ${rankBackground}\n\n` : '\n') +
        `Score each listing 0-100 for how well its TITLE, SENIORITY, and COMPANY/LOCATION fit the candidate's target roles.\n` +
        seniorityRule +
        (rankRules ? `${rankRules}\n` : '') +
        steeringRule +
        `\nListings:\n${list}\n\n` +
        `Return ONLY a JSON array of {"i": <index>, "score": <0-100>, "why": "<6 words max>"} for EVERY listing.`;
      const raw = await callAnthropic({
        system: 'You rank job listings by title, seniority, and candidate fit. Respond with ONLY a JSON array.',
        prompt: rankPrompt,
        maxTokens: 2500,
      });
      const scores = JSON.parse(stripJsonFences(raw));
      if (Array.isArray(scores) && scores.length) {
        debug.ranker = 'ok';
        debug.scores = scores
          .filter((s) => rankable[s.i])
          .map((s) => ({ title: rankable[s.i].title, source: rankable[s.i].source, score: s.score, why: s.why || '' }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        let kept = scores.filter((s) => rankable[s.i] && (s.score ?? 0) >= minScore);
        if (kept.length === 0) {
          kept = scores
            .filter((s) => rankable[s.i])
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 10);
        }
        ranked = kept
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((s) => ({ ...rankable[s.i], relevance: s.score, why: s.why || '' }));
      }
    }
  } catch (e) {
    debug.ranker = `failed: ${e?.message}`;
    console.error('LLM ranking failed, returning title-filtered list', e?.message);
  }
  debug.ranked_count = ranked.length;

  return { jobs: ranked, sources: [...sourcesTried], total_raw: deduped.length, excluded_terms: hardExclude, debug };
}
