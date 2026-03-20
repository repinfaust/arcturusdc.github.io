export default function SorrPublicOverviewPage() {
  const principles = [
    {
      title: "Structured Context",
      body:
        "Every project starts with a clear operating context: scope, constraints, goals, architecture, and the current truth state.",
      accent: "from-amber-500 to-orange-500",
      border: "border-amber-200",
      text: "text-amber-600",
    },
    {
      title: "Reasoning Traceability",
      body:
        "Important decisions, trade-offs, assumptions, and findings are recorded so work can be understood, reviewed, and continued safely.",
      accent: "from-violet-500 to-fuchsia-500",
      border: "border-violet-200",
      text: "text-violet-600",
    },
    {
      title: "Execution Guardrails",
      body:
        "Agents and humans work within explicit constraints, reducing drift, rework, hallucination, and undocumented changes.",
      accent: "from-emerald-500 to-teal-500",
      border: "border-emerald-200",
      text: "text-emerald-600",
    },
    {
      title: "Continuous Learning",
      body:
        "New findings flow back into the record so future work starts smarter, faster, and with less repeated context loading.",
      accent: "from-rose-500 to-pink-500",
      border: "border-rose-200",
      text: "text-rose-600",
    },
  ];

  const docs = [
    {
      name: "README",
      desc: "Project purpose, current state, operating model, and how to enter the workspace safely.",
      color: "text-amber-600",
      border: "border-amber-200",
      bg: "bg-amber-50/70",
    },
    {
      name: "DECISIONS.md",
      desc: "Key trade-offs, architectural choices, and why specific paths were taken.",
      color: "text-violet-600",
      border: "border-violet-200",
      bg: "bg-violet-50/70",
    },
    {
      name: "FINDINGS.md",
      desc: "Observed behaviours, experiments, insights, and evidence gathered during delivery.",
      color: "text-emerald-600",
      border: "border-emerald-200",
      bg: "bg-emerald-50/70",
    },
    {
      name: "AI_CONSTRAINTS.md",
      desc: "Rules for agent behaviour, allowed actions, hard stops, and truth-handling requirements.",
      color: "text-rose-600",
      border: "border-rose-200",
      bg: "bg-rose-50/70",
    },
    {
      name: "CURRENT_STATE.md",
      desc: "What is actually built, what is missing, what is blocked, and what should happen next.",
      color: "text-sky-600",
      border: "border-sky-200",
      bg: "bg-sky-50/70",
    },
    {
      name: "TESTING.md",
      desc: "How validation works, what has been tested, what failed, and what remains unverified.",
      color: "text-orange-600",
      border: "border-orange-200",
      bg: "bg-orange-50/70",
    },
  ];

  const outcomes = [
    {
      title: "Less drift",
      body: "Teams and agents stop reinventing the same context on every session.",
      icon: "↺",
      text: "text-amber-600",
    },
    {
      title: "Cleaner handovers",
      body: "Work can move between people, tools, and models without losing the thread.",
      icon: "⇄",
      text: "text-violet-600",
    },
    {
      title: "Safer AI execution",
      body: "Models operate against explicit constraints instead of inferred assumptions.",
      icon: "⚡",
      text: "text-emerald-600",
    },
    {
      title: "Audit-ready history",
      body: "Decisions, evidence, and changes are easier to inspect after the fact.",
      icon: "▣",
      text: "text-rose-600",
    },
  ];

  const steps = [
    {
      n: "1",
      title: "Define the operating context",
      body:
        "Capture project scope, objectives, constraints, current status, and known truths before work begins.",
      color: "text-amber-700",
      ring: "ring-amber-200",
      bg: "bg-amber-50",
    },
    {
      n: "2",
      title: "Document decisions and findings",
      body:
        "Record meaningful choices, learnings, dead ends, and evidence as the project evolves.",
      color: "text-violet-700",
      ring: "ring-violet-200",
      bg: "bg-violet-50",
    },
    {
      n: "3",
      title: "Constrain execution",
      body:
        "Give agents and collaborators clear rules for what they can do, what they must read, and when they should stop.",
      color: "text-emerald-700",
      ring: "ring-emerald-200",
      bg: "bg-emerald-50",
    },
    {
      n: "4",
      title: "Update the record continuously",
      body:
        "Feed new truth back into the system so future work starts from reality, not memory or guesswork.",
      color: "text-rose-700",
      ring: "ring-rose-200",
      bg: "bg-rose-50",
    },
    {
      n: "5",
      title: "Scale with confidence",
      body:
        "Reuse the pattern across products, experiments, and teams without losing consistency or control.",
      color: "text-orange-700",
      ring: "ring-orange-200",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-zinc-800">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="sticky top-4 z-20 mx-auto mb-10 flex max-w-5xl items-center justify-between rounded-full bg-[#5a5a5a] px-5 py-3 text-sm text-white shadow-xl shadow-black/10">
          <div className="flex items-center gap-3 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs text-[#d46f1b] shadow-sm">
              ✦
            </div>
            <span>ArcturusDC</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a className="text-white/85 transition hover:text-white" href="#">Home</a>
            <a className="text-white/85 transition hover:text-white" href="#">Apps</a>
            <a className="text-white/85 transition hover:text-white" href="#">Capabilities</a>
            <a className="border-b border-white pb-0.5 text-white" href="#">SoRR</a>
            <a className="text-white/85 transition hover:text-white" href="#">Contact</a>
          </div>
          <button className="rounded-xl bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] px-5 py-2 font-semibold text-white shadow-lg shadow-purple-200/30">
            Enquire
          </button>
        </div>

        <section className="rounded-[28px] border border-zinc-200 bg-white px-8 py-12 shadow-sm lg:px-14 lg:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 ring-1 ring-zinc-200">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] text-xs font-bold text-white">
                  S
                </span>
                <span>System of Record for Reasoning</span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-zinc-900 lg:text-6xl">
                SoRR
              </h1>
              <p className="mt-3 text-xl font-semibold text-zinc-700 lg:text-2xl">
                Context • Constraints • Decisions • Traceability
              </p>
              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 lg:text-lg">
                A structured operating layer for human and AI collaboration. SoRR keeps projects grounded in explicit truth,
                reduces execution drift, and makes decisions, evidence, and constraints durable across every session.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-2xl bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] px-6 py-3 font-semibold text-white shadow-lg shadow-violet-200/40">
                  Explore SoRR
                </button>
                <button className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-100">
                  View Example Structure
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-zinc-200 bg-zinc-50 p-6 shadow-inner">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-300" />
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <div className="h-3 w-3 rounded-full bg-emerald-300" />
                </div>
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
                  {[
                    "README.md",
                    "CURRENT_STATE.md",
                    "DECISIONS.md",
                    "FINDINGS.md",
                    "AI_CONSTRAINTS.md",
                    "TESTING.md",
                  ].map((item, idx) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${[
                            "bg-amber-400",
                            "bg-sky-400",
                            "bg-violet-400",
                            "bg-emerald-400",
                            "bg-rose-400",
                            "bg-orange-400",
                          ][idx]}`}
                        />
                        <span className="font-medium text-zinc-700">{item}</span>
                      </div>
                      <span className="text-xs text-zinc-400">live</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-5 -left-4 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-lg">
                <p className="text-sm font-semibold text-amber-700">Truth first</p>
                <p className="text-xs text-zinc-500">Parallelise execution, never truth.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 py-16">
          <h2 className="text-4xl font-black tracking-tight text-zinc-900">
            Why <span className="bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] bg-clip-text text-transparent">SoRR</span>
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            Most delivery problems are not caused by a lack of tools. They come from missing context, hidden assumptions,
            undocumented decisions, and agents acting without clear boundaries.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {principles.map((item) => (
              <div
                key={item.title}
                className={`rounded-[24px] border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.border}`}
              >
                <div className={`mb-5 h-11 w-11 rounded-2xl bg-gradient-to-r ${item.accent} shadow-sm`} />
                <h3 className={`text-xl font-bold ${item.text}`}>{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-zinc-200 bg-white px-8 py-14 shadow-sm lg:px-12">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">
              Meet the <span className="bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] bg-clip-text text-transparent">Record</span>
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-600">
              A practical SoRR implementation is made of small, durable documents that define how work should happen and what is true right now.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((doc) => (
              <div key={doc.name} className={`rounded-[24px] border p-6 ${doc.border} ${doc.bg}`}>
                <p className={`text-sm font-bold uppercase tracking-[0.18em] ${doc.color}`}>Core Document</p>
                <h3 className="mt-3 text-2xl font-black text-zinc-900">{doc.name}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-600">{doc.desc}</p>
                <div className={`mt-6 text-sm font-semibold ${doc.color}`}>Included in the reasoning layer →</div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-2 py-16">
          <div className="rounded-[28px] border border-zinc-200 bg-white px-8 py-14 shadow-sm lg:px-12">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-zinc-900">
                The <span className="bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] bg-clip-text text-transparent">Operating Loop</span>
              </h2>
              <p className="mt-4 text-lg text-zinc-600">Truth is captured, used, challenged, updated, and reused.</p>
            </div>

            <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="relative mx-auto flex h-[420px] w-full max-w-[520px] items-center justify-center">
                <div className="absolute h-[310px] w-[310px] rounded-full border-[3px] border-dashed border-zinc-300" />

                <div className="absolute top-2 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center shadow-sm">
                  <div className="font-bold text-amber-700">Context</div>
                  <div className="text-sm text-zinc-600">Goals • Constraints • Scope</div>
                </div>

                <div className="absolute right-0 rounded-2xl border border-violet-200 bg-violet-50 px-6 py-4 text-center shadow-sm">
                  <div className="font-bold text-violet-700">Execution</div>
                  <div className="text-sm text-zinc-600">Humans • Agents • Delivery</div>
                </div>

                <div className="absolute bottom-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center shadow-sm">
                  <div className="font-bold text-emerald-700">Evidence</div>
                  <div className="text-sm text-zinc-600">Tests • Findings • Outcomes</div>
                </div>

                <div className="absolute left-0 rounded-2xl border border-orange-200 bg-orange-50 px-6 py-4 text-center shadow-sm">
                  <div className="font-bold text-orange-700">Feedback</div>
                  <div className="text-sm text-zinc-600">Corrections • Updates • Retest</div>
                </div>

                <div className="z-10 rounded-[28px] border border-rose-200 bg-rose-50 px-8 py-7 text-center shadow-sm">
                  <div className="text-2xl font-black text-rose-600">SoRR</div>
                  <div className="mt-2 text-sm text-zinc-600">Reasoning Backbone</div>
                </div>

                <div className="absolute top-[84px] right-[98px] h-3.5 w-3.5 rounded-full bg-emerald-400" />
                <div className="absolute right-[58px] bottom-[120px] h-3.5 w-3.5 rounded-full bg-violet-400" />
                <div className="absolute bottom-[88px] left-[112px] h-3.5 w-3.5 rounded-full bg-orange-400" />
                <div className="absolute left-[86px] top-[132px] h-3.5 w-3.5 rounded-full bg-rose-400" />
              </div>

              <div className="space-y-5">
                {outcomes.map((item) => (
                  <div key={item.title} className="rounded-[22px] border border-zinc-200 bg-zinc-50 p-5">
                    <div className="flex items-start gap-4">
                      <div className={`text-3xl font-black leading-none ${item.text}`}>{item.icon}</div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-zinc-600">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-2 pb-16">
          <h2 className="text-4xl font-black tracking-tight text-zinc-900">
            How it <span className="text-emerald-600">Works</span>
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600">
            SoRR is intentionally simple. It works because it makes the right information explicit at the right time.
          </p>

          <div className="mt-10 rounded-[28px] border border-zinc-200 bg-white px-8 py-10 shadow-sm lg:px-12">
            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.n} className="flex gap-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-2 ${step.ring} ${step.bg}`}>
                    <span className={`text-lg font-black ${step.color}`}>{step.n}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900">{step.title}</h3>
                    <p className="mt-2 max-w-4xl text-base leading-7 text-zinc-600">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-8">
          <div className="rounded-[28px] border border-zinc-200 bg-white px-8 py-14 text-center shadow-sm lg:px-12">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">
              Ready to make reasoning <span className="bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] bg-clip-text text-transparent">durable</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-600">
              Use SoRR to ground product work, documentation, AI-assisted delivery, and multi-agent execution in a shared source of truth.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button className="rounded-2xl bg-gradient-to-r from-[#d77a16] via-[#7a4df4] to-[#0a9b7d] px-6 py-3 font-semibold text-white shadow-lg shadow-violet-200/40">
                Book a Demo
              </button>
              <button className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-3 font-semibold text-zinc-700">
                See Example Docs
              </button>
            </div>
            <p className="mt-6 text-sm text-zinc-500">SoRR is part of the ArcturusDC product and delivery toolkit.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
