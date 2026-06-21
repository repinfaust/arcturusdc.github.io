import apps from './apps.json';

const appById = new Map(apps.map((app) => [app.id, app]));

export const portfolioViewOrder = ['portfolio', 'ai', 'cv', 'b2b'];

export const portfolioViews = {
  portfolio: {
    slug: '',
    navLabel: 'All',
    title: 'Tiered portfolio',
    eyebrow: '/Portfolio',
    summary:
      'A public map of consumer apps, B2B product systems, controlled demos, and authenticated workspaces built under ArcturusDC.',
    primaryCta: { label: 'Open CV view', href: '/portfolio/cv' },
    secondaryCta: { label: 'Applied AI view', href: '/portfolio/ai' },
  },
  ai: {
    slug: 'ai',
    navLabel: 'AI',
    title: 'Applied AI and governance',
    eyebrow: '/Portfolio / AI',
    summary:
      'Projects that show practical AI use: bounded assistance, traceable decisions, auditability, validation, and clear limits on automation.',
    primaryCta: { label: 'Open CV view', href: '/portfolio/cv' },
    secondaryCta: { label: 'B2B systems', href: '/portfolio/b2b' },
  },
  cv: {
    slug: 'cv',
    navLabel: 'CV',
    title: 'CV portfolio link',
    eyebrow: '/Portfolio / CV',
    summary:
      'A concise shareable route for job applications and recruiter review. It excludes private owner-only tools and keeps workspace data behind auth.',
    primaryCta: { label: 'Contact', href: '/contact' },
    secondaryCta: { label: 'Full portfolio', href: '/portfolio' },
  },
  b2b: {
    slug: 'b2b',
    navLabel: 'B2B',
    title: 'B2B systems and workspaces',
    eyebrow: '/Portfolio / B2B',
    summary:
      'Public product concepts and controlled workspaces for structured delivery, evidence, governance, testing, and operational decision support.',
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
    description: 'Sanitised product concepts and frameworks that can be shared without workspace access.',
  },
  {
    id: 'controlled-demos',
    label: 'Controlled demos',
    description: 'Invite, magic-link, or demo surfaces where the page can be shown but operational data remains controlled.',
  },
  {
    id: 'authenticated-workspaces',
    label: 'Authenticated workspaces',
    description: 'Working tools behind Firebase sign-in, session cookies, tenant membership, and role checks.',
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
    views: ['portfolio', 'cv'],
    ...overrides,
  };
}

