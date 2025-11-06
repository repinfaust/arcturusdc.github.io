'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTenant } from '@/contexts/TenantContext';

export default function AutoProductPage() {
  const router = useRouter();
  const { currentTenant, availableTenants, loading: tenantLoading } = useTenant();
  const [expandedSection, setExpandedSection] = useState(null);

  // Authorization check: require tenant membership
  useEffect(() => {
    if (!tenantLoading && availableTenants.length === 0) {
      router.replace('/apps/stea?error=no_workspace');
    }
  }, [availableTenants, tenantLoading, router]);

  // Show loading while checking tenant access
  if (tenantLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  // Don't render if no tenant access
  if (availableTenants.length === 0) {
    return null; // Will redirect via useEffect
  }

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
              Auto Product connects any LLM to Filo, letting you generate complete backlogs from product specs. With a
              single prompt, you get <strong>Epics → Features → Cards</strong> with user stories, acceptance criteria,
              and user flows—instantly in your workspace.
            </p>
            <div className="mt-6 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 p-6 border border-pink-200">
              <p className="text-sm font-semibold text-pink-900 mb-2">Two Modes:</p>
              <ul className="text-sm text-pink-800 space-y-2 mt-3 list-none pl-0">
                <li>
                  <strong>🌐 Hosted (Default):</strong> Use our infrastructure. You get a workspace token, POST JSON
                  from any LLM, and we handle the rest. No setup, no Firebase, no servers.
                </li>
                <li>
                  <strong>🏠 Self-Hosted (£30):</strong> Run your own Firebase. Get our MCP config pack with prompts
                  and setup files. Full control, your data, your infrastructure.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How it Works - Hosted Mode */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900">How It Works (Hosted Mode)</h2>

          <div className="mb-6 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">Using Our Infrastructure</h3>
            <p className="text-sm text-blue-800">
              In hosted mode, you're using <strong>our Firestore instance</strong>. You never need Firebase credentials
              or API keys—just a workspace JWT token that proves you're a paying customer. We handle all the infrastructure,
              security, and data operations server-side.
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
              <div className="min-w-0">
                <h3 className="font-semibold text-neutral-900">POST to Import Endpoint</h3>
                <p className="mt-1 text-sm text-neutral-600 break-words">
                  Send the LLM output to <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs break-all">/api/stea/import-backlog</code> with
                  your workspace token in the Authorization header. The server validates your subscription and writes
                  to Firestore using the Admin SDK.
                </p>
                <pre className="mt-2 rounded bg-neutral-900 p-2 text-xs text-neutral-100 overflow-x-auto">
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
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Hosted Mode Architecture</h2>
          <p className="mb-4 text-sm text-neutral-600">
            You use our infrastructure. We handle all the heavy lifting:
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
                                     └─────────────────┘
                                              │
                                              ▼
                                        OUR FIRESTORE
                                     (You never touch it)`}
            </pre>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-900">✓ You Provide</h3>
              <ul className="space-y-1 text-xs text-green-800">
                <li>• Workspace JWT token (30min TTL)</li>
                <li>• LLM-generated JSON backlog</li>
                <li>• Active subscription</li>
                <li>• That's it!</li>
              </ul>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">✓ We Handle</h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Firebase infrastructure</li>
                <li>• Security & validation</li>
                <li>• Database operations</li>
                <li>• Backups & scaling</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Self-Hosted Option */}
        <section className="mb-12 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-2xl">
              🏠
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">Self-Hosted Mode (£30)</h2>
              <p className="mt-2 text-neutral-600">
                Want to run your own infrastructure? Get our MCP Config Pack.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-neutral-900">What You Get:</h3>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li className="flex items-start gap-3">
                <span className="text-purple-600">✓</span>
                <span><strong>Prompt Templates:</strong> Pre-configured prompts for generating properly structured backlogs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600">✓</span>
                <span><strong>mcp.config.json:</strong> Ready-to-use MCP server configuration for Claude Code or other tools</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600">✓</span>
                <span><strong>Setup Guide:</strong> Step-by-step instructions for connecting to your Firebase instance</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-600">✓</span>
                <span><strong>Firestore Rules:</strong> Security rules template for your database</span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-purple-200 bg-white p-4 mb-6">
            <h3 className="font-semibold text-neutral-900 mb-3">How Self-Hosted Works:</h3>
            <ol className="space-y-2 text-sm text-neutral-700 list-decimal pl-5">
              <li>Purchase the £30 config pack from your workspace settings</li>
              <li>Set up your own Firebase project (or use another database)</li>
              <li>Configure the MCP server with your service account credentials</li>
              <li>Run the MCP server locally—we're completely out of the loop</li>
              <li>Your data stays on your infrastructure forever</li>
            </ol>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <span className="text-amber-600 text-xl">💡</span>
            <div className="text-amber-800">
              <strong>Perfect for:</strong> Agencies, enterprises, or makers who need full data control, want to avoid
              recurring costs, or have compliance requirements that prevent using third-party infrastructure.
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
                    <pre className="rounded bg-neutral-900 p-2 text-xs text-neutral-100 overflow-x-auto">
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
                      Absolutely! Auto Product is <strong>completely optional</strong>. You can continue using Filo the
                      traditional way—manually creating Epics, Features, and Cards through the UI. Auto Product just
                      accelerates backlog creation when you want AI assistance.
                    </p>
                  </div>
                ),
              },
              {
                id: 'modes',
                question: 'When should I use self-hosted vs hosted mode?',
                answer: (
                  <div className="text-sm text-neutral-700 space-y-2">
                    <p>
                      <strong>Use Hosted Mode if:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You want zero setup—just a workspace token and you're ready</li>
                      <li>You're okay with data on our secure infrastructure</li>
                      <li>You want us to handle backups, scaling, and maintenance</li>
                    </ul>
                    <p className="mt-3">
                      <strong>Use Self-Hosted Mode if:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You need full data control for compliance/security reasons</li>
                      <li>You want to avoid ongoing subscription costs</li>
                      <li>You're an agency managing multiple client projects</li>
                      <li>You already have Firebase/database infrastructure</li>
                    </ul>
                  </div>
                ),
              },
              {
                id: 'other-llms',
                question: 'Can I use any LLM?',
                answer: (
                  <div className="text-sm text-neutral-700">
                    <p>
                      <strong>Yes!</strong> Both modes work with any LLM that can generate JSON:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Claude (Anthropic)</li>
                      <li>GPT-4 / GPT-4o (OpenAI)</li>
                      <li>Gemini (Google)</li>
                      <li>Local models via Ollama</li>
                      <li>Custom scripts/automation</li>
                    </ul>
                    <p className="mt-3">
                      As long as it can output properly structured JSON, it will work. Use our prompt template to ensure
                      the right format.
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
