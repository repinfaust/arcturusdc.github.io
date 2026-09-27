'use client';

import { TabHeading, Panel, Field, Segmented, Btn, StageBar, INPUT, DISPLAY, MONO, CAPS } from '../ui';

const SEARCH_STAGES = [
  'Searching Reed & Adzuna…',
  'Merging and de-duplicating…',
  'Filtering by your target roles…',
  'Ranking by relevance…',
];

export default function ScansTab({ search, setSearch, searchJobs, searching, searchStage, searchOut, analyseFromSearch, analysing, serviceBranch }) {
  const set = (k) => (v) => setSearch((s) => ({ ...s, [k]: v }));
  const jobs = searchOut?.jobs || [];
  const debug = searchOut?.debug;

  return (
    <div>
      <div className="mt-8">
        <TabHeading kicker="Find roles" title="Recce the market">
          <p className="mt-2.5 text-[15px]">Search live UK job boards (Reed + Adzuna), then analyse any role against your service record.</p>
          <p className="mt-2 text-xs leading-relaxed text-[#686c62] max-w-[820px]">
            We search Reed + Adzuna — a good slice of UK roles, but not all (direct-employer and some boards aren&apos;t covered). Found a job elsewhere? Paste it on the Pipeline tab and analyse it directly.
          </p>
        </TabHeading>
      </div>

      <Panel accent className="mt-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <Field label="Keywords">
            <input value={search.keywords} onChange={(e) => set('keywords')(e.target.value)} placeholder="e.g. Operations Manager" className={INPUT} />
          </Field>
          <Field label="Location">
            <input value={search.location} onChange={(e) => set('location')(e.target.value)} placeholder="e.g. Salisbury" className={INPUT} />
          </Field>
          <Field label="Min salary (£) — optional" hint="Setting this hides jobs with no listed salary (most of them). Leave blank for the widest results.">
            <input type="number" min={0} step={5000} value={search.salary} onChange={(e) => set('salary')(e.target.value)} placeholder="leave blank" className={INPUT} />
          </Field>
        </div>
        <div className="flex flex-wrap justify-between items-end gap-4 mt-5">
          <div className="flex flex-col gap-3">
            <Segmented value={search.mode} onChange={set('mode')}
              options={[['both', 'Local + Remote'], ['location', 'Local only'], ['remote', 'Remote only']]} />
            <button type="button" onClick={() => set('excludeService')(!search.excludeService)} className="flex items-center gap-2.5 text-sm text-left">
              <span className={`w-5 h-5 border-2 border-[#4c5c3f] flex items-center justify-center text-xs font-extrabold text-[#f8f4ea] shrink-0 ${search.excludeService ? 'bg-[#4c5c3f]' : ''}`}>
                {search.excludeService ? '✓' : ''}
              </span>
              Exclude my current employer (Ministry of Defence{serviceBranch ? ` / ${serviceBranch}` : ''})
            </button>
          </div>
          <Btn className="h-14 px-7 text-base" onClick={searchJobs} disabled={searching}>
            {searching ? 'Searching…' : 'Search →'}
          </Btn>
        </div>
        {searching && <StageBar stages={SEARCH_STAGES} stage={searchStage} />}
      </Panel>

      {searchOut && (
        <>
          <div className="flex flex-wrap justify-between items-end gap-3 mt-9 pb-3 border-b-4 border-[#22251f]">
            <div className={`${DISPLAY} text-[24px] sm:text-[30px] leading-none tracking-[-0.025em]`}>
              {jobs.length} relevant · {searchOut.total_raw || jobs.length} scanned
            </div>
            <span className={`${CAPS} text-[#686c62]`}>Ranked by relevance</span>
          </div>

          {jobs.length === 0 && (
            <div className="bg-[#fffdf8] border border-[#d7cebc] border-t-0 px-5 py-8 text-center text-sm text-[#686c62]">
              No relevant roles found. Try broader keywords or a different location.
            </div>
          )}

          <div className="flex flex-col">
            {jobs.map((j, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 sm:gap-5 items-center px-4 sm:px-5 py-5 bg-[#fffdf8] border border-[#d7cebc] border-t-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold">{j.title}</span>
                    <span className={`px-1.5 py-0.5 border border-[#d7cebc] ${CAPS} !text-[10px] text-[#686c62]`}>{j.source}</span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-[#686c62]">
                    {[j.company, j.location, j.salary || 'Salary not listed'].filter(Boolean).join(' · ')}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {j.why && <span className="px-2 py-1 bg-[#dce3d2] text-[11px] font-bold text-[#3d4a33]">{j.why}</span>}
                    {j.clearance && (
                      <span title="Clearance is detected from the listing text — check the full advert."
                        className={`px-2 py-1 text-[11px] font-bold ${j.clearance.ok ? 'bg-[#dfe9ea] text-[#2e6570]' : 'bg-[#f6ecdc] text-[#8a5a1e]'}`}>
                        {j.clearance.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4">
                  {typeof j.relevance === 'number' && <span className={`${MONO} text-[13px] font-semibold text-[#4c5c3f]`}>{j.relevance}%</span>}
                  {j.url && <a href={j.url} target="_blank" rel="noreferrer" className={`${CAPS} text-[#686c62]`}>View</a>}
                  <Btn variant="outline" className="h-[42px] px-4 text-[13px]" onClick={() => analyseFromSearch(j)} disabled={analysing}>Analyse</Btn>
                </div>
              </div>
            ))}
          </div>

          {searchOut.excluded_terms?.length > 0 && (
            <details className="mt-4 text-[11px] text-[#686c62]">
              <summary className="cursor-pointer">Some role types are left out of results — what&apos;s filtered?</summary>
              <p className="mt-2 leading-relaxed">Job titles containing these terms are hidden before ranking: {searchOut.excluded_terms.join(' · ')}</p>
            </details>
          )}

          {debug && (
            <details className="mt-3 bg-[#fffdf8] border border-[#d7cebc] text-xs">
              <summary className="cursor-pointer px-4 py-3 font-bold">Why these results? ({debug.ranked_count} of {debug.raw_count} raw)</summary>
              <div className={`px-4 pb-4 ${MONO} text-[11px] space-y-0.5 text-[#686c62]`}>
                <div>queries: <b>{(debug.query?.terms || []).join(', ')}</b> · loc <b>{debug.query?.location}</b> · mode <b>{debug.query?.mode}</b></div>
                <div>sources: {Object.entries(debug.source_counts || {}).map(([s, n]) => `${s}=${n}`).join(' · ') || 'none returned'}</div>
                <div>funnel: {debug.raw_count} raw → {debug.deduped_count} deduped → {debug.after_negative_filter} after filter → {debug.ranked_count} shown</div>
                <div>ranker: {debug.ranker}</div>
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
