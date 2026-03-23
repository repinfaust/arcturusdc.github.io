#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const COLLECTION = 'paygo_poc_analysis_docs';
const DEFAULT_SOURCE_DIR = '/Users/davidloake/Library/Mobile Documents/com~apple~CloudDocs/Downloads';

const DOCS = [
  {
    id: 'paygo-poc-v02',
    title: 'PAYGO POC Build Spec v02',
    fileName: 'paygo_poc_build_spec_v02.md',
  },
  {
    id: 'payg-poc-v1',
    title: 'PAYG POC Build Spec',
    fileName: 'payg_poc_build_spec.md',
  },
  {
    id: 'paygo-ai-analyst',
    title: 'PAYGO AI Analyst Spec',
    fileName: 'paygo_ai_analyst_spec.md',
  },
];

function parseServiceAccount() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_JSON (or FIREBASE_SERVICE_ACCOUNT_KEY) is not set.');
  }

  const trimmed = raw.trim();
  const jsonString = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf8');
  return JSON.parse(jsonString);
}

function resolveDocPath(fileName) {
  const customDir = process.env.PAYGO_DOCS_DIR;
  const candidates = [
    customDir ? path.join(customDir, fileName) : null,
    path.join(DEFAULT_SOURCE_DIR, fileName),
    path.join(process.cwd(), 'private-docs', 'paygo', fileName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`Could not find source file: ${fileName}. Checked: ${candidates.join(', ')}`);
}

async function main() {
  const serviceAccount = parseServiceAccount();
  const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);

  const batch = db.batch();

  for (const doc of DOCS) {
    const sourcePath = resolveDocPath(doc.fileName);
    const text = fs.readFileSync(sourcePath, 'utf8');

    const ref = db.collection(COLLECTION).doc(doc.id);
    batch.set(
      ref,
      {
        id: doc.id,
        title: doc.title,
        text,
        indexable: true,
        enabled: true,
        sourceFileName: doc.fileName,
        charCount: text.length,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`Prepared: ${doc.id} <- ${sourcePath}`);
  }

  await batch.commit();
  console.log(`Seeded ${DOCS.length} PAYGO analysis docs into Firestore collection '${COLLECTION}'.`);
}

main().catch((error) => {
  console.error('Failed to seed PAYGO docs:', error.message || error);
  process.exit(1);
});
