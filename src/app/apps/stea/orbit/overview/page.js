import Link from 'next/link';

export const metadata = {
  title: 'STEa + Orbit Overview - Human-AI Accountability Framework',
  description: 'A three-layer accountability framework that captures intent, bounds AI actions, and proves provenance with Orbit.',
  alternates: {
    canonical: 'https://www.arcturusdc.com/apps/stea/orbit/overview',
  },
  openGraph: {
    title: 'STEa + Orbit Overview - Human-AI Accountability Framework',
    description: 'A three-layer accountability framework that captures intent, bounds AI actions, and proves provenance with Orbit.',
    url: 'https://www.arcturusdc.com/apps/stea/orbit/overview',
    images: ['https://www.arcturusdc.com/img/acturusdc_stea_logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STEa + Orbit Overview - Human-AI Accountability Framework',
    description: 'A three-layer accountability framework that captures intent, bounds AI actions, and proves provenance with Orbit.',
    images: ['https://www.arcturusdc.com/img/acturusdc_stea_logo.png'],
  },
};

const problemQuestions = [
  {
    title: 'Which rules applied to this output?',
    description: 'Policies live across wikis, PDFs, and tribal knowledge. The answers are scattered and untraceable.',
    accent: 'text-rose-600',
    border: 'border-rose-200',
    bg: 'from-rose-50 to-orange-50',
  },
  {
    title: 'Who approved it?',
    description: 'Logs show activity, not intent. Approvals are often informal, invisible, or impossible to reconstruct.',
    accent: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'from-amber-50 to-yellow-50',
  },
  {
    title: 'What did we believe at the time?',
    description: 'Post-hoc narratives erase uncertainty. Without capture, belief is impossible to prove.',
    accent: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'from-emerald-50 to-lime-50',
  },
  {
    title: 'Can we prove it later?',
    description: 'If you cannot answer the three questions above, you cannot answer this one either.',
    accent: 'text-sky-700',
    border: 'border-sky-200',
    bg: 'from-sky-50 to-blue-50',
  },
];

const architecture = [
  {
    label: 'Input',
    title: 'Company Guidance',
    subtitle: 'Messy, human, real',
    description: 'Data rules, AI usage policy, regulatory requirements. Lives in Confluence, PDFs, SharePoint, or tribal knowledge.',
    accent: 'text-neutral-700',
    border: 'border-neutral-200',
    bg: 'from-neutral-50 to-zinc-50',
  },
  {
    label: 'Layer 1',
    title: 'STEa',
    subtitle: 'Intent + Context',
    description: 'Human-authored planning artefacts that declare what you are doing, under which rules, with what uncertainty.',
    accent: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'from-amber-50 to-orange-50',
  },
  {
    label: 'Layer 2',
    title: 'LLMs / Agents',
    subtitle: 'Capability',
    description: 'Generate, analyse, suggest, accelerate. Only within declared constraints. Do not infer policy or resolve ambiguity.',
    accent: 'text-indigo-700',
    border: 'border-indigo-200',
    bg: 'from-indigo-50 to-violet-50',
  },
  {
    label: 'Layer 3',
    title: 'Orbit',
    subtitle: 'Proof',
    description: 'Immutable record of constraints, planning snapshot, outputs, and approvals. No data, only hashes.',
    accent: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'from-emerald-50 to-teal-50',
  },
];

const principles = [
  {
    title: 'Start messy',
    description: 'No policy cleanup required. Declare what you believe applies now and make uncertainty visible.',
  },
  {
    title: 'Prove belief, not compliance',
    description: 'Record what you believed at time of action. Divergence from policy becomes a signal.',
  },
  {
    title: 'Bound action, not cognition',
    description: 'Enforce constraints through system architecture. Do not rely on AI to understand rules.',
  },
  {
    title: 'Degrade gracefully',
    description: 'Partial adoption still produces value. Works with incomplete truth.',
  },
];

const stages = [
  {
    title: 'Stage 1: Intent Capture',
    duration: '4-6 weeks',
    focus: 'Validate STEa as a thinking tool, without AI.',
    scope: 'Apply to transformation programme decisions: domain splits, team structures, role ownership.',
    artefacts: 'START_HERE.md, CONTEXT.md, DECLARED_STRUCTURE.md, DECISIONS.md',
    success: 'Teams refer back to artefacts unprompted; disagreements shift from "you said" to "the assumption was".',
    kill: 'Teams refuse to fill in artefacts; artefacts are perfunctory; no one refers back.',
  },
  {
    title: 'Stage 2: Bounded AI',
    duration: '4-6 weeks',
    focus: 'Validate constraint enforcement with real AI use.',
    scope: 'Low-risk internal tool: code generation, doc drafting, data analysis.',
    artefacts: 'STEa constraints shape prompts, gate data access, and require approvals.',
    success: 'AI operates within declared bounds; violations are caught; teams can explain what rules applied.',
    kill: 'Enforcement too brittle; constraints ignored; overhead exceeds value.',
  },
  {
    title: 'Stage 3: Provable Provenance',
    duration: '4-6 weeks',
    focus: 'Validate Orbit as the proof layer.',
    scope: 'Add immutable recording to Stage 2 project.',
    artefacts: 'Hash planning snapshots, constraints, outputs, and approvals with identities + timestamps.',
    success: 'Can answer "what rules applied?" and "who approved?" for any AI output.',
    kill: 'Proof layer adds friction without value; auditors do not find it useful.',
  },
];

const timeline = [
  { stage: '1. Intent Capture', duration: '4-6 weeks', risk: 'None', value: 'Decision traceability' },
  { stage: '2. Bounded AI', duration: '4-6 weeks', risk: 'Low (internal)', value: 'Constraint enforcement' },
  { stage: '3. Provenance', duration: '4-6 weeks', risk: 'Low (internal)', value: 'Audit-ready proof' },
];

export default function SteaOrbitOverviewPage() {
  return (
    <main className="min-h-screen bg-starburst">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/apps/stea/orbit" className="text-sm text-neutral-600 hover:text-neutral-900">
              &larr; Back to Orbit
            </Link>
            <div className="h-6 w-px bg-neutral-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Framework Overview</p>
              <h1 className="text-2xl font-bold text-neutral-900">STEa + Orbit</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
              Human-AI Accountability
            </span>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 mb-4">A Human-AI Accountability Framework</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 leading-tight mb-6">
            Making AI governance practical
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-indigo-600 to-emerald-600">
              without waiting for perfect policies
            </span>
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            STEa captures intent and context. Orbit proves provenance. Together they make AI accountability tangible
            for teams that still operate with messy, incomplete policy landscapes.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h3 className="text-3xl font-bold text-neutral-900 mb-3">The Problem</h3>
          <p className="text-neutral-600">
            Most organisations cannot reliably answer basic questions about their AI use.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {problemQuestions.map((item) => (
            <div
              key={item.title}
              className={`bg-gradient-to-br ${item.bg} border ${item.border} rounded-2xl p-6`}
            >
              <h4 className={`text-xl font-semibold ${item.accent} mb-2`}>{item.title}</h4>
              <p className="text-neutral-700">{item.description}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-neutral-600 mt-8">
          Logs, policies, and post-hoc narratives do not answer these questions. This framework does.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h3 className="text-3xl font-bold text-neutral-900 mb-3">The Solution</h3>
          <p className="text-neutral-600">
            A three-layer architecture that creates accountability without requiring policy cleanup first.
          </p>
        </div>
        <div className="grid gap-6">
          {architecture.map((layer, index) => (
            <div
              key={layer.title}
              className={`bg-gradient-to-br ${layer.bg} border ${layer.border} rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">{layer.label}</p>
                <h4 className={`text-2xl font-semibold ${layer.accent}`}>
                  {layer.title}
                  <span className="text-sm font-medium text-neutral-500"> - {layer.subtitle}</span>
                </h4>
                <p className="text-neutral-700 mt-3 max-w-2xl">{layer.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-neutral-900 text-white rounded-3xl p-10 md:p-12">
          <p className="text-2xl md:text-3xl font-semibold leading-tight">
            "We cannot prevent all mistakes. We can prove what we believed, what rules we applied, and who was
            responsible when they occurred."
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h3 className="text-3xl font-bold text-neutral-900 mb-3">Key Principles</h3>
          <p className="text-neutral-600">
            The framework is intentionally pragmatic, allowing teams to start immediately and evolve.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle.title} className="border border-neutral-200 bg-white/80 rounded-2xl p-6">
              <h4 className="text-xl font-semibold text-neutral-900 mb-2">{principle.title}</h4>
              <p className="text-neutral-600">{principle.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h3 className="text-3xl font-bold text-neutral-900 mb-3">Three-Stage Proof of Concept</h3>
          <p className="text-neutral-600">
            Each stage validates a layer independently before combining them.
          </p>
        </div>
        <div className="grid gap-6">
          {stages.map((stage) => (
            <div key={stage.title} className="border border-neutral-200 bg-white/80 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h4 className="text-2xl font-semibold text-neutral-900">{stage.title}</h4>
                <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium">
                  {stage.duration}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 text-sm text-neutral-700">
                <div>
                  <p className="font-semibold text-neutral-900">Focus</p>
                  <p>{stage.focus}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Scope</p>
                  <p>{stage.scope}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Mechanism</p>
                  <p>{stage.artefacts}</p>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">Success</p>
                  <p>{stage.success}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-neutral-900">Kill criteria</p>
                  <p>{stage.kill}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="border border-neutral-200 bg-white/90 rounded-2xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="text-2xl font-semibold text-neutral-900">Timeline Summary</h3>
            <span className="text-sm text-neutral-500">Total timeline: 12-18 weeks</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-500 uppercase tracking-[0.2em] text-xs">
                <tr className="border-b border-neutral-200">
                  <th className="py-3 pr-4">Stage</th>
                  <th className="py-3 pr-4">Duration</th>
                  <th className="py-3 pr-4">AI Risk</th>
                  <th className="py-3">Primary Value</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((row) => (
                  <tr key={row.stage} className="border-b border-neutral-100 last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-neutral-900">{row.stage}</td>
                    <td className="py-3 pr-4">{row.duration}</td>
                    <td className="py-3 pr-4">{row.risk}</td>
                    <td className="py-3">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-neutral-600 mt-6">
            Each stage has independent value. If Stage 1 fails, you learn quickly at minimal cost. If it succeeds,
            you have momentum and evidence for Stage 2 and beyond.
          </p>
        </div>
      </section>
    </main>
  );
}
