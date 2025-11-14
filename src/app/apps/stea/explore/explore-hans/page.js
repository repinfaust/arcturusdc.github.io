'use client';

import Link from 'next/link';

export default function ExploreHans() {
  const features = [
    {
      icon: '🔗',
      title: 'Test Cases FROM Dev Cards',
      tagline: 'Development drives testing',
      description: 'Create test cases directly from Filo cards. User stories become preconditions, acceptance criteria become test steps, user flows become execution scripts.',
      competitive: 'TestRail, qTest, Zephyr require manual test case writing. Hans inherits full context from development cards automatically.'
    },
    {
      icon: '♻️',
      title: 'Closed-Loop Bug Workflow',
      tagline: 'Failed tests → Bug cards',
      description: 'When a test fails, create a bug card in Filo with one click. Bug inherits test context, links back to test case. Complete traceability from test to fix.',
      competitive: 'First-in-industry: Seamless test-to-development feedback loop. No copying between tools. Bugs automatically linked to failing tests.'
    },
    {
      icon: '🔑',
      title: 'Public Test Sharing',
      tagline: 'External testers, no login',
      description: '12-hour expiring tokens let external testers access test cases without accounts. Share link, testers execute, results auto-import. Perfect for UAT and beta testing.',
      competitive: 'No other test management tool supports public token sharing. UAT usually requires expensive licensed seats. Hans = unlimited external testers.'
    },
    {
      icon: '📱',
      title: 'App-Specific Test Pages',
      tagline: 'Organize by product',
      description: 'Dynamic /hans/<app-name> pages filter test cases by app. Track Tou.Me tests separately from SyncFit tests. Per-app pass rates and metrics.',
      competitive: 'Most tools use projects or folders. Hans uses dynamic routing for instant app-based organization. URL is the filter.'
    },
    {
      icon: '✅',
      title: 'Interactive Test Execution',
      tagline: 'Check off as you test',
      description: 'Execute tests with interactive checklists. Check off acceptance criteria, add notes, update status (Open → In Progress → Passed/Failed). Real-time collaboration.',
      competitive: 'Unlike spreadsheet-based testing, Hans provides rich execution UI with status tracking, notes, and automated notifications.'
    },
    {
      icon: '🏢',
      title: 'Multi-Tenant Test Isolation',
      tagline: 'Secure workspace boundaries',
      description: 'Each workspace sees only their test cases. Complete tenant isolation via Firestore security rules. Your test data never mixes with other teams.',
      competitive: 'Enterprise-grade security from day one. No complex permission configurations. Workspaces are inherently isolated.'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-blue-50/30">
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps/stea/explore" className="text-sm text-neutral-600 hover:text-neutral-900">
                ← Back to Explore
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="text-3xl">🧪</span>
                <span>Hans</span>
              </h1>
            </div>
            <Link href="/apps/stea/hans" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
              Open Hans →
            </Link>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <span>🧪</span>
            <span>Testing & Quality Management</span>
          </div>
          <h2 className="text-5xl font-extrabold text-neutral-900 mb-6 leading-tight">
            Testing that closes the loop.<br />
            <span className="text-blue-600">Quality in the workflow.</span>
          </h2>
          <p className="text-xl text-neutral-600 leading-relaxed">
            Hans creates test cases from Filo cards, supports public token sharing for external testers,
            and creates bug cards when tests fail. Complete traceability from development through testing to fixes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 rounded-2xl border-2 border-neutral-200 bg-white hover:border-blue-300 transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-blue-600 font-medium">{feature.tagline}</p>
                </div>
              </div>
              <p className="text-neutral-700 text-sm mb-4 leading-relaxed">{feature.description}</p>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs text-blue-800"><strong>Why it matters:</strong> {feature.competitive}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Quality without the overhead</h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join teams using Hans for seamless development-to-testing workflows.
          </p>
          <Link href="/apps/stea/hans" className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-bold text-lg">
            Open Hans Testing
          </Link>
        </div>
      </section>
    </main>
  );
}
