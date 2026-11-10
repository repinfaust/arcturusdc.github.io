'use client';

/* Role Dossier progress tracker (D-SITE-088).
   One ink-panel graphic showing a role's journey from analysis through to
   submission: 01 Scored → 02 Research → 03 Tailored CV → 04 Apply pack →
   05 Interview brief → 06 Submitted. Stages are clickable jump links into the
   dossier sections below it. Research/brief are optional in practice — the
   tracker shows what exists, it never blocks a step. */

const INK = '#1c1c1a';

export const DOSSIER_STAGES = [
  { id: 'verdict', num: '01', label: 'Scored' },
  { id: 'research', num: '02', label: 'Research' },
  { id: 'cv', num: '03', label: 'Tailored CV' },
  { id: 'pack', num: '04', label: 'Apply pack' },
  { id: 'brief', num: '05', label: 'Interview brief' },
  { id: 'submit', num: '06', label: 'Submitted' },
];

export function stageStates(role) {
  const submitted = ['Applied', 'Interview', 'Offer'].includes(role?.status);
  return {
    verdict: Boolean(role?.evaluation),
    research: Boolean(role?.company_context),
    cv: Boolean(role?.tailored_cv),
    pack: Boolean(role?.cover_letter) || (Array.isArray(role?.apply_answers) && role.apply_answers.length > 0),
    brief: Boolean(role?.interview_brief),
    submit: submitted,
  };
}

const STATUS_OPTIONS = ['Evaluated', 'Applying', 'Applied', 'Interview', 'Offer', 'Rejected'];

function Node({ stage, done, current, onJump }) {
  return (
    <button
      type="button"
      onClick={() => onJump?.(stage.id)}
      className="group flex-1 min-w-[86px] text-left focus:outline-none"
      title={`Jump to ${stage.label}`}
    >
      <div className="flex items-center">
        <span
          className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center border-2 font-mono text-[11px] font-bold transition-colors ${
            done
              ? 'border-[#2f9d55] bg-[#2f9d55] text-[#1c1c1a]'
              : current
                ? 'border-[#f0452f] bg-[#f0452f] text-[#f6f7f8]'
                : 'border-[#f6f7f8]/30 bg-transparent text-[#f6f7f8]/50 group-hover:border-[#f6f7f8]/60'
          }`}
        >
          {done ? (
            <svg viewBox="0 0 12 12" className="h-4 w-4" aria-hidden="true">
              <path d="M2 6.5 5 9.5 10 3" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="square" />
            </svg>
          ) : (
            stage.num
          )}
          {current && (
            <span className="absolute -inset-1.5 animate-ping border border-[#f0452f] opacity-40" aria-hidden="true" />
          )}
        </span>
        {stage.id !== 'submit' && (
          <span
            aria-hidden="true"
            className={`h-px flex-1 ${done ? 'bg-[#2f9d55]' : 'border-t border-dashed border-[#f6f7f8]/25'}`}
          />
        )}
      </div>
      <div className="mt-2.5 pr-3">
        <div className={`font-mono text-[0.6rem] uppercase tracking-[0.14em] ${current ? 'text-[#ff8a73]' : 'text-[#f6f7f8]/40'}`}>
          /{stage.num}
        </div>
        <div
          className={`mt-0.5 text-[11px] font-bold leading-tight ${
            done ? 'text-[#f6f7f8]' : current ? 'text-white' : 'text-[#f6f7f8]/45'
          } group-hover:text-[#f6f7f8]`}
        >
          {stage.label}
        </div>
      </div>
    </button>
  );
}

export default function DossierTracker({ role, onJump, onSetStatus, statusSaving }) {
  if (!role) return null;
  const states = stageStates(role);
  const doneCount = DOSSIER_STAGES.filter((s) => states[s.id]).length;
  const percent = Math.round((doneCount / DOSSIER_STAGES.length) * 100);
  const currentId = DOSSIER_STAGES.find((s) => !states[s.id])?.id || null;
  const submitted = states.submit;
  const roleTitle = role.jd_data?.role_title || role.role || 'Role';
  const company = role.jd_data?.company || role.company || '';

  return (
    <section id="dossier-top" className="scroll-mt-24 border-2 border-[#1c1c1a] bg-[#1c1c1a] text-[#f6f7f8]">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f6f7f8]/15 px-5 py-4 sm:px-7">
        <div className="min-w-0">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#f0452f]">/Role dossier</p>
          <h3 className="mt-1 truncate text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
            {roleTitle}
            {company ? <span className="text-[#f6f7f8]/55"> · {company}</span> : null}
            <span className="text-[#f0452f]">.</span>
          </h3>
        </div>
        <div className="flex items-center gap-3">
          {typeof role.score === 'number' && (
            <div className="border border-[#f6f7f8]/25 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em]">
              Fit {role.score.toFixed(1)}<span className="text-[#f6f7f8]/40">/5</span>
            </div>
          )}
          <label className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[#f6f7f8]/50">
            Status
            <select
              value={STATUS_OPTIONS.includes(role.status) ? role.status : 'Evaluated'}
              onChange={(e) => onSetStatus?.(e.target.value)}
              disabled={statusSaving}
              className="border border-[#f6f7f8]/30 bg-transparent px-2 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-[#f6f7f8] focus:border-[#f0452f] focus:outline-none [&>option]:bg-[#1c1c1a]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Track + completion numeral */}
      <div className="grid gap-6 px-5 py-5 sm:px-7 sm:py-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <ol className="flex flex-wrap gap-y-5" aria-label="Application progress">
          {DOSSIER_STAGES.map((s) => (
            <Node key={s.id} stage={s} done={states[s.id]} current={s.id === currentId} onJump={onJump} />
          ))}
        </ol>
        <div className="flex items-end gap-4 border-t border-[#f6f7f8]/15 pt-4 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div>
            <span className="text-5xl font-black leading-none tracking-tight text-white sm:text-6xl">{percent}</span>
            <span className="ml-1 text-xl font-black text-[#f0452f]">%</span>
            <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[#f6f7f8]/45">
              {doneCount} of {DOSSIER_STAGES.length} stages
            </p>
          </div>
          {!submitted && (
            <button
              type="button"
              onClick={() => onSetStatus?.('Applied')}
              disabled={statusSaving}
              className="mb-1 border border-[#f6f7f8] px-3.5 py-2.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#f6f7f8] transition-colors hover:border-[#f0452f] hover:bg-[#f0452f] hover:text-white disabled:opacity-50"
            >
              {statusSaving ? 'Saving…' : 'Mark submitted'}
            </button>
          )}
          {submitted && (
            <div className="mb-1 flex items-center gap-2 border border-[#2f9d55] px-3.5 py-2.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#2f9d55]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#2f9d55]" aria-hidden="true" />
              {role.status}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
