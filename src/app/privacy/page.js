import ConsentTrigger from "@/components/ConsentTrigger";

export default function Page() {
  return (
    <main className="py-10">
      <h1 className="text-2xl font-extrabold">Privacy Policy</h1>
      <p className="text-muted mt-2">
        Effective date: <strong>1st September 2025</strong>
      </p>

      {/* Cookie preferences trigger (client button rendered inside a server page) */}
      <div className="mt-3">
        <ConsentTrigger className="text-red-700 hover:underline">
          Manage cookie preferences
        </ConsentTrigger>
      </div>

      <p className="mt-6 text-muted">
        Arcturus Digital Consultancy (“we”, “our”, “us”) respects your privacy and is
        committed to protecting your personal data. This policy explains how we
        collect, use, and safeguard information when you use our website and services.
      </p>

      <h2 className="mt-8 font-bold text-lg">Information we collect</h2>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>
          <strong>Information you provide directly</strong>: such as when you contact us by
          email or submit details through a form.
        </li>
        <li>
          <strong>Usage data</strong>: including pages visited, time spent, and navigation
          paths on our website.
        </li>
        <li>
          <strong>Technical data</strong>: such as browser type, operating system, and IP address.
        </li>
      </ul>

      <h2 className="mt-8 font-bold text-lg">How we use information</h2>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>Provide and improve our services</li>
        <li>Respond to enquiries</li>
        <li>Monitor and enhance the performance of our website</li>
        <li>Ensure compliance with legal and regulatory obligations</li>
      </ul>

      <h2 className="mt-8 font-bold text-lg">Use of Google Analytics</h2>
      <p className="text-muted mt-2">
        We use <strong>Google Analytics</strong> to understand how visitors interact with our site.
      </p>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>
          Google Analytics sets cookies to collect information such as your IP address, pages
          visited, time on site, and referring website.
        </li>
        <li>This information is aggregated and does not directly identify you.</li>
        <li>We use these insights to improve site performance, content, and user experience.</li>
        <li>
          You can opt out of Google Analytics tracking using{" "}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-700 hover:underline"
          >
            Google’s opt-out tool
          </a>.
        </li>
      </ul>

      <h2 className="mt-8 font-bold text-lg">Cookies</h2>
      <p className="text-muted mt-2">
        Our website uses cookies to enable basic functionality and collect analytics data for
        performance insights. You can control or disable cookies in your browser settings,
        though some site features may not function properly without them.
      </p>

      <h2 className="mt-8 font-bold text-lg">Data sharing</h2>
      <p className="text-muted mt-2">
        We do not sell, trade, or rent your personal data. We may share limited information with:
      </p>
      <ul className="list-disc ml-6 mt-2 text-muted space-y-1">
        <li>
          <strong>Service providers</strong> (such as Google) who process data on our behalf
          under strict agreements
        </li>
        <li>
          <strong>Legal authorities</strong> if required by law
        </li>
      </ul>

      <h2 className="mt-8 font-bold text-lg">Data retention</h2>
      <p className="text-muted mt-2">
        We only retain personal information for as long as necessary to fulfil the purposes
        outlined in this policy or comply with legal requirements.
      </p>

      <h2 className="mt-8 font-bold text-lg">Your rights</h2>
      <p className="text-muted mt-2">
        Depending on your location, you may have the right to access the personal data we hold
        about you, request corrections or deletion, object to or restrict processing, and
        withdraw consent (where applicable).
      </p>
      <p className="text-muted mt-2">
        To exercise your rights, contact us at{" "}
        <a href="mailto:info@arcturusdc.com" className="text-red-700 hover:underline">
          info@arcturusdc.com
        </a>.
      </p>

      <h2 className="mt-8 font-bold text-lg">Changes to this policy</h2>
      <p className="text-muted mt-2">
        We may update this Privacy Policy from time to time. Changes will be posted here with an
        updated effective date.
      </p>
    </main>
  );
}
