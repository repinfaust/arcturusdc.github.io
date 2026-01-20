# STEa MCP Integration — Secure Hosted Relay + Client Example

This guide explains how to safely connect user‑side LLM output to your STEa Firestore without sharing your Firebase or API keys.

---

## 🔒 Why This Matters
You **must not** give users your Firebase service keys or environment secrets.  
Instead, they send data through your **Hosted Relay API**, which:
1. Validates their subscription and workspace token.
2. Writes data securely to your Firestore using the Admin SDK (server‑side).

---

## 🧩 Architecture Overview

```
User LLM / MCP → Your Endpoint (/api/stea/import-backlog) → Firestore (Admin SDK)
```

Two supported modes:

| Mode | Description |
|------|--------------|
| **Hosted Relay** | Users run the MCP locally or via their own LLM, then POST JSON output to your endpoint. |
| **Self-Hosted** | Users purchase a £30 config pack (prompt + JSON config) to run everything with their own Firebase. |

---

## 🧱 Firestore Structure

```
/workspaces/{workspaceId}/projects/{projectId}/(epics|features|cards)/{id}
```

Firestore Rules (clients read, server writes only):

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /workspaces/{ws}/projects/{p}/{coll}/{id} {
      allow read: if request.auth != null && request.auth.token.workspaceIds.hasAny([ws]);
      allow write: if false; // only via Admin SDK on your server
    }
  }
}
```

---

## 🚀 Hosted Relay Example (Next.js API Route)

**File:** `src/app/api/stea/import-backlog/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyWorkspaceToken } from "@/lib/auth";
import { assertActiveSubscription } from "@/lib/billing";

const Backlog = z.object({
  workspaceId: z.string(),
  projectId: z.string(),
  epics: z.array(z.object({ id:z.string(), title:z.string(), intent:z.string().optional() })).default([]),
  features: z.array(z.object({ id:z.string(), epicId:z.string(), title:z.string(), scope:z.string().optional() })).default([]),
  cards: z.array(z.object({
    id:z.string(),
    featureId:z.string(),
    userStory:z.string(),
    acceptanceCriteria: z.array(z.string()).min(1),
    userFlows: z.array(z.string()).min(1),
    attachments: z.array(z.string()).optional()
  })).default([])
});

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const { workspaceId } = await verifyWorkspaceToken(token);

    const body = Backlog.parse(await req.json());
    if (body.workspaceId !== workspaceId) return NextResponse.json({error:"workspace mismatch"}, {status:403});

    await assertActiveSubscription(workspaceId);

    const batch = adminDb.batch();
    const base = adminDb.collection("workspaces").doc(workspaceId)
      .collection("projects").doc(body.projectId);

    body.epics.forEach(e => batch.set(base.collection("epics").doc(e.id), e, { merge:true }));
    body.features.forEach(f => batch.set(base.collection("features").doc(f.id), f, { merge:true }));
    body.cards.forEach(c => batch.set(base.collection("cards").doc(c.id), c, { merge:true }));

    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (err:any) {
    return NextResponse.json({ error: err.message ?? "invalid payload" }, { status: 400 });
  }
}
```

---

## 🔑 Workspace Tokens (JWT)

**File:** `src/lib/auth.ts`

```ts
import jwt from "jsonwebtoken";
export function signWorkspaceToken(workspaceId:string, userId:string){
  return jwt.sign({ workspaceId, sub:userId }, process.env.WORKSPACE_JWT_SECRET!, { expiresIn: "30m" });
}
export async function verifyWorkspaceToken(t:string){
  return jwt.verify(t, process.env.WORKSPACE_JWT_SECRET!) as {workspaceId:string, sub:string};
}
```

---

## 🧠 Minimal MCP Client Example

This Python snippet calls an LLM, builds the backlog JSON, and POSTs it to your hosted endpoint with the workspace token.

```python
import requests, openai, os

# Config
API_URL = "https://www.arcturusdc.com/api/stea/import-backlog"
WORKSPACE_TOKEN = os.getenv("WORKSPACE_TOKEN")

# Step 1: Prompt your LLM (e.g. OpenAI, Anthropic, etc.)
prompt = """
You are a product planner. Output JSON with Epics, Features, and Cards.
Include for each Card: userStory, acceptanceCriteria[3-5], and userFlows[step-by-step].
Project: SyncFit
Audience: Busy professionals
Goal: Smarter workout scheduling
"""

response = openai.ChatCompletion.create(
    model="gpt-4o-mini",
    messages=[{"role": "system", "content": prompt}]
)

# Step 2: Parse LLM output (ensure it's valid JSON)
data = response["choices"][0]["message"]["content"]

# Step 3: POST to your STEa endpoint
res = requests.post(
    API_URL,
    headers={
        "Authorization": f"Bearer {WORKSPACE_TOKEN}",
        "Content-Type": "application/json"
    },
    data=data.encode("utf-8")
)

print(res.status_code, res.text)
```

---

## ✅ Benefits

- Keeps **Firebase keys server-side** (safe in your environment variables).  
- Users never see or need your credentials.  
- You maintain control of **validation, billing, and storage**.  
- Works for any LLM / MCP client.

---

**Security Tip:** Always issue short-lived workspace tokens and validate active subscription before writing to Firestore.

---

© Arcturus Digital Consulting — 2025  
[https://www.arcturusdc.com](https://www.arcturusdc.com)
