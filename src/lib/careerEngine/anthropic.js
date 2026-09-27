// Shared Anthropic call for the career-engine apps (Career Ops, Squared).
const ANTHROPIC_MODEL = process.env.CAREER_ANTHROPIC_MODEL || 'claude-sonnet-4-6';

// `cachedContext` is a large, reusable text block (candidate profile + evidence)
// that is identical across calls — marked with cache_control so repeated input
// tokens bill at ~10% within the 5-minute cache window.
export async function callAnthropic({ system, prompt, maxTokens = 2000, cachedContext }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY on server. Add it in Vercel project environment variables.');

  const content = [];
  if (cachedContext) {
    content.push({ type: 'text', text: cachedContext, cache_control: { type: 'ephemeral' } });
  }
  content.push({ type: 'text', text: prompt });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }),
  });
  const payload = await res.json();
  if (!res.ok) {
    const detail = payload?.error?.message || res.statusText;
    const type = payload?.error?.type ? ` (${payload.error.type})` : '';
    throw new Error(`Anthropic API ${res.status}${type}: ${detail} [model=${ANTHROPIC_MODEL}]`);
  }
  return payload.content?.[0]?.text ?? '';
}

// Anthropic has no JSON response-format flag, so we ask for raw JSON and strip
// any ```json fences before parsing.
export function stripJsonFences(raw) {
  return (raw || '').replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
