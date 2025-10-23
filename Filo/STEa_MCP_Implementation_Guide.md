
# STEa — Epics, Features, and Cards via MCP (Claude Code / Codex)
**Author:** ArcturusDC  
**Scope:** Implement nested **Epic → Feature → Card** creation through an MCP server, plus route renames and auth checks.  
**Target stack:** Next.js (App Router) + Firebase Auth/Firestore + Vercel + Claude Code (MCP)

---

## ✅ What you’ll deliver
1) **Route changes** inside `src/app/apps/stea`:
   - Rename whiteboard route: `stea/filo` → **`stea/harls`**.
   - Rename board route: `stea/board` → **`stea/filo`**.
   - Verify all still behind **Google Auth (server cookie checks)**.

2) **MCP server** exposing tools that Claude/Codex can call locally:
   - `stea.createEpic` — creates an **Epic** with user-provided `name`, `description`, `app`, `priority`, `column`, `size`.
   - `stea.createFeature` — creates a **Feature** nested under an Epic (`epicId`) with similar fields and more granular description.
   - `stea.createCard` — creates **Cards** nested under a Feature (`featureId`) with `description`, `userStory`, and `userFlow[]` steps.
   - (Optional) `stea.listEpics`, `stea.listFeatures`, `stea.listCardsByFeature` for easy discovery in-editor.

3) **Firestore schema & security** suited to the above.

4) **Claude config** to register your local MCP server.

---

## 0) Pre-reqs and conventions
- **Node** ≥ 18, **pnpm** recommended.
- A **Firebase service account** with *least privilege* (read/write to `stea_*` collections).
- All code paths assume **TypeScript** where available; adjust to JS if needed.
- The app already uses **Google Sign-In**; we’ll **keep route-level server checks** and make the MCP run locally with Admin credentials (no cookies).

---

## 1) Route renames (inside `src/app/apps/stea`)

### A. Rename whiteboard route to `harls`
```bash
# from:
# src/app/apps/stea/filo/
# to:
# src/app/apps/stea/harls/
git mv src/app/apps/stea/filo src/app/apps/stea/harls
```

### B. Rename board route to `filo`
```bash
# from:
# src/app/apps/stea/board/
# to:
# src/app/apps/stea/filo/
git mv src/app/apps/stea/board src/app/apps/stea/filo
```

> If either route name is taken, create the new folder and move the files within, then remove the old folder.

### C. Update imports/links
Search and replace any hard-coded paths:
```bash
# references to the OLD whiteboard path
rg -n "apps/stea/filo" src | sed -n '1,200p'

# references to the OLD board path
rg -n "apps/stea/board" src | sed -n '1,200p'
```

Update them to:
- **Whiteboard →** `apps/stea/harls`
- **Board →** `apps/stea/filo`

> Also check for client-side navigations (`router.push('/apps/stea/board')`) and update to `/apps/stea/filo`.

---

## 2) Keep routes behind Google Auth (server cookie checks)

If you already gate routes with a server utility (e.g., `getServerUser()`), ensure **both** routes use it.

**Example (server component or layout):**
```ts
// src/app/apps/stea/filo/layout.tsx  (and similarly for harls/)
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/auth/verifySessionCookie'; // your helper using Admin SDK

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;
  const user = await verifySessionCookie(session); // throws if invalid

  // Optionally require a domain/email allowlist
  if (!user?.email) {
    // Redirect to sign-in
    // (App Router example)
    return (
      <div className="p-6">Unauthorized. Please <a href="/apps/signin">sign in</a>.</div>
    );
  }

  return <>{children}</>;
}
```

**Example verify helper (Admin SDK):**
```ts
// src/lib/auth/verifySessionCookie.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // or cert({ ..envs })
  });
}

export async function verifySessionCookie(cookie?: string) {
  if (!cookie) return null;
  try {
    const decoded = await admin.auth().verifySessionCookie(cookie, true);
    return decoded; // { uid, email, ... }
  } catch {
    return null;
  }
}
```

> Keep your existing middleware/guards if you have them; just ensure the **renamed** routes still import/execute the check.

---

## 3) Firestore data model (nested Epic → Feature → Card)

**Collections** (flat for easy querying; parent IDs for nesting):
```
stea_epics/{epicId}
  - name: string
  - description: string
  - app: string
  - priority: "LOW"|"MEDIUM"|"HIGH"
  - column: string          # e.g., Idea, Planning, Design, Build, Done
  - size: string | number   # T-shirt ("S","M","L") or story points
  - createdBy, createdAt

stea_features/{featureId}
  - epicId: string          # parent Epic
  - name: string
  - description: string
  - app: string
  - priority: "LOW"|"MEDIUM"|"HIGH"
  - column: string
  - size: string | number
  - createdBy, createdAt

stea_cards/{cardId}
  - epicId: string
  - featureId: string
  - title: string
  - description: string
  - app: string
  - priority: "LOW"|"MEDIUM"|"HIGH"
  - column: string
  - size?: string | number
  - testing: {
      userStory?: string
      acceptanceCriteria?: string[]
      userFlow?: string[]
    }
  - createdBy, createdAt
```

