import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { PAYGO_CONTEXT_PRIMER, PAYGO_POC_DOC_COLLECTION, PAYGO_PRIVATE_DOCS } from '@/lib/paygo/poc-analysis-documents';
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

async function loadIndexableDocsFromFirestore() {
  const { db } = getFirebaseAdmin();
  const snapshot = await db.collection(PAYGO_POC_DOC_COLLECTION).get();

  const docs = snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
    .filter((doc) => doc.indexable !== false && typeof doc.text === 'string' && doc.text.trim().length > 0)
    .map((doc) => ({
      id: doc.id,
      title: String(doc.title || doc.id),
      text: trimText(doc.text),
    }));

  return docs;
}

async function loadPrivateDocs() {
  const docs = await Promise.all(
    PAYGO_PRIVATE_DOCS.map(async (doc) => {
      const fullPath = path.join(process.cwd(), doc.privatePath);
      const text = await readFile(fullPath, 'utf8');
      return {
        id: doc.id,
        title: doc.title,
        text: trimText(text),
      };
    })
  );
  return docs;
}

async function backfillFirestoreDocs(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return;
  const { db, FieldValue } = getFirebaseAdmin();
  const batch = db.batch();

  for (const doc of docs) {
    const ref = db.collection(PAYGO_POC_DOC_COLLECTION).doc(doc.id);
    batch.set(
      ref,
      {
        id: doc.id,
        title: doc.title,
        text: doc.text,
        indexable: true,
        enabled: true,
        charCount: String(doc.text || '').length,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
}

async function loadDocsWithFallback() {
  const firestoreDocs = await loadIndexableDocsFromFirestore();
  if (firestoreDocs.length > 0) return firestoreDocs;

  const privateDocs = await loadPrivateDocs();
  if (privateDocs.length === 0) {
    throw new Error('No PAYGO analysis documents are available.');
  }

  // Self-heal: repopulate Firestore on first request if collection is empty.
  await backfillFirestoreDocs(privateDocs).catch(() => undefined);
  return privateDocs;
}

export async function GET(request) {
  const session = await verifySorrSession(request);
  if (!session.authenticated) {
    return NextResponse.json({ error: session.error || 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    note: 'PAYGO document analysis is enabled. Source specs are loaded server-side from Firebase and are not publicly exposed.',
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
    const indexedDocs = await loadDocsWithFallback();
    const terms = tokenize(question);
    const ranked = indexedDocs
      .map((doc) => ({ ...doc, score: scoreDocForQuestion(doc, terms) }))
      .sort((a, b) => b.score - a.score);

    const selectedDocs = ranked.filter((doc) => doc.score > 0).slice(0, 4);
    const fallbackDocs = ranked.slice(0, 2);
    const docsForPrompt = selectedDocs.length > 0 ? selectedDocs : fallbackDocs;

    const contextBlocks = [
      `PAYGO PRIMER:\n${PAYGO_CONTEXT_PRIMER}`,
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
              'You are an analyst for the PAYGO POC. Provide concise, practical answers grounded in the supplied documents. Cite sources using [1], [2], etc matching the provided source order.',
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
        cite: `[${index + 1}]`,
      })),
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
