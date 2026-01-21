import Footer from "@/components/Footer";

export const metadata = { title: "Capabilities — Arcturus Digital Consulting" };

export default function Capabilities() {
  return (
    <>
      {/* Global pill nav from your layout will stay, no Header duplication */}

      <main className="pb-10">
        <div className="mx-auto max-w-6xl px-4">
          {/* Hero */}
          <section className="card p-6 mt-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold">Capabilities</h1>
            <p className="mt-2 text-neutral-700 font-semibold">What I actually work on</p>
            <p className="mt-3 text-neutral-700">
              I build and evolve practical systems that help people and organisations make better decisions under
              real-world constraints - regulation, legacy platforms, operational risk, and imperfect data.
            </p>
            <p className="mt-3 text-neutral-700">
              Most of the work below comes from shipping and iterating on my own products, not advisory decks.
            </p>
          </section>

          {/* Decision-support platforms */}
          <section className="card p-6 mt-4">
            <h2 className="text-xl font-extrabold mb-2">Decision-support platforms (Product &amp; Delivery)</h2>
            <p className="text-neutral-700 mb-4">
              I design and build tools that make complex work visible, auditable, and easier to reason about.
            </p>
            <div className="text-neutral-700 mb-4">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>
                    <a className="text-red-600 hover:underline" href="/apps/stea/explore">STEa</a>
                  </strong>{" "}
                  - a structured product and delivery workspace that links decisions, testing, documentation, and outcomes, without turning into process theatre.
                </li>
                <li>Lightweight systems for capturing why decisions were made, not just what was delivered.</li>
                <li>Tools that reduce handover loss between product, engineering, QA, and stakeholders.</li>
              </ul>
            </div>
            <div className="text-neutral-700">
              <p className="font-semibold mb-2">Focus:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>clarity over ceremony</li>
                <li>traceability without bureaucracy</li>
                <li>systems that teams actually keep using</li>
              </ul>
            </div>
          </section>

          {/* Auditability, risk & accountability */}
          <section className="card p-6 mt-4">
            <h2 className="text-xl font-extrabold mb-2">Auditability, risk &amp; accountability (Orbit)</h2>
            <p className="text-neutral-700 mb-4">
              I am interested in how systems hold up when they are questioned later - by regulators, auditors, or customers.
            </p>
            <div className="text-neutral-700 mb-4">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>
                    <a className="text-red-600 hover:underline" href="/apps/stea/orbit">Orbit</a>
                  </strong>{" "}
                  - an append-only, verifiable ledger for recording decisions, data usage, and system interactions in a way that supports accountability and post-hoc review.
                </li>
                <li>
                  <a className="text-red-600 hover:underline" href="/apps/stea/orbit/overview">Orbit overview</a>{" "}
                  - the STEa + Orbit accountability framework and staged proof-of-concept plan.
                </li>
                <li>Exploring how cryptographic proofs and structured logs can replace brittle screenshots, spreadsheets, and "trust me" documentation.</li>
                <li>Designing for explainability rather than blind automation.</li>
              </ul>
            </div>
            <div className="text-neutral-700">
              <p className="font-semibold mb-2">Focus:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>human accountability stays explicit</li>
                <li>clear boundaries on where automation is allowed</li>
                <li>evidence by default, not reconstruction later</li>
              </ul>
            </div>
          </section>

          {/* Applied AI */}
          <section className="card p-6 mt-4">
            <h2 className="text-xl font-extrabold mb-2">Applied AI (used carefully, not everywhere)</h2>
            <p className="text-neutral-700 mb-4">
              I use AI as a thinking and support tool, not as an authority.
            </p>
            <div className="text-neutral-700 mb-4">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Using AI to help surface inconsistencies, risks, or gaps for human review - not to make final decisions.</li>
                <li>Designing human-in-the-loop patterns with clear ignore/override rules.</li>
                <li>Testing small, low-risk pilots before scaling anything.</li>
              </ul>
            </div>
            <div className="text-neutral-700">
              <p className="font-semibold mb-2">Focus:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>validation over novelty</li>
                <li>bounded scope and clear ownership</li>
                <li>knowing where AI should not be used</li>
              </ul>
            </div>
          </section>

          {/* App & system development */}
          <section className="card p-6 mt-4">
            <h2 className="text-xl font-extrabold mb-2">App &amp; system development</h2>
            <p className="text-neutral-700 mb-4">
              Alongside platform work, I design and ship focused apps where existing tools are either too generic or too heavy.
            </p>
            <div className="text-neutral-700 mb-4">
              <p className="font-semibold mb-2">Examples:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>iOS and Android apps with privacy-first principles.</li>
                <li>Narrow, opinionated products built around a specific job-to-be-done.</li>
                <li>Systems designed to be maintained realistically, not abandoned after launch.</li>
              </ul>
            </div>
            <div className="text-neutral-700">
              <p className="font-semibold mb-2">Focus:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>simplicity over feature volume</li>
                <li>compliance baked in, not bolted on</li>
                <li>real usage, not demos</li>
              </ul>
            </div>
          </section>

          {/* How this ties together */}
          <section className="card p-6 mt-4">
            <h2 className="text-xl font-extrabold mb-2">How this all ties together</h2>
            <p className="text-neutral-700 mb-4">
              Across STEa, Orbit, and my app work, the common thread is the same:
            </p>
            <ul className="list-disc list-inside space-y-1 text-neutral-700">
              <li>make complex work easier to reason about</li>
              <li>reduce risk without freezing progress</li>
              <li>design systems that reflect how people actually work</li>
            </ul>
            <p className="text-neutral-700 mt-4">
              No spin. No vanity metrics. Just tools that hold up when things get messy.
            </p>
            <p className="text-neutral-700 mt-3 font-semibold">
              Distinct systems. Clear decisions. Fewer surprises later.
            </p>
          </section>

          {/* CTA */}
          <section className="card p-6 mt-4">
            <h2 className="text-xl font-extrabold mb-2">Next step</h2>
            <p className="text-neutral-700 mb-3">
              Need an app shipped, analytics made reliable, or product bets sharpened?
            </p>
            <a className="btn btn-primary" href="mailto:hello@arcturusdc.com">
              Speak to us
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
