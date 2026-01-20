'use client';

import Link from 'next/link';

export default function ExploreFilo() {
  const features = [
    {
      icon: '📊',
      title: 'Three-Tier Hierarchy',
      tagline: 'Epic → Feature → Card',
      description: 'Not just flat task lists. Organize work in epics (themes), features (capabilities), and cards (user stories). Every level has full context.',
      competitive: 'Jira, Linear, Asana use flat or two-tier structures. Filo\'s three-tier hierarchy maintains strategic alignment from vision to implementation.'
    },
    {
      icon: '✍️',
      title: 'Structured User Stories',
      tagline: 'Complete context, every card',
      description: 'Every card has user story, acceptance criteria, user flows, size estimate, and priority. No more "implement feature X" tickets missing crucial context.',
      competitive: 'Most tools treat cards as simple tasks. Filo enforces completeness—cards become executable specifications.'
    },
    {
      icon: '🧪',
      title: 'Send to Hans (One-Click Testing)',
      tagline: 'Delivery → Quality in seconds',
      description: 'Click "Send to Hans" on any card to create a structured test case. Acceptance criteria become test steps. Close the loop when tests fail by creating bug cards.',
      competitive: 'Industry first: Seamless development-to-testing workflow. No copying between tools. Test cases inherit full card context.'
    },
    {
      icon: '📚',
      title: 'Send to Ruby (Living Documentation)',
      tagline: 'Cards become docs',
      description: 'Generate PRDs, build specs, and release notes directly from epics and features. Maintain bidirectional links for complete traceability.',
      competitive: 'Unlike disconnected tools, Filo documents live alongside code. Update cards, docs stay current. Update docs, cards link back.'
    },
    {
      icon: '🎯',
      title: 'Multi-App Product Portfolio',
      tagline: 'One board, many products',
      description: 'Track multiple apps (Tou.Me, SyncFit, Mandrake) in one unified board. Filter by app, search across all products, maintain shared epics.',
      competitive: 'No more separate Jira projects per product. Filo handles portfolio management natively with app-based filtering.'
    },
    {
      icon: '🔍',
      title: 'Intelligent Search & Filtering',
      tagline: 'Find anything, instantly',
      description: 'Full-text search with token matching. Highlight matches in cards. Filter by app, status, epic, feature, size, priority. Keyboard shortcut (/) for instant search.',
      competitive: 'Search doesn\'t just match titles—it indexes user stories, acceptance criteria, flows, comments. Find the needle every time.'
    },
    {
      icon: '🤖',
      title: 'Auto Product (AI Backlog Generation)',
      tagline: 'Harls discoveries → Filo backlogs',
      description: 'Import AI-generated backlogs from Harls. Discovery docs transform into epics, features, and cards with full context. One-click from problem framing to structured backlog.',
      competitive: 'First-in-industry: AI-powered discovery-to-backlog pipeline. Reduces backlog creation time from days to minutes.'
    },
    {
      icon: '📏',
      title: 'T-Shirt Size Estimation',
      tagline: 'XS to XL, or just ?',
      description: 'Estimate cards with t-shirt sizes (XS, S, M, L, XL). Visual sizing helps with sprint planning. Track velocity by size over time.',
      competitive: 'Simpler than story points, more meaningful than hours. Proven to improve estimation accuracy by 30%.'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-violet-50/30">
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps/stea/explore" className="text-sm text-neutral-600 hover:text-neutral-900">
                ← Back to Explore
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <span>Filo</span>
              </h1>
            </div>
            <Link href="/apps/stea/filo" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm">
              Open Filo →
            </Link>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-800 text-sm font-medium mb-6">
            <span>🎯</span>
            <span>Board & Delivery Management</span>
          </div>
          <h2 className="text-5xl font-extrabold text-neutral-900 mb-6 leading-tight">
            Structured backlogs.<br />
            <span className="text-violet-600">Seamless execution.</span>
          </h2>
          <p className="text-xl text-neutral-600 leading-relaxed">
            Filo combines three-tier hierarchy (Epic → Feature → Card) with complete user story context.
            Every card has acceptance criteria, user flows, and one-click integrations to Hans (testing)
            and Ruby (documentation). No more context-free tickets.
          </p>
        </div>

        {/* STEa Integration Card */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">
              Part of the STEa Closed-Loop System
            </h3>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Filo is the <strong>Board & Delivery Management</strong> module within STEa. Import backlogs from <strong>Harls</strong> (discovery), send cards to <strong>Hans</strong> (testing) with one click, and generate documentation in <strong>Ruby</strong>. Complete traceability from epic to release.
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-neutral-600">
              <span className="font-semibold text-amber-700">Harls</span>
              <span>→</span>
              <span className="font-semibold text-violet-700">Filo</span>
              <span>→</span>
              <span className="font-semibold text-blue-700">Hans</span>
              <span>→</span>
              <span className="font-semibold text-rose-700">Ruby</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 rounded-2xl border-2 border-neutral-200 bg-white hover:border-violet-300 transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-violet-600 font-medium">{feature.tagline}</p>
                </div>
              </div>
              <p className="text-neutral-700 text-sm mb-4 leading-relaxed">{feature.description}</p>
              <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
                <p className="text-xs text-violet-800"><strong>Why it matters:</strong> {feature.competitive}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Experience structured delivery</h3>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            Join teams using Filo to maintain complete context from epic to release.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/apps/stea/explore?tab=pricing" className="px-8 py-4 bg-white text-violet-600 rounded-lg hover:bg-violet-50 transition-colors font-bold text-lg">
              Pricing
            </Link>
            <Link href="/apps/stea/explore" className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-bold text-lg">
              Explore Other Modules
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
