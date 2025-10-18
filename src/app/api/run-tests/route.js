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

export async function POST(request) {
  try {
    const body = await readBody(request);
    const configType =
      typeof body?.configType === 'string' && body.configType.trim().length > 0
        ? body.configType.trim()
        : 'quick';

    const owner = process.env.GH_REPO_OWNER;
    const repo = process.env.GH_REPO_NAME;
    const token = process.env.GH_PAT;

    if (!owner || !repo || !token) {
      return json(
        {
          error: 'Missing GitHub dispatch environment variables',
          required: ['GH_REPO_OWNER', 'GH_REPO_NAME', 'GH_PAT'],
        },
        500,
      );
    }

    const runId = Date.now().toString();

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        event_type: 'stea_run_tests',
        client_payload: {
          runId,
          configType,
          initiatedBy: 'dashboard',
        },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      return json(
        {
          error: 'Failed to dispatch GitHub workflow',
          status: response.status,
          details,
        },
        500,
      );
    }

    return json({ status: 'queued', runId, configType }, 202);
  } catch (error) {
    const message = error && typeof error.message === 'string' ? error.message : String(error);
    return json({ error: message }, 500);
  }
}
