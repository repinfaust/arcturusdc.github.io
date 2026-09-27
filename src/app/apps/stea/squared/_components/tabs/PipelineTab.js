'use client';

import { useState, useEffect } from 'react';
import { printCvAsPdf } from '@/lib/careerEngine/printCv';
import { Panel, Btn, StageBar, Md, AiReviewWarning, DISPLAY, MONO, CAPS } from '../ui';
import { parseEvaluation, verdictFor, scoreColor } from '../evaluation';

const ANALYSE_STAGES = [
  'Reading the role…',
  'Extracting requirements…',
  'Scoring against your service record…',
  'Mapping your evidence…',
  'Writing the fit narrative…',
];
const TAILOR_STAGES = [
  'Reading the role requirements…',
  'Matching your evidence…',
  'Translating into civilian language…',
  'Writing the tailored CV…',
  'Drafting the cover note…',
];

function Verdict({ results, onClear }) {
  const v = verdictFor(results.score);
  const { action, risk } = parseEvaluation(results.evaluation);
  const s = typeof results.score === 'number' ? results.score : null;
  return (
    <div className="flex-[1_1_300px] min-w-0 bg-[#fffdf8] border border-[#d7cebc] p-5 sm:p-6">
      <div className="flex justify-between items-center">
        <span className={`${CAPS} text-[#686c62]`}>The verdict</span>
        <button onClick={onClear} className={`${CAPS} text-[#686c62]`}>Clear ✕</button>
      </div>
      <div className="mt-1.5 text-[17px] font-bold">{results.jd_data?.company_name || 'Unknown company'}</div>
      <div className="text-[13px] text-[#686c62]">{results.jd_data?.role_title || ''}</div>

      <div className="mt-4 p-4 border border-l-[5px]" style={{ background: v.bg, borderColor: v.color }}>
        <div className={`${DISPLAY} text-[26px] leading-none tracking-[-0.02em]`} style={{ color: v.color }}>{v.label}</div>
        <p className="mt-2 text-[13px]">{v.sub}</p>
        {action && (
          <p className="mt-3 pt-3 border-t border-[#d7cebc] text-[13px] sm:text-xs leading-relaxed"><strong>Recommendation: </strong>{action}</p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[#d7cebc] flex gap-4 items-center">
        <div className="shrink-0 w-[88px] h-[88px] border border-[#22251f] bg-[#f8f4ea] flex flex-col items-center justify-center">
          <span className={`${DISPLAY} text-[38px] leading-none tracking-[-0.03em]`}>{s != null ? s.toFixed(1) : '—'}</span>
          <span className={`${MONO} text-[10px] text-[#686c62]`}>/ 5.0</span>
        </div>
        <div>
          <div className="flex gap-[3px]">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="w-[22px] h-2" style={{ background: s != null && n <= Math.round(s) ? v.color : '#ede5d4' }} />
            ))}
          </div>
          <p className="mt-2 text-[13px] sm:text-xs leading-relaxed text-[#686c62]">
            <strong className="text-[#22251f]">Rough fit estimate.</strong> An AI&apos;s opinion to help you triage — read the reasoning, don&apos;t take the number as gospel.
          </p>
        </div>
      </div>

      <div className="mt-4 p-3.5 bg-[#f3e5dc] border border-[#d9b8a6] flex gap-2.5">
        <span className="font-extrabold text-[#C63C00]">!</span>
        <div>
          <div className="text-[13px] sm:text-xs font-extrabold text-[#5a3c2f]">Watch-out</div>
          <p className="mt-1 text-[13px] sm:text-xs leading-relaxed text-[#5a3c2f]">{risk || 'Check the gaps in the reasoning before applying.'}</p>
        </div>
      </div>
    </div>
  );
}

