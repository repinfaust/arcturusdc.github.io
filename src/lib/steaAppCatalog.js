// The assignable catalogue is deliberately identical to the cards rendered on
// the authenticated STEa workspace launchpad. Do not add product pages, route
// folders, experiments, or unpublished tools here merely because they exist.
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
    name: 'Hans Testing Suite',
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
    key: 'explore-stea',
    name: 'Explore STEa',
    description: 'Interactive showcase of the STEa workflow and pricing.',
    group: 'Specialist tools',
    paths: ['/apps/stea/explore'],
    publicAccess: true,
  },
  {
    key: 'orbit-poc',
    name: 'Orbit POC',
    description: 'Consent, lineage, and audit demonstration.',
    group: 'Specialist tools',
    paths: ['/apps/stea/orbit/poc'],
  },
  {
    key: 'orbit-ai-act',
    name: 'Orbit: AI Act Demo',
    description: 'EU AI Act technical-documentation demonstration.',
    group: 'Specialist tools',
    paths: ['/apps/stea/orbit/AI-Act-Technical-DocumentationBundle'],
  },
  {
    key: 'art-atlas',
    name: 'Art Atlas',
    description: 'Interactive art-history research atlas.',
    group: 'Specialist tools',
    paths: ['/apps/stea/art-atlas'],
  },
  {
    key: 'wc26',
    name: 'WC26',
    description: 'World Cup pricing and value research.',
    group: 'Specialist tools',
    paths: ['/apps/stea/wc26'],
  },
  {
    key: 'rider-management',
    name: 'Rider Management',
    description: 'Dialled MTB rider lookup and trial entitlements.',
    group: 'Team operations',
    paths: [
      '/apps/stea/dialled-mtb/riders',
      // Transitional match for bookmarks while Next redirects the old URL.
      '/apps/stea/dialledmtb-riders',
    ],
  },
  {
    key: 'dialled-mtb-promo',
    name: 'Dialled MTB — Promo campaigns',
    description: 'Community offers, stores, and affiliate commission.',
    group: 'Team operations',
    paths: ['/apps/stea/dialled-mtb/promo'],
  },
  {
    key: 'dialled-mtb-calendar',
    name: 'Dialled MTB — Calendar',
    description: 'Milestones, events, and marketing activities.',
    group: 'Team operations',
    paths: ['/apps/stea/dialled-mtb/calendar'],
  },
  {
    key: 'sidestand',
    name: 'Sidestand — Team workspace',
    description: 'Rider analytics and native-offer planning.',
    group: 'Team operations',
    paths: ['/apps/stea/sidestand'],
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

// Translate the two combined keys briefly shipped by the mistaken catalogue.
// They are removed the next time an admin saves the workspace policy.
const LEGACY_APP_KEY_ALIASES = {
  orbit: ['orbit-poc', 'orbit-ai-act'],
  'dialled-mtb': ['dialled-mtb-promo', 'dialled-mtb-calendar'],
};

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
  const expanded = appKeys.flatMap((key) => LEGACY_APP_KEY_ALIASES[key] || [key]);
  return [...new Set(expanded.filter((key) => allowedKeys.has(key)))];
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

  // Routes and fixed-tenant tools that are not launchpad cards are outside the
  // workspace shelf policy and retain their existing access controls.
  if (!STEA_APP_KEYS.includes(appKey)) return true;

  if (isSuperAdmin) return true;
  if (!tenant) return false;

  if (tenantUsesLegacyAppAccess(tenant)) return true;

  return normalizeAllowedSteaApps(tenant.allowedSteaApps).includes(appKey);
}
