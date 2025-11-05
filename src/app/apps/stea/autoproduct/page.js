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
                <h3 className="font-semibold text-neutral-900">Get Your API Token</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Sign in to STEa and generate a personal API token from your workspace settings. This token is
                  scoped to your workspace and can be revoked anytime.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                2
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Install STEa MCP Client</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Install the lightweight MCP client package via npm. Configure it with your API token and
                  workspace ID. The client connects to STEa's secure API relay—no Firebase credentials needed.
                </p>
                <pre className="mt-2 rounded bg-neutral-900 p-2 text-xs text-neutral-100">
                  npm install -g @arcturusdc/stea-mcp-client
                </pre>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                3
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Register with Claude Code</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Add the MCP client to your Claude Desktop config. Set your API token and workspace ID as
                  environment variables. Claude Code will then have access to backlog-generation tools.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                4
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Write Your Prompt</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Give Claude a product brief or feature idea. Ask it to generate Epics, Features, and Cards
                  with testing details. The MCP client calls STEa's API, which handles Firestore operations securely.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                5
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Review in Filo</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Open Filo and see your AI-generated backlog. Refine, assign, prioritize—then send cards
                  directly to Hans for testing.
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
{`┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Claude Code    │  HTTPS  │   STEa API       │  Admin  │   Firebase      │
│  (Your Machine) │────────▶│   (Relay Server) │────────▶│   Firestore     │
│                 │  Token  │                  │  SDK    │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │
         │                           │
         ▼                           ▼
  Environment Vars:          Server Credentials:
  - STEA_API_TOKEN           - FIREBASE_ADMIN_KEY
  - STEA_WORKSPACE_ID        - PROJECT_ID
                             - SERVICE_ACCOUNT`}
            </pre>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-900">✓ Customer Side</h3>
              <ul className="space-y-1 text-xs text-green-800">
                <li>• Only has API token (revocable)</li>
                <li>• No Firebase credentials</li>
                <li>• Workspace-scoped access</li>
                <li>• Rate-limited requests</li>
              </ul>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-900">✓ STEa Server</h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Validates all requests</li>
                <li>• Enforces security rules</li>
                <li>• Handles Firebase operations</li>
                <li>• Maintains audit logs</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Example Prompt */}
        <section className="mb-12 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold text-neutral-900">Example Prompt Template</h2>
          <p className="mb-4 text-sm text-neutral-600">
            Use this template in Claude Code to generate a structured backlog:
          </p>
          <div className="rounded-lg bg-neutral-900 p-6 font-mono text-sm text-neutral-100">
            <pre className="overflow-x-auto whitespace-pre-wrap">
{`Project: SyncFit Mobile App
Audience: Fitness enthusiasts, ages 18-45
Goal: Help users track workouts and sync with wearables
Constraints: iOS 15+, Android 10+, offline-first
Must-have areas:
  - User onboarding & authentication
  - Workout tracking & history
  - Wearable sync (Apple Health, Google Fit)
  - Social sharing & challenges
Out of scope: Diet tracking, coaching, in-app purchases
Quality bar: 60fps animations, <3s load time, WCAG AA
Output size: ~2 Epics, ~5 Features, ~15-20 Cards

Use the STEa MCP tools to create this backlog in Filo.
For each Card, include:
- User Story
- Acceptance Criteria (3-5 items)
- User Flow (step-by-step)`}
            </pre>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                id: 'config',
                question: 'What config files do I need?',
                answer: (
                  <div className="space-y-3 text-sm text-neutral-700">
                    <p>You'll need to configure your Claude Desktop config file:</p>
                    <div className="rounded bg-neutral-900 p-3 mt-2">
                      <code className="text-xs text-neutral-100">
                        ~/Library/Application Support/Claude/claude_desktop_config.json
                      </code>
                    </div>
                    <p className="mt-3">Example configuration:</p>
                    <pre className="rounded bg-neutral-900 p-3 text-xs text-neutral-100 overflow-x-auto">
{`{
  "mcpServers": {
    "stea": {
      "command": "npx",
      "args": ["-y", "@arcturusdc/stea-mcp-client"],
      "env": {
        "STEA_API_TOKEN": "your-api-token-here",
        "STEA_WORKSPACE_ID": "your-workspace-id"
      }
    }
  }
}`}
                    </pre>
                    <p className="mt-3 text-amber-800">
                      <strong>Important:</strong> Never commit your API token. Use environment variables or a secure
                      credential manager.
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
                id: 'where',
                question: 'Where does the MCP client run?',
                answer: (
                  <div className="text-sm text-neutral-700">
                    <p>
                      The MCP client runs <strong>locally on your dev machine</strong> as a lightweight Node.js process.
                      It communicates with STEa's secure API endpoints over HTTPS. The actual Firestore operations happen
                      server-side—your machine never touches the database directly.
                    </p>
                    <p className="mt-2">
                      This architecture means you don't need Firebase credentials, and STEa maintains full control over
                      data access and security rules.
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
