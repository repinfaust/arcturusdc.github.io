// Shared LLM call for the career-engine apps (Career Ops, Squared).
// Primary provider: OpenAI (`CAREER_OPENAI_API_KEY` or `OPENAI_API_KEY`, model
// `CAREER_OPENAI_MODEL` || `'gpt-4o'`). Falls back to Anthropic (`ANTHROPIC_API_KEY`,
// `CAREER_ANTHROPIC_MODEL` || `'claude-sonnet-4-6'`) if OpenAI is not set or
// returns a quota/auth failure (D-SITE-081).
const OPENAI_MODEL = process.env.CAREER_OPENAI_MODEL || 'gpt-4o';
const ANTHROPIC_MODEL = process.env.CAREER_ANTHROPIC_MODEL || 'claude-sonnet-4-6';

async function callOpenAI({ apiKey, system, prompt, maxTokens = 2000, cachedContext, tools }) {
  const wantsWebSearch = Array.isArray(tools) && tools.some((t) => String(t?.type || t?.name || '').includes('web_search'));

  // When web search is requested (e.g. `research_company`), try OpenAI's Responses
  // API with `web_search_preview` first, then fall back to Chat Completions.
  if (wantsWebSearch) {
    try {
      const input = [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...(cachedContext ? [{ role: 'user', content: cachedContext }] : []),
        { role: 'user', content: prompt },
      ];
      const rRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          input,
          tools: [{ type: 'web_search_preview' }],
          max_output_tokens: maxTokens,
        }),
      });
      const rPayload = await rRes.json();
      if (rRes.ok) {
        if (typeof rPayload.output_text === 'string' && rPayload.output_text.trim()) {
          return rPayload.output_text.trim();
        }
        const texts = (rPayload.output || [])
          .flatMap((item) => item?.content || [])
          .filter((c) => typeof c?.text === 'string')
          .map((c) => c.text.trim())
          .filter(Boolean);
        if (texts.length > 0) return texts.join('\n\n');
      }
    } catch {
      // Fall through to standard Chat Completions.
    }
  }

  // Place `system` and `cachedContext` first so OpenAI's automatic prefix caching
  // discounts repeated candidate profile + evidence + CV tokens by 50%.
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  if (cachedContext) messages.push({ role: 'user', content: cachedContext });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: maxTokens,
      messages,
    }),
  });
  const payload = await res.json();
  if (!res.ok) {
    const detail = payload?.error?.message || res.statusText;
    const code = payload?.error?.code ? ` (${payload.error.code})` : '';
    const err = new Error(`OpenAI API ${res.status}${code}: ${detail} [model=${OPENAI_MODEL}]`);
    err.status = res.status;
    throw err;
  }
  return payload.choices?.[0]?.message?.content ?? '';
}

async function callClaude({ apiKey, system, prompt, maxTokens = 2000, cachedContext, tools }) {
  const content = [];
  if (cachedContext) {
    content.push({ type: 'text', text: cachedContext, cache_control: { type: 'ephemeral' } });
  }
  content.push({ type: 'text', text: prompt });

  async function send(withTools) {
    const body = {
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    };
    if (withTools && Array.isArray(tools) && tools.length > 0) {
      body.tools = tools;
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const payload = await res.json();
    return { res, payload };
  }

  let { res, payload } = await send(true);
  if (!res.ok && tools?.length) {
    ({ res, payload } = await send(false));
  }

  if (!res.ok) {
    const detail = payload?.error?.message || res.statusText;
    const type = payload?.error?.type ? ` (${payload.error.type})` : '';
    throw new Error(`Anthropic API ${res.status}${type}: ${detail} [model=${ANTHROPIC_MODEL}]`);
  }
  if (Array.isArray(payload.content)) {
    const texts = payload.content
      .filter((b) => b?.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text.trim())
      .filter(Boolean);
    if (texts.length > 0) return texts.join('\n\n');
  }
  return payload.content?.[0]?.text ?? '';
}

export async function callAnthropic(opts) {
  const openaiKey = process.env.CAREER_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!openaiKey && !anthropicKey) {
    throw new Error('Missing OPENAI_API_KEY (or ANTHROPIC_API_KEY) on server. Add it in Vercel project environment variables.');
  }

  if (openaiKey) {
    try {
      return await callOpenAI({ ...opts, apiKey: openaiKey });
    } catch (err) {
      // If OpenAI fails and Anthropic is configured, fall back cleanly.
      if (anthropicKey) {
        console.warn('OpenAI call failed in careerEngine; falling back to Anthropic:', err.message);
        return await callClaude({ ...opts, apiKey: anthropicKey });
      }
      throw err;
    }
  }

  return await callClaude({ ...opts, apiKey: anthropicKey });
}

// Anthropic has no JSON response-format flag, so we ask for raw JSON and strip
// any ```json fences before parsing.
export function stripJsonFences(raw) {
  return (raw || '').replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
