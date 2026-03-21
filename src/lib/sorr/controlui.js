const UC_DEFINITIONS = [
  {
    id: 'UC-01',
    name: 'Ad-hoc Product Analysis',
    summary: 'Analyse product/customer behaviour using approved internal datasets.',
    route: 'immediate',
    tier: 2,
    keywords: ['churn', 'cohort', 'retention', 'product analysis', 'behaviour', 'dataset'],
    confidenceBoost: 0.1,
    permittedTools: ['product_data_read', 'kb_search', 'draft_generator'],
    blockedActions: ['raw_data_export', 'external_send'],
  },
  {
    id: 'UC-02',
    name: 'Cross-source Insight Generation',
    summary: 'Combine multiple approved internal sources and generate synthesised insight.',
    route: 'approval',
    tier: 3,
    keywords: ['combine', 'feature adoption', 'support feedback', 'drivers', 'cross-source', 'themes'],
    confidenceBoost: 0.12,
    permittedTools: ['product_data_read', 'support_data_read', 'insight_synthesis_agent', 'draft_generator'],
    blockedActions: ['external_send', 'policy_override', 'unapproved_connector'],
  },
  {
    id: 'UC-03',
    name: 'Agent-assisted Analysis',
    summary: 'Run an approved analysis agent against approved product datasets.',
    route: 'immediate',
    tier: 2,
    keywords: ['agent', 'pricing review agent', 'run agent', 'usage data', 'analysis agent'],
    confidenceBoost: 0.14,
    permittedTools: ['approved_agent_run', 'product_data_read', 'draft_generator'],
    blockedActions: ['unapproved_agent', 'external_send'],
  },
  {
    id: 'UC-04',
    name: 'Persistent Workspace / Cowork Flow',
    summary: 'Create controlled workspace for recurring analysis and auto-updating outputs.',
    route: 'workspace',
    tier: 4,
    keywords: ['workspace', 'cowork', 'weekly', 'recurring', 'auto-update', 'persistent'],
    confidenceBoost: 0.09,
    permittedTools: ['workspace_create', 'recurring_report_runner', 'approved_agent_run'],
    blockedActions: ['ungoverned_workspace', 'external_send'],
  },
  {
    id: 'UC-05',
    name: 'Shareable Strategic Output',
    summary: 'Generate formal strategic updates intended for broader organisational sharing.',
    route: 'approval',
    tier: 3,
    keywords: ['leadership update', 'strategic output', 'board update', 'shareable output', 'product update'],
    confidenceBoost: 0.15,
    permittedTools: ['draft_generator', 'kb_search', 'policy_checked_export'],
    blockedActions: ['external_send', 'publish_without_approval'],
  },
];

const SEED_REQUESTS = [
  {
    id: 'REQ-2026-0411',
    prompt: 'Analyse churn across our last three customer cohorts and summarise key drivers.',
    useCaseId: 'UC-01',
    useCaseName: 'Ad-hoc Product Analysis',
    route: 'immediate',
    tier: 2,
    confidence: 0.92,
    status: 'COMPLETED',
    owner: 'lee.hawkins@ensek.example',
    createdAt: '2026-03-20T09:12:00.000Z',
    updatedAt: '2026-03-20T09:45:00.000Z',
    requestedByUid: 'seed-user-01',
  },
  {
    id: 'REQ-2026-0412',
    prompt: 'Combine feature adoption data with support feedback themes and summarise likely drivers.',
    useCaseId: 'UC-02',
    useCaseName: 'Cross-source Insight Generation',
    route: 'approval',
    tier: 3,
    confidence: 0.88,
    status: 'PENDING_APPROVAL',
    owner: 'a.shaikh@ensek.example',
    createdAt: '2026-03-20T11:07:00.000Z',
    updatedAt: '2026-03-20T11:07:00.000Z',
    requestedByUid: 'seed-user-01',
  },
  {
    id: 'REQ-2026-0413',
    prompt: 'Run the pricing review agent against this quarter’s usage data.',
    useCaseId: 'UC-03',
    useCaseName: 'Agent-assisted Analysis',
    route: 'immediate',
    tier: 2,
    confidence: 0.9,
    status: 'COMPLETED',
    owner: 'tom.riley@ensek.example',
    createdAt: '2026-03-20T12:55:00.000Z',
    updatedAt: '2026-03-20T13:02:00.000Z',
    requestedByUid: 'seed-user-01',
  },
  {
    id: 'REQ-2026-0414',
    prompt: 'Create a workspace that tracks onboarding drop-off weekly and updates the report.',
    useCaseId: 'UC-04',
    useCaseName: 'Persistent Workspace / Cowork Flow',
    route: 'workspace',
    tier: 4,
    confidence: 0.93,
    status: 'PENDING_APPROVAL',
    owner: 's.garcia@ensek.example',
    createdAt: '2026-03-20T14:11:00.000Z',
    updatedAt: '2026-03-20T14:11:00.000Z',
    requestedByUid: 'seed-user-01',
  },
  {
    id: 'REQ-2026-0415',
    prompt: 'Turn this analysis into a product update for leadership.',
    useCaseId: 'UC-05',
    useCaseName: 'Shareable Strategic Output',
    route: 'approval',
    tier: 3,
    confidence: 0.85,
    status: 'PENDING_APPROVAL',
    owner: 'n.patel@ensek.example',
    createdAt: '2026-03-20T15:29:00.000Z',
    updatedAt: '2026-03-20T15:36:00.000Z',
    requestedByUid: 'seed-user-01',
  },
];