export const portfolioItems = [
  appPortfolioItem('dialled-mtb', {
    emphasis: 'Flagship consumer app with public changelog and an internal feedback workspace.',
    secondaryLinks: [
      { label: 'Public changelog', href: '/apps/dialled-mtb/changelog' },
      { label: 'Timeline', href: '/apps/dialled-mtb/changelog/timeline' },
    ],
    views: ['portfolio', 'cv', 'b2b'],
  }),
  appPortfolioItem('sprocket', {
    emphasis: 'Consumer AI-support pattern for making difficult messages easier to understand.',
    views: ['portfolio', 'cv', 'ai'],
  }),
  appPortfolioItem('unload'),
  appPortfolioItem('toume', {
    views: ['portfolio', 'cv', 'b2b'],
  }),
  appPortfolioItem('adhd-acclaim'),
  appPortfolioItem('mandrake'),
  appPortfolioItem('rehabpath', {
    views: ['portfolio', 'cv'],
  }),
  appPortfolioItem('assumezero', {
    emphasis: 'Media literacy game concept for claim checking and critical thinking.',
    views: ['portfolio', 'cv', 'ai'],
  }),
  appPortfolioItem('apex-state', {
    views: ['portfolio', 'cv'],
  }),
  appPortfolioItem('syncfit'),
  {
    id: 'stea-platform',
    title: 'STEa',
    tier: 'public-systems',
    exposure: 'Public brief',
    status: 'Product system',
    summary:
      'A closed-loop product workspace for discovery, backlog structure, testing, documentation, and release context.',
    emphasis: 'Shows how product, delivery, testing, and docs can work as one traceable operating system.',
    proof: ['Harls discovery', 'Filo board', 'Hans testing', 'Ruby product intelligence'],
    href: '/apps/stea/explore',
    icon: '/img/stea-logo.png',
    tags: ['Product systems', 'Delivery', 'Traceability'],
    views: ['portfolio', 'ai', 'cv', 'b2b'],
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
    views: ['portfolio', 'ai', 'cv', 'b2b'],
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
    views: ['portfolio', 'ai', 'cv', 'b2b'],
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
    views: ['portfolio', 'cv', 'b2b'],
  },
  {
    id: 'stea-workspace',
    title: 'STEa authenticated workspace',
    tier: 'authenticated-workspaces',
    exposure: 'Google workspace',
    status: 'Workspace',
    summary:
      'The live internal workspace hub for product planning, boards, test management, docs, automation, and tenant-specific tools.',
    emphasis: 'This is working product, not just a portfolio page. Access is intentionally gated.',
    proof: ['Tenant switcher', 'Role-aware destinations', 'Workspace pulse', 'Session-cookie protected routes'],
    href: '/apps/stea',
    tags: ['Workspace', 'Firebase Auth', 'Tenant access'],
    views: ['portfolio', 'cv', 'b2b'],
    requiresAuth: true,
  },
  {
    id: 'ruby-product-intelligence',
    title: 'Ruby',
    tier: 'authenticated-workspaces',
    exposure: 'Google workspace',
    status: 'Product intelligence',
    summary:
      'A documentation and product-intelligence repository for living notes, build specs, release context, templates, and share links.',
    emphasis: 'Shows the portfolio as a system of connected product memory rather than disconnected demos.',
    proof: ['TipTap editor', 'Doc spaces', 'Templates', 'Tokenised share links'],
    href: '/apps/stea/ruby',
    tags: ['Documentation', 'Knowledge graph', 'Share links'],
    views: ['portfolio', 'ai', 'cv', 'b2b'],
    requiresAuth: true,
  },
  {
    id: 'dialled-feedback-workspace',
    title: 'Dialled MTB workspace',
    tier: 'authenticated-workspaces',
    exposure: 'Workspace-gated',
    status: 'Internal tool',
    summary:
      'An internal User Feedback tool for triaging rider feedback and screenshots from the Dialled MTB mobile app.',
    emphasis: 'Good evidence of the public app -> operational workspace pattern.',
    proof: ['Feedback triage', 'Admin notes', 'Status and priority workflow', 'Signed screenshot access'],
    href: '/apps/stea/dialled-mtb',
    tags: ['Internal operations', 'Feedback', 'Firebase Admin'],
    views: ['portfolio', 'cv', 'b2b'],
    requiresAuth: true,
  },
  {
    id: 'wc26-value-engine',
    title: 'WC26 value engine',
    tier: 'authenticated-workspaces',
    exposure: 'ArcturusDC workspace',
    status: 'Deterministic tool',
    summary:
      'A World Cup 2026 pricing and value engine with deterministic ratings, real-source ingestion, and explicit anti-fabrication rules.',
    emphasis: 'Useful for showing rigorous AI boundaries: no LLM in prediction, result, odds, probability, or pick paths.',
    proof: ['Pinned structured data', 'Deterministic model', 'Forward record', 'No fabricated fixtures'],
    href: '/wc26',
    tags: ['Deterministic model', 'Data integrity', 'ArcturusDC'],
    views: ['portfolio', 'ai', 'cv', 'b2b'],
    requiresAuth: true,
  },
  {
    id: 'art-atlas',
    title: 'Art Atlas',
    tier: 'authenticated-workspaces',
    exposure: 'STEa workspace',
    status: 'Prototype',
    summary:
      'A source-attributed art-history atlas and walkable museum prototype using Wikipedia, Wikidata, Wikimedia Commons, and Three.js.',
    emphasis: 'Shows a richer exploratory interface while keeping sourcing visible and avoiding invented facts.',
    proof: ['Source attribution', '3D gallery', 'Local fallback catalogue', 'No user data collection'],
    href: '/apps/stea/art-atlas',
    tags: ['Prototype', 'Sources', 'Three.js'],
    views: ['portfolio', 'cv'],
    requiresAuth: true,
  },
  {
    id: 'apextwin-workspace',
    title: 'ApexTwin workspace',
    tier: 'authenticated-workspaces',
    exposure: 'Tenant workspace',
    status: 'POC workspace',
    summary:
      'A tenant-specific track-day setup workspace for bike setup, events, sessions, strategy, and paddock workflows.',
    emphasis: 'Shows the same workspace model applied to a different operational domain.',
    proof: ['Tenant-specific access', 'Session workflow', 'Garage and paddock views'],
    href: '/apps/stea/apextwin-poc',
    tags: ['Tenant workspace', 'Motorsport', 'Operational tool'],
    views: ['portfolio', 'cv', 'b2b'],
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