function Reasoning({ results, tailorCv, tailoring, tailorStage, profile, goCvs }) {
  const { sections } = parseEvaluation(results.evaluation);
  const [open, setOpen] = useState({ 0: true, 1: true });
  useEffect(() => { setOpen({ 0: true, 1: true }); }, [results.id]);

  return (
    <div className="flex-[2_1_460px] min-w-0 bg-[#ede5d4] border border-[#d7cebc] p-5 sm:p-6">
      <div className="flex justify-between items-start gap-3">
        <h3 className="m-0 font-serif text-[28px] sm:text-[32px] font-normal leading-none tracking-[-0.02em]">The reasoning</h3>
        <span className={`px-2 py-1 border border-[#4c5c3f] ${CAPS} !text-[11px] text-[#4c5c3f]`}>AI assessment</span>
      </div>
      <p className="mt-2 mb-4 text-[13px] text-[#686c62]">The why behind the score. The number&apos;s just a quick triage signal.</p>

      {sections.length > 0 ? (
        <div className="flex flex-col border-t border-[#d7cebc]">
          {sections.map((sec, i) => (
            <div key={i} className="border-b border-[#d7cebc] bg-[#fffdf8]">
              <button onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
                className="w-full flex justify-between items-center px-4 py-3.5 text-sm font-extrabold text-left">
                <span className="flex gap-3 items-center">
                  <span className={`${MONO} text-xs sm:text-[11px] text-[#4c5c3f]`}>{String(i + 1).padStart(2, '0')}</span>
                  {sec.title}
                </span>
                <span className="text-lg font-normal text-[#4c5c3f]">{open[i] ? '−' : '+'}</span>
              </button>
              {open[i] && <div className="px-4 pb-4 pl-10"><Md>{sec.body}</Md></div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#fffdf8] border border-[#d7cebc] p-4"><Md>{results.evaluation}</Md></div>
      )}

      {results.id && (
        <div className="mt-5 pt-4 border-t border-[#d7cebc]">
          {!results.tailored_cv ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-3.5">
                <div>
                  <div className="text-sm font-extrabold">Decided to go for it?</div>
                  <p className="mt-0.5 text-[13px] sm:text-xs text-[#686c62]">Generate a CV tailored to this job, in civvy language, grounded in your real evidence.</p>
                </div>
                <Btn variant="olive" className="h-12 px-5 text-sm" onClick={() => tailorCv(results.id)} disabled={tailoring}>
                  {tailoring ? 'Tailoring CV…' : 'Proceed to Apply →'}
                </Btn>
              </div>
              {tailoring && <StageBar stages={TAILOR_STAGES} stage={tailorStage} note="Writing a CV tailored to this role from your real evidence. Usually 20–40 seconds." />}
            </>
          ) : (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                <span className="text-sm font-extrabold">Tailored CV</span>
                <div className="flex gap-4">
                  <button onClick={() => printCvAsPdf({ name: profile?.name || 'Candidate', role: results.jd_data?.role_title || 'Role', cvMarkdown: results.tailored_cv })} className={`${CAPS} text-[#4c5c3f]`}>Download PDF</button>
                  <button onClick={() => navigator.clipboard?.writeText(results.tailored_cv)} className={`${CAPS} text-[#686c62]`}>Copy</button>
                </div>
              </div>
              <div className="bg-[#fffdf8] border border-[#d7cebc] p-4 sm:p-5 max-h-[520px] overflow-y-auto"><Md>{results.tailored_cv}</Md></div>
              <AiReviewWarning what="CV" />
              <p className="text-xs sm:text-[11px] text-[#686c62] mt-2">
                Saved to your <button onClick={goCvs} className="font-bold underline text-[#4c5c3f]">CV library</button>.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PipelineTab(props) {
  const { hasConfig, jdText, setJdText, analyse, analysing, analyseStage, results, clearResults,
    pipeline, openAnalysis, openApplyAssist, openOnboarding } = props;

  return (
    <div>
      <p className="mt-3.5 text-[13px] sm:text-xs text-[#686c62] flex items-center gap-2">
        <span className="w-2 h-2 bg-[#4c5c3f] shrink-0" />
        <span>Private to your Arcturus DC workspace · we never sell your data or use it for marketing · shared only with the AI and job boards that run your search · <button onClick={openOnboarding} className="underline">how it works</button></span>
      </p>

      <Panel accent className="mt-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`${CAPS} text-[#686c62]`}>Input terminal</span>
          <span className={`${MONO} text-xs sm:text-[11px] text-[#8a8474]`}>Brief in → straight answer out</span>
        </div>
        <div className="flex flex-wrap gap-5 items-end mt-4">
          <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} disabled={!hasConfig}
            placeholder="Paste a job description or LinkedIn URL. We'll read it, score it against your service record, and give it to you straight…"
            className={`flex-1 min-w-0 basis-[280px] h-32 p-4 border border-[#d7cebc] bg-[#f8f4ea] ${MONO} text-[13px] leading-relaxed resize-none outline-none focus:border-[#4c5c3f] placeholder:text-[#a39b89] disabled:opacity-60`} />
          <Btn className="min-w-[190px] h-14 text-[15px]" onClick={() => analyse()} disabled={analysing || !hasConfig}>
            {analysing ? 'Analysing…' : 'Analyse Role'} <span className="text-[#b9c7ab]">→</span>
          </Btn>
        </div>
        {analysing && <StageBar stages={ANALYSE_STAGES} stage={analyseStage} note="Usually 15–30 seconds. The AI is reading the role and scoring it against your record." />}
      </Panel>

      {results && (
        <div className="flex flex-wrap gap-5 mt-6 items-start">
          <Verdict results={results} onClear={clearResults} />
          <Reasoning {...props} />
        </div>
      )}

      <div className="flex justify-between items-end mt-10 pb-3 border-b-4 border-[#22251f]">
        <div>
          <div className={`${CAPS} text-[#4c5c3f]`}>Active pipeline</div>
          <div className={`mt-1 ${DISPLAY} text-[26px] sm:text-[32px] leading-none tracking-[-0.025em]`}>
            {pipeline.length} {pipeline.length === 1 ? 'role' : 'roles'} in the frame
          </div>
        </div>
      </div>
      <div className="bg-[#fffdf8] border border-[#d7cebc] border-t-0 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className={`grid grid-cols-[minmax(0,1fr)_110px_140px_100px_150px] px-5 py-3.5 border-b border-[#d7cebc] ${CAPS} text-[#686c62]`}>
            <span>Company / role</span><span>Score</span><span>Status</span><span>Analysed</span><span className="text-right">Actions</span>
          </div>
          {pipeline.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[#686c62]">No roles analysed yet. Paste a job description above to start your pipeline.</div>
          )}
          {pipeline.map((p) => {
            const c = scoreColor(p.score);
            const applying = p.status === 'Applying';
            return (
              <div key={p.id} onClick={() => openAnalysis(p.id)}
                className={`grid grid-cols-[minmax(0,1fr)_110px_140px_100px_150px] items-center px-5 py-4 border-b border-[#ede5d4] cursor-pointer hover:bg-[#f3efe3] ${results?.id === p.id ? 'bg-[#f3efe3]' : ''}`}>
                <div className="flex gap-3.5 items-center min-w-0">
                  <span className={`shrink-0 w-10 h-10 border border-[#d7cebc] bg-[#f8f4ea] flex items-center justify-center ${DISPLAY} text-lg text-[#4c5c3f]`}>
                    {(p.company || '?').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold truncate">{p.company}</div>
                    <div className="text-[13px] text-[#686c62] truncate">{p.role}</div>
                  </div>
                </div>
                <span className={`flex items-center gap-2 ${MONO} text-lg font-semibold`} style={{ color: c }}>
                  <span className="w-2 h-2" style={{ background: c }} />{typeof p.score === 'number' ? p.score.toFixed(1) : '—'}
                </span>
                <span>
                  <span className={`px-2 py-1 border ${CAPS} !text-[11px] ${applying ? 'bg-[#4c5c3f] border-[#4c5c3f] text-[#f8f4ea]' : 'border-[#d7cebc] text-[#686c62]'}`}>{p.status}</span>
                </span>
                <span className="text-[13px]">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</span>
                <span className={`flex justify-end gap-4 ${CAPS}`}>
                  <button onClick={(e) => { e.stopPropagation(); openAnalysis(p.id); }} className="text-[#686c62]">View</button>
                  <button onClick={(e) => { e.stopPropagation(); openApplyAssist(p.id); }} className="text-[#4c5c3f]">Apply</button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
