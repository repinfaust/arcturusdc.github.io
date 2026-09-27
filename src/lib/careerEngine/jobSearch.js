// Live job search: Reed + Adzuna, deduped, obvious-mismatch culling, then an
// LLM relevance ranking of what survives. App-specific inputs (culling list,
// candidate background for the ranker) come from the app config.
import { callAnthropic, stripJsonFences } from './anthropic';

export async function searchJobs({
  keywords = '',
  location = '',
  salary_min,
  excludeEmployers = [],
  mode = 'both', // 'location' | 'remote' | 'both'
  targetRoles = [],
  defaultTerm,
  hardExclude = [],
  rankBackground = '',
}) {
  const results = [];
  const sourcesTried = new Set();
  const sourceCounts = {};

  const reedKey = process.env.REED_API_KEY;
  const adzId = process.env.ADZUNA_APP_ID;
  const adzKey = process.env.ADZUNA_APP_KEY;
  if (!reedKey && !(adzId && adzKey)) {
    const err = new Error('No job-search sources configured. Add REED_API_KEY and/or ADZUNA_APP_ID + ADZUNA_APP_KEY in Vercel.');
    err.status = 400;
    throw err;
  }

  // One query against Reed; loc='' means UK-wide (used for remote).
  async function fetchReed(query, loc) {
    if (!reedKey) return;
    try {
      const params = new URLSearchParams({ keywords: query, resultsToTake: '50', distanceFromLocation: '30' });
      if (loc) params.set('locationName', loc);
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
    if (!(adzId && adzKey)) return;
    try {
      const params = new URLSearchParams({ app_id: adzId, app_key: adzKey, results_per_page: '50', what: query, distance: '48', 'content-type': 'application/json' });
      if (loc) params.set('where', loc);
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
  const queryTerms = [...new Set([keywords, ...targetRoles].map((s) => (s || '').trim()).filter(Boolean))].slice(0, 5);
  if (queryTerms.length === 0 && defaultTerm) queryTerms.push(defaultTerm);

  const tasks = [];
  for (const term of queryTerms) {
    if (mode === 'location' || mode === 'both') {
      tasks.push(fetchReed(term, location));
      tasks.push(fetchAdzuna(term, location));
    }
    if (mode === 'remote' || mode === 'both') {
      // Reed: include "remote" in keywords; Adzuna: where=remote.
      tasks.push(fetchReed(`${term} remote`, ''));
      tasks.push(fetchAdzuna(term, 'remote'));
    }
  }
  await Promise.all(tasks);

  // Dedupe by normalised title+company.
  const seen = new Set();
  const deduped = results.filter((r) => {
    const key = `${(r.title || '').toLowerCase().trim()}|${(r.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // --- Stage 1: cheap, OBVIOUS-ONLY exclusions (deterministic culling only) ---
  // Mechanical cuts to save tokens, NOT relevance judgement — the LLM ranker
  // makes all the judgement calls on what survives.
  const excluded = excludeEmployers.map((e) => (e || '').toLowerCase().trim()).filter(Boolean);
  const stage1 = deduped.filter((r) => {
    const t = (r.title || '').toLowerCase();
    if (hardExclude.some((n) => t.includes(n))) return false;
    const co = (r.company || '').toLowerCase();
    if (excluded.some((e) => co.includes(e))) return false;
    return true;
  });

  // Debug trace so the UI can show *why* the result set is what it is.
  const debug = {
    query: { terms: queryTerms, location: location || '(any)', mode, salary_min: salary_min || '(none)' },
    sources_tried: [...sourcesTried],
    source_counts: sourceCounts,
    raw_count: results.length,
    deduped_count: deduped.length,
    after_negative_filter: stage1.length,
    dropped_by_negative_filter: deduped
      .filter((r) => hardExclude.some((n) => (r.title || '').toLowerCase().includes(n)))
      .map((r) => r.title),
    target_roles_used: targetRoles.length ? targetRoles : [keywords],
    threshold: 40,
    ranked_count: 0,
    ranker: 'skipped',
    scores: [],
  };

  // --- Stage 2: LLM relevance ranking of the survivors ---
  let ranked = stage1.map((r) => ({ ...r })); // default if ranker fails
  try {
    if (process.env.ANTHROPIC_API_KEY && stage1.length > 0) {
      const rankable = stage1.slice(0, 60);
      const list = rankable.map((r, i) => `${i}. ${r.title} @ ${r.company} (${r.location})`).join('\n');
      const rankPrompt =
        `The candidate is targeting these roles: ${targetRoles.join(', ') || keywords}.\n` +
        (rankBackground ? `Their background: ${rankBackground}\n\n` : '\n') +
        `Score each listing 0-100 for how well its TITLE matches the candidate's target roles. ` +
        `Be generous to roles that are the same kind of work worded differently. ` +
        `Score clearly-different disciplines low.\n\n` +
        `Listings:\n${list}\n\n` +
        `Return ONLY a JSON array of {"i": <index>, "score": <0-100>, "why": "<6 words max>"} for EVERY listing.`;
      const raw = await callAnthropic({
        system: 'You rank job listings by title relevance to a candidate. Respond with ONLY a JSON array.',
        prompt: rankPrompt,
        maxTokens: 2000,
      });
      const scores = JSON.parse(stripJsonFences(raw));
      if (Array.isArray(scores) && scores.length) {
        debug.ranker = 'ok';
        debug.scores = scores
          .filter((s) => stage1[s.i])
          .map((s) => ({ title: stage1[s.i].title, score: s.score, why: s.why || '' }))
          .sort((a, b) => (b.score || 0) - (a.score || 0));
        // Keep score >= 40. If that empties the list, fall back to the top 10
        // by score so the user always sees something.
        let kept = scores.filter((s) => stage1[s.i] && (s.score ?? 0) >= 40);
        if (kept.length === 0) kept = scores.filter((s) => stage1[s.i]).sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
        ranked = kept
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((s) => ({ ...stage1[s.i], relevance: s.score, why: s.why || '' }));
      }
    }
  } catch (e) {
    debug.ranker = `failed: ${e?.message}`;
    console.error('LLM ranking failed, returning title-filtered list', e?.message);
  }
  debug.ranked_count = ranked.length;

  return { jobs: ranked, sources: [...sourcesTried], total_raw: deduped.length, excluded_terms: hardExclude, debug };
}
