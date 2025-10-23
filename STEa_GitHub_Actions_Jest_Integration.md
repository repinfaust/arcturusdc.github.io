# ✅ STEa Automated Tests via **GitHub Actions** — End‑to‑End Guide

This moves Jest execution **out of Vercel’s serverless** and into **GitHub Actions**, while your dashboard keeps polling Firestore for live progress/results. No more bundling fights with Jest’s lazy deps.

---

## Diagram (high‑level)

Dashboard → **POST /api/run-tests** (Next.js) → **repository_dispatch** → **GitHub Actions** runner  
GitHub runner → `npm ci && jest --reporters=.../firestore-jest-reporter.js` → **Firestore** (progress + results)  
Dashboard → polls **Firestore** → updates UI

---

## Prerequisites

1) **GitHub repository** hosting your app (with your `__tests__`, `package.json`, etc.).  
2) **Firestore project** + a **Service Account** with permissions to write to a collection (e.g., `testRuns`).  
3) **Vercel environment variables** to authenticate to GitHub (to trigger the workflow).  
4) Node 18+ or 20 in your project.

---

## Secrets & Environment Variables

### A) In **Vercel** (Project → Settings → Environment Variables)
- `GH_PAT` — **GitHub Personal Access Token** with scopes: `repo` and `workflow` (or use a GitHub App token).  
- `GH_REPO_OWNER` — e.g., `your-org-or-user`  
- `GH_REPO_NAME` — e.g., `your-repo`  

*(Optional — to pre-create a Firestore run doc before dispatch)*  
- `FIREBASE_PROJECT_ID`  
- `FIREBASE_CLIENT_EMAIL`  
- `FIREBASE_PRIVATE_KEY` (multiline; Vercel will store it—use `\n` or pasting raw; we’ll normalize in code)

### B) In **GitHub** repo settings → Secrets and variables → **Actions** → **New repository secret**
- `FIREBASE_PROJECT_ID`  
- `FIREBASE_CLIENT_EMAIL`  
- `FIREBASE_PRIVATE_KEY` (paste the raw key; we’ll normalize newlines in the reporter)  

> You *do not* need to store the GitHub token in GitHub; the runner already has access. You only need the Firebase secrets in GitHub so the reporter can write to Firestore.

---

## Firestore Data Model

**Collection:** `testRuns`  
**Doc ID:** a generated string (`runId`) returned to the dashboard

**Document fields (example):**
```jsonc
{
  "status": "running" | "passed" | "failed",
  "startedAt": <timestamp>,
  "finishedAt": <timestamp | null>,
  "suites": 0,
  "tests": 0,
  "passed": 0,
  "failed": 0,
  "lastFile": "path/to/test.spec.js",
  "summary": {
    "totalTests": 0,
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "time": 0
  },
  "progressAt": <timestamp>,
  "initiatedBy": "<uid/email or 'dashboard'>"
}
```

> Your existing UI can watch `testRuns/{runId}` and render progress. No schema migration required if you already use something similar.

---

## 1) Next.js **Route Handler**: `app/api/run-tests/route.ts`

This endpoint queues a GitHub workflow run via `repository_dispatch`. It returns `202` and a `runId` your UI can use to poll Firestore.

```ts
// app/api/run-tests/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // only needs to trigger GH; execution happens in Actions

function json(data: any, init: number | ResponseInit = 200) {
  return new Response(JSON.stringify(data), {
    status: typeof init === 'number' ? init : init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  try {
    // (Optional) You can enforce auth here if you want only signed-in users:
    // const session = await getServerSession(authOptions);
    // if (!session) return json({ error: 'Unauthorized' }, 401);

    // Create a run id for the dashboard to poll.
    const runId = Date.now().toString();

    // Trigger GitHub Actions via repository_dispatch
    const owner = process.env.GH_REPO_OWNER!;
    const repo = process.env.GH_REPO_NAME!;
    const token = process.env.GH_PAT!;

    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
      },
      body: JSON.stringify({
        event_type: 'stea_run_tests',
        client_payload: {
          runId,              // <-- Pass through so the workflow/reporter uses same doc
          initiatedBy: 'dashboard'
        }
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return json({ error: 'Failed to dispatch GitHub workflow', details: text }, 500);
    }

    return json({ status: 'queued', runId }, 202);
  } catch (err: any) {
    return json({ error: err?.message || 'Unknown error' }, 500);
  }
}
```

> Your dashboard: `const { runId } = await fetch('/api/run-tests', { method: 'POST' }).then(r => r.json())` and then poll `testRuns/{runId}`.

---

## 2) GitHub Actions **Workflow**: `.github/workflows/stea-run-tests.yml`

This workflow runs on the custom dispatch and executes Jest with a Firestore reporter.

```yaml
name: STEa Run Tests

on:
  repository_dispatch:
    types: [stea_run_tests]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install deps
        run: npm ci

      - name: Run Jest with Firestore reporter
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
          FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
          STEA_RUN_ID: ${{ github.event.client_payload.runId }}
          STEA_INITIATED_BY: ${{ github.event.client_payload.initiatedBy }}
        run: |
          echo "Starting Jest for runId=$STEA_RUN_ID"
          npx jest --reporters="<rootDir>/scripts/firestore-jest-reporter.js"
```

