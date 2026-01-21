'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function OrbitPage() {
  const problems = [
    {
      icon: '🔍',
      title: 'No Verifiable Audit Trail',
      description: 'Organisations can claim anything about how they use your data. Users can only trust, but never verify. Regulators can only investigate after the fact.',
      gradient: 'from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      accentColor: 'text-red-600',
    },
    {
      icon: '⚖️',
      title: 'AI Act + Global Regulation',
      description: 'EU AI Act (August 2026), UK DPDI, and US state laws require demonstrable traceability: consent frameworks, proof of lawful processing, verifiable decision-making audit trails.',
      gradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      accentColor: 'text-amber-600',
    },
    {
      icon: '🔗',
      title: 'High-Risk AI Systems Need Provable Data Lineage',
      description: 'KYC, healthcare, hiring, credit decisions, and insurance systems must prove what data was used, under what consent, who accessed it, and when.',
      gradient: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
      accentColor: 'text-violet-600',
    },
    {
      icon: '🚫',
      title: 'Missing Declarations, Not Missing Storage',
      description: 'Everyone already has the data. The problem: nobody is required to declare what they actually did. If they lie, omit, or fail to record, users can\'t detect it.',
      gradient: 'from-neutral-50 to-gray-50',
      borderColor: 'border-neutral-200',
      accentColor: 'text-neutral-600',
    },
  ];

  const solutionFeatures = [
    {
      icon: '🔐',
      title: 'Cryptographically-Verifiable Event Ledger',
      description: 'Tamper-evident audit trail that sits around existing systems. Never stores PII—only pointers, hashes, signatures, and declarations.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '📊',
      title: 'Off-Ledger Snapshots',
      description: 'Data stays where it is. Orbit stores pointers and cryptographic hashes proving integrity at specific timestamps.',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: '✍️',
      title: 'Signed Declarations',
      description: 'Organisations declare their actions with cryptographic signatures: profile updates, data usage, sharing events, consent changes.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: '✅',
      title: 'Consent State Tracking',
      description: 'User consent state (granted/revoked scopes) tracked per organisation. Soft enforcement flags violations without blocking.',
      gradient: 'from-emerald-500 to-green-500',
    },
    {
      icon: '🔄',
      title: 'Verification Routing',
      description: 'Routes verification requests between organisations without touching raw PII. Records verification outcomes in the ledger.',
      gradient: 'from-rose-500 to-pink-500',
    },
    {
      icon: '🚨',
      title: 'Undeclared-Event Detection',
      description: 'Policy engine detects usage without consent, unknown recipients, hash mismatches, and anomalous access patterns.',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const eventTypes = [
    { type: 'PROFILE_REGISTERED', description: 'Org registers initial user profile snapshot', color: 'bg-blue-100 text-blue-800' },
    { type: 'PROFILE_UPDATED', description: 'Org updates user profile snapshot', color: 'bg-indigo-100 text-indigo-800' },
    { type: 'CONSENT_GRANTED', description: 'User/system grants consent for a scope', color: 'bg-green-100 text-green-800' },
    { type: 'CONSENT_REVOKED', description: 'User/system revokes consent for a scope', color: 'bg-red-100 text-red-800' },
    { type: 'DATA_USED', description: 'Org declares usage of user data for a purpose', color: 'bg-purple-100 text-purple-800' },
    { type: 'DATA_SHARED', description: 'Org declares sharing data with another org', color: 'bg-pink-100 text-pink-800' },
    { type: 'VERIFICATION_REQUESTED', description: 'Requestor asks Orbit to route a verification claim', color: 'bg-amber-100 text-amber-800' },
    { type: 'VERIFICATION_RESPONDED', description: 'Verifier responds to a routed verification', color: 'bg-cyan-100 text-cyan-800' },
  ];

  const revenueStreams = [
    {
      title: 'B2B: Compliance Infrastructure',
      description: 'Per-event or per-seat pricing for organisations to write signed declarations',
      pricing: '$0.001–0.01 per event | $50–500/month per org',
      gradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'B2B: KYC Integration Layer',
      description: 'Primary GTM. Integrates with KYC providers to create reusable identity attestations. 40–60% cost reduction for financial institutions.',
      pricing: 'Platform fees + attestation requests (60–80% margins)',
      gradient: 'from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'B2B: RegTech Audit Dashboards',
      description: 'Real-time compliance reporting, data lineage visualisation, risk scoring for banks, fintechs, healthcare providers',
      pricing: 'Enterprise tier: $50K–500K/year',
      gradient: 'from-violet-50 to-purple-50',
      borderColor: 'border-violet-200',
    },
  ];

  return (
    <main className="min-h-screen bg-starburst">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/apps/stea" className="text-sm text-neutral-600 hover:text-neutral-900">
                ← Back to STEa
              </Link>
              <div className="h-6 w-px bg-neutral-300" />
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                <span className="text-3xl">🌐</span>
                <span>Orbit</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/apps/stea/orbit/overview"
                className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium hover:bg-emerald-200 transition-colors"
              >
                STEa + Orbit Overview
              </Link>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                PoC Phase
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <span>🔐</span>
            <span>AI System Audit Trail Infrastructure</span>
          </div>
          <h2 className="text-5xl font-extrabold text-neutral-900 mb-6 leading-tight">
            Observability, traceability, lineage, integrity, monitoring, documentation<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              with AI Act compliance as the first killer use case.
            </span>
          </h2>
          <p className="text-xl text-neutral-600 leading-relaxed mb-8">
            Orbit is AI System Audit Trail Infrastructure. We provide the logging standard, integrity service, 
            and compliance workflows that enable observability, traceability, and regulatory documentation. 
            AI Act compliance is the first killer use case, not the only value.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              AI Act Deadline: August 2026
            </div>
            <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
              Data Act: September 2025
            </div>
          </div>
        </div>

        {/* Key Value Proposition */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">
              Not just compliance documentation
            </h3>
            <p className="text-2xl font-bold text-blue-600 mb-4">
              → AI System Audit Trail Infrastructure
            </p>
            <p className="text-neutral-700 leading-relaxed">
              Orbit provides observability, traceability, lineage, integrity, monitoring, and documentation 
              for AI systems. AI Act compliance is the first killer use case, enabling vendors to sell to banks faster. 
              But the value extends beyond compliance to operational excellence and risk management.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-white/50">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            The <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Problem</span> (2025–2027)
          </h2>
          <p className="text-lg text-neutral-600">
            Modern data systems face four converging pressures that existing infrastructure cannot address
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border-2 ${problem.borderColor} bg-gradient-to-b ${problem.gradient} p-6 hover:shadow-xl transition-all`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">{problem.icon}</div>
                <div>
                  <h3 className={`text-xl font-bold ${problem.accentColor} mb-2`}>
                    {problem.title}
                  </h3>
                </div>
              </div>
              <p className="text-neutral-700 leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The Solution Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            Orbit's <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Solution</span>
          </h2>
          <p className="text-lg text-neutral-600 mb-6">
            What Orbit stores (and what it doesn't)
          </p>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 text-left">
            <ul className="space-y-3 text-neutral-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span><strong>Pointers</strong> to where data already lives (off-ledger)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span><strong>Hashes</strong> proving data integrity at specific timestamps</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span><strong>Signed declarations</strong> from organisations about their actions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span><strong>User consent state</strong> (granted/revoked scopes)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <span><strong>Access/share/update events</strong> with full attribution</span>
              </li>
              <li className="flex items-start gap-3 mt-4 pt-4 border-t border-blue-200">
                <span className="text-red-600 font-bold">✗</span>
                <span><strong>Never stores PII</strong> — all sensitive data stays off-ledger</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {solutionFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:shadow-xl transition-all"
            >
              <div className={`text-4xl mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-white/50">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            How Orbit <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Fits</span>
          </h2>
          <p className="text-lg text-neutral-600">
            The audit infrastructure layer around existing systems
          </p>
        </div>

        {/* Flow Diagram */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-neutral-50 to-white border-2 border-neutral-200 rounded-2xl p-8">
            <div className="space-y-8">
              {/* Upstream */}
              <div className="text-center">
                <div className="inline-block px-6 py-3 rounded-xl bg-blue-100 border-2 border-blue-300 mb-4">
                  <h3 className="font-bold text-blue-900">Upstream: Organisations Declare Possession</h3>
                </div>
                <p className="text-neutral-700 italic">
                  "We hold data about this user. Here's the snapshot pointer + hash proof."
                </p>
              </div>

              {/* Center Orbit */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-xl">
                    <div className="text-center">
                      <div className="text-3xl mb-1">🌐</div>
                      <div className="text-xs font-bold text-blue-900">Orbit</div>
                      <div className="text-xs text-blue-700">Audit Layer</div>
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
              </div>

              {/* Downstream */}
              <div className="text-center">
                <div className="inline-block px-6 py-3 rounded-xl bg-purple-100 border-2 border-purple-300 mb-4">
                  <h3 className="font-bold text-purple-900">Downstream: Organisations Declare Usage</h3>
                </div>
                <p className="text-neutral-700 italic">
                  "We used fields X/Y/Z under scope A for purpose B, at timestamp T, signed by our system."
                </p>
              </div>

              {/* Neutral Audit Surface */}
              <div className="text-center pt-4 border-t-2 border-neutral-200">
                <p className="text-lg font-semibold text-neutral-900">
                  Orbit becomes the <span className="text-blue-600">proof layer</span> between organisations and users
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event Types */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            Event Types (Ledger Schema)
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {eventTypes.map((event, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-neutral-200 bg-white p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-mono font-semibold ${event.color}`}>
                    {event.type}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-2">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters Now */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            Why This <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Matters Now</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6">
            <div className="text-3xl mb-3">⚖️</div>
            <h3 className="text-lg font-bold text-red-900 mb-2">AI Act Compliance</h3>
            <p className="text-sm text-neutral-700 mb-3">
              <strong>Deadline: August 2026</strong>
            </p>
            <p className="text-sm text-neutral-700">
              High-risk AI systems must demonstrate risk management, technical documentation, 
              automatic event logging, transparency, and human oversight.
            </p>
            <p className="text-xs text-red-700 mt-3 font-semibold">
              Penalties: up to €35M or 7% of global turnover
            </p>
          </div>

          <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-bold text-amber-900 mb-2">Data Act</h3>
            <p className="text-sm text-neutral-700 mb-3">
              <strong>Effective: September 2025</strong>
            </p>
            <p className="text-sm text-neutral-700">
              Organisations must enable users to access and share data generated by 
              connected devices and services. Orbit tracks consent and sharing events.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">Cheaper Than Fines</h3>
            <p className="text-sm text-neutral-700 mb-3">
              <strong>Cost Comparison</strong>
            </p>
            <p className="text-sm text-neutral-700">
              AI Act penalties: up to €35M or 7% of turnover<br />
              Data protection: up to €20M or 4% of turnover<br />
              <span className="font-semibold text-blue-700">Orbit subscription: a rounding error</span>
            </p>
          </div>
        </div>
      </section>

      {/* Revenue Streams */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-white/50">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            Revenue <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Streams</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {revenueStreams.map((stream, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border-2 ${stream.borderColor} bg-gradient-to-b ${stream.gradient} p-6 hover:shadow-xl transition-all`}
            >
              <h3 className="text-xl font-bold text-neutral-900 mb-3">
                {stream.title}
              </h3>
              <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                {stream.description}
              </p>
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs font-semibold text-neutral-900">
                  Pricing:
                </p>
                <p className="text-sm text-neutral-700 mt-1">
                  {stream.pricing}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Infrastructure */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4">
            Technical <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Infrastructure</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">Phase 1 (2025–2026)</h3>
              <p className="text-sm text-neutral-700 mb-3 font-semibold">
                Centralised Audit-Log-as-a-Service
              </p>
              <ul className="text-sm text-neutral-700 space-y-2">
                <li>• Single-environment deployment</li>
                <li>• Ledger schema + snapshot model</li>
                <li>• Consent model + policy engine</li>
                <li>• Verification routing service</li>
                <li>• Web UI for timeline & integrity checks</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">Phase 2 (2027+)</h3>
              <p className="text-sm text-neutral-700 mb-3 font-semibold">
                Federated Consortium Governance
              </p>
              <ul className="text-sm text-neutral-700 space-y-2">
                <li>• Multi-region infrastructure</li>
                <li>• Consortium governance model</li>
                <li>• Cross-border compliance</li>
                <li>• Enterprise-grade cryptography</li>
                <li>• Advanced anomaly detection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning Statement */}
      <section className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Orbit transforms regulatory compliance into shared infrastructure
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Orbit is the missing infrastructure layer of the digital identity stack.
            A cryptographically-verifiable record of who did what with a user's data.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <p className="text-sm font-semibold">Go-To-Market Strategy</p>
              <p className="text-xs text-blue-100 mt-1">2025: Build + validate with KYC vendors</p>
              <p className="text-xs text-blue-100">2026: Scale before AI Act deadline</p>
              <p className="text-xs text-blue-100">2027: Enterprise + cross-border expansion</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Try Orbit PoC</h2>
          <p className="text-neutral-600 mb-8">
            Proof-of-concept for AI providers: Logging SDK, Compliance Workflows, and Technical Documentation Generation
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-purple-900 mb-3">AI Act Technical Documentation</h3>
            <p className="text-neutral-700 mb-6">
              Compliance documentation as a service for AI providers. Generate Annex IV, VIII, and XI technical documentation 
              using the Orbit Logging SDK, Integrity Service, and Compliance Workflows.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-neutral-700"><strong>Orbit Logging SDK:</strong> Open standard for Annex IV-ready logging (Python, Node.js, Java, Go)</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-neutral-700"><strong>Orbit Integrity Service:</strong> Cryptographic signing and hash chain linking for tamper-evident logs</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-neutral-700"><strong>Compliance Workflows:</strong> Active governance alerts and compliance tasks powered by policy engine</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-sm text-neutral-700"><strong>Documentation Generation:</strong> Automated Annex IV, VIII, XI bundles from logs</span>
              </div>
            </div>
            <Link
              href="/apps/stea/orbit/AI-Act-Technical-DocumentationBundle"
              className="inline-block px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Open AI Act POC →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