**Suggested composite indexes (Firestore console → Indexes):**
- `stea_features` on `epicId, priority`
- `stea_cards` on `featureId, priority`
- (Optional) `stea_cards` on `epicId, priority`

**Rules (server admin access bypasses rules; these are for client safety):**
```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function authed() { return request.auth != null; }

    match /stea_epics/{id} {
      allow read: if authed();
      allow write: if authed();
    }
    match /stea_features/{id} {
      allow read: if authed();
      allow write: if authed();
    }
    match /stea_cards/{id} {
      allow read: if authed();
      allow write: if authed();
    }
  }
}
```

---

## 4) MCP server — local tool for Claude/Codex

### Install deps
```bash
pnpm add firebase-admin
pnpm add @modelcontextprotocol/sdk zod
pnpm add -D ts-node typescript @types/node
```

### Env (local dev only)
Set these in your shell or MCP config:
```
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=yyy@zzz.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
DEFAULT_APP=Tou.me
DEFAULT_BOARD=STEa
DEFAULT_COLUMN=Idea
CREATED_BY=mcp:stea
```

### Server file
`servers/stea-mcp.ts`
```ts
#!/usr/bin/env ts-node

import admin from 'firebase-admin';
import { Server, Tool } from '@modelcontextprotocol/sdk/server';
import { z } from 'zod';

// ---------- Firebase Admin ----------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\n/g, '\n'),
    } as any),
  });
}
const db = admin.firestore();

const now = () => admin.firestore.FieldValue.serverTimestamp();
const DEF_APP = process.env.DEFAULT_APP || 'Tou.me';
const DEF_COL = process.env.DEFAULT_COLUMN || 'Idea';
const CREATED_BY = process.env.CREATED_BY || 'mcp:stea';

// ---------- Zod Schemas ----------
const priorityEnum = z.enum(['LOW','MEDIUM','HIGH']);
const sizeSchema = z.union([z.string(), z.number()]);

// ---------- Tools ----------

// Create Epic
const createEpic = new Tool({
  name: 'stea.createEpic',
  description: 'Create an Epic (top-level).',
  inputSchema: z.object({
    name: z.string(),
    description: z.string().default(''),
    app: z.string().default(DEF_APP),
    priority: priorityEnum.default('MEDIUM'),
    column: z.string().default(DEF_COL),
    size: sizeSchema.optional(),
  }),
  handler: async ({ input }) => {
    const payload = {
      ...input,
      createdAt: now(),
      createdBy: CREATED_BY,
    };
    const ref = await db.collection('stea_epics').add(payload);
    return { content: [{ type: 'text', text: JSON.stringify({ epicId: ref.id }, null, 2) }] };
  },
});

// Create Feature (nested under Epic)
const createFeature = new Tool({
  name: 'stea.createFeature',
  description: 'Create a Feature nested under an Epic.',
  inputSchema: z.object({
    epicId: z.string(),
    name: z.string(),
    description: z.string().default(''),
    app: z.string().default(DEF_APP),
    priority: priorityEnum.default('MEDIUM'),
    column: z.string().default(DEF_COL),
    size: sizeSchema.optional(),
  }),
  handler: async ({ input }) => {
    // optional: verify epic exists
    const epicRef = db.collection('stea_epics').doc(input.epicId);
    const epic = await epicRef.get();
    if (!epic.exists) throw new Error('Epic not found');

    const payload = {
      ...input,
      createdAt: now(),
      createdBy: CREATED_BY,
    };
    const ref = await db.collection('stea_features').add(payload);
    return { content: [{ type: 'text', text: JSON.stringify({ featureId: ref.id }, null, 2) }] };
  },
});

// Create Card (nested under Feature → Epic)
const createCard = new Tool({
  name: 'stea.createCard',
  description: 'Create a Card nested under a Feature with testing fields.',
  inputSchema: z.object({
    epicId: z.string(),
    featureId: z.string(),
    title: z.string(),
    description: z.string().default(''),
    app: z.string().default(DEF_APP),
    priority: priorityEnum.default('MEDIUM'),
    column: z.string().default(DEF_COL),
    size: sizeSchema.optional(),
    testing: z.object({
      userStory: z.string().optional(),
      acceptanceCriteria: z.array(z.string()).optional(),
      userFlow: z.array(z.string()).optional(),
    }).optional(),
  }),
  handler: async ({ input }) => {
    // optional: verify feature→epic relation
    const feat = await db.collection('stea_features').doc(input.featureId).get();
    if (!feat.exists) throw new Error('Feature not found');
    if (feat.data()?.epicId !== input.epicId) {
      throw new Error('featureId does not belong to epicId');
    }

    const payload = {
      ...input,
      createdAt: now(),
      createdBy: CREATED_BY,
    };
    const ref = await db.collection('stea_cards').add(payload);
    return { content: [{ type: 'text', text: JSON.stringify({ cardId: ref.id }, null, 2) }] };
  },
});

// (Optional) Listing helpers
const listEpics = new Tool({
  name: 'stea.listEpics',
  description: 'List epics (optionally filter by app).',
  inputSchema: z.object({ app: z.string().optional(), limit: z.number().optional() }).optional(),
  handler: async ({ input }) => {
    let q: FirebaseFirestore.Query = db.collection('stea_epics');
    if (input?.app) q = q.where('app', '==', input.app);
    if (input?.limit) q = q.limit(input.limit);
    const snap = await q.get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
  },
});

const listFeatures = new Tool({
  name: 'stea.listFeatures',
  description: 'List features under an epic.',
  inputSchema: z.object({ epicId: z.string() }),
  handler: async ({ input }) => {
    const snap = await db.collection('stea_features').where('epicId', '==', input.epicId).get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
  },
});

const listCardsByFeature = new Tool({
  name: 'stea.listCardsByFeature',
  description: 'List cards under a feature.',
  inputSchema: z.object({ featureId: z.string() }),
  handler: async ({ input }) => {
    const snap = await db.collection('stea_cards').where('featureId', '==', input.featureId).get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
  },
});

// ---------- Start MCP ----------
const server = new Server({ name: 'stea-mcp', version: '0.1.0' });
server.tool(createEpic);
server.tool(createFeature);
server.tool(createCard);
server.tool(listEpics);
server.tool(listFeatures);
server.tool(listCardsByFeature);
server.start();
```

