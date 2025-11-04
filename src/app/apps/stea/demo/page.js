'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function SteaDemoPage() {
  return (
    <main className="min-h-screen bg-starburst">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card p-8 mt-2">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-3">
              STEa
            </h1>
            <p className="text-xl font-semibold text-neutral-700 mb-4">
              Plan • Build • Test
            </p>
            <p className="text-base text-neutral-600 max-w-3xl mx-auto">
              A closed-loop product system that keeps strategy, delivery, and QA in perfect sync
            </p>
          </div>
        </div>

        {/* Products Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 px-2">Meet the System</h2>
          <p className="text-neutral-600 mb-6 px-2">
            Three connected tools that eliminate context switching and maintain full traceability
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Harls */}
            <Link
              href="/apps/stea/harls"
              className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-pink-50 to-red-50">
                  <Image
                    src="/img/harls.png"
                    width={48}
                    height={48}
                    alt="Harls"
                    className="rounded-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-3xl">🎯</span>';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Discovery & Planning
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Harls</h3>
                </div>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Capture problem framing, JTBD, workshop notes, and decisions. Transform discovery briefs into structured backlogs with AI-powered generation.
              </p>
              <div className="mt-4 text-sm text-neutral-400 group-hover:text-neutral-700 transition-colors">
                Learn more →
              </div>
            </Link>

            {/* Filo */}
            <Link
              href="/apps/stea/filo"
              className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <Image
                    src="/img/filo.png"
                    width={48}
                    height={48}
                    alt="Filo"
                    className="rounded-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-3xl">📋</span>';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Board & Delivery
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Filo</h3>
                </div>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Manage Epics → Features → Cards with complete user stories, acceptance criteria, and user flows. Send cards directly to testing in one click.
              </p>
              <div className="mt-4 text-sm text-neutral-400 group-hover:text-neutral-700 transition-colors">
                Learn more →
              </div>
            </Link>

            {/* Hans */}
            <Link
              href="/apps/stea/hans"
              className="group card p-6 hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <Image
                    src="/img/hans.png"
                    width={48}
                    height={48}
                    alt="Hans"
                    className="rounded-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-3xl">✓</span>';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Testing & Validation
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Hans</h3>
                </div>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Run structured test cases, capture evidence, and automatically create bug cards back in Filo when tests fail. Close the feedback loop.
              </p>
              <div className="mt-4 text-sm text-neutral-400 group-hover:text-neutral-700 transition-colors">
                Learn more →
              </div>
            </Link>
          </div>
        </section>

        {/* Flow Section */}
        <section className="mt-12">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4 text-center">The Closed Loop</h2>
            <p className="text-neutral-600 mb-8 text-center max-w-2xl mx-auto">
              Information flows seamlessly through the entire product lifecycle
            </p>

            {/* Flow Diagram */}
            <div className="flex flex-wrap items-center justify-center gap-4 my-8">
              <div className="card p-4 border-2 border-pink-200 bg-pink-50/30 min-w-[160px] text-center">
                <h4 className="font-bold text-neutral-900 mb-1">Discovery</h4>
                <p className="text-xs text-neutral-600">Brief → Prompts</p>
              </div>
              <div className="text-2xl text-neutral-400">→</div>
              <div className="card p-4 border-2 border-blue-200 bg-blue-50/30 min-w-[160px] text-center">
                <h4 className="font-bold text-neutral-900 mb-1">Backlog</h4>
                <p className="text-xs text-neutral-600">Epics → Features → Cards</p>
              </div>
              <div className="text-2xl text-neutral-400">→</div>
              <div className="card p-4 border-2 border-emerald-200 bg-emerald-50/30 min-w-[160px] text-center">
                <h4 className="font-bold text-neutral-900 mb-1">Testing</h4>
                <p className="text-xs text-neutral-600">Test Cases → Evidence</p>
              </div>
              <div className="text-2xl text-neutral-400">→</div>
              <div className="card p-4 border-2 border-orange-200 bg-orange-50/30 min-w-[160px] text-center">
                <h4 className="font-bold text-neutral-900 mb-1">Feedback</h4>
                <p className="text-xs text-neutral-600">Bugs → Fixes → Retest</p>
              </div>
            </div>

            {/* Center Text */}
            <div className="text-center mt-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Continuous Flow</h3>
              <p className="text-sm text-neutral-600">No context switching • Full traceability</p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 px-2">Key Features</h2>
          <p className="text-neutral-600 mb-6 px-2">
            Everything you need to ship faster with higher quality
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Generation',
                description: 'One prompt creates a complete backlog with epics, features, and detailed cards via MCP + LLM integration.',
              },
              {
                icon: '🔗',
                title: 'Automatic Linking',
                description: 'Every test case links to its source card. Every bug links back to the failing test.',
              },
              {
                icon: '⚡',
                title: 'One-Click Testing',
                description: 'Click "Send to Hans" on any card to instantly convert acceptance criteria into structured test cases.',
              },
              {
                icon: '🐛',
                title: 'Auto Bug Creation',
                description: 'When a test fails, Hans automatically creates a bug card in Filo with repro steps and evidence.',
              },
              {
                icon: '📊',
                title: 'Complete Dashboard',
                description: 'Track delivery status, test coverage, pass rates, and cycle time across the entire system.',
              },
              {
                icon: '🎯',
                title: 'Source of Truth',
                description: 'Trace any epic → feature → card → test → bug → fix with zero copy/paste.',
              },
              {
                icon: '📱',
                title: 'Mobile-Friendly',
                description: 'Hans works beautifully on mobile devices for testing on the go with quick evidence capture.',
              },
              {
                icon: '🔄',
                title: 'Retest Workflows',
                description: 'When bugs are fixed, linked test cases are automatically marked for retest to verify the fix.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="card p-5 hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h4 className="font-bold text-neutral-900 mb-2 text-sm">{feature.title}</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mt-12">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4 text-center">How It Works</h2>
            <p className="text-neutral-600 mb-8 text-center max-w-2xl mx-auto">
              From idea to validated feature in a seamless flow
            </p>

            <div className="space-y-6 max-w-3xl mx-auto">
              {[
                {
                  number: 1,
                  color: 'bg-pink-100 text-pink-700',
                  title: 'Start in Harls',
                  description: 'Paste a problem brief or workshop notes. Click "Generate Backlog" to seed epics, features, and cards via AI.',
                },
                {
                  number: 2,
                  color: 'bg-blue-100 text-blue-700',
                  title: 'Build in Filo',
                  description: 'Review generated cards with complete user stories, acceptance criteria, and user flows. Edit, prioritize, and assign work.',
                },
                {
                  number: 3,
                  color: 'bg-emerald-100 text-emerald-700',
                  title: 'Test in Hans',
                  description: 'Click "Send to Hans" on any card. Test cases appear with all context. Mark pass/fail, attach evidence.',
                },
                {
                  number: 4,
                  color: 'bg-orange-100 text-orange-700',
                  title: 'Close the Loop',
                  description: 'Failures auto-create bug cards in Filo. Fix the bugs, and Hans automatically re-runs tests to verify.',
                },
              ].map((step) => (
                <div key={step.number} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${step.color} flex items-center justify-center font-bold`}>
                    {step.number}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-neutral-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-12">
          <div className="card p-8 text-center bg-gradient-to-br from-neutral-50 to-neutral-100">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Ready to Close the Loop?</h2>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Try the demo: Draft a brief → Generate backlog → Send to testing → Watch the magic happen
            </p>
            <Link
              href="/apps/stea"
              className="inline-block px-8 py-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors font-semibold"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>
            STEa is part of the Arcturus Studio toolkit.{' '}
            <Link href="/apps/stea" className="text-neutral-700 hover:underline">
              Back to STEa Home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
