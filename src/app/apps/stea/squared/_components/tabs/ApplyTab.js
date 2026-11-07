'use client';

import { useMemo, useState } from 'react';
import { printCvAsPdf } from '@/lib/careerEngine/printCv';
import { clearanceStatus } from '@/lib/careerEngine/clearance';
import { TabHeading, Panel, NumberedTitle, CopyField, AiReviewWarning, Btn, SmallBtn, Md, INPUT, CAPS } from '../ui';

function ApplySaveStatus({ status, onRetry }) {
  if (!status || status.state === 'idle') return null;
  if (status.state === 'pending') return <span className={`${CAPS} text-[#686c62]`}>Unsaved changes</span>;
  if (status.state === 'saving') return <span className={`${CAPS} text-[#686c62]`}>Saving…</span>;
  if (status.state === 'saved') return <span className={`${CAPS} text-[#4c5c3f]`}>Saved</span>;
  if (status.state === 'error') {
    return (
      <button onClick={onRetry} title={status.message} className={`${CAPS} text-[#C63C00] underline`}>
        Couldn&apos;t save — retry
      </button>
    );
  }
  return null;
}

// Not in the design export; built in the same language (D-SITE-034).
export default function ApplyTab({
  profile, anchors, pipeline,
  applyExtras, setExtra, applySave, saveApplyExtras,
  applyRoleId, setApplyRoleId,
  coverLetter, coverLoading, generateCoverLetter,
  applyAnswers, answersLoading, generateAnswers,
  answerCustomQuestion, customLoading, saveApplyAnswers,
  companyContext, setCompanyContext, researchCompany, researchLoading, saveCompanyContext, contextSaving,
  interviewBrief, generateInterviewBrief, briefLoading,
}) {
  const [coverEdit, setCoverEdit] = useState('');
  const [customQ, setCustomQ] = useState('');
  const [customGuidance, setCustomGuidance] = useState('');
  const role = pipeline.find((r) => r.id === applyRoleId);
  const clearance = clearanceStatus(profile);

  const seededRoles = useMemo(() => (Array.isArray(anchors) ? anchors : []).slice(0, 4).map((a) => {
    const raw = String(a?.company || '');
    const [emp, ...rest] = raw.split(/\s+—\s+/);
    return {
      employer: emp.trim(),
      title: rest.join(' — ').replace(/\s*\([^)]*\)\s*$/, '').trim(),
      period: a?.period || '',
      summary: (Array.isArray(a?.bullets) ? a.bullets.filter(Boolean)[0] : '') || '',
    };
  }), [anchors]);
  const applyRoles = Array.isArray(applyExtras.employment_history) ? applyExtras.employment_history : seededRoles;
  const setApplyRoles = (next) => setExtra('employment_history', next);
  const updateApplyRole = (i, key, val) => setApplyRoles(applyRoles.map((r, j) => (j === i ? { ...r, [key]: val } : r)));

  return (
    <div>
      <div className="mt-8">
        <TabHeading kicker="Apply assist" title="Fill the forms fast">
          <p className="mt-2.5 text-[15px]">Your details, ready to copy field by field into any application form. Fill the extras once — they&apos;re saved automatically.</p>
        </TabHeading>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-5 items-start">
        <Panel accent>
          <NumberedTitle n="01" title="Standard fields"
            right={<ApplySaveStatus status={applySave} onRetry={saveApplyExtras} />} />
          <p className="mt-1.5 text-[13px] sm:text-xs text-[#686c62]">Name, location, role, salary and clearance come from Config.</p>
          <div className="mt-4 flex flex-col gap-3.5">
            <CopyField label="Full name" value={profile?.name} />
            <CopyField label="Email" value={profile?.email || applyExtras.email} editable onChange={(v) => setExtra('email', v)} />
            <CopyField label="Phone" value={profile?.phone || applyExtras.phone} editable onChange={(v) => setExtra('phone', v)} />
            <CopyField label="Location" value={profile?.location} />
            <CopyField label="Current / last role" value={profile?.current_role || [profile?.rank, profile?.trade].filter(Boolean).join(', ')} />
            <CopyField label="Expected salary (£)" value={profile?.target_salary ? String(profile.target_salary) : profile?.min_salary ? String(profile.min_salary) : ''} />
            <CopyField label="Security clearance status" value={profile?.clearance && profile.clearance !== 'None' ? clearance.label : ''} />
            <CopyField label="Work pattern (remote / hybrid / on site)" value={applyExtras.work_pattern ?? profile?.work_pattern ?? ''} editable onChange={(v) => setExtra('work_pattern', v)} />
            <CopyField label="LinkedIn" value={applyExtras.linkedin} editable onChange={(v) => setExtra('linkedin', v)} />
          </div>
        </Panel>

        <Panel tone="limestone">
          <NumberedTitle n="02" title="Your extras"
            right={<ApplySaveStatus status={applySave} onRetry={saveApplyExtras} />} />
          <div className="mt-5 flex flex-col gap-3.5">
            <CopyField label="Address line 1" value={applyExtras.address1} editable onChange={(v) => setExtra('address1', v)} />
            <CopyField label="Address line 2" value={applyExtras.address2} editable onChange={(v) => setExtra('address2', v)} />
            <CopyField label="Town / city" value={applyExtras.town} editable onChange={(v) => setExtra('town', v)} />
            <CopyField label="Postcode" value={applyExtras.postcode} editable onChange={(v) => setExtra('postcode', v)} />
            <CopyField label="Notice period / availability" value={applyExtras.notice} editable onChange={(v) => setExtra('notice', v)} />
            <CopyField label="Right to work" value={applyExtras.right_to_work} editable onChange={(v) => setExtra('right_to_work', v)} />
            <CopyField label="How did you hear about us?" value={applyExtras.referral} editable onChange={(v) => setExtra('referral', v)} />
          </div>
        </Panel>
      </div>

      <Panel className="mt-5">
        <NumberedTitle n="03" title="Recent roles (for employment-history fields)"
          right={<ApplySaveStatus status={applySave} onRetry={saveApplyExtras} />} />
        <p className="mt-1.5 text-[13px] text-[#686c62]">Edit these for application forms. Your evidence anchors in Config are not changed.</p>
        <div className="mt-4 flex flex-col gap-4">
          {applyRoles.map((r, i) => (
            <div key={i} className="pb-4 border-b border-[#ede5d4] last:border-0 last:pb-0 space-y-2.5">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                <CopyField label="Employer / unit" value={r.employer} editable onChange={(v) => updateApplyRole(i, 'employer', v)} />
                <CopyField label="Job title / rank" value={r.title} editable onChange={(v) => updateApplyRole(i, 'title', v)} />
                <CopyField label="Period" value={r.period} editable onChange={(v) => updateApplyRole(i, 'period', v)} />
              </div>
              <CopyField label="Summary" value={r.summary} editable multiline onChange={(v) => updateApplyRole(i, 'summary', v)} />
              <div className="flex justify-end">
                <button onClick={() => setApplyRoles(applyRoles.filter((_, j) => j !== i))} className={`${CAPS} text-[#686c62] hover:text-[#C63C00]`}>Remove role</button>
              </div>
            </div>
          ))}
          <button onClick={() => setApplyRoles([...applyRoles, { employer: '', title: '', period: '', summary: '' }])}
            className="text-left text-xs font-bold text-[#4c5c3f] hover:underline">+ Add role</button>
        </div>
      </Panel>

      <div className="mt-5 p-5 border border-[#22251f] bg-[#fffdf8]">
        <div className={`${CAPS} text-[#686c62] mb-2`}>Applying for — pick a role to research, draft cover letters, answer portal questions &amp; prep for interviews</div>
        {pipeline.length > 0 ? (
          <select value={applyRoleId} onChange={(e) => setApplyRoleId(e.target.value)} className={INPUT}>
            <option value="">— select a role —</option>
            {pipeline.map((r) => <option key={r.id} value={r.id}>{r.role} @ {r.company}</option>)}
          </select>
        ) : (
          <p className="text-[13px] text-[#686c62]">Analyse a role first (Pipeline or Live Scans), then pick it here.</p>
        )}
      </div>

      {applyRoleId && (
        <Panel className="mt-5">
          <NumberedTitle n="04" title="Company & role context"
            right={
              <SmallBtn dark onClick={() => researchCompany?.(applyRoleId, companyContext)} disabled={researchLoading}>
                {researchLoading ? 'Researching…' : companyContext ? 'Refresh research' : 'Research company (1 action)'}
              </SmallBtn>
            }
          />
          <p className="mt-1.5 text-[13px] text-[#686c62]">
            Pull live employer research or add your own intel (hiring manager, programme, angle). Automatically used by Cover Letter, Application Answers, and Interview Prep below.
          </p>
          <textarea
            value={companyContext ?? ''}
            onChange={(e) => setCompanyContext?.(e.target.value)}
            placeholder="Type your own notes about the employer/role or click 'Research company' above…"
            rows={companyContext ? 5 : 2}
            className={`${INPUT} mt-3 text-xs leading-relaxed`}
          />
          <div className="flex justify-end mt-2">
            <button onClick={() => saveCompanyContext?.(applyRoleId, companyContext || '')} disabled={contextSaving} className={`${CAPS} text-[#4c5c3f] hover:underline`}>
              {contextSaving ? 'Saving…' : 'Save context notes'}
            </button>
          </div>
        </Panel>
      )}

      <Panel accent className="mt-5">
        <NumberedTitle n={applyRoleId ? '05' : '04'} title="Cover letter"
          right={coverLetter ? (
            <div className="flex gap-4">
              <button onClick={() => navigator.clipboard?.writeText(coverLetter)} className={`${CAPS} text-[#686c62]`}>Copy</button>
              <button onClick={() => printCvAsPdf({ name: profile?.name || 'Candidate', role: role?.role || 'Cover letter', cvMarkdown: coverLetter })} className={`${CAPS} text-[#4c5c3f]`}>PDF</button>
            </div>
          ) : null} />
        {!applyRoleId ? (
          <p className="py-6 text-center text-sm text-[#686c62]">Select a role above to write a cover letter grounded in your real evidence.</p>
        ) : !coverLetter ? (
          <div className="py-6 text-center">
            <p className="text-sm text-[#686c62] mb-4">A cover letter for this role, in civilian language. Uses one action.</p>
            <Btn variant="olive" className="h-12 px-6 text-sm" onClick={() => generateCoverLetter()} disabled={coverLoading}>
              {coverLoading ? 'Writing…' : 'Write cover letter'}
            </Btn>
          </div>
        ) : (
          <div className="mt-4">
            <div className="bg-[#f8f4ea] border border-[#ede5d4] p-4 sm:p-5 text-sm leading-relaxed whitespace-pre-wrap">{coverLetter}</div>
            <AiReviewWarning what="cover letter" />
            <div className="mt-4 flex flex-wrap gap-2.5">
              <input value={coverEdit} onChange={(e) => setCoverEdit(e.target.value)} placeholder='Suggest an edit, e.g. "shorter" or "lead with the team size"'
                className={`${INPUT} flex-1 min-w-[240px] w-auto`} />
              <Btn variant="dark" className="h-[46px] px-5 text-[13px]" disabled={coverLoading || !coverEdit.trim()}
                onClick={async () => { await generateCoverLetter(coverEdit); setCoverEdit(''); }}>
                {coverLoading ? 'Revising…' : 'Revise →'}
              </Btn>
            </div>
            <p className="text-xs sm:text-[11px] text-[#686c62] mt-2">Each revision uses one action.</p>
          </div>
        )}
      </Panel>

      <Panel className="mt-5">
        <NumberedTitle n={applyRoleId ? '06' : '05'} title="Application form answers (common & custom portal questions)"
          right={applyAnswers.length > 0 && applyRoleId ? (
            <button onClick={generateAnswers} disabled={answersLoading} className={`${CAPS} text-[#686c62]`}>Regenerate common answers</button>
          ) : null} />
        {!applyRoleId ? (
          <p className="py-6 text-center text-sm text-[#686c62]">Select a role above to draft answers to common or custom application questions.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {applyAnswers.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-[#686c62] mb-4">Draft the 4 standard free-text answers for this role, or ask a custom portal question below.</p>
                <Btn variant="olive" className="h-11 px-5 text-sm" onClick={generateAnswers} disabled={answersLoading}>
                  {answersLoading ? 'Drafting…' : 'Draft common answers (1 action)'}
                </Btn>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {applyAnswers.map((qa, i) => (
                  <div key={i} className="space-y-1">
                    <CopyField
                      label={qa.q}
                      value={qa.a}
                      multiline
                      editable
                      onChange={(v) => {
                        const next = applyAnswers.map((item, j) => (j === i ? { ...item, a: v } : item));
                        saveApplyAnswers?.(next);
                      }}
                    />
                    {qa.custom && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => saveApplyAnswers?.(applyAnswers.filter((_, j) => j !== i))}
                          className={`${CAPS} text-[#686c62] hover:text-[#C63C00]`}
                        >
                          Remove question
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <AiReviewWarning what="answer" />
              </div>
            )}

            <div className="pt-4 border-t border-[#ede5d4] space-y-2.5">
              <div className="text-xs font-extrabold text-[#22251f]">Answer a custom portal question</div>
              <p className="text-xs text-[#686c62]">Paste any bespoke question from Civil Service Jobs, Workday, or an employer portal. Grounded strictly in your service record and evidence.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  value={customQ}
                  onChange={(e) => setCustomQ(e.target.value)}
                  placeholder='e.g. "Give an example of leading operational change under pressure"'
                  className={`${INPUT} sm:col-span-2`}
                />
                <input
                  value={customGuidance}
                  onChange={(e) => setCustomGuidance(e.target.value)}
                  placeholder='Optional: "250 words, STAR format"'
                  className={INPUT}
                />
              </div>
              <div className="flex justify-end">
                <Btn
                  variant="dark"
                  className="h-10 px-5 text-xs"
                  disabled={customLoading || !customQ.trim()}
                  onClick={async () => {
                    const ok = await answerCustomQuestion?.(customQ, customGuidance);
                    if (ok) { setCustomQ(''); setCustomGuidance(''); }
                  }}
                >
                  {customLoading ? 'Drafting…' : 'Answer question (1 action) →'}
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {applyRoleId && (
        <Panel className="mt-5">
          <NumberedTitle n="07" title="Interview prep brief"
            right={
              <div className="flex items-center gap-3">
                {interviewBrief && (
                  <>
                    <button onClick={() => printCvAsPdf({ name: profile?.name || 'Candidate', role: `${role?.role || 'Role'} — Interview Brief`, cvMarkdown: interviewBrief })} className={`${CAPS} text-[#4c5c3f]`}>PDF</button>
                    <button onClick={() => navigator.clipboard?.writeText(interviewBrief)} className={`${CAPS} text-[#686c62]`}>Copy</button>
                  </>
                )}
                <SmallBtn dark onClick={() => generateInterviewBrief?.(applyRoleId)} disabled={briefLoading}>
                  {briefLoading ? 'Preparing…' : interviewBrief ? 'Regenerate brief' : 'Generate interview brief (1 action)'}
                </SmallBtn>
              </div>
            }
          />
          <p className="mt-1.5 text-[13px] text-[#686c62]">
            60-second pitch, top 5 likely questions mapped to your service evidence, how to frame flagged gaps, and questions to ask the panel.
          </p>
          {interviewBrief && (
            <div className="mt-3 bg-[#f8f4ea] border border-[#ede5d4] p-4 sm:p-5">
              <Md>{interviewBrief}</Md>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
