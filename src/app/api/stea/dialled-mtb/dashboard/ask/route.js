import { NextResponse } from 'next/server';

import { METRIC_DEFINITIONS, getLatestDashboardSnapshot } from '@/lib/dialledDashboard';
import { verifySteaWorkspaceAccess } from '@/lib/steaAccessServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_WORKSPACES = ['Dialled MTB', 'ArcturusDC'];
const ADMIN_ROLES = new Set(['super_admin', 'admin']);
const MAX_HISTORY_TURNS = 6;

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (turn) =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 4000) }));
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const access = await verifySteaWorkspaceAccess(request, {
    tenantId: body?.tenantId,
    allowedWorkspaceNames: ALLOWED_WORKSPACES,
  });
  if (!access.ok) return json({ error: access.error }, access.status);
  if (!ADMIN_ROLES.has(access.user.role)) {
    return json({ error: 'Workspace admin access is required.' }, 403);
  }

  const question = String(body?.question || '').trim();
  if (!question) return json({ error: 'Question is required.' }, 400);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: 'Missing OPENAI_API_KEY on server. Add it in Vercel project environment variables.' }, 500);
  }

  try {
    const snapshot = await getLatestDashboardSnapshot();
    if (!snapshot) {
      return json({ error: 'No dashboard snapshot exists yet. Open the dashboard or hit Refresh first.' }, 409);
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const systemPrompt = [
      'You are the analytics assistant for Dialled MTB, a mountain-bike maintenance and setup app.',
      'Answer questions from the founders using ONLY the snapshot JSON provided. Be concise, quantitative, and practical.',
      'If the snapshot cannot answer a question, say so plainly rather than guessing. All money-free product metrics; user ids are pseudonymous.',
      `The snapshot was generated at ${snapshot.generatedAt} (trigger: ${snapshot.trigger}).`,
      '',
      'Metric definitions:',
      METRIC_DEFINITIONS,
      '',
      'Snapshot JSON:',
      JSON.stringify(snapshot),
    ].join('\n');

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizeHistory(body?.history),
          { role: 'user', content: question },
        ],
      }),
    });

    if (!completion.ok) {
      const errorText = await completion.text();
      return json({ error: `OpenAI request failed (${completion.status}): ${errorText.slice(0, 400)}` }, 502);
    }

    const payload = await completion.json();
    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) return json({ error: 'No answer returned from model.' }, 502);

    return json({ answer, model, generatedAt: snapshot.generatedAt });
  } catch (error) {
    console.error('[dialled-dashboard] ask failed', error);
    return json({ error: error?.message || 'Unexpected error' }, 500);
  }
}
