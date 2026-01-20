# 🧩 STEa Automated Tests Dashboard — Vercel Runtime Issue Summary

## Goal
Run **real Jest suites** from `/apps/stea/automatedtestsdashboard` by POSTing to the `/api/run-tests` route (Next.js 14 + Vercel).  
The dashboard should trigger `scripts/run-jest-tests.js`, which spawns Jest so progress/results land in Firestore and the UI updates live.

---

## Current Issue
All executions in **Vercel’s serverless function** fail immediately because one of Jest’s runtime dependencies is missing.

**Latest error:**
```
Error: Cannot find module 'y18n'
Require stack:
  /var/task/node_modules/yargs/build/index.cjs
  /var/task/node_modules/jest-cli/build/index.js
  /var/task/scripts/run-jest-tests.js
```
Result: the API returns `500`, and the dashboard reports “Test suite completed! Success rate 0%”.

---

## Fixes Already Attempted
- Removed fake/simulation mode so UI shows real errors.
- Switched to Firebase Admin + secure session cookie — Firestore writes now work.
- Refactored `/api/run-tests` → launches `scripts/run-jest-tests.js` using `jestCli.run(...)`.
- Incrementally added Jest deps (`jest-cli`, `jest-util`, `yargs`, `emittery`, etc.) to  
  `next.config.js` → `serverComponentsExternalPackages` and `outputFileTracingIncludes`.
- Tried `routeSegmentConfig.unstable_includeFiles` with:
  ```js
  export const routeSegmentConfig = {
    unstable_includeFiles: ['node_modules/**', 'scripts/run-jest-tests.js', '__tests__/**'],
  };
  ```
- Local build works; Vercel still fails (missing `y18n`).

---

## Root Cause
- `unstable_includeFiles` **isn’t supported** for App Router route handlers on Vercel.  
- Vercel uses **output file tracing** (follows static `require` paths only).  
  Jest’s lazy-loading means some runtime deps (like `yargs` → `y18n`) are pruned.  
- The serverless bundle therefore lacks several Jest dependencies.

---

## Solution Options

### ✅ Option A — Keep in Route Handler (Force-include Dependencies)

1. **Move Jest deps** to `"dependencies"` (not `devDependencies`).
2. **Force include subtrees** in `next.config.js`:

```js
// next.config.js
module.exports = {
  outputFileTracingIncludes: {
    '/api/run-tests': [
      './scripts/run-jest-tests.js',
      './__tests__/**/*',
      './node_modules/jest-cli/**/*',
      './node_modules/jest-worker/**/*',
      './node_modules/jest-config/**/*',
      './node_modules/jest-resolve/**/*',
      './node_modules/@jest/**/*',
      './node_modules/yargs/**/*',
      './node_modules/y18n/**/*',
    ],
  },
};
```

3. Optionally, add the same to **vercel.json**:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "functions": {
    "app/api/run-tests/route.js": {
      "includeFiles": [
        "scripts/run-jest-tests.js",
        "__tests__/**",
        "node_modules/jest-cli/**",
        "node_modules/@jest/**",
        "node_modules/jest-config/**",
        "node_modules/jest-resolve/**",
        "node_modules/jest-worker/**",
        "node_modules/yargs/**",
        "node_modules/y18n/**"
      ]
    }
  }
}
```

4. In the Route Handler, specify runtime + timeout:

```ts
export const runtime = 'nodejs';
export const maxDuration = 300; // up to 5 minutes
```

This ensures the right dependencies are included and Jest has enough execution time.

---

### 💡 Option B — Move to Background/External Worker (Recommended)
If the suites are large or unstable on serverless runtime, offload execution.

**Approach:**
- `/api/run-tests` triggers a background job and responds immediately.
- Use:
  - **Vercel Background Functions** for moderate loads.
  - **Inngest** for long-running jobs (durable workflows).
  - **External worker** (Fly.io, EC2, or GitHub Actions) for full Jest support.
- Dashboard continues polling Firestore as before.

This avoids bundling limitations and timeouts.

---

## Direct Answers

| Question | Answer |
|-----------|---------|
| Does `unstable_includeFiles` actually ship all of `node_modules`? | ❌ No. Not supported for App Router handlers. |
| Alternative packaging approach? | Use `outputFileTracingIncludes` and/or `vercel.json` includes. |
| Minimal set of paths? | Include Jest runtime folders + `yargs` + `y18n`. |
| Why missing deps? | Jest loads dependencies dynamically; Vercel’s tracer prunes them. |

---

## Sanity Checklist
- [x] Move Jest deps to `"dependencies"`.
- [x] Add `outputFileTracingIncludes['/api/run-tests']` block.
- [x] (Optional) Add `functions.includeFiles` in `vercel.json`.
- [x] Ensure `runtime = 'nodejs'` and `maxDuration = 300`.
- [x] Consider background/external worker for long jobs.

---

## TL;DR
Your Firestore + UI logic works. The blocker is Vercel’s packaging of Jest.  
Either **(A)** explicitly include Jest’s runtime deps using `outputFileTracingIncludes` and `vercel.json`,  
or **(B)** offload Jest execution to a background worker.

---
