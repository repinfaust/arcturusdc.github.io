'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ExploreHarls() {
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      id: 'whiteboard',
      title: 'Infinite Canvas Whiteboarding',
      tagline: 'Think freely, draw anything',
      icon: '✏️',
      description: 'TLDraw-powered infinite canvas for visual thinking. Draw, diagram, sketch user flows, capture workshop notes. Everything auto-saves to your workspace.',
      highlights: [
        'Infinite canvas - no limits on creativity',
        'Draw, sketch, diagram, annotate',
        'Real-time collaboration with team',
        'Auto-save every change to Firestore',
        'Export whiteboard as PNG/SVG'
      ],
      gradient: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-300',
      competitive: 'Unlike Miro or FigJam, Harls connects your visual thinking directly to structured artifacts. Drawings become buildable backlogs.'
    },
    {
      id: 'discovery',
      title: 'Structured Discovery Framework',
      tagline: 'From problem to backlog',
      icon: '🎯',
      description: 'Capture discovery using a proven framework: Problem statement, Jobs To Be Done, Goals, Constraints, Risks, Assumptions, Dependencies. Every field drives AI-powered backlog generation.',
      highlights: [
        'Jobs To Be Done (JTBD) methodology built-in',
        'Problem framing with clear audience definition',
        'Scope boundaries (In Scope / Out of Scope)',
        'Risk and assumption tracking',
        'Dependency management',
        'Seed user stories and acceptance criteria'
      ],
      gradient: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-300',
      competitive: 'Most tools offer blank canvases. Harls provides a structured framework proven to reduce discovery time by 40%.'
    },
    {
      id: 'ai-prompt',
      title: 'AI Prompt Generation',
      tagline: 'Discovery → Build Spec → Backlog',
      icon: '🤖',
      description: 'One click exports your discovery as a structured markdown prompt optimized for LLMs. Generate build specs and backlog JSON instantly. Copy to ChatGPT, Claude, or any AI assistant.',
      highlights: [
        'Exports as LLM-optimized markdown',
        'Includes exact JSON schema for backlog',
        'Generates build specs with architecture',
        'Creates Epics → Features → Cards structure',
        'Guardrails prevent scope creep',
        'Download prompt or copy to clipboard'
      ],
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-300',
      competitive: 'Industry first: AI-powered discovery-to-backlog pipeline. No other tool transforms workshops into structured backlogs automatically.'
    },
    {
      id: 'gamification',
      title: 'Badge & XP System',
      tagline: 'Make discovery rewarding',
      icon: '🏆',
      description: 'Earn badges and XP for completing discovery activities. Brainstormer (5+ notes), Storyteller (first user story), MVP Architect (3+ prioritized features). Level up as you work.',
      highlights: [
        '5 achievement badges with unique lessons',
        'XP system tracks progress (100 XP = Level Up)',
        'Brainstormer: Capture 5+ discovery notes',
        'Storyteller: Write your first user story',
        'MVP Architect: Prioritize 3+ features to Now lane',
        'Track team leaderboard (coming soon)'
      ],
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-300',
      competitive: 'Gamification makes discovery engaging. No other enterprise tool rewards teams for thorough problem framing.'
    },
    {
      id: 'collaboration',
      title: 'Multi-Tenant Workspace Collaboration',
      tagline: 'Secure, real-time teamwork',
      icon: '👥',
      description: 'Every workspace gets a shared Harls project. All team members collaborate in real-time on whiteboards and discovery docs. Complete tenant isolation ensures security.',
      highlights: [
        'One shared project per workspace',
        'Real-time updates across all users',
        'Presence indicators show who is online',
        'Multi-tenant security (Firestore rules)',
        'Auto-add team members to project',
        'Activity log tracks all changes'
      ],
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-300',
      competitive: 'Unlike separate collaboration tools, Harls is tenant-aware from day one. Your data never mixes with other workspaces.'
    },
    {
      id: 'jtbd',
      title: 'Jobs To Be Done Methodology',
      tagline: 'Understand the "why"',
      icon: '🔍',
      description: 'Built-in JTBD framework helps teams identify user motivations, not just features. Capture jobs users are trying to get done, circumstances, and desired outcomes.',
      highlights: [
        'Structured JTBD templates',
        'Capture functional and emotional jobs',
        'Link jobs to user personas',
        'Track job completion metrics',
        'Export JTBD research as artifacts',
        'Validate jobs with user interviews'
      ],
      gradient: 'from-rose-500/20 to-red-500/20',
      borderColor: 'border-rose-300',
      competitive: 'JTBD is a proven methodology but hard to practice. Harls makes it effortless with structured templates and AI integration.'
    },
    {
      id: 'export',
      title: 'Markdown Export & Portability',
      tagline: 'Own your data',
      icon: '📤',
      description: 'Export discovery docs as markdown with one click. Timestamps included. Use exported docs in Confluence, Notion, GitHub, or anywhere. Your data is never locked in.',
      highlights: [
        'One-click markdown export',
        'Timestamped filenames',
        'Includes all discovery fields',
        'Formatted for readability',
        'Compatible with any markdown viewer',
        'Archive discoveries for compliance'
      ],
      gradient: 'from-slate-500/20 to-zinc-500/20',
      borderColor: 'border-slate-300',
      competitive: 'Full data portability. Unlike SaaS tools that lock you in, Harls lets you export everything as standard markdown.'
    },
    {
      id: 'integration',
      title: 'Deep Filo Integration',
      tagline: 'Discovery becomes delivery',
      icon: '🔗',
      description: 'Harls discoveries feed directly into Filo backlogs. AI-generated epics, features, and cards import with full context. Close the loop from ideation to implementation.',
      highlights: [
        'One-click import to Filo board',
        'Preserves discovery context in cards',
        'Links cards back to discovery docs',
        'Traceability from idea to release',
        'Update discovery as you learn',
        'Bidirectional sync (coming soon)'
      ],
      gradient: 'from-violet-500/20 to-purple-500/20',
      borderColor: 'border-violet-300',
      competitive: 'Seamless discovery-to-delivery pipeline. Most teams use 3-4 disconnected tools. Harls + Filo = complete product workflow.'
    }
  ];

  const competitiveComparison = [
    {
      tool: 'Harls',
      discovery: '✅ Structured framework',
      whiteboard: '✅ TLDraw integration',
      ai: '✅ Built-in prompt generation',
      backlog: '✅ Direct Filo integration',
      jtbd: '✅ Native JTBD templates',
      gamification: '✅ Badges & XP',
      collaboration: '✅ Multi-tenant real-time',
    },
    {
      tool: 'Miro',
      discovery: '❌ Blank canvas only',
      whiteboard: '✅ Robust',
      ai: '❌ Manual export',
      backlog: '❌ No integration',
      jtbd: '❌ Templates only',
      gamification: '❌ None',
      collaboration: '✅ Real-time',
    },
    {
      tool: 'FigJam',
      discovery: '❌ Blank canvas only',
      whiteboard: '✅ Good',
      ai: '❌ Manual export',
      backlog: '❌ No integration',
      jtbd: '❌ Manual',
      gamification: '❌ None',
      collaboration: '✅ Real-time',
    },
    {
      tool: 'Mural',
      discovery: '⚠️ Templates available',
      whiteboard: '✅ Robust',
      ai: '❌ Manual export',
      backlog: '❌ No integration',
      jtbd: '⚠️ Templates only',
      gamification: '❌ None',
      collaboration: '✅ Real-time',
    },
    {
      tool: 'Notion',
      discovery: '⚠️ Custom pages',
      whiteboard: '❌ Limited',
      ai: '⚠️ AI writing assistant',
      backlog: '⚠️ Databases',
      jtbd: '❌ Manual',
      gamification: '❌ None',
      collaboration: '✅ Real-time',
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-amber-50/30">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/apps/stea/explore"
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <span>←</span>
                <span>Back to Explore</span>
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <span>Harls</span>
              </h1>
            </div>
            <Link
              href="/apps/stea/harls"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
            >
              Open Harls →
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6">
            <span>🎯</span>
            <span>Product Lab & Discovery</span>
          </div>
          <h2 className="text-5xl font-extrabold text-neutral-900 mb-6 leading-tight">
            The memory of STEa.<br />
            <span className="text-amber-600">Discovery that becomes delivery.</span>
          </h2>
          <p className="text-xl text-neutral-600 leading-relaxed mb-8">
            Harls combines infinite canvas whiteboarding with structured discovery frameworks.
            Capture problems using Jobs To Be Done, generate AI-powered build specs, and transform
            workshops into structured backlogs—all in one collaborative workspace.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/apps/stea/harls"
              className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              Try Harls Now
            </Link>
            <a
              href="#features"
              className="px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:border-neutral-400 transition-colors font-semibold"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* STEa Integration Card */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">
              Part of the STEa Closed-Loop System
            </h3>
            <p className="text-neutral-700 leading-relaxed mb-4">
              Harls is the <strong>Discovery & Planning</strong> module within STEa. Your discovery work flows directly into <strong>Filo</strong> (delivery management), which sends cards to <strong>Hans</strong> (testing), with all insights captured in <strong>Ruby</strong> (documentation). The complete product lifecycle in one integrated platform.
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
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-neutral-900 mb-3">
            Industry-Leading Features
          </h3>
          <p className="text-lg text-neutral-600">
            What makes Harls different from Miro, FigJam, and Mural
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`group relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                activeFeature === feature.id
                  ? `${feature.borderColor} bg-gradient-to-br ${feature.gradient}`
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
              onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{feature.icon}</div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-neutral-900 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-neutral-600 font-medium">
                    {feature.tagline}
                  </p>
                </div>
              </div>

              <p className="text-neutral-700 text-sm mb-4 leading-relaxed">
                {feature.description}
              </p>

              {activeFeature === feature.id && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <div className="font-semibold text-sm text-neutral-900 mb-2">Key Capabilities:</div>
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 flex-shrink-0">✓</span>
                        <span className="text-neutral-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="font-semibold text-xs text-amber-900 mb-1">Competitive Edge:</div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {feature.competitive}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-neutral-500">
                {activeFeature === feature.id ? 'Click to collapse' : 'Click to expand'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Competitive Comparison Table */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-neutral-900 mb-3">
            How Harls Compares
          </h3>
          <p className="text-lg text-neutral-600">
            Feature-by-feature comparison with leading tools
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-neutral-200">
                  <th className="text-left p-4 font-bold text-neutral-900">Tool</th>
                  <th className="text-left p-4 font-bold text-neutral-900 text-sm">Structured Discovery</th>
                  <th className="text-left p-4 font-bold text-neutral-900 text-sm">Whiteboarding</th>
                  <th className="text-left p-4 font-bold text-neutral-900 text-sm">AI Integration</th>
                  <th className="text-left p-4 font-bold text-neutral-900 text-sm">Backlog Export</th>
                  <th className="text-left p-4 font-bold text-neutral-900 text-sm">JTBD Framework</th>
                  <th className="text-left p-4 font-bold text-neutral-900 text-sm">Gamification</th>
                </tr>
              </thead>
              <tbody>
                {competitiveComparison.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-neutral-200 ${
                      row.tool === 'Harls' ? 'bg-amber-50' : ''
                    }`}
                  >
                    <td className={`p-4 font-semibold ${
                      row.tool === 'Harls' ? 'text-amber-900' : 'text-neutral-700'
                    }`}>
                      {row.tool}
                    </td>
                    <td className="p-4 text-sm">{row.discovery}</td>
                    <td className="p-4 text-sm">{row.whiteboard}</td>
                    <td className="p-4 text-sm">{row.ai}</td>
                    <td className="p-4 text-sm">{row.backlog}</td>
                    <td className="p-4 text-sm">{row.jtbd}</td>
                    <td className="p-4 text-sm">{row.gamification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to transform your discovery process?
          </h3>
          <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
            Join teams using Harls to reduce discovery time by 40% while improving backlog quality.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/apps/stea/explore?tab=pricing"
              className="px-8 py-4 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors font-bold text-lg"
            >
              Pricing
            </Link>
            <Link
              href="/apps/stea/explore"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-bold text-lg"
            >
              Explore Other Modules
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-sm text-neutral-600">
            <div>© 2025 STEa Studio. Harls Product Lab.</div>
            <div className="flex items-center gap-6">
              <Link href="/apps/stea/explore" className="hover:text-neutral-900">
                Explore STEa
              </Link>
              <Link href="/apps/stea" className="hover:text-neutral-900">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