> If your tests live in a subdir, set `working-directory:` on the steps or pass `--config` to Jest as needed.

---

## 3) Custom **Jest Reporter**: `scripts/firestore-jest-reporter.js`

Writes live progress and a final summary into Firestore using the **Admin SDK**.

```js
// scripts/firestore-jest-reporter.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

let db;

// normalize multiline private key (GH / Actions often store with literal \n)
function normalizePk(pk) {
  if (!pk) return pk;
  return pk.includes('\\n') ? pk.replace(/\\n/g, '\n') : pk;
}

function initDb() {
  if (db) return db;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePk(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_* secrets for reporter.');
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  db = getFirestore();
  return db;
}

class FirestoreJestReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.runId = process.env.STEA_RUN_ID || Date.now().toString();
    this.initiatedBy = process.env.STEA_INITIATED_BY || 'dashboard';
  }

  async onRunStart(aggregatedResults, options) {
    const d = initDb().collection('testRuns').doc(this.runId);
    await d.set({
      status: 'running',
      startedAt: new Date(),
      suites: 0,
      tests: 0,
      passed: 0,
      failed: 0,
      progressAt: new Date(),
      initiatedBy: this.initiatedBy,
    }, { merge: true });
  }

  async onTestResult(test, testResult, aggregatedResults) {
    const d = db.collection('testRuns').doc(this.runId);
    const totalInFile = testResult.testResults.length;
    const passed = testResult.numPassingTests || 0;
    const failed = (testResult.numFailingTests || 0) + (testResult.numPendingTests || 0);

    await d.set({
      suites: require('firebase-admin/firestore').FieldValue.increment(1),
      tests: require('firebase-admin/firestore').FieldValue.increment(totalInFile),
      passed: require('firebase-admin/firestore').FieldValue.increment(passed),
      failed: require('firebase-admin/firestore').FieldValue.increment(failed),
      lastFile: testResult.testFilePath,
      progressAt: new Date(),
    }, { merge: true });
  }

  async onRunComplete(contexts, results) {
    const d = db.collection('testRuns').doc(this.runId);
    await d.set({
      status: results.numFailedTests ? 'failed' : 'passed',
      finishedAt: new Date(),
      summary: {
        totalTests: results.numTotalTests,
        passed: results.numPassedTests,
        failed: results.numFailedTests,
        skipped: results.numPendingTests,
        time: results.startTime ? (Date.now() - results.startTime) : null,
      }
    }, { merge: true });
  }
}

module.exports = FirestoreJestReporter;
```

---

## 4) Dashboard Changes

- When the user clicks **Run**, `POST /api/run-tests` and store the returned `runId` in state.  
- `onSnapshot(doc(db, 'testRuns', runId))` → render progress and final result.  
- Consider a “Cancel” UI (optional) that just marks the run as abandoned; GH Action cancellation requires the Actions API.

---

## 5) Firestore Rules (example)

If you want the dashboard to read runs but **only server code / CI** to write them, use a write-proxy via your API.  
If you’re OK with CI writing with the Admin SDK (bypasses rules), keep client reads open to authed users:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function authed() { return request.auth != null; }

    match /testRuns/{runId} {
      allow read: if authed();
      allow write: if false; // writes come from Admin SDK in CI
    }
  }
}
```

> The Admin SDK (used in Actions) ignores rules, so it will still write. Clients can only read.

---

## 6) Testing the Flow

1. **Local smoke**: call the Next route with curl:
   ```bash
   curl -X POST https://<your-domain>/api/run-tests
   # -> { "status": "queued", "runId": "..." }
   ```
2. In GitHub → **Actions** tab, you should see **STEa Run Tests** start.  
3. Watch Firestore `testRuns/{runId}` update in real time.  
4. Verify dashboard reflects progress and final status.

---

## 7) Troubleshooting

- **403 from GitHub API**: your `GH_PAT` lacks `repo`/`workflow` scope or is for the wrong org/repo.  
- **No Action triggered**: ensure event type matches the workflow (`stea_run_tests`) and repository owner/name envs are set.  
- **Reporter “Missing FIREBASE_* secrets”**: confirm GitHub repo secrets exist and are mapped in the workflow step.  
- **Private key issues**: if you pasted with `\n`, normalization in the reporter should fix it; otherwise paste the raw key.  
- **Dashboard never updates**: confirm you’re listening to the correct `runId`. Check GitHub logs for reporter errors.

---

## 8) Optional Enhancements

- **Matrix testing** (Node 18/20) for broader coverage.  
- **Parallelization** with Jest’s `--maxWorkers` and GitHub Actions strategy.  
- **Artifacts**: upload JUnit/coverage as workflow artifacts.  
- **Slack/Email**: notify on failures.  
- **Auth**: lock `/api/run-tests` to signed-in users with specific roles.

---

## Copy/Paste Index

- Next API route → `app/api/run-tests/route.ts`  
- GH workflow → `.github/workflows/stea-run-tests.yml`  
- Reporter → `scripts/firestore-jest-reporter.js`

---

## Why this wins

- **No serverless bundling** of Jest & friends.  
- **Deterministic** environment (Actions gives you full Node + cache).  
- **Scalable** (long runs, parallel, artifacts).  
- Your existing **Firestore + UI polling** just works.

---

Good to ship. 🎯
