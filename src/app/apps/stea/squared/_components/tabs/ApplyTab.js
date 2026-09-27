'use client';

import { useState } from 'react';
import { printCvAsPdf } from '@/lib/careerEngine/printCv';
import { TabHeading, Panel, NumberedTitle, CopyField, AiReviewWarning, Btn, SmallBtn, INPUT, CAPS } from '../ui';

// Not in the design export; built in the same language (D-SITE-034).
export default function ApplyTab({
  profile, anchors, pipeline,
  applyExtras, setExtra, applyDirty, saveApplyExtras,
  applyRoleId, setApplyRoleId,
  coverLetter, coverLoading, generateCoverLetter,
  applyAnswers, answersLoading, generateAnswers,
}) {
  const [coverEdit, setCoverEdit] = useState('');
  const role = pipeline.find((r) => r.id === applyRoleId);

  return (
    <div>
      <div className="mt-8">
        <TabHeading kicker="Apply assist" title="Fill the forms fast">
          <p className="mt-2.5 text-[15px]">Your details, ready to copy field by field into any application form. Fill the extras once — they&apos;re saved for next time.</p>
        </TabHeading>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-5 items-start">
        <Panel accent>
          <NumberedTitle n="01" title="Standard fields" />
          <div className="mt-5 flex flex-col gap-3.5">
            <CopyField label="Full name" value={profile?.name} />
            <CopyField label="Phone" value={applyExtras.phone} editable onChange={(v) => setExtra('phone', v)} />
            <CopyField label="Location" value={profile?.location} />
            <CopyField label="Current / last role" value={profile?.current_role || [profile?.rank, profile?.trade].filter(Boolean).join(', ')} />
            <CopyField label="Expected salary (£)" value={profile?.min_salary ? String(profile.min_salary) : ''} />
            <CopyField label="Security clearance held" value={profile?.clearance && profile.clearance !== 'None' ? profile.clearance : ''} />
            <CopyField label="LinkedIn" value={applyExtras.linkedin} editable onChange={(v) => setExtra('linkedin', v)} />
          </div>
        </Panel>

        <Panel tone="limestone">
          <NumberedTitle n="02" title="Your extras"
            right={<SmallBtn dark onClick={saveApplyExtras} disabled={!applyDirty}>{applyDirty ? 'Save' : 'Saved'}</SmallBtn>} />
          <div className="mt-5 flex flex-col gap-3.5">
            <CopyField label="Address line 1" value={applyExtras.address1} editable onChange={(v) => setExtra('address1', v)} />
            <CopyField label="Address line 2" value={applyExtras.address2} editable onChange={(v) => setExtra('address2', v)} />
            <CopyField label="Town / city" value={applyExtras.town} editable onChange={(v) => setExtra('town', v)} />
            <CopyField label="Postcode" value={applyExtras.postcode} editable onChange={(v) => setExtra('postcode', v)} />
            <CopyField label="Notice period / availability" value={applyExtras.notice} editable onChange={(v) => setExtra('notice', v)} />
            <CopyField label="Right to work" value={applyExtras.right_to_work} editable onChange={(v) => setExtra('right_to_work', v)} />
            <CopyField label="Work pattern (remote / hybrid / on site)" value={applyExtras.work_pattern} editable onChange={(v) => setExtra('work_pattern', v)} />
            <CopyField label="How did you hear about us?" value={applyExtras.referral} editable onChange={(v) => setExtra('referral', v)} />
          </div>
        </Panel>
      </div>

      {Array.isArray(anchors) && anchors.length > 0 && (
        <Panel className="mt-5">
          <NumberedTitle n="03" title="Employment history" />
          <p className="mt-1.5 text-[13px] text-[#686c62]">From your evidence anchors — most recent first.</p>
          <div className="mt-4 flex flex-col gap-4">
            {anchors.slice(0, 4).map((a, i) => (
              <div key={i} className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 pb-4 border-b border-[#ede5d4] last:border-0 last:pb-0">
                <CopyField label="Employer / unit" value={a.company} />
                <CopyField label="Period" value={a.period} />
                <CopyField label="Summary" value={Array.isArray(a.bullets) ? a.bullets.filter(Boolean)[0] : ''} />
              </div>
            ))}
          </div>
        </Panel>
      )}

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
            {applyAnswers.map((qa, i) => <CopyField key={i} label={qa.q} value={qa.a} />)}
            <AiReviewWarning what="answer" />
          </div>
        )}
      </Panel>
    </div>
  );
}
