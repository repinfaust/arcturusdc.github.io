'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SteaDemoPage() {
  const [modalImage, setModalImage] = useState(null);

  const productImages = [
    {
      src: '/img/harls.png',
      alt: 'Harls - Discovery & Planning',
      title: 'Harls',
      category: 'Discovery & Planning',
      description: 'Capture problem framing, JTBD, workshop notes, and decisions. Transform discovery briefs into structured backlogs with AI-powered generation.',
      gradient: 'from-amber-50 to-orange-50',
      accentColor: 'text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      src: '/img/filo.png',
      alt: 'Filo - Board & Delivery',
      title: 'Filo',
      category: 'Board & Delivery',
      description: 'Manage Epics → Features → Cards with complete user stories, acceptance criteria, and user flows. Send cards directly to testing in one click.',
      gradient: 'from-violet-50 to-purple-50',
      accentColor: 'text-violet-600',
      borderColor: 'border-violet-200',
    },
    {
      src: '/img/hans.png',
      alt: 'Hans - Testing & Validation',
      title: 'Hans',
      category: 'Testing & Validation',
      description: 'Run structured test cases, capture evidence, and automatically create bug cards back in Filo when tests fail. Close the feedback loop.',
      gradient: 'from-emerald-50 to-green-50',
      accentColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
    },
  ];

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'One prompt creates a complete backlog with epics, features, and detailed cards via MCP + LLM integration.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: '🔗',
      title: 'Automatic Linking',
      description: 'Every test case links to its source card. Every bug links back to the failing test.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: '⚡',
      title: 'One-Click Testing',
      description: 'Click "Send to Hans" on any card to instantly convert acceptance criteria into structured test cases.',
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: '🐛',
      title: 'Auto Bug Creation',
      description: 'When a test fails, Hans can automatically create a bug card in Filo with repro steps and evidence.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: '📊',
      title: 'Complete Dashboard',
      description: 'Track delivery status, test coverage, pass rates, and cycle time across the entire system.',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: '🎯',
      title: 'Source of Truth',
      description: 'Trace any epic → feature → card → test → bug → fix with zero copy/paste.',
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: '📱',
      title: 'Mobile-Friendly',
      description: 'Hans works beautifully on mobile devices for testing on the go with quick evidence capture.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: '🔄',
      title: 'Retest Workflows',
      description: 'When bugs are fixed, linked test cases are automatically marked for retest to verify the fix.',
      gradient: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <main className="min-h-screen bg-starburst">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card p-8 mt-2">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-3">
              STEa
            </h1>
            <p className="text-xl font-semibold text-neutral-700 mb-4">
              Plan • Build • Test
            </p>
            <p className="text-base text-neutral-600 max-w-3xl mx-auto">
              A closed-loop product system that keeps strategy, delivery, and QA in perfect sync
            </p>
          </div>
        </div>

        {/* Products Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-extrabold text-neutral-900 mb-6 px-2">
            Meet the <span className="bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">System</span>
          </h2>
          <p className="text-neutral-600 mb-6 px-2">
            Three connected tools that eliminate context switching and maintain full traceability
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productImages.map((product, idx) => (
              <div key={idx} className={`card p-6 border-l-4 ${product.borderColor} hover:shadow-xl transition-all duration-300`}>
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
                    {product.category}
                  </div>
                  <h3 className={`text-xl font-extrabold ${product.accentColor} mb-4`}>{product.title}</h3>
                </div>

                {/* Large clickable image with hover tilt */}
                <div
                  className={`relative w-full aspect-[4/3] mb-4 rounded-2xl border-2 ${product.borderColor} bg-gradient-to-br ${product.gradient} overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-rotate-1 hover:scale-[1.02] group`}
                  onClick={() => setModalImage(product)}
                >
                  <Image
                    src={product.src}
                    alt={product.alt}
                    fill
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Flow Section */}
        <section className="mt-12">
          <div className="card p-8">
            <h2 className="text-2xl font-extrabold text-neutral-900 mb-4 text-center">
              The <span className="bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">Closed Loop</span>
            </h2>
            <p className="text-neutral-600 mb-8 text-center max-w-2xl mx-auto">
              Information flows seamlessly through the entire product lifecycle
            </p>

            {/* Circular Loop Diagram */}
            <div className="relative w-full max-w-2xl mx-auto my-16" style={{ height: '500px' }}>
              {/* Rotating circle background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-96 h-96 rounded-full border-4 border-dashed border-neutral-300 animate-spin-very-slow"></div>
              </div>

              {/* Animated flowing dots */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-96 h-96 relative">
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-amber-500 animate-orbit-1 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-violet-500 animate-orbit-2 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-emerald-500 animate-orbit-3 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-orange-500 animate-orbit-4 shadow-lg"></div>
                </div>
              </div>

              {/* Top - Discovery */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                <div className="card p-4 border-2 border-amber-300 bg-amber-50/90 min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-amber-700 mb-1">Discovery</h4>
                  <p className="text-xs text-neutral-600">Brief → Prompts</p>
                </div>
                {/* Arrow pointing right */}
                <div className="absolute top-1/2 left-full ml-2 -translate-y-1/2 text-3xl text-amber-500 animate-pulse-slow">
                  →
                </div>
              </div>

              {/* Right - Backlog */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-2">
                <div className="card p-4 border-2 border-violet-300 bg-violet-50/90 min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-violet-700 mb-1">Backlog</h4>
                  <p className="text-xs text-neutral-600">Epics → Features → Cards</p>
                </div>
                {/* Arrow pointing down */}
                <div className="absolute top-full mt-2 right-1/2 translate-x-1/2 text-3xl text-violet-500 animate-pulse-slow animation-delay-300">
                  ↓
                </div>
              </div>

              {/* Bottom - Testing */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
                <div className="card p-4 border-2 border-emerald-300 bg-emerald-50/90 min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-emerald-700 mb-1">Testing</h4>
                  <p className="text-xs text-neutral-600">Test Cases → Evidence</p>
                </div>
                {/* Arrow pointing left */}
                <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 text-3xl text-emerald-500 animate-pulse-slow animation-delay-600">
                  ←
                </div>
              </div>

              {/* Left - Feedback */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-2">
                <div className="card p-4 border-2 border-orange-300 bg-orange-50/90 min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-orange-700 mb-1">Feedback</h4>
                  <p className="text-xs text-neutral-600">Bugs → Fixes → Retest</p>
                </div>
                {/* Arrow pointing up to complete the loop */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-3xl text-orange-500 animate-pulse-slow animation-delay-900">
                  ↑
                </div>
              </div>

              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="p-6 bg-white rounded-2xl border-2 border-neutral-200 shadow-xl">
                  <h3 className="text-lg font-extrabold bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent mb-2 whitespace-nowrap">
                    Continuous Flow
                  </h3>
                  <p className="text-xs text-neutral-600 whitespace-nowrap">No context switching<br/>Full traceability</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mt-12">
          <h2 className="text-2xl font-extrabold text-neutral-900 mb-6 px-2">
            Key <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Features</span>
          </h2>
          <p className="text-neutral-600 mb-6 px-2">
            Everything you need to ship faster with higher quality
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`text-4xl mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }}>
                  {feature.icon}
                </div>
                <h4 className={`font-extrabold text-neutral-900 mb-2 text-sm bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  {feature.title}
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mt-12">
          <div className="card p-8">
            <h2 className="text-2xl font-extrabold text-neutral-900 mb-4 text-center">
              How It <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-neutral-600 mb-8 text-center max-w-2xl mx-auto">
              From idea to validated feature in a seamless flow
            </p>

            <div className="space-y-6 max-w-3xl mx-auto">
              {[
                {
                  number: 1,
                  color: 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 border-2 border-amber-300',
                  title: 'Start in Harls or your LLM',
                  description: 'Work directly in Harls to capture discovery notes, or use your preferred LLM with MCP server integration to turn a single prompt into a complete roadmap of epics, features, and cards that auto-populate in Filo.',
                },
                {
                  number: 2,
                  color: 'bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700 border-2 border-violet-300',
                  title: 'Build in Filo',
                  description: 'Review generated cards with complete user stories, acceptance criteria, and user flows. Edit, prioritize, and assign work.',
                },
                {
                  number: 3,
                  color: 'bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-300',
                  title: 'Test in Hans',
                  description: 'Click "Send to Hans" on any card. Test cases appear with all context. Mark pass/fail, attach evidence.',
                },
                {
                  number: 4,
                  color: 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 border-2 border-orange-300',
                  title: 'Close the Loop',
                  description: 'Failures auto-create bug cards in Filo. Fix the bugs, and Hans automatically re-runs tests to verify.',
                },
              ].map((step) => (
                <div key={step.number} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full ${step.color} flex items-center justify-center font-extrabold text-lg shadow-lg`}>
                    {step.number}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 mb-1">{step.title}</h4>
                    <p className="text-sm text-neutral-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-12">
          <div className="card p-8 text-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border-2 border-neutral-200">
            <h2 className="text-3xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">
                Ready to Close the Loop?
              </span>
            </h2>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Try the demo: Draft a brief → Generate backlog → Send to testing → Watch the magic happen
            </p>
            <Link
              href="/apps/stea"
              className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all font-semibold"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>
            STEa is part of the Arcturus Studio toolkit.{' '}
            <Link href="/apps/stea" className="text-neutral-700 hover:underline">
              Back to STEa Home
            </Link>
          </p>
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <Image
                src={modalImage.src}
                alt={modalImage.alt}
                width={2000}
                height={1500}
                className="object-contain max-h-full"
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm text-white p-4 rounded-xl">
              <h3 className="text-xl font-bold mb-1">{modalImage.title}</h3>
              <p className="text-sm opacity-90">{modalImage.category}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes spin-very-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(192px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(192px) rotate(-360deg);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-spin-very-slow {
          animation: spin-very-slow 30s linear infinite;
        }

        .animate-orbit-1 {
          animation: orbit 8s linear infinite;
        }

        .animate-orbit-2 {
          animation: orbit 8s linear infinite;
          animation-delay: 2s;
        }

        .animate-orbit-3 {
          animation: orbit 8s linear infinite;
          animation-delay: 4s;
        }

        .animate-orbit-4 {
          animation: orbit 8s linear infinite;
          animation-delay: 6s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animation-delay-900 {
          animation-delay: 0.9s;
        }
      `}</style>
    </main>
  );
}
