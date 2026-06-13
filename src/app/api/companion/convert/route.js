import { NextResponse } from 'next/server';
import { requireTenantAccess } from '@/lib/companion/companionAuth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const ACTIVITY_STATES = new Set(['digging', 'mapping', 'building', 'testing', 'releasing', 'leaving', 'done']);
const PRIORITY_BANDS = new Set(['now', 'next', 'this_week', 'waiting', 'blocked', 'parked', 'backlog']);
const DEFAULT_COLUMN = 'Inbox';

function clean(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function generateSearchTokens(text) {
  if (!text) return [];
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const tokens = new Set([normalized]);
  words.forEach((word) => {
    if (word.length > 2) {
      tokens.add(word);
      for (let i = 3; i <= word.length; i += 1) tokens.add(word.slice(0, i));
    }
  });
  return Array.from(tokens);
}

function parseJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Claude did not return JSON.');
    return JSON.parse(match[0]);
  }
}

function validatePlan(value, workspaceName) {
  const plan = value && typeof value === 'object' ? value : {};
  const epicName = clean(plan.epicName, workspaceName || 'Companion Capture').slice(0, 120);
  const featureName = clean(plan.featureName, 'Inbox').slice(0, 120);
  const cardTitle = clean(plan.cardTitle, 'Captured task').slice(0, 160);
  const description = clean(plan.description, cardTitle).slice(0, 3000);
  const priority = PRIORITIES.has(plan.priority) ? plan.priority : 'MEDIUM';
  const size = clean(plan.size, 'M').slice(0, 24);
  const activityState = ACTIVITY_STATES.has(plan.activityState) ? plan.activityState : 'digging';
  const priorityBand = PRIORITY_BANDS.has(plan.priorityBand) ? plan.priorityBand : 'next';
  const acceptanceCriteria = Array.isArray(plan.acceptanceCriteria)
    ? plan.acceptanceCriteria.map((item) => clean(item)).filter(Boolean).slice(0, 6)
    : [];

  return {
    epicName,
    featureName,
    cardTitle,
    description,
    priority,
    size,
    activityState,
    priorityBand,
    acceptanceCriteria,
  };
}

async function classifyCapture({ rawText, workspaceName }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY on server.');
  }

  const model = process.env.COMPANION_ANTHROPIC_MODEL || process.env.SORR_ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.1,
      system:
        'You convert terse product/build notes into STEa/Filo backlog structure. Return JSON only. Do not invent external actions, user data, or credentials.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Workspace/app: ${workspaceName || 'Unknown'}\n` +
                `Capture:\n${rawText}\n\n` +
                `Return JSON with keys: epicName, featureName, cardTitle, description, priority (LOW|MEDIUM|HIGH), size, activityState (digging|mapping|building|testing|releasing|leaving|done), priorityBand (now|next|this_week|waiting|blocked|parked|backlog), acceptanceCriteria (array of short strings).`,
            },
          ],
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = payload?.error?.message || response.statusText;
    throw new Error(`Claude request failed (${response.status}): ${detail}`);
  }

  const text = Array.isArray(payload?.content)
    ? payload.content.map((part) => part?.text || '').join('\n').trim()
    : '';
  return validatePlan(parseJson(text), workspaceName);
}

async function findOrCreateEpic(db, FieldValue, { tenantId, app, plan, user }) {
  const snap = await db
    .collection('stea_epics')
    .where('name', '==', plan.epicName)
    .get();
  const existing = snap.docs.find((doc) => doc.data()?.tenantId === tenantId);
  if (existing) return existing.ref;

  const payload = {
    title: plan.epicName,
    name: plan.epicName,
    label: plan.epicName,
    epicLabel: plan.epicName,
    description: `Companion-created epic for ${app}.`,
    app,
    priority: plan.priority,
    statusColumn: DEFAULT_COLUMN,
    entityType: 'epic',
    type: 'epic',
    archived: false,
    tenantId,
    source: 'stea-companion-ai',
    searchTokens: generateSearchTokens(`${plan.epicName} ${app}`),
    createdAt: FieldValue.serverTimestamp(),
    createdBy: user.email,
  };
  return db.collection('stea_epics').add(payload);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const tenantId = clean(body?.tenantId);
  const rawText = clean(body?.rawText);
  const workspaceName = clean(body?.workspaceName, 'STEa');
  const app = clean(body?.app, workspaceName);

  if (!tenantId) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400 });
  if (!rawText) return NextResponse.json({ error: 'Capture text is required.' }, { status: 400 });

  const auth = await requireTenantAccess(request, tenantId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { db, FieldValue } = getFirebaseAdmin();
    const plan = await classifyCapture({ rawText, workspaceName });

    const epicRef = await findOrCreateEpic(db, FieldValue, { tenantId, app, plan, user: auth.user });
    const epicId = epicRef.id;

    const featurePayload = {
      epicId,
      title: plan.featureName,
      name: plan.featureName,
      label: plan.featureName,
      description: `Companion-created feature for ${plan.epicName}.`,
      app,
      priority: plan.priority,
      statusColumn: DEFAULT_COLUMN,
      entityType: 'feature',
      type: 'feature',
      archived: false,
      tenantId,
      source: 'stea-companion-ai',
      searchTokens: generateSearchTokens(`${plan.featureName} ${plan.epicName} ${app}`),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: auth.user.email,
    };
    const featureRef = await db.collection('stea_features').add(featurePayload);

    const cardPayload = {
      epicId,
      featureId: featureRef.id,
      title: plan.cardTitle,
      label: plan.cardTitle,
      description: plan.description,
      app,
      priority: plan.priority,
      size: plan.size,
      statusColumn: DEFAULT_COLUMN,
      entityType: 'card',
      type: 'card',
      archived: false,
      tenantId,
      source: 'stea-companion-ai',
      activityState: plan.activityState,
      priorityBand: plan.priorityBand,
      lastTouchedAt: FieldValue.serverTimestamp(),
      acceptanceCriteria: plan.acceptanceCriteria,
      searchTokens: generateSearchTokens(`${plan.cardTitle} ${plan.description} ${app}`),
      createdAt: FieldValue.serverTimestamp(),
      createdBy: auth.user.email,
    };
    const cardRef = await db.collection('stea_cards').add(cardPayload);

    return NextResponse.json({
      created: {
        epicId,
        featureId: featureRef.id,
        cardId: cardRef.id,
      },
      plan,
    });
  } catch (error) {
    console.error('[companion/convert]', error?.message);
    return NextResponse.json({ error: error?.message || 'Failed to create AI card.' }, { status: 500 });
  }
}
