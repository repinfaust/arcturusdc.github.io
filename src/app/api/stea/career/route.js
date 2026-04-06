import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/firebaseAdmin';

// David's workspace ID (ArcturusDC primary tenant or his specific one)
const DAVID_TENANT_ID = 'KovW8P7K5O2537V8I3H1'; 

async function loadLocalConfig(fileName) {
  const filePath = path.join(process.cwd(), 'src/app/apps/stea/career/config', fileName);
  return await readFile(filePath, 'utf8');
}

async function getWorkspaceConfig(tenantId, configName) {
  // If it's David's tenant, load from local YAML
  if (tenantId === DAVID_TENANT_ID) {
    return await loadLocalConfig(`${configName}.yaml`);
  }

  // Otherwise, load from Firestore
  const configDoc = await db.collection('tenants').doc(tenantId).collection('career_ops').doc('config').get();
  if (configDoc.exists) {
    return configDoc.data()[configName] || '';
  }
  return '';
}

async function loadPrompt(fileName) {
  const filePath = path.join(process.cwd(), 'src/app/apps/stea/career/prompts', fileName);
  return await readFile(filePath, 'utf8');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, url, jd_text, tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    if (action === 'get_config') {
      const profile = await getWorkspaceConfig(tenantId, 'candidate_profile');
      const evidence = await getWorkspaceConfig(tenantId, 'evidence_library');
      const weights = await getWorkspaceConfig(tenantId, 'scoring_weights');
      
      return NextResponse.json({
        has_config: !!profile && !!evidence,
        profile,
        evidence,
        weights
      });
    }

    if (action === 'save_config') {
      const { profile, evidence, weights } = body;
      await db.collection('tenants').doc(tenantId).collection('career_ops').doc('config').set({
        candidate_profile: profile,
        evidence_library: evidence,
        scoring_weights: weights,
        updated_at: new Date()
      }, { merge: true });
      
      return NextResponse.json({ success: true });
    }

    if (action === 'analyse') {
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4o';

      // Load workspace-specific config
      const candidateProfile = await getWorkspaceConfig(tenantId, 'candidate_profile');
      const evidenceLibrary = await getWorkspaceConfig(tenantId, 'evidence_library');

      if (!candidateProfile || !evidenceLibrary) {
        return NextResponse.json({ error: 'Workspace configuration is incomplete. Please set up your profile and evidence library first.' }, { status: 400 });
      }

      // Load generic prompts
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
