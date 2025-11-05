'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AutoProductPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-pink-50/30">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <Link
            href="/apps/stea"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 mb-4"
          >
            ← Back to STEa
          </Link>
          <div className="flex items-start gap-4">
            <Image
              src="/img/logo-mark.png"
              width={64}
              height={64}
              alt="Arcturus mark"
              className="rounded-2xl border border-black/10"
            />
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Auto Product</h1>
              <p className="mt-2 text-neutral-600">AI-powered backlog generation via MCP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Overview */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">What is Auto Product?</h2>
          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-700">
              Auto Product connects <strong>Claude Code</strong> (or other LLMs) to Filo through an{' '}
              <strong>MCP (Model Context Protocol) server</strong>. With a single prompt, you can generate a complete,
              structured backlog—turning product specs or ideas into <strong>Epics → Features → Cards</strong> with
              user stories, acceptance criteria, and user flows.
            </p>
            <div className="mt-6 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 p-6 border border-pink-200">
              <p className="text-sm font-semibold text-pink-900 mb-2">The Magic:</p>
              <p className="text-sm text-pink-800">
                <strong>One prompt → Full backlog in Filo</strong>. No manual card creation. No copy-paste. Just structured,
                AI-generated work items ready for your team.
              </p>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900">How It Works</h2>

          <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">Security Note</h3>
            <p className="text-sm text-blue-800">
              Auto Product uses a <strong>secure API relay architecture</strong>. Your MCP client never touches Firebase
              directly—instead, it calls authenticated API endpoints that handle data operations server-side. This means
              customers never need your Firebase credentials.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                1
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Get Your Workspace Token</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Sign in to STEa and generate a workspace JWT token from your settings. This short-lived token
                  (expires in 30 minutes) is scoped to your workspace and validates your subscription.
                </p>
                <div className="mt-2 text-xs rounded bg-amber-50 border border-amber-200 p-2 text-amber-800">
                  <strong>Security:</strong> Tokens expire automatically and can be revoked instantly.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                2
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Set Up Your LLM Client</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Configure any LLM (Claude, GPT-4, etc.) to generate structured backlog JSON. Use our prompt
                  template to get properly formatted Epics, Features, and Cards with user stories and acceptance criteria.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                3
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Generate Your Backlog</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Send your product spec to the LLM. It returns structured JSON with Epics, Features, and Cards
                  including user stories, acceptance criteria, and user flows—ready to import into Filo.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                4
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">POST to Import Endpoint</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Send the LLM output to <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">/api/stea/import-backlog</code> with
                  your workspace token in the Authorization header. The server validates your subscription and writes
                  to Firestore using the Admin SDK.
                </p>
                <pre className="mt-2 rounded bg-neutral-900 p-2 text-xs text-neutral-100">
                  Authorization: Bearer {'{WORKSPACE_TOKEN}'}
                </pre>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                5
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Review in Filo</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Open Filo and see your AI-generated backlog instantly. Refine, assign, prioritize—then send cards
                  directly to Hans for testing. No manual entry, no copy-paste.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Diagram */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Secure API Relay Architecture</h2>
          <p className="mb-4 text-sm text-neutral-600">
            The relay architecture keeps your Firebase credentials secure while allowing AI-powered backlog generation:
          </p>
          <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-6">
            <pre className="text-xs text-neutral-800 font-mono overflow-x-auto">
{`┌─────────────────┐                  ┌──────────────────────────┐
│   LLM Client    │                  │   STEa Relay Server      │
│  (Your Machine) │  JSON + Token    │ /api/stea/import-backlog │
│                 │─────────────────▶│                          │
│  • Claude/GPT   │  HTTPS POST      │  1. Verify JWT Token     │
│  • Custom Script│                  │  2. Check Subscription   │
└─────────────────┘                  │  3. Validate JSON        │
                                     │  4. Firestore Write      │
                                     └────────┬─────────────────┘
                                              │ Admin SDK
                                              ▼
                                     ┌─────────────────┐
                                     │   Firebase      │
                                     │   Firestore     │
                                     │                 │
                                     │ /workspaces/    │
                                     │   {id}/projects │
                                     └─────────────────┘`}
            </pre>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-900">✓ Your Side</h3>
              <ul className="space-y-1 text-xs text-green-800">
                <li>• Only workspace JWT token (30min TTL)</li>
                <li>• No Firebase credentials needed</li>
                <li>• Works with any LLM/MCP tool</li>
                <li>• Subscription validated server-side</li>
              </ul>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">✓ STEa Server</h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• JWT signature verification</li>
                <li>• Active subscription check</li>
                <li>• JSON schema validation (Zod)</li>
                <li>• Atomic Firestore batch writes</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Example Prompt & Client Code */}
        <section className="mb-12 space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900">1. LLM Prompt Template</h2>
            <p className="mb-4 text-sm text-neutral-600">
              Use this prompt to generate structured backlog JSON:
            </p>
            <div className="rounded-lg bg-neutral-900 p-6 font-mono text-sm text-neutral-100">
              <pre className="overflow-x-auto whitespace-pre-wrap">
{`You are a product planner. Output JSON with Epics, Features, and Cards.
Include for each Card: id, featureId, userStory, acceptanceCriteria[3-5], userFlows[steps].

Project: SyncFit Mobile App
Audience: Fitness enthusiasts, ages 18-45
Goal: Help users track workouts and sync with wearables
Constraints: iOS 15+, Android 10+, offline-first
Must-have areas:
  - User onboarding & authentication
  - Workout tracking & history
  - Wearable sync (Apple Health, Google Fit)
Out of scope: Diet tracking, coaching
Quality bar: 60fps animations, <3s load, WCAG AA
Output size: ~2 Epics, ~5 Features, ~15 Cards

Return valid JSON only.`}
              </pre>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="mb-4 text-2xl font-semibold text-neutral-900">2. Client Code Example (Python)</h2>
            <p className="mb-4 text-sm text-neutral-600">
              Send the LLM output to the import endpoint:
            </p>
            <div className="rounded-lg bg-neutral-900 p-6 font-mono text-xs text-neutral-100">
              <pre className="overflow-x-auto whitespace-pre-wrap">
{`import requests, openai, os

API_URL = "https://www.arcturusdc.com/api/stea/import-backlog"
WORKSPACE_TOKEN = os.getenv("WORKSPACE_TOKEN")

# Step 1: Generate with LLM
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "system", "content": your_prompt}]
)

backlog_json = response["choices"][0]["message"]["content"]

# Step 2: POST to STEa relay
res = requests.post(
    API_URL,
    headers={
        "Authorization": f"Bearer {WORKSPACE_TOKEN}",
        "Content-Type": "application/json"
    },
    data=backlog_json.encode("utf-8")
)

print(f"Status: {res.status_code}")
print(f"Response: {res.text}")`}
              </pre>
            </div>
            <p className="mt-4 text-xs text-neutral-600">
              The server validates your token, checks subscription, and writes to Firestore atomically.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                id: 'config',
                question: 'What do I need to get started?',
                answer: (
                  <div className="space-y-3 text-sm text-neutral-700">
                    <p>Just two things:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        <strong>Workspace JWT Token</strong>: Generated from your STEa workspace settings.
                        Expires in 30 minutes for security.
                      </li>
                      <li>
                        <strong>LLM Access</strong>: Any LLM that can generate JSON (Claude, GPT-4, etc.).
                        Use our prompt template to get the right structure.
                      </li>
                    </ol>
                    <p className="mt-3">
                      Store your token as an environment variable:
                    </p>
                    <pre className="rounded bg-neutral-900 p-3 text-xs text-neutral-100 overflow-x-auto">
export WORKSPACE_TOKEN="eyJhbGc..."
                    </pre>
                    <p className="mt-3 text-amber-800">
                      <strong>Security:</strong> Never commit tokens. They're short-lived and workspace-scoped.
                    </p>
                  </div>
                ),
              },
              {
                id: 'token',
                question: 'How do I get my API token?',
                answer: (
                  <div className="space-y-2 text-sm text-neutral-700">
                    <p>Generate an API token from your STEa workspace:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Sign in to STEa and navigate to your workspace settings</li>
                      <li>Go to "API Access" or "Integrations"</li>
                      <li>Click "Generate New Token"</li>
                      <li>Give it a descriptive name (e.g., "Claude MCP Client")</li>
                      <li>Copy the token immediately—it won't be shown again</li>
                      <li>Store it securely in your Claude config</li>
                    </ol>
                    <p className="mt-3 text-amber-800">
                      <strong>Security:</strong> Tokens are scoped to your workspace and can be revoked anytime. Never
                      share tokens or commit them to version control.
                    </p>
                  </div>
                ),
              },
              {
                id: 'endpoint',
                question: 'What endpoint do I POST to?',
                answer: (
                  <div className="text-sm text-neutral-700 space-y-2">
                    <p>
                      <strong>Endpoint:</strong> <code className="rounded bg-neutral-100 px-1.5 py-0.5">/api/stea/import-backlog</code>
                    </p>
                    <p>
                      <strong>Method:</strong> POST
                    </p>
                    <p>
                      <strong>Headers:</strong>
                    </p>
                    <pre className="rounded bg-neutral-900 p-2 text-xs text-neutral-100">
Authorization: Bearer {'<workspace-jwt-token>'}
Content-Type: application/json
                    </pre>
                    <p>
                      <strong>Body:</strong> JSON with <code className="text-xs">workspaceId</code>, <code className="text-xs">projectId</code>,
                      and arrays of <code className="text-xs">epics</code>, <code className="text-xs">features</code>, <code className="text-xs">cards</code>
                    </p>
                    <p className="mt-3 text-blue-800">
                      The server validates your token, checks active subscription, and writes atomically using Firestore batch operations.
                    </p>
                  </div>
                ),
              },
              {
                id: 'security',
                question: 'Is this secure?',
                answer: (
                  <div className="text-sm text-neutral-700 space-y-3">
                    <p>
                      <strong>Yes.</strong> Auto Product uses a secure relay architecture with multiple layers of protection:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <strong>API Tokens:</strong> Scoped to specific workspaces, can be revoked instantly, and expire
                        after a set period
                      </li>
                      <li>
                        <strong>Server-side validation:</strong> All operations are validated against your workspace
                        permissions before execution
                      </li>
                      <li>
                        <strong>Rate limiting:</strong> API calls are rate-limited to prevent abuse
                      </li>
                      <li>
                        <strong>Audit trail:</strong> All MCP operations are logged for security review
                      </li>
                      <li>
                        <strong>No credential sharing:</strong> Customers never receive Firebase credentials—they only
                        get workspace-scoped API tokens
                      </li>
                    </ul>
                    <p className="mt-3">
                      The STEa server acts as a secure gateway, enforcing all Firebase security rules and tenant isolation
                      on the backend. Your credentials stay with you.
                    </p>
                  </div>
                ),
              },
              {
                id: 'manual',
                question: 'Can I still create cards manually?',
                answer: (
                  <div className="text-sm text-neutral-700">
                    <p>
                      Absolutely! Auto Product is <strong>optional</strong>. You can continue using Filo the traditional
                      way—manually creating Epics, Features, and Cards through the UI. The MCP integration is just
                      there to accelerate backlog creation when you want AI assistance.
                    </p>
                  </div>
                ),
              },
              {
                id: 'other-llms',
                question: 'Can I use other LLMs besides Claude?',
                answer: (
                  <div className="text-sm text-neutral-700">
                    <p>
                      Yes! MCP is an open protocol. As long as your LLM tooling supports MCP servers, you can connect
                      them to the STEa server. The implementation guide includes examples for both Claude Code and
                      Codex-style setups.
                    </p>
                  </div>
                ),
              },
            ].map((faq) => (
              <div key={faq.id} className="rounded-lg border border-neutral-200 bg-white">
                <button
                  onClick={() => toggleSection(faq.id)}
                  className="flex w-full items-center justify-between p-6 text-left transition hover:bg-neutral-50"
                >
                  <h3 className="font-semibold text-neutral-900">{faq.question}</h3>
                  <svg
                    className={`h-5 w-5 text-neutral-500 transition-transform ${
                      expandedSection === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSection === faq.id && (
                  <div className="border-t border-neutral-200 px-6 py-4">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900">Resources & Next Steps</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/apps/stea/filo"
              className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-pink-300 hover:shadow-lg"
            >
              <h3 className="font-semibold text-neutral-900 group-hover:text-pink-600">View Filo Board</h3>
              <p className="text-sm text-neutral-600">
                See your AI-generated backlog in action.
              </p>
            </Link>

            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-pink-300 hover:shadow-lg"
            >
              <h3 className="font-semibold text-neutral-900 group-hover:text-pink-600">
                MCP Protocol Docs →
              </h3>
              <p className="text-sm text-neutral-600">
                Learn more about the Model Context Protocol.
              </p>
            </a>

            <Link
              href="/apps/stea/hans"
              className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-pink-300 hover:shadow-lg"
            >
              <h3 className="font-semibold text-neutral-900 group-hover:text-pink-600">Test with Hans</h3>
              <p className="text-sm text-neutral-600">
                Send generated cards directly to testing.
              </p>
            </Link>

            <Link
              href="/contact"
              className="group flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-6 transition hover:border-pink-300 hover:shadow-lg"
            >
              <h3 className="font-semibold text-neutral-900 group-hover:text-pink-600">Need Help?</h3>
              <p className="text-sm text-neutral-600">
                Contact us for setup assistance.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
