'use client';

import { useState } from 'react';
import { printCvAsPdf } from '@/lib/careerEngine/printCv';
import { TabHeading, Md, AiReviewWarning, Btn, SmallBtn, DISPLAY, CAPS, INPUT, MONO } from '../ui';

// Coverage verdict colours in Squared's palette (D-SITE-089).
const MET_DOT = { yes: '#4c5c3f', partial: '#5a3c2f' };

// Not in the design export; built in the same language (D-SITE-034).
export default function CvTab({ cvLibrary, profile, tailorCv, saveTailoredCv, tailoring, coverageCheck, coverageChecking, goPipeline }) {
  const [openId, setOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [saving, setSaving] = useState(false);
  const [cvEdit, setCvEdit] = useState('');

  return (
    <div>
      <div className="mt-8">
        <TabHeading kicker="CV tailoring" title="Tailored CVs">
          <p className="mt-2.5 text-[15px]">Every CV you&apos;ve tailored to a role, in civilian language. Analyse a role and choose &ldquo;Proceed to Apply&rdquo; to add one.</p>
        </TabHeading>
      </div>

      <div className="mt-6 pb-3 border-b-4 border-[#22251f]">
        <div className={`${DISPLAY} text-[24px] sm:text-[30px] leading-none tracking-[-0.025em]`}>
          {cvLibrary.length} {cvLibrary.length === 1 ? 'CV' : 'CVs'} on file
        </div>
      </div>

      {cvLibrary.length === 0 ? (
        <div className="bg-[#fffdf8] border border-[#d7cebc] border-t-0 px-5 py-10 text-center text-sm text-[#686c62]">
          No tailored CVs yet. <button onClick={goPipeline} className="underline font-bold text-[#4c5c3f]">Analyse a role</button>, then choose &ldquo;Proceed to Apply&rdquo;.
        </div>
      ) : (
        <div className="flex flex-col">
          {cvLibrary.map((cv) => {
            const open = openId === cv.id;
            const isEditing = editingId === cv.id;
            return (
              <div key={cv.id} className="bg-[#fffdf8] border border-[#d7cebc] border-t-0">
                <button onClick={() => setOpenId(open ? null : cv.id)} className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left">
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold">{cv.role}</div>
                    <div className="text-[13px] text-[#686c62]">
                      {cv.company}{cv.tailored_cv_at ? ` · ${new Date(cv.tailored_cv_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                  <span className="flex items-center gap-3">
                    <span className={`px-2 py-1 bg-[#4c5c3f] text-[#f8f4ea] ${CAPS} !text-[11px]`}>{cv.status}</span>
                    <span className="text-lg text-[#4c5c3f]">{open ? '−' : '+'}</span>
                  </span>
                </button>
                {open && (
                  <div className="px-5 pb-5">
                    <div className="flex justify-end gap-4 mb-3">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingId(null);
                          } else {
                            setDraftText(cv.tailored_cv || '');
                            setEditingId(cv.id);
                          }
                        }}
                        className={`${CAPS} text-[#686c62]`}
                      >
                        {isEditing ? 'Cancel edit' : 'Edit text'}
                      </button>
                      <button onClick={() => printCvAsPdf({ name: profile?.name || 'Candidate', role: cv.role || 'Role', cvMarkdown: cv.tailored_cv })} className={`${CAPS} text-[#4c5c3f]`}>Download PDF</button>
                      <button onClick={() => navigator.clipboard?.writeText(cv.tailored_cv)} className={`${CAPS} text-[#686c62]`}>Copy</button>
                    </div>
                    {isEditing ? (
                      <div className="bg-[#f8f4ea] border border-[#ede5d4] p-4 space-y-3">
                        <textarea
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          rows={16}
                          className={`${INPUT} ${MONO} text-xs leading-relaxed`}
                        />
                        <div className="flex justify-end gap-2">
                          <SmallBtn onClick={() => setEditingId(null)}>Cancel</SmallBtn>
                          <SmallBtn
                            dark
                            disabled={saving}
                            onClick={async () => {
                              setSaving(true);
                              const ok = await saveTailoredCv?.(cv.id, draftText);
                              setSaving(false);
                              if (ok) setEditingId(null);
                            }}
                          >
                            {saving ? 'Saving…' : 'Save CV edits'}
                          </SmallBtn>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f8f4ea] border border-[#ede5d4] p-4 sm:p-5"><Md>{cv.tailored_cv}</Md></div>
                    )}
                    <div className="mt-4 bg-[#f8f4ea] border border-[#ede5d4] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[15px] font-bold">Requirements coverage</div>
                          <p className="text-[13px] text-[#686c62] mt-0.5">Checks the role&apos;s requirements against your real evidence, and whether this CV says it in the advert&apos;s own words — what their screening software matches on.</p>
                        </div>
                        <SmallBtn dark disabled={coverageChecking} onClick={() => coverageCheck?.(cv.id)}>
                          {coverageChecking ? 'Checking…' : cv.coverage ? 'Re-check coverage (1 action)' : 'Check coverage (1 action)'}
                        </SmallBtn>
                      </div>
                      {Array.isArray(cv.coverage) && cv.coverage.length > 0 && (() => {
                        const fixes = cv.coverage.filter((c) => c && c.met !== 'no' && (c.in_cv === false || (c.fix && String(c.fix).trim())));
                        return (
                          <>
                            <div className="mt-3 flex flex-col divide-y divide-[#ede5d4] border-t border-[#ede5d4]">
                              {cv.coverage.map((c, i) => (
                                <div key={i} className="py-2.5 flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-start gap-2">
                                      <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full" style={{ background: MET_DOT[c.met] || '#C63C00' }} />
                                      <span className="text-[14px] font-bold leading-snug">{c.requirement}</span>
                                    </div>
                                    {c.evidence ? <div className="ml-4 text-[13px] text-[#686c62] mt-0.5">{c.evidence}</div> : null}
                                    {c.fix ? <div className="ml-4 text-[13px] text-[#5a3c2f] mt-0.5">Say it their way: {c.fix}</div> : null}
                                  </div>
                                  <span className={`${CAPS} !text-[11px] shrink-0 mt-0.5 ${c.met === 'no' ? 'text-[#C63C00]' : c.in_cv ? 'text-[#4c5c3f]' : 'text-[#686c62]'}`}>
                                    {c.met === 'no' ? 'Gap' : c.in_cv ? 'In CV' : 'Not in CV'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {fixes.length > 0 && (
                              <button
                                onClick={() => setCvEdit(`Work these requirements into the CV using the advert's own wording, grounded strictly in my real evidence — do not invent anything: ${fixes.map((c) => c.fix || c.requirement).join('; ')}`)}
                                className={`${CAPS} mt-3 text-[#4c5c3f] underline`}
                              >
                                Work {fixes.length} missing {fixes.length === 1 ? 'term' : 'terms'} into the CV → (prefills the revision box below)
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <input
                        value={cvEdit}
                        onChange={(e) => setCvEdit(e.target.value)}
                        placeholder='Suggest a CV edit, e.g. "lead with logistics scale" or "shorten summary"'
                        className={`${INPUT} flex-1 min-w-[240px] w-auto`}
                      />
                      <Btn
                        variant="dark"
                        className="h-[46px] px-5 text-[13px]"
                        disabled={tailoring || !cvEdit.trim()}
                        onClick={async () => { await tailorCv?.(cv.id, cvEdit); setCvEdit(''); }}
                      >
                        {tailoring ? 'Revising…' : 'Revise CV →'}
                      </Btn>
                    </div>
                    <AiReviewWarning what="CV" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
