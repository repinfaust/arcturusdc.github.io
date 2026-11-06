'use client';

import { useMemo, useState } from 'react';
import { printCvAsPdf } from '@/lib/careerEngine/printCv';
import { clearanceStatus } from '@/lib/careerEngine/clearance';
import { TabHeading, Panel, NumberedTitle, CopyField, AiReviewWarning, Btn, INPUT, CAPS } from '../ui';

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
}) {
  const [coverEdit, setCoverEdit] = useState('');
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
        <div className={`${CAPS} text-[#686c62] mb-2`}>Applying for — pick a role to draft a cover letter &amp; answers</div>
        {pipeline.length > 0 ? (
          <select value={applyRoleId} onChange={(e) => setApplyRoleId(e.target.value)} className={INPUT}>
            <option value="">— select a role —</option>
            {pipeline.map((r) => <option key={r.id} value={r.id}>{r.role} @ {r.company}</option>)}
          </select>
        ) : (
          <p className="text-[13px] text-[#686c62]">Analyse a role first (Pipeline or Live Scans), then pick it here.</p>
        )}
      </div>

      <Panel accent className="mt-5">
        <NumberedTitle n="04" title="Cover letter"
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
        <NumberedTitle n="05" title="Common application answers"
          right={applyAnswers.length > 0 && applyRoleId ? (
            <button onClick={generateAnswers} disabled={answersLoading} className={`${CAPS} text-[#686c62]`}>Regenerate</button>
          ) : null} />
        {!applyRoleId ? (
          <p className="py-6 text-center text-sm text-[#686c62]">Select a role above to draft the usual &ldquo;why this role / why us / good fit&rdquo; answers.</p>
        ) : applyAnswers.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-[#686c62] mb-4">Draft the common free-text answers for this role. Each is copyable. Uses one action.</p>
            <Btn variant="olive" className="h-12 px-6 text-sm" onClick={generateAnswers} disabled={answersLoading}>
              {answersLoading ? 'Drafting…' : 'Draft answers'}
            </Btn>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3.5">
            {applyAnswers.map((qa, i) => <CopyField key={i} label={qa.q} value={qa.a} multiline />)}
            <AiReviewWarning what="answer" />
          </div>
        )}
      </Panel>
    </div>
  );
}
