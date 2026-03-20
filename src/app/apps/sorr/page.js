const principles = [
  {
    title: 'Structured Context',
    body:
      'Every project starts with a clear operating context: scope, constraints, goals, architecture, and the current truth state.',
  },
  {
    title: 'Reasoning Traceability',
    body:
      'Important decisions, trade-offs, assumptions, and findings are recorded so work can be understood, reviewed, and continued safely.',
  },
  {
    title: 'Execution Guardrails',
    body:
      'Agents and humans work within explicit constraints, reducing drift, rework, hallucination, and undocumented changes.',
  },
  {
    title: 'Continuous Learning',
    body:
      'New findings flow back into the record so future work starts smarter, faster, and with less repeated context loading.',
  },
];

const docs = [
  {
    name: 'README',
    desc: 'Project purpose, current state, operating model, and how to enter the workspace safely.',
  },
  {
    name: 'DECISIONS.md',
    desc: 'Key trade-offs, architectural choices, and why specific paths were taken.',
  },
  {
    name: 'FINDINGS.md',
    desc: 'Observed behaviours, experiments, insights, and evidence gathered during delivery.',
  },
  {
    name: 'AI_CONSTRAINTS.md',
    desc: 'Rules for agent behaviour, allowed actions, hard stops, and truth-handling requirements.',
  },
  {
    name: 'CURRENT_STATE.md',
    desc: 'What is actually built, what is missing, what is blocked, and what should happen next.',
  },
  {
    name: 'TESTING.md',
    desc: 'How validation works, what has been tested, what failed, and what remains unverified.',
  },
];

const outcomes = [
  {
    title: 'Less drift',
    body: 'Teams and agents stop reinventing the same context on every session.',
  },
  {
    title: 'Cleaner handovers',
    body: 'Work can move between people, tools, and models without losing the thread.',
  },
  {
    title: 'Safer AI execution',
    body: 'Models operate against explicit constraints instead of inferred assumptions.',
  },
  {
    title: 'Audit-ready history',
    body: 'Decisions, evidence, and changes are easier to inspect after the fact.',
  },
];

const steps = [
  {
    n: '1',
    title: 'Define the operating context',
    body:
      'Capture project scope, objectives, constraints, current status, and known truths before work begins.',
  },
  {
    n: '2',
    title: 'Document decisions and findings',
    body: 'Record meaningful choices, learnings, dead ends, and evidence as the project evolves.',
  },
  {
    n: '3',
    title: 'Constrain execution',
    body:
      'Give agents and collaborators clear rules for what they can do, what they must read, and when they should stop.',
  },
  {
    n: '4',
    title: 'Update the record continuously',
    body:
      'Feed new truth back into the system so future work starts from reality, not memory or guesswork.',
  },
  {
    n: '5',
    title: 'Scale with confidence',
    body:
      'Reuse the pattern across products, experiments, and teams without losing consistency or control.',
  },
];

const excerpts = [
  {
    doc: 'README.md',
    heading: 'Core Principle',
    text: 'Parallelise execution, never parallelise truth.',
  },
  {
    doc: 'AI_CONSTRAINTS.md',
    heading: 'Rules',
    text: 'Do not act without reading CURRENT_STATE.md. Do not invent missing context. Stop if uncertainty is high.',
  },
  {
    doc: 'CURRENT_STATE.md',
    heading: 'Required Sections',
    text: 'What Exists, In Progress, Blockers, and Next Actions are tracked so work starts from current reality.',
  },
  {
    doc: 'DECISIONS.md',
    heading: 'Log Format',
    text: 'Date | Decision | Rationale | Impact',
  },
];

export default function SorrPublicOverviewPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <header className="sticky top-4 z-20 mb-10 rounded-full border border-zinc-300 bg-zinc-800 px-5 py-3 text-sm text-white shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs text-zinc-800">S</div>
              <span>ArcturusDC</span>
            </div>
            <a
              href="#example-structure"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/20"
            >
              View Example Structure
            </a>
          </div>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white px-8 py-12 shadow-sm lg:px-12">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600">
                System of Record for Reasoning
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-900 lg:text-6xl">SoRR</h1>
              <p className="mt-4 text-lg text-zinc-600 lg:text-xl">Context. Constraints. Decisions. Traceability.</p>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 lg:text-lg">
                A structured operating layer for human and AI collaboration. SoRR keeps projects grounded in explicit truth,
                reduces execution drift, and makes decisions, evidence, and constraints durable across every session.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#example-structure" className="rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white">
                  Explore SoRR
                </a>
                <a
                  href="#example-structure"
                  className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-semibold text-zinc-700 hover:bg-zinc-100"
                >
                  View Example Structure
                </a>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-zinc-100 p-5">
              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
                {['README.md', 'CURRENT_STATE.md', 'DECISIONS.md', 'FINDINGS.md', 'AI_CONSTRAINTS.md', 'TESTING.md'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <span className="font-medium text-zinc-700">{item}</span>
                    <span className="text-xs text-zinc-500">live</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 py-14">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 lg:text-4xl">Why SoRR</h2>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            Most delivery problems are not caused by a lack of tools. They come from missing context, hidden assumptions,
            undocumented decisions, and agents acting without clear boundaries.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {principles.map((item) => (
              <div key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white px-8 py-12 shadow-sm lg:px-12">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 lg:text-4xl">Meet the Record</h2>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            A practical SoRR implementation is made of small, durable documents that define how work should happen and what is true right now.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((doc) => (
              <div key={doc.name} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Core Document</p>
                <h3 className="mt-2 text-xl font-black text-zinc-900">{doc.name}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{doc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="example-structure" className="px-2 py-14 scroll-mt-24">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 lg:text-4xl">Example Structure</h2>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            Excerpts from a sample SoRR docs set. This is intentionally selective rather than a full dump.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {excerpts.map((item) => (
              <article key={item.doc} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{item.doc}</p>
                <h3 className="mt-2 text-lg font-bold text-zinc-900">{item.heading}</h3>
                <blockquote className="mt-3 rounded-lg border-l-4 border-zinc-300 bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700">
                  {item.text}
                </blockquote>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white px-8 py-12 shadow-sm lg:px-12">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 lg:text-4xl">How It Works</h2>
          <div className="mt-8 space-y-6">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-black text-zinc-800">
                  {step.n}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-2 py-14">
          <div className="rounded-3xl border border-zinc-200 bg-white px-8 py-12 text-center shadow-sm lg:px-12">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 lg:text-4xl">Ready to make reasoning durable?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-600">
              Use SoRR to ground product work, documentation, AI-assisted delivery, and multi-agent execution in a shared source of truth.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button className="rounded-xl bg-zinc-900 px-5 py-3 font-semibold text-white">Book a Demo</button>
              <a
                href="#example-structure"
                className="rounded-xl border border-zinc-300 bg-zinc-100 px-5 py-3 font-semibold text-zinc-700 hover:bg-zinc-200"
              >
                See Example Docs
              </a>
            </div>
          </div>
        </section>

        <section className="px-2 pb-12">
          <div className="rounded-3xl border border-zinc-200 bg-white px-8 py-10 shadow-sm lg:px-12">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Outcomes</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {outcomes.map((item) => (
                <div key={item.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                  <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
