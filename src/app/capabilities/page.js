import Footer from "@/components/Footer";

export const metadata = { title: "Capabilities — Arcturus Digital Consultancy" };

export default function Capabilities() {
  return (
    <>
      {/* Global pill nav from your layout will stay, no Header duplication */}

      <main className="pb-10">
        {/* Hero */}
        <section className="card p-6 mt-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Capabilities</h1>
          <p className="mt-2 text-neutral-700">
            At Arcturus Digital Consultancy we focus on three things: building apps, making digital
            measurement reliable, and sharpening product strategy. Everything we do is outcome-first,
            practical, and grounded in solving real problems.
          </p>
        </section>

        {/* App development */}
        <section className="card p-6 mt-4">
          <h2 className="text-xl font-extrabold mb-2">App development</h2>
          <p className="text-neutral-700 mb-4">
            We design and build Android and iOS apps with privacy-first principles and a focus on niches
            where existing tools fall short. Instead of bloated, generic products, we create simple,
            purposeful apps that people actually use.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Focused</strong> — built around a single clear job-to-be-done.</li>
            <li><strong>Usable</strong> — clean interfaces without unnecessary complexity.</li>
            <li><strong>Compliant</strong> — designed to pass App Store and Google Play approvals smoothly.</li>
          </ul>
          <p className="text-neutral-700 mt-4">
            From early prototyping through to release and updates, we keep things lean and intentional.
            The result is software that makes a difference without demanding attention it doesn’t deserve.
          </p>
        </section>

        {/* Data & analytics */}
        <section className="card p-6 mt-4">
          <h2 className="text-xl font-extrabold mb-2">Data &amp; analytics</h2>
          <p className="text-neutral-700 mb-4">
            Measurement is only useful if it’s reliable and decision-ready. We make data work by stripping
            away vanity dashboards and focusing on instrumentation that proves outcomes.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Implementation &amp; audit</strong> — ensuring your analytics setup is clean, compliant, and accurate.</li>
            <li><strong>Frameworks</strong> — defining KPIs and event structures that map directly to business outcomes.</li>
            <li><strong>Reporting</strong> — building clarity into how data is surfaced, so teams can act on it.</li>
          </ul>
          <p className="text-neutral-700 mt-4">
            Every event, tag, and metric is designed with purpose — to answer the questions that matter,
            not to inflate a dashboard.
          </p>
        </section>

        {/* Product strategy */}
        <section className="card p-6 mt-4">
          <h2 className="text-xl font-extrabold mb-2">Product strategy</h2>
          <p className="text-neutral-700 mb-4">
            Great products don’t start with features, they start with outcomes. We help organisations cut
            through noise to find and deliver the next most valuable outcome, reducing wasted effort and
            surfacing opportunities faster.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Outcome-first planning</strong> — defining measurable signals that prove progress.</li>
            <li><strong>Opportunity sizing</strong> — quantifying upside and risk before committing resources.</li>
            <li><strong>Delivery alignment</strong> — ensuring regulatory, data, and technical realities are built in from day one.</li>
          </ul>
          <p className="text-neutral-700 mt-4">
            The emphasis is always on solving genuine problems in the simplest, most effective way.
          </p>
        </section>

        {/* CTA */}
        <section className="card p-6 mt-4">
          <h2 className="text-xl font-extrabold mb-2">Next step</h2>
          <p className="text-neutral-700 mb-3">
            Need an app shipped, analytics made reliable, or product bets sharpened?
          </p>
          <a className="btn btn-primary" href="mailto:hello@arcturusdc.com">Speak to us</a>
        </section>
      </main>

      <Footer />
    </>
  );
}
