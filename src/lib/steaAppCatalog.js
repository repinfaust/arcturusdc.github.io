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
    paths: ['/portfolio/art-atlas'],
  },
  {
    key: 'career',
    name: 'Career Ops',
    description: 'Honest job-search triage, CV tailoring, and interview co-pilot.',
    group: 'Specialist tools',
    paths: ['/apps/stea/career'],
  },
  {
    key: 'squared',
    name: 'Squared',
    description: 'Job-search triage for Armed Forces service leavers.',
    group: 'Specialist tools',
    paths: ['/apps/stea/squared'],
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
    key: 'dialled-mtb-dashboard',
    name: 'Dialled MTB — Analytics',
    description: 'Rider activity, retention, and engagement metrics.',
    group: 'Team operations',
    paths: ['/apps/stea/dialled-mtb/dashboard'],
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

// Compute the effective allowed app keys for a workspace, including automatic
// namesake app inclusion for dedicated Career Ops / Squared workspaces that
// were created before `career` was in the catalogue or with an empty shelf.
export function effectiveAllowedSteaApps(tenant) {
  if (!tenant) return [];
  if (tenantUsesLegacyAppAccess(tenant)) return [...STEA_APP_KEYS];
  const base = normalizeAllowedSteaApps(tenant.allowedSteaApps);
  const name = typeof tenant.name === 'string' ? tenant.name.trim() : '';
  const merged = new Set(base);
  if (/\bcareer\b/i.test(name)) merged.add('career');
  if (/\bsquared\b/i.test(name)) merged.add('squared');
  return [...merged];
}

export function isSteaAppAllowed({ appKey, tenant, userEmail, isSuperAdmin = false }) {
  if (!appKey) return true;

  const normalizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  const ownerOnlyApp = OWNER_ONLY_STEA_APPS.find((app) => app.key === appKey);
  if (ownerOnlyApp) {
    if (!ownerOnlyApp.allowedEmails.includes(normalizedEmail)) return false;
    // Direct route access (SteaAppAccessGate passes isSuperAdmin=true for owner)
    // is always permitted for the owner. On the workspace launchpad shelf
    // (isSuperAdmin=false), only show Repinfaust in legacy/all-app workspaces
    // or workspaces explicitly named Arcturus / Repinfaust, never inside
    // dedicated single-purpose workspaces (e.g. David Loake Career Ops).
    if (isSuperAdmin) return true;
    if (!tenant) return false;
    if (tenantUsesLegacyAppAccess(tenant)) return true;
    const tenantName = typeof tenant.name === 'string' ? tenant.name.trim() : '';
    return /\b(arcturus|repinfaust)\b/i.test(tenantName);
  }

  // Routes and fixed-tenant tools that are not launchpad cards are outside the
  // workspace shelf policy and retain their existing access controls.
  if (!STEA_APP_KEYS.includes(appKey)) return true;

  if (isSuperAdmin) return true;
  if (!tenant) return false;

  if (tenantUsesLegacyAppAccess(tenant)) return true;

  return effectiveAllowedSteaApps(tenant).includes(appKey);
}
