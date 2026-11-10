'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { extractCvText } from '@/lib/careerEngine/cvParse';
import { useTenant } from '@/contexts/TenantContext';
import { auth } from '@/lib/firebase';
import { printCvAsPdf, cleanMarkdown } from '@/lib/careerEngine/printCv';
import { fillEmptyProfile, hasEvidence, mergeNewAnchors } from '@/lib/careerEngine/extractMerge';
import AdzunaCredit from '@/components/AdzunaCredit';
import DossierTracker from './_components/DossierTracker';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Tab <-> URL path mapping for deep-linkable sub-pages.
// NOTE: the config TAB uses the /setup path because career/config/ holds the
// YAML config files (a route there would collide / confuse).
// The CV tab uses /cv-library, not /cvs: Vercel's default upload ignore list drops any
// directory named CVS (case-insensitive), so a cvs/ route never deploys (D-SITE-032).
const TAB_BASE = '/apps/stea/career';
const TAB_TO_PATH = { pipeline: TAB_BASE, scans: `${TAB_BASE}/scans`, cvs: `${TAB_BASE}/cv-library`, apply: `${TAB_BASE}/apply`, settings: `${TAB_BASE}/setup` };

// The career API requires a signed-in workspace member (D-SITE-033). Send the
// Firebase ID token as well as the __session cookie, which lapses after 12h.
async function apiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = await auth?.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/* Plain-text rendering of a tailored CV for the copy-straight-out embed:
   markdown structure markers stripped so pasted text is portal-clean. */
function cvPlainText(md) {
  return cleanMarkdown(md || '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^---+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---------------- Markdown renderer for the AI fit narrative ---------------- */
function FitNarrative({ markdown }) {
  return (
    <div className="career-md min-w-0 overflow-hidden break-words text-sm text-[#1c1c1a]/80 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-xl font-bold text-[#1c1c1a] mt-6 mb-3 first:mt-0" {...p} />,
          h2: (p) => <h2 className="text-base font-bold text-[#1c1c1a] mt-6 mb-2 pb-1 border-b border-[#1c1c1a]/25" {...p} />,
          h3: (p) => <h3 className="text-sm font-bold text-[#f0452f] uppercase tracking-wide mt-4 mb-2" {...p} />,
          p:  (p) => <p className="my-2 break-words" {...p} />,
          ul: (p) => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
          ol: (p) => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
          strong: (p) => <strong className="font-bold text-[#1c1c1a]" {...p} />,
          blockquote: (p) => <blockquote className="border-l-4 border-[#1c1c1a] bg-[#e9ebee]/50 pl-4 py-2 my-3 rounded-r text-[#1c1c1a]" {...p} />,
          pre: (p) => <pre className="bg-[#f3f4f6] border border-[#1c1c1a]/25 p-3 rounded-none overflow-x-auto whitespace-pre-wrap break-words text-xs font-mono my-2" {...p} />,
          code: (p) => <code className="bg-[#e9ebee] px-1.5 py-0.5 rounded text-[13px] font-mono break-words" {...p} />,
          table: (p) => <div className="overflow-x-auto my-4"><table className="w-full text-xs border-collapse" {...p} /></div>,
          thead: (p) => <thead className="bg-[#e9ebee]" {...p} />,
          th: (p) => <th className="border border-[#1c1c1a]/25 px-3 py-2 text-left font-bold text-[#1c1c1a]" {...p} />,
          td: (p) => <td className="border border-[#1c1c1a]/25 px-3 py-2 align-top" {...p} />,
          hr: () => <hr className="my-5 border-[#1c1c1a]/25" />,
          a:  (p) => <a className="text-[#f0452f] underline" target="_blank" rel="noreferrer" {...p} />,
        }}
      >
        {cleanMarkdown(markdown || '')}
      </ReactMarkdown>
    </div>
  );
}

/* Splits a long markdown doc at "## " headings into collapsible sections so the
   page isn't one giant scroll. The first `openCount` sections start expanded. */
