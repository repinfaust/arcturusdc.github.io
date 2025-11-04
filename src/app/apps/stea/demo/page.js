'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SteaDemoPage() {
  const [hoveredProduct, setHoveredProduct] = useState(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-white">
        <div className="space-y-6 animate-fade-in-up">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
            STEa
          </h1>
          <div className="text-2xl md:text-3xl font-semibold opacity-95">
            Plan • Build • Test
          </div>
          <p className="text-lg md:text-xl opacity-85 max-w-3xl mx-auto leading-relaxed">
            A closed-loop product system that keeps strategy, delivery, and QA in perfect sync
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-t-[3rem] px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Meet the System</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Three connected tools that eliminate context switching and maintain full traceability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Harls */}
            <Link
              href="/apps/stea/harls"
              onMouseEnter={() => setHoveredProduct('harls')}
              onMouseLeave={() => setHoveredProduct(null)}
              className="card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-4xl mb-6 shadow-lg">
                  🎯
                </div>
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Discovery & Planning</div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Harls</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Capture problem framing, JTBD, workshop notes, and decisions. Transform discovery briefs into structured backlogs with AI-powered generation.
                </p>
              </div>
            </Link>

            {/* Filo */}
            <Link
              href="/apps/stea/filo"
              onMouseEnter={() => setHoveredProduct('filo')}
              onMouseLeave={() => setHoveredProduct(null)}
              className="card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-4xl mb-6 shadow-lg">
                  📋
                </div>
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Board & Delivery</div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Filo</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Manage Epics → Features → Cards with complete user stories, acceptance criteria, and user flows. Send cards directly to testing in one click.
                </p>
              </div>
            </Link>

            {/* Hans */}
            <Link
              href="/apps/stea/hans"
              onMouseEnter={() => setHoveredProduct('hans')}
              onMouseLeave={() => setHoveredProduct(null)}
              className="card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-4xl mb-6 shadow-lg">
                  ✓
                </div>
                <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">Testing & Validation</div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">Hans</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Run structured test cases, capture evidence, and automatically create bug cards back in Filo when tests fail. Close the feedback loop.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Flow Section */}
      <div className="bg-white px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">The Closed Loop</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Information flows seamlessly through the entire product lifecycle
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="flex flex-wrap items-center justify-center gap-6 my-12">
            <div className="card p-6 border-pink-300 border-2 min-w-[200px] text-center transition-all hover:shadow-xl">
              <h4 className="text-lg font-bold text-neutral-900 mb-2">Discovery</h4>
              <p className="text-sm text-neutral-600">Brief → Prompts</p>
            </div>
            <div className="text-4xl text-purple-600 animate-pulse">→</div>
            <div className="card p-6 border-blue-300 border-2 min-w-[200px] text-center transition-all hover:shadow-xl">
              <h4 className="text-lg font-bold text-neutral-900 mb-2">Backlog</h4>
              <p className="text-sm text-neutral-600">Epics → Features → Cards</p>
            </div>
            <div className="text-4xl text-purple-600 animate-pulse">→</div>
            <div className="card p-6 border-emerald-300 border-2 min-w-[200px] text-center transition-all hover:shadow-xl">
              <h4 className="text-lg font-bold text-neutral-900 mb-2">Testing</h4>
              <p className="text-sm text-neutral-600">Test Cases → Evidence</p>
            </div>
            <div className="text-4xl text-purple-600 animate-pulse">→</div>
            <div className="card p-6 border-orange-300 border-2 min-w-[200px] text-center transition-all hover:shadow-xl">
              <h4 className="text-lg font-bold text-neutral-900 mb-2">Feedback</h4>
              <p className="text-sm text-neutral-600">Bugs → Fixes → Retest</p>
            </div>
          </div>

          {/* Circular Loop Visual */}
          <div className="relative h-[500px] my-16 flex items-center justify-center">
            <div className="absolute w-[400px] h-[400px] rounded-full border-4 border-dashed border-purple-400 animate-spin-slow" />

            {/* Loop Items */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white font-bold text-center shadow-xl p-4">
              <div>Harls<br/><span className="text-xs">Discovery</span></div>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-center shadow-xl p-4">
              <div>Filo<br/><span className="text-xs">Cards</span></div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-bold text-center shadow-xl p-4">
              <div>Hans<br/><span className="text-xs">Tests</span></div>
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-white font-bold text-center shadow-xl p-4">
              <div>Auto<br/><span className="text-xs">Bugs</span></div>
            </div>

            {/* Center */}
            <div className="card p-8 z-10 text-center max-w-xs">
              <h3 className="text-xl font-bold text-purple-600 mb-2">Continuous Flow</h3>
              <p className="text-sm text-neutral-600">No context switching<br/>Full traceability</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-neutral-50 px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">Key Features</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Everything you need to ship faster with higher quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Generation',
                description: 'One prompt creates a complete backlog with epics, features, and detailed cards via MCP + LLM integration.',
              },
              {
                icon: '🔗',
                title: 'Automatic Linking',
                description: 'Every test case links to its source card. Every bug links back to the failing test. Full bidirectional traceability.',
              },
              {
                icon: '⚡',
                title: 'One-Click Testing',
                description: 'Click "Send to Hans" on any card to instantly convert acceptance criteria into structured test cases.',
              },
              {
                icon: '🐛',
                title: 'Auto Bug Creation',
                description: 'When a test fails, Hans automatically creates a bug card in Filo with repro steps, evidence, and environment details.',
              },
              {
                icon: '📊',
                title: 'Complete Dashboard',
                description: 'Track delivery status, test coverage, pass rates, and cycle time across the entire system.',
              },
              {
                icon: '🎯',
                title: 'Source of Truth',
                description: 'Trace any epic → feature → card → test → bug → fix with zero copy/paste and no lost context.',
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
                className="card p-6 transition-all hover:shadow-xl hover:-translate-y-1 border-l-4 border-purple-500"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h4 className="text-lg font-bold text-neutral-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-neutral-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-4">How It Works</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              From idea to validated feature in a seamless flow
            </p>
          </div>

          <div className="card p-10 space-y-8">
            {[
              {
                number: 1,
                color: 'from-pink-500 to-red-500',
                title: 'Start in Harls',
                description: 'Paste a problem brief or workshop notes. Click "Generate Backlog" to seed epics, features, and cards via AI.',
              },
              {
                number: 2,
                color: 'from-blue-400 to-cyan-400',
                title: 'Build in Filo',
                description: 'Review generated cards with complete user stories, acceptance criteria, and user flows. Edit, prioritize, and assign work.',
              },
              {
                number: 3,
                color: 'from-emerald-400 to-teal-400',
                title: 'Test in Hans',
                description: 'Click "Send to Hans" on any card. Test cases appear with all context. Mark pass/fail, attach evidence.',
              },
              {
                number: 4,
                color: 'from-orange-400 to-yellow-400',
                title: 'Close the Loop',
                description: 'Failures auto-create bug cards in Filo. Fix the bugs, and Hans automatically re-runs tests to verify.',
              },
            ].map((step) => (
              <div key={step.number} className="flex items-start gap-6">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                  {step.number}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-neutral-900 mb-2">{step.title}</h4>
                  <p className="text-neutral-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 px-4 py-20 text-white text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Close the Loop?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Try the demo: Draft a brief → Generate backlog → Send to testing → Watch the magic happen
          </p>
          <Link
            href="/apps/stea"
            className="inline-block bg-white text-purple-600 px-10 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-8 text-center text-sm text-neutral-500">
        <p>
          STEa is part of the Arcturus Studio toolkit.{' '}
          <Link href="/apps/stea" className="text-neutral-700 hover:underline">
            Back to STEa Home
          </Link>
        </p>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        @media (max-width: 768px) {
          .animate-spin-slow {
            width: 300px;
            height: 300px;
          }
        }
      `}</style>
    </main>
  );
}
