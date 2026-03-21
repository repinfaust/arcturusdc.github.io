import { NextResponse } from 'next/server';
import {
  UC_DEFINITIONS,
  approvalStatusForTier,
  buildPolicyBundle,
  buildRequestId,
  classifyPromptLocal,
  parseTierFilter,
  riskLabelForTier,
} from '@/lib/sorr/controlui';
import { COLLECTIONS, ensureSeedData, getSorrDb, verifySorrSession } from '@/lib/sorr/controlui-server';

function makeAuditId() {
  return `AUD-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
}

function parseClaudeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function classifyWithClaude(prompt, localClassification) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { used: false, classification: localClassification, source: 'local' };
  }

  const model = process.env.SORR_ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  const useCasesSummary = UC_DEFINITIONS.map((uc) => `${uc.id}: ${uc.name} (tier ${uc.tier})`).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 320,
      temperature: 0,
      system:
        'You are a strict enterprise governance classifier. Return JSON only with keys useCaseId, confidence, rationale. Confidence must be between 0 and 1.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Classify this employee prompt to one of these use cases:\n${useCasesSummary}\n\nPrompt:\n${prompt}\n\nIf no use case confidently matches, return useCaseId as BLOCKED.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    return { used: true, classification: localClassification, source: 'local_fallback' };
  }

  const data = await response.json();
  const rawText = Array.isArray(data?.content) ? data.content.map((c) => c?.text || '').join('\n') : '';
  const parsed = parseClaudeJson(rawText);

  if (!parsed?.useCaseId) {
    return { used: true, classification: localClassification, source: 'local_fallback' };
  }

  if (String(parsed.useCaseId).toUpperCase() === 'BLOCKED') {
    return {
      used: true,
      source: 'claude',
      classification: {
        blocked: true,
        reason: 'Claude marked prompt as ambiguous or out-of-policy.',
        confidence: Number(parsed.confidence || 0),
        route: 'blocked',
        tier: 4,
        riskLabel: riskLabelForTier(4),
        matchedUseCase: null,
        permittedTools: [],
        blockedActions: ['all_actions'],
      },
    };
  }

  const matched = UC_DEFINITIONS.find((uc) => uc.id === parsed.useCaseId);
  if (!matched) {
    return { used: true, classification: localClassification, source: 'local_fallback' };
  }

  return {
    used: true,
    source: 'claude',
    classification: {
      blocked: false,
      reason: null,
      confidence: Number(parsed.confidence || 0.7),
      route: matched.route,
      tier: matched.tier,
      riskLabel: riskLabelForTier(matched.tier),
      matchedUseCase: {
        id: matched.id,
        name: matched.name,
        summary: matched.summary,
      },
      permittedTools: matched.permittedTools,
      blockedActions: matched.blockedActions,
    },
  };
}

function pickClassification(local, claudeResult) {
  const claude = claudeResult.classification;
  if (!claudeResult.used) return { classification: local, source: 'local' };
  if (claude.blocked && !local.blocked) return { classification: local, source: 'local' };
  if (!claude.blocked && claude.confidence >= local.confidence) {
    return { classification: claude, source: claudeResult.source };
  }
  return { classification: local, source: 'local' };
}

export async function GET(request) {
  const auth = await verifySorrSession(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';
    const tier = parseTierFilter(url.searchParams.get('tier'));

    const { db } = await getSorrDb();
    await ensureSeedData(db);

    let query = db.collection(COLLECTIONS.requests).orderBy('createdAt', 'desc').limit(200);
    if (status) query = query.where('status', '==', status);
    if (tier) query = query.where('tier', '==', tier);

    const snapshot = await query.get();
    const requests = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      };
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error('[SoRR Control requests/get] failed', error);
    return NextResponse.json({ error: 'Failed to load requests.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await verifySorrSession(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const localClassification = classifyPromptLocal(prompt);
    const claudeResult = await classifyWithClaude(prompt, localClassification);
    const { classification, source } = pickClassification(localClassification, claudeResult);

    const requestId = buildRequestId();
    const status = classification.blocked ? 'BLOCKED' : approvalStatusForTier(classification.tier);
    const now = new Date();

    const requestDoc = {
      id: requestId,
      prompt,
      useCaseId: classification.matchedUseCase?.id || null,
      useCaseName: classification.matchedUseCase?.name || null,
      route: classification.route,
      tier: classification.tier,
      confidence: classification.confidence,
      status,
      owner: auth.user.email,
      requestedByUid: auth.user.uid,
      createdAt: now,
      updatedAt: now,
      classifierSource: source,
    };

    const policyBundle = buildPolicyBundle(requestId, classification);
    const auditDoc = {
      id: makeAuditId(),
      requestId,
      actor: 'router@system',
      action: classification.blocked ? 'BLOCKED' : 'CLASSIFIED',
      detail: classification.blocked
        ? classification.reason || 'Request blocked by fail-closed policy.'
        : `${classification.matchedUseCase?.id} matched (${source}). Routed to ${classification.route}.`,
      tier: classification.tier,
      createdAt: now,
    };

    const { db } = await getSorrDb();
    await ensureSeedData(db);

    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.requests).doc(requestId), requestDoc);
    batch.set(db.collection(COLLECTIONS.policyBundles).doc(requestId), policyBundle);
    batch.set(db.collection(COLLECTIONS.auditLog).doc(auditDoc.id), auditDoc);
    await batch.commit();

    return NextResponse.json(
      {
        request: { ...requestDoc, createdAt: now.toISOString(), updatedAt: now.toISOString() },
        policyBundle,
        audit: { ...auditDoc, createdAt: now.toISOString() },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SoRR Control requests/post] failed', error);
    return NextResponse.json({ error: 'Failed to create request.' }, { status: 500 });
  }
}
