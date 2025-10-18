// scripts/firestore-jest-reporter.js
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let db = null;

function normalizePrivateKey(key) {
  if (!key) return key;
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

function getDb() {
  if (db) return db;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY');
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  db = getFirestore();
  return db;
}

async function safeSet(docRef, data) {
  try {
    await docRef.set(data, { merge: true });
  } catch (err) {
    console.error('[firestore-jest-reporter] Failed to write to Firestore', err);
  }
}

class FirestoreJestReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.runId = process.env.STEA_RUN_ID || Date.now().toString();
    this.initiatedBy = process.env.STEA_INITIATED_BY || 'dashboard';
    this.configType = process.env.STEA_CONFIG_TYPE || 'quick';
  }

  async onRunStart() {
    const firestore = getDb();
    const doc = firestore.collection('testRuns').doc(this.runId);

    await safeSet(doc, {
      status: 'running',
      startedAt: new Date(),
      suites: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      configType: this.configType,
      progressAt: new Date(),
      initiatedBy: this.initiatedBy,
    });
  }

  async onTestResult(test, testResult) {
    const firestore = getDb();
    const doc = firestore.collection('testRuns').doc(this.runId);

    const passed = testResult.numPassingTests || 0;
    const failed = (testResult.numFailingTests || 0) + (testResult.numPendingTests || 0);
    const total = testResult.testResults?.length || passed + failed;

    await safeSet(doc, {
      suites: FieldValue.increment(1),
      tests: FieldValue.increment(total),
      passed: FieldValue.increment(passed),
      failed: FieldValue.increment(failed),
      lastFile: testResult.testFilePath,
      progressAt: new Date(),
    });
  }

  async onRunComplete(contexts, results) {
    const firestore = getDb();
    const doc = firestore.collection('testRuns').doc(this.runId);

    await safeSet(doc, {
      status: results.numFailedTests > 0 ? 'failed' : 'passed',
      finishedAt: new Date(),
      summary: {
        totalTests: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
        time: results.startTime ? Date.now() - results.startTime : null,
      },
    });
  }
}

module.exports = FirestoreJestReporter;
