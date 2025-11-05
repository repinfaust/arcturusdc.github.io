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
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                1
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Set Up MCP Server</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Install and configure the STEa MCP server locally. It connects to your Firebase project with
                  admin credentials and exposes tools like <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">createEpic</code>,{' '}
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">createFeature</code>, and{' '}
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">createCard</code>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                2
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Register with Claude Code</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Add the MCP server to your Claude Desktop config. Claude Code will then have access to the
                  backlog-generation tools whenever you need them.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                3
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Write Your Prompt</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Give Claude a product brief or feature idea. Ask it to generate Epics, Features, and Cards
                  with testing details. The MCP server handles the Firestore writes automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-lg font-bold text-pink-600">
                4
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

Use the STEa MCP server tools to create this backlog in Filo.
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
                    <p>You'll need two main configuration files:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        <strong>Claude Desktop config</strong> (macOS):{' '}
                        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
                          ~/Library/Application Support/Claude/claude_desktop_config.json
                        </code>
                        <br />
                        This registers your MCP server with Claude.
                      </li>
                      <li>
                        <strong>Environment variables</strong> for the MCP server:
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                          <li><code className="text-xs">FIREBASE_PROJECT_ID</code></li>
                          <li><code className="text-xs">FIREBASE_CLIENT_EMAIL</code></li>
                          <li><code className="text-xs">FIREBASE_PRIVATE_KEY</code></li>
                          <li><code className="text-xs">DEFAULT_APP</code> (e.g., "Tou.me")</li>
                          <li><code className="text-xs">DEFAULT_COLUMN</code> (e.g., "Idea")</li>
                          <li><code className="text-xs">CREATED_BY</code> (e.g., "mcp:stea")</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                ),
              },
              {
                id: 'firebase',
                question: 'How do I get Firebase credentials?',
                answer: (
                  <div className="space-y-2 text-sm text-neutral-700">
                    <p>Generate a Firebase service account key:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Go to Firebase Console → Project Settings → Service Accounts</li>
                      <li>Click "Generate New Private Key"</li>
                      <li>Download the JSON file and extract the values for your env config</li>
                      <li><strong>Never commit this file to git</strong></li>
                    </ol>
                  </div>
                ),
              },
              {
                id: 'where',
                question: 'Where does the MCP server run?',
                answer: (
                  <div className="text-sm text-neutral-700">
                    <p>
                      The MCP server runs <strong>locally on your dev machine</strong>. It's not deployed to Vercel or
                      any cloud environment. Claude Code communicates with it through stdio when you invoke the tools
                      in your prompts.
                    </p>
                  </div>
                ),
              },
              {
                id: 'security',
                question: 'Is this secure?',
                answer: (
                  <div className="text-sm text-neutral-700">
                    <p>
                      Yes, when configured correctly. The MCP server uses Firebase Admin SDK with service account
                      credentials that only exist locally. Your Next.js app remains protected by Google Auth and
                      session cookies. The MCP server bypasses client-side Firestore rules using admin privileges,
                      but only you (the developer) can invoke it through Claude Code on your machine.
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
