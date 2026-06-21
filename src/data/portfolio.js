import apps from './apps.json';

const appById = new Map(apps.map((app) => [app.id, app]));

export const portfolioViewOrder = ['portfolio', 'ai', 'b2b'];

export const portfolioViews = {
  portfolio: {
    slug: '',
    navLabel: 'All',
    title: 'Tiered portfolio',
    eyebrow: '/Portfolio',
    summary:
      'A public map of consumer apps, B2B product systems, controlled demos, and selected other projects built under ArcturusDC.',
    primaryCta: { label: 'Contact', href: '/contact' },
    secondaryCta: { label: 'Applied AI view', href: '/portfolio/ai' },
  },
  ai: {
    slug: 'ai',
    navLabel: 'AI',
    title: 'Applied AI and governance',
    eyebrow: '/Portfolio / AI',
    summary:
      'Projects that show practical AI use: bounded assistance, traceable decisions, auditability, validation, and clear limits on automation.',
    primaryCta: { label: 'Full portfolio', href: '/portfolio' },
    secondaryCta: { label: 'B2B systems', href: '/portfolio/b2b' },
  },
  b2b: {
    slug: 'b2b',
    navLabel: 'B2B',
    title: 'B2B systems and products',
    eyebrow: '/Portfolio / B2B',
    summary:
      'Public product concepts and controlled demos for structured delivery, evidence, governance, testing, and operational decision support.',
    primaryCta: { label: 'Applied AI view', href: '/portfolio/ai' },
    secondaryCta: { label: 'Full portfolio', href: '/portfolio' },
  },
};

export const portfolioTiers = [
  {
    id: 'public-apps',
    label: 'Public consumer apps',
    description: 'Open app pages, policies, store links, changelogs, and public case files.',
  },
  {
    id: 'public-systems',
    label: 'Public B2B systems',
    description: 'Sanitised product concepts and frameworks that can be shared without internal access.',
  },
  {
    id: 'controlled-demos',
    label: 'Controlled demos',
    description: 'Invite, magic-link, or demo surfaces where the page can be shown but operational data remains controlled.',
  },
  {
    id: 'other-projects',
    label: 'Other projects',
    description: 'Selected project surfaces that are not consumer apps, public B2B systems, or controlled demos.',
  },
];

function appPortfolioItem(appId, overrides = {}) {
  const app = appById.get(appId);
  if (!app) throw new Error(`Unknown app id: ${appId}`);

  return {
    id: `app-${app.id}`,
    title: app.name,
    tier: 'public-apps',
    exposure: 'Public',
    status: app.status === 'live' ? 'Live' : 'In development',
    summary: app.summary || app.strap || app.desc,
    proof: app.features || [],
    href: app.link || `/apps/${app.id}`,
    icon: app.icon,
    tags: [app.category, ...(app.availability || []).map((item) => item.toUpperCase())].filter(Boolean),
    views: ['portfolio'],
    ...overrides,
  };
}

