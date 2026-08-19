export const STEA_APP_CATALOG = [
  {
    key: 'harls',
    name: 'Harls',
    description: 'Product discovery and requirements capture.',
    group: 'Core studio',
    paths: ['/apps/stea/harls'],
  },
  {
    key: 'autoproduct',
    name: 'Auto Product',
    description: 'AI-assisted backlog generation.',
    group: 'Core studio',
    paths: ['/apps/stea/autoproduct'],
  },
  {
    key: 'filo',
    name: 'Filo',
    description: 'Backlog planning and delivery management.',
    group: 'Core studio',
    paths: ['/apps/stea/filo'],
  },
  {
    key: 'hans',
    name: 'Hans',
    description: 'Test execution and coordination.',
    group: 'Core studio',
    paths: ['/apps/stea/hans'],
  },
  {
    key: 'ruby',
    name: 'Ruby',
    description: 'Product documentation and traceability.',
    group: 'Core studio',
    paths: ['/apps/stea/ruby'],
  },
  {
    key: 'automated-tests',
    name: 'Automated Tests',
    description: 'Run and review automated test suites.',
    group: 'Core studio',
    paths: ['/apps/stea/automatedtestsdashboard'],
  },
  {
    key: 'career',
    name: 'Career Ops',
    description: 'Role analysis, applications, and career evidence.',
    group: 'Workspace tools',
    paths: ['/apps/stea/career'],
  },
  {
    key: 'art-atlas',
    name: 'Art Atlas',
    description: 'Interactive art-history research atlas.',
    group: 'Workspace tools',
    paths: ['/apps/stea/art-atlas'],
  },
  {
    key: 'wc26',
    name: 'WC26',
    description: 'World Cup pricing and value research.',
    group: 'Workspace tools',
    paths: ['/apps/stea/wc26'],
  },
  {
    key: 'mlb',
    name: 'MLB Study',
    description: 'Line-movement research and grading.',
    group: 'Workspace tools',
    paths: ['/apps/stea/mlb'],
  },
  {
    key: 'dialled-mtb',
    name: 'Dialled MTB',
    description: 'Feedback, analytics, campaigns, and calendar.',
    group: 'Product workspaces',
    paths: ['/apps/stea/dialled-mtb'],
  },
  {
    key: 'sidestand',
    name: 'Sidestand',
    description: 'Rider analytics and offer planning.',
    group: 'Product workspaces',
    paths: ['/apps/stea/sidestand'],
  },
  {
    key: 'apextwin',
    name: 'ApexTwin',
    description: 'Track-day setup and paddock workspace.',
    group: 'Product workspaces',
    paths: ['/apps/stea/apextwin-poc'],
  },
  {
    key: 'hol-yoga',
    name: 'Heart of Living Yoga',
    description: 'Yoga product workspace and prototypes.',
    group: 'Product workspaces',
    paths: ['/apps/stea/hol-yoga'],
  },
  {
    key: 'paygo',
    name: 'PAYGO',
    description: 'PAYGO product mirror and analysis tools.',
    group: 'Product workspaces',
    paths: ['/apps/stea/paygo'],
    publicAccess: true,
  },
  {
    key: 'orbit',
    name: 'Orbit POC',
    description: 'Consent, lineage, and audit demonstrations.',
    group: 'Governance & demos',
    paths: [
      '/apps/stea/orbit/poc',
      '/apps/stea/orbit/AI-Act-Technical-DocumentationBundle',
    ],
  },
  {
    key: 'sorr',
    name: 'SoRR Control',
    description: 'Governed AI workflow and control surfaces.',
    group: 'Governance & demos',
    paths: ['/apps/stea/sorr/controlui'],
  },
  {
    key: 'orbit-charity',
    name: 'Orbit Charity',
    description: 'Charity-sector governance demonstration.',
    group: 'Governance & demos',
    paths: ['/apps/stea/orbit-charity'],
    publicAccess: true,
  },
  {
    key: 'orbit-grapheneos',
    name: 'Orbit GrapheneOS',
    description: 'Device-event governance demonstration.',
    group: 'Governance & demos',
    paths: ['/apps/stea/orbit-grapheneos'],
    publicAccess: true,
  },
  {
    key: 'fight-or-flight',
    name: 'Fight or Flight',
    description: 'Decision-support prototype.',
    group: 'Governance & demos',
    paths: ['/apps/stea/fof'],
  },
];

export const STEA_APP_KEYS = STEA_APP_CATALOG.map((app) => app.key);

export const OWNER_ONLY_STEA_APPS = [
  {
    key: 'repinfaust',
    name: 'Repinfaust',
    paths: ['/apps/stea/repinfaust'],
    allowedEmails: ['repinfaust@gmail.com'],
  },
];

function pathMatches(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getSteaAppForPath(pathname = '') {
  const apps = [...OWNER_ONLY_STEA_APPS, ...STEA_APP_CATALOG];
  return apps.find((app) => app.paths.some((prefix) => pathMatches(pathname, prefix))) || null;
}

export function normalizeAllowedSteaApps(appKeys) {
  if (!Array.isArray(appKeys)) return [];
  const allowedKeys = new Set(STEA_APP_KEYS);
  return [...new Set(appKeys.filter((key) => allowedKeys.has(key)))];
}

export function tenantUsesLegacyAppAccess(tenant) {
  return !Array.isArray(tenant?.allowedSteaApps);
}

export function isSteaAppAllowed({ appKey, tenant, userEmail, isSuperAdmin = false }) {
  if (!appKey) return true;

  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  const ownerOnlyApp = OWNER_ONLY_STEA_APPS.find((app) => app.key === appKey);
  if (ownerOnlyApp) {
    return ownerOnlyApp.allowedEmails.includes(normalizedEmail);
  }

  if (isSuperAdmin) return true;
  if (!tenant) return false;

  // Existing workspaces pre-date app policies. Preserve their current access
  // until an admin saves an explicit selection for that workspace.
  if (tenantUsesLegacyAppAccess(tenant)) return true;

  return tenant.allowedSteaApps.includes(appKey);
}