function CollapsibleNarrative({ markdown, openCount = 2 }) {
  const md = cleanMarkdown(markdown || '');
  // Preserve any content before the first "## " as an always-shown intro.
  const parts = md.split(/\n(?=##\s)/g);
  const intro = parts[0] && !/^##\s/.test(parts[0]) ? parts.shift() : null;

  if (parts.length <= 1) {
    return <FitNarrative markdown={md} />;
  }

  const sectionTitle = (block) => {
    const m = block.match(/^##\s+(.+)/);
    return m ? m[1].replace(/[#*`]/g, '').trim() : 'Section';
  };
  const sectionBody = (block) => block.replace(/^##\s+.+\n?/, '');

  return (
    <div className="space-y-2">
      {intro && intro.trim() && <FitNarrative markdown={intro} />}
      {parts.map((block, i) => (
        <details
          key={i}
          open={i < openCount}
          className="group border border-[#1c1c1a]/25 rounded-none bg-[#ffffff] overflow-hidden"
        >
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-[#f3f4f6] font-bold text-[#1c1c1a] text-sm">
            <span>{sectionTitle(block)}</span>
            <span className="material-symbols-outlined text-[#1c1c1a]/45 transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-[#1c1c1a]/10">
            <FitNarrative markdown={sectionBody(block)} />
          </div>
        </details>
      ))}
    </div>
  );
}

/* A labelled value with a one-click copy button (Apply Assist). */
// Apply Assist save state; shows nothing until something has been saved.
function ApplySaveStatus({ status, onRetry }) {
  const cls = 'text-[10px] font-bold font-mono uppercase tracking-widest';
  if (status.state === 'pending') return <span className={`${cls} text-[#1c1c1a]/45`}>Unsaved changes</span>;
  if (status.state === 'saving') return <span className={`${cls} text-[#1c1c1a]/45`}>Saving…</span>;
  if (status.state === 'saved') return <span className={`${cls} text-[#f0452f]`}>Saved</span>;
  if (status.state === 'error') {
    return (
      <button onClick={onRetry} title={status.message} className={`${cls} text-red-600 hover:underline`}>
        Couldn&apos;t save — retry
      </button>
    );
  }
  return null;
}

function CopyField({ label, value, editable, onChange, multiline }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">{label}</label>
        {editable ? (
          multiline ? (
            <textarea value={value || ''} onChange={(e) => onChange(e.target.value)}
              className="w-full mt-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a] resize-none h-20" />
          ) : (
            <input value={value || ''} onChange={(e) => onChange(e.target.value)}
              className="w-full mt-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]" />
          )
        ) : (
          <div className="mt-1 bg-[#f3f4f6] rounded-none p-3 text-sm text-[#1c1c1a] min-h-[44px] break-words whitespace-pre-wrap">{value || <span className="text-[#1c1c1a]/30">—</span>}</div>
        )}
      </div>
      <button onClick={doCopy} disabled={!value} title="Copy"
        className={`mt-6 shrink-0 w-10 h-10 rounded-none flex items-center justify-center transition-colors ${value ? 'bg-[#e9ebee] text-[#f0452f] hover:bg-[#1c1c1a] hover:text-white' : 'bg-[#f3f4f6] text-[#1c1c1a]/30 cursor-not-allowed'}`}>
        <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
      </button>
    </div>
  );
}

/* Prominent reminder that AI output must be checked before it's used — an
   invented line on someone's CV is a reputational risk, not a UX nit. */
function AiReviewWarning({ what = 'document' }) {
  return (
    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-none px-4 py-3">
      <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
      <p className="text-xs text-amber-900 leading-relaxed">
        <span className="font-bold">Check this before you use it.</span> AI can get details wrong or overstate things. Read every line of this {what} and make sure it's accurate and genuinely yours before sending it anywhere.
      </p>
    </div>
  );
}

/* First-run onboarding walkthrough. */
const ONBOARDING_CARDS = [
  {
    icon: '🧭', title: 'Welcome to Career Ops',
    body: "Job hunting is exhausting and the algorithms don't help — they bury you in mismatches and nudge you back toward the very people who just let you go.\n\nCareer Ops is the opposite: honest triage. It finds roles that genuinely fit, tells you straight which ones aren't worth your time, won't surface your current employer, and takes the grind out of applying. Here's the 60-second tour.",
  },
  {
    icon: '🔒', title: 'Your data stays yours',
    body: "Before you add anything, the important bit:\n\n• Everything you enter lives in your own private, isolated Arcturus DC workspace — no one else can see it.\n• We never sell your personal details or use them for marketing — ever.\n• Your CV and job details are only sent to the AI and job-board services needed to do the analysis, then stored securely in your workspace.\n\nIt's your job search. We just help you run it.",
  },
  {
    icon: '⚙️', title: 'First: set up your profile',
    body: "Head to Config and add two things the system needs:\n\n• Candidate Profile — your name, target roles, location, salary floor.\n• Evidence Anchors — your real roles and achievements with metrics.\n\nThese ground everything — the AI only ever uses your real evidence, never invents. Scoring weights are optional (sensible defaults apply).",
    cta: { label: 'Go to Config', tab: 'settings' },
  },
  {
    icon: '🔎', title: 'Two ways to start',
    body: "• No role in mind yet? Use Live Scans to search real UK job boards (Reed + Adzuna) — results are ranked by relevance to your targets.\n\n• Already found a job? Paste its link or text on the Pipeline tab and hit Analyse.",
  },
  {
    icon: '🎯', title: "You'll get an honest verdict",
    body: "Every role is scored across 12 factors with a clear GO / proceed-with-care / NO-GO call — strengths and gaps, no false hope. The point is to spend effort only where there's a genuine match.",
  },
  {
    icon: '🚀', title: 'Then take action',
    body: "Decided to apply? Career Ops will:\n• Tailor your CV to that exact role (download a clean ATS-friendly PDF).\n• Write a cover letter you can refine in plain English.\n• Pre-fill your details + draft the usual form answers in Apply Assist — copy field-by-field into any clunky application form.",
  },
  {
    icon: '☕', title: 'Fair by design',
    body: "Your first 20 actions are free. After that, a £5 coffee unlocks 50 more — just enough to cover the AI costs. We don't profit from people looking for work.\n\nSo: buy us a coffee if you can. And if you can't — remember us when you're the new CPO. 😉 Good luck out there.",
  },
];

// Finishing the tour ("Get started") counts as seen; closing only hides it.
function OnboardingModal({ onClose, onDismiss, onFinish, onCta }) {
  const [i, setI] = useState(0);
  const card = ONBOARDING_CARDS[i];
  const last = i === ONBOARDING_CARDS.length - 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-[#ffffff] rounded-none max-w-lg w-full p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div className="text-4xl mb-3">{card.icon}</div>
          <button onClick={onClose} className="text-[#1c1c1a]/30 hover:text-[#1c1c1a]/60"><span className="material-symbols-outlined">close</span></button>
        </div>
        <h3 className="text-xl font-bold text-[#1c1c1a]">{card.title}</h3>
        <p className="text-sm text-[#1c1c1a]/70 mt-3 leading-relaxed whitespace-pre-line min-h-[150px]">{card.body}</p>
        {card.cta && (
          <button onClick={() => onCta(card.cta.tab)} className="mt-1 mb-2 text-sm font-bold text-[#f0452f] hover:underline inline-flex items-center gap-1">
            {card.cta.label} <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        )}
        <div className="flex items-center justify-center gap-1.5 my-5">
          {ONBOARDING_CARDS.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-[#1c1c1a]' : 'w-1.5 bg-[#dfe2e6]'}`}></span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onDismiss} className="text-xs font-bold text-[#1c1c1a]/45 hover:text-[#1c1c1a]/70 font-mono uppercase tracking-widest">Don't show again</button>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="px-4 h-10 border border-[#1c1c1a]/25 text-[#1c1c1a]/70 font-bold rounded-none hover:bg-[#f3f4f6] text-sm">Back</button>}
            {last ? (
              <button onClick={onFinish} className="px-5 h-10 bg-[#1c1c1a] text-white font-bold rounded-none hover:bg-[#f0452f] text-sm">Get started</button>
            ) : (
              <button onClick={() => setI(i + 1)} className="px-5 h-10 bg-[#1c1c1a] text-white font-bold rounded-none hover:bg-[#f0452f] text-sm">Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Components ---------------- */

// RAG go/no-go verdict derived from score + the evaluation's recommendation.
function VerdictPanel({ score, evaluation }) {
  const s = typeof score === 'number' ? score : 0;
  let rag;
  if (s >= 4.0) rag = { label: 'GO', detail: 'Strong fit', color: '#2f9d55', sub: 'Apply — tailor and submit.' };
  else if (s >= 3.0) rag = { label: 'CARE', detail: 'Proceed with care', color: '#b45309', sub: 'Selective — apply only with a strong tailored narrative.' };
  else rag = { label: 'NO-GO', detail: 'Weak fit', color: '#f0452f', sub: 'Skip unless you have a specific reason.' };

  // Pull the model's own recommended action / one-line verdict if present.
  const action =
    evaluation?.match(/Recommended action:\s*\*{0,2}\s*(.+?)(?:\n|$)/i)?.[1] ||
    evaluation?.match(/Fit Recommendation[^\n]*\n+>?\s*#{0,3}\s*([^\n]+)/i)?.[1] ||
    null;

  return (
    <div className="mt-6 border-2 p-4" style={{ borderColor: rag.color }}>
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-black uppercase leading-none tracking-tight" style={{ color: rag.color }}>
          {rag.label}
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[#1c1c1a]/60">{rag.detail}</span>
      </div>
      <p className="mt-2 text-xs text-[#1c1c1a]/70">{rag.sub}</p>
      {action && (
        <p className="mt-3 border-t border-dashed border-[#1c1c1a]/25 pt-3 text-[11px] leading-relaxed text-[#1c1c1a]/80">
          <span className="font-mono font-bold uppercase tracking-[0.1em]">Recommendation: </span>{action.replace(/\*\*/g, '')}
        </p>
      )}
    </div>
  );
}

// Deliberately small/secondary: an LLM fit score is a rough estimate, not a
// precise verdict. The reasoning (VerdictPanel + narrative) is the real signal.
const FitGauge = ({ score }) => {
  const percentage = Math.max(0, Math.min(100, (score / 5) * 100));
  return (
    <div className="flex items-center gap-5">
      <div className="shrink-0">
        <span className="text-4xl font-black leading-none tracking-tight text-[#1c1c1a]">{score.toFixed(1)}</span>
        <span className="ml-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[#1c1c1a]/45">/ 5</span>
        <div className="mt-2 h-1.5 w-28 bg-[#1c1c1a]/10">
          <div className="h-full bg-[#1c1c1a]" style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <div className="text-[11px] leading-relaxed text-[#1c1c1a]/60">
        <span className="font-bold text-[#1c1c1a]">Rough fit estimate.</span> This is an AI's opinion to help you triage — read the reasoning below, don't take the number as gospel.
      </div>
    </div>
  );
};

/* ---------------- Configuration & Onboarding Components ---------------- */

const ProfileForm = ({ data, onChange, onSave, isSaving }) => (
  <div className="bg-[#ffffff] rounded-none p-5 sm:p-8 border border-[#1c1c1a]/25 flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#1c1c1a]">account_circle</span>
        <h3 className="font-bold text-[#1c1c1a] text-lg tracking-tight">Candidate Profile</h3>
      </div>
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-[#1c1c1a] text-white rounded-none font-bold text-xs font-mono uppercase tracking-widest hover:bg-[#f0452f] transition-all disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
    
    <div className="grid grid-cols-1 gap-5">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Full Name</label>
        <input 
          type="text" 
          value={data?.name || ''} 
          onChange={(e) => onChange({...data, name: e.target.value})}
          className="w-full bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-4 text-sm font-medium text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]"
          placeholder="e.g. Tom Granger"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Current Role</label>
          <input 
            type="text" 
            value={data?.current_role || ''} 
            onChange={(e) => onChange({...data, current_role: e.target.value})}
            className="w-full bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-4 text-sm font-medium text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]"
            placeholder="e.g. Product Owner"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Salary Floor (£)</label>
          <input
            type="number"
            step={5000}
            min={0}
            value={data?.min_salary || ''}
            onChange={(e) => onChange({...data, min_salary: e.target.value})}
            className="w-full bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-4 text-sm font-medium text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]"
            placeholder="e.g. 65000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Target Roles (Comma separated)</label>
        <textarea
          value={Array.isArray(data?.target_roles) ? data.target_roles.join(',') : (data?.target_roles || '')}
          onChange={(e) => onChange({...data, target_roles: e.target.value.split(',')})}
          onBlur={(e) => onChange({...data, target_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
          className="w-full h-24 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-4 text-sm font-medium text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a] resize-none"
          placeholder="e.g. Product Owner, Senior Product Owner, Product Manager"
        />
      </div>

      <ListField label="Stretch Roles (step up, comma separated)" field="stretch_roles" data={data} onChange={onChange}
        placeholder="e.g. Head of Product, Product Director" />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Target Salary (£)" field="target_salary" type="number" data={data} onChange={onChange} placeholder="e.g. 90000" />
        <TextField label="Location" field="location" data={data} onChange={onChange} placeholder="e.g. Nottingham" />
      </div>

      <TextField label="Working Pattern" field="work_pattern" data={data} onChange={onChange}
        placeholder="e.g. Hybrid, Nottingham or London depending on office days" />

      <ListField label="Preferred Sectors (comma separated)" field="target_sectors" data={data} onChange={onChange}
        placeholder="e.g. Financial services, Payments" />
      <ListField label="Excluded Sectors (comma separated)" field="excluded_sectors" data={data} onChange={onChange}
        placeholder="e.g. Gambling" />
    </div>
  </div>
);

const FIELD_LABEL = 'text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1';
const FIELD_INPUT = 'w-full bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-4 text-sm font-medium text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]';

const TextField = ({ label, field, data, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-2">
    <label className={FIELD_LABEL}>{label}</label>
    <input
      type={type}
      {...(type === 'number' ? { step: 5000, min: 0 } : {})}
      value={data?.[field] || ''}
      onChange={(e) => onChange({ ...data, [field]: e.target.value })}
      className={FIELD_INPUT}
      placeholder={placeholder}
    />
  </div>
);

// Comma-separated list stored as an array (same behaviour as Target Roles).
const ListField = ({ label, field, data, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className={FIELD_LABEL}>{label}</label>
    <input
      type="text"
      value={Array.isArray(data?.[field]) ? data[field].join(',') : (data?.[field] || '')}
      onChange={(e) => onChange({ ...data, [field]: e.target.value.split(',') })}
      onBlur={(e) => onChange({ ...data, [field]: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
      className={FIELD_INPUT}
      placeholder={placeholder}
    />
  </div>
);

const EvidenceManager = ({ anchors, onAdd, onDelete, onUpdate, onSave, isSaving }) => (
  <section className="bg-[#f3f4f6] rounded-none p-5 sm:p-8 border border-[#1c1c1a]/10 flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-[#1c1c1a] flex items-center gap-2 text-lg tracking-tight">
        <span className="material-symbols-outlined text-[#1c1c1a]">deployed_code</span>
        Evidence Anchors
      </h3>
      <div className="flex gap-3">
        <button 
          onClick={onAdd}
          className="px-4 py-2 bg-[#ffffff] border border-[#1c1c1a]/25 text-[#1c1c1a] rounded-none font-bold text-[10px] font-mono uppercase tracking-widest hover:bg-[#e9ebee] transition-all"
        >
          + Add Anchor
        </button>
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[#1c1c1a] text-white rounded-none font-bold text-[10px] font-mono uppercase tracking-widest hover:bg-[#f0452f] transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
    
    <div className="grid grid-cols-1 gap-4">
      {anchors?.map((anchor, i) => (
        <div key={i} className="bg-[#ffffff] p-6 rounded-none border border-[#1c1c1a]/25 group relative">
          <button 
            onClick={() => onDelete(i)}
            className="absolute top-4 right-4 text-[#1c1c1a]/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <input 
                className="w-full font-bold text-[#1c1c1a] border-b border-[#1c1c1a]/10 focus:border-[#f0452f] focus:ring-0 text-sm" 
                placeholder="Company Name" 
                value={anchor.company || ''}
                onChange={(e) => onUpdate(i, {...anchor, company: e.target.value})}
              />
              <input 
                className="w-full text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest border-b border-[#1c1c1a]/10 focus:border-[#f0452f] focus:ring-0" 
                placeholder="Period (e.g. 2021-Present)" 
                value={anchor.period || ''}
                onChange={(e) => onUpdate(i, {...anchor, period: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <textarea 
                className="w-full h-24 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-[11px] text-[#1c1c1a]/70 font-medium leading-relaxed resize-none" 
                placeholder="List your key outcomes and proof points..."
                value={anchor.bullets?.join('\n') || ''}
                onChange={(e) => onUpdate(i, {...anchor, bullets: e.target.value.split('\n')})}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const VisualWeightEditor = ({ weights, onChange, onSave, isSaving }) => (
  <section className="bg-[#ffffff] rounded-none p-5 sm:p-8 border border-[#1c1c1a]/25 flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-[#1c1c1a] flex items-center gap-2 text-lg tracking-tight">
        <span className="material-symbols-outlined text-[#1c1c1a]">tune</span>
        Scoring Model Tuning
      </h3>
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-[#1c1c1a] text-white rounded-none font-bold text-[10px] font-mono uppercase tracking-widest hover:bg-[#f0452f] transition-all disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Apply Weights'}
      </button>
    </div>
    <p className="text-xs text-[#1c1c1a]/60 -mt-3">How much each factor counts in a role&apos;s overall score. 100% is the default.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
      {[
        { id: 'domain_complexity', label: 'Domain Complexity' },
        { id: 'platform_data_depth', label: 'Platform/Data Depth' },
        { id: 'compensation', label: 'Compensation Parity' },
        { id: 'interview_likelihood', label: 'Interview Prediction' },
      ].map((factor) => (
        <div key={factor.id} className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#1c1c1a] font-mono uppercase tracking-widest">{factor.label}</span>
            <span className="text-sm font-black text-[#1c1c1a]">{((weights?.[factor.id] ?? 1) * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights?.[factor.id] ?? 1}
            onChange={(e) => onChange({...weights, [factor.id]: parseFloat(e.target.value)})}
            className="w-full h-2 bg-[#e9ebee] rounded-none appearance-none cursor-pointer accent-[#1c1c1a]"
          />
        </div>
      ))}
    </div>
  </section>
);

/* ---------------- Main Dashboard ---------------- */

export default function CareerOpsDashboard({ initialTab = 'pipeline' }) {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const pathname = usePathname();
  const [activeTab, setActiveTabState] = useState(initialTab);
  // Switch tab AND update the URL so sub-pages are deep-linkable / bookmarkable.
  // Rewrite the URL in place: router.push changed route segment and remounted
  // the dashboard, refetching everything and re-showing the first-run tour.
  // Next 14.2 syncs usePathname with native pushState, so Back/Forward work.
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    const path = TAB_TO_PATH[tab] || TAB_BASE;
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };
  useEffect(() => {
    const match = Object.entries(TAB_TO_PATH).find(([, p]) => p === pathname);
    if (match && match[0] !== activeTab) setActiveTabState(match[0]);
  }, [pathname]);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [results, setResults] = useState(null);

  // While analysing, advance a staged progress indicator so the ~15-30s
  // two-call LLM round trip doesn't look like a hang. These are timed UX
  // stages (no true server progress), capped just short of "done".
  const ANALYSE_STAGES = [
    'Reading the role…',
    'Extracting requirements…',
    'Scoring against your profile…',
    'Mapping your evidence…',
    'Writing the fit narrative…',
  ];
  useEffect(() => {
    if (!loading) { setProgressStage(0); return; }
    setProgressStage(0);
    const id = setInterval(() => {
      setProgressStage((s) => Math.min(s + 1, ANALYSE_STAGES.length - 1));
    }, 4000);
    return () => clearInterval(id);
  }, [loading]);

  // Staged progress for CV tailoring (same idea as analyse).
  const [tailorStage, setTailorStage] = useState(0);
  const TAILOR_STAGES = [
    'Reading the role requirements…',
    'Matching your evidence…',
    'Reordering and re-emphasising…',
    'Writing the tailored CV…',
    'Drafting the cover note…',
  ];
  const [configStatus, setConfigStatus] = useState({ loading: true, has_config: false });
  const [profileData, setProfileData] = useState({ name: '', current_role: '', min_salary: 0, target_roles: [] });
  const [anchorsData, setAnchorsData] = useState([]);
  const [weightsData, setWeightsData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Analysed roles + tailored CV library, loaded from Firestore. No demo data.
  const [pipeline, setPipeline] = useState([]);
  const [cvLibrary, setCvLibrary] = useState([]);
  const [tailoring, setTailoring] = useState(false);

  // Job search (Live Scans tab).
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchSalary, setSearchSalary] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotalRaw, setSearchTotalRaw] = useState(0);
  const [searchDebug, setSearchDebug] = useState(null);
  const [excludedTerms, setExcludedTerms] = useState([]);
  const [searchPrefilled, setSearchPrefilled] = useState(false);
  const [excludeCurrentEmployer, setExcludeCurrentEmployer] = useState(true);
  const [searchMode, setSearchMode] = useState('both'); // location | remote | both
  const [usage, setUsage] = useState(null); // { used, granted, remaining }
  const [showPaywall, setShowPaywall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  // Apply Assist: extra application fields (persisted) + the role being applied to.
  const [applyExtras, setApplyExtras] = useState({});
  // Apply Assist autosave status (D-SITE-076): idle (nothing saved yet) | pending | saving | saved | error.
  const [applySave, setApplySave] = useState({ state: 'idle' });
  const applyEditVersion = useRef(0);
  const [applyRoleId, setApplyRoleId] = useState('');
  // Dossier stage to scroll to once the newly-selected role's dossier renders.
  const pendingScrollRef = useRef(null);

  // CV library (uploaded CVs — the candidate's source of truth).
  const [cvUploads, setCvUploads] = useState([]);
  const [cvBusy, setCvBusy] = useState(false);
  // Extracted evidence awaiting the user's replace / add-new / skip choice (D-SITE-075).
  const [pendingEvidence, setPendingEvidence] = useState(null);
  const [cvPasteOpen, setCvPasteOpen] = useState(false);
  const [cvPasteText, setCvPasteText] = useState('');
  const [cvPasteLabel, setCvPasteLabel] = useState('');
  // Current/most-recent employer = first evidence anchor's company (anchors are
  // most-recent-first). Strip qualifiers like "(current)" for matching.
  const currentEmployer = useMemo(() => {
    const c = Array.isArray(anchorsData) && anchorsData[0]?.company ? anchorsData[0].company : '';
    return c.replace(/\s*\(current\)\s*/i, '').replace(/\s*—.*$/, '').trim();
  }, [anchorsData]);

  useEffect(() => {
    if (!tailoring) { setTailorStage(0); return; }
    setTailorStage(0);
    const id = setInterval(() => {
      setTailorStage((s) => Math.min(s + 1, TAILOR_STAGES.length - 1));
    }, 5000);
    return () => clearInterval(id);
  }, [tailoring]);

  // Staged progress for job search (Reed + Adzuna fetch, then LLM relevance rank).
  const [searchStage, setSearchStage] = useState(0);
  const SEARCH_STAGES = [
    'Searching Reed & Adzuna…',
    'Merging and de-duplicating…',
    'Filtering by your target roles…',
    'Ranking by relevance…',
  ];
  useEffect(() => {
    if (!searching) { setSearchStage(0); return; }
    setSearchStage(0);
    const id = setInterval(() => {
      setSearchStage((s) => Math.min(s + 1, SEARCH_STAGES.length - 1));
    }, 3000);
    return () => clearInterval(id);
  }, [searching]);

  useEffect(() => {
    if (currentTenant?.id) {
      checkConfig();
      loadAnalyses();
      loadCvs();
      loadUsage();
      loadApplyExtras();
      loadCvUploads();
      loadOnboarding();
      // Returning from a successful coffee purchase: refresh usage (webhook may
      // lag a moment) and clean the URL.
      if (typeof window !== 'undefined' && window.location.search.includes('coffee=success')) {
        setTimeout(loadUsage, 1500);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [currentTenant]);

  async function loadAnalyses() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'list_analyses', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.analyses)) setPipeline(data.analyses);
    } catch (err) {
      console.error('Failed to load analyses', err);
    }
  }

  // Generate or revise a role-tailored CV for an analysed role, save it, and show it.
  const [cvEdit, setCvEdit] = useState('');
  const [cvEditingId, setCvEditingId] = useState(null);
  const [cvDraftText, setCvDraftText] = useState('');
  const [cvSaving, setCvSaving] = useState(false);

  async function handleTailorCv(id, editInstruction = '') {
    if (!currentTenant?.id || !id) return;
    setTailoring(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'tailor_cv', tenantId: currentTenant.id, id, edit_instruction: editInstruction }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Tailoring failed');
      setResults((r) => (r && r.id === id ? { ...r, tailored_cv: data.tailored_cv, status: data.status || r.status } : r));
      setCvEdit('');
      loadAnalyses();
      loadCvs();
      loadUsage();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setTailoring(false);
    }
  }

  async function handleSaveTailoredCv(id, nextText) {
    if (!currentTenant?.id || !id || !nextText?.trim()) return;
    setCvSaving(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'save_tailored_cv', tenantId: currentTenant.id, id, tailored_cv: nextText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setResults((r) => (r && r.id === id ? { ...r, tailored_cv: data.tailored_cv } : r));
      setCvEditingId(null);
      loadCvs();
    } catch (err) {
      alert(err.message);
    } finally {
      setCvSaving(false);
    }
  }

  async function loadCvs() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'list_cvs', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.cvs)) setCvLibrary(data.cvs);
    } catch (err) {
      console.error('Failed to load CV library', err);
    }
  }

  // Start a £5 one-time Stripe checkout for a top-up (uses the shared
  // create-checkout-session route in mode:payment). Needs the Career Ops
  // coffee price id in env (CAREER_COFFEE_PRICE_ID).
  async function handleRedeemCode() {
    const code = window.prompt('Enter your access code:');
    if (!code || !currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'redeem_code', tenantId: currentTenant.id, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setShowPaywall(false);
      loadUsage();
      alert('Code accepted — you\'re all set. Enjoy.');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleBuyCoffee() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career/checkout', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (data?.url) { window.location.href = data.url; return; }
      alert(data?.error || 'Could not start checkout.');
    } catch (err) {
      alert('Could not start checkout: ' + err.message);
    }
  }

  async function loadUsage() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'get_usage', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok) setUsage(data);
    } catch (err) {
      console.error('Failed to load usage', err);
    }
  }

  // Onboarding: show once on first visit unless dismissed (Firestore).
  async function loadOnboarding() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'get_onboarding', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && !data.onboarding_dismissed) setShowOnboarding(true);
    } catch (err) {
      console.error('Failed to load onboarding state', err);
    } finally {
      setOnboardingChecked(true);
    }
  }
  async function dismissOnboarding() {
    setShowOnboarding(false);
    if (!currentTenant?.id) return;
    try {
      await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'dismiss_onboarding', tenantId: currentTenant.id }),
      });
    } catch (err) { console.error('Failed to dismiss onboarding', err); }
  }

  async function loadCvUploads() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'list_cv_uploads', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.cvs)) setCvUploads(data.cvs);
    } catch (err) { console.error('Failed to load CV uploads', err); }
  }

  async function saveCvAndExtract(label, cvText) {
    if (!cvText?.trim()) { alert('No text found in that file. Try another file or paste the text.'); return; }
    setCvBusy(true);
    try {
      const saveRes = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'save_cv', tenantId: currentTenant.id, label, cv_text: cvText, make_active: true }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error || 'Save failed');
      await loadCvUploads();
      if (window.confirm('CV saved & set as active. Auto-fill your profile and evidence from it now? (uses one action — you can review and edit before saving)')) {
        const exRes = await fetch('/api/stea/career', {
          method: 'POST', headers: await apiHeaders(),
          body: JSON.stringify({ action: 'extract_from_cv', tenantId: currentTenant.id, id: saved.id }),
        });
        const ex = await exRes.json();
        if (handleLimit(exRes, ex)) return;
        if (!exRes.ok) throw new Error(ex.error || 'Extraction failed');
        // Extraction only fills empty profile fields; it never overwrites ones the user set.
        if (ex.profile) setProfileData((p) => fillEmptyProfile(p, ex.profile));
        loadUsage();
        setActiveTab('settings');
        const extracted = Array.isArray(ex.evidence) ? ex.evidence : [];
        if (extracted.length && hasEvidence(anchorsData)) {
          setPendingEvidence(extracted); // existing library: ask before touching it
        } else {
          if (extracted.length) setAnchorsData(extracted);
          alert('Empty profile fields and evidence filled from your CV. Review them and hit Save.');
        }
      }
    } catch (err) { alert(err.message); }
    finally { setCvBusy(false); }
  }

  async function handleCvFile(file) {
    if (!file || !currentTenant?.id) return;
    setCvBusy(true);
    try {
      const text = await extractCvText(file);
      const label = file.name.replace(/\.(pdf|docx|txt)$/i, '');
      await saveCvAndExtract(label, text);
    } catch (err) { alert(err.message); }
    finally { setCvBusy(false); }
  }

  async function setActiveCv(id) {
    try {
      await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'set_active_cv', tenantId: currentTenant.id, id }),
      });
      loadCvUploads();
    } catch (err) { alert(err.message); }
  }
  async function relabelCv(id, current) {
    const label = window.prompt('Label for this CV:', current || '');
    if (label == null) return;
    await fetch('/api/stea/career', {
      method: 'POST', headers: await apiHeaders(),
      body: JSON.stringify({ action: 'relabel_cv', tenantId: currentTenant.id, id, label }),
    });
    loadCvUploads();
  }
  async function deleteCv(id) {
    if (!window.confirm('Delete this CV from your library?')) return;
    await fetch('/api/stea/career', {
      method: 'POST', headers: await apiHeaders(),
      body: JSON.stringify({ action: 'delete_cv', tenantId: currentTenant.id, id }),
    });
    loadCvUploads();
  }

  async function loadApplyExtras() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'get_apply_profile', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && data.apply_profile) {
        setApplyExtras(data.apply_profile);
        setApplySave({ state: data.apply_profile.updated_at ? 'saved' : 'idle' });
      }
    } catch (err) {
      console.error('Failed to load apply profile', err);
    }
  }

  async function saveApplyExtras() {
    if (!currentTenant?.id) return;
    const version = applyEditVersion.current;
    setApplySave({ state: 'saving' });
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'save_apply_profile', tenantId: currentTenant.id, apply_profile: applyExtras }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // An edit made while this save was in flight stays pending and saves next.
      setApplySave({ state: applyEditVersion.current === version ? 'saved' : 'pending' });
    } catch (err) {
      setApplySave({ state: 'error', message: err.message });
    }
  }

  const setExtra = (key, val) => {
    setApplyExtras((e) => ({ ...e, [key]: val }));
    applyEditVersion.current += 1;
    setApplySave({ state: 'pending' });
  };

  // Employment history for forms: the saved copy if one exists, otherwise seeded
  // from the evidence anchors ("Employer — Title (descriptor)" split into fields).
  const seededRoles = useMemo(() => (Array.isArray(anchorsData) ? anchorsData : []).slice(0, 4).map((a) => {
    const [employer, ...rest] = String(a?.company || '').split(' — ');
    return {
      employer: employer.trim(),
      title: rest.join(' — ').replace(/\s*\([^)]*\)\s*$/, '').trim(),
      period: a?.period || '',
      summary: (Array.isArray(a?.bullets) ? a.bullets.filter(Boolean)[0] : '') || '',
    };
  }), [anchorsData]);
  const applyRoles = Array.isArray(applyExtras.employment_history) ? applyExtras.employment_history : seededRoles;
  const setApplyRoles = (next) => setExtra('employment_history', next);
  const updateApplyRole = (i, key, val) => setApplyRoles(applyRoles.map((r, j) => (j === i ? { ...r, [key]: val } : r)));

  // Autosave shortly after typing stops, so leaving a field or reloading keeps it.
  useEffect(() => {
    if (applySave.state !== 'pending') return undefined;
    const t = setTimeout(saveApplyExtras, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyExtras, applySave.state]);

  // Cover letter (A2): generate or revise for the selected apply role.
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverEdit, setCoverEdit] = useState('');
  async function handleCoverLetter(editInstruction) {
    if (!currentTenant?.id || !applyRoleId) { alert('Select a role first.'); return; }
    setCoverLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'cover_letter', tenantId: currentTenant.id, id: applyRoleId, edit_instruction: editInstruction || '' }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Cover letter failed');
      setCoverLetter(data.cover_letter || '');
      setResults((r) => (r && r.id === applyRoleId ? { ...r, cover_letter: data.cover_letter } : r));
      setCoverEdit('');
      loadUsage();
      loadAnalyses();
    } catch (err) {
      alert(err.message);
    } finally {
      setCoverLoading(false);
    }
  }
  // Common & custom application answers (A3).
  const [applyAnswers, setApplyAnswers] = useState([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [customQ, setCustomQ] = useState('');
  const [customGuidance, setCustomGuidance] = useState('');
  const [customLoading, setCustomLoading] = useState(false);

  // Company context & Interview brief for the active role.
  const [companyContext, setCompanyContext] = useState('');
  const [companyNotes, setCompanyNotes] = useState('');
  const [editingContext, setEditingContext] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [contextSaving, setContextSaving] = useState(false);
  const [interviewBrief, setInterviewBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  // Morning Scout Agent queue & Honing/Refinement prefs (persisted in Firestore per workspace).
  const [scoutJobs, setScoutJobs] = useState([]);
  const [scoutLastRunAt, setScoutLastRunAt] = useState(null);
  const [scoutRunning, setScoutRunning] = useState(false);
  const [scoutUrl, setScoutUrl] = useState('');
  const [scoutBatchRunning, setScoutBatchRunning] = useState(false);
  const [scoutProgress, setScoutProgress] = useState('');
  // Ranked outcome of the last "Analyse All New" run, so a batch ends on a
  // GO / CARE / NO-GO summary instead of whichever analysis happened to run last.
  const [scoutBatchSummary, setScoutBatchSummary] = useState(null);
  const [showScoutTune, setShowScoutTune] = useState(false);
  const [scoutPrefsLoaded, setScoutPrefsLoaded] = useState(false);
  const [scoutRolesText, setScoutRolesText] = useState('');
  const [scoutLocationsText, setScoutLocationsText] = useState('');
  const [scoutIncludeRemote, setScoutIncludeRemote] = useState(true);
  const [scoutIncludeHybrid, setScoutIncludeHybrid] = useState(false);
  const [scoutSources, setScoutSources] = useState(['linkedin', 'reed', 'adzuna']);
  const [scoutSteering, setScoutSteering] = useState('');
  const [scoutExcludedTitles, setScoutExcludedTitles] = useState([]);
  const [scoutSavingPrefs, setScoutSavingPrefs] = useState(false);

  async function handleApplyAnswers() {
    if (!currentTenant?.id || !applyRoleId) { alert('Select a role first.'); return; }
    setAnswersLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'apply_answers', tenantId: currentTenant.id, id: applyRoleId }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Failed');
      setApplyAnswers(data.apply_answers || []);
      setResults((r) => (r && r.id === applyRoleId ? { ...r, apply_answers: data.apply_answers } : r));
      loadUsage();
      loadAnalyses();
    } catch (err) { alert(err.message); } finally { setAnswersLoading(false); }
  }

  async function handleCustomQuestion() {
    if (!currentTenant?.id || !applyRoleId) { alert('Select a role first.'); return; }
    if (!customQ.trim()) return;
    setCustomLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({
          action: 'custom_question',
          tenantId: currentTenant.id,
          id: applyRoleId,
          question: customQ,
          guidance: customGuidance,
        }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Failed to draft answer');
      setApplyAnswers(data.apply_answers || []);
      setResults((r) => (r && r.id === applyRoleId ? { ...r, apply_answers: data.apply_answers } : r));
      setCustomQ('');
      setCustomGuidance('');
      loadUsage();
    } catch (err) { alert(err.message); } finally { setCustomLoading(false); }
  }

  async function handleSaveApplyAnswers(nextAnswers) {
    setApplyAnswers(nextAnswers);
    if (!currentTenant?.id || !applyRoleId) return;
    try {
      await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'save_apply_answers', tenantId: currentTenant.id, id: applyRoleId, apply_answers: nextAnswers }),
      });
    } catch (err) { console.error('Failed to save answers', err); }
  }

  async function handleResearchCompany(roleId, notes = '') {
    const targetId = roleId || applyRoleId || results?.id;
    if (!currentTenant?.id || !targetId) { alert('Select a role first.'); return; }
    setResearchLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'research_company', tenantId: currentTenant.id, id: targetId, user_notes: notes }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Research failed');
      if (targetId === applyRoleId) setCompanyContext(data.company_context || '');
      if (results?.id === targetId) setResults((r) => ({ ...r, company_context: data.company_context }));
      loadUsage();
    } catch (err) { alert(err.message); } finally { setResearchLoading(false); }
  }

  async function handleSaveCompanyContext(roleId, text) {
    const targetId = roleId || applyRoleId || results?.id;
    if (!currentTenant?.id || !targetId) return;
    setContextSaving(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'save_company_context', tenantId: currentTenant.id, id: targetId, company_context: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      if (targetId === applyRoleId) setCompanyContext(data.company_context || '');
      if (results?.id === targetId) setResults((r) => ({ ...r, company_context: data.company_context }));
    } catch (err) { alert(err.message); } finally { setContextSaving(false); }
  }

  async function handleInterviewBrief(roleId) {
    const targetId = roleId || applyRoleId || results?.id;
    if (!currentTenant?.id || !targetId) { alert('Select a role first.'); return; }
    setBriefLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'interview_brief', tenantId: currentTenant.id, id: targetId }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Failed to generate interview brief');
      if (targetId === applyRoleId) setInterviewBrief(data.interview_brief || '');
      if (results?.id === targetId) setResults((r) => ({ ...r, interview_brief: data.interview_brief }));
      loadUsage();
    } catch (err) { alert(err.message); } finally { setBriefLoading(false); }
  }

  // One active role dossier (D-SITE-088): when the selected role changes, load
  // the full saved analysis — verdict, CV, context, cover letter, answers and
  // brief — so Pipeline and Apply Assist show the same dossier state.
  useEffect(() => {
    setCoverLetter('');
    setApplyAnswers([]);
    setCompanyContext('');
    setInterviewBrief('');
    if (!applyRoleId) { setResults(null); return; }
    if (!currentTenant?.id) return;
    (async () => {
      try {
        const res = await fetch('/api/stea/career', {
          method: 'POST', headers: await apiHeaders(),
          body: JSON.stringify({ action: 'get_analysis', tenantId: currentTenant.id, id: applyRoleId }),
        });
        const data = await res.json();
        if (res.ok) {
          setResults({
            id: data.id,
            jd_data: data.jd_data,
            evaluation: data.evaluation,
            score: data.score,
            status: data.status,
            tailored_cv: data.tailored_cv,
            company_context: data.company_context,
            interview_brief: data.interview_brief,
            cover_letter: data.cover_letter,
            apply_answers: data.apply_answers,
            company: data.company,
            role: data.role,
          });
          if (data.cover_letter) setCoverLetter(data.cover_letter);
          if (Array.isArray(data.apply_answers)) setApplyAnswers(data.apply_answers);
          if (data.company_context) setCompanyContext(data.company_context);
          if (data.interview_brief) setInterviewBrief(data.interview_brief);
          if (pendingScrollRef.current) {
            const stage = pendingScrollRef.current;
            pendingScrollRef.current = null;
            // Let React commit the dossier to the DOM before scrolling to it.
            setTimeout(() => scrollToDossier(stage), 120);
          }
        }
      } catch {}
    })();
  }, [applyRoleId, currentTenant]);

  // Open Apply Assist for a specific role (from the pipeline button).
  function openApplyAssist(roleId) {
    setApplyRoleId(roleId || '');
    setActiveTab('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Record where a role is up to (free). Drives the dossier tracker's
  // "Submitted" stage and the pipeline status column.
  const [statusSaving, setStatusSaving] = useState(false);
  async function handleSetStatus(id, status) {
    if (!currentTenant?.id || !id) return;
    setStatusSaving(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: await apiHeaders(),
        body: JSON.stringify({ action: 'set_status', tenantId: currentTenant.id, id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      setResults((r) => (r && r.id === id ? { ...r, status } : r));
      loadAnalyses();
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusSaving(false);
    }
  }

  // Scroll to a dossier stage section (tracker nodes are jump links).
  function jumpToStage(stageId) {
    const el = typeof document !== 'undefined' ? document.getElementById(`dossier-${stageId}`) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Returns true if a response was the usage limit (402); shows the paywall.
  function handleLimit(res, data) {
    if (res.status === 402 || data?.limit_reached) {
      if (data?.usage) setUsage((u) => ({ ...(u || {}), ...data.usage }));
      setShowPaywall(true);
      return true;
    }
    return false;
  }

  // Scroll to the dossier tracker, or a specific stage section within it.
  function scrollToDossier(stage = 'top') {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(stage === 'top' ? 'dossier-top' : `dossier-${stage}`)
      || document.getElementById('dossier-top');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Re-open a saved analysis: select it as the active dossier (the applyRoleId
  // effect loads the full saved analysis, including apply-pack artefacts) and
  // land on the tracker — or a specific stage — not the top of the page.
  function openAnalysis(id, stage = 'top') {
    if (!currentTenant?.id || !id) return;
    setActiveTab('pipeline');
    if (applyRoleId === id) {
      scrollToDossier(stage);
    } else {
      pendingScrollRef.current = stage; // dossier not loaded yet — scroll after it renders
      setApplyRoleId(id);
    }
  }

  async function checkConfig() {
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'get_config', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      setConfigStatus({ loading: false, has_config: data.has_config });
      
      if (data.profile_obj) setProfileData(data.profile_obj);
      if (data.evidence_obj) setAnchorsData(data.evidence_obj);
      if (data.weights_obj) setWeightsData(data.weights_obj);

      // Prefill the job-search form from the profile (once, if untouched).
      const p = data.profile_obj;
      if (p && !searchPrefilled) {
        const firstRole = Array.isArray(p.target_roles) ? p.target_roles[0] : (p.current_role || '');
        if (firstRole) setSearchKeywords(firstRole);
        if (p.location) setSearchLocation(String(p.location).split(',')[0].trim());
        // Deliberately do NOT prefill salary — a salary floor makes Reed/Adzuna
        // exclude all jobs that don't list a salary (most of them).
        setSearchPrefilled(true);
      }
    } catch (err) {
      console.error('Failed to check config', err);
      setConfigStatus({ loading: false, has_config: false });
    }
  }

  async function handleSaveConfig() {
    if (!currentTenant?.id) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ 
          action: 'save_config', 
          tenantId: currentTenant.id,
          profile_obj: profileData,
          evidence_obj: anchorsData,
          weights_obj: weightsData
        }),
      });
      if (res.ok) {
        alert('Configuration saved successfully.');
        checkConfig();
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const addAnchor = () => {
    setAnchorsData([...anchorsData, { company: '', period: '', bullets: [''] }]);
  };

  const deleteAnchor = (index) => {
    setAnchorsData(anchorsData.filter((_, i) => i !== index));
  };

  const updateAnchor = (index, updated) => {
    const newData = [...anchorsData];
    newData[index] = updated;
    setAnchorsData(newData);
  };

  const tabs = [
    { id: 'pipeline', label: 'Pipeline', num: '01' },
    { id: 'scans', label: 'Live Scans', num: '02' },
    { id: 'cvs', label: 'CV Tailoring', num: '03' },
    { id: 'apply', label: 'Apply Assist', num: '04' },
    { id: 'settings', label: 'Config', num: '05' },
  ];

  async function handleAnalyse(overrideText, overrideUrl = '') {
    const input = (typeof overrideText === 'string' ? overrideText : jdText).trim();
    if (!input || !currentTenant?.id) return null;
    setLoading(true);
    setResults(null);
    setEditingContext(false);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'analyse', jd_text: input, url: overrideUrl || undefined, tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return null;
      if (!res.ok) throw new Error(data.error || 'Analyse failed');
      setResults(data);
      if (data.id) setApplyRoleId(data.id); // make it the active dossier
      loadAnalyses(); // refresh the pipeline with the newly-saved role
      loadUsage();
      return data;
    } catch (err) {
      console.error(err);
      alert(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  // Normalise a LinkedIn / ATS job URL or company+title for deduplication against pipeline.
  function extractJobId(url = '') {
    const m = String(url).match(/\/jobs\/view\/(\d+)/) || String(url).match(/currentJobId=(\d+)/);
    return m ? `li:${m[1]}` : String(url).split('?')[0].replace(/\/+$/, '').toLowerCase();
  }

  function findExistingInPipeline(job) {
    if (!job || !Array.isArray(pipeline)) return null;
    const jobKey = job.url ? extractJobId(job.url) : '';
    const normTitle = String(job.title || '').toLowerCase().trim();
    const normComp = String(job.company || '').toLowerCase().trim();
    return pipeline.find((p) => {
      if (jobKey && p.source_url && extractJobId(p.source_url) === jobKey) return true;
      if (normTitle && normComp && String(p.role || '').toLowerCase().trim() === normTitle && String(p.company || '').toLowerCase().trim() === normComp) return true;
      return false;
    }) || null;
  }

  function buildCurrentScoutPrefs(override = {}) {
    const roles = scoutRolesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const locations = scoutLocationsText
      .split(',')
      .map((s) => s.replace(/\([^)]*\)/g, '').trim())
      .filter(Boolean);
    return {
      roles,
      locations: locations.length > 0 ? locations : ['United Kingdom'],
      include_remote: scoutIncludeRemote,
      include_hybrid: scoutIncludeHybrid,
      sources: scoutSources.length > 0 ? scoutSources : ['linkedin'],
      steering: scoutSteering.trim(),
      excluded_titles: scoutExcludedTitles,
      ...override,
    };
  }

  function applyScoutPrefsToState(prefs, fallbackProfile) {
    if (prefs && typeof prefs === 'object') {
      if (Array.isArray(prefs.roles) && prefs.roles.length > 0) {
        setScoutRolesText(prefs.roles.join(', '));
      }
      if (Array.isArray(prefs.locations) && prefs.locations.length > 0) {
        setScoutLocationsText(prefs.locations.join(', '));
      }
      setScoutIncludeHybrid(Boolean(prefs.include_hybrid));
      if (prefs.include_remote !== undefined) {
        setScoutIncludeRemote(Boolean(prefs.include_remote));
      }
      if (Array.isArray(prefs.sources) && prefs.sources.length > 0) {
        setScoutSources(prefs.sources);
      }
      if (typeof prefs.steering === 'string') {
        setScoutSteering(prefs.steering);
      }
      if (Array.isArray(prefs.excluded_titles)) {
        setScoutExcludedTitles(prefs.excluded_titles);
      }
      setScoutPrefsLoaded(true);
      return;
    }

    setScoutIncludeHybrid(false);
    // Seed smart defaults from profile when no saved scout prefs exist yet.
    const p = fallbackProfile || profileData || {};
    const toArr = (v) =>
      Array.isArray(v)
        ? v.map((s) => String(s || '').trim()).filter(Boolean)
        : typeof v === 'string'
        ? v.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    const rawRoles = [
      p.current_role || '',
      ...toArr(p.target_roles),
      ...toArr(p.stretch_roles),
    ].map((s) => String(s || '').trim()).filter(Boolean);

    const hasPm = rawRoles.some((r) => /product manager/i.test(r));
    const seededRoles = hasPm
      ? [
          ...new Set([
            'Senior Product Manager',
            'Principal Product Manager',
            'Lead Product Manager',
            'Founding Product Manager',
            'Senior Digital Product Manager',
            ...rawRoles.filter((r) => !/^product manager$/i.test(r)),
          ]),
        ]
      : [...new Set(rawRoles)];

    if (seededRoles.length > 0) {
      setScoutRolesText(seededRoles.slice(0, 6).join(', '));
    }

    const cleanLoc = String(p.location || '')
      .replace(/\([^)]*\)/g, '')
      .split(',')[0]
      .trim();
    if (cleanLoc) {
      setScoutLocationsText(
        /nottingham/i.test(cleanLoc) ? 'Nottingham, London' : cleanLoc
      );
    } else {
      setScoutLocationsText('Nottingham, London');
    }

    if (hasPm && !scoutSteering) {
      setScoutSteering(
        'Senior, Lead, Principal, Founding or Head-level Product roles only; skip Product Marketing, Solutions Architect, and mid-level Product Owner roles.'
      );
    }
    setScoutPrefsLoaded(true);
  }

  async function persistScoutJobs(next, nextPrefs) {
    setScoutJobs(next);
    if (!currentTenant?.id) return;
    try {
      await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({
          action: 'save_scout_queue',
          tenantId: currentTenant.id,
          jobs: next,
          ...(nextPrefs ? { prefs: nextPrefs } : {}),
        }),
      });
    } catch {}
  }

  async function handleSaveScoutPrefs(override) {
    if (!currentTenant?.id) return;
    const prefs = buildCurrentScoutPrefs(override);
    setScoutSavingPrefs(true);
    try {
      await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({
          action: 'save_scout_prefs',
          tenantId: currentTenant.id,
          prefs,
        }),
      });
    } catch {} finally {
      setScoutSavingPrefs(false);
    }
  }

  async function handleNotLikeThis(job, idx) {
    const dismissedTitle = String(job?.title || '').trim();
    const nextExcluded = dismissedTitle && !scoutExcludedTitles.includes(dismissedTitle)
      ? [...scoutExcludedTitles, dismissedTitle]
      : scoutExcludedTitles;
    setScoutExcludedTitles(nextExcluded);
    const nextJobs = scoutJobs.filter(
      (j, i) => i !== idx && String(j?.title || '').toLowerCase().trim() !== dismissedTitle.toLowerCase()
    );
    const prefs = buildCurrentScoutPrefs({ excluded_titles: nextExcluded });
    await persistScoutJobs(nextJobs, prefs);
  }

  function removeExcludedTitle(titleToRemove) {
    const nextExcluded = scoutExcludedTitles.filter((t) => t !== titleToRemove);
    setScoutExcludedTitles(nextExcluded);
    handleSaveScoutPrefs({ excluded_titles: nextExcluded });
  }

  function toggleScoutSource(src) {
    setScoutSources((prev) => {
      const exists = prev.includes(src);
      const next = exists ? prev.filter((s) => s !== src) : [...prev, src];
      return next.length > 0 ? next : ['linkedin'];
    });
  }

  async function loadScoutQueue() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'get_scout_queue', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.jobs)) setScoutJobs(data.jobs);
        if (data.last_run_at) setScoutLastRunAt(data.last_run_at);
        if (data.prefs) {
          applyScoutPrefsToState(data.prefs, profileData);
        } else {
          applyScoutPrefsToState(null, profileData);
        }
      }
    } catch {}
  }

  async function handleRunMorningScout() {
    if (!currentTenant?.id) return;
    setScoutRunning(true);
    try {
      const prefs = buildCurrentScoutPrefs();
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({
          action: 'morning_scout',
          tenantId: currentTenant.id,
          linkedin_url: scoutUrl.trim(),
          prefs,
          replace_queue: true,
        }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Morning Scout failed');
      setScoutJobs(Array.isArray(data.jobs) ? data.jobs : []);
      if (data.prefs) applyScoutPrefsToState(data.prefs, profileData);
      if (data.last_run_at) setScoutLastRunAt(data.last_run_at);
      setScoutUrl('');
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setScoutRunning(false);
    }
  }

  useEffect(() => {
    if (!currentTenant?.id) return;
    loadScoutQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id]);

  // Seed default honing fields once profileData arrives if no saved prefs were loaded.
  useEffect(() => {
    if (profileData && !scoutRolesText && !scoutPrefsLoaded) {
      applyScoutPrefsToState(null, profileData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData]);

  async function handleAnalyseScoutJob(job) {
    if (!job) return;
    setActiveTab('pipeline');
    const payload = job.jd_text
      ? `Role: ${job.title || ''}\nCompany: ${job.company || ''}\nLocation: ${job.location || ''}\nSource URL: ${job.url || ''}\n\n${job.jd_text}`
      : job.url;
    setJdText(payload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await handleAnalyse(payload, job.url || '');
  }

  async function handleAnalyseAllScoutJobs() {
    const unanalysed = scoutJobs.filter((j) => !findExistingInPipeline(j));
    if (unanalysed.length === 0) return;
    setScoutBatchRunning(true);
    setScoutBatchSummary(null);
    setActiveTab('pipeline');
    const outcomes = [];
    try {
      for (let i = 0; i < unanalysed.length; i++) {
        const job = unanalysed[i];
        setScoutProgress(`Scoring ${i + 1} of ${unanalysed.length}: ${job.title} @ ${job.company}…`);
        const payload = job.jd_text
          ? `Role: ${job.title || ''}\nCompany: ${job.company || ''}\nLocation: ${job.location || ''}\nSource URL: ${job.url || ''}\n\n${job.jd_text}`
          : job.url;
        const res = await handleAnalyse(payload, job.url || '');
        if (!res) break; // stopped by limit or error
        outcomes.push({
          id: res.id,
          title: res.jd_data?.role_title || job.title || 'Role',
          company: res.jd_data?.company || job.company || '',
          score: typeof res.score === 'number' ? res.score : null,
        });
      }
    } finally {
      setScoutBatchRunning(false);
      setScoutProgress('');
      if (outcomes.length > 0) {
        setScoutBatchSummary(outcomes.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1)));
      }
      loadAnalyses();
    }
  }

  // Search live job boards via the API, defaulting from the saved profile.
  async function handleSearchJobs() {
    if (!currentTenant?.id) return;
    setSearching(true);
    setSearchResults([]);
    const keywords = searchKeywords.trim() || (Array.isArray(profileData?.target_roles) ? profileData.target_roles[0] : '') || profileData?.current_role || '';
    const location = searchLocation.trim();
    // Only send salary if the user explicitly typed one — a floor excludes all
    // jobs with no listed salary, which is most of them.
    const salary_min = searchSalary ? Number(searchSalary) : undefined;
    const exclude_employer = excludeCurrentEmployer ? currentEmployer : '';
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: await apiHeaders(),
        body: JSON.stringify({ action: 'search_jobs', tenantId: currentTenant.id, keywords, location, salary_min, exclude_employer, mode: searchMode }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchResults(data.jobs || []);
      setSearchTotalRaw(data.total_raw || (data.jobs || []).length);
      setSearchDebug(data.debug || null);
      if (Array.isArray(data.excluded_terms)) setExcludedTerms(data.excluded_terms);
      loadUsage();
      if ((data.jobs || []).length === 0) alert('No relevant roles found. Try broader keywords or a different location.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSearching(false);
    }
  }

  // Analyse a role found in search: feed its URL to the analyse pipeline.
  function analyseFromSearch(job) {
    if (!job?.url) { alert('This listing has no link to analyse. Open it and paste the description instead.'); return; }
    setActiveTab('pipeline');
    setJdText(job.url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleAnalyse(job.url);
  }

  if (tenantLoading || configStatus.loading) {
    return <div className="p-10 text-center text-[#1c1c1a]/60 font-medium">Initialising Career Ops...</div>;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Tab navigation + usage meter */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        <nav className="flex flex-1 flex-wrap border border-[#1c1c1a] bg-[#f6f7f8]">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors ${i ? 'border-l border-[#1c1c1a]/25' : ''} ${
                activeTab === tab.id
                  ? 'bg-[#1c1c1a] text-[#f6f7f8]'
                  : 'text-[#1c1c1a]/60 hover:bg-[#e9ebee] hover:text-[#1c1c1a]'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-[#f0452f]' : 'text-[#1c1c1a]/35'}>/{tab.num}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        {usage && !usage.unlimited && (
          <button onClick={() => setShowPaywall(true)} title="Analyses, CV tailoring and searches each use one action"
            className={`shrink-0 border px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
              usage.remaining <= 0 ? 'border-[#f0452f] bg-[#f0452f] text-white' :
              usage.remaining <= 3 ? 'border-[#f0452f] text-[#f0452f]' :
              'border-[#1c1c1a] text-[#1c1c1a] hover:bg-[#1c1c1a] hover:text-[#f6f7f8]'}`}>
            /Actions {usage.remaining > 0 ? String(usage.remaining).padStart(2, '0') : '00 — buy a coffee ☕'}
          </button>
        )}
        {usage?.unlimited && (
          <span className="shrink-0 border border-[#1c1c1a]/30 px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#1c1c1a]/50">/Actions ∞</span>
        )}
        <button onClick={() => setShowOnboarding(true)} title="How it works"
          className="shrink-0 border border-[#1c1c1a] px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#1c1c1a] transition-colors hover:bg-[#1c1c1a] hover:text-[#f6f7f8]">
          ?
        </button>
      </div>

      {/* Privacy reassurance (home / pipeline tab) */}
      {activeTab === 'pipeline' && (
        <p className="-mt-4 text-[11px] text-[#1c1c1a]/45 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-[#f0452f]">lock</span>
          Private to your Arcturus DC workspace · we never sell your data or use it for marketing · shared only with the AI and job boards that run your search ·{' '}
          <button onClick={() => setShowOnboarding(true)} className="underline hover:text-[#1c1c1a]/70">how it works</button>
        </p>
      )}

      {/* Onboarding Alert */}
      {!configStatus.has_config && activeTab !== 'settings' && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-none p-6 flex justify-between items-center">
          <div>
            <div className="font-bold text-[#9A3412] text-sm tracking-tight">Workspace Setup Required</div>
            <p className="text-[#C2410C] text-sm mt-1 opacity-90">Please configure your PM profile and evidence library before running diagnostics.</p>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="bg-[#EA580C] text-white px-5 py-2 rounded-none text-sm font-bold hover:bg-[#C2410C] transition-all"
          >
            Go to Config
          </button>
        </div>
      )}

      {/* Morning Scout Agent — Pipeline & Live Scans tabs */}
      {(activeTab === 'pipeline' || activeTab === 'scans') && (
        <section className="bg-[#ffffff] p-5 sm:p-6 border border-[#1c1c1a] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-[#e9ebee] text-[#f0452f] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">radar</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-[#1c1c1a] text-sm">Morning Scout Agent</h3>
                  {scoutJobs.length > 0 && (
                    <span className="text-[10px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 border border-[#f0452f] text-[#f0452f]">
                      {scoutJobs.filter((j) => !findExistingInPipeline(j)).length} new · {scoutJobs.length} in queue
                    </span>
                  )}
                  {scoutLastRunAt && (
                    <span className="text-[10px] text-[#1c1c1a]/45">
                      Last scouted {new Date(scoutLastRunAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#1c1c1a]/60 mt-0.5">
                  Scouts LinkedIn Jobs, Reed, and Adzuna in the cloud against your honed target roles &amp; locations, skips roles already in your pipeline, and pulls full LinkedIn job descriptions automatically.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] text-[#1c1c1a]/60">
                  <span className="font-bold text-[#1c1c1a]">
                    {scoutSources.map((s) => (s === 'linkedin' ? 'LinkedIn' : s === 'reed' ? 'Reed' : 'Adzuna')).join(' + ')}
                  </span>
                  <span>·</span>
                  <span>{scoutLocationsText || 'United Kingdom'}{scoutIncludeRemote ? ' + UK Remote' : ''}{scoutIncludeHybrid ? ' + Hybrid' : ''}</span>
                  {scoutExcludedTitles.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-700 font-semibold">{scoutExcludedTitles.length} excluded title{scoutExcludedTitles.length === 1 ? '' : 's'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRunMorningScout}
                disabled={scoutRunning || scoutBatchRunning || !configStatus.has_config}
                className={`h-10 px-4 bg-[#1c1c1a] text-white rounded-none text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#f0452f] transition-colors ${(scoutRunning || scoutBatchRunning || !configStatus.has_config) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {scoutRunning ? (
                  <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Scouting LinkedIn + job boards…</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">radar</span>Run Morning Scout (1 action)</>
                )}
              </button>
              <button
                onClick={() => setShowScoutTune((v) => !v)}
                className={`h-10 px-3.5 rounded-none text-xs font-bold border inline-flex items-center gap-1.5 transition-colors ${
                  showScoutTune
                    ? 'bg-[#e9ebee] border-[#1c1c1a]/30 text-[#f0452f]'
                    : 'bg-[#ffffff] border-[#1c1c1a]/25 text-[#1c1c1a] hover:bg-[#f3f4f6]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                {showScoutTune ? 'Hide Tuning' : 'Tune Scout'}
              </button>
              {scoutJobs.filter((j) => !findExistingInPipeline(j)).length > 0 && (
                <button
                  onClick={handleAnalyseAllScoutJobs}
                  disabled={scoutBatchRunning || scoutRunning || loading}
                  className={`h-10 px-4 bg-[#1c1c1a] text-white rounded-none text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#f0452f] transition-colors ${(scoutBatchRunning || scoutRunning || loading) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {scoutBatchRunning ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>{scoutProgress || 'Scoring batch…'}</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">bolt</span>Analyse All New ({scoutJobs.filter((j) => !findExistingInPipeline(j)).length})</>
                  )}
                </button>
              )}
              {scoutJobs.length > 0 && (
                <button
                  onClick={() => persistScoutJobs([])}
                  disabled={scoutBatchRunning || scoutRunning}
                  className="h-10 px-3 border border-[#1c1c1a]/25 rounded-none text-xs font-bold text-[#1c1c1a]/60 hover:bg-[#f3f4f6]"
                >
                  Clear queue
                </button>
              )}
            </div>
          </div>

          {showScoutTune && (
            <div className="rounded-none bg-[#f3f4f6]/90 border border-[#1c1c1a]/25 p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-[#1c1c1a] uppercase tracking-wider">Hone &amp; Refine Scout</h4>
                  <p className="text-[11px] text-[#1c1c1a]/60 mt-0.5">
                    Tune exact role titles, locations, job sources, and ranker instructions. Clicking <strong className="text-[#1c1c1a]">Run Morning Scout</strong> applies and saves these settings automatically.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveScoutPrefs()}
                  disabled={scoutSavingPrefs}
                  className="h-8 px-3 rounded-none bg-[#ffffff] border border-[#1c1c1a]/25 text-[11px] font-bold text-[#1c1c1a] hover:bg-[#e9ebee]"
                >
                  {scoutSavingPrefs ? 'Saving…' : 'Save Tuning'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1c1c1a]/60 mb-1">
                    Target Role Titles (comma-separated)
                  </label>
                  <input
                    value={scoutRolesText}
                    onChange={(e) => setScoutRolesText(e.target.value)}
                    placeholder="Senior Product Manager, Principal Product Manager, Lead Product Manager, Founding Product Manager"
                    className="w-full bg-[#ffffff] border border-[#1c1c1a]/25 rounded-none px-3 py-2 text-xs text-[#1c1c1a]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1c1c1a]/60 mb-1">
                    Locations (comma-separated, e.g. Nottingham, London)
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={scoutLocationsText}
                      onChange={(e) => setScoutLocationsText(e.target.value)}
                      placeholder="Nottingham, London"
                      className="flex-1 min-w-0 basis-48 bg-[#ffffff] border border-[#1c1c1a]/25 rounded-none px-3 py-2 text-xs text-[#1c1c1a]"
                    />
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-none bg-[#ffffff] border border-[#1c1c1a]/25 text-xs font-semibold text-[#1c1c1a] cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={scoutIncludeRemote}
                        onChange={(e) => setScoutIncludeRemote(e.target.checked)}
                        className="rounded border-[#1c1c1a]/30 text-[#f0452f]"
                      />
                      + UK Remote
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-none bg-[#ffffff] border border-[#1c1c1a]/25 text-xs font-semibold text-[#1c1c1a] cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={scoutIncludeHybrid}
                        onChange={(e) => setScoutIncludeHybrid(e.target.checked)}
                        className="rounded border-[#1c1c1a]/30 text-[#f0452f]"
                      />
                      + Hybrid
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1c1c1a]/60 mb-1">
                    Job Sources
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'linkedin', label: 'LinkedIn Jobs' },
                      { id: 'reed', label: 'Reed' },
                      { id: 'adzuna', label: 'Adzuna' },
                    ].map((src) => {
                      const active = scoutSources.includes(src.id);
                      return (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => toggleScoutSource(src.id)}
                          className={`px-2.5 py-1.5 rounded-none text-xs font-bold border transition-colors ${
                            active
                              ? 'bg-[#1c1c1a] text-white border-[#1c1c1a]'
                              : 'bg-[#ffffff] text-[#1c1c1a]/60 border-[#1c1c1a]/25 hover:bg-[#e9ebee]'
                          }`}
                        >
                          {active ? '✓ ' : ''}{src.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1c1c1a]/60 mb-1">
                    Steering / Refinement Rules (tells the AI ranker what to boost or skip)
                  </label>
                  <input
                    value={scoutSteering}
                    onChange={(e) => setScoutSteering(e.target.value)}
                    placeholder="e.g. Senior, Lead, Principal or Founding PM roles only; prioritise regulated, fintech, energy, platform & AI; skip Product Marketing & Solutions Architect"
                    className="w-full bg-[#ffffff] border border-[#1c1c1a]/25 rounded-none px-3 py-2 text-xs text-[#1c1c1a]"
                  />
                </div>
              </div>

              {scoutExcludedTitles.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1c1c1a]/60 mb-1">
                    Excluded Role Titles (dismissed via &ldquo;Not like this&rdquo;)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {scoutExcludedTitles.map((title) => (
                      <span
                        key={title}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ffffff] border border-[#1c1c1a]/25 text-[11px] font-medium text-[#1c1c1a]/70"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => removeExcludedTitle(title)}
                          className="text-[#1c1c1a]/45 hover:text-red-500 font-bold"
                          title="Stop excluding this title"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={scoutUrl}
              onChange={(e) => setScoutUrl(e.target.value)}
              placeholder="Optional: paste a LinkedIn Jobs search URL or specific LinkedIn role URL to include in this scout run…"
              className="flex-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none px-3.5 py-2 text-xs text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]"
            />
          </div>

          {scoutJobs.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#1c1c1a]/10 max-h-96 overflow-y-auto">
              {scoutJobs.map((job, idx) => {
                const existing = findExistingInPipeline(job);
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-none bg-[#f3f4f6] border border-[#1c1c1a]/25/80">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {job.source && (
                          <span className={`shrink-0 text-[9px] font-bold font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                            job.source === 'LinkedIn'
                              ? 'bg-[#1c1c1a] border-[#1c1c1a] text-[#f6f7f8]'
                              : 'bg-[#ffffff] border-[#1c1c1a]/25 text-[#1c1c1a]/70'
                          }`}>
                            {job.source}
                          </span>
                        )}
                        <p className="font-bold text-[#1c1c1a] text-sm truncate">{job.title}</p>
                        {typeof job.relevance === 'number' && (
                          <span className={`shrink-0 text-[10px] font-mono font-bold ${job.relevance >= 75 ? 'text-[#2f9d55]' : 'text-[#1c1c1a]/60'}`}>
                            {job.relevance}%{job.why ? ` · ${job.why}` : ''}
                          </span>
                        )}
                        {existing && (
                          <span className="shrink-0 text-[10px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 bg-[#dfe2e6] text-[#1c1c1a]/70">
                            In Pipeline{typeof existing.score === 'number' ? ` (${existing.score.toFixed(1)})` : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#1c1c1a]/60 truncate mt-0.5">
                        {job.company}{job.location ? ` · ${job.location}` : ''}{job.salary ? ` · ${job.salary}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#1c1c1a]/45 hover:underline">
                          Link
                        </a>
                      )}
                      {existing ? (
                        <button
                          onClick={() => openAnalysis(existing.id)}
                          className="h-8 px-3 rounded-none bg-[#ffffff] border border-[#1c1c1a]/25 text-[11px] font-bold text-[#1c1c1a] hover:bg-[#e9ebee]"
                        >
                          Open
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAnalyseScoutJob(job)}
                          disabled={loading || scoutBatchRunning || scoutRunning}
                          className="h-8 px-3 rounded-none bg-[#1c1c1a] text-white text-[11px] font-bold hover:bg-[#f0452f] disabled:opacity-50"
                        >
                          Analyse
                        </button>
                      )}
                      <button
                        onClick={() => handleNotLikeThis(job, idx)}
                        title="Remove and exclude this role title from future scout runs"
                        className="h-8 px-2.5 rounded-none bg-[#ffffff] border border-[#1c1c1a]/25 text-[10px] font-bold text-[#1c1c1a]/60 hover:text-amber-800 hover:border-amber-200 hover:bg-amber-50"
                      >
                        Not like this
                      </button>
                      <button
                        onClick={() => persistScoutJobs(scoutJobs.filter((_, j) => j !== idx))}
                        title="Remove from queue"
                        className="text-[#1c1c1a]/45 hover:text-red-500 p-1"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Role Input Terminal — Pipeline tab only */}
      {activeTab === 'pipeline' && (
      <section className="bg-[#ffffff] p-5 sm:p-8 border border-[#1c1c1a]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-[0.16em] text-[10px] font-bold text-[#f0452f]">/Input terminal</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full h-32 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-5 font-mono text-sm focus:ring-0 focus:border-[#1c1c1a] placeholder:text-[#1c1c1a]/30 resize-none"
              placeholder="Paste Job Description text or a LinkedIn URL to begin high-precision AI analysis..."
              disabled={!configStatus.has_config}
            />
            <button
              onClick={handleAnalyse}
              disabled={loading || !configStatus.has_config}
              className={`min-w-[180px] h-14 bg-[#1c1c1a] text-white rounded-none font-bold flex items-center justify-center gap-3 hover:bg-[#f0452f] transition-all group ${(!configStatus.has_config || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Analysing…
                </>
              ) : (
                <>
                  Analyse Role
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#1c1c1a] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1c1c1a] animate-pulse"></span>
                  {ANALYSE_STAGES[progressStage]}
                </span>
                <span className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest">
                  Step {progressStage + 1} / {ANALYSE_STAGES.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#1c1c1a]/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f0452f] to-[#ff8a73] transition-all duration-700 ease-out"
                  style={{ width: `${((progressStage + 1) / ANALYSE_STAGES.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-[#1c1c1a]/45 mt-1.5">This usually takes 15–30 seconds. The AI is reading the role and scoring it against your profile.</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Ranked summary of the last scout batch — lands the user on an overview
          instead of whichever analysis happened to run last. */}
      {activeTab === 'pipeline' && scoutBatchSummary && !scoutBatchRunning && (
        <section className="border border-[#1c1c1a] bg-[#e9ebee]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1c1c1a]/20 px-5 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#f0452f]">/Scout batch scored</p>
              <h3 className="mt-1 text-xl font-black tracking-tight">
                {scoutBatchSummary.filter((o) => (o.score ?? 0) >= 4).length} go
                <span className="text-[#1c1c1a]/40"> · </span>
                {scoutBatchSummary.filter((o) => (o.score ?? 0) >= 3 && o.score < 4).length} with care
                <span className="text-[#1c1c1a]/40"> · </span>
                {scoutBatchSummary.filter((o) => (o.score ?? 5) < 3).length} no-go
                <span className="text-[#f0452f]">.</span>
              </h3>
            </div>
            <button
              onClick={() => setScoutBatchSummary(null)}
              className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1c1c1a]/50 hover:text-[#f0452f]"
            >
              Dismiss ×
            </button>
          </div>
          <div className="divide-y divide-[#1c1c1a]/10">
            {scoutBatchSummary.map((o) => {
              const verdict = (o.score ?? 0) >= 4 ? { t: 'GO', c: '#2f9d55' } : (o.score ?? 0) >= 3 ? { t: 'CARE', c: '#b45309' } : { t: 'NO-GO', c: '#f0452f' };
              return (
                <button
                  key={o.id}
                  onClick={() => openAnalysis(o.id)}
                  className="group flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-[#1c1c1a] hover:text-[#f6f7f8] sm:px-6"
                >
                  <span className="min-w-0 truncate text-sm font-bold">
                    {o.title}
                    <span className="opacity-50"> · {o.company}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em]">
                    {typeof o.score === 'number' && <span>{o.score.toFixed(1)}</span>}
                    <span style={{ color: verdict.c }}>{verdict.t}</span>
                    <span className="opacity-40 transition-colors group-hover:text-[#f0452f] group-hover:opacity-100">Open →</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Role Dossier — the active role's journey from analysis to submission.
          Rendered on Pipeline and Apply Assist (same dossier, one source of truth). */}
      {(activeTab === 'pipeline' || activeTab === 'apply') && results && (
        <DossierTracker
          role={results}
          onJump={jumpToStage}
          onSetStatus={(s) => handleSetStatus(results.id, s)}
          statusSaving={statusSaving}
        />
      )}

      {/* Analysis Results View — the dossier body */}
      {(activeTab === 'pipeline' || activeTab === 'apply') && results && (
        <>
        <div id="dossier-verdict" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 bg-[#ffffff] p-5 sm:p-8 border border-[#1c1c1a] flex flex-col">
            {/* The verdict (reasoning-led) is the primary signal. */}
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#1c1c1a]/45 mb-3">/01 · The verdict</h3>
            <VerdictPanel score={results.score} evaluation={results.evaluation} />

            {/* Secondary: the rough numeric estimate, clearly framed as such. */}
            <div className="mt-5 pt-5 border-t border-[#1c1c1a]/10">
              <FitGauge score={typeof results.score === 'number' ? results.score : 0} />
            </div>

            <div className="mt-4 p-4 rounded-none bg-red-50 border border-red-100 flex gap-3">
              <span className="text-red-500 font-bold">!</span>
              <div>
                <h4 className="text-xs font-bold text-red-900">Watch-out</h4>
                <p className="text-[11px] text-red-700/80 mt-1 leading-relaxed">
                  {results.evaluation?.match(/Risk Signal:(.*)/i)?.[1] || 'Check the gaps in the reasoning before applying.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#f3f4f6] p-5 sm:p-8 border border-[#1c1c1a] flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-black text-[#1c1c1a] tracking-tight">The reasoning<span className="text-[#f0452f]">.</span></h3>
              <div className="px-3 py-1 bg-[#1c1c1a] text-[#f6f7f8] text-[10px] font-bold font-mono uppercase tracking-widest" title="An AI's structured opinion — the strength is in the reasoning, not the precision of the number.">AI assessment</div>
            </div>
            <p className="text-xs text-[#1c1c1a]/45 mb-5">This is where the real value is — the why behind the score. The number above is just a quick triage signal.</p>
            <CollapsibleNarrative markdown={results.evaluation} openCount={2} />
          </div>
        </div>

        {/* Dossier stages 02–05: research, tailored CV, apply pack, interview brief */}
        {results.id && (
              <div className="space-y-6">
                {/* 1. Company & role context */}
                <div id="dossier-research" className="bg-[#ffffff] p-5 sm:p-6 border border-[#1c1c1a] scroll-mt-24">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-[#1c1c1a] text-sm flex items-center gap-2">
                        <span className="font-mono text-base text-[#f0452f]">/02</span>
                        Company &amp; Role Context
                      </h4>
                      <p className="text-[11px] text-[#1c1c1a]/60 mt-0.5">
                        Research the employer or add your own notes (hiring manager, strategy, platform). Automatically feeds into CV tailoring, cover letters, and interview prep.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {results.company_context && (
                        <button
                          onClick={() => setEditingContext((e) => !e)}
                          className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#1c1c1a]/60 hover:underline"
                        >
                          {editingContext ? 'Done editing' : 'Edit notes'}
                        </button>
                      )}
                      <button
                        onClick={() => handleResearchCompany(results.id, results.company_context || companyNotes)}
                        disabled={researchLoading}
                        className={`h-9 px-4 bg-[#1c1c1a] text-white rounded-none text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#f0452f] transition-colors ${researchLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {researchLoading ? (
                          <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Researching…</>
                        ) : (
                          <><span className="material-symbols-outlined text-sm">travel_explore</span>{results.company_context ? 'Refresh research' : 'Research company'}</>
                        )}
                      </button>
                    </div>
                  </div>
                  {results.company_context && !editingContext ? (
                    <div className="mt-3 pt-3 border-t border-[#1c1c1a]/10">
                      <CollapsibleNarrative markdown={results.company_context} openCount={3} />
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea
                        value={results.company_context ?? ''}
                        onChange={(e) => setResults((r) => ({ ...r, company_context: e.target.value }))}
                        placeholder="Add your own notes or click 'Research company' (1 action) to pull live employer context…"
                        rows={results.company_context ? 6 : 2}
                        className="w-full bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-xs text-[#1c1c1a]/80 leading-relaxed focus:ring-0 focus:border-[#1c1c1a]"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={async () => {
                            await handleSaveCompanyContext(results.id, results.company_context || '');
                            setEditingContext(false);
                          }}
                          disabled={contextSaving}
                          className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#f0452f] hover:underline"
                        >
                          {contextSaving ? 'Saving…' : 'Save context notes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Tailored CV */}
                <div id="dossier-cv" className="bg-[#ffffff] p-5 sm:p-6 border border-[#1c1c1a] scroll-mt-24">
                {!results.tailored_cv ? (
                  <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#1c1c1a] text-sm"><span className="font-mono text-[#f0452f]">/03</span> Decided to apply for this role?</p>
                      <p className="text-xs text-[#1c1c1a]/60 mt-0.5">Generate a CV tailored to this job, grounded in your real evidence. It's saved to your CV library.</p>
                    </div>
                    <button
                      onClick={() => handleTailorCv(results.id)}
                      disabled={tailoring}
                      className={`min-w-[190px] h-12 bg-[#1c1c1a] text-white rounded-none font-bold flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-all ${tailoring ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {tailoring ? (
                        <><span className="material-symbols-outlined animate-spin">progress_activity</span>Tailoring CV…</>
                      ) : (
                        <>Tailor CV for this role<span className="material-symbols-outlined">description</span></>
                      )}
                    </button>
                  </div>
                  {tailoring && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#1c1c1a] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1c1c1a] animate-pulse"></span>
                          {TAILOR_STAGES[tailorStage]}
                        </span>
                        <span className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest">Step {tailorStage + 1} / {TAILOR_STAGES.length}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1c1c1a]/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#f0452f] to-[#ff8a73] transition-all duration-700 ease-out" style={{ width: `${((tailorStage + 1) / TAILOR_STAGES.length) * 100}%` }}></div>
                      </div>
                      <p className="text-[10px] text-[#1c1c1a]/45 mt-1.5">Writing a CV tailored to this role from your real evidence. Usually 20–40 seconds.</p>
                    </div>
                  )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-[#1c1c1a] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#f0452f]">description</span>
                        Tailored CV
                      </h4>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (cvEditingId === results.id) {
                              setCvEditingId(null);
                            } else {
                              setCvEditingId(results.id);
                              setCvDraftText(results.tailored_cv || '');
                            }
                          }}
                          className="text-[10px] font-bold text-[#1c1c1a]/60 font-mono uppercase tracking-widest hover:underline"
                        >
                          {cvEditingId === results.id ? 'Cancel edit' : 'Edit text'}
                        </button>
                        <button
                          onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: results.jd_data?.role_title || 'Role', cvMarkdown: results.tailored_cv })}
                          className="text-[10px] font-bold text-[#f0452f] font-mono uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>Download PDF
                        </button>
                        <button
                          onClick={() => navigator.clipboard?.writeText(results.tailored_cv)}
                          className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    {cvEditingId === results.id ? (
                      <div className="bg-[#ffffff] rounded-none p-4 border border-[#1c1c1a]/25 space-y-3">
                        <textarea
                          value={cvDraftText}
                          onChange={(e) => setCvDraftText(e.target.value)}
                          rows={16}
                          className="w-full font-mono text-xs text-[#1c1c1a]/80 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 leading-relaxed"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setCvEditingId(null)} className="px-4 py-2 rounded-none text-xs font-bold text-[#1c1c1a]/60 hover:bg-[#e9ebee]">Cancel</button>
                          <button onClick={() => handleSaveTailoredCv(results.id, cvDraftText)} disabled={cvSaving} className="px-4 py-2 rounded-none text-xs font-bold bg-[#1c1c1a] text-white hover:bg-[#f0452f]">
                            {cvSaving ? 'Saving…' : 'Save CV edits'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f3f4f6] border border-[#1c1c1a]/25 p-5 max-h-[34rem] overflow-y-auto">
                        {/* Full CV as one selectable block — copy the whole thing straight from here. */}
                        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[#1c1c1a]/85">{cvPlainText(results.tailored_cv)}</pre>
                      </div>
                    )}
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input
                        value={cvEdit}
                        onChange={(e) => setCvEdit(e.target.value)}
                        placeholder='Suggest a CV revision, e.g. "bring the AI Act / Orbit work higher" or "tighten summary to 3 lines"'
                        className="flex-1 bg-[#ffffff] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]"
                      />
                      <button
                        onClick={() => handleTailorCv(results.id, cvEdit)}
                        disabled={tailoring || !cvEdit.trim()}
                        className={`h-11 px-5 bg-[#1c1c1a] text-white rounded-none font-bold inline-flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-colors ${(tailoring || !cvEdit.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {tailoring ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_fix_high</span>}Revise CV
                      </button>
                    </div>
                    <AiReviewWarning what="CV" />
                    <p className="text-[11px] text-[#1c1c1a]/45 mt-2">
                      Saved to your{' '}
                      <button onClick={() => setActiveTab('cvs')} className="text-[#f0452f] font-bold underline hover:no-underline">CV library</button>.
                    </p>
                  </div>
                )}
                </div>

                {/* 3. Apply pack — cover letter + portal answers for this role */}
                <div id="dossier-pack" className="scroll-mt-24 space-y-6">
                  {/* Cover letter */}
                  <div className="bg-[#ffffff] p-5 sm:p-6 border border-[#1c1c1a]">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#1c1c1a] text-sm flex items-center gap-2"><span className="font-mono text-base text-[#f0452f]">/04</span>Cover letter</h4>
                      {coverLetter && (
                        <div className="flex items-center gap-3">
                          <button onClick={() => navigator.clipboard?.writeText(coverLetter)} className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline">Copy</button>
                          <button onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: results.jd_data?.role_title || 'Cover letter', cvMarkdown: coverLetter })} className="text-[10px] font-bold text-[#f0452f] font-mono uppercase tracking-widest hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span>PDF</button>
                        </div>
                      )}
                    </div>
                    {!coverLetter ? (
                      <div className="py-6 text-center">
                        <p className="text-sm text-[#1c1c1a]/60 mb-4">Generate a cover letter tailored to this role from your CV and evidence. Uses one action.</p>
                        <button onClick={() => handleCoverLetter()} disabled={coverLoading}
                          className={`h-12 px-6 bg-[#1c1c1a] text-white rounded-none font-bold inline-flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-colors ${coverLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                          {coverLoading ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Writing…</>) : (<><span className="material-symbols-outlined">mail</span>Generate cover letter</>)}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className="bg-[#f3f4f6] rounded-none p-5 text-sm text-[#1c1c1a]/80 whitespace-pre-wrap leading-relaxed">{coverLetter}</div>
                        <AiReviewWarning what="cover letter" />
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <input value={coverEdit} onChange={(e) => setCoverEdit(e.target.value)} placeholder='Suggest an edit, e.g. "make it shorter" or "emphasise the 50% metric"'
                            className="flex-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]" />
                          <button onClick={() => handleCoverLetter(coverEdit)} disabled={coverLoading || !coverEdit.trim()}
                            className={`h-11 px-5 bg-[#1c1c1a] text-white rounded-none font-bold inline-flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-colors ${(coverLoading || !coverEdit.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {coverLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_fix_high</span>}Revise
                          </button>
                        </div>
                        <p className="text-[10px] text-[#1c1c1a]/45 mt-2">Each revision uses one action.</p>
                      </div>
                    )}
                  </div>

                  {/* Application form answers */}
                  <div className="bg-[#ffffff] p-5 sm:p-6 border border-[#1c1c1a]">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#1c1c1a] text-sm flex items-center gap-2"><span className="font-mono text-base text-[#f0452f]">/04b</span>Application form answers</h4>
                      {applyAnswers.length > 0 && (
                        <button onClick={handleApplyAnswers} disabled={answersLoading} className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline">Regenerate common answers</button>
                      )}
                    </div>
                    <div className="mt-3 space-y-4">
                      {applyAnswers.length === 0 ? (
                        <div className="py-4 text-center">
                          <p className="text-sm text-[#1c1c1a]/60 mb-3">Draft the 4 standard free-text answers ("why this role / why us / good fit / relevant experience"), or ask a custom portal question below.</p>
                          <button onClick={handleApplyAnswers} disabled={answersLoading}
                            className={`h-11 px-5 bg-[#1c1c1a] text-white rounded-none font-bold inline-flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-colors ${answersLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {answersLoading ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Drafting…</>) : (<><span className="material-symbols-outlined">quiz</span>Draft common answers (1 action)</>)}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {applyAnswers.map((qa, i) => (
                            <div key={i} className="space-y-1">
                              <CopyField
                                label={qa.q}
                                value={qa.a}
                                multiline
                                editable
                                onChange={(v) => {
                                  const next = applyAnswers.map((item, j) => (j === i ? { ...item, a: v } : item));
                                  handleSaveApplyAnswers(next);
                                }}
                              />
                              {qa.custom && (
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => handleSaveApplyAnswers(applyAnswers.filter((_, j) => j !== i))}
                                    className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#1c1c1a]/45 hover:text-red-600"
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

                      {/* Custom portal question box */}
                      <div className="pt-4 border-t border-[#1c1c1a]/10 space-y-2.5">
                        <div className="text-xs font-bold text-[#1c1c1a]">Answer a custom portal question</div>
                        <p className="text-[11px] text-[#1c1c1a]/60">Paste any bespoke question from Workday, Greenhouse, Ashby, or Civil Service Jobs. Grounded strictly in your evidence library.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            value={customQ}
                            onChange={(e) => setCustomQ(e.target.value)}
                            placeholder='e.g. "Describe a complex regulatory or platform delivery you led"'
                            className="sm:col-span-2 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a]"
                          />
                          <input
                            value={customGuidance}
                            onChange={(e) => setCustomGuidance(e.target.value)}
                            placeholder='Optional: "max 200 words, STAR format"'
                            className="bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleCustomQuestion}
                            disabled={customLoading || !customQ.trim()}
                            className={`h-10 px-5 bg-[#1c1c1a] text-white rounded-none text-xs font-bold inline-flex items-center gap-2 hover:bg-[#f0452f] transition-colors ${(customLoading || !customQ.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {customLoading ? (<><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Drafting…</>) : (<><span className="material-symbols-outlined text-sm">edit_square</span>Answer question (1 action)</>)}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#1c1c1a]/45">
                        Need your standard details (address, notice period, employment history)?{' '}
                        <button onClick={() => openApplyAssist(results.id)} className="text-[#f0452f] font-bold underline hover:no-underline">Open Apply Assist</button> for copy-ready fields.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Interview Prep Brief */}
                <div id="dossier-brief" className="bg-[#ffffff] p-5 sm:p-6 border border-[#1c1c1a] scroll-mt-24">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-[#1c1c1a] text-sm flex items-center gap-2">
                        <span className="font-mono text-base text-[#f0452f]">/05</span>
                        Interview Prep Brief
                      </h4>
                      <p className="text-[11px] text-[#1c1c1a]/60 mt-0.5">
                        60-second pitch, top 5 likely questions mapped to your evidence anchors, how to handle flagged gaps, and questions to ask them.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {results.interview_brief && (
                        <>
                          <button
                            onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: `${results.jd_data?.role_title || 'Role'} — Interview Brief`, cvMarkdown: results.interview_brief })}
                            className="text-[10px] font-bold text-[#f0452f] font-mono uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>PDF
                          </button>
                          <button
                            onClick={() => navigator.clipboard?.writeText(results.interview_brief)}
                            className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline"
                          >
                            Copy
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleInterviewBrief(results.id)}
                        disabled={briefLoading}
                        className={`h-9 px-4 bg-[#1c1c1a] text-white rounded-none text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#f0452f] transition-colors ${briefLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {briefLoading ? (
                          <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Preparing…</>
                        ) : (
                          <><span className="material-symbols-outlined text-sm">record_voice_over</span>{results.interview_brief ? 'Regenerate brief' : 'Generate interview brief'}</>
                        )}
                      </button>
                    </div>
                  </div>
                  {results.interview_brief && (
                    <div className="mt-3 bg-[#f3f4f6] rounded-none p-5 border border-[#1c1c1a]/10">
                      <CollapsibleNarrative markdown={results.interview_brief} openCount={4} />
                    </div>
                  )}
                </div>
              </div>
        )}
        </>
      )}

      {/* Pipeline Table */}
      {activeTab === 'pipeline' && (
        <section className="space-y-4">
          <div className="flex items-end justify-between border-b border-[#1c1c1a] pb-3">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#f0452f]">/Active pipeline</p>
              <h3 className="mt-1 text-3xl font-black tracking-tight">Roles<span className="text-[#f0452f]">.</span></h3>
            </div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#1c1c1a]/45">
              {pipeline.length} analysed
            </p>
          </div>
          <div className="border border-[#1c1c1a] bg-[#f3f4f6] overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead className="border-b border-[#1c1c1a]">
                <tr className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[#1c1c1a]/50">
                  <th className="px-4 sm:px-5 py-3 font-bold">/SN</th>
                  <th className="px-4 sm:px-5 py-3 font-bold">Company / Role</th>
                  <th className="px-4 sm:px-5 py-3 font-bold">Fit</th>
                  <th className="px-4 sm:px-5 py-3 font-bold">Dossier</th>
                  <th className="px-4 sm:px-5 py-3 font-bold">Status</th>
                  <th className="px-4 sm:px-5 py-3 font-bold text-right">Next</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1a]/15">
                {pipeline.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#1c1c1a]/45">
                      No roles analysed yet. Run the Morning Scout or paste a job description above to populate your pipeline.
                    </td>
                  </tr>
                )}
                {pipeline.map((item, idx) => {
                  const chips = [
                    { k: 'CV', on: item.has_cv },
                    { k: 'LTR', on: item.has_letter || item.has_answers },
                    { k: 'BRF', on: item.has_brief },
                  ];
                  const submitted = ['Applied', 'Interview', 'Offer'].includes(item.status);
                  const [next, nextStage] = !item.has_cv ? ['Tailor CV', 'cv']
                    : !(item.has_letter || item.has_answers) ? ['Apply pack', 'pack']
                    : !item.has_brief ? ['Interview brief', 'brief']
                    : !submitted ? ['Mark submitted', 'top'] : ['Open', 'top'];
                  return (
                    <tr key={item.id} className="group cursor-pointer transition-colors hover:bg-[#e9ebee]" onClick={() => openAnalysis(item.id)}>
                      <td className="px-4 sm:px-5 py-4 font-mono text-[0.65rem] text-[#1c1c1a]/40">
                        {String(idx + 1).padStart(3, '0')}
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <p className="font-bold text-[#1c1c1a] text-sm">{item.company}</p>
                        <p className="text-xs text-[#1c1c1a]/50">{item.role}</p>
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <span className={`font-mono font-bold ${typeof item.score === 'number' ? (item.score >= 4 ? 'text-[#2f9d55]' : item.score >= 3 ? 'text-[#b45309]' : 'text-[#f0452f]') : 'text-[#1c1c1a]/30'}`}>
                          {typeof item.score === 'number' ? item.score.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <div className="flex gap-1">
                          {chips.map((c) => (
                            <span key={c.k} className={`border px-1.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] ${c.on ? 'border-[#2f9d55] text-[#2f9d55]' : 'border-[#1c1c1a]/20 text-[#1c1c1a]/30'}`}>
                              {c.on ? '✓ ' : ''}{c.k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 sm:px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.1em] ${
                          item.status === 'Interview' || item.status === 'Offer' ? 'text-[#2f9d55]' :
                          item.status === 'Applied' ? 'text-[#1c1c1a]' :
                          item.status === 'Rejected' ? 'text-[#f0452f]' : 'text-[#1c1c1a]/50'
                        }`}>
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            item.status === 'Interview' || item.status === 'Offer' ? 'bg-[#2f9d55]' :
                            item.status === 'Applied' ? 'bg-[#1c1c1a]' :
                            item.status === 'Rejected' ? 'bg-[#f0452f]' : 'bg-[#1c1c1a]/30'
                          }`} aria-hidden="true" />
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-5 py-4 text-right whitespace-nowrap">
                        <button
                          className="border border-[#1c1c1a]/30 px-3 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#1c1c1a] transition-colors group-hover:border-[#1c1c1a] hover:bg-[#1c1c1a] hover:text-[#f6f7f8]"
                          onClick={(e) => { e.stopPropagation(); openAnalysis(item.id, nextStage); }}
                        >
                          {next} →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Scans Tab */}
      {activeTab === 'scans' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#f0452f]">/Find roles</h3>
            <p className="text-sm text-[#1c1c1a]/60 mt-1">Search live UK job boards (LinkedIn + Reed + Adzuna), then analyse any role against your profile.</p>
            <p className="text-xs text-[#1c1c1a]/45 mt-1.5 flex items-start gap-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              Searches LinkedIn Jobs, Reed, and Adzuna in one pass. Found a role on a direct employer career site? Paste its URL or text on the Pipeline tab to score it directly.
            </p>
          </div>

          {/* Search form */}
          <div className="bg-[#ffffff] rounded-none p-6 border border-[#1c1c1a]/25">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Keywords</label>
                <input value={searchKeywords} onChange={(e) => setSearchKeywords(e.target.value)} placeholder="e.g. Product Owner energy billing"
                  className="w-full mt-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Location</label>
                <input value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="e.g. Nottingham"
                  className="w-full mt-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Min salary (£) — optional</label>
                <input type="number" value={searchSalary} onChange={(e) => setSearchSalary(e.target.value)} placeholder="leave blank" step={5000} min={0}
                  className="w-full mt-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]" />
                <p className="text-[10px] text-[#1c1c1a]/45 mt-1 ml-1">Setting this hides jobs with no listed salary (most of them). Leave blank for the widest results.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div className="flex flex-col gap-2">
                <div className="inline-flex rounded-none bg-[#e9ebee] p-0.5 text-xs font-bold self-start">
                  {[['both', 'Local + Remote'], ['location', 'Local only'], ['remote', 'Remote only']].map(([m, label]) => (
                    <button key={m} onClick={() => setSearchMode(m)}
                      className={`px-3 py-1.5 rounded-none transition-colors ${searchMode === m ? 'bg-[#ffffff] text-[#1c1c1a]' : 'text-[#1c1c1a]/60 hover:text-[#1c1c1a]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-[#1c1c1a]/70 cursor-pointer select-none">
                  <input type="checkbox" checked={excludeCurrentEmployer} onChange={(e) => setExcludeCurrentEmployer(e.target.checked)}
                    className="w-4 h-4 text-[#f0452f] border-[#1c1c1a]/30 rounded focus:ring-[#1c1c1a]" />
                  Exclude my current / most recent employer{currentEmployer ? ` (${currentEmployer})` : ''}
                </label>
              </div>
              <button onClick={handleSearchJobs} disabled={searching}
                className={`min-w-[160px] h-12 bg-[#1c1c1a] text-white rounded-none font-bold flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-all ${searching ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {searching ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Searching…</>) : (<><span className="material-symbols-outlined">search</span>Search</>)}
              </button>
            </div>

            {searching && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#1c1c1a] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1c1c1a] animate-pulse"></span>
                    {SEARCH_STAGES[searchStage]}
                  </span>
                  <span className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest">Step {searchStage + 1} / {SEARCH_STAGES.length}</span>
                </div>
                <div className="h-1.5 w-full bg-[#1c1c1a]/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#f0452f] to-[#ff8a73] transition-all duration-700 ease-out" style={{ width: `${((searchStage + 1) / SEARCH_STAGES.length) * 100}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* What's excluded — transparency (read-only) */}
          {excludedTerms.length > 0 && (
            <details className="text-[11px] text-[#1c1c1a]/45">
              <summary className="cursor-pointer list-none hover:text-[#1c1c1a]/70 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Some role types are excluded from results — what's filtered out?
              </summary>
              <p className="mt-2 leading-relaxed">
                To keep results relevant, job titles containing these terms are automatically hidden (they're never product, operations or delivery roles):
              </p>
              <p className="mt-1.5 leading-relaxed text-[#1c1c1a]/60">{excludedTerms.join(' · ')}</p>
            </details>
          )}

          {/* Search debug — "why these results?" thought process */}
          {searchDebug && (
            <details className="bg-[#f3f4f6] rounded-none border border-[#1c1c1a]/25 text-xs">
              <summary className="cursor-pointer px-4 py-3 font-bold text-[#1c1c1a] list-none flex items-center justify-between">
                <span>Why these results? ({searchDebug.ranked_count} of {searchDebug.raw_count} raw)</span>
                <span className="material-symbols-outlined text-[#1c1c1a]/45">expand_more</span>
              </summary>
              <div className="px-4 pb-4 space-y-2 text-[#1c1c1a]/70">
                <div className="font-mono text-[11px] bg-[#ffffff] rounded-none p-3 border border-[#1c1c1a]/10 space-y-0.5">
                  <div>queries: <b>{(searchDebug.query?.terms || []).join(', ')}</b> · loc <b>{searchDebug.query?.location}</b> · mode <b>{searchDebug.query?.mode}</b> · min£ <b>{searchDebug.query?.salary_min}</b></div>
                  <div>sources: {Object.entries(searchDebug.source_counts || {}).map(([s, n]) => `${s}=${n}`).join(' · ') || 'none returned'}</div>
                  <div>funnel: {searchDebug.raw_count} raw → {searchDebug.deduped_count} deduped → {searchDebug.after_negative_filter} after filter → {searchDebug.ranked_count} shown</div>
                  <div>ranker: {searchDebug.ranker}{searchDebug.threshold ? ` (keep ≥ ${searchDebug.threshold})` : ''}</div>
                  {searchDebug.dropped_by_negative_filter?.length > 0 && <div>dropped (wrong discipline): {searchDebug.dropped_by_negative_filter.join(', ')}</div>}
                </div>
                {searchDebug.scores?.length > 0 && (
                  <div className="bg-[#ffffff] rounded-none p-3 border border-[#1c1c1a]/10">
                    <div className="font-bold text-[10px] font-mono uppercase tracking-widest text-[#1c1c1a]/45 mb-1">Relevance scores (all candidates)</div>
                    {searchDebug.scores.map((s, i) => (
                      <div key={i} className="flex justify-between gap-3 py-0.5 border-b border-[#1c1c1a]/10 last:border-0">
                        <span className="truncate">{s.title}</span>
                        <span className="shrink-0 font-mono"><b>{s.score}</b>{s.why ? ` · ${s.why}` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[#1c1c1a]/60">
                {searchResults.length} relevant {searchResults.length === 1 ? 'role' : 'roles'}
                {searchTotalRaw > searchResults.length ? ` (filtered from ${searchTotalRaw}, ranked by relevance to your targets)` : ''}. Click "Analyse" to score one against your profile.
              </p>
              {searchResults.map((job, i) => (
                <div key={i} className="bg-[#ffffff] rounded-none border border-[#1c1c1a]/25 p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    {typeof job.relevance === 'number' && (
                      <div className={`shrink-0 w-11 h-11 border-2 flex flex-col items-center justify-center font-mono font-bold ${job.relevance >= 75 ? 'border-[#2f9d55] text-[#2f9d55]' : job.relevance >= 60 ? 'border-[#1c1c1a] text-[#1c1c1a]' : 'border-[#b45309] text-[#b45309]'}`}>
                        <span className="text-sm leading-none">{job.relevance}</span>
                        <span className="text-[7px] font-mono uppercase tracking-widest mt-0.5">match</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1c1c1a] text-sm truncate">{job.title}</p>
                        <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-[#1c1c1a]/45 bg-[#e9ebee] px-1.5 py-0.5 rounded">{job.source}</span>
                      </div>
                      <p className="text-xs text-[#1c1c1a]/45 mt-0.5 truncate">{job.company}{job.location ? ` · ${job.location}` : ''}{job.salary ? ` · ${job.salary}` : ''}</p>
                      {job.source === 'Adzuna' && <AdzunaCredit className="mt-1" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline">View</a>}
                    <button onClick={() => analyseFromSearch(job)} disabled={loading}
                      className="text-[10px] font-bold text-[#f0452f] font-mono uppercase tracking-widest hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bolt</span>Analyse
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CVs Tab */}
      {activeTab === 'cvs' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#f0452f]">/CV library</h3>
            <p className="text-sm text-[#1c1c1a]/60 mt-1">Role-tailored CVs you've generated. Analyse a role and choose "Proceed to Apply" to add one.</p>
          </div>

          {cvLibrary.length === 0 ? (
            <div className="bg-[#f3f4f6] rounded-none p-12 border border-[#1c1c1a]/10 text-center text-sm text-[#1c1c1a]/45">
              No tailored CVs yet. Analyse a role in the Pipeline tab, then click "Proceed to Apply" to generate one.
            </div>
          ) : (
            <div className="space-y-4">
              {cvLibrary.map((cv) => (
                <details key={cv.id} className="bg-[#ffffff] rounded-none border border-[#1c1c1a]/25 overflow-hidden group">
                  <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-[#f3f4f6] list-none">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-none bg-[#e9ebee] flex items-center justify-center text-[#f0452f]">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#1c1c1a] text-sm">{cv.role}</p>
                        <p className="text-xs text-[#1c1c1a]/45">{cv.company} · {cv.tailored_cv_at ? new Date(cv.tailored_cv_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-widest bg-[#1c1c1a] text-[#f6f7f8]">{cv.status}</span>
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-[#1c1c1a]/10">
                    <div className="flex justify-end mb-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (cvEditingId === cv.id) {
                              setCvEditingId(null);
                            } else {
                              setCvEditingId(cv.id);
                              setCvDraftText(cv.tailored_cv || '');
                            }
                          }}
                          className="text-[10px] font-bold text-[#1c1c1a]/60 font-mono uppercase tracking-widest hover:underline"
                        >
                          {cvEditingId === cv.id ? 'Cancel edit' : 'Edit text'}
                        </button>
                        <button onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: cv.role || 'Role', cvMarkdown: cv.tailored_cv })} className="text-[10px] font-bold text-[#f0452f] font-mono uppercase tracking-widest hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span>Download PDF</button>
                        <button onClick={() => navigator.clipboard?.writeText(cv.tailored_cv)} className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline">Copy</button>
                      </div>
                    </div>
                    {cvEditingId === cv.id ? (
                      <div className="bg-[#f3f4f6] rounded-none p-4 border border-[#1c1c1a]/25 space-y-3">
                        <textarea
                          value={cvDraftText}
                          onChange={(e) => setCvDraftText(e.target.value)}
                          rows={16}
                          className="w-full font-mono text-xs text-[#1c1c1a]/80 bg-[#ffffff] border border-[#1c1c1a]/25 rounded-none p-3 leading-relaxed"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setCvEditingId(null)} className="px-4 py-2 rounded-none text-xs font-bold text-[#1c1c1a]/60 hover:bg-[#e9ebee]">Cancel</button>
                          <button onClick={() => handleSaveTailoredCv(cv.id, cvDraftText)} disabled={cvSaving} className="px-4 py-2 rounded-none text-xs font-bold bg-[#1c1c1a] text-white hover:bg-[#f0452f]">
                            {cvSaving ? 'Saving…' : 'Save CV edits'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f3f4f6] border border-[#1c1c1a]/10 p-5 max-h-[34rem] overflow-y-auto">
                        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[#1c1c1a]/85">{cvPlainText(cv.tailored_cv)}</pre>
                      </div>
                    )}
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <input
                        value={cvEdit}
                        onChange={(e) => setCvEdit(e.target.value)}
                        placeholder='Suggest a CV revision, e.g. "emphasise AI governance" or "make the summary shorter"'
                        className="flex-1 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]"
                      />
                      <button
                        onClick={() => handleTailorCv(cv.id, cvEdit)}
                        disabled={tailoring || !cvEdit.trim()}
                        className={`h-11 px-5 bg-[#1c1c1a] text-white rounded-none font-bold inline-flex items-center justify-center gap-2 hover:bg-[#f0452f] transition-colors ${(tailoring || !cvEdit.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {tailoring ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_fix_high</span>}Revise CV
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Apply Assist Tab */}
      {activeTab === 'apply' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#f0452f]">/Apply assist</h3>
            <p className="text-sm text-[#1c1c1a]/60 mt-1">Pick a role to work its dossier above — cover letter, portal answers, research and interview prep. Your copy-ready details live below.</p>
          </div>

          {/* Role picker — drives the dossier rendered above this section */}
          <div className="bg-[#f3f4f6] rounded-none p-5 border border-[#1c1c1a]/25">
            <label className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest ml-1">Applying for</label>
            {pipeline.length > 0 ? (
              <select value={applyRoleId} onChange={(e) => setApplyRoleId(e.target.value)}
                className="block w-full mt-1 bg-[#ffffff] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a]">
                <option value="">— select a role —</option>
                {pipeline.map((r) => <option key={r.id} value={r.id}>{r.role} @ {r.company}</option>)}
              </select>
            ) : (
              <p className="text-xs text-[#1c1c1a]/45 mt-1">Analyse a role first (Pipeline or Live Scans) — then pick it here to open its dossier.</p>
            )}
          </div>

          <details className="group border border-[#1c1c1a]/25 rounded-none bg-[#ffffff]">
            <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-[#1c1c1a]">Your copy-ready details <span className="text-[#1c1c1a]/45 font-normal">— name, contact, address, notice period (set once)</span></span>
              <span className="material-symbols-outlined text-[#1c1c1a]/45 transition-transform group-open:rotate-180">expand_more</span>
            </summary>
            <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Standard fields from profile + CV */}
            <div className="bg-[#ffffff] rounded-none p-6 border border-[#1c1c1a]/25 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#1c1c1a] text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#f0452f]">badge</span>Standard fields</h4>
                <ApplySaveStatus status={applySave} onRetry={saveApplyExtras} />
              </div>
              <p className="text-xs text-[#1c1c1a]/60 -mt-2">Name, location, current role and salary come from Config.</p>
              <CopyField label="Full name" value={profileData?.name} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Email" value={profileData?.email || applyExtras.email} editable onChange={(v) => setExtra('email', v)} />
                <CopyField label="Phone" value={profileData?.phone || applyExtras.phone} editable onChange={(v) => setExtra('phone', v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Location" value={profileData?.location} />
                <CopyField label="Current role" value={profileData?.current_role} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Expected salary (£)" value={profileData?.min_salary ? String(profileData.min_salary) : ''} />
                <CopyField label="Remote / work pattern" value={applyExtras.work_pattern} editable onChange={(v) => setExtra('work_pattern', v)} />
              </div>
              <CopyField label="LinkedIn" value={profileData?.linkedin || applyExtras.linkedin} editable onChange={(v) => setExtra('linkedin', v)} />
            </div>

            {/* User-filled extras (persisted) */}
            <div className="bg-[#ffffff] rounded-none p-6 border border-[#1c1c1a]/25 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#1c1c1a] text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#f0452f]">edit_note</span>Your extras</h4>
                <ApplySaveStatus status={applySave} onRetry={saveApplyExtras} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Address line 1" value={applyExtras.address1} editable onChange={(v) => setExtra('address1', v)} />
                <CopyField label="Address line 2" value={applyExtras.address2} editable onChange={(v) => setExtra('address2', v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Town / city" value={applyExtras.town} editable onChange={(v) => setExtra('town', v)} />
                <CopyField label="Postcode" value={applyExtras.postcode} editable onChange={(v) => setExtra('postcode', v)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Notice period" value={applyExtras.notice} editable onChange={(v) => setExtra('notice', v)} />
                <CopyField label="Right to work" value={applyExtras.right_to_work} editable onChange={(v) => setExtra('right_to_work', v)} />
              </div>
              <CopyField label="How did you hear about us?" value={applyExtras.referral} editable onChange={(v) => setExtra('referral', v)} />
            </div>
          </div>
            </div>
          </details>

          {/* Employment history for application forms (D-SITE-077): editable copy,
              seeded from the evidence anchors; edits never change the anchors. */}
          <details className="group border border-[#1c1c1a]/25 rounded-none bg-[#ffffff]">
            <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-[#1c1c1a]">Recent roles <span className="text-[#1c1c1a]/45 font-normal">— for employment-history form fields</span></span>
              <div className="flex items-center gap-3">
                <ApplySaveStatus status={applySave} onRetry={saveApplyExtras} />
                <span className="material-symbols-outlined text-[#1c1c1a]/45 transition-transform group-open:rotate-180">expand_more</span>
              </div>
            </summary>
            <div className="px-6 pb-6">
            <p className="text-xs text-[#1c1c1a]/60 mb-4">Edit these for application forms. Your evidence anchors in Config are not changed.</p>
            <div className="space-y-4">
              {applyRoles.map((r, i) => (
                <div key={i} className="space-y-3 pb-4 border-b border-[#1c1c1a]/10 last:border-0 last:pb-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CopyField label="Employer" value={r.employer} editable onChange={(v) => updateApplyRole(i, 'employer', v)} />
                    <CopyField label="Job title" value={r.title} editable onChange={(v) => updateApplyRole(i, 'title', v)} />
                    <CopyField label="Period" value={r.period} editable onChange={(v) => updateApplyRole(i, 'period', v)} />
                  </div>
                  <CopyField label="Summary" value={r.summary} editable multiline onChange={(v) => updateApplyRole(i, 'summary', v)} />
                  <button onClick={() => setApplyRoles(applyRoles.filter((_, j) => j !== i))}
                    className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#1c1c1a]/45 hover:text-red-600">Remove role</button>
                </div>
              ))}
            </div>
            <button onClick={() => setApplyRoles([...applyRoles, { employer: '', title: '', period: '', summary: '' }])}
              className="mt-4 text-[10px] font-bold font-mono uppercase tracking-widest text-[#f0452f] hover:underline">+ Add role</button>
            </div>
          </details>


        </section>
      )}

      {/* Config Tab View */}
      {activeTab === 'settings' && (
        <section className="animate-in fade-in duration-300">
           {/* Validation Banner */}
           {!configStatus.has_config && (
             <div className="mb-8 flex items-center justify-between bg-red-50 text-red-900 px-6 py-3 rounded-none border border-red-100">
               <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-red-500">report</span>
                 <span className="text-xs font-bold uppercase tracking-wider">Validation Alert:</span>
                 <span className="text-xs font-medium">Missing Target Salary floor and Evidence Anchors in profile configuration.</span>
               </div>
               <button className="text-[10px] font-bold underline decoration-2 underline-offset-4 font-mono uppercase tracking-widest">Fix Now</button>
             </div>
           )}

           <header className="mb-10">
             <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[#f0452f] mb-2">/Config</p>
             <h3 className="text-3xl font-black text-[#1c1c1a] tracking-tight">Onboarding &amp; configuration<span className="text-[#f0452f]">.</span></h3>
             <p className="text-[#1c1c1a]/60 text-sm mt-1">Fine-tune your professional persona and algorithmic alignment.</p>
             <div className="mt-3 inline-flex items-start gap-2 text-xs text-[#1c1c1a]/60 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none px-3 py-2 max-w-2xl">
               <span className="material-symbols-outlined text-[#f0452f] text-base">lock</span>
               <span>Your details stay in your own private Arcturus DC workspace. We never sell your data or use it for marketing. It's shared only with the AI and job-board services that run your search, then stored securely here.</span>
             </div>
           </header>
           
           {/* CV Library — upload your CV; the active one is the reference for analyse & search */}
           
           <div className="bg-[#ffffff] rounded-none p-5 sm:p-8 border border-[#1c1c1a]/25 mb-8">
           
             <h3 className="font-bold text-[#1c1c1a] text-lg tracking-tight flex items-center gap-2 mb-1">
           
               <span className="material-symbols-outlined text-[#f0452f]">description</span> Your CV
           
             </h3>
           
             <p className="text-sm text-[#1c1c1a]/60 mb-4">Upload your CV (PDF or DOCX). The <span className="font-bold">active</span> CV is the reference Career Ops uses to analyse roles, search, and tailor — and we&apos;ll auto-fill your profile &amp; evidence from it.</p>
           
             <div className="flex flex-wrap gap-3 items-center">
           
               <label className={`inline-flex items-center gap-2 h-11 px-5 rounded-none font-bold text-sm cursor-pointer transition-colors ${cvBusy ? 'bg-[#e9ebee] text-[#1c1c1a]/45 cursor-not-allowed' : 'bg-[#1c1c1a] text-white hover:bg-[#f0452f]'}`}>
           
                 {cvBusy ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : <span className="material-symbols-outlined text-base">upload_file</span>}
           
                 {cvBusy ? 'Reading…' : 'Upload CV (PDF/DOCX)'}
           
                 <input type="file" accept=".pdf,.docx,.txt,application/pdf" className="hidden" disabled={cvBusy}
           
                   onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) handleCvFile(file); }} />
           
               </label>
           
               <button onClick={() => setCvPasteOpen((o) => !o)} className="h-11 px-4 rounded-none border border-[#1c1c1a]/25 text-[#1c1c1a]/70 font-bold text-sm hover:bg-[#f3f4f6]">or paste text</button>
           
             </div>
           
             {cvPasteOpen && (
           
               <div className="mt-4 space-y-2">
           
                 <input value={cvPasteLabel} onChange={(e) => setCvPasteLabel(e.target.value)} placeholder="Label (e.g. Energy PO version)" className="w-full bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a]" />
           
                 <textarea value={cvPasteText} onChange={(e) => setCvPasteText(e.target.value)} placeholder="Paste your full CV text here…" className="w-full h-40 bg-[#f3f4f6] border border-[#1c1c1a]/25 rounded-none p-3 text-sm text-[#1c1c1a] focus:ring-0 focus:border-[#1c1c1a] resize-none" />
           
                 <button onClick={async () => { await saveCvAndExtract(cvPasteLabel || 'My CV', cvPasteText); setCvPasteText(''); setCvPasteLabel(''); setCvPasteOpen(false); }} disabled={cvBusy || !cvPasteText.trim()} className={`h-11 px-5 rounded-none font-bold text-sm ${(cvBusy || !cvPasteText.trim()) ? 'bg-[#e9ebee] text-[#1c1c1a]/45' : 'bg-[#1c1c1a] text-white hover:bg-[#f0452f]'}`}>Save CV</button>
           
               </div>
           
             )}
           
             {cvUploads.length > 0 && (
           
               <div className="mt-5 space-y-2">
           
                 {cvUploads.map((cv) => (
           
                   <div key={cv.id} className={`flex items-center justify-between gap-3 p-3 rounded-none border ${cv.active ? 'border-[#1c1c1a] bg-[#e9ebee]/40' : 'border-[#1c1c1a]/25'}`}>
           
                     <div className="min-w-0">
           
                       <div className="flex items-center gap-2">
           
                         <p className="font-bold text-[#1c1c1a] text-sm truncate">{cv.label}</p>
           
                         {cv.active && <span className="text-[9px] font-bold font-mono uppercase tracking-widest bg-[#1c1c1a] text-white px-1.5 py-0.5 rounded">Active</span>}
           
                       </div>
           
                       <p className="text-xs text-[#1c1c1a]/45 truncate">{cv.preview}…</p>
           
                     </div>
           
                     <div className="flex items-center gap-3 shrink-0">
           
                       {!cv.active && <button onClick={() => setActiveCv(cv.id)} className="text-[10px] font-bold text-[#f0452f] font-mono uppercase tracking-widest hover:underline">Set active</button>}
           
                       <button onClick={() => relabelCv(cv.id, cv.label)} className="text-[10px] font-bold text-[#1c1c1a]/45 font-mono uppercase tracking-widest hover:underline">Rename</button>
           
                       <button onClick={() => deleteCv(cv.id)} className="text-[#1c1c1a]/30 hover:text-red-500"><span className="material-symbols-outlined text-sm">delete</span></button>
           
                     </div>
           
                   </div>
           
                 ))}
           
               </div>
           
             )}
           
           </div>

           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-8">
              <div className="col-span-12 lg:col-span-5 flex flex-col">
                <ProfileForm 
                  data={profileData} 
                  onChange={setProfileData} 
                  onSave={handleSaveConfig}
                  isSaving={isSaving}
                />
              </div>
              <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
                <EvidenceManager 
                  anchors={anchorsData} 
                  onAdd={addAnchor}
                  onDelete={deleteAnchor}
                  onUpdate={updateAnchor}
                  onSave={handleSaveConfig}
                  isSaving={isSaving}
                />
                <VisualWeightEditor 
                  weights={weightsData} 
                  onChange={setWeightsData} 
                  onSave={handleSaveConfig}
                  isSaving={isSaving}
                />
              </div>
           </div>

        </section>
      )}

      {/* First-run onboarding walkthrough */}
      {pendingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-[#ffffff] rounded-none p-6 max-w-md w-full flex flex-col gap-4">
            <h3 className="font-bold text-[#1c1c1a] text-lg">You already have evidence anchors</h3>
            <p className="text-sm text-[#1c1c1a]/70">
              The CV gave {pendingEvidence.length} role{pendingEvidence.length === 1 ? '' : 's'}. Your existing anchors are
              unchanged unless you choose to replace them. Empty profile fields were filled; nothing you had set was changed.
              Nothing is saved until you press Save.
            </p>
            <button
              onClick={() => {
                const { anchors, addedCount } = mergeNewAnchors(anchorsData, pendingEvidence);
                setAnchorsData(anchors);
                setPendingEvidence(null);
                alert(addedCount ? `Added ${addedCount} new role${addedCount === 1 ? '' : 's'}. Review and hit Save.` : 'No new roles found. Your anchors are unchanged.');
              }}
              className="px-4 py-3 bg-[#1c1c1a] text-white rounded-none font-bold text-xs font-mono uppercase tracking-widest"
            >
              Add only new roles
            </button>
            <button
              onClick={() => { setAnchorsData(pendingEvidence); setPendingEvidence(null); }}
              className="px-4 py-3 bg-[#e9ebee] text-[#1c1c1a] rounded-none font-bold text-xs font-mono uppercase tracking-widest"
            >
              Replace all my anchors
            </button>
            <button
              onClick={() => setPendingEvidence(null)}
              className="px-4 py-3 text-[#1c1c1a]/70 rounded-none font-bold text-xs font-mono uppercase tracking-widest"
            >
              Keep my anchors
            </button>
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onDismiss={dismissOnboarding}
          onFinish={dismissOnboarding}
          onCta={(tab) => { setShowOnboarding(false); setActiveTab(tab); }}
        />
      )}

      {/* Buy-a-coffee paywall */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPaywall(false)}>
          <div className="bg-[#ffffff] rounded-none max-w-md w-full p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">☕</div>
            <h3 className="text-xl font-bold text-[#1c1c1a]">{usage?.remaining > 0 ? 'Enjoying Career Ops?' : "You've used your free actions"}</h3>
            <p className="text-sm text-[#1c1c1a]/70 mt-2 leading-relaxed">
              Career Ops is free for your first {usage?.free_actions || 20} actions (analyses, CV tailoring and searches).
              {usage?.remaining > 0 ? ` You have ${usage.remaining} left.` : ' To keep going, buy us a coffee.'}
            </p>
            <p className="text-xs text-[#1c1c1a]/45 mt-3 leading-relaxed">
              This isn't about profit — it just covers the AI costs of running your job search. A £5 coffee unlocks another {usage?.bundle || 50} actions.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleBuyCoffee()} className="flex-1 h-12 bg-[#1c1c1a] text-white rounded-none font-bold hover:bg-[#f0452f] transition-colors flex items-center justify-center gap-2">
                <span>☕</span> Buy a coffee — £5
              </button>
              <button onClick={() => setShowPaywall(false)} className="px-5 h-12 border border-[#1c1c1a]/25 text-[#1c1c1a]/70 font-bold rounded-none hover:bg-[#f3f4f6] transition-colors">
                Maybe later
              </button>
            </div>
            <button onClick={handleRedeemCode} className="mt-4 w-full text-center text-xs text-[#1c1c1a]/45 hover:text-[#1c1c1a]/70 underline">
              Have an access code? Enter it here
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