export const portfolioItems = [
  appPortfolioItem('dialled-mtb', {
    emphasis: 'Uses contextual support to help riders make better setup choices and maintain their bikes with more confidence.',
    secondaryLinks: [
      { label: 'Public changelog', href: '/apps/dialled-mtb/changelog' },
      { label: 'Timeline', href: '/apps/dialled-mtb/changelog/timeline' },
    ],
    views: ['portfolio', 'ai'],
  }),
  appPortfolioItem('sprocket', {
    emphasis:
      'Consumer AI-support pattern for calm phone help across voice and text assistance, reminders, memory, step-by-step tech guidance, read-aloud replies, and plain-English explanations.',
    views: ['portfolio', 'ai'],
  }),
  appPortfolioItem('unload'),
  appPortfolioItem('toume', {
    views: ['portfolio'],
  }),
  appPortfolioItem('adhd-acclaim'),
  appPortfolioItem('mandrake'),
  appPortfolioItem('rehabpath', {
    emphasis: 'Uses AI to ingest physio plans and produce clinician-friendly summaries.',
    views: ['portfolio', 'ai'],
  }),
  appPortfolioItem('assumezero', {
    emphasis: 'Media literacy game concept for claim checking and critical thinking.',
    views: ['portfolio'],
  }),
  appPortfolioItem('apex-state', {
    views: ['portfolio'],
  }),
  appPortfolioItem('syncfit'),
  {
    id: 'stea-platform',
    title: 'STEa',
    tier: 'public-systems',
    exposure: 'Public brief',
    status: 'Product system',
    summary:
      'A closed-loop product system for discovery, backlog structure, testing, documentation, release context, and Ruby product intelligence.',
    emphasis: 'Shows how product, delivery, testing, and docs can work as one traceable operating system.',
    proof: ['Harls discovery', 'Filo board', 'Hans testing', 'Ruby product intelligence'],
    href: '/apps/stea/explore',
    icon: '/img/stea-logo.png',
    tags: ['Product systems', 'Delivery', 'Traceability'],
    views: ['portfolio', 'ai', 'b2b'],
  },
  {
    id: 'orbit-accountability',
    title: 'Orbit',
    tier: 'public-systems',
    exposure: 'Public concept',
    status: 'B2B concept',
    summary:
      'AI system audit-trail infrastructure for provenance, observability, lineage, consent evidence, and compliance workflows.',
    emphasis: 'Built around bounded accountability: what rules applied, who approved, what was believed, and what can be proven.',
    proof: ['AI Act workflow', 'Verifiable event model', 'Consent and lineage demos'],
    href: '/apps/stea/orbit',
    secondaryLinks: [
      { label: 'STEa + Orbit overview', href: '/apps/stea/orbit/overview' },
      { label: 'Charity POC', href: '/apps/stea/orbit-charity' },
      { label: 'GrapheneOS POC', href: '/apps/stea/orbit-grapheneos' },
    ],
    tags: ['AI governance', 'Compliance', 'Auditability'],
    views: ['portfolio', 'ai', 'b2b'],
  },
  {
    id: 'sorr-framework',
    title: 'SoRR',
    tier: 'public-systems',
    exposure: 'Public framework',
    status: 'Operating model',
    summary:
      'System of Record for Reasoning: a documented reasoning layer for constraints, decisions, findings, and safe AI-assisted delivery.',
    emphasis: 'Useful as a personal brand signal because it demonstrates how AI work is governed, not just generated.',
    proof: ['Decision logs', 'Execution guardrails', 'Traceable findings', 'Current-state records'],
    href: '/apps/sorr',
    secondaryLinks: [{ label: 'STEa control entry', href: '/apps/stea/sorr' }],
    tags: ['AI delivery', 'Reasoning', 'Governance'],
    views: ['portfolio', 'ai', 'b2b'],
  },
  {
    id: 'paygo-demo',
    title: 'PAYGO',
    tier: 'controlled-demos',
    exposure: 'Controlled demo',
    status: 'Demo app',
    summary:
      'A regional prepayment energy management demo with fictional data, profile variants, and product rationale.',
    emphasis: 'Good for showing domain adaptation, constraint-led product thinking, and demo-safe data design.',
    proof: ['Fictional seed data', 'Regional variants', 'Demo notes', 'No real customer data'],
    href: '/apps/stea/paygo',
    tags: ['B2B demo', 'Energy', 'Product adaptation'],
    views: ['portfolio', 'b2b'],
  },
  {
    id: 'wc26-value-engine',
    title: 'WC26 value engine',
    tier: 'other-projects',
    exposure: 'Other project',
    status: 'Deterministic tool',
    summary:
      'A World Cup 2026 pricing and value engine with deterministic ratings, real-source ingestion, and explicit anti-fabrication rules.',
    emphasis: 'Useful for showing rigorous AI boundaries: no LLM in prediction, result, odds, probability, or pick paths.',
    proof: ['Pinned structured data', 'Deterministic model', 'Forward record', 'No fabricated fixtures'],
    href: '/apps/stea/wc26',
    tags: ['Deterministic model', 'Data integrity', 'ArcturusDC'],
    views: ['portfolio'],
    requiresAuth: true,
  },
  {
    id: 'art-atlas',
    title: 'Art Atlas',
    tier: 'other-projects',
    exposure: 'Other project',
    status: 'Prototype',
    summary:
      'A source-attributed art-history atlas and walkable museum prototype using Wikipedia, Wikidata, Wikimedia Commons, and Three.js.',
    emphasis: 'Shows a richer exploratory interface while keeping sourcing visible and avoiding invented facts.',
    proof: ['Source attribution', '3D gallery', 'Local fallback catalogue', 'No user data collection'],
    href: '/apps/stea/art-atlas',
    tags: ['Prototype', 'Sources', 'Three.js'],
    views: ['portfolio'],
    requiresAuth: true,
  },
];

export function getPortfolioView(view = 'portfolio') {
  return portfolioViews[view] || null;
}

export function getPortfolioItems(view = 'portfolio') {
  return portfolioItems.filter((item) => item.views.includes(view));
}

export function getPortfolioTier(tierId) {
  return portfolioTiers.find((tier) => tier.id === tierId);
}
