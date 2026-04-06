'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';

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
      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider">4 CHANGES DETECTED</span>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-200">
      <div className="bg-white p-6">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Master CV (Base)
        </h3>
        <div className="space-y-4">
          <div className="p-3 border-l-2 border-slate-100 opacity-40 italic text-xs leading-relaxed text-slate-500">
            Led a cross-functional team of 15 designers to launch the 2.0 version of the flagship platform.
          </div>
          <div className="p-3 border-l-2 border-[#10294D] bg-slate-50 rounded-r text-xs font-medium text-[#10294D] leading-relaxed">
            Pioneered AI-driven analytics feature that increased user retention by 34% within the first quarter.
          </div>
        </div>
      </div>
      <div className="bg-white p-6">
        <h3 className="text-[10px] font-bold text-[#006C50] uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006C50]"></span> Tailored Version
        </h3>
        <div className="space-y-4">
          <div className="p-3 border-l-2 border-[#006C50] bg-teal-50/50 rounded-r relative text-xs leading-relaxed">
            <div className="absolute -left-2 top-3 bg-[#006C50] text-white rounded-full w-4 h-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
            </div>
            <p className="font-bold text-[#006C50]">Pioneered AI-driven analytics feature that increased user retention by 34% within the first quarter.</p>
            <span className="text-[9px] text-[#006C50]/70 font-bold mt-1 block uppercase tracking-tighter">RANKED #1 - HIGH KEYWORD MATCH</span>
          </div>
          <div className="p-3 border-l-2 border-slate-100 text-xs leading-relaxed text-slate-600">
            Led a cross-functional team of 15 designers to launch the 2.0 version of the flagship platform.
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CoverNoteDrafter = () => (
  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-bold text-[#10294D] text-lg tracking-tight">Cover Note Drafter</h2>
        <p className="text-xs text-slate-400 mt-0.5">AI-generated focus: <span className="font-bold text-slate-600">Strategic Leadership</span></p>
      </div>
      <div className="flex gap-2">
        <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-xl">autorenew</span>
        </button>
        <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-xl">content_copy</span>
        </button>
      </div>
    </div>
    <div className="bg-slate-50 rounded-xl p-6 text-sm text-slate-600 leading-relaxed font-medium">
      <p className="mb-4">Dear Hiring Manager,</p>
      <p className="mb-4 italic">"I was immediately drawn to the Senior Product Lead role. My experience pioneering AI-driven analytics features—which directly resulted in a 34% increase in user retention—aligns perfectly with your mission to redefine data interpretation through automated intelligence..."</p>
      <p>I look forward to discussing how my background can contribute to your continued success.</p>
    </div>
    <div className="mt-6 flex justify-end gap-3">
      <button className="px-5 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs">Regenerate</button>
      <button className="px-5 py-2 bg-[#10294D] text-white font-bold rounded-xl hover:bg-[#001432] transition-colors text-xs">Copy Note</button>
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
      <p><span className="text-[#53FDC7] opacity-70">info</span> [14:02:11] Initialising Discovery session...</p>
      <p><span className="text-[#53FDC7] opacity-70">info</span> [14:02:12] Authenticated via OAuth 2.0 (Token: Arct_***_91)</p>
      <p><span className="text-[#53FDC7] opacity-70">info</span> [14:02:15] Scanning keywords: "Platform PM", "Lead Product", "FinTech"</p>
      <p><span className="text-orange-300">warn</span> [14:02:22] Rate limit approaching (78/100). Throttling enabled.</p>
      <p className="text-white font-bold"><span className="text-[#53FDC7]">find</span> [14:02:28] Matched Role: Senior Infrastructure Lead @ Vercel (Score: 4.8)</p>
      <p className="text-white font-bold"><span className="text-[#53FDC7]">find</span> [14:02:31] Matched Role: Principal PM @ Stripe (Score: 4.6)</p>
      <p><span className="text-blue-300 animate-pulse">_</span></p>
    </div>
    <div className="px-6 py-2 bg-[#10294D]/30 border-t border-white/5 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#53FDC7] rounded-full animate-ping"></span>
      <span className="text-[9px] font-mono text-blue-300 uppercase font-bold tracking-widest">SCANNING PORT 8080 - 1.2MB/s</span>
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
      {[
        { company: 'Linear', role: 'Senior Product Engineer', match: '94%', time: '2m ago', logo: 'L' },
        { company: 'Retool', role: 'Head of Infrastructure', match: '88%', time: '14m ago', logo: 'R' },
        { company: 'Datadog', role: 'Distributed Systems Lead', match: '81%', time: '45m ago', logo: 'D' },
      ].map((job, i) => (
        <div key={i} className={`group bg-white p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-[#006C50]/20 transition-all cursor-pointer shadow-sm ${i === 2 ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm">
              {job.logo}
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#10294D] group-hover:text-[#006C50] transition-colors">{job.role}</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>{job.company}</span>
                <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                <span>Remote (UK)</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-bold text-[#006C50] uppercase tracking-tighter">{job.match} Match</div>
              <div className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">{job.time}</div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-slate-400">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <button className="p-2 bg-teal-50 text-[#006C50] hover:bg-[#006C50] hover:text-white rounded-lg transition-colors">
                <span className="material-symbols-outlined text-sm">bolt</span>
              </button>
            </div>
          </div>
        </div>
      ))}
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
          placeholder="e.g. David Loake"
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
            placeholder="e.g. Senior Product Manager"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Salary Floor (£)</label>
          <input 
            type="number" 
            value={data?.min_salary || ''} 
            onChange={(e) => onChange({...data, min_salary: e.target.value})}
            className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-[#10294D] focus:ring-2 focus:ring-blue-100"
            placeholder="e.g. 125000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Roles (Comma separated)</label>
        <textarea 
          value={data?.target_roles?.join(', ') || ''} 
          onChange={(e) => onChange({...data, target_roles: e.target.value.split(',').map(s => s.trim())})}
          className="w-full h-24 bg-slate-50 border-none rounded-xl p-4 text-sm font-medium text-[#10294D] focus:ring-2 focus:ring-blue-100 resize-none"
          placeholder="e.g. Lead Product Manager, Principal PM, Platform PM"
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
        <pre># David Loake
## Senior Product Manager

Systems-focused Product Manager with **10+ years** experience...

### Key Anchors
- Payment Adequacy Engine @ ENSEK
- Score Boost @ Experian
- SoRR Framework

### Strengths
`FinTech` `Platform` `Compliance` `AI`
</pre>
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
          <h1 className="text-2xl font-bold text-[#10294D] border-b-2 border-[#10294D] pb-2 mb-4 tracking-tighter uppercase">David Loake</h1>
          <p className="text-[#006C50] font-bold text-[10px] tracking-widest mb-6 uppercase">Senior Product Manager</p>
          <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Experience</h3>
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-1">
              <p className="font-bold text-xs text-[#10294D]">ENSEK</p>
              <p className="text-[8px] text-slate-400 italic">2021 — Present</p>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">Pioneered event-driven architectural patterns across the billing core, ensuring 100% regulatory compliance...</p>
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
  const [results, setResults] = useState(null);
  const [configStatus, setConfigStatus] = useState({ loading: true, has_config: false });
  const [profileData, setProfileData] = useState({ name: '', current_role: '', min_salary: 0, target_roles: [] });
  const [anchorsData, setAnchorsData] = useState([]);
  const [weightsData, setWeightsData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Mock data for initial view/demo
  const mockPipeline = [
    { company: 'Nebula Systems', role: 'Principal PM, Platform', score: 4.8, status: 'Interviewing', timeline: 'Round 3: System Design' },
    { company: 'Veridian Finance', role: 'Head of Product, Payments', score: 4.2, status: 'Applied', timeline: 'Pending Review' },
    { company: 'Stellar AI', role: 'Senior PM, Data Governance', score: 3.9, status: 'Shortlisted', timeline: 'Awaiting Feedback' },
  ];

  useEffect(() => {
    if (currentTenant?.id) {
      checkConfig();
    }
  }, [currentTenant]);

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
              {loading ? 'Analysing...' : 'Analyse Role'}
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">bolt</span>
            </button>
          </div>
        </div>
      </section>

      {/* Analysis Results View */}
      {results && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-4 bg-white rounded-2xl p-8 border border-slate-200 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Fit Diagnostic</h3>
              <FitGauge score={results.jd_data?.score || 4.2} />
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
            <div className="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap">
              {results.evaluation}
            </div>
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
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">Timeline</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mockPipeline.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {item.company[0]}
                        </div>
                        <div>
                          <p className="font-bold text-[#10294D] text-sm">{item.company}</p>
                          <p className="text-xs text-slate-400">{item.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono font-bold text-[#006C50]">{item.score.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        item.status === 'Interviewing' ? 'bg-green-100 text-green-700' : 
                        item.status === 'Applied' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-semibold text-slate-600">{item.timeline}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-slate-300 hover:text-slate-600 transition-colors">•••</button>
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
                <div className="text-[#006C50] font-bold text-2xl tracking-tighter">482</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[#006C50]/70">Roles Analysed</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="text-[#10294D] font-bold text-2xl tracking-tighter">14</div>
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
        <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <CvComparisonView />
            <CoverNoteDrafter />
          </div>

          <aside className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-[#10294D] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 flex items-center justify-between border-b border-white/10">
                <h3 className="text-white/50 font-bold text-[10px] uppercase tracking-widest">Portal Metadata</h3>
                <span className="text-[10px] bg-[#006C50] text-white px-2 py-0.5 rounded-full font-bold">READY</span>
              </div>
              <div className="p-6">
                <div className="bg-[#001432] rounded-xl p-4 font-mono text-[10px] text-blue-200 leading-relaxed overflow-x-auto no-scrollbar">
                  <pre>{JSON.stringify({
                    "application_id": "STEA-2026-PM",
                    "expected_salary": "£125,000",
                    "notice_period": "30_days",
                    "location": "Remote / UK",
                    "key_anchors": ["ENSEK", "Experian", "SoRR"]
                  }, null, 2)}</pre>
                </div>
                <button className="w-full mt-4 text-blue-100 text-[10px] font-bold flex items-center justify-center gap-2 py-2 hover:text-white transition-colors uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copy Metadata
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="font-bold text-[#10294D] mb-4 text-sm">Final Polish Checklist</h3>
              <div className="space-y-4">
                {[
                  { label: 'ATS Keyword Check', sub: '92% Match with "Product Operations"' },
                  { label: 'Tone Analysis', sub: 'Confidence: High | Sentiment: Professional' },
                  { label: 'Formatting Export', sub: 'A4 Standard - 2 Pages' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-[#006C50]">
                      <span className="material-symbols-outlined text-xs font-bold">check</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#10294D]">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
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
