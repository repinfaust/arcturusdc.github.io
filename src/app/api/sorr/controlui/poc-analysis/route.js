import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { POC_CONTEXT_PRIMER, POC_DOCUMENTS } from '@/lib/sorr/poc-analysis-documents';
import { verifySorrSession } from '@/lib/sorr/controlui-server';

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((part) => part.length >= 4);
}

function scoreDocForQuestion(doc, questionTerms) {
  const haystack = `${doc.title} ${doc.text || ''}`.toLowerCase();
  return questionTerms.reduce((score, term) => (haystack.includes(term) ? score + 1 : score), 0);
}

function trimText(value, maxLength = 7000) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

async function loadIndexableDocs() {
  const docs = await Promise.all(
    POC_DOCUMENTS.filter((doc) => doc.indexable).map(async (doc) => {
      const filePath = path.join(process.cwd(), 'public', doc.href.replace(/^\//, ''));
      const text = await readFile(filePath, 'utf8');
      return {
        ...doc,
        text: trimText(text),
      };
    })
  );
  return docs;
}

export async function GET(request) {
  const session = await verifySorrSession(request);
  if (!session.authenticated) {
    return NextResponse.json({ error: session.error || 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    docs: POC_DOCUMENTS,
    note: 'Binary documents (PDF/DOCX/PPTX) are listed for reference and opening. Indexed analysis currently uses text-based markdown sources plus POC context.',
  });
}

export async function POST(request) {
  try {
    const session = await verifySorrSession(request);
    if (!session.authenticated) {
      return NextResponse.json({ error: session.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const question = String(body?.question || '').trim();
    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Missing OPENAI_API_KEY on server. Add it in Vercel project environment variables.',
        },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const indexedDocs = await loadIndexableDocs();
    const terms = tokenize(question);
    const ranked = indexedDocs
      .map((doc) => ({ ...doc, score: scoreDocForQuestion(doc, terms) }))
      .sort((a, b) => b.score - a.score);

    const selectedDocs = ranked.filter((doc) => doc.score > 0).slice(0, 4);
    const fallbackDocs = ranked.slice(0, 2);
    const docsForPrompt = selectedDocs.length > 0 ? selectedDocs : fallbackDocs;

    const contextBlocks = [
      `POC PRIMER:\n${POC_CONTEXT_PRIMER}`,
      ...docsForPrompt.map((doc, index) => `SOURCE ${index + 1} (${doc.title}):\n${doc.text}`),
    ];

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
          {
            role: 'system',
            content:
              'You are an analyst for the SoRR Control POC. Answer with practical, concise business/product guidance. Use source-grounded language and cite sources like [1], [2] matching the provided source order.',
          },
          {
            role: 'user',
            content: `Question:\n${question}\n\nContext:\n${contextBlocks.join('\n\n')}`,
          },
        ],
      }),
    });

    if (!completion.ok) {
      const errorText = await completion.text();
      return NextResponse.json(
        {
          error: `OpenAI request failed (${completion.status}): ${errorText.slice(0, 400)}`,
        },
        { status: 502 }
      );
    }

    const payload = await completion.json();
    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: 'No answer returned from model.' }, { status: 502 });
    }

    return NextResponse.json({
      answer,
      sources: docsForPrompt.map((doc, index) => ({
        id: doc.id,
        title: doc.title,
        href: doc.href,
        cite: `[${index + 1}]`,
      })),
      listedDocs: POC_DOCUMENTS,
      model,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error',
      },
      { status: 500 }
    );
  }
}
