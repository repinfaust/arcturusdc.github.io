'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

/* ---------------- UI Components ---------------- */

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

const FactorCard = ({ label, isFit }) => (
  <div className={`p-4 bg-white border-l-4 ${isFit ? 'border-[#006C50]' : 'border-[#ba1a1a]'} rounded-lg shadow-sm flex justify-between items-center`}>
    <span className="text-sm font-medium text-[#10294D]">{label}</span>
    <span className={`text-sm font-bold ${isFit ? 'text-[#006C50]' : 'text-[#ba1a1a]'}`}>
      {isFit ? '✓' : '✕'}
    </span>
  </div>
);

/* ---------------- CV Tailoring Components ---------------- */

const CvComparisonView = () => (
  <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
      <h2 className="font-bold text-[#10294D] flex items-center gap-2 text-sm">
        <span className="material-symbols-outlined text-blue-600 text-lg">compare_arrows</span>
        Strategic Reordering
      </h2>
    </div>
    <div className="bg-white p-10 text-center text-sm text-slate-400">
      Analyse a role to generate a tailored CV comparison against your master CV.
    </div>
  </div>
);

const CoverNoteDrafter = () => (
  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-bold text-[#10294D] text-lg tracking-tight">Cover Note Drafter</h2>
        <p className="text-xs text-slate-400 mt-0.5">Generated from your evidence library once a role is analysed.</p>
      </div>
    </div>
    <div className="bg-slate-50 rounded-xl p-10 text-sm text-slate-400 leading-relaxed text-center">
      No cover note yet. Analyse a role to draft a tailored cover note grounded in your real evidence.
    </div>
  </div>
);

/* ---------------- Search & Discovery Components ---------------- */

const ScanControlPanel = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <h3 className="font-bold text-[#10294D] text-base mb-6 flex items-center gap-2">
      <span className="material-symbols-outlined text-[#10294D]">tune</span>
      Scan Control Panel
    </h3>
    <div className="space-y-3">
      {['LinkedIn Recruiter', 'Greenhouse API', 'Ashby Portal'].map((source, i) => (
        <label key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-[#10294D] text-lg">
              {i === 0 ? 'link' : i === 1 ? 'hub' : 'analytics'}
            </span>
            <span className="font-bold text-slate-600 text-xs tracking-tight">{source}</span>
          </div>
          <input type="checkbox" defaultChecked={i < 2} className="w-4 h-4 text-[#006C50] border-slate-300 rounded focus:ring-[#006C50]" />
        </label>
      ))}
    </div>
    <div className="mt-8 pt-6 border-t border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scan Depth</span>
        <span className="text-[10px] font-bold text-[#10294D] px-2 py-0.5 bg-blue-50 rounded uppercase">Deep</span>
      </div>
      <input type="range" className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#10294D]" />
    </div>
    <button className="w-full mt-8 py-4 bg-gradient-to-br from-[#10294D] to-[#001432] text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
      <span className="material-symbols-outlined text-lg">play_circle</span>
      Start Live Scan
    </button>
  </div>
);

const TerminalOutput = () => (
  <div className="bg-[#001432] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[300px]">
    <div className="bg-[#10294D] px-4 py-2 flex items-center justify-between border-b border-white/5">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#FF5F56]"></div>
        <div className="w-2 h-2 rounded-full bg-[#FFBD2E]"></div>
        <div className="w-2 h-2 rounded-full bg-[#27C93F]"></div>
      </div>
      <div className="text-[9px] font-mono text-blue-200 uppercase tracking-widest font-bold">Arcturus-Discovery v4.2</div>
      <div className="w-10"></div>
    </div>
    <div className="p-6 font-mono text-[11px] text-blue-100/80 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
      <p><span className="text-[#53FDC7] opacity-70">info</span> Discovery session idle.</p>
      <p><span className="text-blue-300/60">No active scan. Paste a job description in the pipeline tab to analyse a role.</span></p>
      <p><span className="text-blue-300 animate-pulse">_</span></p>
    </div>
    <div className="px-6 py-2 bg-[#10294D]/30 border-t border-white/5 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
      <span className="text-[9px] font-mono text-blue-300 uppercase font-bold tracking-widest">Idle</span>
    </div>
  </div>
);

const DiscoveryInbox = () => (
  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-bold text-base text-[#10294D] flex items-center gap-2 tracking-tight">
        <span className="material-symbols-outlined text-[#006C50]" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
        Discovery Inbox
      </h3>
      <div className="flex items-center gap-3">
        <button className="text-[10px] font-bold text-slate-400 hover:text-[#10294D] transition-colors uppercase tracking-widest">Clear All</button>
        <button className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold border border-slate-200 flex items-center gap-1 text-slate-600 uppercase tracking-widest">
          <span className="material-symbols-outlined text-xs">filter_list</span> Filter
        </button>
      </div>
    </div>
    <div className="space-y-3">
      <div className="bg-white p-8 rounded-xl border border-slate-100 text-center text-sm text-slate-400">
        No discovered roles yet. Analysed roles will appear here.
      </div>
    </div>
  </div>
);

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

const CvPreviewer = () => (
  <section className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row h-[500px]">
    <div className="w-full md:w-1/2 flex flex-col border-r border-slate-100">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Markdown Source</span>
        <span className="material-symbols-outlined text-slate-400 text-sm">edit_note</span>
      </div>
      <div className="flex-1 p-6 font-mono text-xs text-slate-600 overflow-auto custom-scrollbar bg-white">
        <pre>{`# Tom Granger
## Product Owner — Energy & Billing

Energy-billing specialist with **16 years** in UK utilities, owning PAYG & B2B billing product...

### Key Anchors
- 50% cut in P3/P4 incident resolution
- <1% failed bills (sustained)
- 99%+ HH settlements performance

### Strengths
\`Billing\` \`PAYG\` \`Metering\` \`SLAs\` \`AI Discovery\`
`}</pre>
      </div>
    </div>
    <div className="w-full md:w-1/2 flex flex-col bg-slate-50/30">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#10294D] uppercase tracking-widest">Engine Preview (PDF Gen)</span>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#006C50]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-auto custom-scrollbar">
        <div className="max-w-md mx-auto bg-white p-8 shadow-xl border border-slate-100 rounded min-h-full">
          <h1 className="text-2xl font-bold text-[#10294D] border-b-2 border-[#10294D] pb-2 mb-4 tracking-tighter uppercase">Tom Granger</h1>
          <p className="text-[#006C50] font-bold text-[10px] tracking-widest mb-6 uppercase">Product Owner — Energy &amp; Billing</p>
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Experience</h3>
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-1">
              <p className="font-bold text-xs text-[#10294D]">Product Owner — UK Energy SaaS</p>
              <p className="text-[8px] text-slate-400 italic">2024 — Present</p>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">Owns PAYG &amp; B2B billing product; initiated a cross-functional triage model that cut average P3/P4 resolution times by 50%...</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- Main Dashboard ---------------- */

export default function CareerOpsDashboard() {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState('pipeline');
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
  const [configStatus, setConfigStatus] = useState({ loading: true, has_config: false });
  const [profileData, setProfileData] = useState({ name: '', current_role: '', min_salary: 0, target_roles: [] });
  const [anchorsData, setAnchorsData] = useState([]);
  const [weightsData, setWeightsData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Analysed roles + tailored CV library, loaded from Firestore. No demo data.
  const [pipeline, setPipeline] = useState([]);
  const [cvLibrary, setCvLibrary] = useState([]);
  const [tailoring, setTailoring] = useState(false);

  useEffect(() => {
    if (currentTenant?.id) {
      checkConfig();
      loadAnalyses();
      loadCvs();
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
      if (!res.ok) throw new Error(data.error || 'Tailoring failed');
      setResults((r) => ({ ...r, tailored_cv: data.tailored_cv }));
      loadAnalyses();
      loadCvs();
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
    { id: 'settings', label: 'Config', icon: '⚙️' },
  ];

  async function handleAnalyse() {
    if (!jdText.trim() || !currentTenant?.id) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/stea/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyse', 
          jd_text: jdText,
          tenantId: currentTenant.id 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analyse failed');
      setResults(data);
      loadAnalyses(); // refresh the pipeline with the newly-saved role
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (tenantLoading || configStatus.loading) {
    return <div className="p-10 text-center text-slate-500 font-medium">Initialising Career Ops...</div>;
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Tab navigation (in-page state — no routes, no 404 prefetch) */}
      <nav className="bg-slate-100/70 rounded-2xl p-1.5 flex flex-wrap gap-1">
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

      {/* Role Input Terminal */}
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

      {/* Analysis Results View */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Fit Diagnostic</h3>
              <FitGauge score={typeof results.score === 'number' ? results.score : 0} />
            </div>
            <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3">
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
            <FitNarrative markdown={results.evaluation} />

            {/* Proceed-to-apply: generate a role-tailored CV */}
            {results.id && (
              <div className="mt-8 pt-6 border-t border-slate-200">
                {!results.tailored_cv ? (
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
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-[#10294D] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#006C50]">description</span>
                        Tailored CV
                      </h4>
                      <button
                        onClick={() => navigator.clipboard?.writeText(results.tailored_cv)}
                        className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                      <FitNarrative markdown={results.tailored_cv} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3">Saved to your CV library (CV Tailoring tab). Review and edit before sending — never submit unchecked.</p>
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
                    <td className="px-6 py-5 text-right">
                      <button className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline" onClick={(e) => { e.stopPropagation(); openAnalysis(item.id); }}>View</button>
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
        <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <ScanControlPanel />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                <div className="text-[#006C50] font-bold text-2xl tracking-tighter">0</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#006C50]/70">Roles Analysed</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="text-[#10294D] font-bold text-2xl tracking-tighter">0</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#10294D]/70">Top Matches</div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-8">
            <TerminalOutput />
            <DiscoveryInbox />
          </div>
        </div>
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
                      <button onClick={() => navigator.clipboard?.writeText(cv.tailored_cv)} className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest hover:underline">Copy CV</button>
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

           <CvPreviewer />
        </section>
      )}

    </div>
  );
}