---

## 5) Register the MCP server in Claude Desktop

**macOS config file:**
`~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "stea-mcp": {
      "command": "/usr/local/bin/ts-node",
      "args": ["./servers/stea-mcp.ts"],
      "env": {
        "FIREBASE_PROJECT_ID": "xxx",
        "FIREBASE_CLIENT_EMAIL": "yyy@zzz.iam.gserviceaccount.com",
        "FIREBASE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
        "DEFAULT_APP": "Tou.me",
        "DEFAULT_BOARD": "STEa",
        "DEFAULT_COLUMN": "Idea",
        "CREATED_BY": "mcp:stea"
      }
    }
  }
}
```

Restart Claude. You’ll see **stea-mcp** under Tools.

---

## 6) Example prompts in Claude Code

**Create an Epic**
> Use `stea.createEpic` to create an epic named “Onboarding overhaul” for app “Tou.me”, priority HIGH, column “Planning”, size “L”, description “Revamp first-time user journey to reduce drop-off.”

**Create a Feature under that Epic**
> Use `stea.listEpics` to find the id of “Onboarding overhaul”. Then call `stea.createFeature` with that epicId. Name: “Guided tour modal”. Priority: MEDIUM, column “Design”, size “3”. Description: “Contextual step-through screens; NUX copy.”

**Create Cards under the Feature**
> Use `stea.createCard` with the epicId/featureId you just created. Title: “Tour modal appears after Google sign-in”. Description: “Trigger on first open after auth.” UserStory: “As a new user…”. AcceptanceCriteria: [“Tour shows within 1s”, “Backdrop dim is 60%”, “Dismiss persists”]. UserFlow: [“Install”, “Open”, “Sign in with Google”, “Observe modal”, “Tap Next x4”, “Done”].

---

## 7) Idempotency & duplication avoidance (optional)
- When creating via MCP, add a `sourceKey` field to objects (e.g., `sourceKey: "epic:Onboarding overhaul"`).  
- Before insert, query for an existing doc with the same `sourceKey`. If found, return it instead of creating.

---

## 8) CI/CD & Vercel notes
- The **MCP server is local** to your dev machine. It’s not deployed to Vercel.
- Your **Next.js app** remains protected by Google Auth via cookies/session.
- Firestore **Admin credentials** are used only by the MCP process; do **not** commit them.
- For production server-side operations (e.g., API endpoints), use Vercel Env Vars with least privilege.

---

## 9) Quick test checklist
- [ ] Navigate to `/apps/stea/harls` (whiteboard) and `/apps/stea/filo` (board) — confirm both require sign-in.
- [ ] From Claude Code, run `stea.createEpic` and verify a doc appears in `stea_epics`.
- [ ] Create a Feature with the returned `epicId`, then a Card with the `featureId` — verify docs.
- [ ] Confirm your Board UI reads **nested** `epicId`/`featureId` to group Cards.
- [ ] Add Firestore composite indexes if queries require them.

---

## 10) Troubleshooting
- **Permission denied**: Ensure you used Admin SDK in MCP and your service account has access.
- **Auth page visible without sign-in**: Confirm your route-level guard is still imported after renames.
- **Claude can’t see MCP tools**: Check path to `ts-node`, server file location, and JSON config syntax.

---

**Done.** You can hand this file to Claude Code to implement the exact steps and code.
