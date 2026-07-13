'use client';

import Link from 'next/link';
import { useHolYogaAccess } from './HolYogaAccessGate';
import { HolYogaHeader, HolYogaShell, PrototypeBadge, holColors } from './HolYogaChrome';

const TOOLS = [
  {
    href: '/apps/stea/hol-yoga/revenuecat',
    icon: '💳',
    title: 'Supporter membership',
    description: 'Look up supporters, grant trial memberships, and see subscription status.',
    status: 'prototype',
    statusLabel: 'Prototype — separate build to Dialled MTB',
  },
  {
    href: '/apps/stea/hol-yoga/media',
    icon: '🎧',
    title: 'Practice library upload',
    description: 'Add guided meditations, chants, and teachings — title, category, teacher, and audio or video file.',
    status: 'prototype',
    statusLabel: 'Prototype — not yet connected to the app',
  },
  {
    href: '/apps/stea/hol-yoga/social',
    icon: '📣',
    title: 'Social media',
    description: 'Plan and preview posts for Facebook and Instagram from one place.',
    status: 'prototype',
    statusLabel: 'Prototype — no accounts connected',
  },
  {
    href: '/apps/stea/admin',
    icon: '⚙️',
    title: 'Workspace admin',
    description: 'Manage who has access to this workspace and their role.',
    status: 'live',
    statusLabel: 'Shared STEa admin',
  },
];

function ToolCard({ tool }) {
  return (
    <Link
      href={tool.href}
      className="block rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md"
      style={{ borderColor: holColors.cream300 }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-3xl">{tool.icon}</span>
        {tool.status === 'prototype' ? (
          <PrototypeBadge label="Prototype" />
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ backgroundColor: '#e4f1de', color: '#2d6e1c' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#2d6e1c' }} />
            Live
          </span>
        )}
      </div>
      <h3 className="mb-1.5 text-base font-semibold" style={{ color: holColors.plum800 }}>
        {tool.title}
      </h3>
      <p className="mb-3 text-sm" style={{ color: holColors.plum500 }}>
        {tool.description}
      </p>
      <p className="text-xs" style={{ color: holColors.gold500 }}>
        {tool.statusLabel}
      </p>
    </Link>
  );
}

export default function HolYogaHomeClient() {
  const { ready, hasAccess, handleSignOut } = useHolYogaAccess();

  if (!ready) {
    return (
      <HolYogaShell>
        <div className="rounded-2xl border bg-white/80 px-6 py-5 text-sm" style={{ borderColor: holColors.cream300, color: holColors.plum500 }}>
          Checking access…
        </div>
      </HolYogaShell>
    );
  }

  if (!hasAccess) return null;

  return (
    <HolYogaShell>
      <HolYogaHeader
        title="Heart of Living Yoga"
        subtitle="Workspace tools for the Foundation's app and community"
        breadcrumb="Celebrating unity in diversity"
        onSignOut={handleSignOut}
      />

      <div className="mb-8 rounded-2xl border p-5" style={{ borderColor: holColors.cream300, backgroundColor: holColors.gold100 }}>
        <p className="text-sm" style={{ color: holColors.plum800 }}>
          This is a working prototype of what a Heart of Living Yoga admin workspace could look
          like — a single place to manage supporter memberships, the practice library the app
          serves, and social media, alongside who has access to this workspace. The tools marked{' '}
          <span className="font-semibold">Prototype</span> below are not yet connected to real
          data or accounts; they're here to show the shape of what's possible before any of it is
          built for real.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.href} tool={tool} />
        ))}
      </div>
    </HolYogaShell>
  );
}
