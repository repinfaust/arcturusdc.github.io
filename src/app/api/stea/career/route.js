import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

async function loadConfig(fileName) {
  const filePath = path.join(process.cwd(), 'src/app/apps/stea/career/config', fileName);
  return await readFile(filePath, 'utf8');
}

async function loadPrompt(fileName) {
  const filePath = path.join(process.cwd(), 'src/app/apps/stea/career/prompts', fileName);
  return await readFile(filePath, 'utf8');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, url, jd_text } = body;

    if (action === 'analyze') {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4o';

      // Load configs and prompts
      const candidateProfile = await loadConfig('candidate_profile.yaml');
      const evidenceLibrary = await loadConfig('evidence_library.yaml');
      const extractPromptTemplate = await loadPrompt('extract.md');
      const evaluatePromptTemplate = await loadPrompt('evaluate.md');

      // 1. Extract JD Data
      const extractPrompt = extractPromptTemplate.replace('{{jd_text}}', jd_text || url);
      
      const extractRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are an expert recruiter for Senior PM roles.' },
            { role: 'user', content: extractPrompt }
          ],
          response_format: { type: 'json_object' }
        }),
      });

      const extractPayload = await extractRes.json();
      const jdData = extractPayload.choices[0].message.content;

      // 2. Evaluate against profile
      const evaluatePrompt = evaluatePromptTemplate
        .replace('{{candidate_profile}}', candidateProfile)
        .replace('{{jd_data}}', jdData)
        .replace('{{evidence_library}}', evidenceLibrary);

      const evaluateRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a career coach for Senior Product Managers.' },
            { role: 'user', content: evaluatePrompt }
          ]
        }),
      });

      const evaluatePayload = await evaluateRes.json();
      const evaluation = evaluatePayload.choices[0].message.content;

      return NextResponse.json({
        jd_data: JSON.parse(jdData),
        evaluation
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Career Ops Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
