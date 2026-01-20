import { NextRequest } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const maxDuration = 60;

function json(body, init = 200) {
  return new Response(JSON.stringify(body), {
    status: typeof init === 'number' ? init : init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function cancelGithubRun(runId) {
  try {
    const owner = process.env.GH_REPO_OWNER;
    const repo = process.env.GH_REPO_NAME;
    const token = process.env.GH_PAT;

    if (!owner || !repo || !token) {
      return;
    }

    const runsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?event=repository_dispatch&status=in_progress&per_page=20`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
        },
      },
    );

    if (!runsResponse.ok) {
      console.warn('[run-tests/cancel] Failed to list workflow runs', await runsResponse.text());
      return;
    }

    const payload = await runsResponse.json();
    const run = payload.workflow_runs?.find((item) => item?.name?.includes(runId));

    if (!run) {
      return;
    }

    await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });
  } catch (error) {
    console.warn('[run-tests/cancel] Unable to cancel GitHub workflow', error);
  }
}

export async function POST(request) {
  const body = await readBody(request);
  const runId = typeof body?.runId === 'string' ? body.runId.trim() : '';

  if (!runId) {
    return json({ error: 'runId is required' }, 400);
  }

  const cancelledBy =
    typeof body?.cancelledBy === 'string' && body.cancelledBy.trim().length > 0
      ? body.cancelledBy.trim()
      : 'dashboard';
  const reason =
    typeof body?.reason === 'string' && body.reason.trim().length > 0
      ? body.reason.trim()
      : 'Cancelled from dashboard';

  try {
    const { db, FieldValue } = getFirebaseAdmin();
    await db.collection('testRuns').doc(runId).set(
      {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy,
        cancelledReason: reason,
      },
      { merge: true },
    );
  } catch (error) {
    console.error('[run-tests/cancel] Failed to update Firestore', error);
    return json({ error: 'Failed to update run status' }, 500);
  }

  cancelGithubRun(runId);

  return json({ status: 'cancelled', runId });
}
