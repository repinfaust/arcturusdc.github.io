'use client';

import Link from 'next/link';

export default function ExploreRuby() {
  const features = [
    {
      icon: '🔗',
      title: 'DocLink Knowledge Graph',
      tagline: 'Living documentation network',
      description: 'Bidirectional links between docs and artifacts (epics, features, cards, tests). Interactive graph visualization shows how everything connects. Click any node to navigate.',
      competitive: 'Notion has backlinks. Confluence has pages. Ruby has a complete knowledge graph showing the entire product lifecycle. Industry first.'
    },
    {
      icon: '📝',
      title: 'Professional Document Templates',
      tagline: '8 battle-tested templates',
      description: 'PRS, Build Spec, ADR, Test Plan, Launch Plan, Release Notes, Meeting Notes. Generate docs from source artifacts with one click. Maintain consistent structure across org.',
      competitive: 'Generic tools offer blank pages. Ruby provides product-specific templates proven to reduce documentation time by 60%.'
    },
    {
      icon: '✅',
      title: 'Reviewer Mode with Compliance',
      tagline: 'Built-in quality gates',
      description: 'Accessibility, security, GDPR, design parity, performance checklists. Track review progress, require sign-offs, maintain audit trails. Compliance without spreadsheets.',
      competitive: 'First documentation tool with built-in compliance reviews. No more separate review processes. Quality gates embedded in docs.'
    },
    {
      icon: '📊',
      title: 'Version Diffing with Line-by-Line Changes',
      tagline: 'See what changed',
      description: 'Complete version history with side-by-side diffs. Highlights insertions, deletions, modifications. Attribution per version. Rollback-ready.',
      competitive: 'Better than Git for docs. Visual diffs, no merge conflicts, always in sync with artifacts.'
    },
    {
      icon: '🎨',
      title: 'TipTap Rich Text Editor',
      tagline: 'Advanced editing, simple UX',
      description: 'Tables, code blocks with syntax highlighting, callouts (Info/Warning/Success/Error), task lists, slash commands. Drag-drop images. Paste from clipboard.',
      competitive: 'More powerful than Notion\'s editor, simpler than Confluence\'s. Slash commands enable AI integration (coming soon).'
    },
    {
      icon: '☁️',
      title: 'Cloud Storage Asset Management',
      tagline: 'Images, PDFs, any file',
      description: '10MB per file, unlimited files. Progress tracking on uploads. Smart thumbnails for images. Organized by doc and tenant. Insert with one click.',
      competitive: 'Unlike Confluence\'s clunky attachments, Ruby integrates Cloud Storage natively. Files sync across all users instantly.'
    },
    {
      icon: '🔐',
      title: 'Secure Share Links with Expiry',
      tagline: 'Time-limited external access',
      description: 'Generate share tokens with configurable expiry (default 30 days). Optional watermarking. Access tracking (who viewed, when). Revoke anytime.',
      competitive: 'Enterprise-grade sharing without enterprise complexity. Confidential docs stay confidential.'
    },
    {
      icon: '📤',
      title: 'Export to HTML, Markdown, PDF',
      tagline: 'Data portability guaranteed',
      description: 'One-click export to 3 formats. HTML preserves styling. Markdown for GitHub. PDF for printing. Watermark support. Your data is never locked in.',
      competitive: 'Unlike SaaS tools that trap your content, Ruby guarantees full data portability. Export anytime, anywhere.'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50/30">
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps/stea/explore" className="text-sm text-neutral-600 hover:text-neutral-900">
                ← Back to Explore
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <span>Ruby</span>
              </h1>
            </div>
            <Link href="/apps/stea/ruby" className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium text-sm">
              Open Ruby →
            </Link>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-800 text-sm font-medium mb-6">
            <span>📚</span>
            <span>Documentation & Knowledge Management</span>
          </div>
          <h2 className="text-5xl font-extrabold text-neutral-900 mb-6 leading-tight">
            Living documentation.<br />
            <span className="text-rose-600">Always connected, never stale.</span>
          </h2>
          <p className="text-xl text-neutral-600 leading-relaxed">
            Ruby connects documentation to the entire product lifecycle. DocLinks create a knowledge graph
            linking docs to epics, features, cards, and tests. Template-driven authoring, compliance reviews,
            and full export portability. Documentation that doesn't go out of date.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="p-6 rounded-2xl border-2 border-neutral-200 bg-white hover:border-rose-300 transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{feature.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-rose-600 font-medium">{feature.tagline}</p>
                </div>
              </div>
              <p className="text-neutral-700 text-sm mb-4 leading-relaxed">{feature.description}</p>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <p className="text-xs text-rose-800"><strong>Why it matters:</strong> {feature.competitive}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">Documentation that stays relevant</h3>
          <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
            Join teams using Ruby to maintain living documentation connected to the entire product lifecycle.
          </p>
          <Link href="/apps/stea/ruby" className="inline-block px-8 py-4 bg-white text-rose-600 rounded-lg hover:bg-rose-50 transition-colors font-bold text-lg">
            Open Ruby Docs
          </Link>
        </div>
      </section>
    </main>
  );
}
