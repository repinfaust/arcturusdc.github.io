'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Tab <-> URL path mapping for deep-linkable sub-pages.
// NOTE: the config TAB uses the /setup path because career/config/ holds the
// YAML config files (a route there would collide / confuse).
const TAB_BASE = '/apps/stea/career';
const TAB_TO_PATH = { pipeline: TAB_BASE, scans: `${TAB_BASE}/scans`, cvs: `${TAB_BASE}/cvs`, apply: `${TAB_BASE}/apply`, settings: `${TAB_BASE}/setup` };

/* ---------------- Markdown renderer for the AI fit narrative ---------------- */
function FitNarrative({ markdown }) {
  return (
    <div className="career-md text-sm text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-xl font-bold text-[#10294D] mt-6 mb-3 first:mt-0" {...p} />,
          h2: (p) => <h2 className="text-base font-bold text-[#10294D] mt-6 mb-2 pb-1 border-b border-slate-200" {...p} />,
          h3: (p) => <h3 className="text-sm font-bold text-[#006C50] uppercase tracking-wide mt-4 mb-2" {...p} />,
          p:  (p) => <p className="my-2" {...p} />,
          ul: (p) => <ul className="list-disc pl-5 my-2 space-y-1" {...p} />,
          ol: (p) => <ol className="list-decimal pl-5 my-2 space-y-1" {...p} />,
          strong: (p) => <strong className="font-bold text-[#10294D]" {...p} />,
          blockquote: (p) => <blockquote className="border-l-4 border-[#006C50] bg-teal-50/50 pl-4 py-2 my-3 rounded-r text-[#10294D]" {...p} />,
          code: (p) => <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[13px] font-mono" {...p} />,
          table: (p) => <div className="overflow-x-auto my-4"><table className="w-full text-xs border-collapse" {...p} /></div>,
          thead: (p) => <thead className="bg-slate-100" {...p} />,
          th: (p) => <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[#10294D]" {...p} />,
          td: (p) => <td className="border border-slate-200 px-3 py-2 align-top" {...p} />,
          hr: () => <hr className="my-5 border-slate-200" />,
          a:  (p) => <a className="text-[#006C50] underline" target="_blank" rel="noreferrer" {...p} />,
        }}
      >
        {markdown || ''}
      </ReactMarkdown>
    </div>
  );
}

/* Splits a long markdown doc at "## " headings into collapsible sections so the
   page isn't one giant scroll. The first `openCount` sections start expanded. */
function CollapsibleNarrative({ markdown, openCount = 2 }) {
  const md = markdown || '';
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
          className="group border border-slate-200 rounded-xl bg-white overflow-hidden"
        >
          <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between hover:bg-slate-50 font-bold text-[#10294D] text-sm">
            <span>{sectionTitle(block)}</span>
            <span className="material-symbols-outlined text-slate-400 transition-transform group-open:rotate-180">expand_more</span>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-slate-100">
            <FitNarrative markdown={sectionBody(block)} />
          </div>
        </details>
      ))}
    </div>
  );
}

/* Minimal, ATS-friendly Markdown -> HTML for the print/PDF view.
   Produces selectable text, single column, standard headings. The AI output
   often includes a CV + cover note + rationale; we only print up to the
   "rationale"/"cover note" boundary if present, else the whole thing. */
function markdownToPrintHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const lines = (md || '').split('\n');
  const out = [];
  let inList = false, inTable = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  const closeTable = () => { if (inTable) { out.push('</tbody></table>'); inTable = false; } };

  for (let raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*$/.test(line)) { closeList(); continue; }
    if (/^#{1,6}\s/.test(line)) {
      closeList(); closeTable();
      const level = Math.min(line.match(/^#+/)[0].length, 4);
      out.push(`<h${level}>${inline(line.replace(/^#+\s/, ''))}</h${level}>`);
    } else if (/^\s*[-*]\s+/.test(line)) {
      closeTable();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
    } else if (/^\|.*\|$/.test(line)) {
      closeList();
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (/^[-:\s|]+$/.test(line.replace(/\|/g, ''))) continue; // separator row
      if (!inTable) { out.push('<table><tbody>'); inTable = true; }
      out.push('<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
    } else if (/^>\s?/.test(line)) {
      closeList(); closeTable();
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
    } else if (/^---+$/.test(line)) {
      closeList(); closeTable(); out.push('<hr/>');
    } else {
      closeList(); closeTable();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList(); closeTable();
  return out.join('\n');
}

function printCvAsPdf({ name = 'Candidate', role = 'Role', cvMarkdown = '' }) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to download the PDF.'); return; }
  const body = markdownToPrintHtml(cvMarkdown);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${name} — ${role}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; font-size:11pt; line-height:1.45; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 20pt; margin: 0 0 2pt; }
    h2 { font-size: 12.5pt; margin: 16pt 0 4pt; border-bottom:1px solid #ccc; padding-bottom:2pt; }
    h3 { font-size: 11pt; margin: 10pt 0 3pt; color:#333; }
    h4 { font-size: 10.5pt; margin: 8pt 0 2pt; }
    p { margin: 4pt 0; }
    ul { margin: 4pt 0; padding-left: 18pt; }
    li { margin: 2pt 0; }
    table { width:100%; border-collapse: collapse; margin: 6pt 0; font-size:10pt; }
    td { border:1px solid #ddd; padding: 4pt 6pt; vertical-align: top; }
    blockquote { margin: 6pt 0; padding: 4pt 10pt; border-left:3px solid #006C50; color:#333; }
    code { background:#f3f3f3; padding:1px 4px; border-radius:3px; }
    hr { border:none; border-top:1px solid #ddd; margin: 10pt 0; }
    @media print { body { max-width:none; } }
  </style></head><body>${body}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
  </body></html>`);
  w.document.close();
}

/* A labelled value with a one-click copy button (Apply Assist). */
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
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        {editable ? (
          multiline ? (
            <textarea value={value || ''} onChange={(e) => onChange(e.target.value)}
              className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 text-sm text-[#10294D] focus:ring-2 focus:ring-blue-100 resize-none h-20" />
          ) : (
            <input value={value || ''} onChange={(e) => onChange(e.target.value)}
              className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 text-sm text-[#10294D] focus:ring-2 focus:ring-blue-100" />
          )
        ) : (
          <div className="mt-1 bg-slate-50 rounded-xl p-3 text-sm text-[#10294D] min-h-[44px] break-words whitespace-pre-wrap">{value || <span className="text-slate-300">—</span>}</div>
        )}
      </div>
      <button onClick={doCopy} disabled={!value} title="Copy"
        className={`mt-6 shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${value ? 'bg-teal-50 text-[#006C50] hover:bg-[#006C50] hover:text-white' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}>
        <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
      </button>
    </div>
  );
}

/* ---------------- UI Components ---------------- */

// RAG go/no-go verdict derived from score + the evaluation's recommendation.
function VerdictPanel({ score, evaluation }) {
  const s = typeof score === 'number' ? score : 0;
  let rag;
  if (s >= 4.0) rag = { label: 'GO — Strong fit', cls: 'bg-green-50 border-green-200 text-green-800', dot: 'bg-green-500', sub: 'Apply — tailor and submit.' };
  else if (s >= 3.0) rag = { label: 'PROCEED WITH CARE', cls: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500', sub: 'Selective — apply only with a strong tailored narrative.' };
  else rag = { label: 'NO-GO — Weak fit', cls: 'bg-red-50 border-red-200 text-red-800', dot: 'bg-red-500', sub: 'Skip unless you have a specific reason.' };

  // Pull the model's own recommended action / one-line verdict if present.
  const action =
    evaluation?.match(/Recommended action:\s*\*{0,2}\s*(.+?)(?:\n|$)/i)?.[1] ||
    evaluation?.match(/Fit Recommendation[^\n]*\n+>?\s*#{0,3}\s*([^\n]+)/i)?.[1] ||
    null;

  return (
    <div className={`mt-6 rounded-xl border p-4 ${rag.cls}`}>
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${rag.dot}`}></span>
        <span className="text-sm font-bold uppercase tracking-wide">{rag.label}</span>
      </div>
      <p className="text-xs mt-2 opacity-90">{rag.sub}</p>
      {action && (
        <p className="text-[11px] mt-3 pt-3 border-t border-current/10 leading-relaxed opacity-90">
          <span className="font-bold">Recommendation: </span>{action.replace(/\*\*/g, '')}
        </p>
      )}
    </div>
  );
}

const FitGauge = ({ score }) => {
  const percentage = (score / 5) * 100;
  const strokeDasharray = 552.92;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

  return (
    <div className="relative h-48 w-48 mx-auto py-6">
      <svg className="h-full w-full transform -rotate-90">
        <circle className="text-slate-100" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8"></circle>
        <circle cx="96" cy="96" fill="transparent" r="88" stroke="url(#gradient-success)" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="8"></circle>
        <defs>
          <linearGradient id="gradient-success" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#006C50"></stop>
            <stop offset="100%" stopColor="#82d7b5"></stop>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-[#10294D]">{score.toFixed(1)}</span>
        <span className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest mt-1">
          {score >= 4.5 ? 'Aggressive Pursuit' : score >= 4.0 ? 'Strong Match' : score >= 3.5 ? 'Selective' : 'Archive'}
        </span>
      </div>
    </div>
  );
};

/* ---------------- Configuration & Onboarding Components ---------------- */

const ProfileForm = ({ data, onChange, onSave, isSaving }) => (
  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#10294D]">account_circle</span>
        <h3 className="font-bold text-[#10294D] text-lg tracking-tight">Candidate Profile</h3>
      </div>
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-[#10294D] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#001432] transition-all disabled:opacity-50 shadow-lg shadow-blue-900/10"
      >
        {isSaving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
    
    <div className="grid grid-cols-1 gap-5">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
        <input 
          type="text" 
          value={data?.name || ''} 
          onChange={(e) => onChange({...data, name: e.target.value})}
          className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-[#10294D] focus:ring-2 focus:ring-blue-100"
          placeholder="e.g. Tom Granger"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Role</label>
          <input 
            type="text" 
            value={data?.current_role || ''} 
            onChange={(e) => onChange({...data, current_role: e.target.value})}
            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-[#10294D] focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. Product Owner"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Salary Floor (£)</label>
          <input
            type="number"
            step={5000}
            min={0}
            value={data?.min_salary || ''}
            onChange={(e) => onChange({...data, min_salary: e.target.value})}
            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-[#10294D] focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. 65000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Roles (Comma separated)</label>
        <textarea
          value={Array.isArray(data?.target_roles) ? data.target_roles.join(',') : (data?.target_roles || '')}
          onChange={(e) => onChange({...data, target_roles: e.target.value.split(',')})}
          onBlur={(e) => onChange({...data, target_roles: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
          className="w-full h-24 bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-[#10294D] focus:ring-2 focus:ring-blue-100 resize-none"
          placeholder="e.g. Product Owner, Senior Product Owner, Product Manager"
        />
      </div>
    </div>
  </div>
);

const EvidenceManager = ({ anchors, onAdd, onDelete, onUpdate, onSave, isSaving }) => (
  <section className="bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-[#10294D] flex items-center gap-2 text-lg tracking-tight">
        <span className="material-symbols-outlined text-[#10294D]">deployed_code</span>
        Evidence Anchors
      </h3>
      <div className="flex gap-3">
        <button 
          onClick={onAdd}
          className="px-4 py-2 bg-white border border-slate-200 text-[#10294D] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
        >
          + Add Anchor
        </button>
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2 bg-[#10294D] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#001432] transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
    
    <div className="grid grid-cols-1 gap-4">
      {anchors?.map((anchor, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group relative">
          <button 
            onClick={() => onDelete(i)}
            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <input 
                className="w-full font-bold text-[#10294D] border-b border-slate-100 focus:border-blue-400 focus:ring-0 text-sm" 
                placeholder="Company Name" 
                value={anchor.company || ''}
                onChange={(e) => onUpdate(i, {...anchor, company: e.target.value})}
              />
              <input 
                className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 focus:border-blue-400 focus:ring-0" 
                placeholder="Period (e.g. 2021-Present)" 
                value={anchor.period || ''}
                onChange={(e) => onUpdate(i, {...anchor, period: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <textarea 
                className="w-full h-24 bg-slate-50 border-none rounded-xl p-3 text-[11px] text-slate-600 font-medium leading-relaxed resize-none" 
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
  <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-[#10294D] flex items-center gap-2 text-lg tracking-tight">
        <span className="material-symbols-outlined text-[#10294D]">tune</span>
        Scoring Model Tuning
      </h3>
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="px-6 py-2 bg-[#10294D] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#001432] transition-all disabled:opacity-50 shadow-lg shadow-blue-900/10"
      >
        {isSaving ? 'Saving...' : 'Apply Weights'}
      </button>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
      {[
        { id: 'domain_complexity', label: 'Domain Complexity' },
        { id: 'platform_data_depth', label: 'Platform/Data Depth' },
        { id: 'compensation', label: 'Compensation Parity' },
        { id: 'interview_likelihood', label: 'Interview Prediction' },
      ].map((factor) => (
        <div key={factor.id} className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-[#10294D] uppercase tracking-widest">{factor.label}</span>
            <span className="text-sm font-black text-[#10294D]">{( (weights?.[factor.id] || 0.5) * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={weights?.[factor.id] || 0.5}
            onChange={(e) => onChange({...weights, [factor.id]: parseFloat(e.target.value)})}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#10294D]"
          />
        </div>
      ))}
    </div>
  </section>
);

/* ---------------- Main Dashboard ---------------- */

export default function CareerOpsDashboard({ initialTab = 'pipeline' }) {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const router = useRouter();
  const [activeTab, setActiveTabState] = useState(initialTab);
  // Switch tab AND update the URL so sub-pages are deep-linkable / bookmarkable.
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    const path = TAB_TO_PATH[tab] || TAB_BASE;
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      router.push(path, { scroll: false });
    }
  };
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
  const [searchPrefilled, setSearchPrefilled] = useState(false);
  const [excludeCurrentEmployer, setExcludeCurrentEmployer] = useState(true);
  const [searchMode, setSearchMode] = useState('both'); // location | remote | both
  const [usage, setUsage] = useState(null); // { used, granted, remaining }
  const [showPaywall, setShowPaywall] = useState(false);
  // Apply Assist: extra application fields (persisted) + the role being applied to.
  const [applyExtras, setApplyExtras] = useState({});
  const [applyExtrasDirty, setApplyExtrasDirty] = useState(false);
  const [applyRoleId, setApplyRoleId] = useState('');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_analyses', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.analyses)) setPipeline(data.analyses);
    } catch (err) {
      console.error('Failed to load analyses', err);
    }
  }

  // Generate a role-tailored CV for an analysed role, save it, and show it.
  async function handleTailorCv(id) {
    if (!currentTenant?.id || !id) return;
    setTailoring(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tailor_cv', tenantId: currentTenant.id, id }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Tailoring failed');
      setResults((r) => ({ ...r, tailored_cv: data.tailored_cv }));
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

  async function loadCvs() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  async function handleBuyCoffee() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_usage', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok) setUsage(data);
    } catch (err) {
      console.error('Failed to load usage', err);
    }
  }

  async function loadApplyExtras() {
    if (!currentTenant?.id) return;
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_apply_profile', tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (res.ok && data.apply_profile) setApplyExtras(data.apply_profile);
    } catch (err) {
      console.error('Failed to load apply profile', err);
    }
  }

  async function saveApplyExtras() {
    if (!currentTenant?.id) return;
    try {
      await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_apply_profile', tenantId: currentTenant.id, apply_profile: applyExtras }),
      });
      setApplyExtrasDirty(false);
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  }

  const setExtra = (key, val) => { setApplyExtras((e) => ({ ...e, [key]: val })); setApplyExtrasDirty(true); };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cover_letter', tenantId: currentTenant.id, id: applyRoleId, edit_instruction: editInstruction || '' }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Cover letter failed');
      setCoverLetter(data.cover_letter || '');
      setCoverEdit('');
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setCoverLoading(false);
    }
  }
  // Common application answers (A3).
  const [applyAnswers, setApplyAnswers] = useState([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  async function handleApplyAnswers() {
    if (!currentTenant?.id || !applyRoleId) { alert('Select a role first.'); return; }
    setAnswersLoading(true);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_answers', tenantId: currentTenant.id, id: applyRoleId }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Failed');
      setApplyAnswers(data.apply_answers || []);
      loadUsage();
    } catch (err) { alert(err.message); } finally { setAnswersLoading(false); }
  }

  // When the selected role changes, load any saved cover letter + answers for it.
  useEffect(() => {
    setCoverLetter('');
    setApplyAnswers([]);
    if (!currentTenant?.id || !applyRoleId) return;
    (async () => {
      try {
        const res = await fetch('/api/stea/career', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_analysis', tenantId: currentTenant.id, id: applyRoleId }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.cover_letter) setCoverLetter(data.cover_letter);
          if (Array.isArray(data.apply_answers)) setApplyAnswers(data.apply_answers);
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

  // Returns true if a response was the usage limit (402); shows the paywall.
  function handleLimit(res, data) {
    if (res.status === 402 || data?.limit_reached) {
      if (data?.usage) setUsage((u) => ({ ...(u || {}), ...data.usage }));
      setShowPaywall(true);
      return true;
    }
    return false;
  }

  // Re-open a saved analysis: load it and show its evaluation in the results view.
  async function openAnalysis(id) {
    if (!currentTenant?.id || !id) return;
    setActiveTab('pipeline');
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_analysis', tenantId: currentTenant.id, id }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults({ jd_data: data.jd_data, evaluation: data.evaluation, score: data.score });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to open analysis', err);
    }
  }

  async function checkConfig() {
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
    { id: 'pipeline', label: 'Pipeline', icon: '📋' },
    { id: 'scans', label: 'Live Scans', icon: '📡' },
    { id: 'cvs', label: 'CV Tailoring', icon: '📄' },
    { id: 'apply', label: 'Apply Assist', icon: '✍️' },
    { id: 'settings', label: 'Config', icon: '⚙️' },
  ];

  async function handleAnalyse(overrideText) {
    const input = (typeof overrideText === 'string' ? overrideText : jdText).trim();
    if (!input || !currentTenant?.id) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyse', jd_text: input, tenantId: currentTenant.id }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Analyse failed');
      setResults(data);
      loadAnalyses(); // refresh the pipeline with the newly-saved role
      loadUsage();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search_jobs', tenantId: currentTenant.id, keywords, location, salary_min, exclude_employer, mode: searchMode }),
      });
      const data = await res.json();
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchResults(data.jobs || []);
      setSearchTotalRaw(data.total_raw || (data.jobs || []).length);
      setSearchDebug(data.debug || null);
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
    return <div className="p-10 text-center text-slate-500 font-medium">Initialising Career Ops...</div>;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Tab navigation + usage meter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <nav className="bg-slate-100/70 rounded-2xl p-1.5 flex flex-wrap gap-1 flex-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-[#10294D] shadow-sm'
                  : 'text-slate-500 hover:text-[#10294D]'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        {usage && !usage.unlimited && (
          <button onClick={() => setShowPaywall(true)} title="Analyses, CV tailoring and searches each use one action"
            className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
              usage.remaining <= 0 ? 'bg-amber-50 border-amber-200 text-amber-800' :
              usage.remaining <= 3 ? 'bg-amber-50 border-amber-100 text-amber-700' :
              'bg-white border-slate-200 text-slate-500'}`}>
            {usage.remaining > 0 ? `${usage.remaining} actions left` : 'No actions left — buy a coffee'} ☕
          </button>
        )}
        {usage?.unlimited && (
          <span className="shrink-0 text-xs font-bold px-3 py-2 rounded-xl border bg-white border-slate-200 text-slate-400">Unlimited (admin)</span>
        )}
      </div>

      {/* Onboarding Alert */}
      {!configStatus.has_config && activeTab !== 'settings' && (
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-6 flex justify-between items-center shadow-sm">
          <div>
            <div className="font-bold text-[#9A3412] text-sm tracking-tight">Workspace Setup Required</div>
            <p className="text-[#C2410C] text-sm mt-1 opacity-90">Please configure your PM profile and evidence library before running diagnostics.</p>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="bg-[#EA580C] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-700/10 hover:bg-[#C2410C] transition-all"
          >
            Go to Config
          </button>
        </div>
      )}

      {/* Role Input Terminal — Pipeline tab only */}
      {activeTab === 'pipeline' && (
      <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-sm">terminal</span>
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold">Input Terminal</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full h-32 bg-slate-50 border-none rounded-xl p-5 font-mono text-sm focus:ring-2 focus:ring-slate-200 placeholder:text-slate-300 resize-none"
              placeholder="Paste Job Description text or a LinkedIn URL to begin high-precision AI analysis..."
              disabled={!configStatus.has_config}
            />
            <button
              onClick={handleAnalyse}
              disabled={loading || !configStatus.has_config}
              className={`min-w-[180px] h-14 bg-[#10294D] text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-[#001432] transition-all shadow-xl shadow-blue-900/10 group ${(!configStatus.has_config || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <span className="text-xs font-medium text-[#10294D] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006C50] animate-pulse"></span>
                  {ANALYSE_STAGES[progressStage]}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Step {progressStage + 1} / {ANALYSE_STAGES.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#006C50] to-[#53FDC7] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${((progressStage + 1) / ANALYSE_STAGES.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">This usually takes 15–30 seconds. The AI is reading the role and scoring it against your profile.</p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Analysis Results View — Pipeline tab only */}
      {activeTab === 'pipeline' && results && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 bg-white rounded-2xl p-8 border border-slate-200 flex flex-col shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Fit Diagnostic</h3>
              <FitGauge score={typeof results.score === 'number' ? results.score : 0} />
            </div>

            {/* RAG go/no-go verdict — fills the column, surfaces the decision */}
            <VerdictPanel score={results.score} evaluation={results.evaluation} />

            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
              <span className="text-red-500 font-bold">!</span>
              <div>
                <h4 className="text-xs font-bold text-red-900">Risk Signal</h4>
                <p className="text-[11px] text-red-700/80 mt-1 leading-relaxed">
                  {results.evaluation?.match(/Risk Signal:(.*)/i)?.[1] || 'Potential level misalignment detected based on core responsibilities.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-50 rounded-2xl p-8 border border-slate-100 flex flex-col shadow-inner">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-[#10294D] italic tracking-tight">"The Fit Narrative"</h3>
              <div className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold uppercase tracking-widest">AI Prediction</div>
            </div>
            <CollapsibleNarrative markdown={results.evaluation} openCount={2} />

            {/* Proceed-to-apply: generate a role-tailored CV */}
            {results.id && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                {!results.tailored_cv ? (
                  <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#10294D] text-sm">Decided to apply for this role?</p>
                      <p className="text-xs text-slate-500 mt-0.5">Generate a CV tailored to this job, grounded in your real evidence. It's saved to your CV library.</p>
                    </div>
                    <button
                      onClick={() => handleTailorCv(results.id)}
                      disabled={tailoring}
                      className={`min-w-[190px] h-12 bg-[#006C50] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#005840] transition-all ${tailoring ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {tailoring ? (
                        <><span className="material-symbols-outlined animate-spin">progress_activity</span>Tailoring CV…</>
                      ) : (
                        <><span className="material-symbols-outlined">description</span>Proceed to Apply</>
                      )}
                    </button>
                  </div>
                  {tailoring && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#10294D] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006C50] animate-pulse"></span>
                          {TAILOR_STAGES[tailorStage]}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {tailorStage + 1} / {TAILOR_STAGES.length}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#006C50] to-[#53FDC7] rounded-full transition-all duration-700 ease-out" style={{ width: `${((tailorStage + 1) / TAILOR_STAGES.length) * 100}%` }}></div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">Writing a CV tailored to this role from your real evidence. Usually 20–40 seconds.</p>
                    </div>
                  )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-[#10294D] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006C50]">description</span>
                        Tailored CV
                      </h4>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: results.jd_data?.role_title || 'Role', cvMarkdown: results.tailored_cv })}
                          className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>Download PDF
                        </button>
                        <button
                          onClick={() => navigator.clipboard?.writeText(results.tailored_cv)}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                      <CollapsibleNarrative markdown={results.tailored_cv} openCount={1} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">
                      Saved to your{' '}
                      <button onClick={() => setActiveTab('cvs')} className="text-[#006C50] font-bold underline hover:no-underline">CV library</button>
                      {' '}— review and edit before sending; never submit unchecked.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Table */}
      {activeTab === 'pipeline' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Pipeline</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">Filter</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Company / Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Analysed</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pipeline.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      No roles analysed yet. Paste a job description above and run an analysis to populate your pipeline.
                    </td>
                  </tr>
                )}
                {pipeline.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openAnalysis(item.id)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {(item.company || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#10294D] text-sm">{item.company}</p>
                          <p className="text-xs text-slate-400">{item.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono font-bold text-[#006C50]">{typeof item.score === 'number' ? item.score.toFixed(1) : '—'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        item.status === 'Interview' ? 'bg-green-100 text-green-700' :
                        item.status === 'Applied' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-semibold text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</p>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:underline mr-4" onClick={(e) => { e.stopPropagation(); openAnalysis(item.id); }}>View</button>
                      <button className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline" onClick={(e) => { e.stopPropagation(); openApplyAssist(item.id); }}>Apply</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Scans Tab */}
      {activeTab === 'scans' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Find Roles</h3>
            <p className="text-sm text-slate-500 mt-1">Search live UK job boards (Reed + Adzuna), then analyse any role against your profile.</p>
          </div>

          {/* Search form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Keywords</label>
                <input value={searchKeywords} onChange={(e) => setSearchKeywords(e.target.value)} placeholder="e.g. Product Owner energy billing"
                  className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 text-sm text-[#10294D] focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</label>
                <input value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} placeholder="e.g. Nottingham"
                  className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 text-sm text-[#10294D] focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Min salary (£) — optional</label>
                <input type="number" value={searchSalary} onChange={(e) => setSearchSalary(e.target.value)} placeholder="leave blank" step={5000} min={0}
                  className="w-full mt-1 bg-slate-50 border-none rounded-xl p-3 text-sm text-[#10294D] focus:ring-2 focus:ring-blue-100" />
                <p className="text-[10px] text-slate-400 mt-1 ml-1">Setting this hides jobs with no listed salary (most of them). Leave blank for the widest results.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div className="flex flex-col gap-2">
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-bold self-start">
                  {[['both', 'Local + Remote'], ['location', 'Local only'], ['remote', 'Remote only']].map(([m, label]) => (
                    <button key={m} onClick={() => setSearchMode(m)}
                      className={`px-3 py-1.5 rounded-md transition-colors ${searchMode === m ? 'bg-white text-[#10294D] shadow-sm' : 'text-slate-500 hover:text-[#10294D]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={excludeCurrentEmployer} onChange={(e) => setExcludeCurrentEmployer(e.target.checked)}
                    className="w-4 h-4 text-[#006C50] border-slate-300 rounded focus:ring-[#006C50]" />
                  Exclude my current / most recent employer{currentEmployer ? ` (${currentEmployer})` : ''}
                </label>
              </div>
              <button onClick={handleSearchJobs} disabled={searching}
                className={`min-w-[160px] h-12 bg-[#10294D] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#001432] transition-all ${searching ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {searching ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Searching…</>) : (<><span className="material-symbols-outlined">search</span>Search</>)}
              </button>
            </div>

            {searching && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#10294D] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006C50] animate-pulse"></span>
                    {SEARCH_STAGES[searchStage]}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Step {searchStage + 1} / {SEARCH_STAGES.length}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#006C50] to-[#53FDC7] rounded-full transition-all duration-700 ease-out" style={{ width: `${((searchStage + 1) / SEARCH_STAGES.length) * 100}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Search debug — "why these results?" thought process */}
          {searchDebug && (
            <details className="bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <summary className="cursor-pointer px-4 py-3 font-bold text-[#10294D] list-none flex items-center justify-between">
                <span>Why these results? ({searchDebug.ranked_count} of {searchDebug.raw_count} raw)</span>
                <span className="material-symbols-outlined text-slate-400">expand_more</span>
              </summary>
              <div className="px-4 pb-4 space-y-2 text-slate-600">
                <div className="font-mono text-[11px] bg-white rounded-lg p-3 border border-slate-100 space-y-0.5">
                  <div>queries: <b>{(searchDebug.query?.terms || []).join(', ')}</b> · loc <b>{searchDebug.query?.location}</b> · mode <b>{searchDebug.query?.mode}</b> · min£ <b>{searchDebug.query?.salary_min}</b></div>
                  <div>sources: {Object.entries(searchDebug.source_counts || {}).map(([s, n]) => `${s}=${n}`).join(' · ') || 'none returned'}</div>
                  <div>funnel: {searchDebug.raw_count} raw → {searchDebug.deduped_count} deduped → {searchDebug.after_negative_filter} after filter → {searchDebug.ranked_count} shown</div>
                  <div>ranker: {searchDebug.ranker}{searchDebug.threshold ? ` (keep ≥ ${searchDebug.threshold})` : ''}</div>
                  {searchDebug.dropped_by_negative_filter?.length > 0 && <div>dropped (wrong discipline): {searchDebug.dropped_by_negative_filter.join(', ')}</div>}
                </div>
                {searchDebug.scores?.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-slate-100">
                    <div className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-1">Relevance scores (all candidates)</div>
                    {searchDebug.scores.map((s, i) => (
                      <div key={i} className="flex justify-between gap-3 py-0.5 border-b border-slate-50 last:border-0">
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
              <p className="text-xs text-slate-500">
                {searchResults.length} relevant {searchResults.length === 1 ? 'role' : 'roles'}
                {searchTotalRaw > searchResults.length ? ` (filtered from ${searchTotalRaw}, ranked by relevance to your targets)` : ''}. Click "Analyse" to score one against your profile.
              </p>
              {searchResults.map((job, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex items-center gap-3">
                    {typeof job.relevance === 'number' && (
                      <div className={`shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center font-bold ${job.relevance >= 75 ? 'bg-green-50 text-green-700' : job.relevance >= 60 ? 'bg-teal-50 text-[#006C50]' : 'bg-amber-50 text-amber-700'}`}>
                        <span className="text-sm leading-none">{job.relevance}</span>
                        <span className="text-[7px] uppercase tracking-widest mt-0.5">match</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#10294D] text-sm truncate">{job.title}</p>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{job.source}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{job.company}{job.location ? ` · ${job.location}` : ''}{job.salary ? ` · ${job.salary}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {job.url && <a href={job.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:underline">View</a>}
                    <button onClick={() => analyseFromSearch(job)} disabled={loading}
                      className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline flex items-center gap-1">
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
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CV Library</h3>
            <p className="text-sm text-slate-500 mt-1">Role-tailored CVs you've generated. Analyse a role and choose "Proceed to Apply" to add one.</p>
          </div>

          {cvLibrary.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 border border-slate-100 text-center text-sm text-slate-400">
              No tailored CVs yet. Analyse a role in the Pipeline tab, then click "Proceed to Apply" to generate one.
            </div>
          ) : (
            <div className="space-y-4">
              {cvLibrary.map((cv) => (
                <details key={cv.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                  <summary className="px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-slate-50 list-none">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#006C50]">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#10294D] text-sm">{cv.role}</p>
                        <p className="text-xs text-slate-400">{cv.company} · {cv.tailored_cv_at ? new Date(cv.tailored_cv_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700">{cv.status}</span>
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                    <div className="flex justify-end mb-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: cv.role || 'Role', cvMarkdown: cv.tailored_cv })} className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span>Download PDF</button>
                        <button onClick={() => navigator.clipboard?.writeText(cv.tailored_cv)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:underline">Copy</button>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                      <FitNarrative markdown={cv.tailored_cv} />
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
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Apply Assist</h3>
            <p className="text-sm text-slate-500 mt-1">Your details, ready to copy field-by-field into any application form. Fill the extras once — they're saved for next time.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Standard fields from profile + CV */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-[#10294D] text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#006C50]">badge</span>Standard fields</h4>
              <CopyField label="Full name" value={profileData?.name} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CopyField label="Email" value={profileData?.email} />
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
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[#10294D] text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#006C50]">edit_note</span>Your extras</h4>
                <button onClick={saveApplyExtras} disabled={!applyExtrasDirty}
                  className={`text-[10px] font-bold uppercase tracking-widest ${applyExtrasDirty ? 'text-[#006C50] hover:underline' : 'text-slate-300 cursor-default'}`}>
                  {applyExtrasDirty ? 'Save' : 'Saved'}
                </button>
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

          {/* Recent roles from evidence anchors */}
          {Array.isArray(anchorsData) && anchorsData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h4 className="font-bold text-[#10294D] text-sm flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-[#006C50]">work_history</span>Recent roles (for employment-history fields)</h4>
              <div className="space-y-4">
                {anchorsData.slice(0, 4).map((a, i) => (
                  <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <CopyField label="Employer" value={a.company} />
                    <CopyField label="Period" value={a.period} />
                    <CopyField label="Summary" value={Array.isArray(a.bullets) ? a.bullets.filter(Boolean)[0] : ''} multiline />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role picker — applies only to the cover letter + common answers below */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Applying for — pick a role to draft a cover letter &amp; answers</label>
            {pipeline.length > 0 ? (
              <select value={applyRoleId} onChange={(e) => setApplyRoleId(e.target.value)}
                className="block w-full mt-1 bg-white border border-slate-200 rounded-xl p-3 text-sm text-[#10294D]">
                <option value="">— select a role —</option>
                {pipeline.map((r) => <option key={r.id} value={r.id}>{r.role} @ {r.company}</option>)}
              </select>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Analyse a role first (Pipeline or Live Scans) — then pick it here to generate a cover letter and answers.</p>
            )}
          </div>

          {/* Cover letter (A2) — needs a selected role */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-[#10294D] text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#006C50]">mail</span>Cover letter</h4>
              {coverLetter && (
                <div className="flex items-center gap-3">
                  <button onClick={() => navigator.clipboard?.writeText(coverLetter)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:underline">Copy</button>
                  <button onClick={() => printCvAsPdf({ name: profileData?.name || 'Candidate', role: pipeline.find(r => r.id === applyRoleId)?.role || 'Cover letter', cvMarkdown: coverLetter })} className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-sm">download</span>PDF</button>
                </div>
              )}
            </div>
            {!applyRoleId ? (
              <p className="text-sm text-slate-400 py-6 text-center">Select a role above to generate a tailored cover letter (grounded in your real evidence).</p>
            ) : !coverLetter ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500 mb-4">Generate a cover letter tailored to this role from your CV and evidence. Uses one action.</p>
                <button onClick={() => handleCoverLetter()} disabled={coverLoading}
                  className={`h-12 px-6 bg-[#006C50] text-white rounded-xl font-bold inline-flex items-center justify-center gap-2 hover:bg-[#005840] transition-colors ${coverLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {coverLoading ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Writing…</>) : (<><span className="material-symbols-outlined">mail</span>Generate cover letter</>)}
                </button>
              </div>
            ) : (
              <div className="mt-3">
                <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{coverLetter}</div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input value={coverEdit} onChange={(e) => setCoverEdit(e.target.value)} placeholder='Suggest an edit, e.g. "make it shorter" or "emphasise the 50% metric"'
                    className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm text-[#10294D] focus:ring-2 focus:ring-blue-100" />
                  <button onClick={() => handleCoverLetter(coverEdit)} disabled={coverLoading || !coverEdit.trim()}
                    className={`h-11 px-5 bg-[#10294D] text-white rounded-xl font-bold inline-flex items-center justify-center gap-2 hover:bg-[#001432] transition-colors ${(coverLoading || !coverEdit.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {coverLoading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_fix_high</span>}Revise
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Each revision uses one action. Always review before sending.</p>
              </div>
            )}
          </div>

          {/* Common application answers (A3) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-[#10294D] text-sm flex items-center gap-2"><span className="material-symbols-outlined text-[#006C50]">quiz</span>Common application answers</h4>
              {applyAnswers.length > 0 && applyRoleId && (
                <button onClick={handleApplyAnswers} disabled={answersLoading} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:underline">Regenerate</button>
              )}
            </div>
            {!applyRoleId ? (
              <p className="text-sm text-slate-400 py-6 text-center">Select a role above to draft answers to the usual "why this role / why us / good fit" questions.</p>
            ) : applyAnswers.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500 mb-4">Draft the common free-text answers for this role. Each is copyable. Uses one action.</p>
                <button onClick={handleApplyAnswers} disabled={answersLoading}
                  className={`h-12 px-6 bg-[#006C50] text-white rounded-xl font-bold inline-flex items-center justify-center gap-2 hover:bg-[#005840] transition-colors ${answersLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {answersLoading ? (<><span className="material-symbols-outlined animate-spin">progress_activity</span>Drafting…</>) : (<><span className="material-symbols-outlined">quiz</span>Draft answers</>)}
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {applyAnswers.map((qa, i) => (
                  <CopyField key={i} label={qa.q} value={qa.a} multiline />
                ))}
                <p className="text-[10px] text-slate-400">Drafts only — personalise before submitting.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Config Tab View */}
      {activeTab === 'settings' && (
        <section className="animate-in fade-in duration-300">
           {/* Validation Banner */}
           {!configStatus.has_config && (
             <div className="mb-8 flex items-center justify-between bg-red-50 text-red-900 px-6 py-3 rounded-xl border border-red-100">
               <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-red-500">report</span>
                 <span className="text-xs font-bold uppercase tracking-wider">Validation Alert:</span>
                 <span className="text-xs font-medium">Missing Target Salary floor and Evidence Anchors in profile configuration.</span>
               </div>
               <button className="text-[10px] font-bold underline decoration-2 underline-offset-4 uppercase tracking-widest">Fix Now</button>
             </div>
           )}

           <header className="mb-10">
             <h3 className="text-3xl font-bold text-[#10294D] tracking-tight">Onboarding & Configuration.</h3>
             <p className="text-slate-500 text-sm mt-1">Fine-tune your professional persona and algorithmic alignment.</p>
           </header>
           
           <div className="grid grid-cols-12 gap-8 mb-8">
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

      {/* Buy-a-coffee paywall */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPaywall(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">☕</div>
            <h3 className="text-xl font-bold text-[#10294D]">{usage?.remaining > 0 ? 'Enjoying Career Ops?' : "You've used your free actions"}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Career Ops is free for your first {usage?.free_actions || 20} actions (analyses, CV tailoring and searches).
              {usage?.remaining > 0 ? ` You have ${usage.remaining} left.` : ' To keep going, buy us a coffee.'}
            </p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              This isn't about profit — it just covers the AI costs of running your job search. A £5 coffee unlocks another {usage?.bundle || 50} actions.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleBuyCoffee()} className="flex-1 h-12 bg-[#006C50] text-white rounded-xl font-bold hover:bg-[#005840] transition-colors flex items-center justify-center gap-2">
                <span>☕</span> Buy a coffee — £5
              </button>
              <button onClick={() => setShowPaywall(false)} className="px-5 h-12 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
