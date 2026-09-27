'use client';

// Squared UI primitives. Design: planning/design/career-ops-forces — square
// panels, hairline rules, a 5px olive accent bar and hard offset shadows.
// Palette: paper #f8f4ea, limestone #ede5d4, ink #22251f, olive #4c5c3f,
// sage #b9c7ab, brick #C63C00 (NO-GO and warnings only).
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const DISPLAY = 'font-[family-name:var(--font-sq-display)] [font-stretch:88%] font-black uppercase';
export const MONO = 'font-[family-name:var(--font-sq-mono)]';
export const CAPS = 'text-[11px] font-extrabold tracking-[0.13em] uppercase';
export const INPUT = 'w-full px-3.5 py-3 border border-[#d7cebc] bg-[#f8f4ea] text-sm text-[#22251f] outline-none focus:border-[#4c5c3f] placeholder:text-[#a39b89]';

export function Kicker({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${CAPS} text-[#4c5c3f] ${className}`}>
      <span className="w-[22px] h-[5px] bg-[#4c5c3f] shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// Section heading used at the top of each tab.
export function TabHeading({ kicker, title, children }) {
  return (
    <div>
      <div className={`${CAPS} text-[#4c5c3f]`}>{kicker}</div>
      <h2 className={`mt-1.5 ${DISPLAY} text-[34px] sm:text-[44px] leading-none tracking-[-0.03em]`}>{title}</h2>
      {children}
    </div>
  );
}

export function Panel({ accent = false, tone = 'card', className = '', children }) {
  const bg = tone === 'limestone' ? 'bg-[#ede5d4]' : 'bg-[#fffdf8]';
  return (
    <section className={`relative border border-[#d7cebc] ${bg} p-5 sm:p-7 ${className}`}>
      {accent && <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#4c5c3f]" />}
      {children}
    </section>
  );
}

export function NumberedTitle({ n, title, right }) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div className="flex items-baseline gap-3">
        <span className={`${MONO} text-xs text-[#4c5c3f]`}>{n}</span>
        <h3 className="m-0 text-xl font-extrabold">{title}</h3>
      </div>
      {right}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className={`${CAPS} text-[#686c62]`}>{label}</span>
      {children}
      {hint && <span className="text-[11px] leading-snug text-[#686c62]">{hint}</span>}
    </label>
  );
}

const BTN = {
  primary: 'bg-[#22251f] text-[#f8f4ea] shadow-[5px_5px_0_#4c5c3f] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[3px_3px_0_#4c5c3f]',
  olive: 'bg-[#4c5c3f] text-[#f8f4ea] shadow-[4px_4px_0_#22251f] hover:bg-[#3d4a33]',
  outline: 'bg-[#fffdf8] text-[#22251f] border border-[#22251f] hover:bg-[#22251f] hover:text-[#f8f4ea]',
  dark: 'bg-[#22251f] text-[#f8f4ea]',
  quiet: 'bg-transparent text-[#686c62] hover:text-[#22251f]',
};

export function Btn({ variant = 'primary', className = '', disabled, children, ...rest }) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-extrabold transition-colors ${BTN[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </button>
  );
}

// Small uppercase action (Save record, Rename, View...).
export function SmallBtn({ dark = false, className = '', children, ...rest }) {
  return (
    <button {...rest}
      className={`px-3.5 py-2 ${CAPS} ${dark ? 'bg-[#22251f] text-[#f8f4ea]' : 'bg-[#fffdf8] text-[#22251f] border border-[#22251f]'} disabled:opacity-50 ${className}`}>
      {children}
    </button>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap border border-[#22251f] w-fit">
      {options.map(([id, label]) => {
        const on = id === value;
        return (
          <button key={id} type="button" onClick={() => onChange(id)}
            className={`px-3.5 py-2 text-[13px] font-bold border-r border-[#d7cebc] last:border-r-0 ${on ? 'bg-[#22251f] text-[#f8f4ea]' : 'bg-transparent text-[#22251f]'}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function StageBar({ stages, stage, note }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs mb-2 gap-3">
        <span className="font-semibold">{stages[stage]}</span>
        <span className={`${CAPS} text-[#686c62] shrink-0`}>Step {stage + 1} / {stages.length}</span>
      </div>
      <div className="h-1.5 bg-[#ede5d4]">
        <div className="h-1.5 bg-[#4c5c3f] transition-all duration-700" style={{ width: `${((stage + 1) / stages.length) * 100}%` }} />
      </div>
      {note && <p className="text-[11px] text-[#686c62] mt-1.5">{note}</p>}
    </div>
  );
}

// Markdown with the Squared type treatment (tables, lists, headings).
export function Md({ children }) {
  return (
    <div className="text-[13px] leading-relaxed text-[#22251f] [&_h1]:text-lg [&_h1]:font-extrabold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-bold [&_table]:w-full [&_table]:my-2 [&_table]:border-collapse [&_th]:text-left [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[#686c62] [&_th]:border-b [&_th]:border-[#d7cebc] [&_th]:py-1.5 [&_th]:pr-2 [&_td]:border-b [&_td]:border-[#ede5d4] [&_td]:py-1.5 [&_td]:pr-2 [&_td]:align-top [&_hr]:my-3 [&_hr]:border-[#d7cebc]">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children || ''}</ReactMarkdown>
    </div>
  );
}

/* A labelled value with a one-click copy button (Apply Assist). */
export function CopyField({ label, value, editable, onChange, multiline }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 min-w-0">
        <div className={`${CAPS} text-[#686c62] mb-1.5`}>{label}</div>
        {editable ? (
          multiline
            ? <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} className={`${INPUT} h-20 resize-none`} />
            : <input value={value || ''} onChange={(e) => onChange(e.target.value)} className={INPUT} />
        ) : (
          <div className="px-3.5 py-3 border border-[#ede5d4] bg-[#f8f4ea] text-sm min-h-[46px] break-words whitespace-pre-wrap">
            {value || <span className="text-[#a39b89]">—</span>}
          </div>
        )}
      </div>
      <button onClick={doCopy} disabled={!value} title="Copy"
        className={`shrink-0 h-[46px] px-3 ${CAPS} border ${value ? 'border-[#22251f] text-[#22251f] hover:bg-[#22251f] hover:text-[#f8f4ea]' : 'border-[#d7cebc] text-[#a39b89] cursor-not-allowed'}`}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

/* AI output must be checked before it's used — an invented line on someone's
   CV is a reputational risk, not a UX nit. */
export function AiReviewWarning({ what = 'document' }) {
  return (
    <div className="mt-3 flex gap-2.5 p-3.5 bg-[#f3e5dc] border border-[#d9b8a6]">
      <span className="font-extrabold text-[#C63C00]">!</span>
      <p className="text-xs leading-relaxed text-[#5a3c2f]">
        <strong>Check this before you use it.</strong> AI can get details wrong or overstate things. Read every line of this {what} and make sure it&apos;s accurate and genuinely yours before sending it anywhere.
      </p>
    </div>
  );
}

export function Modal({ kicker, onClose, children, width = 540 }) {
  return (
    <div className="fixed inset-0 z-[60] bg-[rgba(34,37,31,0.55)] flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full bg-[#f8f4ea] border border-[#22251f] shadow-[8px_8px_0_#4c5c3f] sm:shadow-[12px_12px_0_#4c5c3f]" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 sm:px-6 py-3.5 bg-[#22251f] text-[#f8f4ea]">
          <span className={`${CAPS} text-[#b9c7ab]`}>{kicker}</span>
          <button onClick={onClose} className="text-base" aria-label="Close">✕</button>
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </div>
  );
}