const SEED_AUDIT = [
  {
    id: 'AUD-7001',
    requestId: 'REQ-2026-0411',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-01 matched; routed to immediate fulfilment.',
    tier: 2,
    createdAt: '2026-03-20T09:12:03.000Z',
  },
  {
    id: 'AUD-7002',
    requestId: 'REQ-2026-0412',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-02 matched; approval required for cross-source insight generation.',
    tier: 3,
    createdAt: '2026-03-20T09:44:45.000Z',
  },
  {
    id: 'AUD-7003',
    requestId: 'REQ-2026-0413',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-03 matched; approved agent run in immediate lane.',
    tier: 2,
    createdAt: '2026-03-20T11:07:05.000Z',
  },
  {
    id: 'AUD-7004',
    requestId: 'REQ-2026-0414',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-04 matched; routed to governed workspace path.',
    tier: 4,
    createdAt: '2026-03-20T14:11:07.000Z',
  },
  {
    id: 'AUD-7005',
    requestId: 'REQ-2026-0415',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-05 matched; approval required for shareable strategic output.',
    tier: 3,
    createdAt: '2026-03-20T15:36:10.000Z',
  },
];

const riskToRoute = {
  1: 'immediate',
  2: 'immediate',
  3: 'approval',
  4: 'workspace',
};

const routeToStatus = {
  immediate: 'COMPLETED',
  approval: 'PENDING_APPROVAL',
  workspace: 'PENDING_APPROVAL',
};

const riskLabels = {
  1: 'Tier 1 - Low',
  2: 'Tier 2 - Internal',
  3: 'Tier 3 - Sensitive',
  4: 'Tier 4 - Critical',
};

function safeText(value) {
  return String(value || '').toLowerCase();
}

function keywordScore(prompt, useCase) {
  const text = safeText(prompt);
  if (!text) return 0;
  let score = 0;
  for (const keyword of useCase.keywords) {
    if (text.includes(keyword.toLowerCase())) score += 0.17;
  }
  return Math.min(score + useCase.confidenceBoost, 0.96);
}

export function classifyPromptLocal(prompt) {
  const text = safeText(prompt);
  if (!text) {
    return {
      blocked: true,
      reason: 'Empty prompt',
      confidence: 0,
      route: 'blocked',
      tier: 4,
      riskLabel: riskLabels[4],
      matchedUseCase: null,
      permittedTools: [],
      blockedActions: ['all_actions'],
    };
  }

  const scored = UC_DEFINITIONS.map((uc) => ({ uc, score: keywordScore(text, uc) })).sort((a, b) => b.score - a.score);
  const top = scored[0];

  if (!top || top.score < 0.6) {
    return {
      blocked: true,
      reason: 'No match over confidence threshold',
      confidence: Number((top?.score || 0).toFixed(2)),
      route: 'blocked',
      tier: 4,
      riskLabel: riskLabels[4],
      matchedUseCase: null,
      permittedTools: [],
      blockedActions: ['all_actions'],
    };
  }

  return {
    blocked: false,
    reason: null,
    confidence: Number(top.score.toFixed(2)),
    route: top.uc.route,
    tier: top.uc.tier,
    riskLabel: riskLabels[top.uc.tier],
    matchedUseCase: {
      id: top.uc.id,
      name: top.uc.name,
      summary: top.uc.summary,
    },
    permittedTools: top.uc.permittedTools,
    blockedActions: top.uc.blockedActions,
  };
}

export function buildPolicyBundle(requestId, classification) {
  return {
    requestId,
    route: classification.route,
    tier: classification.tier,
    riskLabel: classification.riskLabel,
    confidence: classification.confidence,
    matchedUseCase: classification.matchedUseCase,
    permittedTools: classification.permittedTools,
    blockedActions: classification.blockedActions,
    failClosed: classification.blocked,
  };
}

export function buildSeedDataset() {
  const pending = SEED_REQUESTS.filter((r) => r.status === 'PENDING_APPROVAL').length;
  const highRisk = SEED_REQUESTS.filter((r) => r.tier >= 3).length;
  const avgRisk =
    SEED_REQUESTS.length > 0
      ? Number((SEED_REQUESTS.reduce((sum, r) => sum + r.tier, 0) / (SEED_REQUESTS.length * 4)).toFixed(2))
      : 0;

  return {
    kpis: {
      pendingApprovals: 42,
      highRiskEscalations: highRisk,
      throughput24h: 128,
      avgRiskScore: avgRisk,
      safetyGates: 'ONLINE',
      pendingActual: pending,
    },
    requests: SEED_REQUESTS,
    auditLog: SEED_AUDIT,
    useCases: UC_DEFINITIONS,
  };
}

export function buildRequestId() {
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `REQ-${Date.now()}-${rand}`;
}

export function approvalStatusForTier(tier) {
  const route = riskToRoute[tier] || 'approval';
  return routeToStatus[route] || 'PENDING_APPROVAL';
}

export function riskLabelForTier(tier) {
  return riskLabels[tier] || riskLabels[4];
}

export function parseTierFilter(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n;
}

export { UC_DEFINITIONS, SEED_REQUESTS, SEED_AUDIT, riskLabels };
