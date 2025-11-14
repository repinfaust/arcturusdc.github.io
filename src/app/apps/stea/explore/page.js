'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function SteaDemoPage() {
  const searchParams = useSearchParams();
  const [modalImage, setModalImage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);

  // Stripe Price IDs
  const priceIds = {
    solo_monthly: 'price_1ST5paCtbV5UkklC3qY1EcxC',
    solo_yearly: 'price_1ST5pbCtbV5UkklCMtwkY2Rl',
    team_monthly: 'price_1ST5pcCtbV5UkklCU0wTnhyM',
    team_yearly: 'price_1ST5pdCtbV5UkklCmzRVHRWc',
    agency_monthly: 'price_1ST5pfCtbV5UkklC8d44VTfC',
    agency_yearly: 'price_1ST5pgCtbV5UkklCsj4MuhYh',
    mcp_addon: 'price_1ST5phCtbV5UkklC7fcJL3Ar',
  };

  // Check for success/cancel URL parameters
  useEffect(() => {
    if (searchParams.get('success')) {
      setShowSuccessMessage(true);
      setActiveTab('pricing');
      setTimeout(() => setShowSuccessMessage(false), 10000);
    }
    if (searchParams.get('canceled')) {
      setShowCancelMessage(true);
      setActiveTab('pricing');
      setTimeout(() => setShowCancelMessage(false), 5000);
    }
    // Check for tab parameter to switch tabs directly
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pricing') {
      setActiveTab('pricing');
    }
  }, [searchParams]);

  // Handle Stripe checkout
  const handleCheckout = async (priceId, planName) => {
    setCheckoutLoading(planName);

    try {
      // Determine if this is a one-time payment (MCP addon) or subscription
      const isOneTime = priceId === priceIds.mcp_addon;
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          mode: isOneTime ? 'payment' : 'subscription'
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert(`Failed to create checkout session: ${error.message}. Please try again.`);
      setCheckoutLoading(null);
    }
  };

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
      link: '/apps/stea/explore/explore-harls',
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
      link: '/apps/stea/explore/explore-filo',
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
      link: '/apps/stea/explore/explore-hans',
    },
    {
      src: '/img/ruby.png',
      alt: 'Ruby - Product Intelligence',
      title: 'Ruby',
      category: 'Product Intelligence',
      description: 'The memory of STEa. Capture context from Harls, Filo, and Hans into living documentation. Generate PRDs, build specs, and release notes with AI. Every idea remembered, every spec connected.',
      gradient: 'from-rose-50 to-pink-50',
      accentColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      link: '/apps/stea/explore/explore-ruby',
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
    {
      icon: '🧠',
      title: 'AI Documentation',
      description: 'Generate PRDs, build specs, and release notes from Harls/Filo context with a single prompt.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: '🔍',
      title: 'Reviewer Mode',
      description: 'AI-assisted compliance checks for accessibility, GDPR, design parity, and test coverage before launch.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: '🧩',
      title: 'Knowledge Graph',
      description: 'Visualize relationships across discovery, delivery, testing, and release. See how epics link to code and tests.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: '📋',
      title: 'Release Automation',
      description: 'Pull commits, PRs, and Hans test outcomes into clean changelogs automatically when tests pass.',
      gradient: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <main className="min-h-screen bg-starburst" itemScope itemType="https://schema.org/SoftwareApplication">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Login Button - Top Right */}
        <div className="flex justify-end mb-4">
          <Link
            href="/apps/stea"
            className="px-6 py-2 bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-semibold"
          >
            Login
          </Link>
        </div>

        {/* Header */}
        <div className="card p-8 mt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-3">
              <Image
                src="/img/acturusdc_stea_logo.png"
                alt="STEa Logo"
                width={64}
                height={64}
                className="object-contain"
                itemProp="image"
              />
              <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900" itemProp="name">
                STEa
              </h1>
            </div>
            <p className="text-xl font-semibold text-neutral-700 mb-4" itemProp="slogan">
              Plan • Build • Test • Document
            </p>
            <p className="text-base text-neutral-600 max-w-3xl mx-auto" itemProp="description">
              A closed-loop product system that keeps strategy, delivery, testing, and product intelligence in perfect sync
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mt-6 border-t border-neutral-200 pt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'pricing'
                  ? 'bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Pricing
            </button>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <>
        {/* Products Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-extrabold text-neutral-900 mb-6 px-2">
            Meet the <span className="bg-gradient-to-r from-amber-600 via-violet-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent">System</span>
          </h2>
          <p className="text-neutral-600 mb-6 px-2">
            Four connected tools that eliminate context switching and maintain full traceability
          </p>

          {/* Video Section */}
          <div className="mb-8 px-2">
            <div className="w-full overflow-hidden rounded-2xl border-2 border-neutral-200 bg-neutral-900 shadow-xl">
              <video
                controls
                className="w-full"
                preload="metadata"
              >
                <source src="/vid/stea_overview_video_1.5x.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productImages.map((product, idx) => (
              <div key={idx} className={`card p-6 border-l-4 ${product.borderColor} hover:shadow-xl transition-all duration-300 flex flex-col`}>
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

                <p className="text-sm text-neutral-600 leading-relaxed mb-4 flex-grow">
                  {product.description}
                </p>

                {/* Learn More Link */}
                <Link
                  href={product.link}
                  className={`inline-flex items-center gap-2 text-sm font-semibold ${product.accentColor} hover:underline transition-all mt-auto`}
                >
                  Explore Features
                  <span className="text-xs">→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Flow Section */}
        <section className="mt-12">
          <div className="card p-8">
            <h2 className="text-2xl font-extrabold text-neutral-900 mb-4 text-center">
              The <span className="bg-gradient-to-r from-amber-600 via-violet-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent">Closed Loop</span>
            </h2>
            <p className="text-neutral-600 mb-8 text-center max-w-2xl mx-auto">
              Information flows seamlessly through the entire product lifecycle
            </p>

            {/* Circular Loop Diagram */}
            <div className="relative w-full max-w-2xl mx-auto my-8 sm:my-16 aspect-square max-h-[600px]">
              {/* Rotating circle background */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full h-full max-w-96 max-h-96 rounded-full border-2 sm:border-4 border-dashed border-neutral-300 animate-spin-very-slow"></div>
              </div>

              {/* Animated flowing dots */}
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full h-full max-w-96 max-h-96 relative">
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-amber-500 animate-orbit-1 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-violet-500 animate-orbit-2 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-emerald-500 animate-orbit-3 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-rose-500 animate-orbit-4 shadow-lg"></div>
                  <div className="absolute top-1/2 left-1/2 -ml-1.5 -mt-1.5 w-3 h-3 rounded-full bg-orange-500 animate-orbit-1 shadow-lg"></div>
                </div>
              </div>

              {/* Top - Discovery */}
              <div className="absolute top-2 sm:top-0 left-1/2 -translate-x-1/2 sm:-translate-y-2">
                <div className="card p-2 sm:p-4 border border-amber-300 sm:border-2 bg-amber-50/90 min-w-[120px] sm:min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-amber-700 mb-0 sm:mb-1 text-xs sm:text-base">Discovery</h4>
                  <p className="text-[10px] sm:text-xs text-neutral-600 hidden sm:block">Brief → Prompts</p>
                </div>
                {/* Arrow pointing right */}
                <div className="absolute top-1/2 left-full ml-1 sm:ml-2 -translate-y-1/2 text-xl sm:text-3xl text-amber-500 animate-pulse-slow hidden sm:block">
                  →
                </div>
              </div>

              {/* Right - Backlog */}
              <div className="absolute top-1/2 right-0 sm:right-0 -translate-y-1/2 translate-x-8 sm:translate-x-2">
                <div className="card p-2 sm:p-4 border border-violet-300 sm:border-2 bg-violet-50/90 min-w-[100px] sm:min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-violet-700 mb-0 sm:mb-1 text-[10px] sm:text-base">Backlog</h4>
                  <p className="text-[10px] sm:text-xs text-neutral-600 hidden sm:block">Epics → Features → Cards</p>
                </div>
                {/* Arrow pointing down */}
                <div className="absolute top-full mt-1 sm:mt-2 right-1/2 translate-x-1/2 text-xl sm:text-3xl text-violet-500 animate-pulse-slow animation-delay-300 hidden sm:block">
                  ↓
                </div>
              </div>

              {/* Bottom - Testing */}
              <div className="absolute bottom-2 sm:bottom-0 left-1/2 -translate-x-1/2 sm:translate-y-2">
                <div className="card p-2 sm:p-4 border border-emerald-300 sm:border-2 bg-emerald-50/90 min-w-[120px] sm:min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-emerald-700 mb-0 sm:mb-1 text-xs sm:text-base">Testing</h4>
                  <p className="text-[10px] sm:text-xs text-neutral-600 hidden sm:block">Test Cases → Evidence</p>
                </div>
                {/* Arrow pointing left */}
                <div className="absolute top-1/2 right-full mr-1 sm:mr-2 -translate-y-1/2 text-xl sm:text-3xl text-emerald-500 animate-pulse-slow animation-delay-600 hidden sm:block">
                  ←
                </div>
              </div>

              {/* Left - Feedback */}
              <div className="absolute top-1/2 left-0 sm:left-0 -translate-y-1/2 -translate-x-8 sm:-translate-x-2">
                <div className="card p-2 sm:p-4 border border-orange-300 sm:border-2 bg-orange-50/90 min-w-[100px] sm:min-w-[160px] text-center hover:shadow-xl transition-all backdrop-blur-sm">
                  <h4 className="font-bold text-orange-700 mb-0 sm:mb-1 text-[10px] sm:text-base">Feedback</h4>
                  <p className="text-[10px] sm:text-xs text-neutral-600 hidden sm:block">Bugs → Fixes → Retest</p>
                </div>
                {/* Arrow pointing up to complete the loop */}
                <div className="absolute bottom-full mb-1 sm:mb-2 left-1/2 -translate-x-1/2 text-xl sm:text-3xl text-orange-500 animate-pulse-slow animation-delay-900 hidden sm:block">
                  ↑
                </div>
              </div>

              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="p-2 sm:p-6 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg sm:rounded-2xl border border-rose-200 sm:border-2 shadow-xl">
                  <h3 className="text-xs sm:text-lg font-extrabold text-rose-600 mb-0 sm:mb-2 whitespace-nowrap">
                    Ruby
                  </h3>
                  <p className="text-[10px] sm:text-xs text-neutral-600 whitespace-nowrap hidden sm:block">Product Intelligence<br/>Knowledge Backbone</p>
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
                  color: 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 border-2 border-rose-300',
                  title: 'Document in Ruby',
                  description: 'Generate PRDs, build specs, and release notes automatically. Ruby captures context from discovery, delivery, and testing to create living documentation linked to every epic, feature, and test.',
                },
                {
                  number: 5,
                  color: 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 border-2 border-orange-300',
                  title: 'Close the Loop',
                  description: 'Failures auto-create bug cards in Filo. Fix the bugs, and Hans automatically re-runs tests to verify. Ruby updates release notes with fixes.',
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
              <span className="bg-gradient-to-r from-amber-600 via-violet-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent">
                Ready to Close the Loop?
              </span>
            </h2>
            <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
              Try the demo: Draft a brief → Generate backlog → Send to testing → Generate docs → Close the loop
            </p>
            <button
              onClick={() => {
                setActiveTab('pricing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all font-semibold"
            >
              View Pricing
            </button>
          </div>
        </section>

          </>
        )}

        {/* Pricing Tab Content */}
        {activeTab === 'pricing' && (
          <section className="mt-8">
            <div className="card p-8">
              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-lg">Payment Successful!</h3>
                      <p className="text-sm">Thank you for subscribing to STEa. Check your email for your receipt and next steps.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancel Message */}
              {showCancelMessage && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="font-bold">Checkout Canceled</h3>
                      <p className="text-sm">No worries! You can subscribe whenever you're ready.</p>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-3xl font-extrabold text-neutral-900 mb-4 flex items-center gap-3">
                <Image
                  src="/img/acturusdc_stea_logo.png"
                  alt="STEa Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
                <span className="bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">STEa Pricing</span>
              </h2>
              {/* Structured Data for SEO */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'SoftwareApplication',
                    name: 'STEa',
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    offers: [
                      {
                        '@type': 'Offer',
                        name: 'Solo Monthly',
                        price: '9.00',
                        priceCurrency: 'GBP',
                        billingDuration: 'P1M',
                      },
                      {
                        '@type': 'Offer',
                        name: 'Solo Yearly',
                        price: '92.00',
                        priceCurrency: 'GBP',
                        billingDuration: 'P1Y',
                      },
                      {
                        '@type': 'Offer',
                        name: 'Team Monthly',
                        price: '25.00',
                        priceCurrency: 'GBP',
                        billingDuration: 'P1M',
                      },
                      {
                        '@type': 'Offer',
                        name: 'Team Yearly',
                        price: '255.00',
                        priceCurrency: 'GBP',
                        billingDuration: 'P1Y',
                      },
                      {
                        '@type': 'Offer',
                        name: 'Agency Monthly',
                        price: '49.00',
                        priceCurrency: 'GBP',
                        billingDuration: 'P1M',
                      },
                      {
                        '@type': 'Offer',
                        name: 'Agency Yearly',
                        price: '499.00',
                        priceCurrency: 'GBP',
                        billingDuration: 'P1Y',
                      },
                    ],
                    description: 'A closed-loop product system that keeps strategy, delivery, testing, and product intelligence in perfect sync',
                    url: 'https://www.arcturusdc.com/apps/stea/explore',
                    publisher: {
                      '@type': 'Organization',
                      name: 'Arcturus Digital Consulting',
                      url: 'https://www.arcturusdc.com',
                    },
                  }),
                }}
              />
              <p className="text-neutral-600 mb-8 text-lg">
                Choose a plan that fits how you build. Every plan includes access to <strong>Harls</strong>, <strong>Filo</strong>, <strong>Hans</strong>, and hosted <strong>AutoProduct</strong> automation.
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                By subscribing or making a purchase, you agree to our{' '}
                <Link href="/apps/stea/terms" className="text-amber-600 hover:underline font-medium">
                  Terms & Conditions
                </Link>
                .
              </p>

              <hr className="my-8 border-neutral-200" />

              {/* Core Plans */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">🔹 Core Plans</h3>

              <div className="overflow-x-auto mb-12">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 via-violet-50 to-emerald-50">
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Plan</th>
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Monthly</th>
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Yearly (Save 15%)</th>
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Designed For</th>
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Key Features</th>
                      <th className="border border-neutral-300 px-4 py-3 text-center font-bold text-neutral-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-neutral-50">
                      <td className="border border-neutral-300 px-4 py-3 font-bold text-neutral-900">
                        <button
                          onClick={() => handleCheckout(priceIds.solo_monthly, 'Solo Monthly')}
                          className="text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                        >
                          Solo
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.solo_monthly, 'Solo Monthly')}
                          className="text-neutral-900 hover:text-amber-600 hover:underline cursor-pointer font-medium"
                        >
                          £9 / month
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.solo_yearly, 'Solo Yearly')}
                          className="text-neutral-900 hover:text-amber-600 hover:underline cursor-pointer font-medium"
                        >
                          £92 / year
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">Independent makers or solo PMs</td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">
                        • 1 active App (archive old projects, create new)<br />
                        • Personal workspace (Google Auth required)<br />
                        • Hosted AutoProduct included<br />
                        • Full access to Harls, Filo & Hans boards
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-center">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleCheckout(priceIds.solo_monthly, 'Solo Monthly')}
                            disabled={checkoutLoading === 'Solo Monthly'}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === 'Solo Monthly' ? 'Loading...' : 'Monthly'}
                          </button>
                          <button
                            onClick={() => handleCheckout(priceIds.solo_yearly, 'Solo Yearly')}
                            disabled={checkoutLoading === 'Solo Yearly'}
                            className="px-4 py-2 bg-gradient-to-r from-amber-700 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === 'Solo Yearly' ? 'Loading...' : 'Yearly (Save 15%)'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="border border-neutral-300 px-4 py-3 font-bold text-neutral-900">
                        <button
                          onClick={() => handleCheckout(priceIds.team_monthly, 'Team Monthly')}
                          className="text-violet-600 hover:text-violet-700 hover:underline cursor-pointer"
                        >
                          Team
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.team_monthly, 'Team Monthly')}
                          className="text-neutral-900 hover:text-violet-600 hover:underline cursor-pointer font-medium"
                        >
                          £25 / seat / month
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.team_yearly, 'Team Yearly')}
                          className="text-neutral-900 hover:text-violet-600 hover:underline cursor-pointer font-medium"
                        >
                          £255 / seat / year
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">Small product teams</td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">
                        • Up to <strong>10 active Apps</strong> at once (archive + reuse)<br />
                        • Shared workspaces with role-based access<br />
                        • Collaborative board + testing views<br />
                        • Hosted AutoProduct automation
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-center">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleCheckout(priceIds.team_monthly, 'Team Monthly')}
                            disabled={checkoutLoading === 'Team Monthly'}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === 'Team Monthly' ? 'Loading...' : 'Monthly'}
                          </button>
                          <button
                            onClick={() => handleCheckout(priceIds.team_yearly, 'Team Yearly')}
                            disabled={checkoutLoading === 'Team Yearly'}
                            className="px-4 py-2 bg-gradient-to-r from-violet-700 to-purple-700 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === 'Team Yearly' ? 'Loading...' : 'Yearly (Save 15%)'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="border border-neutral-300 px-4 py-3 font-bold text-neutral-900">
                        <button
                          onClick={() => handleCheckout(priceIds.agency_monthly, 'Agency Monthly')}
                          className="text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          Agency / Partner
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.agency_monthly, 'Agency Monthly')}
                          className="text-neutral-900 hover:text-emerald-600 hover:underline cursor-pointer font-medium"
                        >
                          £49 / seat / month
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.agency_yearly, 'Agency Yearly')}
                          className="text-neutral-900 hover:text-emerald-600 hover:underline cursor-pointer font-medium"
                        >
                          £499 / seat / year
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">Agencies or consultants managing multiple clients</td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">
                        • Multiple client workspaces with scalable capacity<br />
                        • Custom branding & export templates<br />
                        • Everything in Team plan<br />
                        • White-label ready
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-center">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleCheckout(priceIds.agency_monthly, 'Agency Monthly')}
                            disabled={checkoutLoading === 'Agency Monthly'}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === 'Agency Monthly' ? 'Loading...' : 'Monthly'}
                          </button>
                          <button
                            onClick={() => handleCheckout(priceIds.agency_yearly, 'Agency Yearly')}
                            disabled={checkoutLoading === 'Agency Yearly'}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-700 to-green-700 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkoutLoading === 'Agency Yearly' ? 'Loading...' : 'Yearly (Save 15%)'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-neutral-600 italic mb-12">
                *Need higher capacity? Contact us for enterprise workspace options.
              </p>

              <hr className="my-8 border-neutral-200" />

              {/* Optional Add-On */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">🧩 Optional Add-On</h3>

              <div className="overflow-x-auto mb-12">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 via-violet-50 to-emerald-50">
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Add-On</th>
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Price</th>
                      <th className="border border-neutral-300 px-4 py-3 text-left font-bold text-neutral-900">Description</th>
                      <th className="border border-neutral-300 px-4 py-3 text-center font-bold text-neutral-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-neutral-50">
                      <td className="border border-neutral-300 px-4 py-3 font-bold text-neutral-900">
                        <button
                          onClick={() => handleCheckout(priceIds.mcp_addon, 'MCP Config Pack')}
                          className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer text-left"
                        >
                          MCP Config Pack<br />(Self-Hosted AutoProduct)
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3">
                        <button
                          onClick={() => handleCheckout(priceIds.mcp_addon, 'MCP Config Pack')}
                          className="font-bold text-amber-600 hover:text-rose-600 hover:underline cursor-pointer"
                        >
                          £30 one-off
                        </button>
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-sm">
                        Run AutoProduct on your own infrastructure. Includes:<br />
                        • Prompt templates<br />
                        • Example MCP config files<br />
                        • Setup README for Firebase + STEa integration<br /><br />
                        Requires an active STEa subscription.
                      </td>
                      <td className="border border-neutral-300 px-4 py-3 text-center">
                        <button
                          onClick={() => handleCheckout(priceIds.mcp_addon, 'MCP Config Pack')}
                          disabled={checkoutLoading === 'MCP Config Pack'}
                          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {checkoutLoading === 'MCP Config Pack' ? 'Loading...' : 'Purchase'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <hr className="my-8 border-neutral-200" />

              {/* All Plans Include */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-6">🧱 All Plans Include</h3>
              <ul className="space-y-2 mb-12 text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="text-lg">🔐</span>
                  <span><strong>Google Sign-In</strong> for every workspace</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">☁️</span>
                  <span><strong>Firestore Sync</strong> for real-time persistence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🧠</span>
                  <span><strong>Hosted AutoProduct Relay</strong> for backlog generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">💾</span>
                  <span><strong>Workspace Isolation</strong> for security</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">📦</span>
                  <span><strong>Archiving</strong> to keep old builds read-only</span>
                </li>
              </ul>

              <hr className="my-8 border-neutral-200" />

              {/* App Lifecycle */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">⚙️ App Lifecycle</h3>
              <p className="text-neutral-600 mb-8">
                Build → Complete → Archive (read-only) → Create next App.<br />
                Solo: 1 active App. Team: up to 10. Agency: scalable.
              </p>

              <hr className="my-8 border-neutral-200" />

              {/* CTA */}
              <div id="signup" className="text-center scroll-mt-8 bg-gradient-to-br from-amber-50 via-violet-50 to-emerald-50 p-8 rounded-2xl border-2 border-amber-200">
                <h3 className="text-3xl font-extrabold text-neutral-900 mb-3">
                  Start Building Better Products Today
                </h3>
                <p className="text-lg text-neutral-700 mb-2 max-w-2xl mx-auto font-semibold">
                  Join product teams using STEa to ship faster with higher quality
                </p>
                <p className="text-base text-neutral-600 mb-8 max-w-2xl mx-auto">
                  Get instant access to Harls, Filo, Hans, and Ruby. Start your subscription today—cancel anytime.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => handleCheckout(priceIds.solo_monthly, 'Solo Monthly')}
                    disabled={checkoutLoading === 'Solo Monthly'}
                    className="inline-block px-10 py-4 bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading === 'Solo Monthly' ? 'Loading...' : '🚀 Get Started — £9/month'}
                  </button>
                  <Link
                    href="/apps/stea"
                    className="inline-block px-8 py-4 bg-white border-2 border-neutral-300 text-neutral-900 rounded-xl hover:shadow-lg hover:border-amber-600 hover:-translate-y-1 transition-all font-semibold"
                  >
                    Login to STEa
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>14-day money-back guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>No setup fees</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-500 mt-4">
                  Questions? Contact us at <a href="mailto:support@arcturusdc.com" className="text-amber-600 hover:underline">support@arcturusdc.com</a>
                  {' '}•{' '}
                  <Link href="/apps/stea/terms" className="text-amber-600 hover:underline">
                    View Terms & Conditions
                  </Link>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/apps/stea"
            className="inline-block px-8 py-3 mb-4 bg-gradient-to-r from-amber-600 via-violet-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all font-semibold"
          >
            Login to STEa
          </Link>
          <p className="text-sm text-neutral-500">
            STEa is part of the Arcturus Studio toolkit.
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
            transform: rotate(0deg) translateX(min(192px, calc(50vw - 80px))) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(min(192px, calc(50vw - 80px))) rotate(-360deg);
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
