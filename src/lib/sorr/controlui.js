const UC_DEFINITIONS = [
  {
    id: 'UC-01',
    name: 'Customer Billing Adjustment',
    summary: 'Draft customer billing corrections and credits for support cases.',
    route: 'immediate',
    tier: 2,
    keywords: ['billing', 'credit', 'invoice', 'adjustment', 'refund'],
    confidenceBoost: 0.1,
    permittedTools: ['kb_search', 'billing_read', 'draft_generator'],
    blockedActions: ['billing_write', 'payment_capture'],
  },
  {
    id: 'UC-02',
    name: 'Complaint Resolution Summary',
    summary: 'Prepare regulated complaint-response summaries for review.',
    route: 'approval',
    tier: 3,
    keywords: ['complaint', 'ombudsman', 'escalation', 'regulator'],
    confidenceBoost: 0.12,
    permittedTools: ['kb_search', 'metering_records', 'draft_generator'],
    blockedActions: ['external_send', 'policy_override'],
  },
  {
    id: 'UC-03',
    name: 'Metering Dispute Decision',
    summary: 'Assess disputed meter reads and produce governed recommendations.',
    route: 'workspace',
    tier: 4,
    keywords: ['metering', 'dispute', 'consumption', 'back-billing', 'readings'],
    confidenceBoost: 0.14,
    permittedTools: ['metering_records', 'kb_search', 'draft_generator'],
    blockedActions: ['billing_write', 'customer_notification_send', 'tariff_change'],
  },
  {
    id: 'UC-04',
    name: 'Tariff Comparison Guidance',
    summary: 'Draft plain-language tariff comparison guidance for frontline teams.',
    route: 'immediate',
    tier: 1,
    keywords: ['tariff', 'comparison', 'price plan', 'switch'],
    confidenceBoost: 0.09,
    permittedTools: ['kb_search', 'pricing_catalog', 'draft_generator'],
    blockedActions: ['price_override'],
  },
  {
    id: 'UC-05',
    name: 'Vulnerable Customer Safeguarding',
    summary: 'Prepare support actions for vulnerable customer safeguarding cases.',
    route: 'approval',
    tier: 4,
    keywords: ['vulnerable', 'safeguarding', 'priority services', 'medical'],
    confidenceBoost: 0.15,
    permittedTools: ['kb_search', 'priority_services_register', 'draft_generator'],
    blockedActions: ['external_send', 'profile_write', 'payment_collection'],
  },
];

const SEED_REQUESTS = [
  {
    id: 'REQ-2026-0411',
    prompt: 'Draft a response for a disputed estimated bill after a faulty smart meter read.',
    useCaseId: 'UC-03',
    useCaseName: 'Metering Dispute Decision',
    route: 'workspace',
    tier: 4,
    confidence: 0.92,
    status: 'APPROVED',
    owner: 'lee.hawkins@ensek.example',
    createdAt: '2026-03-20T09:12:00.000Z',
    updatedAt: '2026-03-20T09:45:00.000Z',
    requestedByUid: 'seed-user-01',
  },
  {
    id: 'REQ-2026-0412',
    prompt: 'Summarise complaint evidence for ombudsman escalation and draft proposed remedy.',
    useCaseId: 'UC-02',
    useCaseName: 'Complaint Resolution Summary',
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
    prompt: 'Create tariff comparison notes for fixed versus tracker products for support agents.',
    useCaseId: 'UC-04',
    useCaseName: 'Tariff Comparison Guidance',
    route: 'immediate',
    tier: 1,
    confidence: 0.9,
    status: 'COMPLETED',
    owner: 'tom.riley@ensek.example',
    createdAt: '2026-03-20T12:55:00.000Z',
    updatedAt: '2026-03-20T13:02:00.000Z',
    requestedByUid: 'seed-user-01',
  },
  {
    id: 'REQ-2026-0414',
    prompt: 'Assess support options for medically vulnerable customer with arrears pressure.',
    useCaseId: 'UC-05',
    useCaseName: 'Vulnerable Customer Safeguarding',
    route: 'approval',
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
    prompt: 'Draft billing credit explanation for a customer impacted by delayed meter replacement.',
    useCaseId: 'UC-01',
    useCaseName: 'Customer Billing Adjustment',
    route: 'immediate',
    tier: 2,
    confidence: 0.85,
    status: 'COMPLETED',
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
    detail: 'UC-03 matched; routed to governed workspace.',
    tier: 4,
    createdAt: '2026-03-20T09:12:03.000Z',
  },
  {
    id: 'AUD-7002',
    requestId: 'REQ-2026-0411',
    actor: 'k.holland@ensek.example',
    action: 'APPROVED',
    detail: 'Senior reviewer approved T4 request for workspace drafting.',
    tier: 4,
    createdAt: '2026-03-20T09:44:45.000Z',
  },
  {
    id: 'AUD-7003',
    requestId: 'REQ-2026-0412',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-02 matched; pending human approval.',
    tier: 3,
    createdAt: '2026-03-20T11:07:05.000Z',
  },
  {
    id: 'AUD-7004',
    requestId: 'REQ-2026-0414',
    actor: 'router@system',
    action: 'CLASSIFIED',
    detail: 'UC-05 matched; safeguarding controls activated.',
    tier: 4,
    createdAt: '2026-03-20T14:11:07.000Z',
  },
  {
    id: 'AUD-7005',
    requestId: 'REQ-2026-0415',
    actor: 'router@system',
    action: 'COMPLETED',
    detail: 'Immediate route completed with policy-compliant draft output.',
    tier: 2,
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
