'use client';

import { useState } from 'react';
import { TabHeading, Panel, NumberedTitle, Field, Segmented, SmallBtn, Btn, INPUT, DISPLAY, MONO, CAPS } from '../ui';
import RecordTranslator from '../RecordTranslator';
import { unresolvedClaims } from '@/lib/careerEngine/recordTranslate';
import { clearanceStatus } from '@/lib/careerEngine/clearance';

const BRANCHES = ['British Army', 'Royal Navy', 'Royal Air Force', 'Royal Marines'];
const CLEARANCES = ['None', 'BPSS', 'CTC', 'SC', 'DV'];
const CLEARANCE_NOTE = {
  None: 'No clearance — that’s fine for most civilian roles.',
  BPSS: 'Baseline check. Most employers can re-run this quickly.',
  CTC: 'Counter-terrorist check. Useful for ports, police and some site roles.',
  SC: 'Opens most defence-sector roles while it is live — we flag listings that mention it.',
  DV: 'DV is rare and valuable — we flag listings that mention it.',
};

const DAY = 864e5;
const fmtDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const parseDate = (s) => { const d = s ? new Date(`${s}T00:00:00`) : null; return d && !isNaN(d) ? d : null; };

// Exit date is optional: not set, still serving (countdown) or already out.
function ExitPanel({ profile, set }) {
  const exit = parseDate(profile.exit_date);
  const notice = parseDate(profile.notice_date);
  const now = new Date();
  const out = exit && exit <= now;
  const daysLeft = exit && !out ? Math.ceil((exit - now) / DAY) : null;
  const pct = exit && notice && notice < exit && !out
    ? Math.min(100, Math.max(0, ((now - notice) / (exit - notice)) * 100))
    : null;

  return (
    <div className="flex-[1_1_280px] p-5 sm:p-7 bg-[#22251f] text-[#f8f4ea] flex flex-col">
      <div className={`${CAPS} text-[#b9c7ab]`}>Exit date · optional</div>
      <input type="date" value={profile.exit_date || ''} onChange={(e) => set('exit_date', e.target.value)}
        className="mt-2 w-full max-w-[220px] px-3 py-2 bg-transparent border border-[rgba(248,244,234,0.3)] text-[15px] font-semibold text-[#f8f4ea] [color-scheme:dark]" />

      {!exit && (
        <p className="mt-6 text-[13px] leading-relaxed text-[#d9ddcf]">Add your last day in service to see a countdown — or leave it blank. If you&apos;re already out, add the date you left.</p>
      )}

      {daysLeft != null && (
        <>
          <div className={`mt-6 ${DISPLAY} text-[80px] sm:text-[96px] leading-[0.85] tracking-[-0.045em]`}>{daysLeft}</div>
          <div className={`mt-2 ${CAPS} text-[#b9c7ab]`}>{daysLeft === 1 ? 'Day to exit' : 'Days to exit'}</div>
          <div className={`mt-6 ${CAPS} text-[#b9c7ab]`}>Notice started · optional</div>
          <input type="date" value={profile.notice_date || ''} onChange={(e) => set('notice_date', e.target.value)}
            className="mt-2 w-full max-w-[220px] px-3 py-2 bg-transparent border border-[rgba(248,244,234,0.3)] text-sm text-[#f8f4ea] [color-scheme:dark]" />
          {pct != null && (
            <>
              <div className="mt-4 h-1.5 bg-[rgba(248,244,234,0.18)]"><div className="h-1.5 bg-[#b9c7ab]" style={{ width: `${pct.toFixed(0)}%` }} /></div>
              <div className={`mt-2 flex justify-between ${MONO} text-xs sm:text-[11px] text-[#cbd3c0]`}>
                <span>Notice started {notice.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>{pct.toFixed(0)}% through notice</span>
              </div>
            </>
          )}
          <p className="mt-auto pt-6 text-[13px] leading-relaxed text-[#d9ddcf]">Starting early gives you room to be selective about what you go for.</p>
        </>
      )}

      {out && (
        <>
          <div className={`mt-6 ${DISPLAY} text-[56px] sm:text-[64px] leading-[0.85] tracking-[-0.04em]`}>Out</div>
          <div className={`mt-2 ${CAPS} text-[#b9c7ab]`}>Left service {fmtDate(exit)}</div>
          <p className="mt-auto pt-6 text-[13px] leading-relaxed text-[#d9ddcf]">Your service still counts — lead with what you did and the numbers behind it.</p>
        </>
      )}
    </div>
  );
}

function Translator({ translations, saveTranslations, translateLine, translateRecord, usage, anchors, saveAnchors }) {
  const [line, setLine] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const used = translations.filter((t) => t.used).length;

  const commit = async (next) => {
    const { res, data } = await saveTranslations(next);
    if (!res.ok) alert('Could not save: ' + (data?.error || res.status));
  };
  const update = (i, patch) => commit(translations.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const remove = (i) => commit(translations.filter((_, j) => j !== i));

  const translate = async () => {
    if (!line.trim()) return;
    setBusy(true);
    setNote('');
    const out = await translateLine(line.trim());
    setBusy(false);
    if (!out) return;
    // New suggestions start unapproved: the user decides what goes in their CV.
    await commit([...translations, { mil: out.mil, civ: out.civ, used: false, source: 'line', added: out.added || [], confirmed_claims: [] }]);
    setNote(out.note || '');
    setLine('');
  };

  return (
    <Panel className="mt-5">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div>
          <NumberedTitle n="03" title="Skills translator" />
          <p className="mt-1.5 text-sm text-[#686c62]">Say what you did in words a civvy hiring manager will get. Tick the ones you want in your CV.</p>
        </div>
        <span className={`${CAPS} text-[#686c62]`}>{used} of {translations.length} in CV</span>
      </div>

      <div className="mt-4 border-t-4 border-[#22251f]">
        <div>
          <div className={`hidden sm:grid grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_150px] gap-3 py-2.5 border-b border-[#d7cebc] ${CAPS} text-[#686c62]`}>
            <span>In service</span><span /><span>In civilian work</span><span className="text-right">Use</span>
          </div>
          {translations.length === 0 && (
            <p className="py-5 text-[13px] text-[#686c62]">Nothing yet. Paste a line from your record below and we&apos;ll suggest a civilian version.</p>
          )}
          {translations.map((t, i) => {
            // Show where each line came from, and block inferred claims until
            // they are edited out or confirmed (D-SITE-036).
            const open = unresolvedClaims({ civ: t.civ, added: t.added, confirmed: t.confirmed_claims });
            const confirmed = (t.confirmed_claims || []).filter((c) => (t.added || []).includes(c));
            return (
            <div key={`${i}:${t.mil}:${t.civ}`} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_150px] gap-2 sm:gap-3 sm:items-center py-3 border-b border-[#ede5d4]">
              <span className="text-sm leading-snug text-[#686c62]">
                {t.mil}
                <span className={`block mt-1 ${CAPS} !text-[11px] text-[#686c62]`}>{t.source === 'record' ? `From your record${t.category ? ` · ${t.category}` : ''}` : 'Single line'}</span>
              </span>
              <span className={`hidden sm:block ${MONO} text-[#4c5c3f] text-center`}>→</span>
              <textarea defaultValue={t.civ} rows={2} onBlur={(e) => e.target.value !== t.civ && update(i, { civ: e.target.value })}
                className="text-sm font-semibold leading-snug bg-transparent border-b border-transparent hover:border-[#d7cebc] focus:border-[#4c5c3f] outline-none py-1 resize-y" />
              <span className="flex sm:justify-end gap-2">
                <button onClick={() => update(i, { used: !t.used })} disabled={!t.used && open.length > 0}
                  title={!t.used && open.length ? 'Remove or confirm the inferred wording first' : ''}
                  className={`px-2.5 py-1.5 border text-xs sm:text-[11px] font-extrabold tracking-[0.08em] uppercase disabled:opacity-40 disabled:cursor-not-allowed ${t.used ? 'bg-[#4c5c3f] border-[#4c5c3f] text-[#f8f4ea]' : 'border-[#22251f]'}`}>
                  {t.used ? '✓ In CV' : 'Add'}
                </button>
                <button onClick={() => remove(i)} title="Remove" className="px-2 text-[#C63C00] font-bold">✕</button>
              </span>
              {(open.length > 0 || confirmed.length > 0) && (
                <div className="sm:col-span-4 flex flex-col gap-1 sm:-mt-1">
                  {open.map((ph) => (
                    <span key={ph} className="flex flex-wrap items-center gap-2 text-xs sm:text-[11px] font-bold text-[#C63C00]">
                      Inferred, not in the original: &ldquo;{ph}&rdquo; — edit it out, or
                      <button onClick={() => update(i, { confirmed_claims: [...(t.confirmed_claims || []), ph] })}
                        className="px-2 py-0.5 border border-[#C63C00] uppercase tracking-[0.08em]">I can back this up</button>
                    </span>
                  ))}
                  {confirmed.map((c) => <span key={c} className="text-xs sm:text-[11px] text-[#4c5c3f]">&ldquo;{c}&rdquo; — confirmed by you, not in the original</span>)}
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <input value={line} onChange={(e) => setLine(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && translate()}
          placeholder="Paste a line from your SJAR or JPA record…" className={`${INPUT} flex-1 min-w-[240px] w-auto`} />
        <Btn variant="dark" className="h-[46px] px-5 text-[13px]" onClick={translate} disabled={busy || !line.trim()}>
          {busy ? 'Translating…' : 'Translate →'}
        </Btn>
      </div>
      {note && <p className="mt-2 text-[13px] sm:text-xs text-[#8a5a1e]">{note}</p>}
      <p className="mt-2 text-xs sm:text-[11px] text-[#686c62]">Each translation uses one action. Edit any suggestion before you tick it.</p>
      {!recordOpen && (
        <button onClick={() => setRecordOpen(true)} className="mt-3 text-sm font-extrabold text-[#4c5c3f]">Got a whole appraisal or record? Translate it in one go →</button>
      )}
      {recordOpen && (
        <RecordTranslator translations={translations} saveTranslations={saveTranslations} translateRecord={translateRecord}
          usage={usage} anchors={anchors} saveAnchors={saveAnchors} onClose={() => setRecordOpen(false)} />
      )}
    </Panel>
  );
}

function Anchors({ anchors, setAnchors, saveAnchors, saving }) {
  const update = (i, patch) => setAnchors(anchors.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  return (
    <Panel tone="limestone">
      <NumberedTitle n="05" title="Evidence anchors" right={
        <div className="flex gap-2">
          <SmallBtn onClick={() => setAnchors([...anchors, { company: '', period: '', bullets: [''] }])}>+ Add anchor</SmallBtn>
          <SmallBtn dark onClick={saveAnchors} disabled={saving === 'anchors'}>{saving === 'anchors' ? 'Saving…' : 'Save all'}</SmallBtn>
        </div>
      } />
      <p className="mt-2 text-[13px] text-[#686c62]">Real postings, real numbers. The AI only ever works from these — no gucci titles you didn&apos;t earn.</p>
      <div className="mt-4 flex flex-col gap-3">
        {anchors.length === 0 && <p className="text-[13px] text-[#686c62]">No anchors yet. Add one per posting or role, most recent first.</p>}
        {anchors.map((a, i) => (
          <div key={i} className="relative grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4 p-4 pl-5 bg-[#fffdf8] border border-[#d7cebc]">
            <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#4c5c3f]" />
            <div className="flex flex-col gap-2">
              <input value={a.company || ''} onChange={(e) => update(i, { company: e.target.value })} placeholder="Unit or employer"
                className="text-sm font-bold bg-transparent border-b border-[#ede5d4] focus:border-[#4c5c3f] outline-none py-1" />
              <input value={a.period || ''} onChange={(e) => update(i, { period: e.target.value })} placeholder="e.g. 2021–2027"
                className={`${CAPS} !text-[11px] text-[#686c62] bg-transparent border-b border-[#ede5d4] focus:border-[#4c5c3f] outline-none py-1`} />
              <button onClick={() => setAnchors(anchors.filter((_, j) => j !== i))} className={`self-start mt-1 ${CAPS} !text-[11px] text-[#C63C00]`}>Remove</button>
            </div>
            <textarea value={(a.bullets || []).join('\n')} onChange={(e) => update(i, { bullets: e.target.value.split('\n') })}
              placeholder="One achievement per line, with numbers"
              className="min-h-[96px] text-[13px] sm:text-xs leading-relaxed bg-[#f8f4ea] p-2.5 border border-[#ede5d4] outline-none focus:border-[#4c5c3f] resize-y" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function ConfigTab({
  profile, setProfile, saveProfile, anchors, setAnchors, saveAnchors,
  translations, saveTranslations, translateLine, translateRecord, usage, saving,
  cvUploads, cvBusy, handleCvFile, saveCvAndExtract, setActiveCv, relabelCv, deleteCv,
}) {
  const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLabel, setPasteLabel] = useState('');

  return (
    <div>
      <div className="mt-8">
        <TabHeading kicker="Kit list" title="Onboarding & configuration.">
          <p className="mt-2.5 text-[15px] text-[#686c62]">Your service record goes in here. Everything downstream — scoring, search, CV — is built from it.</p>
          <div className="mt-3.5 flex gap-2.5 items-start max-w-[680px] p-3 border border-[#d7cebc] bg-[#fffdf8] text-[13px] sm:text-xs leading-relaxed text-[#686c62]">
            <span className="shrink-0 w-2 h-2 mt-1 bg-[#4c5c3f]" />
            Your details stay in your own private Arcturus DC workspace. We never sell your data or use it for marketing. It&apos;s shared only with the AI and job-board services that run your search, then stored securely here. We never ask for your service number.
          </div>
        </TabHeading>
      </div>

      {/* 01 CV */}
      <Panel accent className="mt-7">
        <NumberedTitle n="01" title="Your CV" />
        <p className="mt-2 text-sm leading-relaxed text-[#686c62] max-w-[820px]">
          Upload your CV (PDF or DOCX). The <strong className="text-[#22251f]">active</strong> CV is the reference Squared uses to analyse roles, search and tailor — and we&apos;ll fill your service record, profile and evidence from it.
        </p>
        <p className="mt-2 text-[13px] sm:text-xs leading-relaxed text-[#5a3c2f] max-w-[820px]">
          <strong className="text-[#C63C00]">OPSEC:</strong> before uploading, take out operation names, deployment locations, unit details and anything you wouldn&apos;t say to a civilian employer.
        </p>
        <div className="flex flex-wrap gap-2.5 mt-4">
          <label className={`inline-flex items-center h-[46px] px-5 text-sm font-extrabold ${cvBusy ? 'bg-[#d7cebc] text-[#686c62] cursor-not-allowed' : 'bg-[#4c5c3f] text-[#f8f4ea] shadow-[4px_4px_0_#22251f] cursor-pointer'}`}>
            {cvBusy ? 'Reading…' : 'Upload CV (PDF/DOCX)'}
            <input type="file" accept=".pdf,.docx,.txt,application/pdf" className="hidden" disabled={cvBusy}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleCvFile(f); }} />
          </label>
          <button onClick={() => setPasteOpen((o) => !o)} className="h-[46px] px-4 bg-[#fffdf8] border border-[#22251f] text-sm font-bold">or paste text</button>
        </div>
        {pasteOpen && (
          <div className="mt-4 flex flex-col gap-2.5">
            <input value={pasteLabel} onChange={(e) => setPasteLabel(e.target.value)} placeholder="Label (e.g. Resettlement CV v2)" className={INPUT} />
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your full CV text here…" className={`${INPUT} h-40 resize-none`} />
            <div>
              <SmallBtn dark disabled={cvBusy || !pasteText.trim()}
                onClick={async () => { await saveCvAndExtract(pasteLabel || 'My CV', pasteText); setPasteText(''); setPasteLabel(''); setPasteOpen(false); }}>
                Save CV
              </SmallBtn>
            </div>
          </div>
        )}
        {cvUploads.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {cvUploads.map((cv) => (
              <div key={cv.id} className={`flex flex-wrap items-center gap-3 sm:gap-4 px-4 py-3.5 border ${cv.active ? 'border-[#4c5c3f] bg-[#f8f4ea]' : 'border-[#d7cebc]'}`}>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">{cv.label}</span>
                    {cv.active && <span className={`px-1.5 py-0.5 bg-[#4c5c3f] text-[#f8f4ea] ${CAPS} !text-[11px]`}>Active</span>}
                  </div>
                  <div className="mt-0.5 text-[13px] sm:text-xs text-[#686c62] truncate">{cv.preview}…</div>
                </div>
                {!cv.active && <button onClick={() => setActiveCv(cv.id)} className={`${CAPS} text-[#4c5c3f]`}>Set active</button>}
                <button onClick={() => relabelCv(cv.id, cv.label)} className={`${CAPS} text-[#686c62]`}>Rename</button>
                <button onClick={() => deleteCv(cv.id)} className={`${CAPS} text-[#C63C00]`}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* 02 Service record + exit */}
      <section className="mt-5 flex flex-wrap border border-[#22251f] bg-[#fffdf8]">
        <div className="flex-[1.7_1_440px] min-w-0 p-5 sm:p-7 border-r border-[#d7cebc]">
          <NumberedTitle n="02" title="Service record"
            right={<SmallBtn dark onClick={() => saveProfile('record')} disabled={saving === 'record'}>{saving === 'record' ? 'Saving…' : 'Save record'}</SmallBtn>} />
          <div className="mt-5 flex flex-col gap-2">
            <span className={`${CAPS} text-[#686c62]`}>Service</span>
            <Segmented value={profile.service_branch} onChange={(v) => set('service_branch', v)} options={BRANCHES.map((b) => [b, b])} />
          </div>
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <Field label="Trade / specialisation">
              <input value={profile.trade || ''} onChange={(e) => set('trade', e.target.value)} placeholder="e.g. Royal Signals — Communications Systems Engineer" className={INPUT} />
            </Field>
            <Field label="Rank on exit">
              <input value={profile.rank || ''} onChange={(e) => set('rank', e.target.value)} placeholder="e.g. Staff Sergeant (OR-7)" className={INPUT} />
            </Field>
            <Field label="Years served">
              <input type="number" min={0} max={50} value={profile.years_served ?? ''} onChange={(e) => set('years_served', e.target.value)} className={INPUT} />
            </Field>
            {profile.clearance && profile.clearance !== 'None' && profile.clearance !== 'BPSS' && (
              <Field label="Clearance granted or renewed (year) · optional" hint="Used to check the 10-year (SC/CTC) or 7-year (DV) transfer limit.">
                <input type="number" min={1980} max={2100} value={profile.clearance_granted ?? ''} onChange={(e) => set('clearance_granted', e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 2019" className={INPUT} />
              </Field>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <span className={`${CAPS} text-[#686c62]`}>Security clearance held</span>
            <Segmented value={profile.clearance || 'None'} onChange={(v) => set('clearance', v)} options={CLEARANCES.map((c) => [c, c])} />
            <span className="text-[13px] sm:text-xs text-[#686c62]">{CLEARANCE_NOTE[profile.clearance || 'None'] || ''}</span>
            {['transferable', 'lapsed', 'past'].includes(clearanceStatus(profile).state) && (
              <span className="text-[13px] sm:text-xs font-bold text-[#8a5a1e]">{clearanceStatus(profile).label}.</span>
            )}
          </div>
          {Number(profile.years_served) >= 1 && (
            <div className="mt-4 p-3.5 border border-[#4c5c3f] bg-[#f8f4ea] text-[13px] sm:text-xs leading-relaxed">
              <strong>Civil Service roles:</strong> with a year or more served you look eligible for the{' '}
              <a href="https://www.civil-service-careers.gov.uk/great-place-to-work-for-veterans/" target="_blank" rel="noreferrer" className="underline font-bold text-[#4c5c3f]">Great Place to Work for Veterans</a>{' '}
              scheme (unless you&apos;re already a civil servant): meet a role&apos;s minimum criteria and your application moves on to the next stage. Most of these roles are on{' '}
              <a href="https://www.civilservicejobs.service.gov.uk/csr/index.cgi" target="_blank" rel="noreferrer" className="underline font-bold text-[#4c5c3f]">Civil Service Jobs</a>, not Reed or Adzuna.
            </div>
          )}
        </div>
        <ExitPanel profile={profile} set={set} />
      </section>

      {/* 03 Translator */}
      <Translator translations={translations} saveTranslations={saveTranslations} translateLine={translateLine}
        translateRecord={translateRecord} usage={usage} anchors={anchors} saveAnchors={saveAnchors} />

      {/* 04 Profile + 05 Evidence */}
      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-5 items-start">
        <Panel>
          <NumberedTitle n="04" title="Candidate profile"
            right={<SmallBtn dark onClick={() => saveProfile('profile')} disabled={saving === 'profile'}>{saving === 'profile' ? 'Saving…' : 'Save profile'}</SmallBtn>} />
          <div className="mt-5 flex flex-col gap-4">
            <Field label="Full name">
              <input value={profile.name || ''} onChange={(e) => set('name', e.target.value)} className={INPUT} />
            </Field>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
              <Field label="Home base">
                <input value={profile.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Salisbury" className={INPUT} />
              </Field>
              <Field label="Salary floor (£)">
                <input type="number" min={0} step={1000} value={profile.min_salary ?? ''} onChange={(e) => set('min_salary', e.target.value === '' ? '' : Number(e.target.value))} className={INPUT} />
              </Field>
            </div>
            <Field label="Target roles (comma separated)">
              <textarea value={(profile.target_roles || []).join(', ')}
                onChange={(e) => set('target_roles', e.target.value.split(',').map((s) => s.trimStart()))}
                onBlur={(e) => set('target_roles', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                className={`${INPUT} h-[88px] resize-none leading-normal`} />
            </Field>
          </div>
        </Panel>
        <Anchors anchors={anchors} setAnchors={setAnchors} saveAnchors={saveAnchors} saving={saving} />
      </div>
    </div>
  );
}
